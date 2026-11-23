/* Network layer for phone sessions and the council screen.
   Every host listens on several paths at once, so phones on any network can reach it:
   - relay: small public MQTT brokers over secure WebSocket (works behind any NAT, on mobile data)
   - peer:  direct WebRTC through PeerJS (fast when both sides allow it)
   A phone tries the relays first and falls back to WebRTC.
   Testing: add ?local=1 to both pages to use BroadcastChannel inside one browser. */
(function(){
'use strict';
const PREFIX='jeerah-v1-';
const TOPIC='jeerah/v2/';
const ALL_BROKERS=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt','wss://test.mosquitto.org:8081/mqtt'];
const BR=(location.search.match(/[?&]br=(\d)/)||[])[1];
const BROKERS=BR!=null?[ALL_BROKERS[+BR]]:ALL_BROKERS;
const isLocal=()=>/[?&]local=1/.test(location.search);
const rid=()=>Math.random().toString(36).slice(2,10);

/* ---------- a very small MQTT 3.1.1 client (QoS 0) over WebSocket ---------- */
const enc=new TextEncoder(),dec=new TextDecoder();
function strBytes(s){const b=enc.encode(s);return [b.length>>8,b.length&255,...b]}
function lenBytes(n){const o=[];do{let d=n%128;n=Math.floor(n/128);if(n>0)d|=128;o.push(d)}while(n>0);return o}
function packet(type,body){return new Uint8Array([type,...lenBytes(body.length),...body])}
function mqtt(url,o){
  let ws,ready=false,closed=false,ping=null,pid=1,buf=new Uint8Array(0);
  const subs=new Set();
  try{ws=new WebSocket(url,'mqtt')}catch(e){setTimeout(()=>o.fail&&o.fail(),0);return{close(){}}}
  ws.binaryType='arraybuffer';
  const fail=setTimeout(()=>{if(!ready){closed=true;try{ws.close()}catch(e){}o.fail&&o.fail()}},6000);
  ws.onopen=()=>{
    const body=[...strBytes('MQTT'),4,2,0,30,...strBytes('jeerah-'+rid())];
    ws.send(packet(0x10,body));
  };
  ws.onmessage=e=>{
    const d=new Uint8Array(e.data),n=new Uint8Array(buf.length+d.length);n.set(buf);n.set(d,buf.length);buf=n;
    for(;;){
      if(buf.length<2)return;
      let mul=1,len=0,i=1,b;
      do{if(i>=buf.length)return;b=buf[i++];len+=(b&127)*mul;mul*=128}while(b&128);
      if(buf.length<i+len)return;
      const type=buf[0]>>4,p=buf.subarray(i,i+len);buf=buf.slice(i+len);
      if(type===2){ // CONNACK
        if(p[1]!==0){try{ws.close()}catch(e){}return}
        clearTimeout(fail);ready=true;
        ping=setInterval(()=>{try{ws.send(new Uint8Array([0xC0,0]))}catch(e){}},20000);
        o.ready&&o.ready();
      }else if(type===3){ // PUBLISH
        const tl=(p[0]<<8)|p[1],topic=dec.decode(p.subarray(2,2+tl)),pl=p.subarray(2+tl);
        let m;try{m=JSON.parse(dec.decode(pl))}catch(x){continue}
        o.msg&&o.msg(topic,m);
      }
    }
  };
  ws.onclose=ws.onerror=()=>{clearTimeout(fail);clearInterval(ping);const was=ready;ready=false;
    if(closed)return;closed=true;if(was)o.lost&&o.lost();else o.fail&&o.fail()};
  return{
    sub(t){if(subs.has(t)||!ready)return;subs.add(t);const id=pid++&65535||1;ws.send(packet(0x82,[id>>8,id&255,...strBytes(t),0]))},
    pub(t,m){if(!ready)return;try{ws.send(packet(0x30,[...strBytes(t),...enc.encode(JSON.stringify(m))]))}catch(e){}},
    get ready(){return ready},
    close(){closed=true;clearInterval(ping);try{if(ready)ws.send(new Uint8Array([0xE0,0]))}catch(e){}try{ws.close()}catch(e){}}
  };
}

/* ---------- relay host: listens on every broker it can reach ---------- */
function hostRelay(code,on,ready){
  const conns={},links=[];let opened=false;
  const T=TOPIC+code;
  function link(bi,delay){
    if(stopped)return;
    const l=mqtt(BROKERS[bi],{
      ready(){l.sub(T+'/h');links[bi]=l;if(!opened){opened=true;ready()}},
      msg(topic,m){
        if(!m||!m.cid)return;const cid='r'+bi+':'+m.cid;
        if(m.k==='hello'){
          l.pub(T+'/c/'+m.cid,{k:'ack'});
          if(!conns[cid]){conns[cid]={bi,c:m.cid,seen:Date.now()};on.connect(cid)}else conns[cid].seen=Date.now();
        }else if(m.k==='ping'){if(conns[cid])conns[cid].seen=Date.now();else l.pub(T+'/c/'+m.cid,{k:'drop'})}
        else if(m.k==='bye'){if(conns[cid]){delete conns[cid];on.close&&on.close(cid)}}
        else if(m.k==='d'&&conns[cid]){conns[cid].seen=Date.now();on.msg(cid,m.d)}
      },
      lost(){delete links[bi];setTimeout(()=>link(bi),3000)},
      fail(){setTimeout(()=>link(bi),Math.min(30000,(delay||4000)*2))}
    });
  }
  let stopped=false;
  BROKERS.forEach((u,bi)=>link(bi));
  const beat=setInterval(()=>{
    const now=Date.now();
    links.forEach(l=>l&&l.pub(T+'/all',{k:'hb'}));
    for(const cid in conns)if(now-conns[cid].seen>25000){delete conns[cid];on.close&&on.close(cid)}
  },5000);
  return{
    owns:cid=>cid in conns,
    send(cid,data){const c=conns[cid],l=c&&links[c.bi];if(l)l.pub(T+'/c/'+c.c,{k:'d',d:data})},
    drop(cid){const c=conns[cid],l=c&&links[c.bi];if(l)l.pub(T+'/c/'+c.c,{k:'drop'});delete conns[cid]},
    close(){stopped=true;clearInterval(beat);links.forEach(l=>l&&l.close())}
  };
}
/* ---------- relay phone: first broker that answers ---------- */
function joinRelay(code,on,fallback){
  const T=TOPIC+code,cid=rid();let bi=0,l=null,acked=false,closed=false,beat=null,last=0,wait=null;
  function next(){
    if(closed)return;
    if(bi>=BROKERS.length){fallback();return}
    const url=BROKERS[bi++];
    l=mqtt(url,{
      ready(){l.sub(T+'/c/'+cid);l.sub(T+'/all');l.pub(T+'/h',{k:'hello',cid});
        wait=setTimeout(()=>{if(!acked){try{l.close()}catch(e){}next()}},4000)},
      msg(topic,m){
        if(!m)return;last=Date.now();
        if(m.k==='ack'&&!acked){acked=true;clearTimeout(wait);window.Net.via='relay'+(bi-1);on.open();
          beat=setInterval(()=>{l.pub(T+'/h',{k:'ping',cid});if(Date.now()-last>20000){stop();on.close()}},5000)}
        else if(m.k==='d')on.msg(m.d);
        else if(m.k==='drop'){stop();on.close()}
      },
      lost(){if(acked){stop();on.close()}},
      fail(){next()}
    });
  }
  function stop(){closed=true;clearInterval(beat);clearTimeout(wait);try{l&&l.close()}catch(e){}}
  addEventListener('pagehide',()=>{if(l&&acked)l.pub(T+'/h',{k:'bye',cid})});
  next();
  return{send(d){if(l&&acked)l.pub(T+'/h',{k:'d',cid,d})},close(){if(l&&acked)l.pub(T+'/h',{k:'bye',cid});stop()}};
}

/* ---------- WebRTC through PeerJS ---------- */
const ICE={config:{iceServers:[
  {urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},
  {urls:'turn:eu-0.turn.peerjs.com:3478',username:'peerjs',credential:'peerjsp'},
  {urls:'turn:us-0.turn.peerjs.com:3478',username:'peerjs',credential:'peerjsp'}
]}};
function hostPeer(code,on,ready){
  const conns={};let peer,dead=false;
  try{peer=new Peer(PREFIX+code,Object.assign({debug:0},ICE))}catch(e){return null}
  peer.on('open',()=>ready());
  peer.on('error',e=>{if(e.type==='unavailable-id'){dead=true;try{peer.destroy()}catch(x){}}});
  peer.on('disconnected',()=>{if(!dead)setTimeout(()=>{try{peer.reconnect()}catch(x){}},1500)});
  peer.on('connection',conn=>{
    const cid='p:'+conn.connectionId;
    conn.on('open',()=>{conns[cid]=conn;on.connect(cid)});
    conn.on('data',d=>on.msg(cid,d));
    const gone=()=>{if(conns[cid]){delete conns[cid];on.close&&on.close(cid)}};
    conn.on('close',gone);conn.on('error',gone);
  });
  return{
    owns:cid=>cid in conns,
    send(cid,data){const c=conns[cid];if(c&&c.open){try{c.send(data)}catch(x){}}},
    drop(cid){const c=conns[cid];if(c){try{c.close()}catch(x){}}},
    close(){dead=true;try{peer.destroy()}catch(x){}}
  };
}
function joinPeer(code,on){
  let peer,conn,closed=false,opened=false;
  peer=new Peer(Object.assign({debug:0},ICE));
  const t=setTimeout(()=>{if(!opened&&!closed){closed=true;try{peer.destroy()}catch(x){}on.error('net')}},15000);
  peer.on('open',()=>{
    conn=peer.connect(PREFIX+code,{reliable:true});
    conn.on('open',()=>{opened=true;clearTimeout(t);window.Net.via='peer';on.open()});
    conn.on('data',d=>on.msg(d));
    conn.on('close',()=>{if(!closed)on.close()});
    conn.on('error',()=>{if(!closed)on.close()});
  });
  peer.on('error',e=>{if(closed)return;clearTimeout(t);if(e.type==='peer-unavailable')on.error('noroom');else if(!opened)on.error('net');else on.close()});
  return{send(d){if(conn&&conn.open){try{conn.send(d)}catch(x){}}},close(){closed=true;clearTimeout(t);try{peer.destroy()}catch(x){}}};
}

/* ---------- local testing ---------- */
function hostLocal(code,on){
  const bc=new BroadcastChannel('jeerah-'+code);
  bc.onmessage=e=>{const m=e.data;if(m.to!=='host')return;
    if(m.kind==='hello')on.connect(m.cid);else if(m.kind==='bye')on.close&&on.close(m.cid);else on.msg(m.cid,m.data)};
  setTimeout(()=>on.open(code),0);
  return{send(cid,data){bc.postMessage({to:cid,data})},drop(cid){bc.postMessage({to:cid,kind:'drop'})},close(){bc.close()}};
}
function joinLocal(code,on){
  const cid='c'+rid();
  const bc=new BroadcastChannel('jeerah-'+code);
  bc.onmessage=e=>{const m=e.data;if(m.to!==cid)return;if(m.kind==='drop'){on.close();return}on.msg(m.data)};
  setTimeout(()=>{bc.postMessage({to:'host',kind:'hello',cid});on.open()},60);
  addEventListener('pagehide',()=>bc.postMessage({to:'host',kind:'bye',cid}));
  return{send(d){bc.postMessage({to:'host',cid,data:d})},close(){bc.postMessage({to:'host',kind:'bye',cid});bc.close()}};
}

/* ---------- public API ---------- */
function host(code,on){
  if(isLocal())return hostLocal(code,on);
  let opened=false;
  const ready=()=>{if(!opened){opened=true;clearTimeout(t);on.open(code)}};
  const ways=[hostRelay(code,on,ready),window.Peer?hostPeer(code,on,ready):null].filter(Boolean);
  const t=setTimeout(()=>{if(!opened)on.error&&on.error({type:'network'})},16000);
  const by=cid=>ways.find(w=>w.owns&&w.owns(cid));
  return{
    send(cid,data){const w=by(cid);if(w)w.send(cid,data)},
    drop(cid){const w=by(cid);if(w)w.drop(cid)},
    close(){clearTimeout(t);ways.forEach(w=>w.close())}
  };
}
function join(code,on){
  if(isLocal())return joinLocal(code,on);
  let cur=null;
  const fallback=()=>{cur=window.Peer?joinPeer(code,on):null;if(!cur)on.error('net')};
  cur=joinRelay(code,on,fallback);
  return{send(d){cur&&cur.send(d)},close(){cur&&cur.close()}};
}
window.Net={host,join,local:isLocal};
})();
