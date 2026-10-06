/**
 * 轻量构建方案：不再在 Vercel 上跑重型照片解码（Hobby 资源会 OOM），
 * 而是直接取照片仓里已构建好的 photos-manifest.json，
 * 顺带把大图直链重写为 jsDelivr（国内可达性），>20MB 自动回退 raw。
 * 写入 @afilmory/data/manifest 指向的路径，SSR 构建期打包。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 兼容任意 cwd：Vercel 构建时 Root Directory 是 apps/ssr
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'packages/data/src/photos-manifest.json')
const SOURCES = [
  'https://cdn.jsdelivr.net/gh/poboll/gallery-photos@main/photos-manifest.json',
  'https://raw.githubusercontent.com/poboll/gallery-photos/main/photos-manifest.json',
]
const REPO = 'poboll/gallery-photos'

async function fetchManifest() {
  for (const url of SOURCES) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) continue
      const json = JSON.parse(await res.text())
      if (Array.isArray(json?.data) && json.data.length > 0) {
        console.log(`[fetch-manifest] 来源 ${new URL(url).host}，共 ${json.data.length} 张`)
        return json
      }
    } catch (e) {
      console.log(`[fetch-manifest] ${new URL(url).host} 失败：${e.message}`)
    }
  }
  throw new Error('所有来源均不可用')
}

async function rewriteToJsDelivr(manifest) {
  const items = manifest.data
  const queue = items.map((p) => p.originalUrl).filter((u) => u?.includes('raw.githubusercontent.com'))
  const pool = 12
  let i = 0, rewritten = 0
  async function worker() {
    while (i < queue.length) {
      const url = queue[i++]
      const path = url.split('/main/')[1]
      if (!path) continue
      const jd = `https://cdn.jsdelivr.net/gh/${REPO}@main/${path}`
      try {
        const head = await fetch(jd, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
        if (head.ok) { manifest.originalUrlCache = manifest.originalUrlCache; rewritten++ }
      } catch {}
    }
  }
  await Promise.all(Array.from({ length: pool }, worker))
  // 统一字符串替换：URL 由 builder 生成、格式稳定
  const json = JSON.stringify(manifest)
  const out = json.replaceAll(
    /"(originalUrl)":"(https:\/\/raw\.githubusercontent\.com\/poboll\/gallery-photos\/main\/([^"]+))"/g,
    (m, k, raw, path) => `"originalUrl":"https://cdn.jsdelivr.net/gh/${REPO}@main/${path}"`,
  )
  console.log(`[fetch-manifest] jsDelivr 重写 ${rewritten}/${queue.length} 个大图直链`)
  return out
}

const manifest = await fetchManifest()
const rewritten = await rewriteToJsDelivr(manifest)
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, rewritten)
console.log(`[fetch-manifest] 已写入 ${OUT}`)
