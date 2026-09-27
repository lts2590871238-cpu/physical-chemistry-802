import { chromium } from 'file:///C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
const ids=['2003-Q26','2004-Q11','2007-Q22','2008-Q33','2009-Q31','2010-Q30','2011-Q35','2013-Q27','2016-Q27','2021-Q32','A-T04']
const dir='D:/桌面/github/audit/_qa'
const context=await chromium.launchPersistentContext(`${dir}/answer-profile`,{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-sandbox']})
try{const page=await context.newPage();await page.setViewportSize({width:1500,height:1200});for(const id of ids){await page.goto(`http://127.0.0.1:4175/answer-diagrams/${id}-answer.svg`);const svg=page.locator('svg');await svg.waitFor();await svg.evaluate(el=>{const b=el.viewBox.baseVal;el.style.width=`${b.width}px`;el.style.height=`${b.height}px`});await svg.screenshot({path:`${dir}/${id}-answer.png`});console.log(id)}await page.close()}finally{await context.close()}
