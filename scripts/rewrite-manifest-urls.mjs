/**
 * 构建后处理：photos-manifest.json 的大图直链
 * raw.githubusercontent.com → jsDelivr CDN（国内可达性更好）
 * jsDelivr 分发上限 20MB：超限文件保留 raw 直链（回退）
 */
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'apps/web/src/data/photos-manifest.json'
const REPO = 'poboll/gallery-photos'
let manifest = readFileSync(FILE, 'utf8')

const urls = [...manifest.matchAll(
  /"(originalUrl)":"(https:\/\/raw\.githubusercontent\.com\/poboll\/gallery-photos\/main\/([^"]+))"/g,
)]
let rewritten = 0
const results = await Promise.all(urls.map(async ([, , url]) => {
  const jd = `https://cdn.jsdelivr.net/gh/${REPO}@main/${url.split('/main/')[1]}`
  try {
    const head = await fetch(jd, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
    return head.ok ? { url, jd } : null
  } catch {
    return null
  }
}))
for (const r of results) {
  if (!r) continue
  manifest = manifest.replace(`"originalUrl":"${r.url}"`, `"originalUrl":"${r.jd}"`)
  rewritten++
}
writeFileSync(FILE, manifest)
console.log(`[rewrite-urls] jsDelivr 重写 ${rewritten}/${urls.length} 张大图`)
