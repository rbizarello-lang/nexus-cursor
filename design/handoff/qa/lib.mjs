import { chromium } from 'playwright';
import fs from 'fs';
const D='/tmp/claude-0/-home-user-nexus-cursor/23818a15-c2a0-58ad-967d-8552718fc8b0/scratchpad/qa-card/cdn/node_modules/';
const map = {
 'react.production.min.js': D+'react/umd/react.production.min.js',
 'react-dom.production.min.js': D+'react-dom/umd/react-dom.production.min.js',
 'xlsx.full.min.js': D+'xlsx/dist/xlsx.full.min.js',
 'lz-string.min.js': D+'lz-string/libs/lz-string.min.js',
 'pako.min.js': D+'pako/dist/pako.min.js',
};
function fontCss(){
  let css='';
  for (const w of [400,500,600,700]) css+=`@font-face{font-family:'Geist';font-weight:${w};src:url(https://fonts.gstatic.com/geist-${w}.woff2) format('woff2');}`;
  for (const w of [400,500,600]) css+=`@font-face{font-family:'Geist Mono';font-weight:${w};src:url(https://fonts.gstatic.com/geistmono-${w}.woff2) format('woff2');}`;
  return css;
}
export async function launch(){
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  return b;
}
export async function setup(ctx){
  await ctx.route(/^https?:/, async route=>{
    const u=route.request().url();
    const f=u.split('/').pop().split('?')[0];
    if (map[f]) return route.fulfill({body:fs.readFileSync(map[f]),contentType:'application/javascript'});
    if (u.includes('fonts.googleapis.com')) return route.fulfill({body:fontCss(),contentType:'text/css'});
    let m=u.match(/geist-(\d+)\.woff2/); if(m) return route.fulfill({body:fs.readFileSync(D+`@fontsource/geist/files/geist-latin-${m[1]}-normal.woff2`),contentType:'font/woff2'});
    m=u.match(/geistmono-(\d+)\.woff2/); if(m) return route.fulfill({body:fs.readFileSync(D+`@fontsource/geist-mono/files/geist-mono-latin-${m[1]}-normal.woff2`),contentType:'font/woff2'});
    if (u.endsWith('.js')) return route.fulfill({body:'',contentType:'application/javascript'});
    return route.abort();
  });
}
