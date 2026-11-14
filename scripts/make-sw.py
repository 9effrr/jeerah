import os,json,time
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
keep=['index.html','tv.html','join.html','app.css','tv.css','app.js','tv.js','join.js','data.js','net.js','manifest.webmanifest','assets','lib']
files=[]
for k in keep:
    p=os.path.join(root,k)
    if os.path.isdir(p):
        for r,_,fs in os.walk(p):
            for f in fs:
                if not f.startswith('.'): files.append(os.path.relpath(os.path.join(r,f),root))
    else: files.append(k)
files.sort()
v='jeerah-'+time.strftime('%Y%m%d%H%M')
open(os.path.join(root,'sw.js'),'w').write("""/* Jeerah offline cache */
const V='%s';
const FILES=%s;
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(['./',...FILES])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
""" % (v,json.dumps(files)))
print(len(files),'files')
