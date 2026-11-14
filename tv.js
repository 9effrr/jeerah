/* جيرة — big-screen host. Runs the game; phones join through join.html */
(function(){
'use strict';
const {T,ROLES,SPECIALS,ROLE_ORDER,MIN,MAX}=window.JDATA;
const PUBLIC='https://9effrr.github.io/jeerah/';
const store={get(k,d){try{const v=localStorage.getItem('jeerah:'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('jeerah:'+k,JSON.stringify(v))}catch(e){}}};

const UI={lang:store.get('lang','ar'),sound:store.get('sound',true),cfg:Object.assign({sabs:0,timer:180,roles:{smart:true,fixer:true,legal:true,solid:true,complainer:true}},store.get('cfg',{}))};
function t(k,v){let s=(T[UI.lang][k]!=null?T[UI.lang][k]:T.ar[k]);if(s==null)s=k;if(v)for(const key in v)s=s.split('{'+key+'}').join(v[key]);return s}
function tg(k,g,v){return t(g==='f'&&T[UI.lang][k+'_f']!=null?k+'_f':k,v)}
function rn(r,g){return tg('r_'+r,g)}
function art(r,g,kind){return 'assets/ch/'+r+(g==='f'?'-f':'')+'-'+kind+'.webp'}
function num(n){return UI.lang==='ar'?Number(n).toLocaleString('ar-EG',{useGrouping:false}):String(n)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[Math.floor(Math.random()*A.length)];return s}
function apt(i){return (Math.floor(i/2)+1)*100+(i%2)+1}
function fmt(s){const m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x}
const teamCol=r=>{const tm=ROLES[r].team;return tm==='sab'?'var(--bad)':tm==='solo'?'var(--solo)':'var(--good)'};

/* ---------- audio ---------- */
const audio={};let voNow=null,bgm=null;
function snd(name,vol){if(!UI.sound)return null;try{let a=audio[name];if(!a){a=audio[name]=new Audio('assets/audio/'+name+'.mp3')}a.currentTime=0;a.volume=vol==null?.6:vol;const p=a.play();if(p&&p.catch)p.catch(()=>{});return a}catch(e){return null}}
function vo(n){stopVo();if(UI.lang!=='ar')return;voNow=snd(n,1)}
function stopVo(){if(voNow){try{voNow.pause()}catch(e){}voNow=null}}
function music(on){try{if(on&&UI.sound){if(!bgm){bgm=new Audio('assets/audio/bgm.mp3');bgm.loop=true;bgm.volume=.16}const p=bgm.play();if(p&&p.catch)p.catch(()=>{})}else if(bgm)bgm.pause()}catch(e){}}

/* ---------- game state ---------- */
let G=null,net=null;
const conns={}; // cid -> pid
function fresh(code){return{code,phase:'lobby',round:0,players:[],hostPid:null,legal:{kill:false,save:false},lastProtect:null,immune:null,night:null,votes:{},sus:{},report:[],tally:[],verdict:null,second:null,winner:null,soloPid:null,left:0,paused:false}}
function save(){try{const c=JSON.parse(JSON.stringify(G));c.players.forEach(p=>{p.cid=null;p.online=false});sessionStorage.setItem('jeerah:tv',JSON.stringify({at:Date.now(),G:c}))}catch(e){}}
const P=pid=>G.players.find(p=>p.pid===pid);
const alive=()=>G.players.filter(p=>p.alive);

function compose(n){
  const auto=n<=6?1:n<=9?2:n<=13?3:4,maxS=Math.max(1,Math.ceil(n/2)-1);
  const sabs=Math.min(maxS,Math.max(1,UI.cfg.sabs||auto));
  let sp=SPECIALS.filter(r=>UI.cfg.roles[r]&&n>=ROLES[r].min);
  while(sabs+sp.length>n)sp.pop();
  return{sabs,sp,res:n-sabs-sp.length};
}
function deal(){
  const ps=G.players,c=compose(ps.length);
  const pool=shuffle(Array(c.sabs).fill('saboteur').concat(c.sp).concat(Array(c.res).fill('resident')));
  ps.forEach((p,i)=>{p.role=pool[i];p.alive=true;p.ready=false;p.apt=apt(i)});
  Object.assign(G,{phase:'roles',round:1,legal:{kill:false,save:false},lastProtect:null,immune:null,night:null,votes:{},sus:{},report:[],tally:[],verdict:null,second:null,winner:null,soloPid:null});
  snd('Ding',.4);
}
function startNight(){
  G.phase='night';G.immune=null;
  G.night={sab:{},protect:null,kill:null,writ:null,smart:{},acted:{}};
  vo(G.round===1?'voEvening':'voPostEvening');music(true);
}
function needsAct(p){return p.alive}
function allActed(){return alive().every(p=>G.night.acted[p.pid])}
function sabTarget(){
  const v=Object.values(G.night.sab);if(!v.length)return null;
  const c={};let best=null,bn=0;v.forEach(x=>{c[x]=(c[x]||0)+1});v.forEach(x=>{if(c[x]>=bn){bn=c[x];best=x}});return best;
}
function resolveNight(){
  const n=G.night,rep=[],target=sabTarget();
  G.lastProtect=n.protect;
  if(n.kill!=null){P(n.kill).alive=false;rep.push({k:'mornLegal',pid:n.kill})}
  if(target!=null&&target!==n.kill){
    if(target===n.protect||target===n.writ)rep.push({k:'mornSaved'});
    else{P(target).alive=false;rep.unshift({k:'mornHit',pid:target})}
  }
  if(n.writ!=null&&P(n.writ).alive){G.immune=n.writ;rep.push({k:'mornWrit',pid:n.writ,plain:true})}
  if(!rep.length)rep.push({k:'mornQuiet'});
  G.report=rep;G.phase='morning';music(false);vo('voMorning');
}
function checkWin(){
  if(G.winner)return G.winner;
  const a=alive(),s=a.filter(p=>p.role==='saboteur').length,o=a.length-s;
  if(s===0)G.winner='good';else if(s>=o)G.winner='sab';
  return G.winner;
}
function startCouncil(){G.phase='council';G.left=UI.cfg.timer;G.paused=false;vo('voCouncil')}
function startVote(){stopVo();G.phase='vote';G.votes={}}
function allVoted(){return alive().every(p=>p.pid in G.votes)}
function doTally(){
  const c={};Object.values(G.votes).forEach(x=>{if(x)c[x]=(c[x]||0)+1});
  const rows=Object.keys(c).map(pid=>({pid,n:c[pid]})).sort((a,b)=>b.n-a.n);
  const top=rows.length?rows[0].n:0,tied=rows.filter(r=>r.n===top).length>1;
  G.tally=rows;G.verdict=(!rows.length||tied)?null:rows[0].pid;G.phase='tally';snd('ding_deep',.4);
}
function doVerdict(){
  G.phase='verdict';G.second=null;
  if(G.verdict==null)return;
  const p=P(G.verdict);p.alive=false;
  if(p.role==='complainer'){G.winner='solo';G.soloPid=p.pid}
  snd(p.role==='saboteur'?'chimes':'negative_sound',.45);
}
function endGame(){G.phase='end';music(false);const w=G.winner;vo(w==='good'?'voWinGood':w==='sab'?'voWinSab':'voWinJester')}

/* primary action (TV button, keyboard, host phone) */
function primary(){
  const ph=G.phase;
  if(ph==='lobby'){if(G.players.length>=MIN){deal()}else return}
  else if(ph==='roles'){startNight()}
  else if(ph==='night'){resolveNight()}
  else if(ph==='morning'){if(checkWin())endGame();else startCouncil()}
  else if(ph==='council'){startVote()}
  else if(ph==='vote'){doTally()}
  else if(ph==='tally'){doVerdict()}
  else if(ph==='verdict'){
    const p=G.verdict!=null?P(G.verdict):null;
    if(G.winner)endGame();
    else if(p&&p.role==='solid'&&!G.second&&alive().length){G.phase='solid'}
    else if(checkWin())endGame();
    else{G.round++;startNight()}
  }
  else if(ph==='solid'){return}
  else if(ph==='end'){deal()}
  update();
}
function primaryLabel(){
  const ph=G.phase;
  return{lobby:t('p_start'),roles:t('eveBtn'),night:t('nightDoneB'),morning:t('toCouncil'),council:t('p_skipTimer'),vote:t('voteDoneB'),tally:t('verdictBtn'),verdict:G.winner?t('cont'):t('toNight'),solid:'',end:t('p_newRound')}[ph];
}
function primaryReady(){
  const ph=G.phase;
  if(ph==='lobby')return G.players.length>=MIN;
  if(ph==='solid')return false;
  return true;
}

/* ---------- phone views ---------- */
function opts(filter,p){return alive().filter(filter).map(x=>({pid:x.pid,name:x.name,apt:x.apt}))}
function viewFor(p){
  const v={t:'state',lang:UI.lang,phase:G.phase,round:G.round,code:G.code,
    me:{pid:p.pid,name:p.name,g:p.g,apt:p.apt,alive:p.alive!==false,role:G.phase==='lobby'?null:p.role},
    host:G.hostPid===p.pid,ctl:G.hostPid===p.pid&&primaryReady()?primaryLabel():null};
  const ph=G.phase;
  if(ph==='lobby'){v.players=G.players.map(x=>({name:x.name,g:x.g}));v.min=MIN;return v}
  if(ph==='roles'){v.mates=p.role==='saboteur'?G.players.filter(x=>x.role==='saboteur'&&x.pid!==p.pid).map(x=>x.name):[];v.ready=!!p.ready;return v}
  if(ph==='night'){
    const n=G.night;
    if(!p.alive){v.view='out';return v}
    if(n.acted[p.pid]){v.view='wait';if(n.smart[p.pid])v.smart=n.smart[p.pid];v.left=alive().filter(x=>!n.acted[x.pid]).length;return v}
    v.view='task';
    if(p.role==='saboteur'){v.kind='sab';v.options=opts(x=>x.role!=='saboteur');
      v.partner=Object.keys(n.sab).filter(k=>k!==p.pid).map(k=>({name:P(k).name,target:P(n.sab[k]).name}));}
    else if(p.role==='fixer'){v.kind='fix';v.options=alive().map(x=>({pid:x.pid,name:x.name,apt:x.apt,off:x.pid===G.lastProtect}))}
    else if(p.role==='smart'){v.kind='smart';v.options=opts(x=>x.pid!==p.pid)}
    else if(p.role==='legal'){v.kind='legal';v.used=G.legal;v.options=opts(()=>true);v.self=p.pid}
    else{v.kind='sus';v.options=opts(x=>x.pid!==p.pid)}
    return v;
  }
  if(ph==='vote'){
    if(!p.alive){v.view='out';return v}
    if(p.pid in G.votes){v.view='wait';v.left=alive().filter(x=>!(x.pid in G.votes)).length;return v}
    v.view='task';v.kind='vote';v.options=opts(x=>x.pid!==p.pid&&x.pid!==G.immune);return v;
  }
  if(ph==='solid'){
    if(p.pid===G.verdict){v.view='task';v.kind='solid';v.options=opts(()=>true);return v}
    v.view='screen';return v;
  }
  if(ph==='end'){
    const team=ROLES[p.role].team;
    v.won=G.winner==='solo'?p.pid===G.soloPid:(G.winner==='good'?team==='good':team==='sab');
    v.winner=G.winner;return v;
  }
  v.view=p.alive?'screen':'out';return v;
}
function push(){if(!net)return;G.players.forEach(p=>{if(p.cid)net.send(p.cid,viewFor(p))})}
function update(){render();push();save()}

/* ---------- messages from phones ---------- */
function onMsg(cid,m){
  if(!m||!m.t)return;
  if(m.t==='hello'){
    let p=G.players.find(x=>x.pid===m.pid);
    const name=String(m.name||'').trim().replace(/\s+/g,' ').slice(0,14);
    if(!p){
      if(G.phase!=='lobby'){net.send(cid,{t:'reject',reason:'p_started'});return}
      if(!name){net.send(cid,{t:'reject',reason:'p_noRoom'});return}
      if(G.players.length>=MAX){net.send(cid,{t:'reject',reason:'full'});return}
      if(G.players.some(x=>x.name===name)){net.send(cid,{t:'reject',reason:'p_nameTaken'});return}
      p={pid:m.pid,name,g:m.g==='f'?'f':'m',cid,online:true,alive:true,apt:apt(G.players.length)};
      G.players.push(p);if(!G.hostPid)G.hostPid=p.pid;snd('click_2',.5);
    }else{
      if(p.cid&&p.cid!==cid)net.drop(p.cid);
      p.cid=cid;p.online=true;
      if(G.phase==='lobby'&&name&&!G.players.some(x=>x!==p&&x.name===name)){p.name=name;p.g=m.g==='f'?'f':'m'}
    }
    conns[cid]=p.pid;update();return;
  }
  const p=P(conns[cid]);if(!p)return;
  if(m.t==='leave'){if(G.phase==='lobby'){G.players=G.players.filter(x=>x!==p);if(G.hostPid===p.pid)G.hostPid=G.players[0]?G.players[0].pid:null;G.players.forEach((x,i)=>x.apt=apt(i))}update();return}
  if(m.t==='ctl'){if(G.hostPid===p.pid)primary();return}
  if(m.t==='ready'&&G.phase==='roles'){p.ready=true;update();if(G.players.every(x=>x.ready)){setTimeout(()=>{if(G.phase==='roles'){startNight();update()}},1200)}return}
  if(m.t==='act'&&G.phase==='night'&&p.alive&&!G.night.acted[p.pid]){
    const n=G.night,tg_=m.target,tp=tg_!=null?P(tg_):null;
    if(p.role==='saboteur'){if(!tp)return;n.sab[p.pid]=tg_}
    else if(p.role==='fixer'){if(!tp||tg_===G.lastProtect)return;n.protect=tg_}
    else if(p.role==='smart'){if(!tp)return;n.smart[p.pid]={name:tp.name,g:tp.g,sab:tp.role==='saboteur'}}
    else if(p.role==='legal'){
      if(m.mode==='kill'&&tp&&!G.legal.kill){n.kill=tg_;G.legal.kill=true}
      else if(m.mode==='save'&&tp&&!G.legal.save){n.writ=tg_;G.legal.save=true}
    }
    else if(tp){G.sus[tg_]=(G.sus[tg_]||0)+1}
    n.acted[p.pid]=true;snd('click_2',.25);update();
    if(allActed())setTimeout(()=>{if(G.phase==='night'&&allActed()){resolveNight();update()}},1500);
    return;
  }
  if(m.t==='vote'&&G.phase==='vote'&&p.alive&&!(p.pid in G.votes)){
    if(m.target!=null){const tp=P(m.target);if(!tp||!tp.alive||tp===p||tp.pid===G.immune)return}
    G.votes[p.pid]=m.target==null?null:m.target;snd('click_2',.25);update();
    if(allVoted())setTimeout(()=>{if(G.phase==='vote'&&allVoted()){doTally();update()}},1200);
    return;
  }
  if(m.t==='solid'&&G.phase==='solid'&&p.pid===G.verdict){
    const tp=P(m.target);if(!tp||!tp.alive)return;
    tp.alive=false;G.second={by:p.pid,pid:tp.pid};G.phase='verdict';snd('negative_sound',.45);update();return;
  }
}
function onClose(cid){const pid=conns[cid];delete conns[cid];const p=pid&&P(pid);if(p&&p.cid===cid){p.cid=null;p.online=false;render()}}

/* ---------- TV rendering ---------- */
const root=document.getElementById('tv');
const I={
  vol:'<svg viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>',
  mute:'<svg viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4V5zM16 9.5l5 5M21 9.5l-5 5"/></svg>',
  full:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  home:'<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></svg>',
  up:'<svg viewBox="0 0 10 10"><path d="M5 1.5l4 7H1z"/></svg>',down:'<svg viewBox="0 0 10 10"><path d="M5 8.5l4-7H1z"/></svg>'
};
function joinURL(){
  const base=(location.protocol==='https:'&&!/^(localhost|127\.)/.test(location.hostname))?location.href.replace(/[^/]*([?#].*)?$/,''):PUBLIC;
  return base+'join.html'+(Net.local()?'?local=1':'')+'#'+G.code;
}
function qrSVG(text){
  const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount();let d='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';
  return '<svg viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges"><rect x="-2" y="-2" width="'+(n+4)+'" height="'+(n+4)+'" fill="#F1ECE1"/><path d="'+d+'" fill="#1F2A3F"/></svg>';
}
function badge(p,extra){
  return '<div class="tile '+(p.online===false?'off ':'')+(extra||'')+'"><span class="av '+p.g+'">'+esc(p.name.slice(0,1))+'</span><span class="nm">'+esc(p.name)+'</span>'+
    '<span class="st">'+(extra&&extra.indexOf('done')>=0?I.check:'')+'</span></div>';
}
function floorChip(){
  const ph=G.phase;
  if(ph==='lobby')return '<span class="floor">'+t('p_lobby')+'</span>';
  if(ph==='roles')return '<span class="floor">'+t('dealFloor')+'</span>';
  if(ph==='end')return '<span class="floor">'+t('endFloor')+'</span>';
  if(ph==='night')return '<span class="floor">'+I.down+t('nightFloor',{n:num(G.round)})+'</span>';
  return '<span class="floor">'+I.up+t('dayFloor',{n:num(G.round)})+'</span>';
}
function bar(){
  return '<header class="tvbar"><div class="brand"><span class="mark"></span>'+floorChip()+'</div>'+
    '<div class="tools"><span class="code">'+t('p_code')+' <b>'+G.code+'</b></span>'+
    '<button data-act="sound" aria-label="'+t('sound')+'">'+(UI.sound?I.vol:I.mute)+'</button>'+
    '<button data-act="lang">'+(UI.lang==='ar'?'EN':'ع')+'</button>'+
    '<button data-act="full" aria-label="Fullscreen">'+I.full+'</button>'+
    (G.phase!=='lobby'?'<button data-act="lobby" aria-label="'+t('p_lobby')+'">'+I.home+'</button>':'')+'</div></header>';
}
function primaryBtn(){
  if(!primaryReady())return '';
  return '<button class="pbtn" data-act="primary">'+primaryLabel()+'<kbd>Space</kbd></button>';
}
function render(){
  if(!G){root.innerHTML='<div class="center"><div class="spinner"></div><p>'+t('p_connecting')+'</p></div>';return}
  const ph=G.phase;root.dataset.phase=ph;
  let h='';
  if(ph==='lobby')h=lobby();
  else if(ph==='roles')h=rolesV();
  else if(ph==='night')h=nightV();
  else if(ph==='morning')h=morningV();
  else if(ph==='council')h=councilV();
  else if(ph==='vote')h=voteV();
  else if(ph==='tally')h=tallyV();
  else if(ph==='verdict'||ph==='solid')h=verdictV();
  else if(ph==='end')h=endV();
  const key=ph+'|'+G.round+'|'+(G.second?1:0);
  const anim=root._key!==key;root._key=key;
  root.innerHTML=h;
  if(anim)root.classList.remove('enter'),void root.offsetWidth,root.classList.add('enter');
}
function lobby(){
  const url=joinURL(),n=G.players.length;
  const tiles=G.players.map(p=>badge(p,p.pid===G.hostPid?'host':'')).join('');
  const short=url.replace(/^https?:\/\//,'').replace(/#.*/,'');
  return '<section class="lobby">'+
    '<div class="cover"><img src="assets/scene/cover.webp" alt=""><div class="cover-in"><div class="logo"></div><p>'+t('tag')+'</p></div></div>'+
    '<div class="side">'+bar()+
      '<div class="join"><div class="qr">'+qrSVG(url)+'</div>'+
        '<div class="how"><h2>'+t('p_scan')+'</h2><p class="url">'+t('p_orOpen')+' <b dir="ltr">'+esc(short)+'</b></p>'+
        '<p class="codeL">'+t('p_code')+'</p><p class="bigcode" dir="ltr">'+G.code+'</p></div></div>'+
      '<div class="who"><div class="whohead"><h3>'+t('p_players')+'</h3><span>'+num(n)+' / '+num(MAX)+'</span></div>'+
        '<div class="tiles">'+(tiles||'<p class="empty">'+t('p_waitingN',{n:num(MIN)})+'</p>')+'</div></div>'+
      '<div class="act">'+(n>=MIN?primaryBtn():'<span class="hint">'+t('p_waitingN',{n:num(MIN)})+'</span>')+'<button class="ghost" data-act="roles-cfg">'+I.gear+'<span>'+t('rolesIn')+'</span></button></div>'+
    '</div></section>';
}
function rolesV(){
  const done=G.players.filter(p=>p.ready).length;
  return '<section class="stagev">'+bar()+'<div class="head"><h1>'+t('p_rolesTitle')+'</h1><p>'+t('p_rolesLead')+'</p></div>'+
    '<div class="tiles big">'+G.players.map(p=>badge(p,p.ready?'done':'')).join('')+'</div>'+
    '<div class="act"><span class="hint">'+num(done)+' / '+num(G.players.length)+' '+t('p_ready')+'</span>'+primaryBtn()+'</div></section>';
}
function nightV(){
  const a=alive(),done=a.filter(p=>G.night.acted[p.pid]).length;
  return '<section class="stagev scene">'+'<img class="bgimg dark" src="assets/scene/window-peek.webp" alt="">'+bar()+
    '<div class="head"><h1>'+t('eveTitle')+'</h1><p>'+t('p_nightLead')+'</p></div>'+
    '<div class="tiles big">'+a.map(p=>badge(p,G.night.acted[p.pid]?'done':'')).join('')+'</div>'+
    '<div class="act"><span class="hint">'+num(done)+' / '+num(a.length)+'</span>'+primaryBtn()+'</div></section>';
}
function morningV(){
  const items=G.report.map((r,i)=>{const p=r.pid?P(r.pid):null;
    return '<div class="rep" style="animation-delay:'+(.4+i*.9)+'s">'+
      (p&&!r.plain?'<img class="rb" src="'+art(p.role,p.g,'bust')+'" alt="">':'')+
      '<div><p>'+(p?tg(r.k,p.g,{name:esc(p.name)}):t(r.k))+'</p>'+(p&&!r.plain?'<p class="sub">'+tg('was',p.g,{role:'<b style="color:'+teamCol(p.role)+'">'+rn(p.role,p.g)+'</b>'})+'</p>':'')+'</div></div>'}).join('');
  return '<section class="split">'+
    '<div class="pic"><img src="assets/scene/window-elder.webp" alt=""></div>'+
    '<div class="side">'+bar()+'<div class="head"><h1>'+t('mornTitle')+'</h1></div><div class="report">'+items+'</div><div class="act">'+primaryBtn()+'</div></div></section>';
}
function councilV(){
  const a=alive();
  return '<section class="stagev">'+bar()+'<div class="head"><h1>'+t('councilTitle')+'</h1><p>'+t('councilLead')+'</p></div>'+
    (UI.cfg.timer?'<div class="clock" id="clock">'+fmt(G.left)+'</div><div class="clockctl"><button class="chip" data-act="pause">'+t(G.paused?'resume':'pause')+'</button><button class="chip" data-act="plus30">'+t('plus30')+'</button></div>':'')+
    '<div class="tiles">'+a.map(p=>badge(p,p.pid===G.immune?'shield':'')).join('')+'</div>'+
    '<div class="act">'+primaryBtn()+'</div></section>';
}
function voteV(){
  const a=alive(),done=a.filter(p=>p.pid in G.votes).length;
  return '<section class="stagev">'+bar()+'<div class="head"><h1>'+t('voteQ')+'</h1><p>'+t('p_voteLead')+'</p></div>'+
    '<div class="tiles big">'+a.map(p=>badge(p,(p.pid in G.votes)?'done':'')).join('')+'</div>'+
    '<div class="act"><span class="hint">'+num(done)+' / '+num(a.length)+' '+t('p_voted')+'</span>'+primaryBtn()+'</div></section>';
}
function tallyV(){
  const rows=G.tally,top=rows.length?rows[0].n:0,tied=rows.filter(r=>r.n===top).length>1;
  const body=rows.length?'<div class="tally">'+rows.map((r,i)=>{const p=P(r.pid);return '<div class="trow '+(r.n===top&&!tied?'top':'')+'" style="animation-delay:'+(.3+i*.35)+'s"><span class="av '+p.g+'">'+esc(p.name.slice(0,1))+'</span><span class="nm">'+esc(p.name)+'</span><span class="dots">'+Array(r.n).fill('<i></i>').join('')+'</span><span class="n">'+num(r.n)+'</span></div>'}).join('')+'</div>':'<p class="lead">'+t('noVotes')+'</p>';
  return '<section class="stagev">'+bar()+'<div class="head"><h1>'+t('tallyTitle')+'</h1></div>'+body+'<div class="act">'+primaryBtn()+'</div></section>';
}
function verdictV(){
  if(G.verdict==null)return '<section class="stagev">'+bar()+'<div class="head mid"><h1>'+t('tie')+'</h1><p>'+t('tieLead')+'</p></div><div class="act">'+primaryBtn()+'</div></section>';
  const show=G.second?P(G.second.pid):P(G.verdict);
  const kicker=G.second?tg('solidOut',P(G.second.by).g,{a:esc(P(G.second.by).name)}):t('evicted');
  const waiting=G.phase==='solid';
  return '<section class="verdict">'+bar()+
    '<div class="port"><img src="'+art(show.role,show.g,'bust')+'" alt=""></div>'+
    '<div class="vtxt"><span class="kick">'+kicker+'</span><h1>'+esc(show.name)+'</h1><span class="sub">'+tg('truth',show.g)+'</span>'+
      '<h2 style="color:'+teamCol(show.role)+'">'+rn(show.role,show.g)+'</h2>'+
      (waiting?'<p class="lead">'+t('solidKick')+'. '+t('solidQ')+'</p>':'')+
      '<div class="act">'+primaryBtn()+'</div></div></section>';
}
function endV(){
  const w=G.winner;let title,lead;
  if(w==='good'){title=t('winGood');lead=t('winGoodLead')}
  else if(w==='sab'){title=t('winSab');lead=t('winSabLead')}
  else{const cp=P(G.soloPid);title=tg('winSolo',cp.g);lead=tg('winSoloLead',cp.g,{name:esc(cp.name)})}
  const cast=G.players.map((p,i)=>'<figure class="'+(p.alive?'':'gone')+'" style="animation-delay:'+(.2+i*.06)+'s"><img src="'+art(p.role,p.g,'full')+'" alt=""><figcaption><b>'+esc(p.name)+'</b><span style="color:'+teamCol(p.role)+'">'+rn(p.role,p.g)+'</span></figcaption></figure>').join('');
  let sus='';const ids=Object.keys(G.sus);if(ids.length){const top=ids.sort((a,b)=>G.sus[b]-G.sus[a])[0];sus='<p class="sub">'+t('mostSus',{name:esc(P(top).name)})+'</p>'}
  return '<section class="endv '+w+'">'+bar()+'<div class="head"><h1>'+title+'</h1><p>'+lead+'</p>'+sus+'</div><div class="lineup">'+cast+'</div><div class="act">'+primaryBtn()+'</div></section>';
}

/* roles settings sheet on TV */
function cfgSheet(){
  const n=Math.max(G.players.length,MIN),c=compose(n);
  let h='<div class="sheet"><h2>'+t('sheetRoles')+'</h2><div class="opt"><span class="txt"><b>'+t('sabCount')+'</b><span>'+t('sabAuto')+'</span></span><span class="stepper"><button data-act="sab-">−</button><span>'+num(c.sabs)+'</span><button data-act="sab+">+</button></span></div>';
  SPECIALS.forEach(r=>{const na=n<ROLES[r].min;h+='<div class="opt '+(na?'na':'')+'"><span class="txt"><b>'+rn(r)+'</b><span>'+(na?t('needs',{n:num(ROLES[r].min)}):t('d_'+r))+'</span></span><button class="switch '+(UI.cfg.roles[r]&&!na?'on':'')+'" data-act="role" data-r="'+r+'"></button></div>'});
  h+='<div class="opt"><span class="txt"><b>'+t('timer')+'</b><span>'+t('timerD')+'</span></span><span class="seg">'+[0,120,180,300].map(s=>'<button data-act="timer" data-s="'+s+'" class="'+(UI.cfg.timer===s?'on':'')+'">'+(s?num(s/60):t('off'))+'</button>').join('')+'</span></div>';
  h+='<button class="pbtn" data-act="close-cfg">'+t('done')+'</button></div>';
  let w=document.querySelector('.sheet-wrap');if(!w){w=document.createElement('div');w.className='sheet-wrap';document.body.appendChild(w);w.addEventListener('click',e=>{if(e.target===w)w.remove()})}
  w.innerHTML=h;
}

/* ---------- timer ---------- */
setInterval(()=>{
  if(!G||G.phase!=='council'||!UI.cfg.timer||G.paused)return;
  if(G.left>0){G.left--;const c=document.getElementById('clock');if(c){c.textContent=fmt(G.left);c.classList.toggle('low',G.left<=10)}if(G.left===0)snd('alarm',.5)}
},1000);

/* ---------- actions ---------- */
const A={
  primary,
  sound(){UI.sound=!UI.sound;store.set('sound',UI.sound);if(!UI.sound){stopVo();music(false)}else snd('click_2',.3);render()},
  lang(){UI.lang=UI.lang==='ar'?'en':'ar';store.set('lang',UI.lang);setLang();update()},
  full(){const d=document;try{if(!d.fullscreenElement)d.documentElement.requestFullscreen();else d.exitFullscreen()}catch(e){}},
  lobby(){stopVo();music(false);G.phase='lobby';G.players.forEach((p,i)=>{p.role=null;p.alive=true;p.ready=false;p.apt=apt(i)});update()},
  pause(){G.paused=!G.paused;render()},
  plus30(){G.left+=30;render()},
  'roles-cfg':cfgSheet,
  'close-cfg'(){const w=document.querySelector('.sheet-wrap');if(w)w.remove();render()},
  'sab-'(){const c=compose(Math.max(G.players.length,MIN));UI.cfg.sabs=Math.max(1,c.sabs-1);store.set('cfg',UI.cfg);cfgSheet()},
  'sab+'(){const n=Math.max(G.players.length,MIN),c=compose(n);UI.cfg.sabs=Math.min(Math.max(1,Math.ceil(n/2)-1),c.sabs+1);store.set('cfg',UI.cfg);cfgSheet()},
  role(el){const r=el.dataset.r;UI.cfg.roles[r]=!UI.cfg.roles[r];store.set('cfg',UI.cfg);cfgSheet()},
  timer(el){UI.cfg.timer=+el.dataset.s;store.set('cfg',UI.cfg);cfgSheet()}
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el)return;const f=A[el.dataset.act];if(f)f(el)});
document.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!document.querySelector('.sheet-wrap')){e.preventDefault();if(G&&primaryReady())primary()}});

function setLang(){document.documentElement.lang=UI.lang;document.documentElement.dir=UI.lang==='ar'?'rtl':'ltr'}

/* ---------- boot ---------- */
function boot(){
  setLang();render();
  let saved=null;try{saved=JSON.parse(sessionStorage.getItem('jeerah:tv')||'null')}catch(e){}
  const code=saved&&Date.now()-saved.at<4*3600e3?saved.G.code:newCode();
  G=saved&&saved.G.code===code?saved.G:fresh(code);
  net=Net.host(code,{
    open(c){G.code=c;update()},
    newCode(){const c=newCode();G=fresh(c);return c},
    connect(){},
    msg:onMsg,
    close:onClose,
    error(e){if(e&&(e.type==='network'||e.type==='server-error'||e.type==='socket-error'||e.type==='browser-incompatible')){root.innerHTML='<div class="center"><p>'+t('p_netErr')+'</p><button class="pbtn" onclick="location.reload()">'+t('p_retry')+'</button></div>'}}
  });
}
window.__tv={get G(){return G},primary,A};
boot();
})();
