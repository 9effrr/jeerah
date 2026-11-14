/* جيرة — player phone for the big-screen mode */
(function(){
'use strict';
const {T,ROLES}=window.JDATA;
const NS='jeerah:'+((location.search.match(/[?&]u=(\w+)/)||[])[1]||'');
const store={get(k,d){try{const v=localStorage.getItem(NS+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(NS+k,JSON.stringify(v))}catch(e){}}};
const app=document.getElementById('app'),screen=document.getElementById('screen');

const S={lang:store.get('lang','ar'),pid:store.get('pid',null),name:store.get('pname',''),g:store.get('pg','m'),
  code:'',net:null,state:null,status:'form',err:'',sel:null,mode:null,retry:null,dropped:false,lastKey:''};
if(!S.pid){S.pid='p'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);store.set('pid',S.pid)}
const hashCode=()=>(location.hash||'').replace('#','').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
S.code=hashCode()||store.get('pcode','');

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
  chev:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'
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
  return '<header class="top"><span class="side"></span>'+floor(st)+'<span class="side end">'+(me.role?'<button class="peek" id="peek" aria-label="'+t('p_yourRole')+'"><span class="face"><img src="'+art(me.role,me.g,'face')+'" alt=""></span></button>':'')+'</span></header>'+
    (S.dropped?'<p class="banner">'+t('p_lost')+'</p>':'');
}
function ctl(st){return st.ctl?'<div class="hostctl"><span class="small">'+t('p_hostCtl')+'</span><button class="btn quiet" data-act="ctl">'+esc(st.ctl)+'</button></div>':''}

/* ---------- screens ---------- */
function formV(){
  show('night',
    '<div class="joinhero"><div class="logo" role="img" aria-label="جيرة"></div></div>'+
    '<h1 class="center-t">'+t('p_joinTitle')+'</h1>'+
    '<form id="jf" class="stack g12 mt24">'+
      '<label class="field"><input id="code" dir="ltr" autocomplete="off" autocapitalize="characters" maxlength="5" placeholder="'+t('p_codePh')+'" value="'+esc(S.code)+'"></label>'+
      '<label class="field"><input id="nm" maxlength="14" autocomplete="off" placeholder="'+t('p_name')+'" value="'+esc(S.name)+'">'+
      '<span class="gpick"><button type="button" data-act="g" data-g="m" class="'+(S.g==='m'?'on':'')+'" aria-label="'+t('male')+'">'+I.m+'</button><button type="button" data-act="g" data-g="f" class="'+(S.g==='f'?'on':'')+'" aria-label="'+t('female')+'">'+I.f+'</button></span></label>'+
      (S.err?'<p class="err">'+t(S.err)+'</p>':'')+
      '<div class="foot"><button class="btn" id="go">'+(S.status==='joining'?t('p_joining'):t('p_enter'))+'</button>'+
      '<button type="button" class="btn ghost" data-act="lang">'+(S.lang==='ar'?'English':'العربية')+'</button></div>'+
    '</form>','form');
  const f=document.getElementById('jf');
  f.addEventListener('submit',e=>{e.preventDefault();
    const code=document.getElementById('code').value.toUpperCase().replace(/[^A-Z0-9]/g,'');
    const nm=document.getElementById('nm').value.trim().replace(/\s+/g,' ');
    if(code.length<5||!nm){S.err=!nm?'p_name':'p_noRoom';formV();return}
    S.code=code;S.name=nm;store.set('pname',nm);store.set('pg',S.g);store.set('pcode',code);
    if(location.hash.slice(1)!==code)history.replaceState(null,'',location.pathname+location.search+'#'+code);
    connect();
  });
  if(!S.name){const n=document.getElementById('nm');if(n&&S.code)n.focus()}
}
function render(){
  const st=S.state;
  if(!st||S.status!=='in'){formV();return}
  const me=st.me,ph=st.phase;
  if(ph==='lobby')return lobbyV(st);
  if(ph==='roles')return rolesV(st);
  if(ph==='end')return endV(st);
  if(st.view==='out')return outV(st);
  if(st.view==='task')return taskV(st);
  if(st.view==='wait')return waitV(st);
  return screenV(st);
}
function lobbyV(st){
  const rows=st.players.map(p=>'<div class="row"><span class="name">'+esc(p.name)+'</span><span class="gbtn '+p.g+'">'+I[p.g]+'</span></div>').join('');
  show('night',top(st)+
    '<div class="stack g8"><span class="kicker">'+t('p_code')+' <b dir="ltr">'+esc(st.code)+'</b></span><h1>'+t('p_inLobby')+'</h1>'+
    '<p class="lead">'+(st.host?t('p_youHost'):t('p_waitHost'))+'</p></div>'+
    '<div class="list mt24">'+rows+'</div>'+
    '<div class="foot">'+(st.host?'<button class="btn" data-act="ctl" '+(st.ctl?'':'disabled')+'>'+(st.ctl?esc(st.ctl):t('p_waitingN',{n:num(st.min)}))+'</button>':'')+
    '<button class="btn ghost" data-act="leave">'+t('p_leave')+'</button></div>','lobby');
}
function rolesV(st){
  const me=st.me,team=ROLES[me.role].team;
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
    '<h2>'+t('p_waitOthers')+'</h2><p class="lead">'+(night?t('p_closeEyes'):t('hintVote'))+'</p></div>'+ctl(st),'wait'+st.phase+st.round+(st.smart?1:0));
}
function screenV(st){
  show(st.phase==='night'?'night':'day',top(st)+'<div class="stack center g16 grow" style="justify-content:center">'+bigIcon(I.tv)+'<h1>'+t('p_lookScreen')+'</h1></div>'+ctl(st),'screen'+st.phase);
}
function outV(st){
  const me=st.me;
  show('night',top(st)+'<div class="portrait mt16"><img src="'+art(me.role,me.g,'bust')+'" alt=""></div><div class="stack center g8"><h1>'+tg('p_outTitle',me.g)+'</h1><p class="lead">'+t('p_outLead')+'</p></div>'+ctl(st),'out'+st.phase);
}
function endV(st){
  const me=st.me;
  show('night',top(st)+'<div class="portrait mt16"><img src="'+art(me.role,me.g,'bust')+'" alt=""></div><div class="stack center g8"><span class="kicker">'+t('p_yourRole')+': '+rn(me.role,me.g)+'</span><h1 style="color:var(--'+(st.won?'good':'bad')+')">'+t(st.won?'p_youWon':'p_youLost')+'</h1><p class="lead">'+t('p_lookScreen')+'</p></div>'+ctl(st),'end'+st.round);
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
        const prev=S.state;S.state=m;S.status='in';S.dropped=false;
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

const A={
  g(el){S.g=el.dataset.g;store.set('pg',S.g);document.querySelectorAll('.gpick button').forEach(b=>b.classList.toggle('on',b.dataset.g===S.g))},
  lang(){S.lang=S.lang==='ar'?'en':'ar';store.set('lang',S.lang);setLang();render()},
  ctl(){send({t:'ctl'})},
  leave(){send({t:'leave'});S.status='form';S.state=null;try{S.net.close()}catch(e){}formV()},
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
if(S.code&&S.name&&store.get('pcode','')===S.code)connect();else formV();
window.__join={S,A};
})();
