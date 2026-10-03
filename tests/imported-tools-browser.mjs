import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve('public/studyhub'),prefix='/studyhub-ai-learning-platform/';
const server=createServer(async(req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p.startsWith(prefix))p=p.slice(prefix.length);else p=p.replace(/^\//,'');if(!p||p.endsWith('/'))p+='index.html';const file=resolve(root,p);if(!file.startsWith(root))throw Error();const data=await readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'})[extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('not found');}});
await new Promise(r=>server.listen(4183,'127.0.0.1',r));
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);const browser=await chromium.launch({channel:'msedge',headless:true});
const reports=[];
try{
 await mkdir('tmp/import-tools-review',{recursive:true});
 for(const route of ['learning-tools','bio-notes','physics-library','math-countdown','grade-radar','campus-schedule']){
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1')&&r.status()>=400)missing.push(r.url());});
  await page.goto('http://127.0.0.1:4183'+prefix+route+'/',{waitUntil:'load'});await page.waitForTimeout(1600);
  if(route==='learning-tools')assert.equal(await page.locator('.tool-card').count(),5);
  if(route==='bio-notes'){await page.locator('[onchange="showChapter(\'gene\')"]').check();assert.ok(await page.locator('#gene').isVisible());}
  if(route==='math-countdown'){await page.getByRole('button',{name:'暖身'}).click();assert.equal(await page.locator('.count-card').count(),4);await page.locator('.reveal').first().click();assert.notEqual(await page.locator('.answer-number').first().innerText(),'?');}
  if(route==='grade-radar'){await page.locator('#openSubjectModal').click();assert.equal(await page.locator('#subjectModal').isVisible(),true);await page.keyboard.press('Escape');}
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  await page.screenshot({path:'tmp/import-tools-review/'+route+'.png'});
  reports.push({route,errors,missing,overflow,title:await page.title()});await context.close();
 }
 console.log(JSON.stringify(reports,null,2));assert.ok(reports.every(r=>!r.errors.length&&!r.missing.length&&!r.overflow),'Imported route errors found');
}finally{await browser.close();server.close();}

