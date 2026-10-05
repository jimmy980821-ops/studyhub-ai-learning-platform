import {test} from 'node:test';
import assert from 'node:assert/strict';
import {titrationPH,bufferPH,pKa,ionizationModel} from '../public/studyhub/acid-base-notes/labs.mjs';
import {chapters,quiz} from '../public/studyhub/acid-base-notes/content.mjs';
test('acid-base equilibrium models agree with independent worked values',()=>{
  const near=(a,b,tol=.01)=>assert.ok(Math.abs(a-b)<tol,`${a} versus ${b}`);
  near(titrationPH(0,false),1);near(titrationPH(25,false),7);near(titrationPH(30,false),11.96);
  near(titrationPH(0,true),2.875);near(titrationPH(12.5,true),pKa);near(titrationPH(25,true),8.722);
  near(bufferPH(0),pKa);near(bufferPH(-1),4.658);near(bufferPH(1),4.832);
  for(const weak of [false,true]){let prev=-Infinity;for(let v=0;v<=50;v+=.1){const ph=titrationPH(v,weak);assert.ok(ph>=prev);prev=ph;}}
});
test('all original and added topics have valid exercises and unique identities',()=>{
  assert.equal(chapters.length,11);assert.equal(quiz.length,70);
  assert.equal(new Set(chapters.map(c=>c.id)).size,11);
  assert.equal(new Set(quiz.map(q=>q.id)).size,70);
  for(const c of chapters)assert.ok(quiz.filter(q=>q.chapter===c.id).length>=5);
  for(const q of quiz){assert.equal(q.options.length,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(q.explanation.trim());}
});
test('quadratic ionization model conserves acid and keeps Ka fixed during dilution',()=>{
  let lastH=0,lastFraction=1;
  for(let exponent=-5;exponent<=0;exponent+=.1){
    const c=10**exponent,m=ionizationModel(c);
    assert.ok(m.h>lastH);assert.ok(m.fraction<lastFraction);
    assert.ok(Math.abs(m.h*m.h/(c-m.h)/1.8e-5-1)<1e-10);
    assert.ok(m.h>0&&m.h<c);lastH=m.h;lastFraction=m.fraction;
  }
  assert.ok(Math.abs(ionizationModel(.1).ph-2.875)<.002);
  assert.ok(ionizationModel(1e-5).fraction>.7);
});
test('saved answer IDs 1–40 still refer to the original questions and choices',async()=>{
  const {readFile}=await import('node:fs/promises');
  const baseline=JSON.parse(await readFile(new URL('./fixtures/acid-base-original-questions.json',import.meta.url),'utf8'));
  assert.deepEqual(quiz.slice(0,40).map(({id,chapter,question,options,answer})=>({id,chapter,question,options,answer})),baseline);
});
