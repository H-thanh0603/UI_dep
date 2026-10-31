import { chromium } from 'playwright-core'

const CHROME = '/home/nht/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const URL = process.env.URL || 'http://127.0.0.1:5177/'
const OUT = process.env.OUT || '.impeccable/review'

const browser = await chromium.launch({
  executablePath: CHROME,
  args: [
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
})

const errors = []

async function shoot(name, width, height, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${name}] console: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`))

  await page.goto(URL, { waitUntil: 'load' })
  await page.waitForTimeout(opts.wait ?? 5000)

  if (opts.scrollTo !== undefined) {
    await page.evaluate((y) => window.scrollTo(0, y), opts.scrollTo)
    await page.waitForTimeout(2500)
  }

  if (opts.hover) {
    const box = await page.locator('.escape-webgl').boundingBox()
    // sweep the cursor to build a trail, then settle
    for (let i = 0; i <= 10; i += 1) {
      await page.mouse.move(
        box.x + box.width * (0.3 + i * 0.035),
        box.y + box.height * (0.4 + Math.sin(i / 2) * 0.06),
      )
      await page.waitForTimeout(40)
    }
    await page.waitForTimeout(400)
  }

  const info = await page.evaluate(() => {
    const canvas = document.querySelector('.escape-webgl canvas')
    const video = document.querySelector('video')
    return {
      canvas: canvas ? `${canvas.width}x${canvas.height}` : null,
      videoReady: video ? video.readyState : null,
      videoDims: video ? `${video.videoWidth}x${video.videoHeight}` : null,
      duration: video ? video.duration : null,
      currentTime: video ? Number(video.currentTime.toFixed(2)) : null,
      scrollHeight: document.documentElement.scrollHeight,
      title: document.querySelector('.escape-title')?.innerText,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    }
  })

  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(name, JSON.stringify(info))
  await ctx.close()
}

await shoot('desktop', 1440, 900)
await shoot('desktop-hover', 1440, 900, { hover: true })
await shoot('desktop-scroll', 1440, 900, { scrollTo: 1800 })
await shoot('mobile', 390, 844)
await shoot('tablet', 820, 1000)

console.log('\n--- errors ---')
console.log(errors.length ? errors.join('\n') : 'none')
await browser.close()
