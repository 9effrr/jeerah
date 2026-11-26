/* جيرة — Jeerah. Pass-the-phone neighbourhood mystery game. */
(function(){
'use strict';

/* ---------- storage ---------- */
const store={
  get(k,d){try{const v=localStorage.getItem('jeerah:'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem('jeerah:'+k,JSON.stringify(v))}catch(e){}}
};

/* ---------- text ---------- */
const {T,ROLES,SPECIALS,ROLE_ORDER,MIN,MAX}=window.JDATA;

/* ---------- state ---------- */
const S={
  lang:store.get('lang','ar'),
  sound:store.get('sound',true),
  names:store.get('names',[]),
  genders:store.get('genders',[]),
  newG:'m', castG:'m',
  cfg:Object.assign({sabs:0,timer:180,roles:{smart:true,fixer:true,legal:true,solid:true,complainer:true}},store.get('cfg',{})),
  game:null, cur:null, timer:null
};

const app=document.getElementById('app'), screen=document.getElementById('screen');

const PK=new Set(['hold','holdSub','seeFirst','team_solo','fixQ','smartQ','legalQ','legalKillD','legalSaveD','legalNoneD','legalSaveQ','decoyQ','p_joinTitle','p_started','p_nameTaken','p_youHost','p_closeEyes','p_outLead','p_youWon','p_youLost','p_peek','p_leaveAsk','h_new','h_orJoin','h_joinB','h_full']);
function t(k,v){if(S.cg==='f'&&PK.has(k)&&T[S.lang][k+'_f']!=null)k=k+'_f';let s=(T[S.lang][k]!=null?T[S.lang][k]:T.ar[k])||k;if(v)for(const key in v)s=s.split('{'+key+'}').join(v[key]);return s}
function cnt(k,n){const f=t(k).split('|');if(f.length===1)return f[0].split('{n}').join(num(n));
  let s;if(f.length===2)s=n===1?f[0]:f[1];else s=n===1?f[0]:n===2?f[1]:(n%100>=3&&n%100<=10)?f[2]:f[3];return s.split('{n}').join(num(n))}
function num(n){return S.lang==='ar'?Number(n).toLocaleString('ar-EG',{useGrouping:false}):String(n)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function tg(k,g,v){return t(g==='f'&&T[S.lang][k+'_f']!=null?k+'_f':k,v)}
function rn(r,g){return tg('r_'+r,g)}
function art(r,g,kind){return 'assets/ch/'+r+(g==='f'?'-f':'')+'-'+kind+'.webp'}
function gOf(i){return S.genders[i]==='f'?'f':'m'}
function apt(i){return (Math.floor(i/2)+1)*100+(i%2)+1}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

const I={
  menu:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  m:'<svg viewBox="0 0 24 24"><circle cx="10" cy="14" r="5.5"/><path d="M14 10l6-6M15 4h5v5"/></svg>',
  f:'<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.5"/><path d="M12 14.5V22M8.5 18.5h7"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  chev:'<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  vol:'<svg viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>',
  mute:'<svg viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4V5zM16 9.5l5 5M21 9.5l-5 5"/></svg>',
  moon:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></svg>',
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
  users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M18.5 14.8c1.7.8 2.7 2.5 3 5.2"/></svg>',
  flag:'<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  touch:'<svg viewBox="0 0 24 24"><path d="M12 11V5.5a1.75 1.75 0 013.5 0V12l3.2.9a2.5 2.5 0 011.8 2.8l-.6 3.3a3 3 0 01-3 2.5h-4.2a4 4 0 01-3.2-1.6L6 15.5a1.6 1.6 0 012.5-2l1.5 1.6V8a1 1 0 012 0"/></svg>',
  up:'<svg viewBox="0 0 10 10"><path d="M5 1.5l4 7H1z"/></svg>',
  down:'<svg viewBox="0 0 10 10"><path d="M5 8.5l4-7H1z"/></svg>'
};

/* ---------- sound ---------- */
const audio={};let voNow=null,bgm=null;
function snd(name,vol){
  if(!S.sound)return null;
  try{
    let a=audio[name];
    if(!a){a=audio[name]=new Audio('assets/audio/'+name+'.mp3');a.preload='auto'}
    a.currentTime=0;a.volume=vol==null?0.6:vol;
    const p=a.play();if(p&&p.catch)p.catch(()=>{});
    return a;
  }catch(e){return null}
}
function vo(name){stopVo();if(S.lang!=='ar')return;voNow=snd(name,1)}
function stopVo(){if(voNow){try{voNow.pause()}catch(e){}voNow=null}}
function music(on){
  try{
    if(on&&S.sound){
      if(!bgm){bgm=new Audio('assets/audio/bgm.mp3');bgm.loop=true;bgm.volume=0.18}
      const p=bgm.play();if(p&&p.catch)p.catch(()=>{});
    }else if(bgm){bgm.pause()}
  }catch(e){}
}
function tap(){snd('click_2',0.35)}

/* ---------- render helpers ---------- */
function setLang(){
  document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==='ar'?'rtl':'ltr';
  document.title=S.lang==='ar'?'جيرة':'Jeerah';
}
function stopTimer(){if(S.timer){clearInterval(S.timer);S.timer=null}}
function show(theme,html,cls,keep){
  if(!keep)stopTimer();
  app.dataset.theme=theme;
  screen.className='screen '+(cls||'');
  screen.innerHTML=html;
  screen.scrollTop=0;
  void screen.offsetWidth;
  screen.classList.add('enter');
}
function view(fn){S.cur=fn;S.cg=null;fn();Back.sync()}
function floor(){
  const g=S.game;if(!g)return '';
  let txt,ic;
  if(g.phase==='deal'){txt=t('dealFloor');ic=''}
  else if(g.phase==='night'){txt=t('nightFloor',{n:num(g.round)});ic=I.down}
  else if(g.phase==='end'){txt=t('endFloor');ic=''}
  else{txt=t('dayFloor',{n:num(g.round)});ic=I.up}
  return '<span class="floor">'+ic+'<span>'+txt+'</span></span>';
}
function topbar(){
  return '<header class="top"><span class="side"></span>'+floor()+
    '<span class="side end"><button class="icon-btn" data-act="menu" aria-label="'+t('menu')+'">'+I.menu+'</button></span></header>';
}
function face(role,g){return '<span class="face"><img src="'+art(role,g,'face')+'" alt=""></span>'}
function toast(msg){
  const old=app.querySelector('.toast');if(old)old.remove();
  const el=document.createElement('div');el.className='toast';el.textContent=msg;app.appendChild(el);
  setTimeout(()=>el.remove(),1800);
}

/* ---------- sheets ---------- */
function closeSheet(){const s=app.querySelector('.sheet-wrap');if(s)s.remove();Back.sync()}
function sheet(html){
  closeSheet();
  const w=document.createElement('div');w.className='sheet-wrap';
  w.innerHTML='<div class="sheet"><div class="grab"></div>'+html+'</div>';
  w.addEventListener('click',e=>{if(e.target===w)closeSheet()});
  app.appendChild(w);Back.sync();
}
function menuSheet(){
  const inGame=!!S.game;
  sheet('<h2>'+t('menu')+'</h2>'+
    '<div class="opt"><div class="txt"><b>'+t('sound')+'</b><span>'+t('soundD')+'</span></div><button class="switch '+(S.sound?'on':'')+'" data-act="sound" aria-label="'+t('sound')+'"></button></div>'+
    '<button class="opt" data-act="lang" style="width:100%;text-align:start"><div class="txt"><b>'+t('lang')+'</b><span>'+t('langD')+'</span></div></button>'+
    (inGame?'<button class="opt" data-act="quit-ask" style="width:100%;text-align:start"><div class="txt"><b style="color:var(--bad)">'+t('quit')+'</b><span>'+t('quitD')+'</span></div></button>':'')+
    '<div class="foot"><button class="btn quiet" data-act="close-sheet">'+t('done')+'</button></div>');
}
function quitSheet(){
  sheet('<h2>'+t('quitAsk')+'</h2><div class="foot"><button class="btn" data-act="close-sheet">'+t('stay')+'</button><button class="btn ghost" data-act="quit">'+t('quitYes')+'</button></div>');
}

/* ---------- home + guide ---------- */
const AD_URL='https://firsthome.mohup.gov.om/go/priar2732';
function adBanner(){
  return '<a class="adb" href="'+AD_URL+'" target="_blank" rel="noopener" aria-label="'+t('ad_aria')+'" data-act="ad">'+
    '<img class="sakna" src="assets/ad/sakna.png" alt="" width="715" height="645">'+
    '<span class="adtxt"><img class="mohup" src="assets/ad/mohup.png" alt="" width="983" height="232">'+
      '<b class="adh">'+t('ad_h')+'</b>'+
      '<span class="adsave">'+t('ad_save')+' <b dir="ltr">40%</b></span><span class="adtw">'+t('ad_twice')+'</span></span>'+
    '<span class="adqr"><span class="qrbox"><img src="assets/ad/qr.svg" alt=""></span><span class="reg">'+t('ad_reg')+'</span></span></a>';
}
function home(){
  S.game=null;music(false);stopVo();
  show('night',
    '<div class="cover"><div class="bar">'+
      '<button class="icon-btn" data-act="sound" aria-label="'+t('sound')+'">'+(S.sound?I.vol:I.mute)+'</button>'+
      '<button class="text-btn" data-act="lang">'+(S.lang==='ar'?'EN':'ع')+'</button></div>'+
      '<img src="assets/scene/cover.webp" alt="" width="1400" height="1400"></div>'+
    '<div class="hero"><div class="logo" role="img" aria-label="جيرة Jeerah"></div>'+
      '<p class="tag">'+t('tag')+'</p><p class="meta">'+t('meta')+'</p></div>'+adBanner()+
    '<div class="foot"><button class="btn" data-act="enter">'+t('enterB')+'</button>'+
      '<div class="links"><button class="btn ghost" data-act="howto">'+t('howto')+'</button><button class="btn ghost" data-act="cast">'+t('cast')+'</button></div></div>'+
    '<p class="credit">'+(window.HAAY_LOGO?'<img src="assets/haay.png" alt="">':'')+'<span>'+t('credit')+'</span></p>',
    'home');
}
function enterV(){
  const ic={one:'<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/></svg>',
    each:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="7.5" height="13" rx="2"/><rect x="13.5" y="6" width="7.5" height="13" rx="2"/><path d="M6 16h1.5M16.5 16H18"/></svg>',
    tv:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'};
  const m=(act,href,k,a,b)=>'<button class="mode" data-act="'+act+'"'+(href?' data-href="'+href+'"':'')+'><span class="mic">'+ic[k]+'</span><span class="txt"><b>'+t(a)+'</b><span>'+t(b)+'</span></span><span class="chev">'+I.chev+'</span></button>';
  show('night',backBar()+'<h1 class="mt16">'+t('p_modeTitle')+'</h1>'+
    '<div class="modes cardsm">'+m('to-setup','','one','m_one','m_oneD')+m('go','join.html','each','m_each','m_eachD')+m('go','tv.html','tv','m_tv','m_tvD')+'</div>');
}
function backBar(title){
  return '<header class="top"><span class="side"><button class="icon-btn" data-act="home" aria-label="'+t('back')+'">'+(S.lang==='ar'?I.chev:I.back)+'</button></span>'+
    (title||'<span></span>')+'<span class="side end"></span></header>';
}
function howto(){
  const g=S.castG||'m',b=(r,gg)=>art(r,gg||g,'bust');
  const faces=ROLE_ORDER.map((r,i)=>'<img src="'+art(r,i%2?'f':'m','face')+'" alt="">').join('');
  show('day',backBar()+
    '<div class="bento">'+
      '<section class="tile story-t"><div class="pic"><img src="assets/scene/cover.webp" alt=""></div>'+
        '<div class="in"><h1>'+t('storyT')+'</h1><p>'+t('story1')+'</p><p class="em">'+t('story2')+'</p><p>'+t('story3')+'</p></div></section>'+
      '<section class="tile stat"><b>'+t('statN')+'</b><span>'+t('statNd')+'</span></section>'+
      '<section class="tile stat alt"><b>'+t('statM')+'</b><span>'+t('statMd')+'</span></section>'+
      '<h2 class="bhead">'+t('howSub')+'</h2>'+
      '<section class="tile night"><span class="moon"></span><i class="st s1"></i><i class="st s2"></i><i class="st s3"></i>'+
        '<div class="txt"><b>'+t('s1')+'</b><p>'+t('t1d')+'</p></div><img class="who" src="'+b('saboteur','m')+'" alt=""></section>'+
      '<section class="tile morning"><span class="sun"></span>'+
        '<div class="txt"><b>'+t('s2')+'</b><p>'+t('t2d')+'</p></div><img class="who" src="'+b('smart','m')+'" alt=""></section>'+
      '<section class="tile council"><div class="txt"><b>'+t('s3')+'</b><p>'+t('t3d')+'</p></div><div class="faces">'+faces+'</div></section>'+
      '<section class="tile win good"><div class="txt"><b>'+t('wg')+'</b><p>'+t('wgD')+'</p></div><img class="who" src="'+b('resident','m')+'" alt=""></section>'+
      '<section class="tile win sab"><div class="txt"><b>'+t('ws')+'</b><p>'+t('wsD')+'</p></div><img class="who" src="'+b('saboteur','f')+'" alt=""></section>'+
    '</div>'+
    '<div class="foot"><button class="btn" data-act="enter">'+t('start')+'</button></div>');
}
function cast(){
  const g=S.castG;
  const cards=ROLE_ORDER.map(r=>'<section class="card"><div class="art"><img src="'+art(r,g,'full')+'" alt="'+rn(r,g)+'"></div>'+
    '<h1>'+rn(r,g)+'</h1><p>'+tg('d_'+r,g)+'</p></section>').join('');
  show('day',backBar('<span class="seg"><button data-act="cast-g" data-g="m" class="'+(g==='m'?'on':'')+'">'+t('men')+'</button><button data-act="cast-g" data-g="f" class="'+(g==='f'?'on':'')+'">'+t('women')+'</button></span>')+
    '<div class="gallery" id="gal">'+cards+'</div>'+
    '<div class="dots" id="dots">'+ROLE_ORDER.map((_,i)=>'<i class="'+(i?'':'on')+'"></i>').join('')+'</div>');
  const gal=document.getElementById('gal'),dots=document.getElementById('dots').children;
  gal.addEventListener('scroll',()=>{
    const i=Math.round(Math.abs(gal.scrollLeft)/gal.clientWidth);
    for(let k=0;k<dots.length;k++)dots[k].classList.toggle('on',k===i);
  },{passive:true});
}

/* ---------- setup ---------- */
function compose(n){
  const auto=n<=6?1:n<=9?2:n<=13?3:4;
  const maxS=Math.max(1,Math.ceil(n/2)-1);
  const sabs=Math.min(maxS,Math.max(1,S.cfg.sabs||auto));
  let sp=SPECIALS.filter(r=>S.cfg.roles[r]);
  while(sabs+sp.length>n)sp.pop();
  return {sabs,sp,res:n-sabs-sp.length,maxS,auto};
}
function castLine(){
  const n=Math.max(S.names.length,MIN),c=compose(n);
  const parts=[cnt('nSab',c.sabs)].concat(c.sp.map(r=>rn(r)));
  if(c.res>0)parts.push(cnt('nRes',c.res));
  if(S.lang==='en'&&c.sabs===1)parts[0]=parts[0].replace(/s$/,'');
  const faces=['saboteur'].concat(c.sp).concat(c.res>0?['resident']:[]).slice(0,5);
  return '<button class="cast" data-act="roles"><span class="faces">'+faces.map(face).join('')+'</span>'+
    '<span class="txt"><b>'+t('rolesIn')+'</b>'+parts.join(' · ')+'</span><span class="chev">'+I.chev+'</span></button>';
}
function setup(){
  const n=S.names.length;
  const rows=S.names.map((nm,i)=>'<div class="row"><span class="apt">'+num(apt(i))+'</span><span class="name">'+esc(nm)+'</span>'+
    '<button class="gbtn '+gOf(i)+'" data-act="gender" data-i="'+i+'" aria-label="'+t(gOf(i)==='f'?'female':'male')+'">'+I[gOf(i)]+'</button>'+
    '<button class="x" data-act="del" data-i="'+i+'" aria-label="×">'+I.x+'</button></div>').join('');
  show('day',backBar()+
    '<h1>'+t('setupTitle')+'</h1><p class="lead mt8">'+t('setupLead')+'</p>'+
    '<form class="field mt24" id="addf"><input id="nm" maxlength="14" autocomplete="off" enterkeyhint="done" placeholder="'+t('namePh')+'">'+
      '<span class="gpick"><button type="button" data-act="new-g" data-g="m" class="'+(S.newG==='m'?'on':'')+'" aria-label="'+t('male')+'">'+I.m+'</button><button type="button" data-act="new-g" data-g="f" class="'+(S.newG==='f'?'on':'')+'" aria-label="'+t('female')+'">'+I.f+'</button></span>'+
      '<button class="add" aria-label="+">'+I.plus+'</button></form>'+
    '<div class="list mt16" id="plist">'+rows+'</div>'+
    '<div class="foot">'+castLine()+
      '<button class="btn" data-act="deal" '+(n<MIN?'disabled':'')+'>'+(n<MIN?t('needMore',{n:num(MIN-n)}):t('deal'))+'</button></div>');
  document.getElementById('addf').addEventListener('submit',e=>{
    e.preventDefault();
    const inp=document.getElementById('nm'),v=inp.value.trim().replace(/\s+/g,' ');
    if(!v)return;
    if(S.names.length>=MAX)return toast(t('full'));
    if(S.names.some(x=>x===v))return toast(t('dup'));
    S.genders=S.names.map((_,k)=>gOf(k));S.names.push(v);S.genders.push(S.newG);store.set('names',S.names);store.set('genders',S.genders);tap();
    setup();
    const ni=document.getElementById('nm');if(ni)ni.focus({preventScroll:true});
    const pl=document.getElementById('plist');if(pl&&pl.lastElementChild)pl.lastElementChild.scrollIntoView({block:'nearest'});
  });
}
function rolesSheet(){
  const n=Math.max(S.names.length,MIN),c=compose(n);
  let h='<h2>'+t('sheetRoles')+'</h2><p class="small">'+t('pickRoles')+'</p>';
  h+='<div class="opt">'+face('saboteur')+'<div class="txt"><b>'+t('sabCount')+'</b><span>'+t('sabAuto')+'</span></div>'+
     '<div class="stepper"><button data-act="sab-" '+(c.sabs<=1?'disabled':'')+'>−</button><span>'+num(c.sabs)+'</span><button data-act="sab+" '+(c.sabs>=c.maxS?'disabled':'')+'>+</button></div></div>';
  SPECIALS.forEach(r=>{
    const on=!!S.cfg.roles[r],na=on&&c.sp.indexOf(r)<0;
    h+='<div class="opt'+(on?'':' off')+'">'+face(r)+'<div class="txt"><b>'+rn(r)+'</b><span'+(na?' class="warn"':'')+'>'+(na?t('noRoom'):t('d_'+r))+'</span></div>'+
       '<button class="switch '+(on?'on':'')+'" data-act="role" data-r="'+r+'" aria-label="'+rn(r)+'"></button></div>';
  });
  h+='<div class="opt"><div class="txt"><b>'+t('timer')+'</b><span>'+t('timerD')+'</span></div><div class="seg">'+
     [0,120,180,300].map(s=>'<button data-act="timer" data-s="'+s+'" class="'+(S.cfg.timer===s?'on':'')+'">'+(s?num(s/60):t('off'))+'</button>').join('')+'</div></div>';
  h+='<div class="foot"><button class="btn" data-act="close-roles">'+t('done')+'</button></div>';
  const prev=app.querySelector('.sheet');const st=prev?prev.scrollTop:0;
  sheet(h);
  const s=app.querySelector('.sheet');if(prev){s.style.animation='none';s.parentNode.style.animation='none';s.scrollTop=st}
}

/* ---------- game setup ---------- */
function newGame(){
  const n=S.names.length,c=compose(n);
  const pool=shuffle(Array(c.sabs).fill('saboteur').concat(c.sp).concat(Array(c.res).fill('resident')));
  S.game={
    phase:'deal',round:1,
    players:S.names.map((name,i)=>({id:i,name,g:gOf(i),apt:apt(i),role:pool[i],alive:true})),
    legal:{kill:false,save:false},lastProtect:null,immune:null,
    night:null,votes:null,sus:{},winner:null,soloName:null
  };
  dealTurn(0);
}
const alive=()=>S.game.players.filter(p=>p.alive);
const P=id=>S.game.players[id];

/* ---------- elevator doors hand-off ---------- */
function doorsRaw(o,then){
  stopVo();
  const old=app.querySelector('.doors');if(old)old.remove();
  const el=document.createElement('div');el.className='doors';
  el.innerHTML='<div class="door a"></div><div class="door b"></div>'+
    '<div class="doors-in">'+floor()+
    '<div class="mid"><span class="kicker">'+o.kicker+'</span><div class="who">'+o.who+'</div>'+(o.sub?'<span class="apt">'+o.sub+'</span>':'')+'</div>'+
    '<p class="hint">'+o.hint+'</p><button class="btn" data-act="open-doors">'+o.btn+'</button></div>';
  app.appendChild(el);
  void el.offsetWidth;el.classList.add('closed');
  let ready=false;
  setTimeout(()=>{then();ready=true},560);
  el._open=()=>{
    if(!ready)return;
    snd('Ding',0.35);
    el.classList.remove('closed');
    setTimeout(()=>el.remove(),600);
  };
}
function doors(p,hintKey,then){
  doorsRaw({kicker:t('passTo'),who:esc(p.name),sub:t('apt',{n:num(p.apt)}),hint:t(hintKey),btn:t('iam',{name:esc(p.name)})},then);
}

/* ---------- deal ---------- */
function dealTurn(i){
  const g=S.game;
  if(i>=g.players.length){return view(evening)}
  const p=g.players[i];
  doors(p,'hintDeal',()=>view(()=>reveal(p,i)));
}
function reveal(p,i){
  S.cg=p.g;
  const g=S.game,team=ROLES[p.role].team;
  const mates=g.players.filter(x=>x.role==='saboteur'&&x.id!==p.id).map(x=>esc(x.name));
  const extra=p.role==='saboteur'&&mates.length?'<br><b style="color:var(--bad);font-weight:600">'+t('yourTeam',{names:mates.join('، ')})+'</b>':'';
  show('night',topbar()+
    '<div class="stage" id="stage">'+
      '<div class="q"><span class="mark">'+I.touch+'</span><div class="stack center g4"><b style="font-size:18px;font-weight:600">'+t('hold')+'</b><span class="small">'+t('holdSub')+'</span></div></div>'+
      '<div class="secret"><div class="who"><span class="team '+team+'">'+t('team_'+team)+'</span><h1>'+rn(p.role,p.g)+'</h1></div>'+
        '<img class="art" src="'+art(p.role,p.g,'bust')+'" alt=""></div>'+
    '</div>'+
    '<p class="role-desc" id="rdesc"><span class="small">'+t('cardOf',{a:num(i+1),b:num(g.players.length)})+'</span></p>'+
    '<div class="foot"><button class="btn" id="nextb" data-act="deal-next" data-i="'+i+'" disabled>'+t('seeFirst')+'</button></div>');
  const st=document.getElementById('stage'),d=document.getElementById('rdesc'),nb=document.getElementById('nextb');
  const idle=d.innerHTML,full=tg('d_'+p.role,p.g)+extra;
  const on=e=>{e.preventDefault();st.classList.add('show');d.innerHTML=full;if(nb.disabled){nb.disabled=false;nb.textContent=t('next')}};
  const off=()=>{st.classList.remove('show');d.innerHTML=idle};
  st.addEventListener('pointerdown',on);
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>st.addEventListener(ev,off));
  st.addEventListener('contextmenu',e=>e.preventDefault());
}

/* ---------- night ---------- */
function evening(){
  const g=S.game;g.phase='night';g.immune=null;
  g.night={order:alive().map(p=>p.id),sabVotes:[],protect:null,kill:null,writ:null};
  show('night',
    '<div class="scene dark">'+topbar()+'<img src="assets/scene/window-peek.webp" alt=""></div>'+
    '<div class="after-scene stack g12"><h1>'+t('eveTitle')+'</h1><p class="lead">'+t('eveLead')+'</p></div>'+
    '<div class="foot"><button class="btn" data-act="night-start">'+t('eveBtn')+'</button></div>');
  vo(g.round===1?'voEvening':'voPostEvening');music(true);
}
function nightTurn(i){
  const g=S.game,order=g.night.order;
  if(i>=order.length)return doorsRaw({kicker:t('nightDoneK'),who:t('nightDone'),hint:t('nightDoneH'),btn:t('nightDoneB')},resolveNight);
  const p=P(order[i]);
  doors(p,'hintNight',()=>view(()=>nightAct(p,i)));
}
function me(p){
  return '<div class="me">'+face(p.role,p.g)+'<div class="txt"><span class="small">'+esc(p.name)+'</span><b>'+t('youAre',{role:rn(p.role,p.g)})+'</b></div></div>';
}
function picker(o){
  S.pick={sel:null,onConfirm:o.onConfirm,onSkip:o.onSkip};
  const rows=o.options.map(x=>'<button class="row '+(x.off?'off':'')+'" data-act="pick" data-id="'+x.id+'">'+
    '<span class="apt">'+num(x.apt)+'</span><span class="name">'+esc(x.name)+'</span>'+(x.note?'<span class="note">'+x.note+'</span>':'')+
    '<span class="tick">'+I.check+'</span></button>').join('');
  show(o.theme,topbar()+(o.head||'')+
    '<h2 class="pick-title">'+o.title+'</h2>'+(o.sub?'<p class="small">'+o.sub+'</p>':'')+
    '<div class="list mt16">'+rows+'</div>'+
    '<div class="foot"><button class="btn" id="okb" data-act="pick-ok" disabled>'+(o.ok||t('confirm'))+'</button>'+
    (o.skip?'<button class="btn ghost" data-act="pick-skip">'+o.skip+'</button>':'')+'</div>');
}
function opts(filter,notes){
  return alive().filter(filter).map(p=>({id:p.id,name:p.name,apt:p.apt,off:notes&&notes(p)==='off',note:notes&&notes(p)!=='off'?notes(p):''}));
}
function nightAct(p,i){
  S.cg=p.g;
  const g=S.game,n=g.night,next=()=>nightTurn(i+1);
  if(p.role==='saboteur'){
    const last=n.sabVotes.length?P(n.sabVotes[n.sabVotes.length-1]):null;
    picker({theme:'night',head:me(p),title:t('sabQ'),sub:last?t('sabTeam',{name:esc(last.name)}):'',
      options:opts(x=>x.role!=='saboteur'),onConfirm:id=>{n.sabVotes.push(id);next()}});
  }else if(p.role==='fixer'){
    picker({theme:'night',head:me(p),title:t('fixQ'),
      options:alive().map(x=>({id:x.id,name:x.name,apt:x.apt,off:x.id===g.lastProtect,note:x.id===g.lastProtect?t('fixNote'):''})),
      onConfirm:id=>{n.protect=id;next()}});
  }else if(p.role==='smart'){
    picker({theme:'night',head:me(p),title:t('smartQ'),options:opts(x=>x.id!==p.id),
      onConfirm:id=>view(()=>smartResult(P(id),next))});
  }else if(p.role==='legal'){
    legalMenu(p,next);
  }else{
    picker({theme:'night',head:me(p),title:t('decoyQ'),sub:t('decoySub'),options:opts(x=>x.id!==p.id),
      onConfirm:id=>{g.sus[id]=(g.sus[id]||0)+1;next()}});
  }
}
function smartResult(target,next){
  const sab=target.role==='saboteur';
  S.after=next;
  show('night',topbar()+
    '<div class="stack center g12 grow" style="justify-content:center"><span class="kicker">'+t('resTitle')+'</span>'+
    '<h1 style="color:var(--'+(sab?'bad':'good')+')">'+tg(sab?'isSab':'notSab',target.g,{name:esc(target.name)})+'</h1></div>'+
    '<div class="foot"><button class="btn" data-act="after">'+t('gotIt')+'</button></div>');
  snd(sab?'dum':'chimes',0.4);
}
function legalMenu(p,next){
  S.cg=p.g;
  const g=S.game;S.legalCtx={p,next};
  const m=(act,a,b,used)=>'<button class="mode '+(used?'used':'')+'" data-act="'+act+'"><span class="txt"><b>'+t(a)+(used?' · '+t('used'):'')+'</b><span>'+t(b)+'</span></span><span class="chev">'+I.chev+'</span></button>';
  show('night',topbar()+me(p)+'<h2 class="pick-title">'+t('legalQ')+'</h2>'+
    '<div class="modes">'+m('legal-kill','legalKill','legalKillD',g.legal.kill)+m('legal-save','legalSave','legalSaveD',g.legal.save)+m('legal-none','legalNone','legalNoneD',false)+'</div>');
}
function legalPick(kind){
  const g=S.game,{p,next}=S.legalCtx;
  picker({theme:'night',head:me(p),title:t(kind==='kill'?'legalKillQ':'legalSaveQ'),
    options:opts(x=>kind==='save'||x.id!==p.id),skip:t('back'),
    onSkip:()=>view(()=>legalMenu(p,next)),
    onConfirm:id=>{if(kind==='kill'){g.night.kill=id;g.legal.kill=true}else{g.night.writ=id;g.legal.save=true}next()}});
}
function sabTarget(votes){
  if(!votes.length)return null;
  const c={};let best=null,bn=0;
  votes.forEach(v=>{c[v]=(c[v]||0)+1});
  votes.forEach(v=>{if(c[v]>=bn){bn=c[v];best=v}});
  return best;
}
function resolveNight(){
  const g=S.game,n=g.night,rep=[];
  const target=sabTarget(n.sabVotes);
  g.lastProtect=n.protect;
  if(n.kill!=null){P(n.kill).alive=false;rep.push({k:'mornLegal',p:P(n.kill)})}
  if(target!=null&&target!==n.kill){
    if(target===n.protect||target===n.writ)rep.push({k:'mornSaved'});
    else{P(target).alive=false;rep.unshift({k:'mornHit',p:P(target)})}
  }
  if(n.writ!=null&&P(n.writ).alive){g.immune=n.writ;rep.push({k:'mornWrit',p:P(n.writ),plain:true})}
  if(!rep.length)rep.push({k:'mornQuiet'});
  g.report=rep;g.phase='day';
  music(false);
  view(morning);
}
function morning(){
  const g=S.game;
  const items=g.report.map((r,i)=>'<div class="item" style="animation-delay:'+(0.25+i*0.5)+'s"><p>'+
    (r.p?tg(r.k,r.p.g,{name:esc(r.p.name)}):t(r.k))+'</p>'+(r.p&&!r.plain?'<p class="small">'+tg('was',r.p.g,{role:rn(r.p.role,r.p.g)})+'</p>':'')+'</div>').join('');
  const w=checkWin();
  show('day',
    '<div class="scene">'+topbar()+'<img src="assets/scene/window-elder.webp" alt=""></div>'+
    '<div class="after-scene"><h1>'+t('mornTitle')+'</h1><div class="report">'+items+'</div></div>'+
    '<div class="foot"><button class="btn" data-act="'+(w?'end':'council')+'">'+t(w?'cont':'toCouncil')+'</button></div>');
  vo('voMorning');
}

/* ---------- council ---------- */
function fmt(s){const m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x}
function council(){
  const g=S.game,list=alive();
  g.left=S.cfg.timer;g.paused=false;
  const ppl=list.map(p=>'<span class="'+(p.id===g.immune?'shield':'')+'">'+esc(p.name)+'<i>'+num(p.apt)+'</i></span>').join('');
  show('day',topbar()+
    '<div class="stack center g8 mt16"><h1>'+t('councilTitle')+'</h1><p class="lead">'+t('councilLead')+'</p></div>'+
    (S.cfg.timer?'<div class="stack center mt32"><div class="clock" id="clock">'+fmt(g.left)+'</div>'+
      '<div class="clock-ctl"><button class="chip" data-act="pause" id="pauseb">'+t('pause')+'</button><button class="chip" data-act="plus30">'+t('plus30')+'</button></div></div>':'')+
    '<div class="stack center g8 mt32"><span class="kicker">'+t('present',{n:num(list.length)})+'</span><div class="people">'+ppl+'</div></div>'+
    '<div class="foot"><button class="btn" data-act="vote-start">'+t('toVote')+'</button></div>');
  vo('voCouncil');
  if(S.cfg.timer)startClock();
}
function startClock(){
  const g=S.game;stopTimer();
  S.timer=setInterval(()=>{
    if(g.paused)return;
    g.left=Math.max(0,g.left-1);
    const c=document.getElementById('clock');if(!c)return stopTimer();
    c.textContent=fmt(g.left);c.classList.toggle('low',g.left<=10);
    if(g.left===0){stopTimer();snd('alarm',0.5)}
  },1000);
}
function voteTurn(i){
  const g=S.game,order=g.voteOrder;
  if(i>=order.length)return doorsRaw({kicker:t('voteDoneK'),who:t('voteDone'),hint:t('voteDoneH'),btn:t('voteDoneB')},()=>view(tally));
  const p=P(order[i]);
  doors(p,'hintVote',()=>view(()=>{
    S.cg=p.g;
    picker({theme:'day',head:'<p class="kicker" style="margin-bottom:8px">'+esc(p.name)+' · '+t('hintVote')+'</p>',
      title:t('voteQ'),options:opts(x=>x.id!==p.id&&x.id!==g.immune),skip:t('abstain'),
      onSkip:()=>voteTurn(i+1),onConfirm:id=>{g.votes[id]=(g.votes[id]||0)+1;voteTurn(i+1)}});
  }));
}
function tally(){
  const g=S.game;
  const rows=Object.keys(g.votes).map(id=>({p:P(+id),n:g.votes[id]})).sort((a,b)=>b.n-a.n);
  const top=rows.length?rows[0].n:0,tied=rows.filter(r=>r.n===top).length>1;
  g.verdict=(!rows.length||tied)?null:rows[0].p.id;
  const body=rows.length?'<div class="tally">'+rows.map((r,i)=>'<div class="t '+(r.n===top&&!tied?'top':'')+'" style="animation-delay:'+(0.2+i*0.25)+'s">'+
    '<span class="name">'+esc(r.p.name)+'</span><span class="dots">'+Array(r.n).fill('<i></i>').join('')+'</span><span class="n">'+num(r.n)+'</span></div>').join('')+'</div>'
    :'<p class="lead mt24">'+t('noVotes')+'</p>';
  show('day',topbar()+'<h1 class="mt16">'+t('tallyTitle')+'</h1>'+body+
    '<div class="foot"><button class="btn" data-act="verdict">'+t('verdictBtn')+'</button></div>');
  snd('ding_deep',0.4);
}
function verdict(){
  const g=S.game;
  if(g.verdict==null){
    show('day',topbar()+'<div class="stack center g12 grow" style="justify-content:center"><h1>'+t('tie')+'</h1><p class="lead">'+t('tieLead')+'</p></div>'+
      '<div class="foot"><button class="btn" data-act="next-night">'+t('toNight')+'</button></div>');
    return;
  }
  const p=P(g.verdict);p.alive=false;
  let act='next-night',label='toNight';
  if(p.role==='complainer'){g.winner='solo';g.soloName=p.name;act='end';label='cont'}
  else if(p.role==='solid'&&alive().length>0){act='solid';label='cont'}
  else if(checkWin()){act='end';label='cont'}
  outScreen(p,act,label);
  snd(p.role==='saboteur'?'chimes':'negative_sound',0.45);
}
function outScreen(p,act,label,kicker){
  const team=ROLES[p.role].team;
  show('day',topbar()+
    '<div class="stack center g4 mt8"><span class="kicker">'+(kicker||t('evicted'))+'</span><h1>'+esc(p.name)+'</h1>'+
    '<span class="small">'+tg('truth',p.g)+'</span><h2 style="color:var(--'+(team==='sab'?'bad':team==='solo'?'solo':'good')+')">'+rn(p.role,p.g)+'</h2></div>'+
    '<div class="portrait mt16"><img src="'+art(p.role,p.g,'bust')+'" alt=""></div>'+
    '<div class="foot"><button class="btn" data-act="'+act+'">'+t(label)+'</button></div>');
}
function solidStep(){
  const g=S.game,p=P(g.verdict);
  doors(p,'hintVote',()=>view(()=>{
    S.cg=p.g;
    picker({theme:'day',head:me(p),title:t('solidQ'),sub:t('solidKick'),options:opts(()=>true),
      onConfirm:id=>{
        const v=P(id);v.alive=false;
        const w=checkWin();
        view(()=>outScreen(v,w?'end':'next-night',w?'cont':'toNight',tg('solidOut',p.g,{a:esc(p.name)})));
        snd('negative_sound',0.45);
      }});
  }));
}
function checkWin(){
  const g=S.game;if(g.winner)return g.winner;
  const a=alive(),s=a.filter(p=>p.role==='saboteur').length,o=a.length-s;
  if(s===0)g.winner='good';else if(s>=o)g.winner='sab';
  return g.winner;
}

/* ---------- end ---------- */
function end(){
  const g=S.game;g.phase='end';music(false);
  const w=g.winner;
  let hero,title,lead,theme;
  if(w==='good'){theme='day';title=t('winGood');lead=t('winGoodLead');
    const gp=g.players.filter(p=>ROLES[p.role].team==='good'),pick=k=>gp[k%gp.length];
    hero='<div class="line">'+[0,1,2].map(k=>'<img src="'+art(pick(k).role,pick(k).g,'full')+'" alt="">').join('')+'</div>'}
  else if(w==='sab'){theme='night';title=t('winSab');lead=t('winSabLead');hero='<img class="bust" src="'+art('saboteur',g.players.find(p=>p.role==='saboteur').g,'bust')+'" alt="">'}
  else{const cp=g.players.find(p=>p.role==='complainer');theme='day';title=tg('winSolo',cp.g);lead=tg('winSoloLead',cp.g,{name:esc(g.soloName)});hero='<img class="bust" src="'+art('complainer',cp.g,'bust')+'" alt="">'}
  const col=r=>{const tm=ROLES[r].team;return 'var(--'+(tm==='sab'?'bad':tm==='solo'?'solo':'good')+')'};
  const roster=g.players.map(p=>'<div class="r '+(p.alive?'':'out')+'">'+face(p.role,p.g)+'<div class="txt"><b>'+esc(p.name)+'</b><span style="color:'+col(p.role)+'">'+rn(p.role,p.g)+'</span></div>'+
    '<span class="st">'+tg(p.alive?'alive':'out',p.g)+'</span></div>').join('');
  let sus='';const ids=Object.keys(g.sus);
  if(ids.length){const top=ids.sort((a,b)=>g.sus[b]-g.sus[a])[0];sus='<p class="small mt16">'+t('mostSus',{name:esc(P(+top).name)})+'</p>'}
  show(theme,
    '<div class="end-hero">'+hero+'</div>'+
    '<div class="stack center g8 mt16"><h1>'+title+'</h1><p class="lead">'+lead+'</p></div>'+
    '<div class="mt32"><span class="kicker">'+t('roster')+'</span><div class="roster">'+roster+'</div>'+sus+'</div>'+
    '<div class="foot"><button class="btn" data-act="again">'+t('again')+'</button><button class="btn ghost" data-act="home">'+t('home')+'</button></div>');
  vo(w==='good'?'voWinGood':w==='sab'?'voWinSab':'voWinJester');
}

/* ---------- actions ---------- */
const A={
  'home':()=>{closeSheet();view(home)},
  'enter':()=>view(enterV),
  'ad':(el,e)=>{},
  'go':el=>{location.href=el.dataset.href},
  'howto':()=>view(howto),
  'cast':()=>view(cast),
  'to-setup':()=>view(setup),
  'menu':menuSheet,
  'close-sheet':closeSheet,
  'close-roles':()=>{closeSheet();view(setup)},
  'roles':rolesSheet,
  'sound':()=>{S.sound=!S.sound;store.set('sound',S.sound);if(!S.sound){stopVo();music(false)}
     if(app.querySelector('.sheet-wrap'))menuSheet();else if(S.cur)S.cur()},
  'lang':()=>{S.lang=S.lang==='ar'?'en':'ar';store.set('lang',S.lang);setLang();stopVo();
     const sh=app.querySelector('.sheet-wrap');if(S.cur)S.cur();if(sh)menuSheet()},
  'quit-ask':quitSheet,
  'quit':()=>{closeSheet();const d=app.querySelector('.doors');if(d)d.remove();view(home)},
  'del':el=>{S.genders=S.names.map((_,k)=>gOf(k));S.names.splice(+el.dataset.i,1);S.genders.splice(+el.dataset.i,1);store.set('names',S.names);store.set('genders',S.genders);setup()},
  'gender':el=>{const i=+el.dataset.i;S.genders=S.names.map((_,k)=>gOf(k));S.genders[i]=S.genders[i]==='f'?'m':'f';store.set('genders',S.genders);
     el.className='gbtn '+S.genders[i];el.innerHTML=I[S.genders[i]];el.setAttribute('aria-label',t(S.genders[i]==='f'?'female':'male'))},
  'new-g':el=>{S.newG=el.dataset.g;screen.querySelectorAll('.gpick button').forEach(b=>b.classList.toggle('on',b.dataset.g===S.newG))},
  'cast-g':el=>{S.castG=el.dataset.g;cast()},
  'sab-':()=>{const c=compose(Math.max(S.names.length,MIN));S.cfg.sabs=Math.max(1,c.sabs-1);store.set('cfg',S.cfg);rolesSheet()},
  'sab+':()=>{const c=compose(Math.max(S.names.length,MIN));S.cfg.sabs=Math.min(c.maxS,c.sabs+1);store.set('cfg',S.cfg);rolesSheet()},
  'role':el=>{const r=el.dataset.r;S.cfg.roles[r]=!S.cfg.roles[r];store.set('cfg',S.cfg);rolesSheet()},
  'timer':el=>{S.cfg.timer=+el.dataset.s;store.set('cfg',S.cfg);rolesSheet()},
  'deal':()=>{if(S.names.length>=MIN)newGame()},
  'open-doors':()=>{const d=app.querySelector('.doors');if(d&&d._open)d._open()},
  'deal-next':el=>dealTurn(+el.dataset.i+1),
  'night-start':()=>{stopVo();nightTurn(0)},
  'pick':el=>{
    S.pick.sel=+el.dataset.id;
    screen.querySelectorAll('.row.sel').forEach(r=>r.classList.remove('sel'));
    el.classList.add('sel');document.getElementById('okb').disabled=false;
  },
  'pick-ok':()=>{if(S.pick&&S.pick.sel!=null){const f=S.pick.onConfirm,id=S.pick.sel;S.pick=null;f(id)}},
  'pick-skip':()=>{if(S.pick&&S.pick.onSkip){const f=S.pick.onSkip;S.pick=null;f()}},
  'after':()=>{const f=S.after;S.after=null;if(f)f()},
  'legal-kill':()=>legalPick('kill'),
  'legal-save':()=>legalPick('save'),
  'legal-none':()=>S.legalCtx.next(),
  'council':()=>{stopVo();view(council)},
  'pause':()=>{const g=S.game;g.paused=!g.paused;document.getElementById('pauseb').textContent=t(g.paused?'resume':'pause')},
  'plus30':()=>{const g=S.game;g.left+=30;const c=document.getElementById('clock');c.textContent=fmt(g.left);c.classList.remove('low');
     if(!S.timer)startClock()},
  'vote-start':()=>{const g=S.game;stopVo();stopTimer();g.votes={};g.voteOrder=alive().map(p=>p.id);voteTurn(0)},
  'verdict':()=>view(verdict),
  'solid':solidStep,
  'next-night':()=>{const g=S.game;g.round++;view(evening)},
  'end':()=>view(end),
  'again':()=>newGame()
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el||el.disabled)return;
  const f=A[el.dataset.act];if(!f)return;
  if(el.dataset.act!=='open-doors')tap();
  f(el);
});

setLang();
Back.init({
  root:()=>S.cur===home&&!S.game&&!app.querySelector('.sheet-wrap'),
  back(){
    if(app.querySelector('.sheet-wrap')){closeSheet();return}
    if(S.game){quitSheet();return}
    view(home);
  }
});
if(/[?&]m=1/.test(location.search)){history.replaceState(null,'',location.pathname);view(enterV)}else view(home);
window.__jeerah={S,A,P,alive};
})();
