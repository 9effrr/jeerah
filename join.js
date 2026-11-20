/* جيرة — player phone for the big-screen mode */
(function(){
'use strict';
const {T,ROLES,SPECIALS,MIN}=window.JDATA;
const NS='jeerah:'+((location.search.match(/[?&]u=(\w+)/)||[])[1]||'');
const store={get(k,d){try{const v=localStorage.getItem(NS+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(NS+k,JSON.stringify(v))}catch(e){}}};
const app=document.getElementById('app'),screen=document.getElementById('screen');

const S={lang:store.get('lang','ar'),pid:store.get('pid',null),name:store.get('pname',''),g:store.get('pg','m'),
  code:'',net:null,state:null,status:'form',err:'',sel:null,mode:null,retry:null,dropped:false,lastKey:'',hosting:false,frame:null,seen:{},at:0};
if(!S.pid){S.pid='p'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);store.set('pid',S.pid)}
const hashCode=()=>(location.hash||'').replace('#','').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
const LINK=hashCode();
S.code=LINK||store.get('pcode','');
const teamCol=r=>{const tm=ROLES[r].team;return tm==='sab'?'var(--bad)':tm==='solo'?'var(--solo)':'var(--good)'};
function fmt(s){const m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x}
function newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<5;i++)s+=A[Math.floor(Math.random()*A.length)];return s}
function qrSVG(text){const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount();let d='';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';return '<svg viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges"><rect x="-2" y="-2" width="'+(n+4)+'" height="'+(n+4)+'" fill="#F1ECE1"/><path d="'+d+'" fill="#1F2A3F"/></svg>'}

function t(k,v){let s=(T[S.lang][k]!=null?T[S.lang][k]:T.ar[k]);if(s==null)s=k;if(v)for(const key in v)s=s.split('{'+key+'}').join(v[key]);return s}
function tg(k,g,v){return t(g==='f'&&T[S.lang][k+'_f']!=null?k+'_f':k,v)}
function rn(r,g){return tg('r_'+r,g)}
function art(r,g,kind){return 'assets/ch/'+r+(g==='f'?'-f':'')+'-'+kind+'.webp'}
function num(n){return S.lang==='ar'?Number(n).toLocaleString('ar-EG',{useGrouping:false}):String(n)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setLang(){document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==='ar'?'rtl':'ltr'}
function vib(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}

const I={
  m:'<svg viewBox="0 0 24 24"><circle cx="10" cy="14" r="5.5"/><path d="M14 10l6-6M15 4h5v5"/></svg>',
  f:'<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.5"/><path d="M12 14.5V22M8.5 18.5h7"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  touch:'<svg viewBox="0 0 24 24"><path d="M12 11V5.5a1.75 1.75 0 013.5 0V12l3.2.9a2.5 2.5 0 011.8 2.8l-.6 3.3a3 3 0 01-3 2.5h-4.2a4 4 0 01-3.2-1.6L6 15.5a1.6 1.6 0 012.5-2l1.5 1.6V8a1 1 0 012 0"/></svg>',
  tv:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></svg>',
  up:'<svg viewBox="0 0 10 10"><path d="M5 1.5l4 7H1z"/></svg>',down:'<svg viewBox="0 0 10 10"><path d="M5 8.5l4-7H1z"/></svg>',
  chev:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};

function show(theme,html,key){
  app.dataset.theme=theme;
  const anim=key!==S.lastKey;S.lastKey=key;
  screen.className='screen';screen.innerHTML=html;
  if(anim){screen.scrollTop=0;void screen.offsetWidth;screen.classList.add('enter')}
}
function floor(st){
  const ph=st.phase;
  if(ph==='lobby')return '<span class="floor">'+t('p_lobby')+'</span>';
  if(ph==='roles')return '<span class="floor">'+t('dealFloor')+'</span>';
  if(ph==='end')return '<span class="floor">'+t('endFloor')+'</span>';
  if(ph==='night')return '<span class="floor">'+I.down+'<span>'+t('nightFloor',{n:num(st.round)})+'</span></span>';
  return '<span class="floor">'+I.up+'<span>'+t('dayFloor',{n:num(st.round)})+'</span></span>';
}
function top(st){
  const me=st.me;
  return '<header class="top"><span class="side"><button class="icon-btn" data-act="menu" aria-label="'+t('menu')+'">'+I.menu+'</button></span>'+floor(st)+'<span class="side end">'+(me.role?'<button class="peek" id="peek" aria-label="'+t('p_yourRole')+'"><span class="face"><img src="'+art(me.role,me.g,'face')+'" alt=""></span></button>':'')+'</span></header>'+
    (S.dropped?'<p class="banner">'+t('p_lost')+'</p>':'');
}
function ctl(st){return st.ctl?'<div class="hostctl"><span class="small">'+t('p_hostCtl')+'</span><button class="btn quiet" data-act="ctl">'+esc(st.ctl)+'</button></div>':''}

/* ---------- screens ---------- */
function formV(){
  const busy=S.status==='joining'||S.status==='opening';
  show('night',
    '<header class="top"><span class="side"><button class="icon-btn" data-act="home" aria-label="'+t('back')+'">'+(S.lang==='ar'?I.chev:I.back)+'</button></span><span></span><span class="side end"><button class="text-btn" data-act="lang">'+(S.lang==='ar'?'EN':'ع')+'</button></span></header>'+
    '<div class="joinhero"><div class="logo" role="img" aria-label="جيرة"></div></div>'+
    '<h1 class="center-t">'+t(LINK?'p_joinTitle':'h_title')+'</h1>'+
    '<form id="jf" class="stack g12 mt24">'+
      '<label class="field"><input id="nm" maxlength="14" autocomplete="off" placeholder="'+t('p_name')+'" value="'+esc(S.name)+'">'+
      '<span class="gpick"><button type="button" data-act="g" data-g="m" class="'+(S.g==='m'?'on':'')+'" aria-label="'+t('male')+'">'+I.m+'</button><button type="button" data-act="g" data-g="f" class="'+(S.g==='f'?'on':'')+'" aria-label="'+t('female')+'">'+I.f+'</button></span></label>'+
      (LINK?'':'<button type="button" class="btn" data-act="host" '+(busy?'disabled':'')+'>'+(S.status==='opening'?t('h_opening'):t('h_new'))+'</button><p class="small center-t mt8">'+t('h_orJoin')+'</p>')+
      '<label class="field"><input id="code" dir="ltr" autocomplete="off" autocapitalize="characters" maxlength="5" placeholder="'+t('p_codePh')+'" value="'+esc(S.hosting?'':S.code)+'"></label>'+
      (S.err?'<p class="err">'+t(S.err)+'</p>':'')+
      '<button class="btn '+(LINK?'':'quiet')+'" id="go" '+(busy?'disabled':'')+'>'+(S.status==='joining'&&!S.hosting?t('p_joining'):t('h_joinB'))+'</button>'+
    '</form>','form');
  const f=document.getElementById('jf');
  f.addEventListener('submit',e=>{e.preventDefault();
    const code=document.getElementById('code').value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    if(!readName())return;
    if(code.length<5){S.err='p_noRoom';formV();return}
    S.code=code;store.set('pcode',code);
    if(location.hash.slice(1)!==code)history.replaceState(history.state,'',location.pathname+location.search+'#'+code);
    connect();
  });
  if(!S.name){const n=document.getElementById('nm');if(n&&LINK)n.focus()}
}
function readName(){
  const el=document.getElementById('nm');const nm=el?el.value.trim().replace(/\s+/g,' '):S.name;
  if(!nm){S.err='p_name';formV();return false}
  S.name=nm;store.set('pname',nm);store.set('pg',S.g);return true;
}
/* host a session from this phone: the game engine runs in a hidden frame */
function startHost(code){
  stopHost();S.hosting=true;S.status='opening';S.err='';formV();
  const f=document.createElement('iframe');f.setAttribute('aria-hidden','true');f.style.cssText='position:absolute;width:0;height:0;border:0;visibility:hidden';
  f.src='tv.html?embed=1&code='+code+(Net.local()?'&local=1':'');document.body.appendChild(f);S.frame=f;
  clearTimeout(S.hostT);S.hostT=setTimeout(()=>{if(S.status==='opening'){stopHost();S.status='form';S.err='p_netErr';formV()}},20000);
}
function stopHost(){
  if(S.frame){try{S.frame.contentWindow.postMessage({jeerah:2,k:'end'},location.origin)}catch(e){}const f=S.frame;S.frame=null;setTimeout(()=>f.remove(),80)}
  S.hosting=false;store.set('phost','');
}
addEventListener('message',e=>{
  if(e.origin!==location.origin||!e.data||e.data.jeerah!==1||!S.frame||e.source!==S.frame.contentWindow)return;
  if(e.data.k==='open'){clearTimeout(S.hostT);S.code=e.data.code;store.set('pcode',S.code);store.set('phost',S.code);if(S.status==='opening'){S.status='joining';connect()}}
  else if(e.data.k==='error'&&S.status==='opening'){clearTimeout(S.hostT);stopHost();S.status='form';S.err='p_netErr';formV()}
});
function render(){
  const st=S.state;
  if(!st||S.status!=='in'){formV();return}
  const me=st.me,ph=st.phase;
  if(ph==='lobby')return lobbyV(st);
  if(ph==='roles')return rolesV(st);
  if(ph==='end')return endV(st);
  if(st.view==='task')return taskV(st);
  if(st.solo&&(ph==='night'||ph==='vote')&&st.view==='out')return outV(st);
  if(st.solo&&st.view!=='wait')return pubV(st);
  if(st.view==='out')return outV(st);
  if(st.view==='wait')return waitV(st);
  return screenV(st);
}
function av(p){return '<span class="av '+p.g+'">'+esc(p.name.slice(0,1))+'</span>'}
function cards(list,opt){
  opt=opt||{};const seen=S.seen,now={};
  const h=list.map(p=>{now[p.name]=1;const fresh=opt.pop&&!seen[p.name];
    const sub=p.on===false?t('h_away'):p.host?t('h_host'):p.me?t('h_you'):'';
    return '<div class="pcard'+(fresh?' new':'')+(p.on===false?' off':'')+(p.done?' done':'')+'">'+av(p)+'<span class="nm"><b>'+esc(p.name)+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</span>'+(p.done?'<span class="tk">'+I.check+'</span>':'')+'</div>'}).join('');
  if(opt.pop)S.seen=now;
  let empty='';for(let i=0;i<(opt.empty||0);i++)empty+='<div class="pcard empty"><span class="av"></span><span class="nm"><span>'+t('h_wait')+'</span></span></div>';
  return '<div class="pcards">'+h+empty+'</div>';
}
function lobbyV(st){
  const n=st.players.length,need=Math.max(0,st.min-n);
  show('night',top(st)+
    '<div class="codebox">'+(st.url?'<div class="qr">'+qrSVG(st.url)+'</div>':'')+'<div class="stack"><span class="kicker">'+t('p_code')+'</span><b class="bigcode" dir="ltr">'+esc(st.code)+'</b>'+(st.url?'<span class="small">'+t('h_share')+'</span>':'')+'</div></div>'+
    '<div class="whohead mt24"><h2>'+t('p_players')+'</h2><span class="small">'+t('h_count',{n:num(n),m:num(st.max||16)})+'</span></div>'+
    cards(st.players,{pop:true,empty:need})+
    '<p class="lead mt16">'+(need?t('p_waitingN',{n:num(st.min)}):st.host?t('h_full'):t('p_waitHost'))+'</p>'+
    '<div class="foot">'+(st.host&&S.hosting?'<button class="btn quiet" data-act="cfg">'+t('sheetRoles')+'</button>':'')+(st.host?'<button class="btn" data-act="ctl" '+(st.ctl?'':'disabled')+'>'+(st.ctl?esc(st.ctl):t('p_waitingN',{n:num(st.min)}))+'</button>':'')+
    '<button class="btn ghost" data-act="menu">'+t('p_leave')+'</button></div>','lobby');
}
/* shared screens when there is no big screen */
function pubV(st){
  const p=st.pub||{},ph=st.phase,me=st.me;let h='',theme='day';
  const note=me.alive?'':'<p class="small center-t mt16">'+tg('h_out',me.g)+'</p>';
  if(ph==='morning'){
    h='<h1>'+t('mornTitle')+'</h1>'+(p.report||[]).map((r,i)=>'<div class="rep" style="animation-delay:'+(.2+i*.5)+'s">'+(r.role?'<img src="'+art(r.role,r.g,'face')+'" alt="">':'')+
      '<div><p>'+(r.name?tg(r.k,r.g,{name:esc(r.name)}):t(r.k))+'</p>'+(r.role?'<p class="small">'+tg('was',r.g,{role:'<b style="color:'+teamCol(r.role)+'">'+rn(r.role,r.g)+'</b>'})+'</p>':'')+'</div></div>').join('');
  }else if(ph==='council'){
    h='<h1>'+t('councilTitle')+'</h1><p class="lead">'+t('councilLead')+'</p>'+(p.timer?'<div class="clockp" id="clock">'+fmt(left(p))+'</div>':'')+cards(p.players||[]);
  }else if(ph==='tally'){
    h='<h1>'+t('tallyTitle')+'</h1>'+((p.rows||[]).length?'<div class="tallyp">'+p.rows.map((r,i)=>'<div class="trow'+(r.top&&!p.tied?' top':'')+'" style="animation-delay:'+(.2+i*.25)+'s">'+av(r)+'<span class="nm">'+esc(r.name)+'</span><span class="dots">'+Array(r.n).fill('<i></i>').join('')+'</span><b>'+num(r.n)+'</b></div>').join('')+'</div>':'<p class="lead">'+t('noVotes')+'</p>');
  }else if(ph==='verdict'||ph==='solid'){
    if(p.tie)h='<div class="stack center g8 grow" style="justify-content:center"><h1>'+t('tie')+'</h1><p class="lead">'+t('tieLead')+'</p></div>';
    else if(p.show){const s=p.show;theme='night';
      h='<div class="portrait mt16"><img src="'+art(s.role,s.g,'bust')+'" alt=""></div><div class="stack center g4"><span class="kicker">'+(p.by?tg('solidOut',p.by.g,{a:esc(p.by.name)}):t('evicted'))+'</span><h1>'+esc(s.name)+'</h1><span class="small">'+tg('truth',s.g)+'</span><h2 style="color:'+teamCol(s.role)+'">'+rn(s.role,s.g)+'</h2>'+(p.waiting?'<p class="lead">'+t('solidKick')+'</p>':'')+'</div>';}
  }else{
    theme=ph==='vote'?'day':'night';
    h='<h1>'+t('p_waitOthers')+'</h1>'+cards(p.players||[]);
  }
  show(theme,top(st)+h+note+ctl(st),'pub'+ph+st.round+(p.by?1:0));
}
function left(p){return Math.max(0,p.paused?p.left:p.left-Math.floor((Date.now()-S.at)/1000))}
setInterval(()=>{const st=S.state;if(!st||st.phase!=='council'||!st.pub||!st.pub.timer)return;const c=document.getElementById('clock');if(c){const l=left(st.pub);c.textContent=fmt(l);c.classList.toggle('low',l<=10)}},500);
function rolesV(st){
  const me=st.me,team=ROLES[me.role].team;
  if(st.ready&&st.solo)return pubV(st);
  if(st.ready){return show('night',top(st)+'<div class="stack center g16 grow" style="justify-content:center">'+bigIcon(I.tv)+'<h1>'+t('p_lookScreen')+'</h1><p class="lead">'+t('p_waitOthers')+'</p></div>'+ctl(st),'rready')}
  const extra=me.role==='saboteur'&&st.mates.length?'<br><b style="color:var(--bad);font-weight:600">'+t('yourTeam',{names:st.mates.map(esc).join('، ')})+'</b>':'';
  show('night',top(st)+
    '<div class="stage" id="stage"><div class="q"><span class="mark">'+I.touch+'</span><div class="stack center g4"><b style="font-size:18px;font-weight:600">'+t('hold')+'</b><span class="small">'+t('holdSub')+'</span></div></div>'+
      '<div class="secret"><div class="who"><span class="team '+team+'">'+t('team_'+team)+'</span><h1>'+rn(me.role,me.g)+'</h1></div><img class="art" src="'+art(me.role,me.g,'bust')+'" alt=""></div></div>'+
    '<p class="role-desc" id="rdesc"><span class="small">'+esc(me.name)+'</span></p>'+
    '<div class="foot"><button class="btn" id="nextb" data-act="ready" disabled>'+t('seeFirst')+'</button></div>','roles');
  const stage=document.getElementById('stage'),d=document.getElementById('rdesc'),nb=document.getElementById('nextb');
  const idle=d.innerHTML,full=tg('d_'+me.role,me.g)+extra;
  stage.addEventListener('pointerdown',e=>{e.preventDefault();stage.classList.add('show');d.innerHTML=full;vib(15);if(nb.disabled){nb.disabled=false;nb.textContent=t('next')}});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>stage.addEventListener(ev,()=>{stage.classList.remove('show');d.innerHTML=idle}));
  stage.addEventListener('contextmenu',e=>e.preventDefault());
}
function bigIcon(svg){return '<span class="bigic">'+svg+'</span>'}
function me_(st){const me=st.me;return '<div class="me"><span class="face"><img src="'+art(me.role,me.g,'face')+'" alt=""></span><div class="txt"><span class="small">'+esc(me.name)+'</span><b>'+t('youAre',{role:rn(me.role,me.g)})+'</b></div></div>'}
function rowsOf(options,selected){
  return '<div class="list mt16">'+options.map(o=>'<button class="row'+(o.off?' off':'')+(selected===o.pid?' sel':'')+'" data-act="pick" data-id="'+o.pid+'"><span class="apt">'+num(o.apt)+'</span><span class="name">'+esc(o.name)+'</span>'+(o.off?'<span class="note">'+t('fixNote')+'</span>':'')+'<span class="tick">'+I.check+'</span></button>').join('')+'</div>';
}
function taskV(st){
  const k=st.kind,me=st.me;
  const theme=k==='vote'||k==='solid'?'day':'night';
  const key='task'+k+st.round+(S.mode||'');
  if(k==='legal'&&!S.mode){
    const m=(mode,a,b,used)=>'<button class="mode '+(used?'used':'')+'" data-act="mode" data-m="'+mode+'"><span class="txt"><b>'+t(a)+(used?' · '+t('used'):'')+'</b><span>'+t(b)+'</span></span><span class="chev">'+I.chev+'</span></button>';
    return show(theme,top(st)+me_(st)+'<h2 class="pick-title">'+t('legalQ')+'</h2><div class="modes">'+m('kill','legalKill','legalKillD',st.used.kill)+m('save','legalSave','legalSaveD',st.used.save)+m('none','legalNone','legalNoneD',false)+'</div>',key);
  }
  let title,sub='',opts=st.options,ok=t('confirm'),skip='';
  if(k==='sab'){title=t('sabQ');if(st.partner&&st.partner.length)sub=st.partner.map(p=>t('sabTeam',{name:esc(p.target)})).join(' · ')}
  else if(k==='fix')title=t('fixQ');
  else if(k==='smart')title=t('smartQ');
  else if(k==='legal'){title=t(S.mode==='kill'?'legalKillQ':'legalSaveQ');if(S.mode==='kill')opts=opts.filter(o=>o.pid!==st.self);skip='<button class="btn ghost" data-act="mode-back">'+t('back')+'</button>'}
  else if(k==='sus'){title=t('decoyQ');sub=t('decoySub')}
  else if(k==='vote'){title=t('voteQ');sub=t('hintVote');skip='<button class="btn ghost" data-act="abstain">'+t('abstain')+'</button>'}
  else if(k==='solid'){title=t('solidQ');sub=t('solidKick')}
  if(S.sel&&!opts.some(o=>o.pid===S.sel&&!o.off))S.sel=null;
  show(theme,top(st)+(k==='vote'?'':me_(st))+'<h2 class="pick-title">'+title+'</h2>'+(sub?'<p class="small">'+sub+'</p>':'')+
    rowsOf(opts,S.sel)+'<div class="foot"><button class="btn" data-act="send" '+(S.sel?'':'disabled')+'>'+ok+'</button>'+skip+'</div>',key);
}
function waitV(st){
  const night=st.phase==='night';
  let res='';
  if(st.smart){const r=st.smart;res='<div class="result"><span class="kicker">'+t('resTitle')+'</span><h2 style="color:var(--'+(r.sab?'bad':'good')+')">'+tg(r.sab?'isSab':'notSab',r.g,{name:esc(r.name)})+'</h2></div>'}
  show(night?'night':'day',top(st)+'<div class="stack center g16 grow" style="justify-content:center">'+(res||bigIcon(night?I.moon:I.check))+
    '<h2>'+t('p_waitOthers')+'</h2><p class="lead">'+(night?t('p_closeEyes'):t('hintVote'))+'</p></div>'+(st.pub&&st.pub.players?cards(st.pub.players):'')+ctl(st),'wait'+st.phase+st.round+(st.smart?1:0));
}
function screenV(st){
  show(st.phase==='night'?'night':'day',top(st)+'<div class="stack center g16 grow" style="justify-content:center">'+bigIcon(I.tv)+'<h1>'+t('p_lookScreen')+'</h1></div>'+ctl(st),'screen'+st.phase);
}
function outV(st){
  const me=st.me;
  show('night',top(st)+'<div class="portrait mt16"><img src="'+art(me.role,me.g,'bust')+'" alt=""></div><div class="stack center g8"><h1>'+tg('p_outTitle',me.g)+'</h1><p class="lead">'+(st.solo?tg('h_out',me.g):t('p_outLead'))+'</p></div>'+ctl(st),'out'+st.phase);
}
function endCast(st){
  const p=st.pub;if(!p||!p.cast)return '';
  let title;if(p.winner==='good')title=t('winGood');else if(p.winner==='sab')title=t('winSab');else title=tg('winSolo',p.soloP?p.soloP.g:'m');
  return '<div class="stack g4 mt16"><h2 class="center-t">'+title+'</h2>'+(p.sus?'<p class="small center-t">'+t('mostSus',{name:esc(p.sus)})+'</p>':'')+'</div><div class="list mt8">'+
    p.cast.map(c=>'<div class="row'+(c.alive?'':' gone')+'"><span class="face sm"><img src="'+art(c.role,c.g,'face')+'" alt=""></span><span class="name">'+esc(c.name)+'</span><span class="note" style="color:'+teamCol(c.role)+'">'+rn(c.role,c.g)+'</span></div>').join('')+'</div>';
}
function endV(st){
  const me=st.me;
  show('night',top(st)+'<div class="portrait mt16'+(st.pub&&st.pub.cast?' short':'')+'"><img src="'+art(me.role,me.g,'bust')+'" alt=""></div><div class="stack center g8"><span class="kicker">'+t('p_yourRole')+': '+rn(me.role,me.g)+'</span><h1 style="color:var(--'+(st.won?'good':'bad')+')">'+t(st.won?'p_youWon':'p_youLost')+'</h1>'+(st.pub&&st.pub.cast?'':'<p class="lead">'+t('p_lookScreen')+'</p>')+'</div>'+endCast(st)+ctl(st),'end'+st.round);
}

/* ---------- networking ---------- */
function connect(){
  if(S.net){try{S.net.close()}catch(e){}}
  S.status=S.status==='in'?'in':'joining';S.err='';if(S.status==='joining')formV();
  S.net=Net.join(S.code,{
    open(){S.net.send({t:'hello',pid:S.pid,name:S.name,g:S.g})},
    msg(m){
      if(m.t==='reject'){S.status='form';S.err=m.reason==='full'?'full':m.reason;S.state=null;try{S.net.close()}catch(e){}formV();return}
      if(m.t==='state'){
        const prev=S.state;S.state=m;S.status='in';S.at=Date.now();S.dropped=false;
        if(m.lang&&m.lang!==S.lang){S.lang=m.lang;setLang()}
        if(!prev||prev.phase!==m.phase||prev.round!==m.round||(prev.view!==m.view)){S.sel=null;S.mode=null;if(prev&&prev.phase!==m.phase)vib(40)}
        render();
      }
    },
    close(){if(S.status==='in'){S.dropped=true;render();clearTimeout(S.retry);S.retry=setTimeout(connect,2500)}},
    error(e){if(S.status==='in'){S.dropped=true;render();clearTimeout(S.retry);S.retry=setTimeout(connect,3000)}else{S.status='form';S.err=e==='noroom'?'p_noRoom':'p_netErr';formV()}}
  });
}
function send(m){if(S.net)S.net.send(m)}
/* round roles, for whoever hosts from this phone (shared with the hidden host engine) */
const cfgStore={get(){try{return JSON.parse(localStorage.getItem('jeerah:cfg'))||{}}catch(e){return{}}},set(v){try{localStorage.setItem('jeerah:cfg',JSON.stringify(v))}catch(e){}}};
function getCfg(){const c=Object.assign({sabs:0,timer:180},cfgStore.get());c.roles=Object.assign({smart:true,fixer:true,legal:true,solid:true,complainer:true},c.roles||{});return c}
function comp(c){
  const n=Math.max(S.state&&S.state.players?S.state.players.length:0,MIN);
  const auto=n<=6?1:n<=9?2:n<=13?3:4,maxS=Math.max(1,Math.ceil(n/2)-1),sabs=Math.min(maxS,Math.max(1,c.sabs||auto));
  const sp=SPECIALS.filter(r=>c.roles[r]);while(sabs+sp.length>n)sp.pop();return{sabs,sp,maxS};
}
function setCfg(c){cfgStore.set(c);if(S.frame)try{S.frame.contentWindow.postMessage({jeerah:2,k:'cfg'},location.origin)}catch(e){}cfgSheet()}
function cfgSheet(){
  const c=getCfg(),k=comp(c),f=r=>'<span class="face sm"><img src="'+art(r,S.g,'face')+'" alt=""></span>';
  let h='<h2>'+t('sheetRoles')+'</h2><p class="small">'+t('pickRoles')+'</p>'+
    '<div class="opt">'+f('saboteur')+'<div class="txt"><b>'+t('sabCount')+'</b><span>'+t('sabAuto')+'</span></div><div class="stepper"><button data-act="sab-" '+(k.sabs<=1?'disabled':'')+'>−</button><span>'+num(k.sabs)+'</span><button data-act="sab+" '+(k.sabs>=k.maxS?'disabled':'')+'>+</button></div></div>';
  SPECIALS.forEach(r=>{const on=!!c.roles[r],na=on&&k.sp.indexOf(r)<0;
    h+='<div class="opt'+(on?'':' off')+'">'+f(r)+'<div class="txt"><b>'+rn(r,S.g)+'</b><span'+(na?' class="warn"':'')+'>'+(na?t('noRoom'):t('d_'+r))+'</span></div><button class="switch '+(on?'on':'')+'" data-act="role" data-r="'+r+'" aria-label="'+rn(r,S.g)+'"></button></div>'});
  h+='<div class="opt"><div class="txt"><b>'+t('timer')+'</b><span>'+t('timerD')+'</span></div><div class="seg">'+[0,120,180,300].map(s=>'<button data-act="timer" data-s="'+s+'" class="'+(c.timer===s?'on':'')+'">'+(s?num(s/60):t('off'))+'</button>').join('')+'</div></div>'+
    '<div class="foot"><button class="btn" data-act="close-sheet">'+t('done')+'</button></div>';
  const old=app.querySelector('.sheet-wrap .sheet'),st=old?old.scrollTop:0;
  let w=app.querySelector('.sheet-wrap');
  if(!w){w=document.createElement('div');w.className='sheet-wrap';w.addEventListener('click',e=>{if(e.target===w)closeSheet()});app.appendChild(w)}
  w.innerHTML='<div class="sheet"><div class="grab"></div>'+h+'</div>';
  const s=w.querySelector('.sheet');if(old){s.style.animation='none';s.scrollTop=st}else{}
}
function closeSheet(){const s=app.querySelector('.sheet-wrap');if(s)s.remove()}
function leaveSheet(){
  closeSheet();const w=document.createElement('div');w.className='sheet-wrap';
  w.innerHTML='<div class="sheet"><div class="grab"></div><h2>'+t(S.hosting?'h_endAsk':'p_leaveAsk')+'</h2><div class="foot"><button class="btn" data-act="close-sheet">'+t('stay')+'</button><button class="btn ghost" data-act="leave">'+t('p_leaveYes')+'</button></div></div>';
  w.addEventListener('click',e=>{if(e.target===w)closeSheet()});app.appendChild(w);
}
function goHome(){
  clearTimeout(S.retry);
  if(S.status==='in')send({t:'leave'});
  store.set('pcode','');S.status='form';S.state=null;stopHost();
  setTimeout(()=>{try{S.net&&S.net.close()}catch(e){}location.replace('index.html?m=1')},S.net?120:0);
}

const A={
  g(el){S.g=el.dataset.g;store.set('pg',S.g);document.querySelectorAll('.gpick button').forEach(b=>b.classList.toggle('on',b.dataset.g===S.g))},
  lang(){S.lang=S.lang==='ar'?'en':'ar';store.set('lang',S.lang);setLang();render()},
  ctl(){send({t:'ctl'})},
  home(){goHome()},
  cfg(){cfgSheet()},
  role(el){const c=getCfg();c.roles[el.dataset.r]=!c.roles[el.dataset.r];setCfg(c)},
  'sab-'(){const c=getCfg(),k=comp(c);c.sabs=Math.max(1,k.sabs-1);setCfg(c)},
  'sab+'(){const c=getCfg(),k=comp(c);c.sabs=Math.min(k.maxS,k.sabs+1);setCfg(c)},
  timer(el){const c=getCfg();c.timer=+el.dataset.s;setCfg(c)},
  host(){if(!readName())return;startHost(newCode())},
  menu(){leaveSheet()},
  'close-sheet'(){closeSheet()},
  leave(){goHome()},
  ready(){send({t:'ready'})},
  pick(el){S.sel=el.dataset.id;screen.querySelectorAll('.row.sel').forEach(r=>r.classList.remove('sel'));el.classList.add('sel');const b=screen.querySelector('[data-act="send"]');if(b)b.disabled=false},
  mode(el){const m=el.dataset.m;if(m==='none'){send({t:'act',mode:'none'});return}S.mode=m;render()},
  'mode-back'(){S.mode=null;S.sel=null;render()},
  abstain(){send({t:'vote',target:null})},
  send(){
    const st=S.state;if(!S.sel||!st)return;
    if(st.kind==='vote')send({t:'vote',target:S.sel});
    else if(st.kind==='solid')send({t:'solid',target:S.sel});
    else send({t:'act',target:S.sel,mode:S.mode||undefined});
    vib(20);
  }
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(!el||el.disabled)return;const f=A[el.dataset.act];if(f)f(el)});
/* hold the face in the top bar to peek at your role */
document.addEventListener('pointerdown',e=>{const p=e.target.closest('#peek');if(!p||!S.state||!S.state.me.role)return;
  const me=S.state.me;let tip=document.getElementById('peektip');if(!tip){tip=document.createElement('div');tip.id='peektip';tip.className='toast';app.appendChild(tip)}
  tip.textContent=rn(me.role,me.g);const off=()=>{tip.remove();removeEventListener('pointerup',off)};addEventListener('pointerup',off)});
addEventListener('hashchange',()=>{const c=hashCode();if(c&&c!==S.code){S.code=c;S.status='form';S.state=null;formV()}});

setLang();
Back.init({root:()=>false,back(){
  if(app.querySelector('.sheet-wrap')){closeSheet();return}
  if(S.status==='in')leaveSheet();else goHome();
}});
if(!LINK&&S.name&&S.code&&store.get('phost','')===S.code)startHost(S.code);
else if(S.code&&S.name&&store.get('pcode','')===S.code)connect();else formV();
window.__join={S,A};
})();
