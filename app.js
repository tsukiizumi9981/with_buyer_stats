const DRAFT_KEY="toulove-v3-draft";
let ORDERS_CACHE=[];
let CURRENT_USER=null;

function money(n){return "NT$"+Number(n||0).toLocaleString()}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function orderTotal(o){return (o.items||[]).reduce((s,x)=>s+x.price*x.qty,0)}
function orderUnits(o){return (o.items||[]).reduce((s,x)=>s+x.qty,0)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function setActiveNav(){const file=location.pathname.split("/").pop()||"index.html";document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("active",a.getAttribute("href")===file))}
function downloadCSV(filename,rows){const csv="\uFEFF"+rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}

function authUI(){
  const wrap=document.createElement('div');
  wrap.id='authBar'; wrap.className='auth-bar';
  wrap.innerHTML='<span id="cloudState">☁️ 連線中…</span><span id="userInfo"></span><button id="loginBtn" class="gold">Google 登入</button><button id="logoutBtn" class="secondary hidden">登出</button>';
  document.body.prepend(wrap);
  loginBtn.onclick=()=>fbAuth.signInWithPopup(googleProvider).catch(e=>alert('登入失敗：'+e.message));
  logoutBtn.onclick=()=>fbAuth.signOut();
}
function requireAuth(){return new Promise(resolve=>{
  fbAuth.onAuthStateChanged(user=>{
    CURRENT_USER=user||null;
    userInfo.textContent=user?`${user.displayName||user.email}`:'尚未登入';
    loginBtn.classList.toggle('hidden',!!user); logoutBtn.classList.toggle('hidden',!user);
    cloudState.textContent=user?'☁️ Firestore 已連線':'🔒 請先登入';
    document.documentElement.classList.toggle('signed-out',!user);
    resolve(user);
  });
})}
async function getOrders(){
  if(!CURRENT_USER)return [];
  const snap=await fbDb.collection('orders').orderBy('updatedAt','desc').get();
  ORDERS_CACHE=snap.docs.map(d=>({id:d.id,...d.data()})); return ORDERS_CACHE;
}
function listenOrders(callback){
  if(!CURRENT_USER){callback([]);return ()=>{}};
  return fbDb.collection('orders').orderBy('updatedAt','desc').onSnapshot(s=>{
    ORDERS_CACHE=s.docs.map(d=>({id:d.id,...d.data()}));callback(ORDERS_CACHE);
  },e=>{console.error(e);cloudState.textContent='⚠️ 雲端讀取失敗';});
}
async function getOrder(id){if(!CURRENT_USER)return null;const d=await fbDb.collection('orders').doc(id).get();return d.exists?{id:d.id,...d.data()}:null}
async function saveOrder(order){
  if(!CURRENT_USER)throw new Error('請先登入');
  const now=Date.now(), id=order.id||uid();
  const payload={...order,id:firebase.firestore.FieldValue.delete(),updatedAt:now,updatedBy:CURRENT_USER.email||CURRENT_USER.uid};
  if(!payload.createdAt)payload.createdAt=now;
  await fbDb.collection('orders').doc(id).set(payload,{merge:true}); return id;
}
async function deleteOrder(id){if(!CURRENT_USER)throw new Error('請先登入');await fbDb.collection('orders').doc(id).delete()}
async function replaceAllOrders(orders){
  if(!CURRENT_USER)throw new Error('請先登入');
  const old=await fbDb.collection('orders').get();
  const chunks=[];let batch=fbDb.batch(),count=0;
  old.docs.forEach(d=>{batch.delete(d.ref);if(++count===450){chunks.push(batch.commit());batch=fbDb.batch();count=0}});if(count)chunks.push(batch.commit());await Promise.all(chunks);
  for(let i=0;i<orders.length;i+=400){const b=fbDb.batch();orders.slice(i,i+400).forEach(o=>{const id=o.id||uid();const data={...o};delete data.id;b.set(fbDb.collection('orders').doc(id),data)});await b.commit()}
}
async function initApp(){setActiveNav();authUI();return requireAuth()}
document.addEventListener('DOMContentLoaded',()=>initApp());
