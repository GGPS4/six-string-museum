/* Wings F–K: Guitar Teacher, Chord Tarot, Wood Library, Fretboard Speedrun, Family Tree, Neck Hospital */
(()=>{
const S=window.SSM;if(!S)return;
const {$,$$,esc,store,Snd,OPEN,strum,drawGuitar,WOODS,Data}=S;
const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const FULL=['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'];
const STR=['low E','A','D','G','B','high E'];
const rigClean=()=>({guitar:S.getGuitar(),chain:[],amp:S.cleanAmp()});
const rigDirty=()=>({guitar:S.getGuitar(),chain:[S.mkPedal('od',{drive:.6,tone:.55})],amp:{model:'crunch',gain:.35,tone:.55,volume:.75}});
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

/* ---------- Diagrams ---------- */
function drawChord(frets,opts={}){
  const played=frets.filter(f=>f!=null&&f>0),max=played.length?Math.max(...played):0,min=played.length?Math.min(...played):0;
  const base=max>5?min:1,L=16,T=26,sp=13,fh=17,rows=5,W=L*2+sp*5,H=T+rows*fh+8;
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.name||'chord')} chord diagram">`;
  for(let i=0;i<6;i++)g+=`<line x1="${L+i*sp}" x2="${L+i*sp}" y1="${T}" y2="${T+rows*fh}" style="stroke:currentColor" stroke-width="1" opacity=".75"/>`;
  for(let r=0;r<=rows;r++)g+=`<line x1="${L}" x2="${L+5*sp}" y1="${T+r*fh}" y2="${T+r*fh}" style="stroke:currentColor" stroke-width="${r===0&&base===1?4:1}" opacity="${r===0&&base===1?1:.6}"/>`;
  if(base>1)g+=`<text x="${L-4}" y="${T+fh*.7}" text-anchor="end" font-size="9" style="fill:currentColor" font-family="monospace">${base}</text>`;
  frets.forEach((f,i)=>{const x=L+i*sp;
    if(f==null)g+=`<text x="${x}" y="${T-8}" text-anchor="middle" font-size="10" style="fill:currentColor" font-family="monospace">×</text>`;
    else if(f===0)g+=`<circle cx="${x}" cy="${T-11}" r="3.6" fill="none" style="stroke:currentColor" stroke-width="1.2"/>`;
    else g+=`<circle cx="${x}" cy="${T+(f-base+.5)*fh}" r="5.4" style="fill:currentColor"/>`});
  return g+'</svg>';
}
function drawFretboard(o={}){
  const F=o.frets||12,W=780,left=56,cw=(W-left-12)/F,rowH=30,T=16,H=T+6*rowH+26,y=s=>T+(5-s)*rowH+rowH/2,fx=f=>f===0?left-20:left+(f-.5)*cw;
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fretboard diagram">`;
  g+=`<rect x="${left}" y="${T}" width="${W-left-12}" height="${6*rowH}" style="fill:var(--panel2)"/>`;
  [3,5,7,9,15,17,19,21].filter(n=>n<=F).forEach(n=>g+=`<circle cx="${left+(n-.5)*cw}" cy="${T+3*rowH}" r="5" style="fill:var(--line)"/>`);
  if(F>=12)g+=`<circle cx="${left+11.5*cw}" cy="${T+2*rowH}" r="5" style="fill:var(--line)"/><circle cx="${left+11.5*cw}" cy="${T+4*rowH}" r="5" style="fill:var(--line)"/>`;
  for(let n=0;n<=F;n++){const x=left+n*cw;g+=`<line x1="${x}" x2="${x}" y1="${T}" y2="${T+6*rowH}" style="stroke:${n===0?'var(--ink)':'var(--nickel)'}" stroke-width="${n===0?5:1.5}"/>`;
    if(n>0)g+=`<text x="${left+(n-.5)*cw}" y="${H-6}" text-anchor="middle" font-size="11" font-family="monospace" style="fill:var(--muted)">${n}</text>`}
  for(let s=0;s<6;s++){const dim=o.only&&!o.only.includes(s);g+=`<line x1="${left}" x2="${W-12}" y1="${y(s)}" y2="${y(s)}" style="stroke:var(--ink)" stroke-width="${(2.4-s*.3).toFixed(1)}" opacity="${dim?.2:.8}"/><text x="4" y="${y(s)+4}" font-size="11" font-family="monospace" style="fill:var(--muted)">${['E','A','D','G','B','e'][s]}</text>`}
  if(o.clickable){for(let s=0;s<6;s++){if(o.only&&!o.only.includes(s))continue;for(let f=0;f<=F;f++){const x=f===0?left-40:left+(f-1)*cw;const w=f===0?38:cw;
    g+=`<g class="fb-cell" data-s="${s}" data-f="${f}" tabindex="0" role="button" aria-label="${STR[s]} string, fret ${f}"><rect x="${x}" y="${y(s)-rowH/2}" width="${w}" height="${rowH}" fill="transparent" rx="4"/></g>`}}}
  for(const [s,f,lab,tone] of o.marks||[]){const c=tone==='bad'?'var(--bad)':tone==='good'?'var(--good)':'var(--amber)';
    g+=`<circle cx="${fx(f)}" cy="${y(s)}" r="12" style="fill:${c}" pointer-events="none"/><text x="${fx(f)}" y="${y(s)+4}" text-anchor="middle" font-size="${String(lab).length>2?8:10.5}" font-family="monospace" font-weight="600" style="fill:var(--amber-ink)" pointer-events="none">${esc(lab)}</text>`}
  return g+'</svg>';
}
S.drawChord=drawChord;S.drawFretboard=drawFretboard;

/* ---------- Wing F: Guitar Teacher ---------- */
const LESSONS=window.SSM_LESSONS||[],UNITS=window.SSM_UNITS||[];
let tp=Object.assign({cur:0,done:[]},store.get('ssm.teacher',{}));if(!Array.isArray(tp.done))tp.done=[];
const saveT=()=>store.set('ssm.teacher',tp);
function exEvents(ex){
  const b=60/(ex.tempo||100),ev=[];
  const one=(x,t0)=>{
    if(x.notes)x.notes.forEach(([s,f],i)=>ev.push({t:t0+i*b/2,s,midi:OPEN[s]+f,v:.85}));
    if(x.together)x.together.forEach(([s,f],i)=>ev.push({t:t0+i*.02,s,midi:OPEN[s]+f,v:.8}));
    if(x.chord&&!x.pattern)ev.push(...strum(t0,x.chord,0,.9));
    if(x.prog)x.prog.forEach((c,i)=>ev.push(...strum(t0+i*b*2,c,0,.9)));
    if(x.rhythm){let t=t0;x.rhythm.forEach(d=>{ev.push({t,s:1,midi:45,v:.8,dur:d*b*.9});t+=d*b})}
    if(x.pattern){[[0,0],[1,0],[1.5,1],[2.5,1],[3,0],[3.5,1]].forEach(([beat,up])=>{for(const bar of [0,4])ev.push(...strum(t0+(bar+beat)*b,x.chord,up,up?.6:.85))})}
    if(x.harm)x.harm.forEach(([s,f],i)=>ev.push({t:t0+i*1.1,s:i,midi:OPEN[s]+f,v:.55}));
    if(x.seq)x.seq.forEach((y,i)=>one(y,t0+i*1.3));
  };one(ex,0);return ev.sort((a,c)=>a.t-c.t);
}
function renderSyllabus(){
  let h='';LESSONS.forEach((l,i)=>{if(i%10===0)h+=`<div class="unit">Unit ${i/10+1} · ${esc(UNITS[i/10]||'')}</div>`;
    h+=`<button type="button" data-l="${i}" aria-current="${i===tp.cur}"><span class="n">${String(i+1).padStart(2,'0')}</span><span>${esc(l.t)}</span><span class="done" aria-label="${tp.done.includes(i)?'complete':''}">${tp.done.includes(i)?'✓':''}</span></button>`});
  $('#syllabus').innerHTML=h;
}
$('#syllabus').addEventListener('click',e=>{const b=e.target.closest('[data-l]');if(!b)return;tp.cur=+b.dataset.l;saveT();renderTeacher();$('#lesson').scrollIntoView({behavior:'smooth',block:'start'})});
let tAnswer=null;
function renderLesson(){
  const i=tp.cur,l=LESSONS[i];if(!l)return;const done=tp.done.length;
  let h=`<div style="display:grid;gap:8px"><div class="row" style="justify-content:space-between"><p class="eyebrow">Lesson ${i+1} of ${LESSONS.length} · Unit ${Math.floor(i/10)+1}: ${esc(UNITS[Math.floor(i/10)]||'')}</p><p class="score">${done} of ${LESSONS.length} complete</p></div><div class="progress"><i style="width:${done/LESSONS.length*100}%"></i></div></div>
  <h2>${esc(l.t)}</h2><div class="body">${l.body}</div>`;
  if(l.ex)h+=`<div class="row">${l.ex.map((x,k)=>`<button class="btn${k?' ghost':''}" type="button" data-ex="${k}">▶ ${esc(x.label)}</button>`).join('')}<button class="btn ghost" type="button" data-tstop>Stop</button></div>`;
  if(l.chords)h+=`<div class="chordrow">${l.chords.map(([n,f],k)=>`<button type="button" class="chordfig" data-ch="${k}" style="all:unset;cursor:pointer;display:grid;justify-items:center;gap:2px;font-family:var(--f-mono);font-size:13px;color:var(--ink)" aria-label="Play ${esc(n)}">${drawChord(f,{name:n})}<span>${esc(n)}</span></button>`).join('')}</div>`;
  if(l.fb)h+=`<div class="fbwrap">${drawFretboard({frets:l.fb.frets||12,marks:l.fb.marks})}</div>`;
  const q=l.q;
  h+=`<div class="quiz"><p class="lbl">Check yourself</p><p style="font-size:19px">${esc(q.q)}</p>${q.a.map((a,k)=>{let cls='';if(tAnswer!=null){if(k===q.c&&tAnswer===q.c)cls=' right';else if(k===tAnswer&&k!==q.c)cls=' wrong'}
    return `<button class="choice${cls}" type="button" data-qa="${k}" ${tAnswer===q.c?'disabled':''}><b>${esc(a)}</b></button>`}).join('')}
    ${tAnswer!=null?`<div class="verdict"><p><strong>${tAnswer===q.c?'Correct.':'Not quite. Try another answer.'}</strong> ${tAnswer===q.c?esc(q.why):''}</p></div>`:''}</div>
  <div class="row"><button class="btn ghost" type="button" data-nav="-1" ${i===0?'disabled':''}>Previous lesson</button><button class="btn" type="button" data-nav="1" ${i===LESSONS.length-1?'disabled':''}>Next lesson</button></div>`;
  const el=$('#lesson');el.innerHTML=h;
  $$('[data-ex]',el).forEach(b=>b.addEventListener('click',()=>{const x=l.ex[+b.dataset.ex];Snd.play(x.dirty?rigDirty():rigClean(),exEvents(x))}));
  $$('[data-ch]',el).forEach(b=>b.addEventListener('click',()=>Snd.play(rigClean(),strum(0,l.chords[+b.dataset.ch][1],0,.9))));
  const ts=$('[data-tstop]',el);if(ts)ts.addEventListener('click',()=>Snd.stopAll());
  $$('[data-qa]',el).forEach(b=>b.addEventListener('click',()=>{tAnswer=+b.dataset.qa;if(tAnswer===q.c&&!tp.done.includes(i)){tp.done.push(i);saveT();renderSyllabus();document.dispatchEvent(new CustomEvent('ssm:lesson',{detail:{cur:tp.cur,done:tp.done.slice()}}))}renderLesson()}));
  $$('[data-nav]',el).forEach(b=>b.addEventListener('click',()=>{tp.cur=Math.max(0,Math.min(LESSONS.length-1,i+ +b.dataset.nav));saveT();renderTeacher();el.scrollIntoView({behavior:'smooth',block:'start'})}));
}
function renderTeacher(){tAnswer=tp.done.includes(tp.cur)?LESSONS[tp.cur].q.c:null;renderSyllabus();renderLesson();document.dispatchEvent(new CustomEvent('ssm:lesson',{detail:{cur:tp.cur,done:tp.done.slice()}}))}
renderTeacher();

/* ---------- Wing G: Chord Tarot ---------- */
const CARDS=[
 {c:'C',root:0,q:'maj',f:[null,3,2,0,1,0],title:'The Home',m:'Rest and belonging. Whatever is happening, there is a place to come back to.'},
 {c:'G',root:7,q:'maj',f:[3,2,0,0,0,3],title:'The Open Road',m:'Wide, bright and ringing. A journey is starting, and the way is clear.'},
 {c:'D',root:2,q:'maj',f:[null,null,0,2,3,2],title:'The Bright Door',m:'High and hopeful. An invitation is on its way; answer it.'},
 {c:'A',root:9,q:'maj',f:[null,0,2,2,2,0],title:'The Sunrise',m:'A fresh start with energy behind it. Say yes early in the day.'},
 {c:'E',root:4,q:'maj',f:[0,2,2,1,0,0],title:'The Engine',m:'Every string rings. Momentum is on your side, so keep moving.'},
 {c:'F',root:5,q:'maj',f:[1,3,3,2,1,1],title:'The Barre',m:'A hard stretch that gets easier with practice. The effort is the point.'},
 {c:'Am',root:9,q:'min',f:[null,0,2,2,1,0],title:'The Quiet Room',m:'Reflection and a little longing. Sit with a feeling before you act on it.'},
 {c:'Em',root:4,q:'min',f:[0,2,2,0,0,0],title:'The Tide',m:'Deep and rolling. Something is shifting under the surface.'},
 {c:'Dm',root:2,q:'min',f:[null,null,0,2,3,1],title:'The Letter',m:'Something unsaid wants to be written down. Send it.'},
 {c:'Bm',root:11,q:'min',f:[null,2,4,4,3,2],title:'The Climb',m:'Harder than it looks and worth it. Grip steady and keep going.'},
 {c:'E7',root:4,q:'maj',f:[0,2,0,1,0,0],title:'The Question',m:'Tension that wants an answer. The next move will resolve it.'},
 {c:'A7',root:9,q:'maj',f:[null,0,2,0,2,0],title:'The Crossroads',m:'A bluesy pull in two directions. Both paths lead somewhere good.'},
 {c:'G7',root:7,q:'maj',f:[3,2,0,0,0,1],title:'The Messenger',m:'News arrives that points you home. Follow it.'},
 {c:'Cmaj7',root:0,q:'maj',f:[null,3,2,0,0,0],title:'The Daydream',m:'Soft focus and good ideas. Write down what you imagine today.'},
 {c:'Fmaj7',root:5,q:'maj',f:[null,null,3,2,1,0],title:'The Window Seat',m:'Watch the world go by. Patience brings a better view.'},
 {c:'Asus2',root:9,q:'sus',f:[null,0,2,2,0,0],title:'The Held Breath',m:'Neither happy nor sad, just waiting. The answer is almost here.'}
];
const KEYN=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
const DIAT=[[0,'maj','I'],[2,'min','ii'],[4,'min','iii'],[5,'maj','IV'],[7,'maj','V'],[9,'min','vi']];
let spread=[];
function tarotDraw(){spread=shuffle(CARDS).slice(0,3);const el=$('#spread');const pos=['Past','Present','Future'];
  el.innerHTML=spread.map((c,i)=>`<div class="tcard"><p class="pos">${pos[i]}</p><p class="title">${esc(c.title)}</p>${drawChord(c.f,{name:c.c})}<p class="cname">${esc(c.c)}</p><p>${esc(c.m)}</p></div>`).join('');
  const fits=[];for(let k=0;k<12;k++){const nums=spread.map(c=>{if(c.q==='sus')return'sus';const d=DIAT.find(([o,q])=>(k+o)%12===c.root&&q===c.q);return d?d[2]:null});if(nums.every(n=>n))fits.push([k,nums])}
  const r=$('#tarotReading');r.hidden=false;
  if(fits.length){const [k,nums]=fits.find(([k])=>k===spread[0].root)||fits[0];const others=fits.filter(([x])=>x!==k).map(([x])=>KEYN[x]+' major');
    r.innerHTML=`<p><strong>Your reading is in the key of ${KEYN[k]} major.</strong> The cards play as ${nums.map(n=>n==='sus'?'a suspended chord':n).join(', ')} there. ${others.length?`It would also fit ${esc(others.join(' or '))}.`:''} A spread in one key points to a settled path.</p>`}
  else r.innerHTML=`<p><strong>No single major key holds all three cards.</strong> Your reading changes key partway through, which means a change of scenery is coming. Play it and listen for the moment it shifts.</p>`;
  $('#tarotPlay').disabled=false;document.dispatchEvent(new CustomEvent('ssm:tarot',{detail:spread}));
}
$('#tarotDraw').addEventListener('click',()=>{tarotDraw();Snd.play(rigClean(),[{t:0,s:5,midi:76,v:.4},{t:.12,s:4,midi:71,v:.4},{t:.24,s:3,midi:67,v:.4}])});
$('#tarotPlay').addEventListener('click',()=>{if(!spread.length)return;const b=60/84,ev=[];spread.forEach((c,i)=>{ev.push(...strum(i*b*4,c.f,0,.9),...strum(i*b*4+b*2,c.f,0,.7),...strum(i*b*4+b*3,c.f,1,.55))});ev.push(...strum(12*b,spread[2].f,0,.9));
  Snd.play({guitar:S.getGuitar(),chain:[S.mkPedal('reverb',{size:2.5,mix:.35})],amp:S.cleanAmp()},ev)});
$('#spread').innerHTML=[0,1,2].map(()=>`<div class="tcard back" aria-hidden="true"><span>✦</span></div>`).join('');

/* ---------- Wing H: Wood Library ---------- */
const grain=w=>`repeating-linear-gradient(94deg,${w.grain[0]} 0 5px,${w.grain[1]} 5px 7px,${w.grain[0]} 7px 15px,${w.grain[1]} 15px 16px,${w.grain[0]} 16px 24px),linear-gradient(180deg,${w.grain[0]},${w.grain[1]})`;
const woodKeys=Object.keys(WOODS);let openWood=null;
function woodGuitar(k){const g=Object.assign({},S.getGuitar(),{wood:k});if(k==='spruce'||k==='cedar'){g.body='dread';g.pickup='piezo'}else if(g.body==='dread'){g.body='double';g.pickup='single'}return g}
function playWood(k,riff){const g=woodGuitar(k);Snd.play({guitar:g,chain:[],amp:{model:g.body==='dread'?'direct':'clean',gain:.12,tone:.6,volume:.8}},riff())}
const woodRiff=()=>{const r=$('#woodRiff').value;
  if(r==='campfire'){const ev=[];[[3,2,0,0,0,3],[null,3,2,0,1,0],[null,null,0,2,3,2],[3,2,0,0,0,3]].forEach((c,i)=>ev.push(...strum(i*1.4,c,0,.9),...strum(i*1.4+.7,c,1,.6)));return ev}
  if(r==='ring')return strum(0,[0,2,2,1,0,0],0,1);
  return [[0,0],[1,2],[2,2],[3,1],[4,0],[5,0],[4,0],[3,1]].map(([s,f],i)=>({t:i*.28,s,midi:OPEN[s]+f,v:.85}))};
function renderWoods(){
  $('#drawers').innerHTML=woodKeys.map(k=>{const w=WOODS[k];return `<button class="drawer" type="button" data-wood="${k}" aria-expanded="${openWood===k}"><span class="grain" style="background:${grain(w)}"></span><span class="lbl2"><b>${esc(w.label)}</b><span class="mono">≈ ${w.density} kg/m³</span></span></button>`}).join('');
  const d=$('#woodDetail');if(!openWood){d.innerHTML='';return}const w=WOODS[openWood];
  const sus=Math.round(Math.max(0,Math.min(1,(.0046-w.loss)/.002))*100),bri=Math.round(Math.max(0,Math.min(1,(.5-w.s)/.07))*100),den=Math.round(w.density/900*100);
  d.innerHTML=`<div class="panel woodcard"><div class="grain" style="background:${grain(w)}"></div><div style="display:grid;gap:10px"><h3>${esc(w.label)}</h3><p>${esc(w.note)}.</p>
    <dl class="specs"><dt>Grows in</dt><dd>${esc(w.origin)}</dd><dt>Used for</dt><dd>${esc(w.uses)}</dd><dt>Density</dt><dd>≈ ${w.density} kg/m³</dd></dl>
    <div class="meter"><span>Density</span><span class="bar"><i style="width:${den}%"></i></span><span>${den}</span></div>
    <div class="meter"><span>Sustain</span><span class="bar"><i style="width:${sus}%"></i></span><span>${sus}</span></div>
    <div class="meter"><span>Brightness</span><span class="bar"><i style="width:${bri}%"></i></span><span>${bri}</span></div>
    <p class="msg">Sustain and brightness are the museum's own 0–100 scores for how this wood is modeled here, not lab measurements.</p>
    <div class="row"><button class="btn" type="button" id="woodListen">Hear ${esc(w.label.toLowerCase())}</button><button class="btn ghost" type="button" id="woodUse">Use it in my workshop build</button></div></div></div>`;
  $('#woodListen').addEventListener('click',()=>playWood(openWood,woodRiff));
  $('#woodUse').addEventListener('click',()=>{const g=S.getGuitar();Object.assign(g,woodGuitar(openWood));store.set('ssm.guitar',g);S.showWing('workshop',true);document.dispatchEvent(new Event('ssm:guitar'))});
}
$('#drawers').addEventListener('click',e=>{const b=e.target.closest('[data-wood]');if(!b)return;openWood=openWood===b.dataset.wood?null:b.dataset.wood;renderWoods();if(openWood)$('#woodDetail').scrollIntoView({behavior:'smooth',block:'nearest'})});
const wopts=woodKeys.map(k=>`<option value="${k}">${esc(WOODS[k].label)}</option>`).join('');$('#woodA').innerHTML=wopts;$('#woodB').innerHTML=wopts;$('#woodA').value='mahogany';$('#woodB').value='maple';
$('#woodRiff').innerHTML='<option value="arp">Open-string arpeggio</option><option value="campfire">Campfire strum</option><option value="ring">One ringing E chord</option>';
$('#woodPlayA').addEventListener('click',()=>playWood($('#woodA').value,woodRiff));$('#woodPlayB').addEventListener('click',()=>playWood($('#woodB').value,woodRiff));
renderWoods();

/* ---------- Wing I: Fretboard Speedrun ---------- */
let sr={on:false,targets:[],i:0,t0:0,pen:0,raf:0,flash:null};let scores=[];
$('#srName').value=store.get('ssm.srname','');
const srStrings=()=>{const v=$('#srString').value;return v==='all'?[0,1,2,3,4,5]:[+v]};
function srDraw(){const marks=sr.flash?[sr.flash]:[];$('#srBoard').innerHTML=drawFretboard({frets:12,clickable:true,only:srStrings(),marks})}
function srTick(){if(!sr.on)return;$('#srClock').textContent=((performance.now()-sr.t0)/1000+sr.pen).toFixed(2);sr.raf=requestAnimationFrame(srTick)}
function srPrompt(){const t=sr.targets[sr.i];$('#srPrompt').textContent=`${FULL[t.pc]} on ${STR[t.s]}`;$('#srCount').textContent=`Note ${sr.i+1} of ${sr.targets.length}`}
$('#srStart').addEventListener('click',()=>{const strs=srStrings();let last=-1;sr.targets=Array.from({length:20},()=>{let pc;do{pc=Math.floor(Math.random()*12)}while(pc===last);last=pc;return{s:strs[Math.floor(Math.random()*strs.length)],pc}});
  sr.i=0;sr.pen=0;sr.on=true;sr.flash=null;sr.t0=performance.now();$('#srMsg').textContent='';$('#srStart').textContent='Restart';srDraw();srPrompt();cancelAnimationFrame(sr.raf);srTick()});
$('#srString').addEventListener('change',()=>{sr.on=false;cancelAnimationFrame(sr.raf);$('#srPrompt').textContent='Ready?';$('#srCount').textContent='Press start';$('#srClock').textContent='0.00';sr.flash=null;srDraw();renderScores()});
function srHit(s,f){if(!sr.on)return;const t=sr.targets[sr.i],pc=(OPEN[s]+f)%12;
  Snd.play(rigClean(),[{t:0,s,midi:OPEN[s]+f,v:.8}]);
  if(s===t.s&&pc===t.pc){sr.flash=[s,f,NAMES[pc],'good'];sr.i++;if(sr.i>=sr.targets.length)return srFinish();srPrompt()}
  else{sr.pen+=2;sr.flash=[s,f,NAMES[pc],'bad'];$('#srMsg').className='msg err';$('#srMsg').textContent=`That was ${FULL[pc]} on the ${STR[s]} string. +2 seconds.`}
  srDraw()}
$('#srBoard').addEventListener('click',e=>{const c=e.target.closest('.fb-cell');if(c)srHit(+c.dataset.s,+c.dataset.f)});
$('#srBoard').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const c=e.target.closest('.fb-cell');if(c){e.preventDefault();srHit(+c.dataset.s,+c.dataset.f)}});
async function srFinish(){sr.on=false;cancelAnimationFrame(sr.raf);const time=+((performance.now()-sr.t0)/1000+sr.pen).toFixed(2);$('#srClock').textContent=time.toFixed(2);
  $('#srPrompt').textContent='Finished';$('#srCount').textContent=`${time.toFixed(2)} seconds, including ${sr.pen} penalty seconds`;srDraw();
  const name=($('#srName').value.trim()||'Anonymous').slice(0,16);store.set('ssm.srname',$('#srName').value.trim());
  try{await Data.add('scores',{name,string:$('#srString').value,time,createdAt:Date.now(),by:S.me||null});$('#srMsg').className='msg ok';$('#srMsg').textContent='Your time is on the leaderboard.'}
  catch(err){$('#srMsg').className='msg err';$('#srMsg').textContent=err&&err.code==='invalid_argument'?'Your access level lets you play but not post scores. Ask the owner for Contributor access.':'Your time couldn’t be saved. Try again in a moment.'}}
function renderScores(){const v=$('#srString').value,label=$('#srString').selectedOptions[0].textContent;$('#srBoardTitle').textContent=`Leaderboard · ${label}`;
  const top=scores.filter(x=>String(x.string)===v&&typeof x.time==='number').sort((a,b)=>a.time-b.time).slice(0,10);
  $('#srLeaders').innerHTML=top.length?`<ol>${top.map((x,i)=>`<li><span>${i+1}</span><span>${esc(x.name)}</span><span>${x.time.toFixed(2)} s</span></li>`).join('')}</ol>`:'<p class="msg">No times yet for this string. Set the first one.</p>'}
Data.sub('scores',v=>{scores=v||[];renderScores()});
srDraw();renderScores();

/* ---------- Wing J: Family Tree ---------- */
const LANES=['Lutes and ancestors','Spanish and classical','Steel-string acoustic','Archtop and hollow electric','Solid-body electric'];
const TREE=[
 {id:'oud',n:'Oud',y:700,yl:'By the 700s',l:0,p:[],d:'A fretless, short-necked, pear-shaped instrument central to music across the Middle East and North Africa. Its body shape and plucked strings are the root of the lute family.'},
 {id:'gittern',n:'Gittern',y:1250,yl:'c. 1200s',l:1,p:['oud'],d:'A small, round-backed plucked instrument popular in medieval Europe. It is often treated as an early relative of the guitar, though its exact lineage is debated.'},
 {id:'lute',n:'European lute',y:1300,yl:'c. 1300s',l:0,p:['oud'],d:'The oud arrived in Europe and gained frets. The lute became the leading instrument of Renaissance music, with many paired strings called courses.'},
 {id:'vihuela',n:'Vihuela',y:1480,yl:'1400s–1500s',l:1,p:['gittern'],d:'A Spanish instrument with a flat back and a waisted, guitar-like body, tuned much like a lute. Much of the earliest printed guitar-style music was written for it.'},
 {id:'four',n:'Four-course guitar',y:1550,yl:'1500s',l:1,p:['vihuela'],d:'A small Renaissance guitar with four courses of strings. It was cheaper and simpler than the lute and spread widely as a popular instrument.'},
 {id:'baroque',n:'Baroque five-course guitar',y:1620,yl:'1600s',l:1,p:['four'],d:'A fifth course was added, and strummed chord accompaniment became common. It was fashionable in Spain, Italy and France.'},
 {id:'six',n:'Early six-string guitar',y:1790,yl:'Late 1700s',l:1,p:['baroque'],d:'Paired courses gave way to six single strings, the setup guitars still use today.'},
 {id:'parlor',n:'Parlor guitar',y:1840,yl:'1800s',l:2,p:['six'],d:'Small-bodied guitars for home music-making. European makers who moved to the United States in the 1830s built the first American guitar industry around them.'},
 {id:'torres',n:'Torres-style Spanish guitar',y:1860,yl:'1850s–1890s',l:1,p:['six'],d:'Antonio de Torres enlarged the body and refined fan bracing under the top. His designs set the pattern for the modern classical guitar.'},
 {id:'archtop',n:'Carved archtop',y:1922,yl:'1890s–1920s',l:3,p:['parlor'],d:'Tops carved like a violin, later with f-holes. By the early 1920s archtops were loud rhythm instruments for big bands.'},
 {id:'dread',n:'Dreadnought',y:1931,yl:'1916 / 1931',l:2,p:['parlor'],d:'A big, square-shouldered steel-string body designed for volume and bass. First built in 1916 and sold under the maker\'s own name from 1931, it became the standard acoustic shape.'},
 {id:'reso',n:'Resonator guitar',y:1927,yl:'1927',l:2,p:['parlor'],d:'Metal cones inside the body act like loudspeakers, making the guitar loud enough to compete with horns before electric amplification.'},
 {id:'lap',n:'Electric lap steel',y:1932,yl:'1931–32',l:4,p:['reso'],d:'Among the first commercially made electric guitars, played flat on the lap with a steel bar. Its electromagnetic pickup is the ancestor of modern pickups.'},
 {id:'es150',n:'Electric archtop',y:1936,yl:'1936',l:3,p:['archtop','lap'],d:'A hollow archtop with a pickup added. Jazz guitarists could finally play single-note solos loud enough to be heard over a band.'},
 {id:'log',n:'Solid-center experiments',y:1941,yl:'c. 1940',l:4,p:['es150'],d:'Players and inventors mounted pickups on solid blocks of wood to cut feedback and add sustain, proving the solid-body idea.'},
 {id:'tele',n:'First production solid-body',y:1950,yl:'1950–51',l:4,p:['lap','log'],d:'A simple slab body with a bolt-on neck, designed for factory production. Built by a company that started out making lap steels and amps.'},
 {id:'lp',n:'Carved-top solid-body',y:1952,yl:'1952',l:4,p:['log','es150'],d:'A single-cutaway solid-body with a carved maple top on mahogany. Humbucking pickups arrived a few years later.'},
 {id:'strat',n:'Contoured double cutaway',y:1954,yl:'1954',l:4,p:['tele'],d:'Body contours for comfort, three single-coil pickups and a vibrato bridge. It became one of the most copied designs in history.'},
 {id:'semi',n:'Semi-hollow body',y:1958,yl:'1958',l:3,p:['es150','lp'],d:'A thin hollow body with a solid wood block down the center: some archtop warmth with much less feedback.'},
 {id:'offset',n:'Offset-waist body',y:1959,yl:'1958',l:4,p:['strat'],d:'An off-center waist that sits comfortably when you play seated. Later adopted by surf, indie and shoegaze players.'},
 {id:'mod',n:'Angular modernist shapes',y:1960,yl:'1958',l:4,p:['lp'],d:'V-shaped and zigzag bodies that looked futuristic. They sold poorly at first and became hard-rock icons decades later.'},
 {id:'headless',n:'Headless guitar',y:1980,yl:'c. 1980',l:4,p:['strat'],d:'No headstock, with tuners at the bridge end, often in molded composite materials. Small, light and very stable in tune.'},
 {id:'super',n:'Superstrat',y:1983,yl:'1980s',l:4,p:['strat'],d:'A double-cutaway body with a humbucker at the bridge, deep cutaways and a locking vibrato, built for fast rock soloing.'},
 {id:'seven',n:'Seven-string solid-body',y:1990,yl:'1990',l:4,p:['super'],d:'An extra low B string for heavier riffs and wider range. Mass-produced seven-strings helped shape metal in the 1990s.'}
];
let treeSel='six';
const ancestors=id=>{const out=new Set(),st=[id];while(st.length){const n=TREE.find(x=>x.id===st.pop());if(!n)continue;for(const p of n.p)if(!out.has(p)){out.add(p);st.push(p)}}return out};
function renderTree(){
  const rows=TREE.slice().sort((a,b)=>a.y-b.y),W=880,lx=l=>116+l*152,rowH=40,top=48,H=top+rows.length*rowH+10;const pos={};rows.forEach((n,i)=>pos[n.id]={x:lx(n.l),y:top+i*rowH});
  const anc=ancestors(treeSel);anc.add(treeSel);
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Guitar family tree">`;
  LANES.forEach((ln,i)=>g+=`<text x="${lx(i)+68}" y="18" text-anchor="middle" font-size="10" font-family="monospace" style="fill:var(--muted)" letter-spacing="1">${esc(ln.toUpperCase().slice(0,26))}</text><line x1="${lx(i)+68}" x2="${lx(i)+68}" y1="28" y2="${H}" style="stroke:var(--line)" stroke-dasharray="2 4"/>`);
  for(const n of rows)for(const p of n.p){const a=pos[p],b=pos[n.id];if(!a)continue;const on=anc.has(n.id)&&anc.has(p);const x1=a.x+68,y1=a.y+14,x2=b.x+68,y2=b.y+14;
    g+=`<path d="M${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}" fill="none" style="stroke:${on?'var(--amber)':'var(--nickel)'}" stroke-width="${on?3:1.2}" opacity="${on?1:.55}"/>`}
  rows.forEach(n=>{const p=pos[n.id],sel=n.id===treeSel,on=anc.has(n.id);
    g+=`<text x="10" y="${p.y+18}" font-size="10" font-family="monospace" style="fill:var(--muted)">${esc(n.yl)}</text>`;
    g+=`<g class="tnode" data-node="${n.id}" tabindex="0" role="button" aria-label="${esc(n.n)}, ${esc(n.yl)}"><rect x="${p.x}" y="${p.y}" width="136" height="28" rx="3" style="fill:${sel?'var(--amber)':on?'var(--amber-soft)':'var(--panel)'};stroke:${on?'var(--amber)':'var(--line)'}" stroke-width="1.5"/><text x="${p.x+68}" y="${p.y+18}" text-anchor="middle" font-size="${n.n.length>22?9.5:11}" font-family="sans-serif" font-weight="600" style="fill:${sel?'var(--amber-ink)':'var(--ink)'}">${esc(n.n)}</text></g>`});
  $('#treeSvg').innerHTML=g+'</svg>';
  const n=TREE.find(x=>x.id===treeSel),kids=TREE.filter(x=>x.p.includes(treeSel)),line=[...ancestors(treeSel)].map(id=>TREE.find(x=>x.id===id)).sort((a,b)=>a.y-b.y);
  $('#treeInfo').innerHTML=`<div style="display:grid;gap:10px"><p class="eyebrow">${esc(n.yl)} · ${esc(LANES[n.l])}</p><h3>${esc(n.n)}</h3><p>${esc(n.d)}</p>
    ${line.length?`<p class="lbl">Line of descent</p><p class="msg">${line.map(x=>esc(x.n)).join(' → ')} → <strong>${esc(n.n)}</strong></p>`:''}
    ${n.p.length?`<p class="lbl">Grew out of</p><div class="row">${n.p.map(id=>`<button class="btn ghost small" type="button" data-go="${id}">${esc(TREE.find(x=>x.id===id).n)}</button>`).join('')}</div>`:''}
    ${kids.length?`<p class="lbl">Led to</p><div class="row">${kids.map(x=>`<button class="btn ghost small" type="button" data-go="${x.id}">${esc(x.n)}</button>`).join('')}</div>`:''}</div>`;
}
const treePick=id=>{if(TREE.find(x=>x.id===id)){treeSel=id;renderTree()}};
$('#treeSvg').addEventListener('click',e=>{const t=e.target.closest('[data-node]');if(t)treePick(t.dataset.node)});
$('#treeSvg').addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const t=e.target.closest('[data-node]');if(t){e.preventDefault();treePick(t.dataset.node);const f=$(`[data-node="${t.dataset.node}"]`);if(f)f.focus()}});
$('#treeInfo').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)treePick(b.dataset.go)});
renderTree();

/* ---------- Wing K: Broken Neck Hospital ---------- */
const lowNotes=()=>[[0,1],[0,3],[1,2],[1,3],[2,2],[0,3],[1,2],[0,1]].map(([s,f],i)=>({t:i*.3,s,midi:OPEN[s]+f,v:.9}));
const upNotes=()=>[[0,0],[0,12],[3,0],[3,12],[5,0],[5,12]].map(([s,f],i)=>({t:i*.55,s:i,midi:OPEN[s]+f,v:.85})).concat(strum(3.6,[null,null,9,9,10,9],0,.9));
const fret5=()=>[0,1,2,3,4,5].map((s,i)=>({t:i*.35,s,midi:OPEN[s]+5,v:.9})).concat([0,1,2].map((s,i)=>({t:2.4+i*.35,s,midi:OPEN[s]+9,v:.9})));
const openVs=()=>[[1,0],[0,5],[2,0],[1,5],[3,0],[2,5]].map(([s,f],i)=>({t:i*.6,s:i,midi:OPEN[s]+f,v:.9}));
const strumG=()=>{const ev=[];[[3,2,0,0,0,3],[null,3,2,0,1,0],[null,null,0,2,3,2],[3,2,0,0,0,3]].forEach((c,i)=>ev.push(...strum(i*1.1,c,0,.9),...strum(i*1.1+.55,c,1,.6)));return ev};
const bluesL=()=>[[5,8],[5,5],[4,8],[4,5],[3,7],[3,5],[2,7],[2,5],[3,7],[4,5],[5,5]].map(([s,f],i)=>({t:i*.4,s,midi:OPEN[s]+f,v:.9}));
const CASES2=[
 {p:'Rosie',g:{body:'double',finish:'seafoam',fretboard:'rosewood',pickup:'single'},sym:'Buzzing on the first three or four frets, worst on the low strings. Everything above the 7th fret plays clean.',fx:{buzz:'low'},ev:lowNotes,
  d:['The neck has too little relief (it is bowed back)','The strings are worn out','The output jack is loose','The intonation is off'],dc:0,
  tr:['Loosen the truss rod a little at a time','Tighten the truss rod','Swap the pickups'],tc:0,why:'A neck needs a slight forward bow, called relief, so the strings clear the low frets. Loosening the truss rod lets string tension pull a little bow back in. Go in small turns and let the neck settle.'},
 {p:'Big Earl',g:{body:'single',finish:'sunburst',fretboard:'rosewood',pickup:'humbucker'},sym:'Came in after a humid summer. The strings sit high around the 7th fret and chords in the middle of the neck are hard to press down.',fx:null,
  d:['The neck has too much relief (it bows forward)','One fret is sticking up','The nut slots are cut too low','The strings are dead'],dc:0,
  tr:['Tighten the truss rod slightly','Loosen the truss rod','File the nut slots deeper'],tc:0,why:'Humidity and string tension can pull a neck into a forward bow. Tightening the truss rod counteracts that and lowers the action in the middle of the neck.'},
 {p:'Maple Jean',g:{body:'double',finish:'white',fretboard:'maple',pickup:'single'},sym:'In tune when played open, but chords up the neck sound sour. The note at the 12th fret is sharper than the 12th-fret harmonic.',fx:{intonation:35},ev:upNotes,
  d:['The intonation is off: the string length is too short','The truss rod needs loosening','A pot is dirty','The nut is too low'],dc:0,
  tr:['Move the saddle back, away from the neck','Move the saddle toward the neck','Raise the pickup'],tc:0,why:'If the fretted 12th-fret note is sharp, the vibrating string is too short. Moving that string\'s saddle back lengthens it until the fretted note matches the harmonic.'},
 {p:'Sonny',g:{body:'offset',finish:'sonic',fretboard:'rosewood',pickup:'single'},sym:'The 12th-fret note is flat compared with the 12th-fret harmonic, and chords high on the neck sound flat.',fx:{intonation:-35},ev:upNotes,
  d:['The intonation is off: the string length is too long','The neck has too little relief','The strings are too new','The jack is loose'],dc:0,
  tr:['Move the saddle forward, toward the neck','Move the saddle back, away from the neck','Tighten the truss rod'],tc:0,why:'A flat 12th fret means the vibrating length is too long. Moving the saddle toward the neck shortens it.'},
 {p:'Sparky',g:{body:'single',finish:'black',fretboard:'ebony',pickup:'humbucker'},sym:'Crackles and cuts out whenever the cable moves. Wiggling the plug makes it worse.',fx:{crackle:true},ev:bluesL,
  d:['The output jack is loose or dirty','A volume pot is dirty','The strings are dead','A fret is high'],dc:0,
  tr:['Tighten the jack nut and clean or resolder its contacts','Put on new strings','Adjust the truss rod'],tc:0,why:'Output jacks work loose from years of plugging in. The spring contact can lose tension or a solder joint can crack. Tightening, cleaning or resoldering it fixes the dropouts.'},
 {p:'Knobby',g:{body:'hollow',finish:'cherry',fretboard:'rosewood',pickup:'humbucker'},sym:'Loud scratching whenever the volume knob turns, and the sound drops out at certain knob positions. Leaving the knob alone is quiet.',fx:{crackle:true},ev:strumG,
  d:['A volume pot is dirty','The output jack is loose','The pickups are too high','The neck has too much relief'],dc:0,
  tr:['Spray contact cleaner into the pot and turn it back and forth','Lower the action','Replace the nut'],tc:0,why:'Dust and oxidation build up on the pot\'s resistive track. Contact cleaner plus working the knob through its range usually clears it. Replace the pot if it keeps scratching.'},
 {p:'Old Gray',g:{body:'dread',finish:'natural',fretboard:'rosewood',pickup:'piezo'},sym:'Sounds dull and dies away fast. The strings look gray, feel gritty and won\'t stay in tune.',fx:{dead:true},ev:strumG,
  d:['The strings are old and dead','The bridge is lifting','The neck has too much relief','The nut is binding'],dc:0,
  tr:['Restring, and wipe the strings down after playing','Tighten the truss rod','Move the saddles back'],tc:0,why:'Sweat and dirt corrode strings and add uneven mass, which kills sustain and brightness and makes intonation unstable. Fresh strings bring the tone back.'},
 {p:'Pokey',g:{body:'double',finish:'sunburst',fretboard:'rosewood',pickup:'single'},sym:'Sharp metal ends stick out along the edges of the neck and snag your hand. It showed up over a dry winter.',fx:null,
  d:['Fret sprout: the fretboard shrank in dry air','The truss rod is broken','The frets are worn flat','The strings are too heavy'],dc:0,
  tr:['Humidify the guitar and have the fret ends filed smooth','Tighten the truss rod','Change to lighter strings'],tc:0,why:'Wood shrinks as it dries but metal frets do not, so the fret ends stick out. Keeping humidity steady helps, and a tech can file and bevel the ends.'},
 {p:'Hiccup',g:{body:'single',finish:'oxblood',fretboard:'rosewood',pickup:'p90'},sym:'Notes at the 5th fret buzz and choke on every string. Everything else plays clean.',fx:{buzz:'fret',fretFrom:5},ev:fret5,
  d:['The 6th fret is sitting too high','The strings are dead','The output jack is loose','The nut slots are too low'],dc:0,
  tr:['Reseat or level that fret','Loosen the truss rod','Raise the pickups'],tc:0,why:'When you press at one fret, the string buzzes against the next fret up if that fret is too tall. Tapping it back down or leveling it cures the buzz.'},
 {p:'Low Rider',g:{body:'double',finish:'shell',fretboard:'maple',pickup:'single'},sym:'Open strings buzz. The same notes played fretted, anywhere on the neck, sound fine.',fx:{buzz:'open'},ev:openVs,
  d:['The nut slots are cut too low','The neck has too much relief','The saddle is too far back','The pot is dirty'],dc:0,
  tr:['Replace the nut, or shim it and recut the slots','Tighten the truss rod','Move the saddles forward'],tc:0,why:'Open strings are held up only by the nut. If its slots are too deep, open strings hit the first fret. Fretted notes are fine because your finger acts as the nut.'},
 {p:'Pinger',g:{body:'offset',finish:'black',fretboard:'rosewood',pickup:'single'},sym:'Goes flat a little at a time while you play. You hear a ping from the headstock end while tuning.',fx:{drift:18},ev:bluesL,
  d:['The string is binding in the nut slot','The strings are too new','The neck has too little relief','A fret is high'],dc:0,
  tr:['Lubricate the nut slot with graphite, or have it recut','Loosen the truss rod','Raise the action'],tc:0,why:'When a string sticks in a tight nut slot, tension builds up on one side and releases with a ping, knocking the tuning out. Graphite from a pencil or a smoother slot lets it slide.'}
];
let hs=null;
function hStart(){hs={order:shuffle(CASES2.map((_,i)=>i)).slice(0,8),i:0,score:0,step:'d',dPick:null,tPick:null};hRender()}
function hRender(){const el=$('#hospital');
  if(!hs){el.innerHTML=`<div class="panel" style="display:grid;gap:12px"><h3>Eight patients are waiting</h3><p>Read each chart, listen to the problem when there is one, then diagnose and treat it.</p><div class="row"><button class="btn" type="button" id="hGo">Call in the first patient</button></div></div>`;$('#hGo').addEventListener('click',hStart);return}
  if(hs.i>=hs.order.length){const max=hs.order.length*2,r=hs.score>=max-1?'Chief of guitar surgery':hs.score>=max*.7?'Trusted tech':hs.score>=max*.4?'Apprentice luthier':'Please put down the screwdriver';
    el.innerHTML=`<div class="panel" style="display:grid;gap:12px"><p class="eyebrow">End of shift</p><h3>${hs.score} of ${max} points · ${esc(r)}</h3><div class="row"><button class="btn" type="button" id="hAgain">Start a new shift</button></div></div>`;$('#hAgain').addEventListener('click',hStart);return}
  const c=CASES2[hs.order[hs.i]];
  const opts=(list,right,pick,attr)=>`<div class="choices">${list.map((x,k)=>{let cls='';if(pick!=null){if(k===right)cls=' right';else if(k===pick)cls=' wrong'}return `<button class="choice${cls}" type="button" ${attr}="${k}" ${pick!=null?'disabled':''}><b style="font-size:19px">${esc(x)}</b></button>`}).join('')}</div>`;
  if(!c._d){c._d=shuffle(c.d.map((x,k)=>[x,k]));c._t=shuffle(c.tr.map((x,k)=>[x,k]))}
  const dl=c._d.map(x=>x[0]),dr=c._d.findIndex(x=>x[1]===c.dc),tl=c._t.map(x=>x[0]),tr=c._t.findIndex(x=>x[1]===c.tc);
  let h=`<div class="row" style="justify-content:space-between"><p class="stepper">Patient ${hs.i+1} of ${hs.order.length} · ${hs.step==='d'?'Diagnosis':'Treatment'}</p><p class="score">Score ${hs.score}</p></div>
   <div class="panel chart">${drawGuitar(c.g)}<div style="display:grid;gap:10px;align-content:start"><p class="eyebrow">Patient chart</p><h3>${esc(c.p)}</h3><p class="symptom">${esc(c.sym)}</p>
   ${c.ev?`<div class="row"><button class="btn ghost" type="button" id="hListen">Listen to the symptom</button><button class="btn ghost" type="button" id="hStop">Stop</button></div>`:'<p class="msg">No sound for this one. The problem is one you can see and feel.</p>'}</div></div>
   <p class="lbl">What's wrong?</p>${opts(dl,dr,hs.dPick,'data-hd')}`;
  if(hs.dPick!=null)h+=`<p class="lbl">How do you fix it?</p>${opts(tl,tr,hs.tPick,'data-ht')}`;
  if(hs.tPick!=null)h+=`<div class="verdict" style="display:grid;gap:10px"><p>${esc(c.why)}</p><div class="row"><button class="btn" type="button" id="hNext">${hs.i+1<hs.order.length?'Discharge and call the next patient':'End the shift'}</button></div></div>`;
  el.innerHTML=h;
  if(c.ev){$('#hListen').addEventListener('click',()=>Snd.play({guitar:c.g,chain:[],amp:{model:c.g.body==='dread'?'direct':'clean',gain:.15,tone:.6,volume:.8},fx:c.fx},c.ev()));$('#hStop').addEventListener('click',()=>Snd.stopAll())}
  $$('[data-hd]',el).forEach(b=>b.addEventListener('click',()=>{hs.dPick=+b.dataset.hd;if(hs.dPick===dr)hs.score++;hs.step='t';hRender()}));
  $$('[data-ht]',el).forEach(b=>b.addEventListener('click',()=>{hs.tPick=+b.dataset.ht;if(hs.tPick===tr)hs.score++;hRender()}));
  const nx=$('#hNext');if(nx)nx.addEventListener('click',()=>{delete c._d;delete c._t;hs.i++;hs.step='d';hs.dPick=null;hs.tPick=null;hRender()});
}
hRender();

Object.assign(S,{CARDS,TREE,LANES,CASES2,
  openLesson(i){tp.cur=Math.max(0,Math.min(LESSONS.length-1,i));saveT();renderTeacher()},
  teacherState:()=>({cur:tp.cur,done:tp.done.slice()}),
  openWood(k){openWood=k;renderWoods()},
  pickTree:id=>treePick(id),
  drawTarot:()=>{tarotDraw()},getSpread:()=>spread.slice(),
  startHospital:()=>{if(!hs)hStart()},hospitalCase:()=>hs&&hs.i<hs.order.length?CASES2[hs.order[hs.i]]:null});
document.addEventListener('ssm:wing',e=>{if(e.detail==='speedrun')srDraw();if(e.detail==='teacher')renderSyllabus()});
})();
