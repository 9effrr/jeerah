/* Network layer for the big-screen mode.
   Production: WebRTC through PeerJS (public signalling + relay servers).
   Testing: add ?local=1 to both pages to use BroadcastChannel inside one browser. */
(function(){
'use strict';
const PREFIX='jeerah-v1-';
const isLocal=()=>/[?&]local=1/.test(location.search);

function hostLocal(code,on){
  const bc=new BroadcastChannel('jeerah-'+code);
  bc.onmessage=e=>{const m=e.data;if(m.to!=='host')return;
    if(m.kind==='hello')on.connect(m.cid);else if(m.kind==='bye')on.close&&on.close(m.cid);else on.msg(m.cid,m.data)};
  setTimeout(()=>on.open(code),0);
  return{send(cid,data){bc.postMessage({to:cid,data})},drop(cid){bc.postMessage({to:cid,kind:'drop'})},close(){bc.close()}};
}
function joinLocal(code,on){
  const cid='c'+Math.random().toString(36).slice(2,9);
  const bc=new BroadcastChannel('jeerah-'+code);
  bc.onmessage=e=>{const m=e.data;if(m.to!==cid)return;if(m.kind==='drop'){on.close();return}on.msg(m.data)};
  setTimeout(()=>{bc.postMessage({to:'host',kind:'hello',cid});on.open()},60);
  addEventListener('pagehide',()=>bc.postMessage({to:'host',kind:'bye',cid}));
  return{send(d){bc.postMessage({to:'host',cid,data:d})},close(){bc.postMessage({to:'host',kind:'bye',cid});bc.close()}};
}

function hostPeer(code,on){
  const conns={};let peer,dead=false;
  function start(c){
    peer=new Peer(PREFIX+c,{debug:0});
    peer.on('open',()=>on.open(c));
    peer.on('error',e=>{
      if(e.type==='unavailable-id'){peer.destroy();const n=on.newCode();start(n);return}
      on.error&&on.error(e);
    });
    peer.on('disconnected',()=>{if(!dead)setTimeout(()=>{try{peer.reconnect()}catch(x){}},1500)});
    peer.on('connection',conn=>{
      conn.on('open',()=>{conns[conn.connectionId]=conn;on.connect(conn.connectionId)});
      conn.on('data',d=>on.msg(conn.connectionId,d));
      const gone=()=>{if(conns[conn.connectionId]){delete conns[conn.connectionId];on.close&&on.close(conn.connectionId)}};
      conn.on('close',gone);conn.on('error',gone);
    });
  }
  start(code);
  return{
    send(cid,data){const c=conns[cid];if(c&&c.open){try{c.send(data)}catch(x){}}},
    drop(cid){const c=conns[cid];if(c){try{c.close()}catch(x){}}},
    close(){dead=true;try{peer.destroy()}catch(x){}}
  };
}
function joinPeer(code,on){
  let peer,conn,closed=false,opened=false;
  peer=new Peer({debug:0});
  peer.on('open',()=>{
    conn=peer.connect(PREFIX+code,{reliable:true});
    conn.on('open',()=>{opened=true;on.open()});
    conn.on('data',d=>on.msg(d));
    conn.on('close',()=>{if(!closed)on.close()});
    conn.on('error',()=>{if(!closed)on.close()});
  });
  peer.on('error',e=>{if(e.type==='peer-unavailable')on.error('noroom');else if(!opened)on.error('net');else on.close()});
  return{send(d){if(conn&&conn.open){try{conn.send(d)}catch(x){}}},close(){closed=true;try{peer.destroy()}catch(x){}}};
}

window.Net={
  host(code,on){return isLocal()?hostLocal(code,on):hostPeer(code,on)},
  join(code,on){return isLocal()?joinLocal(code,on):joinPeer(code,on)},
  local:isLocal
};
})();
