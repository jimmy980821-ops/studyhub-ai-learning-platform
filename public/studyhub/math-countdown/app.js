function makeProblem(value, difficulty, seed) {
  if (difficulty === "warmup") {
    const offset = 7 + (seed % 13);
    return seed % 2 === 0
      ? { expression: `${value + offset} − ${offset}`, hint: "先算減法" }
      : { expression: `${value * 3} ÷ 3`, hint: "先算除法" };
  }

  if (difficulty === "algebra") {
    if (value === 0) return { expression: "log₂(1)", hint: "2 的幾次方是 1？" };
    if (seed % 2 === 0) {
      return {
        expression: `x，2x + ${seed % 9 + 3} = ${value * 2 + (seed % 9 + 3)}`,
        hint: "解一元一次方程",
      };
    }
    return {
      expression: `√${value * value}`,
      hint: "取主平方根",
    };
  }

  if (seed % 2 === 0) {
    return {
      expression: `∫₀${value} 1 dx`,
      hint: "常數函數的定積分",
    };
  }
  return {
    expression: `lim(t→${value}) (t²−${value * value})/(t−${value}) ÷ 2`,
    hint: "先因式分解，再取極限",
  };
}


let difficulty='algebra',seed=1,values=[],revealed=[false,false,false,false],frozen=[false,false,false,false];
const cards=[...document.querySelectorAll('.count-card')],dateInput=document.querySelector('input[type="datetime-local"]');
try{dateInput.value=localStorage.getItem('studyhub-math-target')||'2027-01-22T08:00';}catch{}
function refresh(reset=false){
 const date=new Date(dateInput.value);if(!Number.isFinite(date.getTime())){dateInput.setCustomValidity('請輸入有效日期');return;}dateInput.setCustomValidity('');
 const seconds=Math.max(0,Math.floor((date.getTime()-Date.now())/1000));const next=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
 document.querySelector('.target-strip strong').textContent=new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(date);
 cards.forEach((card,i)=>{if(reset){revealed[i]=false;frozen[i]=false;card.querySelector('input').value='';card.className='count-card idle';}if(!frozen[i])values[i]=next[i];const problem=makeProblem(values[i],difficulty,seed+i);card.querySelector('.expression').textContent=problem.expression;card.querySelector('.hint-button').title=problem.hint;const result=card.querySelector('.answer-number');result.textContent=revealed[i]?values[i]:'?';result.classList.toggle('is-revealed',revealed[i]);card.querySelector('.reveal').textContent=revealed[i]?'隱藏答案':'我投降，看答案';});
}
cards.forEach((card,i)=>{
 const input=card.querySelector('input');input.addEventListener('focus',()=>frozen[i]=true);
 function check(){const valid=input.value.trim()!==''&&Number(input.value)===values[i];card.className='count-card '+(valid?'right':'wrong');if(valid)revealed[i]=true;refresh();}
 card.querySelector('.solve-row button').onclick=check;input.onkeydown=e=>{if(e.key==='Enter')check();};
 card.querySelector('.reveal').onclick=()=>{frozen[i]=true;revealed[i]=!revealed[i];refresh();};
 card.querySelector('.hint-button').onclick=()=>{let hint=card.querySelector('.visible-hint');if(!hint){hint=document.createElement('p');hint.className='visible-hint';hint.style.cssText='font-size:14px;padding:0 16px';card.append(hint);}hint.textContent=makeProblem(values[i],difficulty,seed+i).hint;};
});
document.querySelectorAll('.difficulty-picker button').forEach((b,i)=>b.onclick=()=>{difficulty=['warmup','algebra','calculus'][i];document.querySelectorAll('.difficulty-picker button').forEach(x=>x.classList.toggle('active',x===b));refresh(true);});
document.querySelector('.refresh-button').onclick=()=>{seed++;refresh(true);};
dateInput.onchange=()=>{try{localStorage.setItem('studyhub-math-target',dateInput.value);}catch{}refresh(true);};
const note=document.createElement('p');note.textContent='開始輸入後，該格題目會暫停倒數，避免驗算時數字改變；按「換一組題目」更新。';note.style.cssText='font-size:14px;line-height:1.8';document.querySelector('.target-strip').after(note);
refresh(true);setInterval(()=>refresh(),1000);
