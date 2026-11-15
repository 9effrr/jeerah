/* Back navigation: system back button/gesture through history, plus an edge swipe on iPhone app modes */
(function(){
'use strict';
window.Back={
  sync(){},
  init(o){
    let armed=false;
    const arm=()=>{if(!armed&&!o.root()){try{history.pushState({jeerah:1},'')}catch(e){}armed=true}};
    addEventListener('popstate',()=>{armed=false;if(!o.root()){o.back();arm()}});
    this.sync=()=>{if(o.root()){if(armed){armed=false;try{history.back()}catch(e){}}}else arm()};
    this.sync();
    const ua=navigator.userAgent,ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const standalone=navigator.standalone||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
    const custom=(ios&&(standalone||window.Capacitor))||/[?&]swipe=1/.test(location.search);
    if(!custom)return;
    let s=null;
    addEventListener('touchstart',e=>{
      const t=e.touches[0],w=innerWidth;
      s=(e.touches.length===1&&(t.clientX<22||t.clientX>w-22))?{x:t.clientX,y:t.clientY,left:t.clientX<22,t:Date.now()}:null;
    },{passive:true});
    addEventListener('touchend',e=>{
      if(!s)return;const t=e.changedTouches[0],dx=t.clientX-s.x,dy=Math.abs(t.clientY-s.y),ok=(s.left?dx:-dx)>70&&dy<70&&Date.now()-s.t<700;s=null;
      if(ok&&!o.root()){o.back();Back.sync()}
    },{passive:true});
    addEventListener('touchcancel',()=>{s=null},{passive:true});
  }
};
})();
