import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'

const CHROME = '/home/nht/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:5177/', { waitUntil: 'load' })
await page.waitForTimeout(3500)

const fs = await import('node:fs')
const clip = { x: 420, y: 250, width: 440, height: 330 }
const save = async (k) => {
  const buf = await page.screenshot({ clip })
  fs.writeFileSync(`.impeccable/review/knee-${k}.png`, buf)
}

// force hover on and put a fresh trail point in the middle
await page.evaluate(() => window.__escapeForce(1))
const box = await page.locator('.escape-webgl').boundingBox()
await page.mouse.move(box.x + 640, box.y + 415)
await page.waitForTimeout(2500)
await save('still')

// now sweep to see the trail read as a wake
for (let i = 0; i < 30; i += 1) {
  await page.mouse.move(box.x + 560 + i * 6, box.y + 415 + Math.sin(i / 4) * 22)
  await page.waitForTimeout(30)
}
await page.waitForTimeout(200)
await save('sweep')
await browser.close()
