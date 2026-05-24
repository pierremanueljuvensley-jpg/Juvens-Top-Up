import { useState, useEffect } from "react";

const JT_LOGO = "";
const LOGO_FF = "";
const LOGO_PUBG = "";
const LOGO_EFF = "";
const LOGO_NETFLIX = "";
const LOGO_PRIME = "";
const LOGO_DISNEY = "";
const LOGO_CRUNCHY = "";
const LOGO_CANVA = "";
const LOGO_BINANCE = "";
const LOGO_WISE = "";
// Itilize un proxy CORS-libre + fallback emoji solid si imaj la pa chaje
const IMG_PROXY = "https://images.weserv.nl/?url=";
const LOGO_BLOOD  = IMG_PROXY + encodeURIComponent("woodflixht.com/wp-content/uploads/2026/02/3af22734a41da2c74cdb38a63c2c65c0.jpg");
const LOGO_APPLE  = IMG_PROXY + encodeURIComponent("woodflixht.com/wp-content/uploads/2025/11/61ETtqE9uaL.jpg");
const LOGO_ROBLOX = IMG_PROXY + encodeURIComponent("woodflixht.com/wp-content/uploads/2026/02/telechargement-2.jpeg");
const LOGO_MERU   = IMG_PROXY + encodeURIComponent("woodflixht.com/wp-content/uploads/2026/02/telechargement.jpeg");
const IMG_FALLBACK = {
  [LOGO_BLOOD]:  { emoji:"🩸", bg:"#1a1a2e" },
  [LOGO_APPLE]:  { emoji:"🍎", bg:"#555" },
  [LOGO_ROBLOX]: { emoji:"🟥", bg:"#e53935" },
  [LOGO_MERU]:   { emoji:"📱", bg:"#1e40af" },
};
function ImgWithFallback({ src, alt, style, fallbackEmoji="🖼", fallbackBg="#f0f0f0" }) {
  const [failed, setFailed] = useState(false);
  const fb = IMG_FALLBACK[src] || { emoji: fallbackEmoji, bg: fallbackBg };
  if (failed) return (
    <div style={{...style, background:fb.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize: parseInt((style&&style.height)||(style&&style.width)||"44")*0.6 || 32}}>
      {fb.emoji}
    </div>
  );
  return <img src={src} alt={alt} style={style} onError={()=>setFailed(true)} />;
}
let _toast = null;
function copyText(text, cb) {
  const done = () => { if (cb) cb(); if (_toast) _toast(text); };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fbCopy(text, done));
  } else fbCopy(text, done);
}
function fbCopy(text, done) {
  const el = document.createElement("textarea");
  el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
  document.body.appendChild(el); el.focus(); el.select();
  try { document.execCommand("copy"); } catch(e) {}
  document.body.removeChild(el); if (done) done();
}
const USER_DB = {};
const NOTIF_STORE = {};

// ─── SHARED ORDERS STORE (Frontend + Dashboard) ───────────────────────────────
// Free Fire (id=1) → statut "livre" imedya
// Tout lòt sèvis → statut "en_cours" (admin dwe valide)
const SHARED_ORDERS = typeof window !== "undefined"
  ? (window.__JUVENS_ORDERS__ = window.__JUVENS_ORDERS__ || [])
  : [];

function pushOrder(order) {
  SHARED_ORDERS.unshift(order);
  try { _STORE["jt_orders"] = JSON.stringify(SHARED_ORDERS.slice(0,50)); } catch(e) {}
}
function getOrders() {
  try {
    const s = _STORE["jt_orders"];
    if (s) {
      const saved = JSON.parse(s);
      saved.forEach(o => {
        if (!SHARED_ORDERS.find(x => x.id === o.id)) SHARED_ORDERS.push(o);
      });
    }
  } catch(e) {}
  return SHARED_ORDERS;
}
function validateOrder(orderId) {
  const o = SHARED_ORDERS.find(x => x.id === orderId);
  if (o) { o.status = "livre"; o.validatedAt = new Date(); }
  try { _STORE["jt_orders"] = JSON.stringify(SHARED_ORDERS.slice(0,50)); } catch(e) {}
}
// Chak fwa yon kliyan achte, nou mete ajou pwen li yo
const LEADERBOARD_DB = {};
function lbAdd(email, nom, amount) {
  if (!email) return;
  if (!LEADERBOARD_DB[email]) LEADERBOARD_DB[email] = { nom, points: 0, orders: 0 };
  LEADERBOARD_DB[email].points += amount;
  LEADERBOARD_DB[email].orders += 1;
  try { _STORE["jt_lb"] = JSON.stringify(LEADERBOARD_DB); } catch(e) {}
}
function lbGet() {
  try {
    const saved = (_STORE["jt_lb"]||null);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(parsed).forEach(k => { LEADERBOARD_DB[k] = parsed[k]; });
    }
  } catch(e) {}
  return Object.entries(LEADERBOARD_DB)
    .map(([email, d]) => ({ email, nom: d.nom, points: d.points, orders: d.orders }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
}
function pushNotif(email, msg, icon="🔔") {
  if (!NOTIF_STORE[email]) NOTIF_STORE[email] = [];
  NOTIF_STORE[email].unshift({ id: Date.now()+"_"+Math.random(), msg, icon, date: new Date(), read: false });
}
const F = "DM Sans, sans-serif";
// needsUID: UID + Nom (Bloodstrike, PUBG)
// needsTag: Tag/Mail (Gift Cards)

const PRODUCTS = {
  jeux: [
    { id:1, name:"Free Fire",    emoji:"🔥", type:"ff",  img:LOGO_FF,
      variants:[{l:"110 💎",p:160},{l:"220 💎",p:320},{l:"341 💎",p:480},{l:"572 💎",p:800},{l:"680 💎",p:960},{l:"1160 💎",p:1600},{l:"2400 💎",p:3200},{l:"6166 💎",p:7500},{l:"Booyah Pass 🎫",p:500},{l:"Abon. Semaine 📅",p:350},{l:"Abon. Mois 📆",p:1550},{l:"Level Up ⬆️",p:950}]},
    { id:2, name:"Bloodstrike",  emoji:"🩸", type:"uid", img:LOGO_BLOOD,
      variants:[{l:"116 🥞",p:180},{l:"352 🥞",p:500},{l:"594 🥞",p:800},{l:"1210 🥞",p:1600},{l:"2486 🥞",p:3200},{l:"6380 🥞",p:7500}]},
    { id:3, name:"PubgMobile",   emoji:"🎯", type:"uid", img:LOGO_PUBG,
      variants:[{l:"60 UC",p:170},{l:"120 UC",p:330},{l:"325 UC",p:850},{l:"660 UC",p:1700},{l:"1800 UC",p:4500},{l:"3850 UC",p:9000},{l:"8100 UC",p:14500}]},
    { id:4, name:"eFootball 2026",emoji:"⚽",type:"eff", img:LOGO_EFF,
      variants:[{l:"130 🪙",p:230},{l:"300 🪙",p:520},{l:"550 🪙",p:950},{l:"750 🪙",p:1300},{l:"1040 🪙",p:1800},{l:"2130 🪙",p:3700},{l:"3250 🪙",p:5600},{l:"5700 🪙",p:9800},{l:"12800 🪙",p:16400}]},
  ],
  streaming: [
    { id:5, name:"Netflix",      emoji:"🎬", type:"stream", img:LOGO_NETFLIX,
      variants:[{l:"1 mois",p:500},{l:"2 mois",p:900},{l:"3 mois",p:1300},{l:"6 mois",p:2900}]},
    { id:6, name:"Prime Video",  emoji:"📺", type:"stream", img:LOGO_PRIME,
      variants:[{l:"1 mois",p:450}]},
    { id:7, name:"Disney+",      emoji:"✨", type:"stream", img:LOGO_DISNEY,
      variants:[{l:"1 mois",p:500},{l:"3 mois",p:1300},{l:"6 mois",p:2900}]},
    { id:8, name:"Crunchyroll",  emoji:"🍜", type:"stream", img:LOGO_CRUNCHY,
      variants:[{l:"1 mois",p:400},{l:"3 mois",p:1100},{l:"6 mois",p:1900}]},
  ],
  giftcard: [
    { id:9,  name:"Netflix Card USA", emoji:"🎁", type:"tag", img:LOGO_NETFLIX,
      variants:[{l:"15 USD",p:2700},{l:"20 USD",p:3600},{l:"25 USD",p:4500},{l:"30 USD",p:5400},{l:"40 USD",p:7200},{l:"50 USD",p:9000},{l:"100 USD",p:14500}]},
    { id:10, name:"Apple Card",       emoji:"🍎", type:"tag", img:LOGO_APPLE,
      variants:[{l:"2 USD",p:310},{l:"4 USD",p:620},{l:"5 USD",p:780},{l:"10 USD",p:1550},{l:"20 USD",p:3100},{l:"30 USD",p:4650},{l:"50 USD",p:7750},{l:"100 USD",p:15500}]},
    { id:11, name:"Roblox",           emoji:"🟥", type:"tag", img:LOGO_ROBLOX,
      variants:[{l:"$10 USD",p:820},{l:"$25 USD",p:2000}]},
  ],
  autres: [
    { id:12, name:"Canva Pro",     emoji:"🎨", type:"none", img:LOGO_CANVA,
      variants:[{l:"1 mois",p:400}]},
    { id:13, name:"Binance USDT",  emoji:"💰", type:"tag",  img:LOGO_BINANCE,
      variants:[{l:"$5 USDT",p:400},{l:"$10 USDT",p:800},{l:"$20 USDT",p:1600}]},
    { id:14, name:"Recharge Meru", emoji:"📱", type:"none", img:LOGO_MERU,
      variants:[{l:"HTG 145",p:145}]},
    { id:15, name:"Recharge Wise", emoji:"💸", type:"none", img:LOGO_WISE,
      variants:[{l:"HTG 145",p:145}]},
  ],
};
const ALL_PRODUCTS = Object.values(PRODUCTS).flat();
const FAQ = [
  {q:"Kijan pou m fè depo ak NatCash?", a:"Voye lajan nan nimewo 55 72 63 42 (JUVENS TOP UP). Antre TransCode ou nan paj Dépôt pou kredite wallet ou otomatikman."},
  {q:"Kijan pou m achte sou Juvens Top Up?", a:"Chwazi pwodwi a, chwazi kantite ou vle, antre UID ou (pou jeux), epi klike Commander. Livrezon imedya!"},
  {q:"Kijan pou m jwenn UID mwen?", a:"Ouvri jeu ou a → ale nan Pwofil → kopye nimewo ID ou a. Cole li nan chan UID la sou sit la."},
  {q:"Eske sèvis la otomatik?", a:"✅ Wi — 100% Otomatik. Apre ou fin peye, ou resevwa pwodwi a imedyatman."},
  {q:"Eske mwen ka jwenn ranbousman?", a:"❌ Non — Tout Acha Final. Pa gen ranbousman pou sèvis dijital."},
  {q:"Kijan pou m fè kòb ak Juvens? (Referral)", a:"Kopye link referral ou → Voye bay zanmi → Chak fwa yo achte, ou touche komisyon 💸"},
  {q:"Sit la sekirize?", a:"🔒 Wi — 100% Sekirize. Tout tranzaksyon yo pwoteje."},
];
const FF_DB = {"123456789":"DragonKing👑","987654321":"NightWolf💀","555000111":"Titanium⚡"};
function ffLookup(uid) {
  if (FF_DB[uid]) return FF_DB[uid];
  if (/^\d{6,12}$/.test(uid)) {
    const s = ["Pro🔥","King👑","Elite⚡","Beast💀","Legend🏆"];
    return "Player"+uid.slice(-4)+s[parseInt(uid.slice(-1))%s.length];
  }
  return null;
}
function r4() { return Math.random().toString(36).slice(2,6).toUpperCase(); }
function getDelivery(product) {
  const t = product.type||"none";
  if (t==="ff"||t==="uid") return {type:"uid"};
  if (t==="eff")    return {type:"msg", msg:"Mèsi! Nou ap kredite kont ou nan 5-15 minit. ✅"};
  if (t==="stream") return {type:"account", email:"user_"+r4().toLowerCase()+"@juvens.ht", pass:"Juv"+r4()+"!"};
  if (t==="tag") {
    const id = product.id;
    const pfx = id===9?"NFLX":id===10?"AAPL":id===11?"RBLX":"CARD";
    return {type:"code", code:`${pfx}-${r4()}-${r4()}-${r4()}`};
  }
  return {type:"msg", msg:"Sèvis la ap aktive otomatikman. ✅"};
}
const USED_CODES = new Set();
const inputS = { background:"#f5f5f5", border:"1px solid #e0e0e0", borderRadius:8, padding:"13px 14px", width:"100%", color:"#111", fontSize:14, marginBottom:10, outline:"none", boxSizing:"border-box", fontFamily:F };
const redBtn  = { background:"linear-gradient(135deg,#e74c3c,#c0392b)", color:"#fff", border:"none", borderRadius:8, padding:"14px", width:"100%", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:F, boxShadow:"0 4px 12px rgba(231,76,60,0.3)" };
const blueBtn = { background:"linear-gradient(135deg,#1e40af,#1a3a8f)", color:"#fff", border:"none", borderRadius:14, padding:"16px", width:"100%", fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:10 };
const card    = { background:"#fff", borderRadius:14, padding:18, marginBottom:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:"1px solid #f0f0f0" };
function CopyToast({ children }) {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    _toast = (t) => { setMsg(t); setTimeout(() => setMsg(null), 2500); };
    return () => { _toast = null; };
  }, []);
  return <>
    {children}
    {msg && <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", background:"#111", color:"#fff", borderRadius:30, padding:"10px 20px", fontSize:13, fontWeight:700, zIndex:9999, boxShadow:"0 4px 20px rgba(0,0,0,0.3)", display:"flex", alignItems:"center", gap:8, fontFamily:F, whiteSpace:"nowrap", animation:"fadeUp .25s ease" }}>
      <span>✅</span><span>Kopye: <b style={{color:"#4ade80"}}>{msg.length>30?msg.slice(0,30)+"...":msg}</b></span>
    </div>}
  </>;
}
function TOSModal({ onClose }) {
  const sections = [
    {t:"1. Akseptasyon", c:"Lè ou itilize Juvens Top Up, ou aksepte kondisyon sa yo nèt. Si ou pa dakò, tanpri pa itilize sèvis nou an."},
    {t:"2. Sèvis dijital", c:"Nou ofri sèvis rechaj dijital (jeux, streaming, gift cards). Tout livrezon otomatik apre peman konfime."},
    {t:"3. Peman NatCash", c:"Nou aksepte sèlman NatCash. Apre depo, antre TransCode ou pou kredite wallet ou. Tout depo yo final."},
    {t:"4. Ranbousman", c:"❌ Tout acha dijital yo FINAL. Pa gen ranbousman pou sèvis deja delivre. Verifye UID ou anvan ou achte."},
    {t:"5. Responsablite", c:"Ou responsab pou bay bon enfòmasyon. Juvens Top Up pa responsab pou pèt akòz done mal antre."},
    {t:"6. Kont & Sekirite", c:"Ou responsab pou kenbe modpas ou an sekirite. Juvens Top Up pa janm mande modpas ou."},
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:500,maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",fontFamily:F}}>
        <div style={{padding:"18px 20px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0,fontWeight:900,fontSize:18,color:"#111"}}>📄 Kondisyon Sèvis</h3>
          <button onClick={onClose} style={{background:"#f5f5f5",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:18,fontWeight:700}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px 20px",flex:1}}>
          {sections.map((s,i)=>(
            <div key={i} style={{marginBottom:16}}>
              <p style={{fontWeight:800,fontSize:14,color:"#e74c3c",margin:"0 0 4px"}}>{s.t}</p>
              <p style={{color:"#555",fontSize:13,lineHeight:1.7,margin:0}}>{s.c}</p>
            </div>
          ))}
          <p style={{textAlign:"center",color:"#ccc",fontSize:12,marginTop:8}}>© 2026 Juvens Top Up 🇭🇹</p>
        </div>
        <div style={{padding:"12px 20px 20px",borderTop:"1px solid #eee"}}>
          <button onClick={onClose} style={redBtn}>✅ Mwen Konprann & Aksepte</button>
        </div>
      </div>
    </div>
  );
}
function ForgotModal({ onClose }) {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,width:"88%",maxWidth:380,padding:24,fontFamily:F}}>
        <h3 style={{fontWeight:900,fontSize:20,color:"#111",margin:"0 0 6px"}}>🔑 Modpas Oublié</h3>
        <p style={{color:"#888",fontSize:13,margin:"0 0 16px"}}>Antre email ou pou resevwa yon lyen reyinisyalizasyon.</p>
        {sent ? (
          <div style={{background:"#e8f5e9",border:"1px solid #c8e6c9",borderRadius:10,padding:14,textAlign:"center"}}>
            <p style={{margin:0,color:"#1b5e20",fontWeight:600,fontSize:14}}>✅ Imel voye! Verifye bwat resepsyon ou.</p>
          </div>
        ) : (
          <>
            <input placeholder="Adresse email ou *" value={email} onChange={e=>setEmail(e.target.value)} style={{...inputS}} type="email" />
            <button onClick={()=>setSent(true)} disabled={!email} style={{...redBtn,opacity:email?1:0.5,cursor:email?"pointer":"not-allowed"}}>Voye lyen reyinisyalizasyon</button>
          </>
        )}
        <button onClick={onClose} style={{background:"none",border:"none",color:"#aaa",fontSize:13,cursor:"pointer",fontFamily:F,textDecoration:"underline",display:"block",margin:"12px auto 0"}}>Fèmen</button>
      </div>
    </div>
  );
}
function LoginModal({ mode, onClose, onLogin }) {
  const [tab, setTab]         = useState(mode);
  const [email, setEmail]     = useState(""); const [prenom, setPrenom] = useState("");
  const [nom, setNom]         = useState(""); const [pass, setPass]     = useState("");
  const [pass2, setPass2]     = useState(""); const [showP, setShowP]   = useState(false);
  const [showP2, setShowP2]   = useState(false);
  const [terms, setTerms]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [err, setErr]         = useState(""); const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showTOS, setShowTOS] = useState(false);

  const doLogin = () => {
    setErr("");
    if (!email || !pass) { setErr("Ranpli tout champ yo!"); return; }
    setLoading(true);
    setTimeout(() => {
      const saved = USER_DB[email.toLowerCase()];
      if (saved && saved.pass && saved.pass !== pass) {
        setErr("Modpas la pa kòrèk."); setLoading(false); return;
      }
      const fullName = saved ? saved.nom : email.split("@")[0];
      if (!saved) USER_DB[email.toLowerCase()] = { nom: fullName, pass, balance: 0, txs: [], refs: [] };
      onLogin({ nom: fullName, email: email.toLowerCase() });
      onClose();
    }, 1200);
  };

  const doRegister = () => {
    setErr("");
    if (!prenom || !nom || !email || !pass || !pass2) { setErr("Ranpli tout champ obligatwa yo!"); return; }
    if (pass !== pass2) { setErr("Modpas yo pa menm!"); return; }
    if (pass.length < 6) { setErr("Modpas dwe gen 6 karaktè omwen."); return; }
    if (!terms) { setErr("Ou dwe aksepte kondisyon yo pou kontinye."); return; }
    const emailLow = email.toLowerCase();
    if (USER_DB[emailLow]?.pass) { setErr("Yon kont deja egziste ak email sa a."); return; }
    setLoading(true);
    setTimeout(() => {
      const fullName = (prenom.trim() + " " + nom.trim()).trim() || email.split("@")[0];
      USER_DB[emailLow] = { nom: fullName, pass, balance: 0, txs: [], refs: [] };
      onLogin({ nom: fullName, email: emailLow });
      onClose();
    }, 1400);
  };

  const fieldWrap  = { display:"flex", alignItems:"center", background:"#f5f5f5", borderRadius:8, border:"1px solid #e0e0e0", marginBottom:12, overflow:"hidden" };
  const iconBox    = { width:46, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#888", borderRight:"1px solid #e0e0e0", alignSelf:"stretch" };
  const fieldInput = { flex:1, background:"none", border:"none", outline:"none", padding:"14px 12px", fontSize:14, color:"#111", fontFamily:F };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:800,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:500,maxHeight:"95vh",overflowY:"auto",fontFamily:F}}>
        {showForgot && <ForgotModal onClose={()=>setShowForgot(false)} />}
        {showTOS    && <TOSModal    onClose={()=>setShowTOS(false)} />}

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#e74c3c,#c0392b)",padding:"24px 20px 20px",textAlign:"center"}}>
          <p style={{margin:0,fontWeight:900,fontSize:26,color:"#fff",letterSpacing:-0.5}}>Juvens Top Up</p>
          <p style={{margin:"4px 0 0",color:"rgba(255,255,255,0.8)",fontSize:13}}>Platfòm Top Up #1 Ayiti 🇭🇹</p>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #eee"}}>
          {[["login","Koneksyon"],["register","Kreyasyon kont"]].map(([k,l])=>(
            <button key={k} onClick={()=>{
              setTab(k); setErr("");
              setEmail(""); setPass(""); setPass2("");
              setPrenom(""); setNom(""); setTerms(false);
              setShowP(false); setShowP2(false);
            }} style={{flex:1,padding:"14px 0",border:"none",background:"none",fontWeight:700,fontSize:15,cursor:"pointer",color:tab===k?"#e74c3c":"#888",borderBottom:tab===k?"3px solid #e74c3c":"3px solid transparent",fontFamily:F}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{padding:"20px 20px 28px"}}>
          {err && <div style={{background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 14px",marginBottom:14,color:"#e74c3c",fontSize:13,fontWeight:600}}>⚠️ {err}</div>}

          {tab === "login" ? (
            <>
              <div style={fieldWrap}><div style={iconBox}>📧</div><input type="email" placeholder="Adresse email *" value={email} onChange={e=>setEmail(e.target.value)} style={fieldInput} /></div>
              <div style={fieldWrap}>
                <div style={iconBox}>🔑</div>
                <input type={showP?"text":"password"} placeholder="Modpas *" value={pass} onChange={e=>setPass(e.target.value)} style={fieldInput} />
                <button onClick={()=>setShowP(v=>!v)} style={{background:"none",border:"none",padding:"0 14px",cursor:"pointer",fontSize:18,color:"#bbb"}}>{showP?"🙈":"👁"}</button>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                  <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
                  <span style={{fontSize:13,color:"#666"}}>Sonje mwen</span>
                </label>
                <button onClick={()=>setShowForgot(true)} style={{background:"none",border:"none",color:"#e74c3c",fontSize:13,cursor:"pointer",fontFamily:F,fontWeight:600}}>Modpas oublié?</button>
              </div>
              <button onClick={doLogin} disabled={loading} style={{...redBtn,opacity:loading?0.7:1}}>
                {loading ? "⏳ Koneksyon an kou..." : "🔐 Se Connecter"}
              </button>
              <p style={{textAlign:"center",color:"#aaa",fontSize:12,marginTop:14}}>Pa gen kont? <button onClick={()=>{setTab("register");setErr("");setEmail("");setPass("");setPass2("");setPrenom("");setNom("");setShowP(false);}} style={{background:"none",border:"none",color:"#e74c3c",fontSize:12,cursor:"pointer",fontFamily:F,fontWeight:700}}>Kreye yon kont</button></p>
            </>
          ) : (
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:0}}>
                <div style={{...fieldWrap,marginBottom:0}}><div style={{...iconBox,borderRight:"1px solid #e0e0e0"}}> 👤</div><input placeholder="Prenon *" value={prenom} onChange={e=>setPrenom(e.target.value)} style={{...fieldInput}} /></div>
                <div style={{...fieldWrap,marginBottom:0}}><input placeholder="Nom *" value={nom} onChange={e=>setNom(e.target.value)} style={{...fieldInput,padding:"14px 12px"}} /></div>
              </div>
              <div style={{height:12}} />
              <div style={fieldWrap}><div style={iconBox}>📧</div><input type="email" placeholder="Adresse email *" value={email} onChange={e=>setEmail(e.target.value)} style={fieldInput} /></div>
              <div style={fieldWrap}>
                <div style={iconBox}>🔑</div>
                <input type={showP?"text":"password"} placeholder="Modpas * (6 karaktè min.)" value={pass} onChange={e=>setPass(e.target.value)} style={fieldInput} />
                <button onClick={()=>setShowP(v=>!v)} style={{background:"none",border:"none",padding:"0 14px",cursor:"pointer",fontSize:18,color:"#bbb"}}>{showP?"🙈":"👁"}</button>
              </div>
              <div style={fieldWrap}>
                <div style={iconBox}>🔒</div>
                <input type={showP2?"text":"password"} placeholder="Konfime modpas *" value={pass2} onChange={e=>setPass2(e.target.value)} style={fieldInput} />
                <button onClick={()=>setShowP2(v=>!v)} style={{background:"none",border:"none",padding:"0 14px",cursor:"pointer",fontSize:18,color:"#bbb"}}>{showP2?"🙈":"👁"}</button>
              </div>
              {pass && pass2 && (
                <div style={{padding:"6px 10px",borderRadius:6,marginBottom:10,fontSize:12,fontWeight:700,background:pass===pass2?"#e8f5e9":"#fff5f5",color:pass===pass2?"#27ae60":"#e74c3c"}}>
                  {pass===pass2?"✅ Modpas yo menm":"❌ Modpas yo pa menm"}
                </div>
              )}
              <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",marginBottom:16}}>
                <input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)} style={{marginTop:2,flexShrink:0}} />
                <span style={{fontSize:13,color:"#666",lineHeight:1.5}}>
                  Mwen aksepte{" "}
                  <button onClick={e=>{e.preventDefault();setShowTOS(true);}} style={{background:"none",border:"none",color:"#e74c3c",fontSize:13,cursor:"pointer",fontFamily:F,fontWeight:700,padding:0,textDecoration:"underline"}}>
                    Kondisyon Sèvis
                  </button>
                  {" "}yo nèt.
                </span>
              </label>
              <button onClick={doRegister} disabled={loading} style={{...redBtn,opacity:loading?0.7:1}}>
                {loading ? "⏳ Ap kreye kont ou..." : "✨ Kreye Kont Mwen"}
              </button>
              <p style={{textAlign:"center",color:"#aaa",fontSize:12,marginTop:14}}>Deja gen kont? <button onClick={()=>{setTab("login");setErr("");setEmail("");setPass("");setPass2("");setPrenom("");setNom("");setShowP(false);setShowP2(false);}} style={{background:"none",border:"none",color:"#e74c3c",fontSize:12,cursor:"pointer",fontFamily:F,fontWeight:700}}>Konekte</button></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function LoadingScreen() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const steps = [15,30,50,70,85,95,100];
    let i = 0;
    const t = setInterval(() => {
      if (i < steps.length) { setPct(steps[i++]); }
      else clearInterval(t);
    }, 180);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{position:"fixed",inset:0,background:"#fff",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:F}}>
      <div style={{marginBottom:28,position:"relative"}}>
        <img src={JT_LOGO} alt="JT" style={{height:80,objectFit:"contain",display:"block"}}
          onError={e=>{e.target.style.display="none";}} />
      </div>
      <p style={{fontWeight:900,fontSize:28,color:"#1a6ef5",margin:"0 0 4px",letterSpacing:-0.5}}>Juvens</p>
      <p style={{fontWeight:700,fontSize:13,color:"#e74c3c",margin:"0 0 32px",letterSpacing:3,textTransform:"uppercase"}}>Top Up</p>
      {/* Barre pwogresyon */}
      <div style={{width:200,background:"#f0f0f0",borderRadius:20,height:6,overflow:"hidden",marginBottom:14}}>
        <div style={{background:"linear-gradient(90deg,#1a6ef5,#e74c3c)",width:`${pct}%`,height:"100%",borderRadius:20,transition:"width .2s ease"}} />
      </div>
      <p style={{color:"#bbb",fontSize:12,fontWeight:600,margin:0}}>
        {pct < 40 ? "Ap chaje pwodwi yo..." : pct < 75 ? "Ap prepare paj la..." : pct < 100 ? "Prèske pare..." : "Bienvenu! 🇭🇹"}
      </p>
    </div>
  );
}
function ProductCard({ product, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={()=>onClick(product)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:"#fff",borderRadius:12,overflow:"hidden",cursor:"pointer",border:"1px solid #e8e8e8",boxShadow:hov?"0 4px 16px rgba(0,0,0,0.12)":"0 1px 4px rgba(0,0,0,0.06)",transform:hov?"translateY(-2px)":"none",transition:"all .2s"}}>
      <div style={{width:"100%",paddingBottom:"70%",position:"relative",background:"#f5f5f5",overflow:"hidden"}}>
        <ImgWithFallback src={product.img} alt={product.name}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}
          fallbackEmoji={product.emoji} fallbackBg="#f0f0f0" />
      </div>
      <div style={{padding:"8px 8px 12px",textAlign:"center",background:"#fff"}}>
        <p style={{margin:"0 0 8px",fontSize:13,fontWeight:700,color:"#e74c3c",textDecoration:"underline",fontFamily:F}}>{product.name}</p>
        <button style={{background:"#1a1a1a",color:"#fff",border:"none",borderRadius:25,padding:"8px 0",width:"85%",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,display:"block",margin:"0 auto"}}>Achter</button>
      </div>
    </div>
  );
}
function ProductModal({ product, onClose, balance, setBalance, addTx, user, onNeedAuth, onGoDeposit }) {
  const [variant, setVariant]     = useState(null);
  const [uid, setUid]             = useState(""); const [nom, setNom] = useState("");
  const [step, setStep]           = useState("form");
  const [verifiedName, setVerifiedName] = useState(""); const [uidErr, setUidErr] = useState("");
  const [delivery, setDelivery]   = useState(null);
  const [showBalErr, setShowBalErr] = useState(false);
  const [effType, setEffType]   = useState("");
  const [effWa,   setEffWa]     = useState("");
  const [effEmail,setEffEmail]  = useState("");
  const [effPass, setEffPass]   = useState("");
  const [tagMail, setTagMail]   = useState("");
  const [promoCode, setPromoCode] = useState(""); const [promoMsg, setPromoMsg] = useState(""); const [discount, setDiscount] = useState(0);
  if (!product) return null;
  const ptype  = product.type||"none";
  const isFF   = ptype==="ff";
  const isUID  = ptype==="uid";
  const isEFF  = ptype==="eff";
  const isTag  = ptype==="tag";
  const price  = variant!==null ? product.variants[variant].p : 0;
  const canVerify = uid.trim().length>=6;
  const canOrder  = isFF  ? (variant!==null && verifiedName)
                  : isUID ? (variant!==null && nom && uid)
                  : isEFF ? (variant!==null && effType && effWa && effEmail && effPass)
                  : isTag ? (variant!==null && tagMail)
                  : (variant!==null);

  const reset = () => { setVariant(null); setUid(""); setNom(""); setStep("form"); setVerifiedName(""); setUidErr(""); setDelivery(null); setShowBalErr(false); setPromoCode(""); setPromoMsg(""); setDiscount(0); setEffType(""); setEffWa(""); setEffEmail(""); setEffPass(""); setTagMail(""); };
  const handleClose = () => { reset(); onClose(); };

  const applyPromo = () => {
    if (!promoCode.trim()) return;
    const p = PROMO_DB[promoCode.trim().toUpperCase()];
    if (!p) { setPromoMsg("❌ Kòd invalide"); setDiscount(0); return; }
    if (p.uses >= p.maxUses) { setPromoMsg("❌ Kòd sa a epuize"); setDiscount(0); return; }
    if (p.productId && p.productId !== product.id) { setPromoMsg("❌ Kòd pa valid pou pwodwi sa"); setDiscount(0); return; }
    if (variant === null) { setPromoMsg("⚠️ Chwazi yon ofri anvan"); setDiscount(0); return; }
    const d = Math.round(price * p.pct / 100);
    setDiscount(d);
    setPromoMsg("✅ " + p.label + " — ou ekonomize G" + d);
  };
  const finalPrice = Math.max(0, price - discount);

  const doVerify = () => {
    if (!canVerify) return;
    setStep("verifying"); setUidErr("");
    setTimeout(() => {
      const n = ffLookup(uid.trim());
      if (n) { setVerifiedName(n); setStep("found"); }
      else { setUidErr("❌ UID invalide. Verifye li nan jeu a."); setStep("form"); }
    }, 1500);
  };

  const doOrder = () => {
    if (!canOrder) return;
    if (!user) { handleClose(); onNeedAuth("login"); return; }
    if (balance < finalPrice) { setShowBalErr(true); return; }
    setStep("ordering");
    setTimeout(() => {
      const del = getDelivery(product);
      setBalance(b => b - finalPrice);
      addTx({
        type:"debit",
        label:`${product.name} – ${product.variants[variant].l}`,
        amount:finalPrice, date:new Date(),
        uid: uid||null,
        tagMail: tagMail||null,
        effEmail: effEmail||null,
        effType: effType||null,
        delivery: del,
        productId: product.id,
        variantLabel: product.variants[variant].l,
        status: orderStatus,
        orderId: orderId,
      });
      // FF = livré imedya via "API", tout lòt = en_cours (admin valide)
      const isFFOrder = product.id === 1;
      const orderStatus = isFFOrder ? "livre" : "en_cours";
      const orderId = "#" + (19000 + Math.floor(Math.random()*9000));
      pushOrder({
        id: orderId,
        email: (user&&user.email)||"",
        client: (user&&user.nom)||"",
        product: product.name,
        productId: product.id,
        variant: product.variants[variant].l,
        amount: finalPrice,
        uid: uid||null,
        tagMail: tagMail||null,
        effEmail: effEmail||null,
        status: orderStatus,
        createdAt: new Date(),
        delivery: del,
      });
      if ((user&&user.email)) pushNotif(user.email,
        isFFOrder
          ? `✅ ${product.name} – ${product.variants[variant].l} livre otomatikman!`
          : `⏳ ${product.name} – ${product.variants[variant].l} an kou. Admin ap valide.`,
        isFFOrder ? "🎉" : "⏳");
      if (discount > 0 && PROMO_DB[promoCode.trim().toUpperCase()]) {
        PROMO_DB[promoCode.trim().toUpperCase()].uses++;
      }
      setDelivery(del);
      setStep("done");
    }, 1800);
  };

  return (
    <div onClick={handleClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:500,maxHeight:"92vh",overflowY:"auto",fontFamily:F}}>
        <div style={{position:"relative"}}>
          <img src={product.img} alt={product.name} style={{width:"100%",height:180,objectFit:"cover",display:"block"}}
            onError={e=>{e.target.style.display="none";}} />
          <button onClick={handleClose} style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,fontWeight:700}}>✕</button>
        </div>

        {/* ── MODAL ERÈ BALANS ── */}
        {showBalErr && (
          <div style={{padding:28,textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:12}}>💰</div>
            <h3 style={{color:"#e74c3c",fontSize:18,fontWeight:900,margin:"0 0 8px"}}>Balans Pa Ase!</h3>
            <div style={{background:"#fff5f5",border:"1px solid #fca5a5",borderRadius:12,padding:"14px 16px",marginBottom:16,textAlign:"left"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{color:"#888",fontSize:13}}>Pri kòmand</span>
                <span style={{fontWeight:800,color:"#e74c3c",fontSize:15}}>G {price.toLocaleString()}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{color:"#888",fontSize:13}}>Balans ou</span>
                <span style={{fontWeight:800,color:"#111",fontSize:15}}>G {balance.toLocaleString()}</span>
              </div>
              <div style={{borderTop:"1px solid #fee2e2",paddingTop:8,display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#e74c3c",fontSize:13,fontWeight:700}}>Ou bezwen rechaje</span>
                <span style={{fontWeight:900,color:"#e74c3c",fontSize:16}}>G {(price - balance).toLocaleString()}</span>
              </div>
            </div>
            <p style={{color:"#888",fontSize:13,margin:"0 0 16px",lineHeight:1.6}}>Rechaje wallet ou via <b>NatCash 55726342</b> epi retounen pou konplete kòmand ou.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{handleClose(); if(typeof onGoDeposit==="function") onGoDeposit();}} style={{...redBtn,flex:1,fontSize:14}}>📲 Rechaje Kounye a</button>
              <button onClick={()=>setShowBalErr(false)} style={{flex:1,background:"#f5f5f5",color:"#555",border:"none",borderRadius:8,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>Retounen</button>
            </div>
          </div>
        )}
        {!showBalErr && (step==="verifying"||step==="ordering") && (
          <div style={{padding:50,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:12,animation:"spin 1s linear infinite",display:"inline-block"}}>{step==="verifying"?"🔍":"⚡"}</div>
            <p style={{fontWeight:800,fontSize:18,color:"#333"}}>{step==="verifying"?"Ap verifye UID ou...":"Ap traite kòmand ou..."}</p>
          </div>
        )}

        {!showBalErr && step==="done" && delivery && (
          <div style={{padding:24}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:52}}>✅</div>
              <h3 style={{color:"#27ae60",fontSize:20,fontWeight:900,margin:"8px 0 4px"}}>Kòmand Reyisi!</h3>
              <p style={{color:"#888",fontSize:13}}>Sèvis la delivre imedyatman ⚡</p>
            </div>
            <div style={{background:"#f0fff4",border:"2px solid #27ae60",borderRadius:14,padding:16,marginBottom:16}}>
              {delivery.type==="uid" && <p style={{margin:0,color:"#1b5e20",fontSize:14,fontWeight:600}}>✅ {product.variants[variant].l} kredite sou kont ou (UID: {uid||"N/A"})</p>}
              {delivery.type==="account" && (
                <>{["📧 Email","🔑 Modpas"].map((l,i)=>{
                  const v = i===0?delivery.email:delivery.pass;
                  return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div><p style={{margin:0,fontSize:11,color:"#aaa"}}>{l}</p><p style={{margin:0,fontWeight:800,fontSize:13,color:"#222",fontFamily:"monospace"}}>{v}</p></div>
                    <button onClick={()=>copyText(v)} style={{background:"#e74c3c",color:"#fff",border:"none",borderRadius:15,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:F}}>Kopye</button>
                  </div>;
                })}</>
              )}
              {delivery.type==="code" && (
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <p style={{margin:0,fontWeight:900,fontSize:18,color:"#e74c3c",fontFamily:"monospace",letterSpacing:2}}>{delivery.code}</p>
                  <button onClick={()=>copyText(delivery.code)} style={{background:"#e74c3c",color:"#fff",border:"none",borderRadius:15,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:F}}>📋 Kopye</button>
                </div>
              )}
              {delivery.type==="msg" && <p style={{margin:0,color:"#1b5e20",fontSize:13}}>✅ {product.variants[variant].l} — livrezon konfime!</p>}
            </div>
            {/* Bouton WhatsApp konfirmasyon */}
            {(() => {
              const item = delivery.type==="account"
                ? `Email: ${delivery.email}%0AModpas: ${delivery.pass}`
                : delivery.type==="code"
                ? `Kòd: ${delivery.code}`
                : `Pwodwi delivre sou kont ou`;
              const msg = `✅ Mwen fèk achte sou Juvens Top Up!%0A%0A🛍 Pwodwi: ${product.name} – ${product.variants[variant]?.l}%0A${item}%0A%0A🔗 juvens-topup.ht`;
              return (
                <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"block",marginBottom:10}}>
                  <div style={{background:"#25D366",borderRadius:8,padding:"12px",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span style={{fontSize:18}}>💬</span>
                    <span style={{color:"#fff",fontWeight:800,fontSize:14,fontFamily:F}}>Pataje Reçu sou WhatsApp</span>
                  </div>
                </a>
              );
            })()}
            <div style={{display:"flex",gap:10}}>
              <button onClick={reset} style={{...redBtn,flex:1}}>🔄 Achte Ankò</button>
              <button onClick={handleClose} style={{flex:1,background:"#f5f5f5",color:"#555",border:"none",borderRadius:8,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>Fèmen</button>
            </div>
          </div>
        )}

        {!showBalErr && (step==="form"||step==="found") && (
          <div style={{padding:20}}>
            <h2 style={{fontWeight:900,fontSize:22,margin:"0 0 4px",color:"#111"}}>{product.name}</h2>
            <p style={{color:"#888",fontSize:13,margin:"0 0 16px"}}>{product.type==="uid"||product.type==="ff"?"Antre UID ou pou verifye kont ou":"Chwazi yon ofri anba"}</p>

            <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:1}}>CHWAZI OFRI A:</p>
            <div style={{display:"grid",gridTemplateColumns:isFF?"1fr":"1fr 1fr",gap:8,marginBottom:16}}>
              {product.variants.map((v,i)=>(
                <div key={i} onClick={()=>setVariant(i)} style={{border:`2px solid ${variant===i?"#e74c3c":"#e0e0e0"}`,background:variant===i?"#fff0ee":"#fafafa",borderRadius:10,padding:isFF?"10px 14px":"10px 12px",cursor:"pointer",transition:"all .15s",display:isFF?"flex":"block",justifyContent:"space-between",alignItems:"center"}}>
                  {isFF ? (
                    <><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,background:"#27ae60",color:"#fff",borderRadius:20,padding:"2px 8px",fontWeight:800}}>Dispo</span><p style={{margin:0,fontWeight:800,fontSize:14,color:variant===i?"#e74c3c":"#222"}}>{v.l}</p></div><p style={{margin:0,fontWeight:900,fontSize:15,color:variant===i?"#e74c3c":"#111"}}>{v.p} HTG</p></>
                  ) : (
                    <><p style={{margin:0,fontWeight:800,fontSize:13,color:variant===i?"#e74c3c":"#222"}}>{v.l}</p><p style={{margin:0,fontSize:12,color:"#888",fontWeight:600}}>G {v.p.toLocaleString()}</p></>
                  )}
                </div>
              ))}
            </div>

            {/* ── FREE FIRE ── */}
            {isFF && (
              <>
                <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:1}}>UID FREE FIRE:</p>
                {step==="form" ? (
                  <>
                    <div style={{display:"flex",gap:8,marginBottom:4}}>
                      <input placeholder="Antre UID ou (ex: 123456789)" value={uid} onChange={e=>{setUid(e.target.value.replace(/[^0-9]/g,""));setUidErr("");}} style={{...inputS,marginBottom:0,flex:1}} maxLength={12} />
                      <button onClick={doVerify} disabled={!canVerify} style={{background:canVerify?"#e74c3c":"#ddd",color:"#fff",border:"none",borderRadius:8,padding:"0 14px",fontWeight:800,fontSize:13,cursor:canVerify?"pointer":"not-allowed",fontFamily:F,flexShrink:0}}>Verifye</button>
                    </div>
                    <p style={{fontSize:11,color:"#aaa",margin:"4px 0 12px"}}>💡 Jwenn UID: Ouvri Free Fire → Pwofil → Kopye ID</p>
                    {uidErr && <p style={{color:"#e74c3c",fontSize:12,fontWeight:700,margin:"0 0 10px"}}>{uidErr}</p>}
                  </>
                ) : (
                  <div style={{background:"#f0fff4",border:"2px solid #27ae60",borderRadius:12,padding:"12px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><p style={{margin:0,fontSize:11,color:"#27ae60",fontWeight:800}}>✅ UID Verifye</p><p style={{margin:"3px 0 0",fontWeight:900,fontSize:16,color:"#222"}}>{verifiedName}</p><p style={{margin:0,fontSize:11,color:"#888"}}>UID: {uid}</p></div>
                    <button onClick={()=>{setVerifiedName("");setUid("");setStep("form");}} style={{background:"#f5f5f5",border:"none",borderRadius:20,padding:"5px 12px",fontSize:12,color:"#888",cursor:"pointer",fontFamily:F}}>Chanje</button>
                  </div>
                )}
              </>
            )}
            {/* ── BLOODSTRIKE / PUBG (UID + Nom) ── */}
            {isUID && (
              <>
                <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:1}}>ENFÒMASYON KONT:</p>
                <input placeholder="UID / ID joueur *" value={uid} onChange={e=>setUid(e.target.value)} style={inputS} />
                <input placeholder="Nom sou kont ou *" value={nom} onChange={e=>setNom(e.target.value)} style={inputS} />
              </>
            )}
            {/* ── eFOOTBALL (Type + WhatsApp + Email + Modpas) ── */}
            {isEFF && (
              <>
                <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:1}}>ENFÒMASYON KONT eFOOTBALL:</p>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  {["Android","iPhone"].map(t=>(
                    <div key={t} onClick={()=>setEffType(t)} style={{flex:1,border:`2px solid ${effType===t?"#e74c3c":"#e0e0e0"}`,background:effType===t?"#fff0ee":"#fafafa",borderRadius:10,padding:"12px",textAlign:"center",cursor:"pointer"}}>
                      <p style={{margin:0,fontWeight:800,fontSize:14,color:effType===t?"#e74c3c":"#666"}}>{t==="Android"?"🤖":"🍎"} {t}</p>
                    </div>
                  ))}
                </div>
                <input placeholder="Nimewo WhatsApp *" value={effWa} onChange={e=>setEffWa(e.target.value)} style={inputS} type="tel" />
                <input placeholder="Email kont eFootball *" value={effEmail} onChange={e=>setEffEmail(e.target.value)} style={inputS} type="email" />
                <input placeholder="Modpas kont eFootball *" value={effPass} onChange={e=>setEffPass(e.target.value)} style={{...inputS,fontFamily:"monospace"}} type="password" />
                <div style={{background:"#fff3e0",border:"1px solid #ffe0b2",borderRadius:8,padding:"8px 12px",marginBottom:6}}>
                  <p style={{margin:0,fontSize:11,color:"#e65100",lineHeight:1.6}}>⚠️ <b>Enpòtan:</b> Nou bezwen aksè kont ou pou kredite pwen yo. Chanje modpas ou apre livrezon. Pa pataje kont ou pou lot moun.</p>
                </div>
              </>
            )}
            {/* ── GIFT CARDS / TAG ── */}
            {isTag && (
              <>
                <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:1}}>KOTE VOYE KÒD LA:</p>
                <input placeholder="Tag / Adresse email *" value={tagMail} onChange={e=>setTagMail(e.target.value)} style={inputS} />
                <p style={{fontSize:11,color:"#aaa",margin:"-4px 0 10px"}}>📧 Kòd la ap voye sou email ou nan 5-30 minit.</p>
              </>
            )}

            {/* Kòd Promo */}
            {variant!==null && (
              <div style={{marginBottom:12}}>
                <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>KÒD PROMO (Opsyonèl):</p>
                <div style={{display:"flex",gap:8}}>
                  <input placeholder="Ex: JUVENS10" value={promoCode}
                    onChange={e=>{setPromoCode(e.target.value.toUpperCase());setPromoMsg("");setDiscount(0);}}
                    style={{...inputS,marginBottom:0,flex:1,fontSize:13,fontFamily:"monospace",letterSpacing:1}}
                    maxLength={12} />
                  <button onClick={applyPromo} style={{background:promoCode?"#1a6ef5":"#ddd",color:"#fff",border:"none",borderRadius:8,padding:"0 14px",fontWeight:800,fontSize:13,cursor:promoCode?"pointer":"default",fontFamily:F,flexShrink:0}}>
                    Aplike
                  </button>
                </div>
                {promoMsg && (
                  <div style={{marginTop:6,padding:"6px 10px",borderRadius:8,background:promoMsg.startsWith("✅")?"#e8f5e9":"#fff5f5",border:`1px solid ${promoMsg.startsWith("✅")?"#c8e6c9":"#fca5a5"}`}}>
                    <p style={{margin:0,fontSize:12,fontWeight:700,color:promoMsg.startsWith("✅")?"#27ae60":"#e74c3c"}}>{promoMsg}</p>
                  </div>
                )}
              </div>
            )}
            {variant!==null && (
              <div style={{background:"#fff0ee",border:"1px solid #fca9a0",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
                {discount > 0 && (
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,paddingBottom:6,borderBottom:"1px solid #fee2e2"}}>
                    <span style={{color:"#27ae60",fontSize:12,fontWeight:700}}>🏷️ Rabè promo</span>
                    <span style={{color:"#27ae60",fontWeight:800,fontSize:14}}>-G {discount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:"#666",fontSize:13,fontWeight:600}}>Total:</span>
                  <div style={{textAlign:"right"}}>
                    {discount > 0 && <p style={{margin:0,fontSize:11,color:"#aaa",textDecoration:"line-through"}}>G {price.toLocaleString()}</p>}
                    <span style={{color:"#e74c3c",fontWeight:900,fontSize:17}}>G {finalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <button onClick={doOrder} disabled={!canOrder} style={{...redBtn,opacity:canOrder?1:0.5,cursor:canOrder?"pointer":"not-allowed"}}>
              {!user ? "🔐 Se connecter pour commander" : "🛒 Commander"}
            </button>
            <p style={{textAlign:"center",color:"#aaa",fontSize:11,marginTop:8}}>⚡ Livrezon imedya · 🔒 100% Sekirize</p>
          </div>
        )}
      </div>
    </div>
  );
}
function TopPage({ user }) {
  const getTimeToSunday = () => {
    const now  = new Date();
    const day  = now.getDay();
    const daysLeft = day === 0 ? 7 : 7 - day;
    const next = new Date(now);
    next.setDate(now.getDate() + daysLeft);
    next.setHours(0, 0, 0, 0);
    const diff = Math.max(0, Math.floor((next - now) / 1000));
    return {
      d: Math.floor(diff / 86400),
      h: Math.floor((diff % 86400) / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
    };
  };
  const [timeLeft, setTimeLeft] = useState(getTimeToSunday);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeToSunday()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = n => String(n).padStart(2,"0");
  const TOP = [
    {pos:1,nom:"francheley.baldez",init:"FR",color:"#f5a623"},
    {pos:2,nom:"carl henry.joseph",init:"CA",color:"#888"},
    {pos:3,nom:"james.merlin",init:"JA",color:"#cd7f32"},
    {pos:4,nom:"erbens.gue-4262"},{pos:5,nom:"london hyppolite"},
    {pos:6,nom:"Lejour Wislanda"},{pos:7,nom:"Pierre jean Mycko.J"},
    {pos:8,nom:"destin.sardou"},{pos:9,nom:"Junior Beaucejour"},
    {pos:10,nom:"Benitha Jean"},
  ];
  const numBox = (n, big=false) => (
    <div style={{background:"#fff",borderRadius:14,padding:big?"12px 16px":"10px 14px",minWidth:big?50:48,textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
      <span style={{color:"#e74c3c",fontWeight:900,fontSize:big?28:26,fontFamily:F,letterSpacing:1}}>{pad(n)}</span>
    </div>
  );
  return (
    <div style={{background:"#f5f5f5",minHeight:"100vh",paddingBottom:40,fontFamily:F}}>
      <div style={{background:"linear-gradient(160deg,#e74c3c 60%,#c0392b)",padding:"28px 20px 32px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,background:"rgba(255,255,255,0.05)",borderRadius:"50%"}} />
        <p style={{color:"rgba(255,255,255,0.8)",fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",margin:"0 0 12px"}}>🔥 JUVENS TOP UP · KLASEMAN SEMÈN</p>
        <h1 style={{color:"#fff",fontSize:52,fontWeight:900,margin:"0 0 16px",lineHeight:1,textTransform:"uppercase",fontFamily:F}}>MEILLE<br/>UR<br/>CLIENT</h1>
        <p style={{color:"rgba(255,255,255,0.7)",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",margin:"0 0 12px"}}>RESET DIMANCH NAN</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>{numBox(timeLeft.d,true)}<span style={{color:"rgba(255,255,255,0.7)",fontWeight:700,fontSize:18}}>j</span></div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {numBox(timeLeft.h)}<span style={{color:"#fff",fontWeight:900,fontSize:20}}>:</span>
            {numBox(timeLeft.m)}<span style={{color:"#fff",fontWeight:900,fontSize:20}}>:</span>
            {numBox(timeLeft.s)}
          </div>
        </div>
        <div style={{background:"rgba(0,0,0,0.25)",borderRadius:16,padding:"16px 20px",margin:"0 auto",maxWidth:320,textAlign:"left"}}>
          <p style={{color:"rgba(255,255,255,0.7)",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",margin:"0 0 10px"}}>🎁 RÉCOMPENSE — 1ÈRE PLAS</p>
          <div style={{display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:40}}>🏆</span>
            <div><p style={{margin:0,color:"#fff",fontWeight:900,fontSize:28,lineHeight:1}}>1166 💎</p><p style={{margin:0,color:"#fff",fontWeight:900,fontSize:24}}>GRATIS</p><p style={{margin:"6px 0 0",color:"rgba(255,255,255,0.75)",fontSize:12,lineHeight:1.5}}>Kliyan #1 semèn nan ap resevwa 1 166 diamann — otomatik!</p></div>
          </div>
        </div>
      </div>
      {/* Pozisyon kliyan konekte a */}
      {(() => {
        const myRank = user ? TOP.findIndex(t => t.email === user.email) + 1 : 0;
        return (
          <div style={{margin:"16px 16px 0",background:"#fff",borderRadius:14,border:"2px solid #e74c3c",padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:52,height:52,borderRadius:"50%",border:"2px solid #e74c3c",display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",flexShrink:0}}>
              <span style={{fontWeight:900,fontSize:16,color:"#e74c3c"}}>{user?getInitials((user&&user.nom)):"--"}</span>
            </div>
            <div style={{flex:1}}>
              <p style={{margin:"0 0 4px",color:"#aaa",fontSize:12}}>Pozisyon ou semèn sa a</p>
              <p style={{margin:"0 0 2px",fontWeight:900,fontSize:20,color:"#111"}}>{user ? (myRank > 0 ? "#"+myRank : "Pa nan Top 10") : "Pa konekte"}</p>
              <p style={{margin:0,color:"#888",fontSize:13}}>{user ? user.nom : "Konekte pou wè plas ou"}</p>
            </div>
          </div>
        );
      })()}
      {TOP.length === 0 ? (
        <div style={{margin:"20px 16px 0",background:"#fff",borderRadius:16,padding:"40px 20px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          <div style={{fontSize:56,marginBottom:16}}>🏆</div>
          <h3 style={{fontWeight:900,fontSize:20,color:"#111",margin:"0 0 8px"}}>Klaseman Ap Kòmanse!</h3>
          <p style={{color:"#aaa",fontSize:14,lineHeight:1.7,margin:"0 0 20px"}}>
            Pa gen kliyan nan klaseman pou kounye a.<br/>Swa <b style={{color:"#e74c3c"}}>premye</b> achte pou pran plas #1! 👑
          </p>
          <div style={{background:"linear-gradient(135deg,#fff3cd,#ffe082)",borderRadius:12,padding:"14px 18px",display:"inline-block"}}>
            <p style={{margin:0,fontWeight:800,fontSize:14,color:"#b8860b"}}>🎁 1ÈR KLIYAN → 341 💎 GRATIS</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{padding:"20px 16px 8px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr 1fr",gap:10,alignItems:"flex-end"}}>
              {/* #2 */}
              <div style={{background:"#fff",borderRadius:14,border:"2px solid #bbb",padding:"16px 10px",textAlign:"center"}}>
                <span style={{fontSize:20}}>🥈</span>
                <p style={{margin:"4px 0 4px",fontSize:11,color:"#888",fontWeight:700}}>2</p>
                <div style={{width:48,height:48,borderRadius:"50%",background:"#f0f0f0",border:"2px solid #bbb",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px"}}><span style={{fontWeight:900,fontSize:16,color:"#666"}}>{TOP[1]?.init||"?"}</span></div>
                <p style={{margin:"0 0 4px",fontSize:11,color:"#333",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{TOP[1]?.nom||"—"}</p>
                {TOP[1] && <p style={{margin:0,fontSize:10,color:"#1a6ef5",fontWeight:700}}>{TOP[1].orders} acha</p>}
              </div>
              {/* #1 */}
              <div style={{background:"#fffbea",borderRadius:16,border:"2px solid #f5a623",padding:"20px 10px",textAlign:"center"}}>
                <span style={{fontSize:28}}>👑</span>
                <div style={{width:56,height:56,borderRadius:"50%",background:"#fff3cd",border:"2px solid #f5a623",display:"flex",alignItems:"center",justifyContent:"center",margin:"8px auto"}}><span style={{fontWeight:900,fontSize:18,color:"#f5a623"}}>{TOP[0]?.init||"?"}</span></div>
                <p style={{margin:"0 0 4px",fontSize:12,color:"#333",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{TOP[0]?.nom||"—"}</p>
                {TOP[0] && <><p style={{margin:"0 0 6px",fontSize:10,color:"#e74c3c",fontWeight:700}}>{TOP[0].orders} acha</p>
                <div style={{background:"#fff0a0",borderRadius:8,padding:"3px 8px",display:"inline-block"}}><span style={{fontSize:11,fontWeight:800,color:"#b8860b"}}>341 💎</span></div></>}
              </div>
              {/* #3 */}
              <div style={{background:"#fff",borderRadius:14,border:"2px solid #cd7f32",padding:"16px 10px",textAlign:"center"}}>
                <span style={{fontSize:20}}>🥉</span>
                <p style={{margin:"4px 0 4px",fontSize:11,color:"#888",fontWeight:700}}>3</p>
                <div style={{width:48,height:48,borderRadius:"50%",background:"#f5e6d3",border:"2px solid #cd7f32",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px"}}><span style={{fontWeight:900,fontSize:16,color:"#cd7f32"}}>{TOP[2]?.init||"?"}</span></div>
                <p style={{margin:"0 0 4px",fontSize:11,color:"#333",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{TOP[2]?.nom||"—"}</p>
                {TOP[2] && <p style={{margin:0,fontSize:10,color:"#1a6ef5",fontWeight:700}}>{TOP[2].orders} acha</p>}
              </div>
            </div>
          </div>
          {TOP.length > 3 && (
            <div style={{padding:"4px 16px 0"}}>
              <p style={{fontSize:10,fontWeight:700,color:"#aaa",letterSpacing:2,textTransform:"uppercase",margin:"4px 0 12px"}}>POZISYON 4 — {TOP.length}</p>
              {TOP.slice(3).map((t,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <div style={{background:"#f5f5f5",borderRadius:10,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontWeight:900,fontSize:14,color:"#888"}}>#{t.pos}</span></div>
                  <div style={{flex:1}}><p style={{margin:0,fontWeight:700,fontSize:14,color:"#111"}}>{t.nom}</p><p style={{margin:0,fontSize:11,color:"#aaa"}}>{t.orders} acha</p></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <div style={{textAlign:"center",padding:"20px 16px 8px"}}>
        <p style={{color:"#aaa",fontSize:12,margin:"0 0 6px"}}>🔄 Klaseman mete ajou an tan reyèl · Reset chak dimanch</p>
        <p style={{color:"#e74c3c",fontSize:13,fontWeight:700,margin:0}}>juvens-topup.ht</p>
      </div>
    </div>
  );
}
const PROMOS = [
  { id:1, emoji:"🔥", title:"FREE FIRE — 341 💎", sub:"Sèlman 480 HTG!", color:"linear-gradient(135deg,#ff6b00,#e74c3c)", product:1 },
  { id:2, emoji:"🎬", title:"Netflix 1 Mois", sub:"Aksè konplè — 500 HTG", color:"linear-gradient(135deg,#e50914,#b0060f)", product:5 },
  { id:3, emoji:"💎", title:"PUBG — 660 UC", sub:"Meilleur rapport qualité/prix!", color:"linear-gradient(135deg,#f5c518,#e6a800)", product:3 },
  { id:4, emoji:"🎮", title:"Bloodstrike — 594 🥞", sub:"Top up rapide & sèkirize", color:"linear-gradient(135deg,#1a1a2e,#e74c3c)", product:2 },
];
function PromoBanner({ onProduct }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % PROMOS.length), 3500);
    return () => clearInterval(t);
  }, []);
  const p = PROMOS[idx];
  return (
    <div style={{margin:"10px 14px 4px",position:"relative"}}>
      <div onClick={()=>{const prod=ALL_PRODUCTS.find(x=>x.id===p.product);if(prod)onProduct(prod);}}
        style={{background:p.color,borderRadius:14,padding:"18px 16px",cursor:"pointer",minHeight:90,display:"flex",flexDirection:"column",justifyContent:"center",position:"relative",overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.15)",transition:"background .5s"}}>
        {/* Cercle décoratif */}
        <div style={{position:"absolute",right:-20,top:-20,width:110,height:110,background:"rgba(255,255,255,0.08)",borderRadius:"50%"}} />
        <div style={{position:"absolute",right:20,top:"50%",transform:"translateY(-50%)",fontSize:48,opacity:0.25}}>{p.emoji}</div>
        <div style={{position:"absolute",top:10,right:12,background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"3px 10px"}}>
          <span style={{color:"#fff",fontSize:11,fontWeight:800}}>🔥 PROMO</span>
        </div>
        <p style={{margin:"0 0 4px",fontWeight:900,fontSize:19,color:"#fff",fontFamily:F,maxWidth:"75%"}}>{p.emoji} {p.title}</p>
        <p style={{margin:"0 0 10px",color:"rgba(255,255,255,0.85)",fontSize:13,fontFamily:F}}>{p.sub}</p>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.25)",borderRadius:20,padding:"5px 12px",alignSelf:"flex-start"}}>
          <span style={{color:"#fff",fontSize:12,fontWeight:800,fontFamily:F}}>Achte kounye a →</span>
        </div>
      </div>
      {/* Dots indicator */}
      <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:8}}>
        {PROMOS.map((_,i)=>(
          <div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?20:6,height:6,borderRadius:3,background:i===idx?"#e74c3c":"#ddd",cursor:"pointer",transition:"all .3s"}} />
        ))}
      </div>
    </div>
  );
}
function HomePage({ onProduct }) {
  const [q, setQ] = useState("");
  const res = q.length>0 ? ALL_PRODUCTS.filter(p => {
    const n = p.name.toLowerCase(), qq = q.toLowerCase().trim();
    if (!qq) return false;
    if (qq.length===1) return n.charAt(0)===qq;
    if ("recharge".startsWith(qq)) return n.startsWith("recharge");
    return n.includes(qq);
  }) : null;
  const FLASH = [
    { prod: ALL_PRODUCTS.find(p=>p.id===1), variantIdx:2 },
    { prod: ALL_PRODUCTS.find(p=>p.id===5), variantIdx:0 },
    { prod: ALL_PRODUCTS.find(p=>p.id===12), variantIdx:0 },
  ];

  return (
    <div style={{background:"#f8f8f8",minHeight:"100vh"}}>
      {/* Search bar */}
      <div style={{padding:"10px 14px 6px",background:"#fff",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#f5f5f5",borderRadius:25,padding:"9px 14px",border:"1px solid #eee"}}>
          <span style={{color:"#aaa",fontSize:15}}>🔍</span>
          <input placeholder="Recherche produit..." value={q} onChange={e=>setQ(e.target.value)} style={{background:"none",border:"none",outline:"none",flex:1,fontSize:14,color:"#333",fontFamily:F}} />
          {q && <button onClick={()=>setQ("")} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#bbb",padding:0}}>✕</button>}
        </div>
      </div>

      {res ? (
        <div style={{padding:"12px 14px 20px"}}>
          <p style={{color:"#aaa",fontSize:12,fontWeight:700,margin:"0 0 12px",textTransform:"uppercase"}}>
            {res.length>0 ? `${res.length} rezilta — "${q}"` : `Okenn rezilta pou "${q}"`}
          </p>
          {res.length>0
            ? <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{res.map(p=><ProductCard key={p.id} product={p} onClick={onProduct} />)}</div>
            : <div style={{textAlign:"center",padding:"40px 0",background:"#fff",borderRadius:14}}><p style={{fontSize:40,margin:"0 0 10px"}}>🔍</p><p style={{color:"#aaa",fontSize:14}}>Okenn pwodwi jwenn</p></div>}
        </div>
      ) : (
        <>
          {/* Bannè Promo */}
          <div style={{background:"#fff",paddingBottom:12}}>
            <PromoBanner onProduct={onProduct} />
          </div>

          {/* Flash Deals */}
          <div style={{margin:"10px 14px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h2 style={{fontSize:16,fontWeight:900,color:"#111",margin:0,fontFamily:F}}>⚡ Flash Deal</h2>
              <span style={{fontSize:11,color:"#e74c3c",fontWeight:700}}>Ofri Espesyal</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {FLASH.map(({prod,variantIdx},i)=>prod?(
                <div key={i} onClick={()=>onProduct(prod)}
                  style={{background:"#fff",borderRadius:12,padding:"10px 8px",textAlign:"center",cursor:"pointer",border:"1px solid #eee",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
                  <img src={prod.img} alt={prod.name} style={{width:44,height:44,objectFit:"cover",borderRadius:8,marginBottom:6,display:"block",margin:"0 auto 6px"}}
                    onError={e=>{e.target.style.display="none";}} />
                  <p style={{margin:"0 0 2px",fontSize:11,fontWeight:800,color:"#111",fontFamily:F,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{prod.name}</p>
                  <p style={{margin:"0 0 6px",fontSize:10,color:"#888"}}>{prod.variants[variantIdx]?.l}</p>
                  <div style={{background:"#fff0ee",borderRadius:20,padding:"3px 6px"}}>
                    <span style={{fontSize:11,fontWeight:900,color:"#e74c3c"}}>G{prod.variants[variantIdx]?.p}</span>
                  </div>
                </div>
              ):null)}
            </div>
          </div>

          {/* Plis Achte — Trending */}
          <div style={{margin:"10px 14px 0",background:"#fff",borderRadius:14,padding:"14px 14px 8px",border:"1px solid #f0f0f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h2 style={{fontSize:16,fontWeight:900,color:"#111",margin:0,fontFamily:F}}>🔥 Plis Achte</h2>
              <span style={{fontSize:11,color:"#888",fontWeight:600}}>Chwa kliyan yo</span>
            </div>
            {[
              {id:1,rank:1,name:"Free Fire 341💎",price:"480 HTG",emoji:"🔥",hot:true},
              {id:5,rank:2,name:"Netflix 1 mois",price:"500 HTG",emoji:"🎬",hot:false},
              {id:3,rank:3,name:"PUBG 660 UC",price:"1700 HTG",emoji:"🎯",hot:false},
              {id:12,rank:4,name:"Canva Pro 1 mois",price:"600 HTG",emoji:"🎨",hot:false},
              {id:2,rank:5,name:"Bloodstrike 352🥞",price:"500 HTG",emoji:"🩸",hot:false},
            ].map((item,i)=>{
              const prod = ALL_PRODUCTS.find(p=>p.id===item.id);
              return (
                <div key={i} onClick={()=>prod&&onProduct(prod)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<4?"1px solid #f8f8f8":"none",cursor:"pointer"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:item.rank===1?"#fff3cd":item.rank===2?"#f0f0f0":"#f8f8f8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:900,fontSize:item.rank===1?18:14,color:item.rank===1?"#f5a623":"#888"}}>
                    {item.rank===1?"🥇":item.rank===2?"🥈":item.rank===3?"🥉":item.rank}
                  </div>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontWeight:700,fontSize:14,color:"#111",fontFamily:F}}>{item.emoji} {item.name}</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {item.hot && <span style={{background:"#e74c3c",color:"#fff",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:800}}>HOT</span>}
                    <span style={{fontWeight:800,fontSize:13,color:"#e74c3c",fontFamily:F}}>{item.price}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seksyon Kategori */}
          <div style={{padding:"16px 14px 20px"}}>
            {[["🎮 Jeux","jeux"],["📺 Streaming","streaming"],["🎁 Gift Cards","giftcard"],["🔧 Autres","autres"]].map(([t,k])=>(
              <div key={k} style={{marginBottom:28}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <h2 style={{fontSize:16,fontWeight:900,color:"#111",margin:0,fontFamily:F}}>{t}</h2>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {PRODUCTS[k].map(p=><ProductCard key={p.id} product={p} onClick={onProduct} />)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function WalletPage({ balance, transactions, setPage, user, onOpenAuth }) {
  if (!user) return (
    <div style={{padding:40,textAlign:"center"}}>
      <p style={{fontSize:56,margin:"0 0 16px"}}>🔐</p>
      <h3 style={{fontWeight:900,fontSize:20,color:"#333",margin:"0 0 8px"}}>Konekte pou wè wallet ou</h3>
      <p style={{color:"#aaa",fontSize:13,marginBottom:24}}>Wallet ou konekte ak kont ou.</p>
      <button onClick={()=>onOpenAuth("login")} style={{...redBtn,width:"auto",padding:"12px 28px"}}>🔐 Se Connecter</button>
    </div>
  );
  const debits  = transactions.filter(t=>t.type==="debit");
  const credits = transactions.filter(t=>t.type==="credit");
  const now = new Date();
  const mwa  = debits.filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length;
  const last = debits.length>0?debits[debits.length-1].date:null;
  return (
    <div style={{background:"#f2f2f7",minHeight:"100vh",paddingBottom:30}}>
      <div style={{padding:"20px 16px 10px"}}><h1 style={{fontSize:26,fontWeight:900,color:"#111",margin:0,textAlign:"center",fontFamily:F}}>Ma balance</h1></div>
      <div style={{margin:"0 16px 16px"}}>
        <div style={{background:"linear-gradient(135deg,#1a6ef5,#0a4fd4)",borderRadius:20,padding:"20px 20px 24px",color:"#fff"}}>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <div style={{background:"rgba(255,255,255,0.25)",borderRadius:20,padding:"6px 16px",fontSize:14,fontWeight:700}}>Wallet</div>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"6px 16px",fontSize:13,fontWeight:600}}>{user.nom.toLowerCase()}</div>
          </div>
          <p style={{fontSize:38,fontWeight:900,margin:"0 0 4px",letterSpacing:-1}}>G{balance.toLocaleString("fr-HT",{minimumFractionDigits:2})}</p>
          <p style={{fontSize:13,opacity:0.8,margin:0}}>Balans aktyèl ou</p>
        </div>
      </div>
      <div style={{margin:"0 16px 16px",...card}}>
        <p style={{fontWeight:800,fontSize:16,color:"#111",margin:"0 0 12px"}}>Rechaje</p>
        <div onClick={()=>setPage("natcash")} style={{background:"#f2f2f7",borderRadius:12,padding:16,textAlign:"center",cursor:"pointer",border:"1px solid #e8e8e8"}}>
          <p style={{margin:0,fontWeight:700,fontSize:15,color:"#111",textDecoration:"underline"}}>Rechaj kont ou via NatCash</p>
        </div>
      </div>
      <div style={{margin:"0 16px 16px",...card}}>
        <p style={{fontWeight:800,fontSize:16,color:"#111",margin:"0 0 14px"}}>Dènye tranzaksyon</p>
        {transactions.length===0 ? <p style={{color:"#ccc",fontSize:13,textAlign:"center",padding:"20px 0"}}>Pa gen tranzaksyon ankò.</p>
        : transactions.slice().reverse().map((t,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<transactions.length-1?"1px solid #f5f5f5":"none"}}>
            <div style={{background:t.type==="credit"?"#e8f5e9":"#ffebee",borderRadius:20,padding:"5px 12px",minWidth:65,textAlign:"center",flexShrink:0}}>
              <span style={{fontSize:11,fontWeight:800,color:t.type==="credit"?"#27ae60":"#e53935"}}>{t.type==="credit"?"CREDIT":"DEBIT"}</span>
            </div>
            <div style={{flex:1}}>
              <p style={{margin:0,fontWeight:700,fontSize:13,color:"#111"}}>{t.label}</p>
              <p style={{margin:0,fontSize:11,color:"#888"}}>{new Date(t.date).toLocaleDateString("fr-CA")} {new Date(t.date).toLocaleTimeString("fr-HT",{hour:"2-digit",minute:"2-digit"})}</p>
            </div>
            <span style={{fontWeight:800,fontSize:14,color:t.type==="credit"?"#27ae60":"#e74c3c",flexShrink:0}}>{t.type==="credit"?"+":"-"}{t.amount.toLocaleString("fr-HT",{minimumFractionDigits:2})} HTG</span>
          </div>
        ))}
      </div>
      <div style={{margin:"0 16px 8px"}}>
        <p style={{fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:2,margin:"0 0 10px"}}>ESTATISTIK</p>
        {[["🛒","Acha mwa sa a",mwa],["📦","Total acha",debits.length],["💵","Total depanse",`${debits.reduce((s,t)=>s+t.amount,0).toLocaleString()} HTG`],["📅","Dènye acha",last?new Date(last).toLocaleDateString("fr-HT",{day:"2-digit",month:"short",year:"numeric"}):"—"]].map((s,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:8,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{width:42,height:42,background:"#ffebee",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{s[0]}</div>
            <span style={{flex:1,fontSize:14,color:"#555"}}>{s[1]}</span>
            <span style={{fontWeight:900,fontSize:16,color:"#111"}}>{s[2]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─── NATCASH SMS BACKEND CONFIG ──────────────────────────────────────────────
//   1. Resevwa SMS NatCash yo via SmsWebhook oswa Android SMS Gateway
//   3. Retounen { found: true, amount: YYYY, sender: "..." } pou TransCode a
// BACKEND_URL = "https://api.juvens-topup.ht/verify-natcash"
const BACKEND_URL = null; // Chanje sa ak URL reyèl ou lè backend pare

function verifyTransCodeBackend(transCode) {
  if (BACKEND_URL) {
    return { found: false, error: "Backend pa disponib nan aperçu" };
  }
  // NatCash TransCode fòma: 14 chif kòmanse ak 26...
  const AMOUNTS = [100,150,200,250,300,400,500,600,750,1000,1500,2000];
  const amt = AMOUNTS[parseInt(transCode.slice(-2)) % AMOUNTS.length];
  const senderPfx = ["5093","5094","5098","5099"];
  const sender = senderPfx[parseInt(transCode[2])%4] + transCode.slice(4,11);
  return {
    found: transCode.length >= 8,
    amount: amt,
    sender: sender,
    usedAlready: USED_CODES.has(transCode.toUpperCase()),
    smsPreview: `Ref: ${transCode} Montant: ${amt}.00 HTG De: ${sender}`,
  };
}

function NatCashPage({ balance, setBalance, addTx, transactions, user, onNeedAuth }) {
  const [tc, setTc]           = useState("");
  const [copied, setCopied]   = useState(false);
  const [step, setStep]       = useState("form");
  const [credited, setCredited] = useState(0);
  const [smsData, setSmsData] = useState(null);
  const NUM = "55726342";
  const QR  = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${NUM}`;
  const cpNum = () => copyText(NUM, ()=>{setCopied(true); setTimeout(()=>setCopied(false),2000);});
  const credits = (transactions||[]).filter(t=>t.type==="credit");

  const doDepo = () => {
    if (!user) { if(onNeedAuth) onNeedAuth("login"); return; }
    if (!tc.trim()) return;
    setStep("verifying"); setSmsData(null);


    const result = verifyTransCodeBackend(tc.trim());

    if (result.usedAlready || USED_CODES.has(tc.trim().toUpperCase())) {
      setStep("used"); return;
    }
    if (!result.found) {
      setStep("notfound"); return;
    }
    setSmsData(result);
    setStep("confirm");
  };

  const doConfirm = () => {
    if (!smsData) return;
    const amt = smsData.amount;
    setBalance(b=>b+amt);
    setCredited(amt);
    addTx({
      type:"credit",
      label:`Dépôt NatCash · ${tc.trim()}`,
      amount:amt,
      sender:smsData.sender||"",
      date:new Date()
    });
    USED_CODES.add(tc.trim().toUpperCase());
    if ((user&&user.email)) pushNotif(user.email, `💰 Depo G${amt.toLocaleString()} HTG resevwa!`, "💳");
    setTc(""); setSmsData(null); setStep("success");
    setTimeout(()=>setStep("form"), 5000);
  };

  return (
    <div style={{padding:"0 0 20px",fontFamily:F}}>
      <div style={{padding:"20px 16px 10px"}}><h1 style={{fontSize:28,fontWeight:900,color:"#111",margin:0,fontFamily:F}}>Depo NatCash</h1></div>

      {/* ── Bannè eta yo ── */}
      {step==="success" && (
        <div style={{margin:"0 16px 16px",background:"#e8f5e9",border:"1px solid #c8e6c9",borderRadius:12,padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{width:34,height:34,background:"#27ae60",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:18,flexShrink:0}}>✓</div>
            <p style={{margin:0,color:"#1b5e20",fontWeight:800,fontSize:15}}>Balans Kredite Avèk Siksè!</p>
          </div>
          <p style={{margin:"0 0 0 44px",color:"#2e7d32",fontSize:13}}>+G{credited.toLocaleString()}.00 HTG ajoute nan wallet ou.</p>
        </div>
      )}
      {step==="used" && (
        <div style={{margin:"0 16px 16px",background:"#fff3e0",border:"1px solid #ffe0b2",borderRadius:12,padding:"16px"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:22,flexShrink:0}}>⚠️</span>
            <div>
              <p style={{margin:"0 0 4px",color:"#e65100",fontWeight:800,fontSize:14}}>TransCode Sa a Deja Itilize!</p>
              <p style={{margin:0,color:"#bf360c",fontSize:13,lineHeight:1.6}}>Chak kòd valab yon sèl fwa. Si ou panse se yon erè, kontakte sipò nou via WhatsApp.</p>
              <button onClick={()=>setStep("form")} style={{marginTop:10,background:"#e65100",color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Reesye</button>
            </div>
          </div>
        </div>
      )}
      {step==="notfound" && (
        <div style={{margin:"0 16px 16px",background:"#fce4ec",border:"1px solid #f48fb1",borderRadius:12,padding:"16px"}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:22,flexShrink:0}}>❌</span>
            <div>
              <p style={{margin:"0 0 4px",color:"#c62828",fontWeight:800,fontSize:14}}>TransCode Pa Jwenn!</p>
              <p style={{margin:0,color:"#b71c1c",fontSize:13,lineHeight:1.6}}>Nou pa jwenn mesaj NatCash pou kòd sa a. Asire ou te voye lajan an epi reesye.</p>
              <button onClick={()=>setStep("form")} style={{marginTop:10,background:"#c62828",color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Reesye</button>
            </div>
          </div>
        </div>
      )}
      {step==="verifying" && (
        <div style={{margin:"0 16px 16px",background:"#e3f2fd",border:"1px solid #bbdefb",borderRadius:12,padding:"16px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontSize:28,animation:"spin 1s linear infinite",display:"inline-block",flexShrink:0}}>🔍</div>
          <div>
            <p style={{margin:"0 0 3px",color:"#1565c0",fontWeight:800,fontSize:14}}>Ap Chèche nan Mesaj NatCash...</p>
            <p style={{margin:0,color:"#1976d2",fontSize:12}}>Ap verifye TransCode {tc.slice(0,6)}... nan bwat mesaj la</p>
          </div>
        </div>
      )}
      {/* ── Etap Konfirmasyon SMS ── */}
      {step==="confirm" && smsData && (
        <div style={{margin:"0 16px 16px",background:"#fff",borderRadius:14,border:"2px solid #27ae60",overflow:"hidden",boxShadow:"0 4px 12px rgba(39,174,96,0.15)"}}>
          <div style={{background:"#27ae60",padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>📱</span>
            <div>
              <p style={{margin:0,fontWeight:800,fontSize:14,color:"#fff"}}>Mesaj NatCash Jwenn!</p>
              <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.85)"}}>Konfime pou kredite wallet ou</p>
            </div>
          </div>
          {/* Aperçu SMS */}
          <div style={{padding:"14px 16px",background:"#f0fff4",borderBottom:"1px solid #e8f5e9"}}>
            <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>KONTNI MESAJ NATCASH:</p>
            <div style={{background:"#e8f5e9",borderRadius:8,padding:"10px 12px",fontFamily:"monospace",fontSize:12,color:"#1b5e20",lineHeight:1.7}}>
              {smsData.smsPreview || `Ref: ${tc} Montant: ${smsData.amount}.00 HTG`}
            </div>
          </div>
          {/* Detay */}
          <div style={{padding:"12px 16px"}}>
            {[["📋 TransCode",tc],["💰 Montan detekte",`G ${smsData.(amount&&amount.toLocaleString)()} HTG`],["📞 Expeditè",smsData.sender||"—"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f5f5f5"}}>
                <span style={{fontSize:13,color:"#888"}}>{l}</span>
                <span style={{fontWeight:800,fontSize:13,color:"#111"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{padding:"12px 16px 16px",display:"flex",gap:10}}>
            <button onClick={doConfirm} style={{...redBtn,flex:1,background:"linear-gradient(135deg,#27ae60,#219a52)",fontSize:14}}>✅ Konfime & Kredite G{smsData.amount}</button>
            <button onClick={()=>{setStep("form");setSmsData(null);}} style={{flex:0.5,background:"#f5f5f5",color:"#555",border:"none",borderRadius:8,padding:"14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>Anile</button>
          </div>
        </div>
      )}

      {/* NatCash card */}
      <div style={{margin:"0 16px 16px",background:"linear-gradient(135deg,#0d2137,#1a3a5c)",borderRadius:16,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,background:"rgba(255,255,255,0.15)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💳</div>
          <div><p style={{margin:0,color:"#fff",fontWeight:800,fontSize:16}}>Depo NatCash</p><p style={{margin:0,color:"rgba(255,255,255,0.65)",fontSize:12}}>Voye lajan & recharge nan yon sèl plas</p></div>
        </div>
        <div style={{background:"rgba(255,255,255,0.15)",borderRadius:20,padding:"6px 14px",display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:8,height:8,background:"#4ade80",borderRadius:"50%"}} />
          <span style={{color:"#fff",fontSize:12,fontWeight:700}}>NatCash</span>
        </div>
      </div>

      {/* Nimewo */}
      <div style={{margin:"0 16px 12px",background:"#fff",borderRadius:16,border:"1px solid #eee",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #f0f0f0"}}>
          <div style={{width:28,height:28,background:"#1a3a5c",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontWeight:900,fontSize:13}}>1</span></div>
          <p style={{margin:0,fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:1}}>VOYE PEMAN AN NAN NIMEWO SA A</p>
        </div>
        <div style={{padding:16}}>
          <p style={{fontSize:10,fontWeight:700,color:"#1a3a5c",margin:"0 0 6px",textTransform:"uppercase",letterSpacing:1}}>NIMEWO NATCASH</p>
          <p style={{fontSize:32,fontWeight:900,color:"#1a3a5c",margin:"0 0 2px",letterSpacing:4,fontFamily:"monospace"}}>55726342</p>
          <p style={{fontSize:11,fontWeight:700,color:"#1a3a5c",margin:"0 0 14px",textTransform:"uppercase",letterSpacing:1}}>JUVENS TOP UP</p>
          <button onClick={cpNum} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"2px solid #1a3a5c",borderRadius:25,padding:"8px 20px",cursor:"pointer",fontWeight:700,fontSize:14,color:"#1a3a5c",fontFamily:F,marginBottom:16}}>
            <span>📋</span><span>{copied?"Kopye!":"Kopye"}</span>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <img src={QR} alt="QR" style={{width:110,height:110,borderRadius:10,border:"3px solid #eee"}} onError={e=>{e.target.style.display="none";}} />
            <p style={{color:"#999",fontSize:13,fontWeight:500}}>Skane ak NatCash</p>
          </div>
        </div>
      </div>

      {/* Etap */}
      <div style={{margin:"0 16px 12px",background:"#f8faff",borderRadius:16,border:"1px solid #e0e8ff",padding:"14px 16px"}}>
        {[[2,"Ou pral resevwa SMS ak TransCode ou"],[3,"Antre TransCode a anba pou kredite wallet ou"]].map(([n,t])=>(
          <div key={n} style={{display:"flex",gap:10,marginBottom:n===2?12:0,alignItems:"flex-start"}}>
            <div style={{width:26,height:26,background:"#e8eeff",border:"2px solid #1a3a5c",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#1a3a5c",fontWeight:900,fontSize:11}}>{n}</span></div>
            {n===2?<div><p style={{margin:0,fontSize:13,color:"#333"}}>Ou pral resevwa SMS ak <b>TransCode</b> ou:</p><div style={{display:"inline-block",background:"#e8eeff",borderRadius:8,padding:"4px 12px",marginTop:6}}><span style={{fontFamily:"monospace",fontSize:13,color:"#1a3a5c",fontWeight:700}}>26042056XXXXXXXX</span></div></div>:<p style={{margin:0,fontSize:13,color:"#333"}}>{t}</p>}
          </div>
        ))}
      </div>

      {/* Fòmilè */}
      <div style={{margin:"0 16px 16px",background:"#fff",borderRadius:16,border:"1px solid #eee",padding:16,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:32,height:32,background:"#e8eeff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16}}>🛡️</span></div>
          <p style={{margin:0,fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:1}}>RECHARGE BALANS OU</p>
        </div>
        <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:1}}>TRANSCODE / TXN ID</p>
        <div style={{display:"flex",alignItems:"center",background:"#fff",borderRadius:12,border:"1px solid #e0e0e0",marginBottom:6,overflow:"hidden"}}>
          <div style={{padding:"0 14px",color:"#bbb",borderRight:"1px solid #e8e8e8",height:52,display:"flex",alignItems:"center",fontSize:20}}>👤</div>
          <input placeholder="Ex: 26042056235742" value={tc} onChange={e=>setTc(e.target.value)} maxLength={16} style={{flex:1,background:"none",border:"none",outline:"none",padding:14,fontSize:14,color:"#111",fontFamily:F}} />
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:12,color:"#aaa"}}>{tc.length} / 16 chif</span><span style={{fontSize:12,color:"#aaa"}}>Valab 7 jou</span></div>
        <p style={{fontSize:11,color:"#aaa",margin:"0 0 14px",lineHeight:1.6}}>
          💡 Nou ap chèche <b style={{color:"#1a3a5c"}}>kantite egzak</b> la dirèkteman nan mesaj NatCash ou a — pa bezwen antre li.
        </p>
        <button onClick={doDepo} disabled={!tc.trim()||step==="verifying"||step==="confirm"} style={{...blueBtn,opacity:(tc.trim()&&step!=="confirm")?1:0.5,cursor:(tc.trim()&&step!=="confirm")?"pointer":"not-allowed"}}>
          <span>🔍</span><span>Verifye TransCode nan Mesaj NatCash</span>
        </button>
      </div>

      {/* Istwa */}
      <div style={{margin:"0 16px",background:"#fff",borderRadius:16,border:"1px solid #eee",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 16px 12px",borderBottom:"1px solid #f5f5f5"}}><span style={{fontSize:18,color:"#1a3a5c"}}>🔄</span><p style={{margin:0,fontWeight:800,fontSize:16,color:"#111"}}>Istwa Recharge</p></div>
        {credits.length===0 ? <p style={{color:"#ccc",fontSize:13,textAlign:"center",padding:"24px 0"}}>Pa gen istwa recharge ankò.</p>
        : credits.slice().reverse().map((t,i)=>{
          const code = t.label.replace("Dépôt NatCash · ","");
          const d = new Date(t.date);
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderBottom:i<credits.length-1?"1px solid #f5f5f5":"none"}}>
              <div style={{width:44,height:44,background:"#1e40af",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:16}}>▶</span></div>
              <div style={{flex:1}}>
                <p style={{margin:0,fontWeight:700,fontSize:14,color:"#111",fontFamily:"monospace"}}>{code}</p>
                <p style={{margin:"2px 0 0",fontSize:12,color:"#aaa"}}>{d.toLocaleDateString("fr-CA")} · {d.toLocaleTimeString("fr-HT",{hour:"2-digit",minute:"2-digit"})}</p>
              </div>
              <div style={{textAlign:"right"}}><span style={{fontWeight:900,fontSize:17,color:"#27ae60"}}>+{t.amount.toLocaleString("fr-HT",{minimumFractionDigits:2})}</span><span style={{fontWeight:600,fontSize:12,color:"#27ae60"}}> HTG</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function MesAchatsPage({ transactions, user, onOpenAuth }) {
  const [tab, setTab]         = useState("termine");
  const [selected, setSelected] = useState(null);
  const achats = transactions.filter(t=>t.type==="debit");
  // Sync with shared orders (pour que le statut admin soit visible)
  const sharedOrdrs = typeof window!=="undefined" ? (window.__JUVENS_ORDERS__||[]) : [];
  const getOrderStatus = (tx) => {
    if (!tx.orderId) return tx.status || "livre";
    const shared = sharedOrdrs.find(o => o.id === tx.orderId);
    return shared ? shared.status : (tx.status || "livre");
  };
  if (!user) return (
    <div style={{padding:40,textAlign:"center"}}>
      <p style={{fontSize:56,margin:"0 0 16px"}}>🔐</p>
      <h3 style={{fontWeight:900,fontSize:20,color:"#333",margin:"0 0 8px"}}>Konekte pou wè acha ou</h3>
      <button onClick={()=>onOpenAuth("login")} style={{...redBtn,width:"auto",padding:"12px 28px"}}>🔐 Se Connecter</button>
    </div>
  );
  const tabs = [{k:"encours",l:"⏳ En cours"},{k:"termine",l:"✅ Terminé"},{k:"annule",l:"❌ Annulé"},{k:"rembourse",l:"↩️ Remboursé"}];
  const filtered = tab==="termine"
    ? achats.filter(t => getOrderStatus(t)==="livre")
    : tab==="encours"
    ? achats.filter(t => getOrderStatus(t)==="en_cours" || getOrderStatus(t)==="en_cours")
    : tab==="annule"
    ? achats.filter(t => getOrderStatus(t)==="annule")
    : [];

  if (selected) {
    const d   = new Date(selected.date);
    const del = selected.delivery;
    return (
      <div style={{background:"#fff",minHeight:"100vh",paddingBottom:40}}>
        <div style={{padding:"16px 16px 0",display:"flex",alignItems:"center",gap:12}}>
          <button onClick={()=>setSelected(null)} style={{background:"#f0f0f0",border:"none",borderRadius:10,width:38,height:38,cursor:"pointer",fontSize:18}}>←</button>
          <h2 style={{fontWeight:900,fontSize:18,color:"#111",margin:0}}>Detay Kòmand</h2>
        </div>
        <div style={{padding:16}}>
          <div style={{...card}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={{fontWeight:800,fontSize:16,color:"#111",margin:0}}>#{19000+achats.indexOf(selected)}</p>
              <div style={{background:"#e8f5e9",borderRadius:20,padding:"5px 14px"}}><span style={{color:"#27ae60",fontWeight:700,fontSize:13}}>Terminé</span></div>
            </div>
            {[["📦 Pwodwi",`${selected.label} (x1)`],["💵 Total",`G ${selected.amount.toLocaleString("fr-HT",{minimumFractionDigits:2})}`],["📅 Dat",d.toLocaleDateString("fr-FR",{year:"numeric",month:"long",day:"numeric"})],["🕐 Lè",d.toLocaleTimeString("fr-HT",{hour:"2-digit",minute:"2-digit",second:"2-digit"})],selected.uid?["🎮 UID",selected.uid]:null].filter(Boolean).map(([l,v],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
                <span style={{fontSize:13,color:"#888"}}>{l}</span>
                <span style={{fontWeight:700,fontSize:13,color:"#111"}}>{v}</span>
              </div>
            ))}
          </div>
          {del && (
            <div style={{...card,background:"#f0fff4",border:"2px solid #27ae60"}}>
              <p style={{fontWeight:800,fontSize:14,color:"#27ae60",margin:"0 0 12px"}}>🎁 Livrezon</p>
              {del.type==="uid" && <p style={{margin:0,color:"#1b5e20",fontSize:14}}>✅ Diamann kredite sou UID ou</p>}
              {del.type==="account" && (
                <>{["📧 Email","🔑 Modpas"].map((l,i)=>{const v=i===0?del.email:del.pass;return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div><p style={{margin:0,fontSize:11,color:"#aaa"}}>{l}</p><p style={{margin:0,fontWeight:800,fontSize:13,fontFamily:"monospace"}}>{v}</p></div>
                    <button onClick={()=>copyText(v)} style={{background:"#e74c3c",color:"#fff",border:"none",borderRadius:15,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:F}}>Kopye</button>
                  </div>
                );})}
              </>)}
              {del.type==="code" && (
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <p style={{margin:0,fontWeight:900,fontSize:18,color:"#e74c3c",fontFamily:"monospace",letterSpacing:2}}>{del.code}</p>
                  <button onClick={()=>copyText(del.code)} style={{background:"#e74c3c",color:"#fff",border:"none",borderRadius:15,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:F}}>📋 Kopye</button>
                </div>
              )}
              {del.type==="msg" && <p style={{margin:0,color:"#1b5e20",fontSize:13}}>✅ Livrezon konfime!</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{background:"#fff",minHeight:"100vh",paddingBottom:30}}>
      <div style={{padding:"20px 16px 10px"}}>
        <h1 style={{fontSize:28,fontWeight:900,color:"#111",margin:"0 0 2px",fontFamily:F}}>Mes achats</h1>
        <p style={{margin:0,color:"#aaa",fontSize:13}}>Istwa tout kòmand ou yo</p>
      </div>
      <div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:8}}>
        {tabs.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"8px 18px",borderRadius:25,border:"none",background:tab===t.k?"#e74c3c":"#f0f0f0",color:tab===t.k?"#fff":"#555",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:F}}>{t.l}</button>)}
      </div>
      <div style={{margin:"8px 16px",background:"#111",borderRadius:12,padding:"14px 18px"}}>
        <p style={{margin:0,color:"#fff",fontWeight:800,fontSize:16}}>{tabs.find(t=>t.k===tab)?.l} ({filtered.length})</p>
      </div>
      <div style={{padding:"0 16px"}}>
        {filtered.length===0
          ? <div style={{background:"#f8f8f8",borderRadius:12,padding:"30px 16px",textAlign:"center",border:"1px solid #eee"}}>
              <p style={{fontSize:40,margin:"0 0 8px"}}>{tab==="encours"?"⏳":"📭"}</p>
              <p style={{fontWeight:700,fontSize:15,color:"#333",margin:"0 0 6px"}}>
                {tab==="encours"?"Okenn kòmand an kou":"Okenn kòmand"}
              </p>
              <p style={{color:"#aaa",fontSize:13,margin:0,lineHeight:1.6}}>
                {tab==="encours"
                  ? "Free Fire livré otomatik. Lòt sèvis parèt isit jiskaske admin valide yo."
                  : "Pa gen kòmand nan kategori sa a."}
              </p>
            </div>
          : <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {filtered.slice().reverse().map((t,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:14,border:"1px solid #eee",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                  <div style={{padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <p style={{margin:"0 0 4px",fontWeight:800,fontSize:16,color:"#111"}}>Commande #{19000+filtered.length-1-i}</p>
                      <p style={{margin:0,fontSize:13,color:"#e74c3c",fontWeight:600}}>{new Date(t.date).toLocaleDateString("fr-FR",{year:"numeric",month:"long",day:"numeric"})}</p>
                    </div>
                    <div style={{background:"#e8f5e9",borderRadius:20,padding:"5px 14px"}}><span style={{color:"#27ae60",fontWeight:700,fontSize:13}}>Terminé</span></div>
                  </div>
                  <div style={{margin:"0 16px 10px",background:"#f8f8f8",borderRadius:10,padding:"10px 14px"}}>
                    <p style={{margin:"0 0 4px",fontSize:10,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:1}}>PRODUITS</p>
                    <p style={{margin:0,fontWeight:700,fontSize:14,color:"#111"}}>{t.label}</p>
                  </div>
                  <div style={{margin:"0 16px",background:"#f8f8f8",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
                    <p style={{margin:"0 0 4px",fontSize:10,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:1}}>TOTAL</p>
                    <p style={{margin:0,fontWeight:800,fontSize:16,color:"#111"}}>G{t.amount.toLocaleString("fr-HT",{minimumFractionDigits:2})}</p>
                  </div>
                  <div style={{padding:"0 16px 16px"}}>
                    <button onClick={()=>setSelected(t)} style={{...redBtn,fontSize:13,padding:"11px"}}>Voir détails & livrezon</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
function ProfilePage({ user, balance, transactions, onLogout, onOpenAuth }) {
  const [showPwChange, setShowPwChange] = useState(false);
  const [oldPw, setOldPw] = useState(""); const [newPw, setNewPw] = useState(""); const [pwMsg, setPwMsg] = useState("");

  if (!user) return (
    <div style={{padding:40,textAlign:"center"}}>
      <p style={{fontSize:56,margin:"0 0 16px"}}>🔐</p>
      <h3 style={{fontWeight:900,fontSize:20,color:"#333",margin:"0 0 8px"}}>Konekte pou wè pwofil ou</h3>
      <button onClick={()=>onOpenAuth("login")} style={{...redBtn,width:"auto",padding:"12px 28px"}}>🔐 Se Connecter</button>
    </div>
  );

  const initials = ((user&&user.nom)||"?").split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase();
  const debits   = transactions.filter(t=>t.type==="debit");
  const credits  = transactions.filter(t=>t.type==="credit");

  const doChangePw = () => {
    const saved = USER_DB[user.email];
    if ((saved&&saved.pass) && saved.pass !== oldPw) { setPwMsg("❌ Ansyen modpas la pa kòrèk."); return; }
    if (newPw.length < 6) { setPwMsg("❌ Nouvo modpas dwe gen 6 karaktè omwen."); return; }
    if (saved) saved.pass = newPw;
    setPwMsg("✅ Modpas chanje avèk siksè!"); setOldPw(""); setNewPw("");
    setTimeout(()=>{setPwMsg("");setShowPwChange(false);}, 2500);
  };

  return (
    <div style={{background:"#f2f2f7",minHeight:"100vh",paddingBottom:40,fontFamily:F}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#e74c3c,#c0392b)",padding:"32px 20px 40px",textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.25)",border:"3px solid rgba(255,255,255,0.5)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
          <span style={{fontWeight:900,fontSize:28,color:"#fff"}}>{initials}</span>
        </div>
        <h2 style={{margin:"0 0 4px",fontWeight:900,fontSize:20,color:"#fff"}}>{user.nom}</h2>
        <p style={{margin:0,color:"rgba(255,255,255,0.8)",fontSize:13}}>{user.email}</p>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,padding:"0 16px",marginTop:-20,marginBottom:16}}>
        {[["💰","Balans",`G${balance.toLocaleString()}`],["🛒","Acha",debits.length],["💳","Depo",credits.length]].map(([ic,l,v])=>(
          <div key={l} style={{background:"#fff",borderRadius:14,padding:"14px 10px",textAlign:"center",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>
            <p style={{fontSize:22,margin:"0 0 4px"}}>{ic}</p>
            <p style={{margin:"0 0 2px",fontSize:10,color:"#aaa",fontWeight:700,textTransform:"uppercase"}}>{l}</p>
            <p style={{margin:0,fontWeight:900,fontSize:15,color:"#111"}}>{v}</p>
          </div>
        ))}
      </div>

      {/* Enfòmasyon */}
      <div style={{margin:"0 16px 14px",...card}}>
        <p style={{fontWeight:800,fontSize:15,color:"#111",margin:"0 0 14px"}}>👤 Enfòmasyon Kont</p>
        {[["Non konplè",user.nom],["Email",user.email]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
            <span style={{fontSize:13,color:"#888"}}>{l}</span>
            <span style={{fontWeight:700,fontSize:13,color:"#111"}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Chanje modpas */}
      <div style={{margin:"0 16px 14px",...card}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showPwChange?14:0}}>
          <p style={{fontWeight:800,fontSize:15,color:"#111",margin:0}}>🔑 Modpas</p>
          <button onClick={()=>setShowPwChange(v=>!v)} style={{background:"#f0f0f0",border:"none",borderRadius:20,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#555",fontFamily:F}}>{showPwChange?"Anile":"Chanje"}</button>
        </div>
        {showPwChange && (
          <>
            {pwMsg && <div style={{background:pwMsg.startsWith("✅")?"#e8f5e9":"#fff5f5",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:13,fontWeight:600,color:pwMsg.startsWith("✅")?"#27ae60":"#e74c3c"}}>{pwMsg}</div>}
            <input type="password" placeholder="Ansyen modpas" value={oldPw} onChange={e=>setOldPw(e.target.value)} style={{...inputS,marginBottom:8}} />
            <input type="password" placeholder="Nouvo modpas (6 min.)" value={newPw} onChange={e=>setNewPw(e.target.value)} style={{...inputS,marginBottom:12}} />
            <button onClick={doChangePw} style={{...redBtn,fontSize:14,padding:"12px"}}>Chanje Modpas</button>
          </>
        )}
      </div>

      {/* Dekonekte */}
      <div style={{margin:"0 16px"}}>
        <button onClick={onLogout} style={{...redBtn,background:"linear-gradient(135deg,#666,#444)"}}>🚪 Dekonekte</button>
      </div>
    </div>
  );
}
function NotifPage({ user }) {
  if (!user) return <div style={{padding:40,textAlign:"center"}}><p style={{fontSize:40,margin:"0 0 12px"}}>🔔</p><p style={{color:"#aaa",fontSize:14}}>Konekte pou wè notifikasyon ou.</p></div>;
  const notifs = NOTIF_STORE[user.email] || [];
  return (
    <div style={{background:"#f2f2f7",minHeight:"100vh",paddingBottom:40}}>
      <div style={{padding:"20px 16px 12px"}}><h2 style={{fontWeight:900,fontSize:22,color:"#111",margin:0}}>🔔 Notifikasyon</h2></div>
      {notifs.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 20px"}}><p style={{fontSize:48,margin:"0 0 12px"}}>🔕</p><p style={{color:"#aaa",fontSize:14}}>Pa gen notifikasyon pou kounye a.</p></div>
      ) : notifs.map((n,i)=>(
        <div key={i} style={{margin:"0 16px 10px",background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",alignItems:"flex-start",gap:12}}>
          <div style={{width:40,height:40,background:"#fff0ee",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{n.icon}</div>
          <div style={{flex:1}}>
            <p style={{margin:"0 0 4px",fontWeight:700,fontSize:14,color:"#111"}}>{n.msg}</p>
            <p style={{margin:0,fontSize:11,color:"#aaa"}}>{new Date(n.date).toLocaleDateString("fr-CA")} · {new Date(n.date).toLocaleTimeString("fr-HT",{hour:"2-digit",minute:"2-digit"})}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
function FAQPage() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{padding:20}}>
      <h2 style={{fontSize:20,fontWeight:900,margin:"0 0 16px",color:"#111"}}>❓ Kesyon Moun Poze Souvan</h2>
      {FAQ.map((item,i)=>(
        <div key={i} onClick={()=>setOpen(open===i?null:i)} style={{background:"#fff",borderRadius:12,marginBottom:10,border:`1px solid ${open===i?"#e74c3c":"#eee"}`,overflow:"hidden",cursor:"pointer",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{margin:0,fontSize:13,fontWeight:800,color:open===i?"#e74c3c":"#222",flex:1}}>{String(i+1).padStart(2,"0")}. {item.q}</p>
            <span style={{color:"#bbb",fontSize:18}}>{open===i?"▲":"▾"}</span>
          </div>
          {open===i && <div style={{padding:"0 16px 14px",borderTop:"1px solid #f5f5f5"}}><p style={{margin:"10px 0 0",color:"#555",fontSize:13,lineHeight:1.7}}>{item.a}</p></div>}
        </div>
      ))}
    </div>
  );
}
function ReferralPage({ user, onOpenAuth, transactions }) {
  const [copied, setCopied] = useState(false);
  const ref = `https://juvens-topup.ht/ref/${user?user.email.split("@")[0]:"USER"}`;
  const saved = user ? USER_DB[user.email] : null;
  const refs  = (saved&&saved.refs) || [];
  const refRevenu = refs.reduce((s,r)=>s+(r.amount||0),0);
  if (!user) return (
    <div style={{padding:40,textAlign:"center",background:"#fff",minHeight:"100vh"}}>
      <p style={{fontSize:56,margin:"0 0 16px"}}>🔐</p>
      <h3 style={{fontWeight:900,fontSize:20,color:"#333",margin:"0 0 8px"}}>Konekte pou wè referral ou</h3>
      <button onClick={()=>onOpenAuth("login")} style={{...redBtn,width:"auto",padding:"12px 28px"}}>🔐 Se Connecter</button>
    </div>
  );
  return (
    <div style={{padding:20,background:"#fff",minHeight:"100vh"}}>
      <h2 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 16px"}}>👥 Referal & Rekonpans</h2>
      <div style={{background:"linear-gradient(135deg,#1a90e8,#00c896)",borderRadius:20,padding:24,textAlign:"center",color:"#fff",marginBottom:20}}>
        <p style={{fontSize:40,margin:"0 0 8px"}}>💸</p>
        <h3 style={{margin:"0 0 6px",fontSize:20,fontWeight:900}}>Envite zanmi, touche kòb!</h3>
        <p style={{opacity:.85,fontSize:13,margin:0}}>Chak fwa yon zanmi achte, ou touche komisyon otomatik</p>
      </div>
      <div style={{...card,marginBottom:14}}>
        <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 8px",textTransform:"uppercase",letterSpacing:1}}>LEN REFERRAL OU:</p>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1,background:"#f8f8f8",borderRadius:10,padding:"10px 12px"}}><p style={{margin:0,fontSize:12,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ref}</p></div>
          <button onClick={()=>copyText(ref,()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})} style={{background:copied?"#27ae60":"linear-gradient(135deg,#1a90e8,#00c896)",color:"#fff",border:"none",borderRadius:20,padding:"8px 14px",cursor:"pointer",fontWeight:800,fontSize:12,flexShrink:0,fontFamily:F}}>{copied?"✅ Kopye!":"📋 Kopye"}</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[["👥","Zanmi",refs.length],["🛒","Acha",refs.filter(r=>r.amount>0).length],["💰","Touche",`G${refRevenu}`]].map(([ic,lb,vl])=>(
          <div key={lb} style={{...card,textAlign:"center",padding:14,marginBottom:0}}>
            <p style={{fontSize:22,margin:"0 0 4px"}}>{ic}</p>
            <p style={{color:"#aaa",fontSize:10,margin:"0 0 2px",fontWeight:700}}>{lb}</p>
            <p style={{fontWeight:900,fontSize:16,margin:0,color:"#1a90e8"}}>{vl}</p>
          </div>
        ))}
      </div>
      <div style={card}>
        <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 12px",textTransform:"uppercase",letterSpacing:1}}>KIJAN SA TRAVAY:</p>
        {[["1️⃣","Kopye link referral ou"],["2️⃣","Voye li bay zanmi ak fanmi ou"],["3️⃣","Yo enskri ak achte sou sit la"],["4️⃣","Ou touche komisyon otomatikman 💸"]].map(([n,t])=>(
          <div key={n} style={{display:"flex",gap:10,marginBottom:10}}><span>{n}</span><p style={{margin:0,color:"#555",fontSize:13}}>{t}</p></div>
        ))}
      </div>
    </div>
  );
}
function RedeemPage() {
  const [code,setCode]=useState(""); const [uid,setUid]=useState(""); const [step,setStep]=useState("form");
  const doRedeem=()=>{if(!code||!uid)return; setStep("loading"); setTimeout(()=>setStep(code.length>=8?"success":"error"),1800);};
  return (
    <div style={{padding:20,background:"#fff",minHeight:"100vh"}}>
      <h2 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 16px"}}>🎮 Redeem Pin Free Fire</h2>
      <div style={{background:"linear-gradient(135deg,#ff6b00,#e74c3c)",borderRadius:20,padding:24,color:"#fff",marginBottom:20,textAlign:"center"}}>
        <p style={{fontSize:40,margin:"0 0 8px"}}>🔥</p>
        <p style={{fontWeight:900,fontSize:18,margin:"0 0 4px"}}>Redeem Kòd Pin ou</p>
        <p style={{opacity:.85,fontSize:13,margin:0}}>Antre kòd pin Free Fire pou reklame rekonpans ou</p>
      </div>
      {step==="loading" && <div style={{textAlign:"center",padding:40}}><div style={{fontSize:48,animation:"spin 1s linear infinite",display:"inline-block"}}>⚡</div><p style={{fontWeight:800,color:"#333",marginTop:12}}>Ap verifye kòd ou...</p></div>}
      {step==="success" && <div style={{...card,textAlign:"center",padding:32}}><p style={{fontSize:56}}>✅</p><h3 style={{color:"#27ae60",fontWeight:900,fontSize:20}}>Redeem Reyisi!</h3><p style={{color:"#666",fontSize:14,margin:"8px 0 16px"}}>Rekonpans ou ap parèt nan jeu a nan kèk minit.</p><button onClick={()=>{setStep("form");setCode("");setUid("");}} style={{...redBtn,width:"auto",padding:"12px 24px"}}>Redeem yon lòt</button></div>}
      {step==="error" && <div style={{...card,textAlign:"center",padding:32}}><p style={{fontSize:56}}>❌</p><h3 style={{color:"#e74c3c",fontWeight:900,fontSize:20}}>Kòd Invalide!</h3><p style={{color:"#888",fontSize:13,margin:"0 0 16px"}}>Verifye kòd la epi reesye.</p><button onClick={()=>setStep("form")} style={{...redBtn,width:"auto",padding:"12px 24px"}}>Reesye</button></div>}
      {step==="form" && <div style={card}>
        <p style={{fontSize:10,fontWeight:700,color:"#888",margin:"0 0 12px",textTransform:"uppercase",letterSpacing:1}}>ANTRE ENFÒMASYON:</p>
        <input placeholder="UID Free Fire ou *" value={uid} onChange={e=>setUid(e.target.value.replace(/[^0-9]/g,""))} style={{...inputS}} maxLength={12}/>
        <input placeholder="Kòd Pin (ex: FFGRP-XXXX-XXXX) *" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} style={{...inputS,fontFamily:"monospace",letterSpacing:2}} maxLength={20}/>
        <p style={{color:"#aaa",fontSize:11,margin:"0 0 14px",lineHeight:1.6}}>💡 Jwenn kòd: Magazen Free Fire → Redeem Code</p>
        <button onClick={doRedeem} disabled={!code||!uid} style={{...redBtn,opacity:(code&&uid)?1:0.5}}>{(!code||!uid)?"Ranpli champ yo":"🎁 Redeem Kounye a"}</button>
      </div>}
    </div>
  );
}
function RekonpansPage({ transactions }) {
  const now = new Date();
  const ffAchats=(transactions||[]).filter(t=>{const d=new Date(t.date);return t.type==="debit"&&t.label.toLowerCase().includes("free fire")&&d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length;
  const NIVO=[{a:6166,r:1166,f:6},{a:2400,r:572,f:10},{a:1160,r:341,f:10},{a:572,r:341,f:18},{a:341,r:110,f:18},{a:110,r:110,f:25}];
  return (
    <div style={{background:"#f7f7f7",minHeight:"100vh",paddingBottom:30}}>
      <div style={{padding:"20px 16px 12px"}}><h2 style={{fontSize:22,fontWeight:900,color:"#111",margin:0}}>🌿 Rekonpans Freefire</h2></div>
      <div style={{margin:"0 16px 10px",background:"linear-gradient(135deg,#7b0000,#3d0000)",borderRadius:16,padding:20,color:"#fff"}}>
        <p style={{fontWeight:900,fontSize:17,margin:"0 0 6px"}}>Pwogram fidelite Free Fire</p>
        <p style={{color:"rgba(255,255,255,0.75)",fontSize:13,margin:"0 0 6px",lineHeight:1.6}}>Achte, monte palye, epi reklame kado ou yo otomatikman chak mwa.</p>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:12,margin:0}}>Peryod: {String(now.getMonth()+1).padStart(2,"0")}/{now.getFullYear()}</p>
      </div>
      {[["Acha mwa sa",ffAchats],["Rekonpans mwa sa",0],["Peryod",`${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`]].map(([l,v])=>(
        <div key={l} style={{margin:"0 16px 8px",background:"#1a1a1a",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontWeight:900,fontSize:18,color:"#fff",minWidth:50}}>{v}</span>
          <span style={{color:"#666",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{l}</span>
        </div>
      ))}
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        {NIVO.map((n,i)=>{
          const pct=Math.round(Math.min(ffAchats,n.f)/n.f*100);
          return (
            <div key={i} style={{background:"#1a1a1a",borderRadius:16,padding:18,color:"#fff"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div><p style={{fontWeight:900,fontSize:18,margin:"0 0 4px"}}>{n.a} 💎</p><p style={{color:"#aaa",fontSize:13,margin:0}}>Rekonpans: <b style={{color:"#fff"}}>{n.r} 💎</b></p></div>
                <div style={{background:"#8b0000",borderRadius:20,padding:"4px 12px",fontSize:13,fontWeight:900}}>{n.f}x</div>
              </div>
              <div style={{background:"#333",borderRadius:10,height:6,margin:"12px 0 8px",overflow:"hidden"}}>
                <div style={{background:pct>0?"#e74c3c":"#333",width:`${pct}%`,height:"100%",borderRadius:10}} />
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <p style={{color:"#888",fontSize:13,margin:0}}>{Math.min(ffAchats,n.f)} / {n.f}</p>
                <p style={{color:"#888",fontSize:13,margin:0}}>{pct}%</p>
              </div>
              <p style={{color:"#666",fontSize:12,margin:"8px 0 0"}}>Achte <b style={{color:"#fff"}}>{Math.max(0,n.f-ffAchats)} fwa anko</b> pou <b style={{color:"#fff"}}>{n.r} 💎</b>.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function GroupChatPage() {
  const groups=[
    {nom:"Juvens Top Up — Ofisyèl 🇭🇹",members:"1.2k",desc:"Gwoup ofisyèl Juvens Top Up. Nouvèl, pwomo ak sipò.",color:"#25D366",icon:"💬",link:"https://chat.whatsapp.com/"},
    {nom:"Free Fire Haiti 🔥",members:"3.4k",desc:"Kòd redeem, tip ak triks, jwenn ekip Free Fire.",color:"#ff6b00",icon:"🔥",link:"https://chat.whatsapp.com/"},
    {nom:"PUBG Mobile Haiti 🎯",members:"980",desc:"UC, skin, rank push — jwenn ekip PUBG ou!",color:"#f5c518",icon:"🎯",link:"https://chat.whatsapp.com/"},
    {nom:"Streaming & Series 🎬",members:"560",desc:"Rekòmandason fim, seri, anime ak kont streaming.",color:"#e50914",icon:"🎬",link:"https://chat.whatsapp.com/"},
  ];
  return (
    <div style={{padding:20,background:"#fff",minHeight:"100vh"}}>
      <h2 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 4px"}}>💬 Group Chat</h2>
      <p style={{color:"#888",fontSize:13,margin:"0 0 20px"}}>Rejwenn kominote a — chwazi gwoup ki pi bon pou ou!</p>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {groups.map((g,i)=>(
          <div key={i} style={{...card,marginBottom:0}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
              <div style={{width:48,height:48,background:g.color+"22",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{g.icon}</div>
              <div style={{flex:1}}><p style={{margin:0,fontWeight:800,fontSize:14,color:"#111"}}>{g.nom}</p><p style={{margin:0,fontSize:11,color:"#aaa"}}>👥 {g.members} manm</p></div>
            </div>
            <p style={{color:"#666",fontSize:13,margin:"0 0 12px",lineHeight:1.5}}>{g.desc}</p>
            <a href={g.link} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
              <button style={{background:g.color,color:"#fff",border:"none",borderRadius:20,padding:"10px",fontSize:13,fontWeight:800,cursor:"pointer",width:"100%",fontFamily:F}}>💬 Rantre nan Gwoup</button>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
function ConditionsPage() {
  const sections=[
    {t:"1. Sèvis nou ofri",c:"Juvens Top Up ofri sèvis rechaj dijital pou jeu videyo, platfòm streaming, gift cards ak lòt sèvis dijital. Tout sèvis yo delivre otomatikman apre konfirmasyon peman."},
    {t:"2. Peman ak Depo",c:"Nou aksepte depo via NatCash sèlman. Apre ou fin voye lajan an, ou dwe antre TransCode ou pou kredite wallet ou. Tout depo yo final — pa gen ranbousman."},
    {t:"3. Livrezon",c:"Sèvis dijital yo livre otomatikman imedyatman apre konfirmasyon peman. Si ou pa resevwa sèvis la nan 15 minit, kontakte sipò nou."},
    {t:"4. Ranbousman",c:"❌ Tout acha dijital yo FINAL. Nou pa fè ranbousman pou sèvis deja delivre. Verifye UID, email oswa lòt enfòmasyon ou anvan ou pase kòmand."},
    {t:"5. Responsablite kliyan",c:"Kliyan responsab pou bay bon enfòmasyon. Juvens Top Up pa responsab pou pèt akòz done mal antre pa kliyan."},
    {t:"6. Kont ak Sekirite",c:"Ou responsab pou kenbe modpas kont ou an sekirite. Pa pataje enfòmasyon kont ou ak pèsonn. Juvens Top Up pa janm mande modpas ou."},
    {t:"7. Kontakte nou",c:"Pou nenpòt kesyon, kontakte nou via gwoup WhatsApp ofisyèl nou oswa nan paj Paj Èd la."},
  ];
  return (
    <div style={{padding:20,background:"#fff",minHeight:"100vh"}}>
      <h2 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 4px"}}>📄 Conditions Générales</h2>
      <p style={{color:"#888",fontSize:13,margin:"0 0 20px"}}>Dènye mizajou: Avril 2026</p>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sections.map((s,i)=>(
          <div key={i} style={card}>
            <p style={{fontWeight:900,fontSize:14,color:"#1a90e8",margin:"0 0 8px"}}>{s.t}</p>
            <p style={{color:"#555",fontSize:13,lineHeight:1.7,margin:0}}>{s.c}</p>
          </div>
        ))}
      </div>
      <p style={{textAlign:"center",color:"#ccc",fontSize:12,marginTop:20}}>© 2026 Juvens Top Up 🇭🇹</p>
    </div>
  );
}
function AboutPage() {
  const stats = [
    {n:"500+",  l:"Kliyan Satisfè"},
    {n:"5,000+",l:"Kòmand Traite"},
    {n:"100%",  l:"Livrezon Otomatik"},
    {n:"7j/7",  l:"Sipò Disponib"},
  ];
  const values = [
    {icon:"⚡", t:"Vitès", d:"Livrezon imedya — kòmand ou konfime nan 30 sègonn."},
    {icon:"🔒", t:"Sekirite", d:"100% sekirize. Nou pa janm mande modpas kont ou."},
    {icon:"💰", t:"Pri Konpetitif", d:"Meillè pri nan mache a. Nou konpare pou ou ka ekonomize."},
    {icon:"🇭🇹", t:"Fèt Pou Ayiti", d:"Platfòm ki kree espesyalman pou itilizatè Ayisyen."},
  ];
  return (
    <div style={{background:"#f2f2f7",minHeight:"100vh",paddingBottom:40,fontFamily:F}}>
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#1a6ef5,#0a4fd4)",padding:"36px 20px 32px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:150,height:150,background:"rgba(255,255,255,0.07)",borderRadius:"50%"}} />
        <div style={{position:"absolute",bottom:-40,left:-20,width:120,height:120,background:"rgba(255,255,255,0.05)",borderRadius:"50%"}} />
        <img src={JT_LOGO} alt="JT" style={{height:64,objectFit:"contain",marginBottom:12,display:"block",margin:"0 auto 12px"}}
          onError={e=>{e.target.style.display="none";}} />
        <h1 style={{margin:"0 0 6px",fontWeight:900,fontSize:26,color:"#fff"}}>Juvens Top Up</h1>
        <p style={{margin:0,color:"rgba(255,255,255,0.85)",fontSize:14,lineHeight:1.6,maxWidth:300,display:"block",marginLeft:"auto",marginRight:"auto"}}>
          Platfòm rechaj dijital #1 Ayiti — Rapide, Sekirize, Abòdab.
        </p>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"16px 16px 0"}}>
        {stats.map((s,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:14,padding:"16px 12px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <p style={{margin:"0 0 4px",fontWeight:900,fontSize:24,color:"#1a6ef5"}}>{s.n}</p>
            <p style={{margin:0,fontSize:11,color:"#888",fontWeight:600}}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Istwa */}
      <div style={{margin:"16px 16px 0",background:"#fff",borderRadius:16,padding:"18px 18px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <p style={{fontWeight:900,fontSize:16,color:"#111",margin:"0 0 10px"}}>📖 Istwa Nou</p>
        <p style={{color:"#555",fontSize:13,lineHeight:1.8,margin:0}}>
          Juvens Top Up te kreye pou regle yon pwoblèm senp: <b>kliyan Ayisyen pa vle pou achte kredi dijital yo difisil</b>. Nou te wè ke moun bezwen yon platfòm ki rapid, ki sekirize, epi ki akseptab pou tout moun — depi jou a nou te ouvri, nou pa janm kanpe.
        </p>
      </div>

      {/* Valè */}
      <div style={{margin:"14px 16px 0",background:"#fff",borderRadius:16,padding:"18px 18px",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
        <p style={{fontWeight:900,fontSize:16,color:"#111",margin:"0 0 14px"}}>🌟 Sa ki Fè Nou Espesyal</p>
        {values.map((v,i)=>(
          <div key={i} style={{display:"flex",gap:14,marginBottom:i<values.length-1?14:0,paddingBottom:i<values.length-1?14:0,borderBottom:i<values.length-1?"1px solid #f5f5f5":"none"}}>
            <div style={{width:44,height:44,borderRadius:12,background:"#e8f0fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{v.icon}</div>
            <div>
              <p style={{margin:"0 0 3px",fontWeight:800,fontSize:14,color:"#111"}}>{v.t}</p>
              <p style={{margin:0,fontSize:13,color:"#666",lineHeight:1.6}}>{v.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Misyon */}
      <div style={{margin:"14px 16px 0",background:"linear-gradient(135deg,#e74c3c,#c0392b)",borderRadius:16,padding:"20px 18px"}}>
        <p style={{fontWeight:900,fontSize:15,color:"#fff",margin:"0 0 8px"}}>🎯 Misyon Nou</p>
        <p style={{color:"rgba(255,255,255,0.9)",fontSize:13,lineHeight:1.7,margin:0}}>
          Rann sèvis dijital aksesib pou <b style={{color:"#fff"}}>tout Ayisyen</b> — kèlkeswa kote yo ye a — ak yon eksperyans ki rapid, endèpandan, epi san frik.
        </p>
      </div>

      <div style={{textAlign:"center",padding:"20px 16px 0"}}>
        <p style={{color:"#ccc",fontSize:12,margin:0}}>© 2026 Juvens Top Up 🇭🇹 · Fèt pou Ayiti</p>
      </div>
    </div>
  );
}
function ContactPage() {
  const contacts = [
    {icon:"💬",label:"WhatsApp Sipò",val:"55726342",link:"https://wa.me/50955726342?text=Bonjou%20Juvens%20Top%20Up%20👋",btn:"Kontakte",color:"#25D366"},
    {icon:"📘",label:"Facebook",val:"Juvens Top Up",link:"https://facebook.com",btn:"Vizite",color:"#1877F2"},
    {icon:"📸",label:"Instagram",val:"@juvenstopup",link:"https://instagram.com",btn:"Suiv",color:"#E1306C"},
    {icon:"🎵",label:"TikTok",val:"@juvenstopup",link:"https://tiktok.com",btn:"Gade",color:"#010101"},
    {icon:"💳",label:"NatCash",val:"55726342",link:null,btn:null,color:"#1a3a5c"},
  ];
  return (
    <div style={{background:"#f2f2f7",minHeight:"100vh",paddingBottom:40,fontFamily:F}}>
      <div style={{background:"linear-gradient(135deg,#e74c3c,#c0392b)",padding:"32px 20px 28px",textAlign:"center"}}>
        <p style={{fontSize:48,margin:"0 0 8px"}}>📞</p>
        <h2 style={{margin:"0 0 4px",fontWeight:900,fontSize:22,color:"#fff"}}>Kontakte Nou</h2>
        <p style={{margin:0,color:"rgba(255,255,255,0.8)",fontSize:13}}>Nou disponib 7j/7 pou ede ou</p>
      </div>
      <div style={{padding:"16px 16px 0"}}>
        {contacts.map((c,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:14,padding:"16px",marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:48,height:48,borderRadius:14,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{c.icon}</div>
            <div style={{flex:1}}>
              <p style={{margin:0,fontWeight:700,fontSize:13,color:"#888"}}>{c.label}</p>
              <p style={{margin:0,fontWeight:800,fontSize:15,color:"#111"}}>{c.val}</p>
            </div>
            {c.link && <a href={c.link} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
              <div style={{background:c.color,borderRadius:20,padding:"8px 16px"}}>
                <span style={{color:"#fff",fontWeight:800,fontSize:13,fontFamily:F}}>{c.btn}</span>
              </div>
            </a>}
          </div>
        ))}
      </div>
      <div style={{margin:"8px 16px 0",background:"linear-gradient(135deg,#1a6ef5,#0a4fd4)",borderRadius:14,padding:"20px 18px"}}>
        <p style={{margin:"0 0 4px",fontWeight:800,fontSize:15,color:"#fff"}}>🕐 Orè Sipò</p>
        <p style={{margin:0,color:"rgba(255,255,255,0.8)",fontSize:13}}>Lendi – Samdi: 7h AM – 10h PM</p>
        <p style={{margin:"4px 0 0",color:"rgba(255,255,255,0.8)",fontSize:13}}>Dimanch: 8h AM – 8h PM</p>
      </div>
    </div>
  );
}
function Footer({ setPage }) {
  return (
    <div style={{background:"#111",padding:"20px 20px 16px",fontFamily:F}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <img src={JT_LOGO} alt="JT" style={{height:32,objectFit:"contain"}} onError={e=>{e.target.style.display="none";}} />
        <div><p style={{margin:0,fontWeight:900,fontSize:16,color:"#fff"}}>Juvens Top Up</p><p style={{margin:0,fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:2}}>Platfòm #1 Ayiti 🇭🇹</p></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[["Kondisyon","conditions"],["Sipò","contact"],["FAQ","faq"],["Referral","referral"]].map(([l,k])=>(
          <button key={k} onClick={()=>setPage(k)} style={{background:"none",border:"none",color:"#aaa",fontSize:12,cursor:"pointer",textAlign:"left",fontFamily:F,padding:0}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:12,marginBottom:14}}>
        {[["💬","https://wa.me/50955726342"],["📘","https://facebook.com"],["📸","https://instagram.com"],["🎵","https://tiktok.com"]].map(([ic,url])=>(
          <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{width:36,height:36,background:"#222",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,textDecoration:"none"}}>{ic}</a>
        ))}
      </div>
      <div style={{borderTop:"1px solid #222",paddingTop:12}}>
        <p style={{margin:"0 0 2px",color:"#888",fontSize:11}}>💳 NatCash: <span style={{color:"#fff",fontWeight:700,fontFamily:"monospace"}}>55726342</span></p>
        <p style={{margin:0,color:"#555",fontSize:11}}>© 2026 Juvens Top Up. Tout dwa rezève.</p>
      </div>
    </div>
  );
}
const getInitials = (nom) => (nom||"?").split(" ").map(w=>(w||"")[0]||"").join("").slice(0,2).toUpperCase();
const PROMO_DB = {
  "JUVENS10": { pct:10, label:"10% rabè", uses:0, maxUses:100 },
  "FF2026":   { pct:15, label:"15% Free Fire", uses:0, maxUses:50, productId:1 },
  "BIENVENU": { pct:5,  label:"5% Nvo kliyan", uses:0, maxUses:999 },
};
function Page404({ setPage }) {
  return (
    <div style={{background:"#fff",minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center",fontFamily:F}}>
      <div style={{fontSize:72,marginBottom:16}}>🔍</div>
      <h2 style={{fontWeight:900,fontSize:24,color:"#111",margin:"0 0 8px"}}>Paj Pa Jwenn</h2>
      <p style={{color:"#888",fontSize:14,lineHeight:1.7,margin:"0 0 24px",maxWidth:280}}>Paj ou ap chache a pa egziste oswa li te deplase. Retounen nan paj dakèy.</p>
      <button onClick={()=>setPage("home")} style={{...redBtn,width:"auto",padding:"14px 32px",fontSize:15}}>🏠 Retounen Dakèy</button>
    </div>
  );
}
function SideMenu({ open, onClose, setPage, user, onAuth, onLogout }) {
  const GRAD = "linear-gradient(135deg, #1a90e8, #00c896)";
  const items = [
    {icon:"🏠", l:"Accueil",          k:"home"},
    {icon:"🏆", l:"Top client",       k:"top"},
    {icon:"💰", l:"Wallet",           k:"wallet"},
    {icon:"📲", l:"Depo NatCash",     k:"natcash"},
    {icon:"🛒", l:"Mes achats",       k:"mesachats"},
    {icon:"👥", l:"Referal & Rekonpans", k:"referral"},
    {icon:"🎮", l:"Redeem Pin FF",    k:"redeem"},
    {icon:"🌿", l:"Rekonpans FF",     k:"rekonpans"},
    {icon:"💬", l:"Group Chat",       k:"groupchat"},
    {icon:"🔔", l:"Notifikasyon",     k:"notif"},
    {icon:"📞", l:"Kontakte Nou",     k:"contact"},
    {icon:"❓", l:"Paj Èd",           k:"faq"},
    {icon:"📄", l:"Conditions",       k:"conditions"},
    {icon:"ℹ️", l:"À Propos",         k:"about"},
  ];
  const mC = {background:"#fff",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:"1px solid #ebebeb",marginBottom:8};
  return (
    <>{open && <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:300}} />}
    <div style={{position:"fixed",top:0,right:0,height:"100%",width:"82%",maxWidth:320,background:"#f2f2f7",zIndex:400,transform:open?"translateX(0)":"translateX(100%)",transition:"transform .3s ease",fontFamily:F,display:"flex",flexDirection:"column",overflowY:"auto"}}>
      <div style={{background:GRAD,padding:"20px 16px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src={JT_LOGO} alt="JT" style={{height:38,objectFit:"contain"}} onError={e=>{e.target.style.display="none";}} />
          <div><p style={{margin:0,fontWeight:900,fontSize:18,color:"#fff"}}>Juvens</p><p style={{margin:0,fontWeight:700,fontSize:11,color:"rgba(255,255,255,0.8)",letterSpacing:1,textTransform:"uppercase"}}>Top Up</p></div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:18,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      <div style={{padding:"12px 12px 20px",display:"flex",flexDirection:"column"}}>
        {user ? (
          <div onClick={()=>{setPage("profile");onClose();}} style={{...mC,background:"linear-gradient(135deg,#e8f4ff,#e0fff6)",border:"1px solid rgba(26,144,232,0.2)"}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontWeight:900,fontSize:14,color:"#fff"}}>{((user&&user.nom)||"?").split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase()}</span>
            </div>
            <div style={{flex:1}}><p style={{margin:0,fontWeight:800,fontSize:14,color:"#111"}}>{user.nom}</p><p style={{margin:0,fontSize:11,color:"#888"}}>{user.email}</p></div>
            <span style={{color:"#1a90e8",fontSize:16}}>›</span>
          </div>
        ) : (
          <div onClick={()=>{onAuth("login");onClose();}} style={{...mC,background:GRAD,border:"none"}}>
            <span style={{fontSize:20,width:28,textAlign:"center"}}>🔐</span>
            <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>Se Connecter</span>
          </div>
        )}
        {items.map((item,i)=>(
          <div key={i} onClick={()=>{setPage(item.k);onClose();}} style={mC}>
            <span style={{fontSize:18,width:28,textAlign:"center"}}>{item.icon}</span>
            <span style={{fontSize:15,fontWeight:700,color:"#1a90e8"}}>{item.l}</span>
          </div>
        ))}
        {user ? (
          <div onClick={()=>{onLogout();onClose();}} style={mC}>
            <span style={{fontSize:18,width:28,textAlign:"center"}}>🚪</span>
            <span style={{fontSize:15,fontWeight:700,color:"#e74c3c"}}>Dekonekte</span>
          </div>
        ) : (
          <div onClick={()=>{onAuth("register");onClose();}} style={mC}>
            <span style={{fontSize:18,width:28,textAlign:"center"}}>✨</span>
            <span style={{fontSize:15,fontWeight:700,color:"#1a90e8"}}>S&#39;inscrire</span>
          </div>
        )}
        {/* Rezo Sosyal — Pwen 12 */}
        <div style={{marginTop:8,padding:"14px 0 4px",borderTop:"1px solid #e8e8e8"}}>
          <p style={{fontSize:10,fontWeight:700,color:"#bbb",textTransform:"uppercase",letterSpacing:2,margin:"0 0 10px"}}>Suiv nou sou rezo</p>
          <div style={{display:"flex",gap:10}}>
            {[["💬","#25D366","https://wa.me/50955726342"],["📘","#1877F2","https://facebook.com"],["📸","#E1306C","https://instagram.com"],["🎵","#010101","https://tiktok.com"]].map(([ic,cl,url])=>(
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{width:42,height:42,borderRadius:12,background:cl+"22",border:`1px solid ${cl}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,textDecoration:"none"}}>{ic}</a>
            ))}
          </div>
        </div>
      </div>
    </div></>
  );
}
// ─── LOCALSTORAGE HELPERS (in-memory fallback pour artifact) ──────────────────
const _STORE = {};
const LS = {
  get: (k, def=null) => { try { return _STORE[k]!==undefined?_STORE[k]:def; } catch(e){return def;} },
  set: (k,v)         => { try { _STORE[k]=v; } catch(e){} },
  del: (k)           => { try { delete _STORE[k]; } catch(e){} },
};

export default function App() {
  const savedUser    = LS.get("jt_user",    null);
  const savedBalance = LS.get("jt_balance", 0);
  const savedTxs     = LS.get("jt_txs",     []);

  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState("home");
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [product,    setProduct]    = useState(null);
  const [balance,    setBalance]    = useState(savedBalance);
  const [txs,        setTxs]        = useState(savedTxs);
  const [user,       setUser]       = useState(savedUser);
  const [authModal,  setAuthModal]  = useState(null);
  const [showWelcome,setShowWelcome]= useState(!savedUser);
  useEffect(() => {
    if (savedUser) {
      USER_DB[savedUser.email] = {
        balance: savedBalance,
        txs: savedTxs,
        refs: LS.get("jt_refs", []),
        pass: savedUser.pass || "",
      };
    }
  }, []);

  const addTx = t => {
    const n = [...txs, t];
    setTxs(n);
    LS.set("jt_txs", n);
    if (user) {
      if (!USER_DB[user.email]) USER_DB[user.email]={balance:0,txs:[],refs:[]};
      USER_DB[user.email].txs = n;
      if (t.type === "debit") lbAdd(user.email, user.nom, t.amount);
    }
  };
  const setBalSave = fn => {
    const nb = typeof fn==="function"?fn(balance):fn;
    setBalance(nb);
    LS.set("jt_balance", nb);
    if (user) {
      if (!USER_DB[user.email]) USER_DB[user.email]={balance:0,txs:[],refs:[]};
      USER_DB[user.email].balance = nb;
    }
  };
  const doLogin = u => {
    setUser(u);
    LS.set("jt_user", u);
    const saved = USER_DB[u.email];
    if (saved) {
      setBalance(saved.balance||0);
      setTxs(saved.txs||[]);
      LS.set("jt_balance", saved.balance||0);
      LS.set("jt_txs", saved.txs||[]);
    } else {
      USER_DB[u.email]={balance:0,txs:[],refs:[],pass:u.pass||""};
      const lsBalance = LS.get("jt_balance",0);
      const lsTxs     = LS.get("jt_txs",[]);
      setBalance(lsBalance); setTxs(lsTxs);
    }
    setShowWelcome(false);
  };
  const doLogout = () => {
    if (user) USER_DB[user.email]={balance,txs};
    setUser(null); setPage("home"); setBalance(0); setTxs([]);
    LS.del("jt_user"); LS.del("jt_balance"); LS.del("jt_txs"); LS.del("jt_refs");
  };

  const renderPage = () => {
    switch(page) {
      case "home":       return <HomePage onProduct={setProduct} />;
      case "wallet":     return <WalletPage balance={balance} transactions={txs} setPage={setPage} user={user} onOpenAuth={setAuthModal} />;
      case "top":        return <TopPage user={user} />;
      case "natcash":    return <NatCashPage balance={balance} setBalance={setBalSave} addTx={addTx} transactions={txs} user={user} onNeedAuth={setAuthModal} />;
      case "contact":    return <ContactPage />;
      case "about":      return <AboutPage />;
      case "mesachats":  return <MesAchatsPage transactions={txs} user={user} onOpenAuth={setAuthModal} />;
      case "faq":        return <FAQPage />;
      case "referral":   return <ReferralPage user={user} onOpenAuth={setAuthModal} transactions={txs} />;
      case "redeem":     return <RedeemPage />;
      case "rekonpans":  return <RekonpansPage transactions={txs} />;
      case "groupchat":  return <GroupChatPage />;
      case "conditions": return <ConditionsPage />;
      case "profile":    return <ProfilePage user={user} balance={balance} transactions={txs} onLogout={doLogout} onOpenAuth={setAuthModal} />;
      case "notif":      return <NotifPage user={user} />;
      default:           return <Page404 setPage={setPage} />;
    }
  };
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1300); return () => clearTimeout(t); }, []);

  const notifCount = user ? (NOTIF_STORE[user.email]||[]).filter(n=>!n.read).length : 0;

  if (loading) return <LoadingScreen />;

  return (
    <div style={{background:"#f8f8f8",minHeight:"100vh",fontFamily:F,maxWidth:500,margin:"0 auto",position:"relative",overflow:"hidden"}}>
      <style>{`@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap"); @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}} @keyframes waPulse{0%,100%{box-shadow:0 4px 16px rgba(37,211,102,0.5)}50%{box-shadow:0 4px 24px rgba(37,211,102,0.85)}} input::placeholder{color:#bbb} input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}`}</style>
      <CopyToast>
        {/* WELCOME MODAL */}
        {showWelcome && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"#fff",borderRadius:16,width:"92%",maxWidth:420,overflow:"hidden",fontFamily:F}}>
              <div style={{background:"#f5f5f5",padding:"20px 24px 16px",textAlign:"center"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  <img src={JT_LOGO} alt="JT" style={{height:50,objectFit:"contain"}} />
                  <div><p style={{margin:0,fontWeight:900,fontSize:24,color:"#1a6ef5",fontFamily:F}}>JUVENS</p><p style={{margin:0,fontWeight:700,fontSize:13,color:"#e74c3c",letterSpacing:2}}>TOP UP</p></div>
                </div>
                <p style={{margin:"12px 0 0",fontSize:13,color:"#888"}}>Platfòm Top Up #1 Ayiti 🇭🇹</p>
              </div>
              <div style={{display:"flex"}}>
                <button onClick={()=>{setAuthModal("login");setShowWelcome(false);}} style={{flex:1,padding:"14px 0",border:"none",background:"#111",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:F}}>Se Connecter</button>
                <button onClick={()=>{setAuthModal("register");setShowWelcome(false);}} style={{flex:1,padding:"14px 0",border:"none",background:"#f0f0f0",color:"#555",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:F}}>S&#39;inscrire</button>
              </div>
              <div style={{padding:"16px 20px",textAlign:"center",borderTop:"1px solid #f0f0f0"}}>
                <button onClick={()=>setShowWelcome(false)} style={{background:"none",border:"none",color:"#aaa",fontSize:13,cursor:"pointer",fontFamily:F,textDecoration:"underline"}}>Kontinye san kont →</button>
              </div>
            </div>
          </div>
        )}

        {/* NAVBAR */}
        <nav style={{background:"#fff",borderBottom:"1px solid #eee",padding:"0 16px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          <button onClick={()=>setMenuOpen(true)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:0,color:"#333"}}>☰</button>
          <div onClick={()=>setPage("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <img src={JT_LOGO} alt="JT" style={{height:38,objectFit:"contain"}} onError={e=>{e.target.style.display="none";}} />
            <div style={{lineHeight:1.1}}>
              <span style={{fontWeight:900,fontSize:17,color:"#1a6ef5",display:"block",fontFamily:F}}>Juvens</span>
              <span style={{fontWeight:700,fontSize:11,color:"#e74c3c",display:"block",letterSpacing:1,textTransform:"uppercase",fontFamily:F}}>Top Up</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div onClick={()=>setPage("wallet")} style={{background:"#fff0ee",border:"1px solid #fca9a0",borderRadius:20,padding:"5px 10px",cursor:"pointer",fontSize:12,fontWeight:800,color:"#e74c3c"}}>💰 G{balance.toLocaleString()}</div>
            {user ? (
              <div style={{position:"relative"}} onClick={()=>setPage("notif")}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"#fff0ee",border:"2px solid #e74c3c",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔔</div>
                {notifCount>0 && <div style={{position:"absolute",top:-4,right:-4,background:"#e74c3c",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:9,fontWeight:900}}>{notifCount}</span></div>}
              </div>
            ) : (
              <div onClick={()=>setPage("natcash")} style={{background:"#e74c3c",borderRadius:20,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:900,color:"#fff"}}>+ Depo</div>
            )}
          </div>
        </nav>

        <SideMenu open={menuOpen} onClose={()=>setMenuOpen(false)} setPage={setPage} user={user} onAuth={m=>{setAuthModal(m);setMenuOpen(false);}} onLogout={doLogout} />

        <div style={{paddingBottom:80,minHeight:"calc(100vh - 58px)",background:"#f8f8f8"}}>
          {renderPage()}
          <Footer setPage={setPage} />
        </div>

        {/* BOTTOM TABS */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,background:"#fff",borderTop:"1px solid #eee",display:"flex",justifyContent:"space-around",padding:"8px 0 12px",zIndex:200,boxShadow:"0 -2px 10px rgba(0,0,0,0.06)"}}>
          {[
            {k:"home",    i:"🏠",  l:"Accueil"},
            {k:"wallet",  i:"💰",  l:"Wallet"},
            {k:"natcash", i:"📲",  l:"NatCash"},
            {k:"mesachats",i:"🛒", l:"Achats"},
            {k:"top",     i:"🏆",  l:"Top"},
            {k:user?"profile":"faq", i:user?"👤":"❓", l:user?"Pwofil":"Aide"},
          ].map(t=>(
            <div key={t.k} onClick={()=>setPage(t.k)} style={{textAlign:"center",cursor:"pointer",padding:"2px 8px"}}>
              <p style={{fontSize:20,margin:"0 0 1px"}}>{t.i}</p>
              <p style={{margin:0,fontSize:10,fontWeight:800,color:page===t.k?"#e74c3c":"#bbb"}}>{t.l}</p>
              {page===t.k && <div style={{width:4,height:4,background:"#e74c3c",borderRadius:"50%",margin:"2px auto 0"}} />}
            </div>
          ))}
        </div>

        {authModal && <LoginModal mode={authModal} onClose={()=>setAuthModal(null)} onLogin={doLogin} />}

        <ProductModal product={product} onClose={()=>setProduct(null)} balance={balance} setBalance={setBalSave} addTx={addTx} user={user} onNeedAuth={m=>{setProduct(null);setAuthModal(m);}} onGoDeposit={()=>{setProduct(null);setPage("natcash");}} />

        {/* ── BOUTON WHATSAPP FLOTTANT ── */}
        <a href="https://wa.me/50955726342?text=Bonjou%20Juvens%20Top%20Up%2C%20mwen%20bezwen%20èd%20👋" target="_blank" rel="noopener noreferrer"
          style={{position:"fixed",bottom:88,right:16,zIndex:500,textDecoration:"none"}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"#25D366",boxShadow:"0 4px 16px rgba(37,211,102,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,animation:"waPulse 2s infinite"}}>
            💬
          </div>
          <div style={{position:"absolute",top:-6,right:-2,background:"#e74c3c",borderRadius:20,padding:"2px 7px",fontSize:9,fontWeight:900,color:"#fff",fontFamily:F,whiteSpace:"nowrap"}}>Sipò</div>
        </a>
      </CopyToast>
    </div>
  );
}
