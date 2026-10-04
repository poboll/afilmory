/**
 * 构建后处理：photos-manifest.json 的大图/动效直链
 * raw.githubusercontent.com → jsDelivr CDN（国内可达性）
 * jsDelivr 分发上限 20MB：超限文件保留 raw 直链（回退）
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'apps/web/src/data/photos-manifest.json'
const RAW_BASE = 'https://raw.githubusercontent.com/poboll/gallery-photos/main/'
const JSD_BASE = 'https://cdn.jsdelivr.net/gh/poboll/gallery-photos@main/'
const LIMIT = 19 * 1024 * 1024

let manifest = readFileSync(FILE, 'utf8')
const urls = [...new Set([...manifest.matchAll(
  /https:\/\/raw\.githubusercontent\.com\/poboll\/gallery-photos\/main\/[^"]+/g,
)].map(m => m[0]))]

const results = await Promise.all(urls.map(async u => {
  try {
    const head = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
    const len = Number(head.headers.get('content-length') || 0)
    return { u, ok: head.ok && len > 0 && len <= LIMIT }
  } catch {
    return { u, ok: false }
  }
}))

let n = 0
for (const { u, ok } of results) {
  if (!ok) continue
  manifest = manifest.split(`"${u}"`).join(`"${u.replace(RAW_BASE, JSD_BASE)}"`)
  n++
}
writeFileSync(FILE, manifest)
console.log(`[rewrite-photo-urls] ${n}/${urls.length} 条直链已切 jsDelivr`)
