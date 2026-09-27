import { chromium } from 'file:///C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
const names = ['2003-Q26-phase','2004-Q11-phase','2005-Q29-phase','2009-Q11-phase','2010-Q30-phase','2011-Q35-phase','2016-Q27-phase','2017-Q17-phase','2017-Q25-figure','2021-Q32-phase','2023-Q10-phase','2023-Q13-figure','2024-Q31-figure','2024-Q32-phase','2025-Q04-figure','2026-Q08-phase','2026-Q36-phase']
const dir='D:/桌面/github/audit/_qa'
const context=await chromium.launchPersistentContext(`${dir}/vector-profile`,{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']})
try {
  const page=await context.newPage()
  await page.setViewportSize({width:1500,height:1000})
  for(const name of names){
    await page.goto(`http://127.0.0.1:4175/redrawn-diagrams/${name}.svg`)
    const svg=page.locator('svg')
    await svg.waitFor()
    await svg.evaluate(el=>{const b=el.viewBox.baseVal;el.style.width=`${b.width}px`;el.style.height=`${b.height}px`})
    await svg.screenshot({path:`${dir}/${name}.png`})
    console.log(name)
  }
  await page.close()
}finally{await context.close()}
