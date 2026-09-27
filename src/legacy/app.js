(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const uid=()=>Math.random().toString(36).slice(2,9);

/* ---------- Catalog ---------- */
const BODIES={
  double:{label:'Double cutaway',scale:'25.5"',frets:22,lb:7.8},
  single:{label:'Single cutaway',scale:'24.75"',frets:22,lb:8.8},
  offset:{label:'Offset waist',scale:'24"',frets:22,lb:8.0},
  hollow:{label:'Archtop hollowbody',scale:'24.75"',frets:20,lb:6.6,sustain:.72,eq:[[240,5,1.2]]},
  dread:{label:'Dreadnought acoustic',scale:'25.4"',frets:20,lb:4.6,acoustic:true,eq:[[105,7,1.6],[210,4,1.4],[2600,3,1]]}
};
const WOODS={
  alder:{label:'Alder',loss:.0036,s:.47,eq:[1100,2,.8],lb:1,density:450,grain:['#D9A774','#C8905C'],uses:'Solid electric bodies',origin:'Pacific Northwest, North America',note:'Even and balanced, with clear mids'},
  mahogany:{label:'Mahogany',loss:.0044,s:.5,eq:[380,4,.9],lb:1.12,density:590,grain:['#8A4526','#6E3219'],uses:'Solid bodies, necks, acoustic backs and sides',origin:'Central and South America, Africa',note:'Warm and thick, with softer highs'},
  maple:{label:'Maple',loss:.0026,s:.43,eq:[3200,4,.9],lb:1.18,density:705,grain:['#EBD3A6','#D9BD8A'],uses:'Necks, fretboards, carved tops',origin:'Eastern North America',note:'Bright and snappy, with long sustain'},
  ash:{label:'Swamp ash',loss:.0031,s:.44,eq:[2600,3,.7],lb:.92,density:480,grain:['#E2C495','#BF9C66'],uses:'Solid bodies, often under see-through finishes',origin:'Southern US wetlands',note:'Scooped mids and an airy top end'},
  basswood:{label:'Basswood',loss:.004,s:.49,eq:[700,2,.8],lb:.88,density:415,grain:['#EFE0C4','#E4D1AE'],uses:'Lightweight solid bodies',origin:'North America, Asia',note:'Soft and even, with a strong midrange'},
  korina:{label:'Korina',loss:.0038,s:.47,eq:[900,3,.8],lb:1.02,density:555,grain:['#E3C889','#CFAE6C'],uses:'Solid bodies and necks',origin:'West Africa',note:'Warm like mahogany, with a little more clarity'},
  walnut:{label:'Walnut',loss:.0033,s:.46,eq:[1800,3,.8],lb:1.1,density:610,grain:['#6B4A32','#533725'],uses:'Bodies, necks, acoustic backs and sides',origin:'North America',note:'Tight lows and clear upper mids'},
  koa:{label:'Koa',loss:.0034,s:.45,eq:[2200,3,.9],lb:1.1,density:610,grain:['#B8763A','#8F5424'],uses:'Acoustic backs, sides and tops; ukuleles',origin:'Hawaii',note:'Sweet and focused, getting warmer with age'},
  spruce:{label:'Spruce top',loss:.004,s:.43,eq:[3000,3,.8],lb:.95,density:425,grain:['#F0DDB2','#E2CA96'],uses:'Acoustic soundboards',origin:'North America and Europe',note:'Open and lively, rings like a bell'},
  cedar:{label:'Cedar top',loss:.0045,s:.47,eq:[600,3,.8],lb:.9,density:370,grain:['#C98A5B','#B27447'],uses:'Classical and fingerstyle soundboards',origin:'Pacific Northwest, North America',note:'Warm and quick to respond, good for a light touch'},
  rosewood:{label:'Rosewood',loss:.003,s:.45,eq:[150,4,.9],lb:1.25,density:830,grain:['#5A2E1E','#3E1D12'],uses:'Fretboards, acoustic backs and sides',origin:'India, Brazil, Madagascar',note:'Deep lows and a shimmering top end'}
};
const FRETBOARDS={
  rosewood:{label:'Rosewood',color:'#3B2418',inlay:'#EDE6D6',ds:.01},
  maple:{label:'Maple',color:'#E2C28A',inlay:'#1C1714',ds:-.02},
  ebony:{label:'Ebony',color:'#17110D',inlay:'#EDE6D6',ds:-.01}
};
const PICKUPS={
  single:{label:'Three single-coils',lp:6800,q:2.4,out:.8,note:'glassy and clear'},
  humbucker:{label:'Two humbuckers',lp:3200,q:1.1,out:1.5,note:'fat, loud and quiet'},
  p90:{label:'Two P-90s',lp:4800,q:1.8,out:1.2,note:'growly, with raw mids'},
  piezo:{label:'Under-saddle piezo',lp:10000,q:.5,out:.75,note:'crisp acoustic snap'}
};
const FINISHES={
  sunburst:{label:'Tobacco burst',sw:'radial-gradient(circle,#F2B64A,#C9731E 45%,#5A2A0E 78%,#1A0C05)'},
  cherry:{label:'Cherry burst',sw:'radial-gradient(circle,#F0663F,#A81F1F 55%,#3A0808)'},
  natural:{label:'Natural',sw:'linear-gradient(100deg,#E3B06A,#CF9450,#E0AA60,#C98A45)'},
  seafoam:{label:'Seafoam',c:'#8CC7B3'},
  sonic:{label:'Sonic blue',c:'#86A9C8'},
  shell:{label:'Shell pink',c:'#EDB5AC'},
  white:{label:'Olympic white',c:'#EEEBE2'},
  oxblood:{label:'Oxblood',c:'#6B1F23'},
  black:{label:'Gloss black',c:'#161616'}
};
const STATUS={playing:{label:'Still playing',live:true},retired:{label:'Retired to the wall',live:true},sold:{label:'Sold'},broken:{label:'Broken'},lost:{label:'Lost'},stolen:{label:'Stolen'}};

/* ---------- Guitar drawing ---------- */
let gid=0;
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(v+(amt<0?v*amt:(255-v)*amt))));return '#'+[f(r),f(g),f(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function finishDef(id,key){
  const f=FINISHES[key]||FINISHES.sunburst;
  if(key==='sunburst')return `<radialGradient id="${id}" cx="50%" cy="64%" r="62%"><stop offset="0" stop-color="#F2B64A"/><stop offset=".45" stop-color="#C9731E"/><stop offset=".8" stop-color="#5A2A0E"/><stop offset="1" stop-color="#1A0C05"/></radialGradient>`;
  if(key==='cherry')return `<radialGradient id="${id}" cx="50%" cy="64%" r="62%"><stop offset="0" stop-color="#F0663F"/><stop offset=".55" stop-color="#A81F1F"/><stop offset="1" stop-color="#3A0808"/></radialGradient>`;
  if(key==='natural')return `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2=".15"><stop offset="0" stop-color="#E3B06A"/><stop offset=".3" stop-color="#CF9450"/><stop offset=".55" stop-color="#E0AA60"/><stop offset=".8" stop-color="#C98A45"/><stop offset="1" stop-color="#DDA35C"/></linearGradient>`;
  return `<linearGradient id="${id}" x1="0" x2=".3" y1="0" y2="1"><stop offset="0" stop-color="${shade(f.c,.18)}"/><stop offset="1" stop-color="${shade(f.c,-.22)}"/></linearGradient>`;
}
function drawGuitar(b){
  b=Object.assign({body:'double',finish:'sunburst',fretboard:'rosewood',pickup:'single'},b||{});
  const id='gt'+(++gid), fb=FRETBOARDS[b.fretboard]||FRETBOARDS.rosewood, fill=`url(#${id}f)`;
  const acoustic=b.body==='dread';
  let shapes='',extra='',neckEnd=285,bridgeY=396,pick=[];
  switch(b.body){
    case 'single':shapes=`<ellipse cx="100" cy="372" rx="68" ry="64"/><ellipse cx="92" cy="305" rx="52" ry="48"/><ellipse cx="133" cy="290" rx="12" ry="21" transform="rotate(20 133 290)"/>`;break;
    case 'offset':shapes=`<ellipse cx="104" cy="374" rx="70" ry="60" transform="rotate(-10 104 374)"/><ellipse cx="96" cy="306" rx="48" ry="44" transform="rotate(-10 96 306)"/><ellipse cx="62" cy="264" rx="14" ry="36" transform="rotate(-22 62 264)"/><ellipse cx="140" cy="284" rx="11" ry="22" transform="rotate(22 140 284)"/>`;break;
    case 'hollow':shapes=`<ellipse cx="100" cy="370" rx="78" ry="66"/><ellipse cx="100" cy="292" rx="60" ry="54"/>`;neckEnd=250;bridgeY=362;
      extra=`<path d="M60 305 q-9 30 4 62" stroke="#120B06" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M140 305 q9 30 -4 62" stroke="#120B06" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M88 392 L112 392 L108 428 L92 428 Z" fill="#B9C1C6"/><rect x="76" y="358" width="48" height="7" rx="2" fill="#2A1A10"/>`;break;
    case 'dread':shapes=`<ellipse cx="100" cy="370" rx="74" ry="64"/><ellipse cx="100" cy="290" rx="58" ry="52"/><ellipse cx="100" cy="330" rx="62" ry="40"/>`;neckEnd=246;bridgeY=386;
      extra=`<circle cx="100" cy="294" r="24" fill="none" stroke="#E4D6B8" stroke-width="2.5"/><circle cx="100" cy="294" r="19" fill="#120B06"/><rect x="70" y="381" width="60" height="10" rx="4" fill="#2A1A10"/><rect x="80" y="384" width="40" height="2.5" fill="#EDE6D6"/>`;break;
    default:shapes=`<ellipse cx="100" cy="372" rx="70" ry="62"/><ellipse cx="100" cy="306" rx="48" ry="46"/><ellipse cx="68" cy="276" rx="15" ry="27" transform="rotate(-18 68 276)"/><ellipse cx="134" cy="284" rx="12" ry="20" transform="rotate(18 134 284)"/>`;
  }
  if(!acoustic){
    const hollow=b.body==='hollow';
    if(b.pickup==='single')pick=[[300,'s',0],[330,'s',0],[364,'s',-8]];
    else pick=hollow?[[300,b.pickup],[340,b.pickup]]:[[302,b.pickup],[360,b.pickup]];
  }
  let pu='';
  for(const [y,t,rot] of pick){
    const tr=rot?` transform="rotate(${rot} 100 ${y})"`:'';
    if(t==='s'){pu+=`<g${tr}><rect x="78" y="${y-5}" width="44" height="10" rx="5" fill="#EFE8D8"/>${[0,1,2,3,4,5].map(i=>`<circle cx="${92.5+i*3}" cy="${y}" r="1.2" fill="#8B949B"/>`).join('')}</g>`}
    else if(t==='humbucker'){pu+=`<rect x="76" y="${y-9}" width="48" height="18" rx="2" fill="#141414"/>${[0,1,2,3,4,5].map(i=>`<circle cx="${92.5+i*3}" cy="${y-4}" r="1.2" fill="#C2C8CC"/><circle cx="${92.5+i*3}" cy="${y+4}" r="1.2" fill="#C2C8CC"/>`).join('')}`}
    else {pu+=`<rect x="76" y="${y-8}" width="48" height="16" rx="3" fill="#EFE8D8"/>${[0,1,2,3,4,5].map(i=>`<circle cx="${92.5+i*3}" cy="${y}" r="1.3" fill="#8B949B"/>`).join('')}`}
  }
  const hard=acoustic||b.body==='hollow'?'':`<rect x="72" y="${bridgeY-4}" width="56" height="9" rx="2" fill="#B9C1C6"/><circle cx="142" cy="392" r="6" fill="#E8E1D2" stroke="#8B8378"/><circle cx="152" cy="410" r="6" fill="#E8E1D2" stroke="#8B8378"/><circle cx="130" cy="414" r="6" fill="#E8E1D2" stroke="#8B8378"/>`;
  const hollowKnobs=b.body==='hollow'?`<circle cx="140" cy="395" r="6" fill="#E8E1D2" stroke="#8B8378"/><circle cx="150" cy="378" r="6" fill="#E8E1D2" stroke="#8B8378"/>`:'';
  // frets
  const nut=66,L=330;let frets='',inl='';
  const fy=n=>nut+L*(1-Math.pow(2,-n/12));
  for(let n=1;n<=24;n++){const y=fy(n);if(y>neckEnd-3)break;frets+=`<line x1="89" x2="111" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#C9CDD0" stroke-width="1.1"/>`;
    if([3,5,7,9,15,17].includes(n)){const m=(fy(n-1)+y)/2;inl+=`<circle cx="100" cy="${m.toFixed(1)}" r="2.2" fill="${fb.inlay}"/>`}
    if(n===12){const m=(fy(11)+y)/2;inl+=`<circle cx="95" cy="${m.toFixed(1)}" r="2.2" fill="${fb.inlay}"/><circle cx="105" cy="${m.toFixed(1)}" r="2.2" fill="${fb.inlay}"/>`}}
  const headFill=b.fretboard==='maple'?'#D8B479':'#24170F';
  const head=acoustic||b.body==='hollow'
    ?`<path d="M88 66 L84 14 Q84 4 93 4 L107 4 Q116 4 116 14 L112 66 Z" fill="${headFill}"/>${[16,30,44].map(y=>`<circle cx="80" cy="${y}" r="4" fill="#B9C1C6"/><circle cx="120" cy="${y}" r="4" fill="#B9C1C6"/>`).join('')}`
    :`<path d="M89 66 L86 18 Q86 6 98 6 L113 8 Q121 10 116 22 L111 66 Z" fill="${headFill}"/>${[14,22,30,38,46,54].map(y=>`<circle cx="82" cy="${y}" r="3.2" fill="#B9C1C6"/>`).join('')}`;
  const strings=[0,1,2,3,4,5].map(i=>`<line x1="${92.5+i*3}" x2="${92.5+i*3}" y1="10" y2="${b.body==='hollow'?392:bridgeY}" stroke="#DDE1E4" stroke-width="${(1.1-i*.1).toFixed(2)}" opacity=".85"/>`).join('');
  return `<svg viewBox="0 0 200 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc((FINISHES[b.finish]||{}).label||'')} ${esc((BODIES[b.body]||{}).label||'guitar')}"><defs>${finishDef(id+'f',b.finish)}<filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".35"/></filter></defs><g fill="${fill}" filter="url(#${id}s)">${shapes}</g>${extra}${head}<rect x="89" y="64" width="22" height="${neckEnd-64}" fill="${fb.color}"/><rect x="89" y="64" width="22" height="3" fill="#EDE6D6"/>${frets}${inl}${pu}${hard}${hollowKnobs}${strings}</svg>`;
}

/* ---------- Audio engine ---------- */
const OPEN=[40,45,50,55,59,64];
const Snd=(()=>{
  let ctx=null,master=null;const active=new Set(),bufs=new Map(),irs=new Map();
  function get(){
    if(!ctx){const C=window.AudioContext||window.webkitAudioContext;ctx=new C();const lim=ctx.createDynamicsCompressor();lim.threshold.value=-8;lim.ratio.value=6;master=ctx.createGain();master.gain.value=.85;master.connect(lim);lim.connect(ctx.destination)}
    if(ctx.state==='suspended')ctx.resume();return ctx;
  }
  function curve(kind,k){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;
    if(kind==='soft')c[i]=Math.tanh(k*x)/Math.tanh(k);
    else if(kind==='hard')c[i]=x>0?Math.min(1,x*1.4):Math.max(-.85,x*1.4);
    else c[i]=x}return c}
  const SOFT=curve('soft',2.5),AMPC=curve('soft',1.8),HARD=curve('hard');
  function pluck(midi,loss,s,dur){
    const key=midi+'|'+loss.toFixed(5)+'|'+s.toFixed(3)+'|'+dur;if(bufs.has(key))return bufs.get(key);
    const sr=ctx.sampleRate,f=440*Math.pow(2,(midi-69)/12),N=Math.max(2,Math.round(sr/f));
    const ring=new Float32Array(N);for(let i=0;i<N;i++)ring[i]=Math.random()*2-1;
    const p=Math.max(1,Math.round(N*.14)),t=ring.slice();for(let i=0;i<N;i++)ring[i]=t[i]-.9*t[(i-p+N)%N];
    const de=1-loss*Math.sqrt(110/f),len=Math.floor(sr*dur),b=ctx.createBuffer(1,len,sr),d=b.getChannelData(0);
    let idx=0;for(let n=0;n<len;n++){const a=ring[idx],nb=ring[(idx+1)%N];d[n]=a;ring[idx]=de*((1-s)*a+s*nb);idx=(idx+1)%N}
    let pk=0;for(let n=0;n<Math.min(len,4000);n++)pk=Math.max(pk,Math.abs(d[n]));const g=.45/(pk||1);
    const fade=Math.floor(sr*.05);for(let n=0;n<len;n++){d[n]*=g;if(n>len-fade)d[n]*=(len-n)/fade}
    bufs.set(key,b);return b;
  }
  function ir(size){const k=Math.round(size*4)/4;if(irs.has(k))return irs.get(k);const sr=ctx.sampleRate,len=Math.floor(sr*k),b=ctx.createBuffer(2,len,sr);
    for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}irs.set(k,b);return b}
  function bq(type,f,q,g){const n=ctx.createBiquadFilter();n.type=type;n.frequency.value=f;if(q!=null)n.Q.value=q;if(g!=null)n.gain.value=g;return n}
  function gn(v){const g=ctx.createGain();g.gain.value=v;return g}
  function lfo(rate,depth,target,oscs){const o=ctx.createOscillator();o.frequency.value=rate;const a=gn(depth);o.connect(a);a.connect(target);o.start();oscs.push(o)}
  function pedal(type,p,oscs){
    const c=ctx;
    switch(type){
      case 'od':{const i=gn(1+p.drive*30),mid=bq('peaking',720,.8,5),w=c.createWaveShaper();w.curve=SOFT;w.oversample='4x';const lp=bq('lowpass',1200+p.tone*6000,.7),o=gn(.5);i.connect(mid);mid.connect(w);w.connect(lp);lp.connect(o);return{i,o}}
      case 'fuzz':{const i=gn(6+p.fuzz*140),w=c.createWaveShaper();w.curve=HARD;w.oversample='4x';const lp=bq('lowpass',3600,.9),o=gn(.15+p.level*.55);i.connect(w);w.connect(lp);lp.connect(o);return{i,o}}
      case 'comp':{const i=gn(1),k=c.createDynamicsCompressor();k.threshold.value=-12-p.sustain*42;k.ratio.value=12;k.attack.value=.004;k.release.value=.25;const o=gn(p.level*(1+p.sustain*3));i.connect(k);k.connect(o);return{i,o}}
      case 'wah':{const i=gn(1),bp=bq('bandpass',900,4+p.range*6),o=gn(1),wet=gn(2.6),dry=gn(.15);i.connect(bp);bp.connect(wet);wet.connect(o);i.connect(dry);dry.connect(o);lfo(p.rate,300+p.range*700,bp.frequency,oscs);return{i,o}}
      case 'chorus':{const i=gn(1),o=gn(1),dry=gn(.75),d=c.createDelay(.1);d.delayTime.value=.018;const wet=gn(.65);i.connect(dry);dry.connect(o);i.connect(d);d.connect(wet);wet.connect(o);lfo(p.rate,.0015+p.depth*.005,d.delayTime,oscs);return{i,o}}
      case 'trem':{const i=gn(1),v=gn(1-p.depth/2);i.connect(v);lfo(p.rate,p.depth/2,v.gain,oscs);return{i,o:v}}
      case 'delay':{const i=gn(1),o=gn(1),d=c.createDelay(2);d.delayTime.value=p.time;const fb=gn(p.feedback),lp=bq('lowpass',3200,.5),wet=gn(p.mix);i.connect(o);i.connect(d);d.connect(lp);lp.connect(fb);fb.connect(d);d.connect(wet);wet.connect(o);return{i,o}}
      case 'reverb':{const i=gn(1),o=gn(1),cv=c.createConvolver();cv.buffer=ir(p.size);const dry=gn(1-p.mix*.5),wet=gn(p.mix*1.1);i.connect(dry);dry.connect(o);i.connect(cv);cv.connect(wet);wet.connect(o);return{i,o}}
    }
    const g=gn(1);return{i:g,o:g};
  }
  function voice(g){
    const body=BODIES[g.body]||BODIES.double,wood=WOODS[g.wood]||WOODS.alder,fb=FRETBOARDS[g.fretboard]||FRETBOARDS.rosewood;
    return{loss:wood.loss/(body.sustain||1),s:Math.min(.5,Math.max(.36,wood.s+fb.ds))};
  }
  function build(rig,oscs){
    const g=rig.guitar,body=BODIES[g.body]||BODIES.double,wood=WOODS[g.wood]||WOODS.alder,pu=PICKUPS[g.pickup]||PICKUPS.single;
    const inp=gn(pu.out);let last=inp;const add=n=>{last.connect(n);last=n};
    add(bq('highpass',70,.7));
    add(bq('peaking',wood.eq[0],wood.eq[2],wood.eq[1]));
    for(const [f,gv,q] of body.eq||[])add(bq('peaking',f,q,gv));
    add(bq('lowpass',pu.lp,pu.q));
    let tail=1.2;
    for(const ped of rig.chain||[]){if(!ped.on)continue;const n=pedal(ped.type,ped.p,oscs);last.connect(n.i);last=n.o;
      if(ped.type==='delay')tail+=ped.p.time*(1/(1-ped.p.feedback+.05));if(ped.type==='reverb')tail+=ped.p.size}
    const a=rig.amp||{model:'clean',gain:.2,tone:.6,volume:.8};
    if(a.model!=='direct'){
      const pre=gn(a.model==='crunch'?1+a.gain*40:1+a.gain*10);add(pre);
      if(a.model==='crunch')add(bq('peaking',800,.9,6));
      const w=ctx.createWaveShaper();w.curve=AMPC;w.oversample='2x';add(w);
      add(bq('lowpass',1500+a.tone*7000,.7));add(bq('peaking',110,1,3));add(bq('lowpass',5200,.8));
      add(gn(a.volume*.55));
    }else{add(bq('highshelf',3000,null,(a.tone-.5)*10));add(gn(a.volume*.9))}
    return{inp,out:last,tail};
  }
  function stopAll(){if(!ctx)return;const t=ctx.currentTime;for(const s of active){s.vca.gain.cancelScheduledValues(t);s.vca.gain.setTargetAtTime(0,t,.04);setTimeout(()=>s.kill(),300)}}
  function play(rig,events,opt){
    get();if(!(opt&&opt.keep))stopAll();
    const oscs=[],ch=build(rig,oscs),vca=gn(1);ch.out.connect(vca);vca.connect(master);
    const v=voice(rig.guitar),t0=ctx.currentTime+.06,srcs=[],lastOn={};let end=0;const fx=rig.fx||{};
    if(fx.dead){v.loss*=3.2;v.s=.5}
    let buzzIn=null;if(fx.buzz){buzzIn=gn(1);buzzIn.connect(ch.inp);const pre=gn(60),w=ctx.createWaveShaper();w.curve=HARD;const hp=bq('highpass',1800,.7),bg=gn(.09);buzzIn.connect(pre);pre.connect(w);w.connect(hp);hp.connect(bg);bg.connect(ch.inp)}
    const buzzes=f=>fx.buzz==='all'||(fx.buzz==='open'&&f===0)||(fx.buzz==='low'&&f<=4)||(fx.buzz==='fret'&&f>=fx.fretFrom&&f<=fx.fretFrom+1);
    for(const e of events){
      const t=t0+e.t,src=ctx.createBufferSource();src.buffer=pluck(e.midi,v.loss,v.s,3.2);const g=gn(0);g.gain.setValueAtTime(e.v??.9,t);
      const fr=e.midi-OPEN[e.s];
      if(fx.intonation&&fr>0)src.detune.value=fx.intonation*Math.min(fr,17)/12;
      if(fx.drift)src.detune.value=-fx.drift*e.t;
      src.connect(g);g.connect(buzzIn&&buzzes(fr)?buzzIn:ch.inp);src.start(t);srcs.push(src);
      const prev=lastOn[e.s];if(prev){prev.gain.setTargetAtTime(0,t,.015)}lastOn[e.s]=g;
      if(e.dur){g.gain.setTargetAtTime(0,t+e.dur,.03)}
      end=Math.max(end,e.t+(e.dur||2.4));
    }
    const s={vca,kill(){try{srcs.forEach(x=>x.stop())}catch(e){}oscs.forEach(o=>{try{o.stop()}catch(e){}});try{vca.disconnect()}catch(e){}active.delete(s)}};
    if(fx.crackle){let t=t0+.2;while(t<t0+end+1){const d=.02+Math.random()*.12;vca.gain.setValueAtTime(Math.random()<.5?0:.15,t);vca.gain.setValueAtTime(1,t+d);t+=.15+Math.random()*.6}}
    active.add(s);setTimeout(()=>{if(active.has(s))s.kill()},(end+ch.tail+.5)*1000);
    return end;
  }
  function click(accent){get();const t=ctx.currentTime+.01,o=ctx.createOscillator(),g=gn(0);o.frequency.value=accent?1800:1200;g.gain.setValueAtTime(.35,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);o.connect(g);g.connect(master);o.start(t);o.stop(t+.06)}
  return{play,stopAll,click,get ctx(){return get()}};
})();

/* ---------- Phrases ---------- */
const CH={G:[3,2,0,0,0,3],C:[null,3,2,0,1,0],D:[null,null,0,2,3,2],Em:[0,2,2,0,0,0],Am:[null,0,2,2,1,0],F:[1,3,3,2,1,1],E5:[0,2,2,null,null,null],G5:[3,5,5,null,null,null],A5:[null,0,2,2,null,null],D5:[null,5,7,7,null,null]};
function strum(t,frets,up,v=.85,dur,spread=.013){const ev=[];const idx=[0,1,2,3,4,5].filter(i=>frets[i]!=null);if(up)idx.reverse();idx.forEach((s,k)=>ev.push({t:t+k*spread,s,midi:OPEN[s]+frets[s],v,dur}));return ev}
const note=(t,s,f,v=.9,dur)=>({t,s,midi:OPEN[s]+f,v,dur});
const RIFFS={
  campfire:{label:'Campfire strum (G C D G)',make(){const b=60/100,ev=[];['G','G','C','D'].forEach((c,i)=>{const t=i*2*b;ev.push(...strum(t,CH[c],0,.9),...strum(t+b,CH[c],0,.75),...strum(t+b*1.5,CH[c],1,.6))});ev.push(...strum(8*b,CH.G,0,.9));return ev}},
  blues:{label:'Blues lick in A',make(){const b=60/92,seq=[[5,8],[5,5],[4,8],[4,5],[3,7],[3,5],[2,7],[2,5]],ev=[];seq.forEach(([s,f],i)=>ev.push(note(i*b/2,s,f,.9)));ev.push(note(4*b,3,7,.9),note(4.5*b,3,5,.8),note(5*b,2,7,.9),...strum(6*b,CH.A5,0,.95));return ev}},
  chug:{label:'Power-chord chug',make(){const b=60/132,ev=[];for(let i=0;i<8;i++)ev.push(...strum(i*b/2,CH.E5,0,.8,b*.35,.006));ev.push(...strum(4*b,CH.G5,0,.95,b*.9,.008),...strum(5*b,CH.A5,0,.95,b*.9,.008));for(let i=0;i<4;i++)ev.push(...strum(6*b+i*b/2,CH.E5,0,.8,b*.35,.006));ev.push(...strum(8*b,CH.E5,0,1,null,.008));return ev}},
  arp:{label:'Fingerpicked arpeggio (Am F C G)',make(){const b=60/84,ev=[],pat={Am:[1,3,4,5,4,3],F:[0,2,3,4,3,2],C:[1,3,4,5,4,3],G:[0,3,4,5,4,3]};['Am','F','C','G'].forEach((c,i)=>pat[c].forEach((s,k)=>{const f=CH[c][s];if(f!=null)ev.push(note(i*3*b+k*b/2,s,f,.75))}));return ev}},
  lead:{label:'Soaring lead line',make(){const b=60/100,seq=[[4,12,1],[5,10,1],[5,12,2],[4,13,.5],[4,12,.5],[4,10,1],[3,12,2],[3,9,1],[4,10,3]],ev=[];let t=0;seq.forEach(([s,f,l])=>{ev.push(note(t,s,f,.9,l*b));t+=l*b*.5});return ev}}
};
const riffOptions=()=>Object.entries(RIFFS).map(([k,r])=>`<option value="${k}">${esc(r.label)}</option>`).join('');

/* ---------- Pedals ---------- */
const PEDALS={
  comp:{name:'Squeeze',kind:'Compressor',color:'#B03A3A',text:'#FFF4EF',knobs:{sustain:[0,1,.6],level:[0,1,.6]}},
  wah:{name:'Quack Sweep',kind:'Auto-wah',color:'#2B2B2B',text:'#F1F1F1',knobs:{rate:[.2,6,1.8],range:[0,1,.7]}},
  od:{name:'Green Hum',kind:'Overdrive',color:'#3E8E4F',text:'#F2FBF3',knobs:{drive:[0,1,.5],tone:[0,1,.5]}},
  fuzz:{name:'Big Sweater',kind:'Fuzz',color:'#D46A2A',text:'#1D0F05',knobs:{fuzz:[0,1,.7],level:[0,1,.5]}},
  chorus:{name:'Lake Shimmer',kind:'Chorus',color:'#8B6FB5',text:'#FBF7FF',knobs:{rate:[.1,5,.8],depth:[0,1,.5]}},
  trem:{name:'Porch Light',kind:'Tremolo',color:'#D6B031',text:'#1E1703',knobs:{rate:[1,12,5],depth:[0,1,.6]}},
  delay:{name:'Canyon Echo',kind:'Delay',color:'#2F6FA8',text:'#F1F7FD',knobs:{time:[.05,.9,.35],feedback:[0,.85,.35],mix:[0,1,.35]}},
  reverb:{name:'Cathedral',kind:'Reverb',color:'#5B7A8C',text:'#F3F8FA',knobs:{size:[.5,6,2.5],mix:[0,1,.35]}}
};
function mkPedal(type,params,on=true){const P=PEDALS[type],p={};for(const [k,[,,d]] of Object.entries(P.knobs))p[k]=params&&params[k]!=null?params[k]:d;return{uid:uid(),type,p,on}}
const PRESETS={
  surf:{label:'Surf twang',chain:[['trem',{rate:6,depth:.5}],['reverb',{size:3,mix:.55}]],amp:{model:'clean',gain:.1,tone:.7,volume:.8}},
  shoegaze:{label:'Shoegaze haze',chain:[['fuzz',{fuzz:.6,level:.45}],['chorus',{rate:.3,depth:.9}],['reverb',{size:5.5,mix:.7}]],amp:{model:'clean',gain:.2,tone:.5,volume:.8}},
  lead80:{label:'80s arena lead',chain:[['od',{drive:.8,tone:.7}],['chorus',{rate:.6,depth:.5}],['delay',{time:.42,feedback:.45,mix:.4}]],amp:{model:'crunch',gain:.5,tone:.6,volume:.75}},
  funk:{label:'Funk quack',chain:[['comp',{sustain:.6,level:.6}],['wah',{rate:3,range:.8}]],amp:{model:'clean',gain:.15,tone:.6,volume:.8}},
  blues:{label:'Blues crunch',chain:[['od',{drive:.45,tone:.45}],['reverb',{size:1.5,mix:.25}]],amp:{model:'crunch',gain:.35,tone:.5,volume:.8}}
};

/* ---------- State ---------- */
let guitar=Object.assign({body:'double',wood:'alder',fretboard:'rosewood',pickup:'single',finish:'sunburst',nick:''},store.get('ssm.guitar',{}));
let board=store.get('ssm.board',null);
if(!board||!Array.isArray(board.chain))board={chain:[mkPedal('od'),mkPedal('delay'),mkPedal('reverb')],amp:{model:'clean',gain:.25,tone:.55,volume:.8}};
board.chain=board.chain.filter(p=>PEDALS[p.type]);
const saveG=()=>{store.set('ssm.guitar',guitar);document.dispatchEvent(new CustomEvent('ssm:guitar-changed'))},saveB=()=>{store.set('ssm.board',board);document.dispatchEvent(new CustomEvent('ssm:board-changed'))};
const guitarName=g=>(g.nick?`“${g.nick}”, `:'')+`${(FINISHES[g.finish]||{}).label||''} ${(WOODS[g.wood]||{}).label||''} ${(BODIES[g.body]||{label:''}).label.toLowerCase()}, ${(PICKUPS[g.pickup]||{label:''}).label.toLowerCase()}`;
document.querySelectorAll('[data-stop]').forEach(b=>b.addEventListener('click',()=>Snd.stopAll()));

/* ---------- Tabs ---------- */
const WINGS=['hall','workshop','roulette','pedalboard','detective','teacher','tarot','woods','speedrun','tree','hospital'];
function showWing(w,push){if(!WINGS.includes(w))w='hall';WINGS.forEach(x=>{const el=$('#wing-'+x);if(el)el.hidden=x!==w});
  if(w==='pedalboard')renderRig();document.dispatchEvent(new CustomEvent('ssm:wing',{detail:w}));
  if(push)document.dispatchEvent(new CustomEvent('ssm:goto',{detail:w}));}

/* ---------- Capabilities ---------- */
let db=null,userCap=null,me=null,connecting=true;const names={};
const SAMPLES=[
 {id:'sample-1',sample:true,name:'The Dorm Room Strat-alike',model:'Secondhand sunburst double cutaway',year:'2019',status:'playing',story:'Bought for $140 from a senior who was moving out. It stays in tune about as well as a shopping cart rolls straight, but every song I know, I learned on it.',scars:'A chip on the lower horn from a bunk bed rail',songs:['12-bar blues in E','Campfire G C D'],build:{body:'double',finish:'sunburst',fretboard:'rosewood',pickup:'single'},by:null,createdAt:1790000000000},
 {id:'sample-2',sample:true,name:'Big Red',model:'Cherry single cutaway with humbuckers',year:'2012',status:'sold',story:'Sold it to cover rent one winter. Heard it once through the wall of a bar across town and swear it was the same guitar.',scars:'Worn finish where the forearm rests',songs:['Power-chord chug','Anything loud'],build:{body:'single',finish:'cherry',fretboard:'rosewood',pickup:'humbucker'},by:null,createdAt:1789000000000},
 {id:'sample-3',sample:true,name:'Porch Dread',model:'Natural spruce dreadnought',year:'2008',status:'broken',story:'Left in a hot car for one afternoon. The bridge lifted and the top cracked. It hangs on the wall now and still looks better than most guitars that work.',scars:'A long crack below the soundhole',songs:['Fingerpicked arpeggios'],build:{body:'dread',finish:'natural',fretboard:'rosewood',pickup:'piezo'},by:null,createdAt:1788000000000}];
/* Data layer: the claude.ai shared database when available, otherwise this browser's storage */
const Data=(()=>{const pending=[],localSubs={};let mode='pending';
  const key=c=>'ssm.col.'+c;
  const readL=c=>{const v=store.get(key(c),null);if(v)return v;return c==='exhibits'?SAMPLES.slice():[]};
  const writeL=(c,v)=>{store.set(key(c),v);(localSubs[c]||[]).forEach(f=>f(v.slice()))};
  function start(col,fn){if(mode==='shared'){db.collection(col).orderBy('createdAt','desc').limit(300).onSnapshot(s=>fn(s.docs.map(d=>Object.assign({id:d.id},d.data()))),()=>fn([]))}
    else{(localSubs[col]=localSubs[col]||[]).push(fn);fn(readL(col))}}
  return{
    get mode(){return mode},
    get shared(){return mode==='shared'},
    sub(col,fn){if(mode==='pending')pending.push([col,fn]);else start(col,fn)},
    async add(col,doc){if(mode==='shared')return db.collection(col).add(doc);const v=readL(col);v.unshift(Object.assign({id:uid()},doc));writeL(col,v.slice(0,300))},
    async del(col,id){if(mode==='shared')return db.doc(col+'/'+id).delete();writeL(col,readL(col).filter(x=>x.id!==id))},
    async init(){
      try{if(window.claude&&window.claude.use){[db,userCap]=await Promise.all([window.claude.use('db'),window.claude.use('user')])}}catch(e){db=null}
      try{if(db&&userCap&&userCap.id)me=await userCap.id()}catch(e){me=null}
      mode=db?'shared':'local';if(!db)me='local';connecting=false;
      document.querySelectorAll('[data-storage-note]').forEach(n=>n.textContent=mode==='shared'?'Shared with everyone who visits this museum.':'Saved in this browser only. On the Claude-hosted museum these walls are shared.');
      pending.splice(0).forEach(([c,f])=>start(c,f));
    }
  }})();
async function nameOf(ids){if(!userCap||!userCap.profiles)return;const need=ids.filter(i=>i&&!(i in names));if(!need.length)return;try{const ps=await userCap.profiles(need);for(const i of need)names[i]=(ps&&ps[i]&&ps[i].name)||''}catch(e){}}
const who=id=>id&&names[id]?names[id]:(id&&id===me?'You':'A visitor');

/* ---------- Wing A: Hall ---------- */
let exhibits=[],hallFilter='all';
const dBody=$('#dBody'),dFinish=$('#dFinish');
dBody.innerHTML=Object.entries(BODIES).map(([k,b])=>`<option value="${k}">${esc(b.label)}</option>`).join('');
dFinish.innerHTML=Object.entries(FINISHES).map(([k,f])=>`<option value="${k}">${esc(f.label)}</option>`).join('');
let donateBuild={body:'double',finish:'sunburst',fretboard:'rosewood',pickup:'single'};
function refreshDonatePreview(){donateBuild.body=dBody.value;donateBuild.finish=dFinish.value;if(donateBuild.body==='dread')donateBuild.pickup='piezo';else if(donateBuild.pickup==='piezo')donateBuild.pickup='humbucker';$('#dPreview').innerHTML=drawGuitar(donateBuild)}
dBody.addEventListener('change',refreshDonatePreview);dFinish.addEventListener('change',refreshDonatePreview);
function openDonate(fromBuild){const f=$('#donateForm');f.hidden=false;if(fromBuild){donateBuild={body:guitar.body,finish:guitar.finish,fretboard:guitar.fretboard,pickup:guitar.pickup};dBody.value=guitar.body;dFinish.value=guitar.finish;if(guitar.nick&&!$('#dName').value)$('#dName').value=guitar.nick;
  if(!$('#dModel').value)$('#dModel').value=`${WOODS[guitar.wood].label} ${BODIES[guitar.body].label.toLowerCase()} with ${PICKUPS[guitar.pickup].label.toLowerCase()}, built in the Workshop`}
  $('#dPreview').innerHTML=drawGuitar(donateBuild);$('#dName').focus()}
$('#openDonate').addEventListener('click',()=>openDonate(false));
$('#dUseBuild').addEventListener('click',()=>openDonate(true));
$('#dCancel').addEventListener('click',()=>{$('#donateForm').hidden=true;$('#dMsg').textContent=''});
$$('input[name=hallFilter]').forEach(r=>r.addEventListener('change',()=>{hallFilter=r.value;renderHall()}));
refreshDonatePreview();

async function renderHall(){
  const box=$('#exhibits'),msg=$('#hallMsg');
  let list=exhibits.filter(x=>hallFilter==='all'||(hallFilter==='live')===!!(STATUS[x.status]||{}).live);
  if(connecting){msg.textContent='Opening the doors…';return}
  msg.textContent=exhibits.length?`${list.length} of ${exhibits.length} exhibits`:'No exhibits yet. Donate the first guitar.';
  await nameOf([...new Set(list.map(x=>x.by).filter(Boolean))]);
  box.innerHTML=list.map(x=>{const st=STATUS[x.status]||STATUS.playing,live=!!st.live;const songs=(Array.isArray(x.songs)?x.songs:[]).slice(0,8);
    return `<article class="exhibit${live?'':' gone'}" data-exhibit="${esc(x.id)}">
      <div>${drawGuitar(x.build)}</div>
      <div class="inner">
        <div class="row" style="gap:6px"><span class="chip ${live?'live':'gone'}">${esc(st.label)}</span>${x.sample?'<span class="chip sample">Sample exhibit</span>':''}</div>
        <h3>${esc(x.name)}</h3>
        <p class="mono">${esc(x.model||'Guitar')}${x.year?' · since '+esc(x.year):''}</p>
        <p class="story">${esc(x.story)}</p>
        ${x.scars?`<p class="scars">Scars: ${esc(x.scars)}</p>`:''}
        ${songs.length?`<div class="songs">${songs.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div>`:''}
        <div class="foot"><span>${x.sample?'Placed by the curator':'Donated by '+esc(who(x.by))}</span>${me&&x.by===me?`<button class="btn ghost small" type="button" data-del="${esc(x.id)}">Remove</button>`:''}</div>
      </div></article>`}).join('');
}
$('#exhibits').addEventListener('click',async e=>{const b=e.target.closest('[data-del]');if(!b)return;if(b.dataset.confirm!=='1'){b.dataset.confirm='1';b.textContent='Click again to remove';return}
  b.disabled=true;try{await Data.del('exhibits',b.dataset.del)}catch(err){b.disabled=false;b.textContent='Could not remove'}});
$('#donateForm').addEventListener('submit',async e=>{e.preventDefault();const m=$('#dMsg');
  const name=$('#dName').value.trim(),story=$('#dStory').value.trim();if(!name||!story){m.className='msg err';m.textContent='Give the guitar a name and a story.';return}
  const doc={name,story,model:$('#dModel').value.trim(),year:$('#dYear').value?String(parseInt($('#dYear').value,10)):'',status:$('#dStatus').value,scars:$('#dScars').value.trim(),
    songs:$('#dSongs').value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,8),build:Object.assign({},donateBuild),by:me||null,createdAt:Date.now()};
  $('#dSubmit').disabled=true;m.className='msg';m.textContent='Hanging it…';
  try{await Data.add('exhibits',doc);m.className='msg ok';m.textContent='It’s on the wall.';$('#donateForm').reset();refreshDonatePreview();setTimeout(()=>{$('#donateForm').hidden=true;m.textContent=''},1400)}
  catch(err){m.className='msg err';m.textContent=err&&err.code==='invalid_argument'?'Your access level lets you look but not donate. Ask the museum’s owner for Contributor access.':err&&err.code==='quota_exceeded'?'The museum is full. Some exhibits need to be removed first.':'The exhibit couldn’t be saved. Try again in a moment.'}
  finally{$('#dSubmit').disabled=false}});

/* ---------- Wing B: Workshop ---------- */
function segGroup(el,name,obj,key){el.innerHTML=Object.entries(obj).map(([k,o])=>`<input type="radio" name="${name}" id="${name}-${k}" value="${k}"><label for="${name}-${k}">${esc(o.label)}</label>`).join('');
  $$('input',el).forEach(i=>i.addEventListener('change',()=>{guitar[key]=i.value;
    if(key==='body'){if(i.value==='dread'){guitar.pickup='piezo';if(guitar.wood==='alder'||guitar.wood==='ash')guitar.wood='spruce'}else if(guitar.pickup==='piezo')guitar.pickup='humbucker'}
    saveG();renderWorkshop()}))}
segGroup($('#optBody'),'body',BODIES,'body');segGroup($('#optWood'),'wood',WOODS,'wood');segGroup($('#optFretboard'),'fretboard',FRETBOARDS,'fretboard');segGroup($('#optPickup'),'pickup',PICKUPS,'pickup');
$('#optFinish').innerHTML=Object.entries(FINISHES).map(([k,f])=>`<input type="radio" name="finish" id="finish-${k}" value="${k}"><label for="finish-${k}"><span class="sw" style="background:${f.sw||f.c}"></span>${esc(f.label)}</label>`).join('');
$$('#optFinish input').forEach(i=>i.addEventListener('change',()=>{guitar.finish=i.value;saveG();renderWorkshop()}));
$('#wsRiff').innerHTML=riffOptions();$('#pbRiff').innerHTML=riffOptions();$('#pbRiff').value='blues';
const nick=$('#wsNick');nick.value=guitar.nick||'';let nt;nick.addEventListener('input',()=>{guitar.nick=nick.value.trim();clearTimeout(nt);nt=setTimeout(saveG,300);$('#wsPlate').textContent=guitar.nick||'Unnamed prototype'});
function renderWorkshop(){
  for(const k of ['body','wood','fretboard','pickup','finish']){const r=$(`#${k}-${guitar[k]}`);if(r)r.checked=true}
  const ac=guitar.body==='dread';$$('#optPickup input').forEach(i=>i.disabled=ac?i.value!=='piezo':i.value==='piezo');
  $('#benchArt').innerHTML=drawGuitar(guitar);$('#wsPlate').textContent=guitar.nick||'Unnamed prototype';
  const B=BODIES[guitar.body],W=WOODS[guitar.wood],P=PICKUPS[guitar.pickup];
  $('#wsSpecs').innerHTML=`<dt>Body</dt><dd>${esc(W.label)} ${esc(B.label.toLowerCase())}</dd><dt>Scale</dt><dd>${B.scale}</dd><dt>Frets</dt><dd>${B.frets}</dd><dt>Board</dt><dd>${esc(FRETBOARDS[guitar.fretboard].label)}</dd><dt>Pickups</dt><dd>${esc(P.label)}</dd><dt>Weight</dt><dd>≈ ${(B.lb*W.lb).toFixed(1)} lb</dd>`;
  $('#wsSound').textContent=`Sound: ${W.note.toLowerCase()}; ${P.note}.`;
}
renderWorkshop();
document.addEventListener('ssm:guitar',()=>{saveG();nick.value=guitar.nick||'';renderWorkshop();renderRig()});
const cleanAmp=()=>({model:guitar.body==='dread'?'direct':'clean',gain:.15,tone:.6,volume:.8});
$('#wsPlayClean').addEventListener('click',()=>Snd.play({guitar,chain:[],amp:cleanAmp()},RIFFS[$('#wsRiff').value].make()));
$('#wsPlayDirt').addEventListener('click',()=>Snd.play({guitar,chain:[mkPedal('od',{drive:.65,tone:.55})],amp:{model:'crunch',gain:.35,tone:.55,volume:.75}},RIFFS[$('#wsRiff').value].make()));
$('#wsToBoard').addEventListener('click',()=>{showWing('pedalboard',true);window.scrollTo({top:$('#wing-pedalboard').offsetTop-20,behavior:'smooth'})});
$('#wsToHall').addEventListener('click',()=>{showWing('hall',true);openDonate(true)});

/* ---------- Wing D: Pedalboard ---------- */
function renderRig(){$('#rigArt').innerHTML=drawGuitar(guitar);$('#rigName').textContent=guitarName(guitar)}
$('#rigChange').addEventListener('click',()=>showWing('workshop',true));
$('#shelf').innerHTML=Object.entries(PEDALS).map(([k,p])=>`<button type="button" data-add="${k}" style="background:${p.color};color:${p.text}">+ ${esc(p.name)} · ${esc(p.kind)}</button>`).join('');
$('#shelf').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;if(board.chain.length>=8){$('#boardMsg').textContent='The board holds eight pedals. Remove one first.';return}board.chain.push(mkPedal(b.dataset.add));saveB();renderBoard()});
$('#pbPreset').innerHTML+=Object.entries(PRESETS).map(([k,p])=>`<option value="${k}">${esc(p.label)}</option>`).join('');
$('#pbPreset').addEventListener('change',e=>{const p=PRESETS[e.target.value];if(!p)return;board={chain:p.chain.map(([t,pr])=>mkPedal(t,pr)),amp:Object.assign({},p.amp)};saveB();renderBoard();e.target.value=''});
$('#pbClear').addEventListener('click',()=>{board.chain=[];saveB();renderBoard()});
const fmt=(k,v)=>k==='time'?Math.round(v*1000)+' ms':k==='rate'?v.toFixed(1)+' Hz':k==='size'?v.toFixed(1)+' s':Math.round(v*10)+'';
function renderBoard(){
  const c=$('#chain');
  c.innerHTML=`<div class="jack">${drawGuitar(guitar).replace('<svg','<svg style="width:28px;height:auto"')}Guitar<br>in</div>`+
  board.chain.map((pd,i)=>{const P=PEDALS[pd.type];return `<div class="pedal${pd.on?'':' off'}" draggable="true" data-i="${i}" style="background:linear-gradient(180deg,${shade(P.color,.12)},${P.color} 30%,${shade(P.color,-.18)});color:${P.text}">
    <div class="pctl"><button type="button" data-mv="-1" aria-label="Move ${esc(P.name)} left">‹</button><span class="pk">${i+1}</span><button type="button" data-mv="1" aria-label="Move ${esc(P.name)} right">›</button><button type="button" data-rm aria-label="Remove ${esc(P.name)}">×</button></div>
    <div><p class="pn">${esc(P.name)}</p><p class="pk">${esc(P.kind)}</p></div>
    ${Object.entries(P.knobs).map(([k,[a,b]])=>`<label class="knob"><span>${k} · <output>${fmt(k,pd.p[k])}</output></span><input type="range" min="${a}" max="${b}" step="${(b-a)/100}" value="${pd.p[k]}" data-k="${k}" id="k-${pd.uid}-${k}"></label>`).join('')}
    <div class="led${pd.on?' on':''}"></div>
    <button class="foot" type="button" data-fs aria-pressed="${pd.on}" aria-label="${pd.on?'Bypass':'Engage'} ${esc(P.name)}"></button></div>`}).join('')+
  `<div class="amp"><div class="grill"></div><label class="knob"><span>Amp</span><select id="ampModel"><option value="clean">Clean combo</option><option value="crunch">British crunch stack</option><option value="direct">Direct (acoustic)</option></select></label>
   ${['gain','tone','volume'].map(k=>`<label class="knob"><span>${k} · <output>${Math.round(board.amp[k]*10)}</output></span><input type="range" min="0" max="1" step=".01" value="${board.amp[k]}" data-amp="${k}" id="amp-${k}"></label>`).join('')}</div>`;
  $('#ampModel').value=board.amp.model;renderRig();
}
const chainEl=$('#chain');
chainEl.addEventListener('input',e=>{const t=e.target;if(t.dataset.amp){board.amp[t.dataset.amp]=+t.value;t.previousElementSibling.querySelector('output').textContent=Math.round(t.value*10)}
  else if(t.dataset.k){const pd=board.chain[+t.closest('.pedal').dataset.i];pd.p[t.dataset.k]=+t.value;t.previousElementSibling.querySelector('output').textContent=fmt(t.dataset.k,+t.value)}saveB()});
chainEl.addEventListener('change',e=>{if(e.target.id==='ampModel'){board.amp.model=e.target.value;saveB()}});
chainEl.addEventListener('click',e=>{const pe=e.target.closest('.pedal');if(!pe)return;const i=+pe.dataset.i;
  if(e.target.closest('[data-fs]')){board.chain[i].on=!board.chain[i].on}
  else if(e.target.closest('[data-rm]')){board.chain.splice(i,1)}
  else if(e.target.closest('[data-mv]')){const j=i+ +e.target.closest('[data-mv]').dataset.mv;if(j<0||j>=board.chain.length)return;[board.chain[i],board.chain[j]]=[board.chain[j],board.chain[i]]}
  else return;saveB();renderBoard()});
let dragI=null;
chainEl.addEventListener('dragstart',e=>{const pe=e.target.closest('.pedal');if(!pe||e.target.tagName==='INPUT'){return}dragI=+pe.dataset.i;pe.classList.add('drag');try{e.dataTransfer.setData('text/plain',String(dragI));e.dataTransfer.effectAllowed='move'}catch(err){}});
chainEl.addEventListener('dragover',e=>{const pe=e.target.closest('.pedal');if(dragI==null||!pe)return;e.preventDefault();$$('.pedal.over').forEach(x=>x.classList.remove('over'));pe.classList.add('over')});
chainEl.addEventListener('drop',e=>{const pe=e.target.closest('.pedal');if(dragI==null||!pe)return;e.preventDefault();const j=+pe.dataset.i;const [m]=board.chain.splice(dragI,1);board.chain.splice(j,0,m);dragI=null;saveB();renderBoard()});
chainEl.addEventListener('dragend',()=>{dragI=null;$$('.pedal').forEach(x=>x.classList.remove('drag','over'))});
$('#pbPlay').addEventListener('click',()=>Snd.play({guitar,chain:board.chain,amp:board.amp},RIFFS[$('#pbRiff').value].make()));
renderBoard();

let boards=[];
async function renderBoards(){const w=$('#boardWall');
  if(!boards.length){w.innerHTML='<p class="msg">No shared rigs yet. Name yours and share it.</p>';return}
  await nameOf([...new Set(boards.map(b=>b.by).filter(Boolean))]);
  w.innerHTML=boards.map(b=>`<div class="wall-item"><h4>${esc(b.name)}</h4><div class="dots">${(b.chain||[]).filter(p=>PEDALS[p.type]).map(p=>`<i title="${esc(PEDALS[p.type].name)}" style="background:${PEDALS[p.type].color};opacity:${p.on?1:.35}"></i>`).join('')}</div>
    <p class="msg">${(b.chain||[]).filter(p=>PEDALS[p.type]).map(p=>esc(PEDALS[p.type].kind)).join(' → ')||'No pedals'} → ${esc({clean:'clean amp',crunch:'crunch amp',direct:'direct'}[b.amp&&b.amp.model]||'amp')}</p>
    <p class="mono">${esc(b.guitar?guitarName(b.guitar):'')}</p><p class="msg">Shared by ${esc(who(b.by))}</p>
    <div class="row"><button class="btn small" type="button" data-listen="${esc(b.id)}">Listen</button><button class="btn ghost small" type="button" data-load="${esc(b.id)}">Load on my board</button>${me&&b.by===me?`<button class="btn ghost small" type="button" data-bdel="${esc(b.id)}">Remove</button>`:''}</div></div>`).join('')}
function cleanRig(b){return{chain:(b.chain||[]).filter(p=>PEDALS[p.type]).map(p=>mkPedal(p.type,p.p,p.on!==false)),amp:Object.assign({model:'clean',gain:.2,tone:.6,volume:.8},b.amp||{}),guitar:Object.assign({},guitar,b.guitar||{})}}
$('#boardWall').addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;const id=t.dataset.listen||t.dataset.load||t.dataset.bdel;const b=boards.find(x=>x.id===id);if(!b)return;
  if(t.dataset.listen){const r=cleanRig(b);Snd.play(r,RIFFS[$('#pbRiff').value].make())}
  else if(t.dataset.load){const r=cleanRig(b);board={chain:r.chain,amp:r.amp};saveB();renderBoard();$('#boardMsg').className='msg ok';$('#boardMsg').textContent=`Loaded “${b.name}” onto your board.`}
  else if(t.dataset.bdel){if(t.dataset.confirm!=='1'){t.dataset.confirm='1';t.textContent='Click again';return}try{await Data.del('boards',id)}catch(err){t.textContent='Could not remove'}}});
$('#shareBoard').addEventListener('submit',async e=>{e.preventDefault();const m=$('#boardMsg');
  const name=$('#boardName').value.trim();if(!name){m.className='msg err';m.textContent='Give your rig a name first.';return}
  try{await Data.add('boards',{name,chain:board.chain.map(p=>({type:p.type,p:p.p,on:p.on})),amp:board.amp,guitar:{body:guitar.body,wood:guitar.wood,fretboard:guitar.fretboard,pickup:guitar.pickup,finish:guitar.finish,nick:guitar.nick||''},by:me||null,createdAt:Date.now()});
    m.className='msg ok';m.textContent='Shared on the wall.';$('#boardName').value=''}catch(err){m.className='msg err';m.textContent=err&&err.code==='invalid_argument'?'Your access level lets you look but not share. Ask the owner for Contributor access.':'The rig couldn’t be shared. Try again in a moment.'}});

/* ---------- Wing C: Riff Roulette ---------- */
const KEYS=['E minor','A minor','G major','D major','C major','F♯ minor','B♭ major','D minor','E major','A major'];
const MOODS=['Desert highway','Rainy window','Victory lap','3 a.m. diner','Haunted carnival','First day of summer','Late train home','Boss fight','Slow dance','Road trip singalong'];
const RULES=['Only three strings','Must use a slide','No open strings','One note repeats eight times','Only downstrokes','Stay above the 12th fret','Use exactly four notes','End on the wrong note on purpose','Thumb only','Include a two-beat silence'];
const PC={C:0,'C♯':1,D:2,'E♭':3,E:4,F:5,'F♯':6,G:7,'A♭':8,A:9,'B♭':10,B:11};
let prompt={key:'E minor',tempo:96,mood:'Desert highway',rule:'Only three strings'};
const pickR=a=>a[Math.floor(Math.random()*a.length)];
function paintPrompt(){document.dispatchEvent(new CustomEvent('ssm:prompt',{detail:prompt}));$('#rKey').textContent=prompt.key;$('#rTempo').textContent=prompt.tempo+' BPM';$('#rMood').textContent=prompt.mood;$('#rRule').textContent=prompt.rule}
$('#spin').addEventListener('click',()=>{const reels=$$('.reel');const final={key:pickR(KEYS),tempo:64+4*Math.floor(Math.random()*25),mood:pickR(MOODS),rule:pickR(RULES)};
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduce){prompt=final;paintPrompt();return}
  reels.forEach(r=>r.classList.add('spinning'));let n=0;$('#spin').disabled=true;
  const iv=setInterval(()=>{n++;const tmp={key:n<10?pickR(KEYS):final.key,tempo:n<14?64+4*Math.floor(Math.random()*25):final.tempo,mood:n<18?pickR(MOODS):final.mood,rule:n<22?pickR(RULES):final.rule};prompt=tmp;paintPrompt();
    Snd.click(false);if(n===10)reels[0].classList.remove('spinning');if(n===14)reels[1].classList.remove('spinning');if(n===18)reels[2].classList.remove('spinning');
    if(n>=22){clearInterval(iv);reels[3].classList.remove('spinning');prompt=final;paintPrompt();$('#spin').disabled=false;Snd.click(true)}},70)});
$('#hearKey').addEventListener('click',()=>{const [r,q]=prompt.key.split(' '),pc=PC[r]??4,minor=q==='minor',root=40+((pc-4+12)%12);
  const notes=[root,root+7,root+12,root+12+(minor?3:4),root+19],b=60/prompt.tempo,ev=[];
  [0,1,2,3].forEach(i=>notes.forEach((m,k)=>ev.push({t:i*b+k*.014,s:k,midi:m,v:i?.7:.9})));
  Snd.play({guitar,chain:[],amp:cleanAmp()},ev)});
let metroT=null;$('#metro').addEventListener('click',e=>{const b=e.currentTarget;if(metroT){clearInterval(metroT);metroT=null;b.textContent='Metronome: off';b.setAttribute('aria-pressed','false');return}
  let beat=0;Snd.click(true);metroT=setInterval(()=>{beat=(beat+1)%4;Snd.click(beat===0)},60000/prompt.tempo);b.textContent=`Metronome: ${prompt.tempo} BPM`;b.setAttribute('aria-pressed','true')});
const TAB_TEMPLATE=`e|--------------------------------|
B|--------------------------------|
G|--------------------------------|
D|--------------5---7---5---------|
A|------5---7-------------7---5---|
E|--0-3-------------------------0-|`;
$('#tabIn').value=store.get('ssm.tab',TAB_TEMPLATE);$('#tabIn').addEventListener('input',()=>store.set('ssm.tab',$('#tabIn').value));
function parseTab(text,tempo){
  const lines=text.split('\n').filter(l=>l.includes('-')).slice(0,6);const ev=[];const step=60/tempo/4;
  lines.forEach((raw,li)=>{const s=5-li;const l=raw.replace(/^\s*[a-gA-G][#b♯♭]?\s*\|?/,'').replace(/^\|/,'');
    for(let i=0;i<l.length;i++){const ch=l[i];if(ch>='0'&&ch<='9'){let f=ch;if(l[i+1]>='0'&&l[i+1]<='9'){f+=l[i+1];}const fr=parseInt(f,10);if(fr<=24)ev.push({t:i*step,s,midi:OPEN[s]+fr,v:.85});i+=f.length-1}}});
  return ev.sort((a,b)=>a.t-b.t)}
$('#playTab').addEventListener('click',()=>{const ev=parseTab($('#tabIn').value,prompt.tempo),m=$('#riffMsg');if(!ev.length){m.className='msg err';m.textContent='No fret numbers found. Write numbers on the six lines, like 0, 3 or 12.';return}
  m.className='msg';m.textContent=`Playing ${ev.length} notes at ${prompt.tempo} BPM through your board.`;Snd.play({guitar,chain:board.chain,amp:board.amp},ev)});
let riffs=[];
async function renderRiffs(){const w=$('#riffWall');
  if(!riffs.length){w.innerHTML='<p class="msg">No riffs posted yet. Be the first.</p>';return}
  await nameOf([...new Set(riffs.map(r=>r.by).filter(Boolean))]);
  w.innerHTML=riffs.map(r=>`<div class="wall-item"><h4>${esc(r.title)}</h4><div class="row" style="gap:6px">${['key','mood','rule'].map(k=>r.prompt&&r.prompt[k]?`<span class="chip">${esc(r.prompt[k])}</span>`:'').join('')}${r.prompt&&r.prompt.tempo?`<span class="chip">${esc(r.prompt.tempo)} BPM</span>`:''}</div>
    <pre>${esc(r.tab)}</pre><div class="row"><button class="btn small" type="button" data-rplay="${esc(r.id)}">Play</button><button class="btn ghost small" type="button" data-rtry="${esc(r.id)}">Take this prompt</button><span class="msg">by ${esc(who(r.by))}</span>${me&&r.by===me?`<button class="btn ghost small" type="button" data-rdel="${esc(r.id)}">Remove</button>`:''}</div></div>`).join('')}
$('#riffWall').addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;const id=t.dataset.rplay||t.dataset.rtry||t.dataset.rdel,r=riffs.find(x=>x.id===id);if(!r)return;
  if(t.dataset.rplay)Snd.play({guitar,chain:board.chain,amp:board.amp},parseTab(r.tab,(r.prompt&&+r.prompt.tempo)||100));
  else if(t.dataset.rtry){prompt=Object.assign({},prompt,r.prompt,{tempo:+(r.prompt&&r.prompt.tempo)||prompt.tempo});paintPrompt();window.scrollTo({top:$('#reels').offsetTop-20,behavior:'smooth'})}
  else if(t.dataset.rdel){if(t.dataset.confirm!=='1'){t.dataset.confirm='1';t.textContent='Click again';return}try{await Data.del('riffs',id)}catch(err){t.textContent='Could not remove'}}});
$('#postRiff').addEventListener('click',async()=>{const m=$('#riffMsg');
  const tab=$('#tabIn').value.trim(),title=$('#riffTitle').value.trim();if(!title){m.className='msg err';m.textContent='Give your riff a title first.';return}
  if(!parseTab(tab,100).length){m.className='msg err';m.textContent='Your tab has no notes yet.';return}
  try{await Data.add('riffs',{title,tab:tab.slice(0,3000),prompt:Object.assign({},prompt),by:me||null,createdAt:Date.now()});m.className='msg ok';m.textContent='Posted to the wall.';$('#riffTitle').value=''}
  catch(err){m.className='msg err';m.textContent=err&&err.code==='invalid_argument'?'Your access level lets you look but not post. Ask the owner for Contributor access.':'The riff couldn’t be posted. Try again in a moment.'}});

/* ---------- Wing E: Tone Detective ---------- */
const CASES=[
  {name:'Surf twang',hint:'Offset single-coils, tremolo, drenched reverb',g:{body:'offset',wood:'alder',fretboard:'rosewood',pickup:'single',finish:'seafoam'},chain:PRESETS.surf.chain,amp:PRESETS.surf.amp,riff:'lead',why:'Single-coils give the glassy attack. A wide reverb and a pulsing tremolo make the wet, wobbly surf sound.'},
  {name:'Fuzz wall',hint:'Humbuckers slammed into a fuzz',g:{body:'double',wood:'mahogany',fretboard:'rosewood',pickup:'humbucker',finish:'black'},chain:[['fuzz',{fuzz:.9,level:.45}]],amp:{model:'crunch',gain:.3,tone:.5,volume:.75},riff:'chug',why:'Fuzz clips the signal almost into a square wave, so notes turn buzzy and thick. Humbuckers push it even harder.'},
  {name:'Blues crunch',hint:'Single-cut humbuckers, light overdrive',g:{body:'single',wood:'mahogany',fretboard:'rosewood',pickup:'humbucker',finish:'sunburst'},chain:PRESETS.blues.chain,amp:PRESETS.blues.amp,riff:'blues',why:'A light overdrive into a crunchy amp breaks up only when you dig in. Mahogany and humbuckers keep it warm.'},
  {name:'Campfire acoustic',hint:'Dreadnought, piezo, a touch of room',g:{body:'dread',wood:'spruce',fretboard:'rosewood',pickup:'piezo',finish:'natural'},chain:[['reverb',{size:1.5,mix:.2}]],amp:{model:'direct',gain:0,tone:.55,volume:.85},riff:'campfire',why:'No amp at all. The dreadnought body boosts the lows around 100 Hz and the spruce top keeps it ringing.'},
  {name:'Funk quack',hint:'Compressed single-coils into auto-wah',g:{body:'double',wood:'alder',fretboard:'maple',pickup:'single',finish:'white'},chain:PRESETS.funk.chain,amp:PRESETS.funk.amp,riff:'chug',why:'A sweeping band-pass filter makes the vowel-like quack. The compressor evens out every note so the rhythm stays tight.'},
  {name:'80s arena lead',hint:'Maple and humbuckers, drive, chorus, long delay',g:{body:'double',wood:'maple',fretboard:'maple',pickup:'humbucker',finish:'cherry'},chain:PRESETS.lead80.chain,amp:PRESETS.lead80.amp,riff:'lead',why:'Overdrive for sustain, chorus to widen it, and a delay just under half a second so each note echoes behind the next.'},
  {name:'Shoegaze haze',hint:'Fuzz, deep chorus, huge reverb',g:{body:'offset',wood:'alder',fretboard:'rosewood',pickup:'single',finish:'sonic'},chain:PRESETS.shoegaze.chain,amp:PRESETS.shoegaze.amp,riff:'arp',why:'A five-second reverb swallows every note. The fuzz and slow chorus blur the edges until the chords melt together.'},
  {name:'Jazz box',hint:'Hollowbody, neck humbucker, tone rolled off',g:{body:'hollow',wood:'mahogany',fretboard:'ebony',pickup:'humbucker',finish:'sunburst'},chain:[],amp:{model:'clean',gain:0,tone:.2,volume:.85},riff:'arp',why:'A hollow body with the tone knob turned down leaves a round, dark note with little high end and a short decay.'},
  {name:'Country snap',hint:'Ash single-coils, squeezed, with slapback',g:{body:'double',wood:'ash',fretboard:'maple',pickup:'single',finish:'natural'},chain:[['comp',{sustain:.75,level:.6}],['delay',{time:.11,feedback:.08,mix:.35}]],amp:{model:'clean',gain:.15,tone:.85,volume:.8},riff:'blues',why:'A bright ash body, a compressor for snap, and a single fast echo around 110 ms. That echo is called slapback.'},
  {name:'Garage P-90 grit',hint:'P-90s straight into a cranked amp',g:{body:'double',wood:'mahogany',fretboard:'rosewood',pickup:'p90',finish:'oxblood'},chain:[],amp:{model:'crunch',gain:.75,tone:.6,volume:.7},riff:'chug',why:'No pedals at all. P-90s have raw mids, and the amp is doing all the distorting.'}
];
const RANKS=[[8,'Golden ears'],[6,'Gear nerd'],[4,'Studio regular'],[2,'Open-mic hopeful'],[0,'Tone tourist']];
let det=null;
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const caseRig=c=>({guitar:Object.assign({},c.g),chain:c.chain.map(([t,p])=>mkPedal(t,p)),amp:Object.assign({},c.amp)});
function detStart(){const order=shuffle(CASES.map((_,i)=>i)).slice(0,8);det={order,round:0,score:0,answered:null,choices:null};detRound()}
function detRound(){const ci=det.order[det.round];const others=shuffle(CASES.map((_,i)=>i).filter(i=>i!==ci)).slice(0,2);det.choices=shuffle([ci,...others]);det.answered=null;renderDet()}
function renderDet(){const el=$('#detective');
  if(!det){el.innerHTML=`<div class="panel" style="display:grid;gap:12px"><h3>Case files: 8 tones</h3><p>You’ll hear a short riff. Three rigs are on the table. One of them made the sound.</p><div class="row"><button class="btn" type="button" id="detGo">Open the first case</button></div></div>`;$('#detGo').addEventListener('click',detStart);return}
  if(det.round>=det.order.length){const rank=RANKS.find(([n])=>det.score>=n)[1];el.innerHTML=`<div class="panel" style="display:grid;gap:12px"><p class="eyebrow">Case closed</p><h3>${det.score} of ${det.order.length} · ${esc(rank)}</h3><p>Every rig you heard is on the pedalboard’s preset list or one click away from it. Try rebuilding the ones you missed.</p><div class="row"><button class="btn" type="button" id="detAgain">Play again</button></div></div>`;$('#detAgain').addEventListener('click',detStart);return}
  const ci=det.order[det.round],c=CASES[ci];
  el.innerHTML=`<div class="row" style="justify-content:space-between"><p class="eyebrow">Case ${det.round+1} of ${det.order.length}</p><p class="score">Score ${det.score}</p></div>
   <div class="row"><button class="btn" type="button" id="detPlay">Play the mystery tone</button><button class="btn ghost" type="button" data-stop2>Stop</button></div>
   <div class="choices">${det.choices.map(i=>{const x=CASES[i];let cls='';if(det.answered!=null){if(i===ci)cls=' right';else if(i===det.answered)cls=' wrong'}
     return `<button class="choice${cls}" type="button" data-pick="${i}" ${det.answered!=null?'disabled':''}><b>${esc(x.name)}</b><small>${esc(x.hint)}</small></button>`}).join('')}</div>
   ${det.answered!=null?`<div class="verdict" style="display:grid;gap:8px"><p><strong>${det.answered===ci?'Solved.':'Not quite. It was '+esc(c.name)+'.'}</strong> ${esc(c.why)}</p><p class="mono">${esc(guitarName(c.g))} → ${c.chain.map(([t])=>esc(PEDALS[t].name)).join(' → ')||'no pedals'} → ${esc({clean:'clean amp',crunch:'crunch amp',direct:'direct'}[c.amp.model])}</p>
     <div class="row"><button class="btn" type="button" id="detNext">${det.round+1<det.order.length?'Next case':'See your score'}</button><button class="btn ghost" type="button" id="detLoad">Load this rig on the pedalboard</button></div></div>`:''}`;
  $('#detPlay').addEventListener('click',()=>Snd.play(caseRig(c),RIFFS[c.riff].make()));
  $('[data-stop2]').addEventListener('click',()=>Snd.stopAll());
  $$('[data-pick]',el).forEach(b=>b.addEventListener('click',()=>{if(det.answered!=null)return;det.answered=+b.dataset.pick;if(det.answered===ci)det.score++;renderDet()}));
  if(det.answered!=null){$('#detNext').addEventListener('click',()=>{det.round++;if(det.round<det.order.length)detRound();else renderDet()});
    $('#detLoad').addEventListener('click',()=>{const r=caseRig(c);board={chain:r.chain,amp:r.amp};guitar=Object.assign({},guitar,c.g,{nick:guitar.nick});saveB();saveG();renderBoard();renderWorkshop();showWing('pedalboard',true)})}
}
renderDet();

/* ---------- Connect shared data ---------- */
renderHall();
Data.sub('exhibits',v=>{exhibits=v;renderHall();document.dispatchEvent(new CustomEvent('ssm:exhibits',{detail:v}))});Data.sub('riffs',v=>{riffs=v;renderRiffs()});Data.sub('boards',v=>{boards=v;renderBoards()});
window.SSM={$,$$,esc,store,uid,Snd,OPEN,CH,strum,note,drawGuitar,shade,BODIES,WOODS,FRETBOARDS,PICKUPS,FINISHES,PEDALS,mkPedal,showWing,Data,nameOf,who,
  getGuitar:()=>guitar,cleanAmp:()=>cleanAmp(),get me(){return me},RIFFS,STATUS,
  getBoard:()=>board,getExhibits:()=>exhibits,getPrompt:()=>prompt,
  toggleBypass(i){if(board.chain[i]){board.chain[i].on=!board.chain[i].on;saveB();renderBoard()}},
  playBoard(){Snd.play({guitar,chain:board.chain,amp:board.amp},RIFFS[$('#pbRiff').value].make())},
  playClean(key){Snd.play({guitar,chain:[],amp:cleanAmp()},RIFFS[key||'campfire'].make())},
  focusExhibit(id){const el=document.querySelector(`[data-exhibit="${id}"]`);if(el){el.scrollIntoView({block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600)}},
  openDonate:()=>openDonate(false)};
setTimeout(()=>Data.init(),0);
})();
