const DRAFT_KEY="toulove-v3-draft";
let ORDERS_CACHE=[];
let CURRENT_USER=null;
let AUTH_INITIALIZED=false;
let AUTH_FIRST_STATE_RESOLVED=false;
let AUTH_FIRST_STATE_RESOLVE;
const AUTH_FIRST_STATE=new Promise(resolve=>{AUTH_FIRST_STATE_RESOLVE=resolve});

function moneyTwd(n){return "NT$"+Number(n||0).toLocaleString()}
function moneyJpy(n){return "¥"+Number(n||0).toLocaleString()}
function money(n){return moneyTwd(n)}
function productPriceInfo(productName){
  const all=[...Object.values(PRODUCTS||{}),...Object.values(RANDOM_PRODUCTS||{})];
  return all.find(p=>p.name===productName)||{jp:0,twd:0};
}
function itemPriceJpy(item){const info=productPriceInfo(item?.product);return Number(item?.priceJpy ?? item?.jp ?? info.jp ?? 0)}
function itemPriceTwd(item){const info=productPriceInfo(item?.product);return Number(item?.priceTwd ?? item?.twd ?? item?.price ?? info.twd ?? 0)}
function itemQty(item){return Number(item?.qty||0)}
function itemSubtotalJpy(item){return itemPriceJpy(item)*itemQty(item)}
function itemSubtotalTwd(item){return itemPriceTwd(item)*itemQty(item)}
function dualMoney(jpy,twd){return `${moneyJpy(jpy)}／${moneyTwd(twd)}`}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function orderTotalJpy(o){return (o?.items||[]).reduce((s,x)=>s+itemSubtotalJpy(x),0)}
function orderTotalTwd(o){return (o?.items||[]).reduce((s,x)=>s+itemSubtotalTwd(x),0)}
function orderTotal(o){return orderTotalTwd(o)}
function orderUnits(o){return (o?.items||[]).reduce((s,x)=>s+itemQty(x),0)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function setActiveNav(){const file=location.pathname.split("/").pop()||"index.html";document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("active",a.getAttribute("href")===file))}
function downloadCSV(filename,rows){const csv="\uFEFF"+rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}

function setCloudState(text){const el=document.getElementById("cloudState");if(el)el.textContent=text}
function authUI(){
  if(document.getElementById("authBar"))return;
  const wrap=document.createElement("div");wrap.id="authBar";wrap.className="auth-bar";
  wrap.innerHTML='<span id="cloudState">☁️ 連線中…</span><span id="userInfo"></span><button id="loginBtn" class="gold">Google 登入</button><button id="logoutBtn" class="secondary hidden">登出</button>';
  document.body.prepend(wrap);
  document.getElementById("loginBtn").onclick=()=>fbAuth.signInWithPopup(googleProvider).catch(e=>alert("登入失敗："+e.message));
  document.getElementById("logoutBtn").onclick=()=>fbAuth.signOut();
}
function initAuth(){
  if(AUTH_INITIALIZED)return AUTH_FIRST_STATE;
  AUTH_INITIALIZED=true;
  fbAuth.onAuthStateChanged(user=>{
    CURRENT_USER=user||null;
    const userInfo=document.getElementById("userInfo"),loginBtn=document.getElementById("loginBtn"),logoutBtn=document.getElementById("logoutBtn");
    if(userInfo)userInfo.textContent=user?(user.displayName||user.email):"尚未登入";
    if(loginBtn)loginBtn.classList.toggle("hidden",!!user);
    if(logoutBtn)logoutBtn.classList.toggle("hidden",!user);
    setCloudState(user?"☁️ Firestore 已連線":"🔒 請先登入");
    document.documentElement.classList.toggle("signed-out",!user);
    if(!AUTH_FIRST_STATE_RESOLVED){AUTH_FIRST_STATE_RESOLVED=true;AUTH_FIRST_STATE_RESOLVE(user||null)}
    window.dispatchEvent(new CustomEvent("app-auth-changed",{detail:{user:user||null}}));
  },error=>{console.error(error);setCloudState("⚠️ 登入狀態讀取失敗");if(!AUTH_FIRST_STATE_RESOLVED){AUTH_FIRST_STATE_RESOLVED=true;AUTH_FIRST_STATE_RESOLVE(null)}});
  return AUTH_FIRST_STATE;
}
async function requireAuth(){await initAuth();return fbAuth.currentUser||CURRENT_USER}
function onUserReady(callback){
  let lastUid="__unset__";
  const run=user=>{const uid=user?.uid||"";if(uid===lastUid)return;lastUid=uid;callback(user||null)};
  const handler=e=>run(e.detail.user);
  window.addEventListener("app-auth-changed",handler);
  initAuth().then(()=>run(fbAuth.currentUser||CURRENT_USER));
  return ()=>window.removeEventListener("app-auth-changed",handler);
}
function normalizeOrder(raw,id){
  const o={id,...(raw||{})};
  o.items=Array.isArray(o.items)?o.items.map(x=>({...x,qty:itemQty(x)})):[];
  return o;
}
async function getOrders(){
  const user=await requireAuth();if(!user)return [];
  const snap=await fbDb.collection("orders").get();
  ORDERS_CACHE=snap.docs.map(d=>normalizeOrder(d.data(),d.id)).sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0));
  return ORDERS_CACHE;
}
function listenOrders(callback,onError){
  let unsubscribe=()=>{},cancelled=false;
  requireAuth().then(user=>{
    if(cancelled)return;
    if(!user){callback([]);return;}
    setCloudState("☁️ 正在同步…");
    unsubscribe=fbDb.collection("orders").onSnapshot(s=>{
      ORDERS_CACHE=s.docs.map(d=>normalizeOrder(d.data(),d.id)).sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0));
      setCloudState(`☁️ Firestore 已同步（${ORDERS_CACHE.length} 筆）`);callback(ORDERS_CACHE);
    },e=>{console.error(e);setCloudState("⚠️ 雲端讀取失敗");if(onError)onError(e);else alert("Firestore 讀取失敗："+e.message)});
  }).catch(e=>{console.error(e);if(onError)onError(e)});
  return ()=>{cancelled=true;unsubscribe()};
}
async function getOrder(id){const user=await requireAuth();if(!user)return null;const d=await fbDb.collection("orders").doc(id).get();return d.exists?normalizeOrder(d.data(),d.id):null}
async function saveOrder(order){
  const user=await requireAuth();if(!user)throw new Error("請先登入");
  const now=Date.now(),id=order.id||uid();const payload={...order,updatedAt:now,updatedBy:user.email||user.uid};delete payload.id;
  payload.items=(payload.items||[]).map(x=>({...x,qty:itemQty(x),priceJpy:itemPriceJpy(x),priceTwd:itemPriceTwd(x),price:itemPriceTwd(x)}));
  if(!payload.createdAt)payload.createdAt=now;await fbDb.collection("orders").doc(id).set(payload,{merge:true});return id;
}
async function deleteOrder(id){const user=await requireAuth();if(!user)throw new Error("請先登入");await fbDb.collection("orders").doc(id).delete()}
async function replaceAllOrders(orders){
  const user=await requireAuth();if(!user)throw new Error("請先登入");const old=await fbDb.collection("orders").get();
  for(let i=0;i<old.docs.length;i+=400){const b=fbDb.batch();old.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit()}
  for(let i=0;i<orders.length;i+=400){const b=fbDb.batch();orders.slice(i,i+400).forEach(o=>{const id=o.id||uid(),data={...o};delete data.id;data.items=(data.items||[]).map(x=>({...x,qty:itemQty(x),priceJpy:itemPriceJpy(x),priceTwd:itemPriceTwd(x),price:itemPriceTwd(x)}));if(!data.updatedAt)data.updatedAt=Date.now();if(!data.createdAt)data.createdAt=data.updatedAt;b.set(fbDb.collection("orders").doc(id),data)});await b.commit()}
}
async function initApp(){setActiveNav();authUI();return initAuth()}
document.addEventListener("DOMContentLoaded",initApp);
