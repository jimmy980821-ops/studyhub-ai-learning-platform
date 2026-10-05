import {test} from 'node:test';
import assert from 'node:assert/strict';
import {titrationPH,bufferPH,pKa} from '../public/studyhub/acid-base-notes/labs.mjs';
import {chapters,quiz} from '../public/studyhub/acid-base-notes/content.mjs';
test('acid-base equilibrium models agree with independent worked values',()=>{
  const near=(a,b,tol=.01)=>assert.ok(Math.abs(a-b)<tol,`${a} versus ${b}`);
  near(titrationPH(0,false),1);near(titrationPH(25,false),7);near(titrationPH(30,false),11.96);
  near(titrationPH(0,true),2.875);near(titrationPH(12.5,true),pKa);near(titrationPH(25,true),8.722);
  near(bufferPH(0),pKa);near(bufferPH(-1),4.658);near(bufferPH(1),4.832);
  for(const weak of [false,true]){let prev=-Infinity;for(let v=0;v<=50;v+=.1){const ph=titrationPH(v,weak);assert.ok(ph>=prev);prev=ph;}}
});
test('every topic has five valid exercises and no missing content',()=>{
  assert.equal(chapters.length,8);assert.equal(quiz.length,40);
  assert.equal(new Set(chapters.map(c=>c.id)).size,8);
  for(const c of chapters)assert.equal(quiz.filter(q=>q.chapter===c.id).length,5);
  for(const q of quiz){assert.equal(q.options.length,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(q.explanation.trim());}
});
