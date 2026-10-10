import { chromium } from '/tmp/claude-0/-home-user-nexus-cursor/23818a15-c2a0-58ad-967d-8552718fc8b0/scratchpad/qa-card/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const p=await b.newPage({viewport:{width:1800,height:900},deviceScaleFactor:2});
await p.goto('file://'+process.cwd()+'/explore.html');
await p.addStyleTag({content:'i.n{animation:none!important}'});
await p.screenshot({path:'alt-explore.png',fullPage:true});
await b.close();
