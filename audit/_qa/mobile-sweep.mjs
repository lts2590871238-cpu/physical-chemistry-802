import { chromium } from 'file:///C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const dir = 'D:/桌面/github/audit/_qa'
const base = 'http://127.0.0.1:4174/'
const context = await chromium.launchPersistentContext(`${dir}/edge-profile`, {
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--no-sandbox'],
})
const routes = ['/', ...Array.from({length: 9}, (_, i) => `/stage1?mod=M${i+1}`),
  ...['S2-E1','S2-E2','S2-M1','S2-M2','S2-H1','S2-H2'].map(id => `/stage2?set=${id}`),
  ...[2021,2022,2023].map(year => `/stage3?year=${year}`),
  '/prediction?paper=A', '/prediction?paper=B', '/mistakes', '/analytics']
try {
  let checked = 0
  for (const width of [320, 375, 390, 430, 1366, 1440, 1920]) {
    const paths = width === 320 || width === 390 ? routes : ['/stage1?mod=M6', '/prediction?paper=A']
    const page = await context.newPage()
    await page.setViewportSize({ width, height: 860 })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message.slice(0, 150)))
    for (const route of paths) {
      await page.goto(`${base}#${route}`)
      await page.locator('#root').waitFor({ timeout: 15000 })
      await page.waitForFunction(() => !document.querySelector('.loading'), { timeout: 15000 })
      await page.waitForTimeout(120)
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        offenders: [...document.querySelectorAll('body *')]
          .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 3 && getComputedStyle(el).position !== 'fixed' })
          .slice(0, 5).map((el) => `${el.closest('.qcard')?.id ?? 'page'}:${el.tagName.toLowerCase()}.${el.className?.baseVal ?? el.className}`.slice(0, 95)),
        figures: [...document.querySelectorAll('.q-fig img')].length,
      }))
      const currentErrors = errors.splice(0)
      checked++
      if (state.overflow || currentErrors.length) console.log(JSON.stringify({ width, route, ...state, errors: currentErrors }))
      if (width === 320 && route === '/prediction?paper=A') {
        const card = page.locator('#q-A-T04')
        await card.scrollIntoViewIfNeeded()
        await card.locator('button', { hasText: '我已在纸上作答' }).click()
        const image = card.locator('.sol-drawing img')
        await image.scrollIntoViewIfNeeded()
        await image.waitFor()
        console.log(JSON.stringify({ A_T04: await image.getAttribute('src'), loaded: await image.evaluate((e) => e.complete && e.naturalWidth > 0) }))
        await card.screenshot({ path: `${dir}/A-T04-320.png` })
        await card.locator('.sol-drawing-trigger').click()
        const modal = page.locator('.q-lightbox')
        await modal.waitFor()
        console.log(JSON.stringify({ modalFullImage: await modal.locator('img').evaluate((e) => e.getBoundingClientRect().right <= innerWidth + 1), modalOverflow: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) }))
        await modal.screenshot({ path: `${dir}/A-T04-modal-320.png` })
        await modal.getByRole('button', { name: '放大细节' }).click()
        console.log(JSON.stringify({ zoomable: await modal.locator('.q-lightbox-scroll').evaluate((e) => e.scrollWidth > e.clientWidth) }))
        await modal.getByRole('button', { name: '返回题目' }).click()
      }
    }
    await page.close()
  }
  console.log(JSON.stringify({ checked, widths: [320,375,390,430,1366,1440,1920] }))
} finally {
  await context.close()
}
