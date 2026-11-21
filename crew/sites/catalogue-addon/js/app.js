(function(){
"use strict";
var BUNDLED = window.SITE_DATA;
var S = BUNDLED;
var API = ((window.SNAPSENSE_CONFIG||{}).API_URL||"").trim();
var booking = {state:"idle", id:"", err:""};
var remoteReady = !API;
var app = document.getElementById("app");

/* ---------- language ---------- */
var lang="ms";
try{var sl=localStorage.getItem("ss-lang"); if(sl==="en"||sl==="ms")lang=sl;}catch(e){}
if(location.hash==="#en")lang="en"; else if(location.hash==="#bm")lang="ms";
var T = window.I18N;
function t(k){return T[lang][k];}
/* Susun atur mesra pengguna (Nov 2026): teks baru untuk pencari servis, langkah tempahan dan bar bawah telefon. */
var X={
 ms:{nav:[["harga","Pakej & harga"],["sebut-harga","Tempah"],["tarikh","Tarikh kosong"],["portfolio","Portfolio"],["kempen","Kempen"],["soalan","Soalan"]],
  heroCta1:"Lihat pakej & harga",heroCta2:"WhatsApp kami",
  finderEyebrow:"Pakej & harga",finderTitle:"Apa yang anda perlukan?",finderLead:"Pilih servis untuk lihat semua pakej dan harga. Harga terbuka, tiada caj tersembunyi.",
  from:"dari",nPkg:function(n){return n+" pakej";},pkgsFor:"Pakej",book:"Tempah pakej ini",ask:"Tanya di WhatsApp",
  more:function(n){return "+ "+n+" lagi";},less:"Tutup",
  waAsk:function(p,pr){return "Hai SnapSense! Saya berminat dengan pakej "+p+" ("+pr+"). Boleh saya tahu lebih lanjut?";},
  waHello:"Hai SnapSense! Saya nak tanya tentang pakej anda.",
  qEyebrow:"Tempahan",qTitle:"Tempah dalam 4 langkah",qLead:"Isi pakej, tarikh dan maklumat anda. Jumlah dikira terus, kemudian hantar untuk sahkan tempahan.",
  steps:["Pilih pakej","Tarikh & lokasi","Add-on (pilihan)","Maklumat anda"],
  picked:function(p){return "Pakej "+p+" dipilih ✓";},
  pfMore:function(n){return "Tunjuk lagi ("+n+")";},
  bar:["Harga","Tempah","Tarikh","WhatsApp"],barTotal:"Jumlah",barSend:"Hantar tempahan"},
 en:{nav:[["harga","Packages & prices"],["sebut-harga","Book"],["tarikh","Availability"],["portfolio","Portfolio"],["kempen","Campaigns"],["soalan","FAQ"]],
  heroCta1:"See packages & prices",heroCta2:"WhatsApp us",
  finderEyebrow:"Packages & prices",finderTitle:"What do you need?",finderLead:"Pick a service to see every package and price. Open pricing, no hidden charges.",
  from:"from",nPkg:function(n){return n+(n===1?" package":" packages");},pkgsFor:"Packages",book:"Book this package",ask:"Ask on WhatsApp",
  more:function(n){return "+ "+n+" more";},less:"Show less",
  waAsk:function(p,pr){return "Hi SnapSense! I'm interested in the "+p+" package ("+pr+"). Could you tell me more?";},
  waHello:"Hi SnapSense! I'd like to ask about your packages.",
  qEyebrow:"Booking",qTitle:"Book in 4 steps",qLead:"Fill in the package, date and your details. The total is worked out as you go, then send it to confirm your booking.",
  steps:["Choose a package","Date & location","Add-ons (optional)","Your details"],
  picked:function(p){return p+" package selected ✓";},
  pfMore:function(n){return "Show more ("+n+")";},
  bar:["Prices","Book","Dates","WhatsApp"],barTotal:"Total",barSend:"Send booking"}
};
function x(k){return X[lang][k];}
var PF_STEP=12, pfShow=PF_STEP;
function L(o,f){return (lang==="en"&&o.en&&o.en[f]!=null)?o.en[f]:o[f];}

var TRAVEL_P={daerah:0,johor:150,luar:300};
var ICON = {
 instagram:'<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/></svg>',
 tiktok:'<svg viewBox="0 0 24 24"><path d="M16.6 2h-3.3v13.4a2.9 2.9 0 1 1-2-2.8V9.2a6.3 6.3 0 1 0 5.3 6.2V8.7a7.9 7.9 0 0 0 4.6 1.5V6.9a4.6 4.6 0 0 1-4.6-4.9z"/></svg>',
 facebook:'<svg viewBox="0 0 24 24"><path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z"/></svg>',
 youtube:'<svg viewBox="0 0 24 24"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.9 3-5.9 3z"/></svg>',
 whatsapp:'<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>'
};

var pf="all", priceTab="wedding", lbIndex=-1;
var now=new Date(); now.setHours(0,0,0,0);
var calY=now.getFullYear(), calM=now.getMonth();
var q={pkg:"wed-ns",qty:1,addons:{},addonQty:{jam:1,reel:1},date:"",area:"daerah",name:"",phone:"",loc:"",note:""};

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function rm(n){return "RM"+Math.round(n).toLocaleString("en-MY");}
function iso(y,m,d){return y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");}
function parseIso(s){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2]);}
function fmtDate(s){if(!s)return "";var d=parseIso(s);return t("days")[d.getDay()]+", "+d.getDate()+" "+t("months")[d.getMonth()]+" "+d.getFullYear();}
function pkgById(id){for(var i=0;i<S.packages.length;i++)if(S.packages[i].id===id)return S.packages[i];return S.packages[0];}
function waNum(){var n=String(S.whatsapp||"").replace(/\D/g,"");if(n.charAt(0)==="0")n="6"+n;return n;}
function waLink(msg){return "https://wa.me/"+waNum()+"?text="+encodeURIComponent(msg);}
function toast(x){var el=document.createElement("div");el.className="toast";el.setAttribute("role","status");el.textContent=x;document.body.appendChild(el);setTimeout(function(){el.remove();},2800);}
function logo(deco){var l=window.SS_LOGO||'<span class="logo-txt">'+esc(S.brand)+'</span>';return deco?l.replace('role="img"','aria-hidden="true" focusable="false"').replace(/ aria-label="[^"]*"/,''):l;}
function stars(n){var s="";for(var i=1;i<=5;i++)s+=i<=n?"★":"☆";return s;}
function tagline(){return lang==="en"?(S.tagline_en||S.tagline):S.tagline;}

/* ---------- sections ---------- */
function header(){
  return '<header class="top"><div class="wrap"><a class="brand" href="#atas" aria-label="'+esc(S.brand)+'">'+logo(true)+'</a>'+
  '<nav class="links" aria-label="Menu">'+x("nav").map(function(n){return '<a href="#'+n[0]+'">'+n[1]+'</a>';}).join("")+'</nav>'+
  '<div class="lang" role="group" aria-label="'+t("langLabel")+'"><button type="button" data-act="lang" data-l="ms" aria-pressed="'+(lang==="ms")+'">BM</button><button type="button" data-act="lang" data-l="en" aria-pressed="'+(lang==="en")+'">EN</button></div>'+
  '<a class="btn pri sm book" href="#sebut-harga">'+t("book")+'</a></div></header>';
}
function hero(){
  var pc=t("pcats"), want=["wedding","potret","produk"], pics=[];
  var src=(S.hero&&S.hero.length)?S.hero.map(function(h,i){return {src:h,cat:want[i]||"wedding"};}):want.map(function(c){return (S.portfolio||[]).filter(function(p){return p.cat===c;})[0];}).filter(Boolean);
  src.slice(0,3).forEach(function(p,i){pics.push([remoteReady?p.src:"",(14+i)+" ▸ "+(pc[p.cat]||"")]);});
  while(pics.length<3)pics.push(["",(14+pics.length)+" ▸ SNAPSENSE"]);
  return '<section class="hero" id="atas"><div class="wrap"><div>'+
   '<span class="mono" style="color:var(--amber-ink)">'+t("heroEyebrow")+'</span>'+
   '<h1 style="margin-top:14px">'+esc(tagline()).replace(/(scroll\.|scrolling\.)/i,'<em>$1</em>')+'</h1>'+
   '<p class="lead">'+t("heroLead")+'</p>'+
   '<div class="ctas"><a class="btn pri" href="#harga">'+x("heroCta1")+'</a>'+(waNum()?'<a class="btn" href="'+waLink(x("waHello"))+'" target="_blank" rel="noopener">'+ICON.whatsapp+x("heroCta2")+'</a>':'<a class="btn" href="#tarikh">'+t("heroCta2")+'</a>')+'</div>'+
   '<div class="facts">'+t("facts").map(function(f){return '<span><b>'+f[0]+'</b> '+f[1]+'</span>';}).join("")+'</div>'+
   '</div><div class="strip" aria-label="'+t("stripLabel")+'"><span class="edge">SNAPSENSE 400 · JHR</span>'+
   pics.map(function(p){return '<figure>'+(p[0]?'<img src="'+esc(p[0])+'" alt="" fetchpriority="high">':'<div class="ph"></div>')+'<figcaption>'+esc(p[1].toUpperCase())+'</figcaption></figure>';}).join("")+
   '</div></div></section>';
}
function marquee(){
  var c=t("cats"), words=Object.keys(c).map(function(k){return c[k];});
  var row=words.map(function(w){return '<span>'+esc(w)+'</span><i aria-hidden="true">✦</i>';}).join("");
  return '<div class="marquee" aria-hidden="true"><div class="mq-track"><div>'+row+'</div><div>'+row+'</div></div></div>';
}
function portfolioSec(){
  var pc=t("pcats");
  var shown=0, total=0;
  var items=!remoteReady?'<p class="lead">'+t("pfLoading")+'</p>':S.portfolio.map(function(p,i){
    var inCat=pf==="all"||p.cat===pf; if(inCat)total++;
    var hide=!inCat||shown>=pfShow, alt=lang==="en"&&p.alt_en?p.alt_en:p.alt;
    if(!hide)shown++;
    return '<figure class="shot" data-cat="'+p.cat+'"'+(hide?" hidden":"")+'><button type="button" data-act="lb" data-i="'+i+'" aria-label="'+t("enlarge")+': '+esc(alt)+'"><img src="'+p.src+'" alt="'+esc(alt)+'" loading="lazy" decoding="async"></button><figcaption class="mono"><span>№ '+String(i+1).padStart(2,"0")+'</span><span>'+esc(pc[p.cat])+'</span></figcaption></figure>';
  }).join("");
  return '<section id="portfolio"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+t("pfEyebrow")+'</span><h2>'+t("pfTitle")+'</h2></div>'+
  '<div class="filters" role="group" aria-label="'+t("pfGroup")+'">'+Object.keys(pc).map(function(k){return '<button type="button" class="chip" data-act="pf" data-k="'+k+'" aria-pressed="'+(pf===k)+'">'+pc[k]+'</button>';}).join("")+'</div></div>'+
  '<div class="grid">'+items+'</div>'+
  (remoteReady&&total>shown?'<p class="pf-show"><button type="button" class="btn" data-act="pfmore">'+x("pfMore")(total-shown)+'</button></p>':'')+'</div></section>';
}
function pkgCard(p){
  var u=L(p,"unit"), unit=u?'<small>/ '+esc(u)+'</small>':'';
  var priceHtml='<div class="price">'+rm(p.price)+unit+'</div>';
  var inc=L(p,"inc")||[], SHOW=4;
  var li=function(s){return '<li>'+esc(s)+'</li>';};
  var list='<ul>'+inc.slice(0,SHOW).map(li).join("")+'</ul>'+
    (inc.length>SHOW?'<details class="inc-more"><summary data-more="'+esc(x("more")(inc.length-SHOW))+'" data-less="'+esc(x("less"))+'"></summary><ul>'+inc.slice(SHOW).map(li).join("")+'</ul></details>':'');
  var wa=waNum()?'<a class="btn sm ghost wa" href="'+waLink(x("waAsk")(L(p,"name"),rm(p.price)+(u?"/"+u:"")))+'" target="_blank" rel="noopener" aria-label="'+esc(x("ask")+": "+L(p,"name"))+'">'+ICON.whatsapp+'<span>'+x("ask")+'</span></a>':'';
  return '<article class="pkg'+(p.popular?" pop":"")+'">'+(p.popular?'<span class="badge">'+t("popular")+'</span>':'')+
  '<div class="pkg-top"><h3>'+esc(L(p,"name"))+'</h3>'+priceHtml+'</div><div class="cover">'+esc(L(p,"cover"))+'</div>'+list+
  '<div class="pkg-acts"><button type="button" class="btn pri sm" data-act="pick" data-id="'+p.id+'">'+x("book")+'</button>'+wa+'</div></article>';
}
function catInfo(k){
  var ps=S.packages.filter(function(p){return p.cat===k;});
  var min=ps.reduce(function(m,p){return Math.min(m,p.price);},Infinity);
  var minP=ps.filter(function(p){return p.price===min;})[0];
  var u=minP?L(minP,"unit"):"";
  return {n:ps.length,min:min,u:u};
}
function funnelHtml(){
  var V=t("fStages"), vids=[12,10,8], posters=[10,12,8], w=["100%","82%","64%"];
  var stages=V.map(function(v,i){return '<div class="stage"><div class="bar" style="--w:'+w[i]+'"><b>'+v[0]+'</b><span>'+vids[i]+' '+t("video")+' · '+posters[i]+' '+t("poster")+'</span></div><div class="pills">'+v[2].map(function(x){return '<span>'+x[0]+'<em>×'+x[1]+'</em></span>';}).join("")+'</div></div>';}).join("");
  return '<div class="funnel"><div class="fbox"><h3>'+t("fTitle1")+'</h3><p class="sub">'+t("fSub1")+'</p>'+stages+'<p class="sub">'+t("fPosters")+'</p></div>'+
   '<div class="fbox"><h3>'+t("fTitle2")+'</h3><ol class="flow">'+t("fFlow").map(function(f){return '<li><span><b>'+f[0]+'</b>'+f[1]+'</span></li>';}).join("")+'</ol>'+
   '<div class="promise">'+t("fPromise").map(function(f){return '<span><b>'+f[0]+'</b> '+f[1]+'</span>';}).join("")+'</div></div></div>';
}
function pricingSec(){
  var cats=t("cats"), keys=Object.keys(cats).filter(function(k){return catInfo(k).n;});
  if(keys.indexOf(priceTab)<0)priceTab=keys[0];
  var finder=keys.map(function(k){var c=catInfo(k);
    return '<button type="button" class="cat" data-act="tab" data-k="'+k+'" aria-pressed="'+(priceTab===k)+'">'+
      '<b>'+esc(cats[k])+'</b><span class="cat-from">'+x("from")+' <strong>'+rm(c.min)+'</strong>'+(c.u?'<small>/'+esc(c.u)+'</small>':'')+'</span><span class="cat-n">'+x("nPkg")(c.n)+'</span></button>';}).join("");
  var groups=keys.map(function(k){
    return '<div data-group="'+k+'"'+(priceTab===k?"":" hidden")+'><div class="pkgs">'+S.packages.filter(function(p){return p.cat===k;}).map(pkgCard).join("")+'</div>'+(k==="content"?funnelHtml():"")+'</div>';
  }).join("");
  var add='<div class="addons"><span class="mono" style="color:var(--amber-ink)">'+t("addonLbl")+'</span>'+S.addons.map(function(a){var u=L(a,"unit");return '<span>'+esc(L(a,"name"))+' <b>'+rm(a.price)+(u?"/"+esc(u):"")+'</b></span>';}).join("")+'</div>';
  return '<section id="harga"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+x("finderEyebrow")+'</span><h2>'+x("finderTitle")+'</h2></div>'+
  '<p class="lead">'+x("finderLead")+'</p></div>'+
  '<div class="finder" role="group" aria-label="'+t("pkgGroup")+'">'+finder+'</div>'+
  '<div class="pkg-area" id="pakej">'+groups+add+
  '<p class="price-note">'+t("priceLead")+'</p></div></div></section>';
}
function calcQuote(){
  var p=pkgById(q.pkg), min=p.min||1, qty=p.unit?Math.max(min,+q.qty||min):1, u=L(p,"unit");
  var pu=(lang==="en"&&qty>1)?({month:"months",hour:"hours",person:"people",reel:"reels"}[u]||u):u;
  var base=p.price*qty, lines=[[L(p,"name")+(p.unit?" × "+qty+" "+pu:""),base]];
  var disc=0, discName="", addTotal=0;
  S.addons.forEach(function(a){ if(q.addons[a.id]){ var n=a.unit?Math.max(1,+q.addonQty[a.id]||1):1; lines.push([L(a,"name")+(a.unit?" × "+n:""),a.price*n]); addTotal+=a.price*n; } });
  var tp=TRAVEL_P[q.area]||0; if(tp) lines.push([t("rTravel")+": "+t("travel")[q.area],tp]);
  var warn="";
  if(q.date){
    var dd=parseIso(q.date), dow=dd.getDay(), m=dd.getMonth(), peak=(m===5||m===10||m===11);
    var days=Math.round((dd-now)/864e5);
    if(days<0) warn=t("wPast");
    var st=S.dates[q.date];
    if(st==="penuh") warn=t("wFull"); else if(st==="hampir") warn=t("wAlmost");
    if(p.cat==="content"){}
    else if(p.cat==="wedding"&&days>=183){disc=Math.round(base*.15);discName=t("dEarly");}
    else if(dow>=1&&dow<=4&&!peak){disc=Math.round(base*.10);discName=t("dWeek");}
  }
  if(p.cat==="content"&&qty>=3){disc=Math.round(base*.10);discName=t("dCommit")(qty);}
  if(disc) lines.push([discName,-disc]);
  var total=base-disc+addTotal+tp;
  return {p:p,qty:qty,lines:lines,total:total,dep:Math.round(total*.3),warn:warn};
}
function quoteText(c){
  var x=t("waHi")(S.brand)+"\n\n";
  c.lines.forEach(function(l){x+="• "+l[0]+": "+(l[1]<0?"-":"")+rm(Math.abs(l[1]))+"\n";});
  x+="\n"+t("waTotal")+": "+rm(c.total)+"\n"+t("waDep")+": "+rm(c.dep)+"\n";
  x+=t("waDate")+": "+(q.date?fmtDate(q.date):t("waTbd"))+"\n";
  if(q.loc)x+=t("waLoc")+": "+q.loc+"\n";
  if(q.name)x+=t("waName")+": "+q.name+"\n";
  if(q.phone)x+=t("waPhone")+": "+q.phone+"\n";
  if(q.note)x+=t("waNote")+": "+q.note+"\n";
  return x;
}
function receiptHtml(){
  if(booking.state==="done")return doneHtml();
  var c=calcQuote(), wa=waNum(), text=quoteText(c);
  var link=wa?"https://wa.me/"+wa+"?text="+encodeURIComponent(text):"";
  return '<h3>'+t("rTitle")+'</h3><div class="mono" style="color:#9AA59F;margin:6px 0 12px">'+(q.date?esc(fmtDate(q.date)):t("rNoDate"))+'</div>'+
   c.lines.map(function(l){return '<div class="row'+(l[1]<0?" disc":"")+'"><span>'+esc(l[0])+'</span><span>'+(l[1]<0?"−":"")+rm(Math.abs(l[1]))+'</span></div>';}).join("")+
   '<div class="total"><span>'+t("rTotal")+'</span><b>'+rm(c.total)+'</b></div><div class="dep">'+t("rDep")+' <b>'+rm(c.dep)+'</b></div>'+
   (c.warn?'<div class="warn" role="alert">'+esc(c.warn)+'</div>':'')+
   (booking.err?'<div class="warn" role="alert">'+esc(booking.err)+'</div>':'')+
   '<div class="acts">'+(API?'<button class="btn pri" type="button" data-act="book"'+(booking.state==="sending"?" disabled":"")+'>'+(booking.state==="sending"?t("rSending"):t("rBook"))+'</button>'+(link?'<a class="btn" href="'+link+'" target="_blank" rel="noopener">'+t("rAsk")+'</a>':''):
     (link?'<a class="btn pri" href="'+link+'" target="_blank" rel="noopener">'+t("rWa")+'</a>':'<button class="btn pri" type="button" disabled>'+t("rWaNone")+'</button>'))+
   '<button class="btn" type="button" data-act="copy">'+t("rCopy")+'</button></div>'+
   '<textarea class="copybox" id="copybox" readonly hidden aria-label="'+t("rCopyLbl")+'">'+esc(text)+'</textarea>'+
   '<p class="note">'+t("rNote")+'</p>';
}
function doneHtml(){
  var wa=waNum(), msg=t("waRef")(booking.id)+"\n\n"+quoteText(calcQuote());
  return '<h3>'+t("okTitle")+'</h3><div class="mono" style="color:var(--film-ink);margin:8px 0 14px;font-size:14px">ID '+esc(booking.id)+'</div>'+
   '<p style="font-size:15px;color:#E8ECE9">'+t("okText")+'</p>'+
   '<div class="acts">'+(wa?'<a class="btn pri" href="https://wa.me/'+wa+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener">'+t("okWa")+'</a>':'')+
   '<button class="btn" type="button" data-act="newbook">'+t("okNew")+'</button></div>';
}
function submitBooking(){
  if(booking.state==="sending")return;
  var p=pkgById(q.pkg), c=calcQuote(), digits=String(q.phone||"").replace(/\D/g,"");
  var err=!String(q.name||"").trim()?t("eName"):(digits.length<9?t("ePhone"):(!q.date?t("eDate"):(S.dates[q.date]==="penuh"?t("wFull"):"")));
  if(err){booking.err=err;updReceipt();return;}
  var hp=document.getElementById("q-web");
  var addons=S.addons.filter(function(a){return q.addons[a.id];}).map(function(a){return L(a,"name")+(a.unit?" × "+Math.max(1,+q.addonQty[a.id]||1):"");}).join(", ");
  var payload={action:"book",website:hp?hp.value:"",name:q.name,phone:q.phone,date:q.date,pkg:p.id,pkgName:p.name,cat:p.cat,qty:c.qty,
    area:t("travel")[q.area],loc:q.loc,addons:addons,total:c.total,dep:c.dep,note:q.note,lang:lang};
  booking={state:"sending",id:"",err:""};updReceipt();
  fetch(API,{method:"POST",body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(res){
    if(res&&res.ok){booking={state:"done",id:res.id,err:""};updReceipt();loadRemote();}
    else{var map={full:"wFull",rate:"eRate",phone:"ePhone",name:"eName",date:"eDate",date_past:"wPast"};booking={state:"idle",id:"",err:t(map[res&&res.error]||"eNet")};updReceipt();}
  },function(){booking={state:"idle",id:"",err:t("eNet")};updReceipt();});
}
function loadRemote(){
  if(!API)return;
  fetch(API+(API.indexOf("?")>-1?"&":"?")+"action=data").then(function(r){return r.json();}).then(function(res){
    if(!res||!res.ok)return;
    if(res.data)S=Object.assign({},BUNDLED,window.SS_MERGE(res.data,BUNDLED));
    S.dates=res.dates||S.dates||{};remoteReady=true;
    var y=window.scrollY;render();window.scrollTo(0,y);
  },function(){remoteReady=true;render();});
}
function quoteSec(){
  var p=pkgById(q.pkg), cats=t("cats"), u=L(p,"unit");
  var opts=Object.keys(cats).map(function(k){return '<optgroup label="'+cats[k]+'">'+S.packages.filter(function(x){return x.cat===k;}).map(function(x){var xu=L(x,"unit");return '<option value="'+x.id+'"'+(x.id===q.pkg?" selected":"")+'>'+esc(L(x,"name"))+" — "+rm(x.price)+(xu?"/"+esc(xu):"")+'</option>';}).join("")+'</optgroup>';}).join("");
  var qtyField=p.unit?'<div class="f"><label for="q-qty">'+t("qQty")+' '+esc(u)+'</label><input id="q-qty" type="number" min="'+(p.min||1)+'" value="'+Math.max(p.min||1,+q.qty||1)+'" data-q="qty"><span class="hint">'+(p.cat==="content"?t("qCommit"):t("qMin")+" "+(p.min||1)+" "+esc(u))+'</span></div>':'';
  var addons=S.addons.map(function(a){var au=L(a,"unit");return '<label class="check"><input type="checkbox" id="ad-'+a.id+'" data-addon="'+a.id+'"'+(q.addons[a.id]?" checked":"")+'><span>'+esc(L(a,"name"))+(a.unit?' <small class="p">'+rm(a.price)+'/'+esc(au)+'</small>':'')+'</span>'+(a.unit?'<input class="qty" type="number" min="1" id="adq-'+a.id+'" data-addonqty="'+a.id+'" value="'+(q.addonQty[a.id]||1)+'" aria-label="'+t("qQty")+' '+esc(au)+'">':'<span class="p">'+rm(a.price)+'</span>')+'</label>';}).join("");
  var tr=t("travel");
  var areas=Object.keys(TRAVEL_P).map(function(k){return '<option value="'+k+'"'+(q.area===k?" selected":"")+'>'+tr[k]+(TRAVEL_P[k]?" (+"+rm(TRAVEL_P[k])+")":"")+'</option>';}).join("");
  var ST=x("steps"), step=function(n,body,extra){return '<fieldset class="step'+(extra||"")+'"><legend><i>'+n+'</i>'+ST[n-1]+'</legend><div class="fields">'+body+'</div></fieldset>';};
  var nAdd=S.addons.filter(function(a){return q.addons[a.id];}).length;
  return '<section id="sebut-harga"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+x("qEyebrow")+'</span><h2>'+x("qTitle")+'</h2></div><p class="lead">'+x("qLead")+'</p></div>'+
  '<div class="quote"><form class="panel" id="qform" novalidate>'+
  step(1,'<div class="f full"><label for="q-pkg">'+t("qPkg")+'</label><select id="q-pkg" data-q="pkg">'+opts+'</select></div>'+qtyField)+
  step(2,'<div class="f"><label for="q-date">'+(p.cat==="content"?t("qStart"):t("qDate"))+'</label><input id="q-date" type="date" lang="'+(lang==="en"?"en-MY":"ms-MY")+'" min="'+iso(now.getFullYear(),now.getMonth(),now.getDate())+'" value="'+esc(q.date)+'" data-q="date"><span class="hint">'+t("qDateHint")+'</span></div>'+
    '<div class="f"><label for="q-area">'+t("qArea")+'</label><select id="q-area" data-q="area">'+areas+'</select></div>'+
    '<div class="f full"><label for="q-loc">'+t("qLoc")+'</label><input id="q-loc" value="'+esc(q.loc)+'" data-q="loc" placeholder="'+t("qLocPh")+'"></div>')+
  '<details class="step-add"'+(nAdd?" open":"")+'><summary><i>3</i>'+ST[2]+(nAdd?' <b class="n">'+nAdd+'</b>':'')+'</summary><div class="checks">'+addons+'</div></details>'+
  step(4,'<div class="f"><label for="q-name">'+t("qName")+'</label><input id="q-name" autocomplete="name" value="'+esc(q.name)+'" data-q="name" placeholder="'+t("qNamePh")+'"></div>'+
    '<div class="f"><label for="q-phone">'+t("qPhone")+'</label><input id="q-phone" type="tel" autocomplete="tel" value="'+esc(q.phone)+'" data-q="phone" placeholder="012-345 6789"></div>'+
    '<div class="hp" aria-hidden="true"><label for="q-web">Website</label><input id="q-web" name="website" tabindex="-1" autocomplete="off"></div>'+
    '<div class="f full"><label for="q-note">'+t("qNote")+'</label><textarea id="q-note" data-q="note" placeholder="'+t("qNotePh")+'">'+esc(q.note)+'</textarea></div>')+
  '</form><aside class="receipt" id="receipt" aria-live="polite">'+receiptHtml()+'</aside></div></div></section>';
}
function monthHtml(y,m){
  var first=new Date(y,m,1), lead=(first.getDay()+6)%7, dim=new Date(y,m+1,0).getDate(), ST=t("status"), MO=t("months");
  var cells=t("dows").map(function(h){return '<div class="dow">'+h+'</div>';}).join("");
  for(var i=0;i<lead;i++)cells+='<div></div>';
  for(var dd=1;dd<=dim;dd++){
    var k=iso(y,m,dd), dt=new Date(y,m,dd), past=dt<now, st=S.dates[k]||"kosong";
    var cls="day "+(past?"past":st)+(q.date===k?" sel":"");
    cells+='<button type="button" class="'+cls+'" data-act="day" data-d="'+k+'"'+(past?" disabled":"")+' aria-label="'+dd+" "+MO[m]+": "+(past?t("past"):ST[st])+'">'+dd+'</button>';
  }
  return '<div class="month"><h3>'+MO[m]+' '+y+'</h3><div class="days">'+cells+'</div></div>';
}
function calSec(){
  var y2=calM===11?calY+1:calY, m2=(calM+1)%12, ST=t("status");
  var atStart=(calY===now.getFullYear()&&calM===now.getMonth());
  return '<section id="tarikh"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+t("calEyebrow")+'</span><h2>'+t("calTitle")+'</h2></div>'+
  '<div class="cal-nav"><button type="button" class="btn sm" data-act="cal" data-dir="-1"'+(atStart?" disabled":"")+' aria-label="'+t("calPrev")+'">←</button><button type="button" class="btn sm" data-act="cal" data-dir="1" aria-label="'+t("calNext")+'">→</button></div></div>'+
  '<p class="lead" style="margin-bottom:16px">'+t("calLead")+'</p>'+
  '<div class="months">'+monthHtml(calY,calM)+monthHtml(y2,m2)+'</div>'+
  '<div class="legend"><span><i style="background:var(--ok)"></i>'+ST.kosong+'</span><span><i style="background:var(--warn)"></i>'+ST.hampir+'</span><span><i style="background:var(--full)"></i>'+ST.penuh+'</span></div></div></section>';
}
function reviewSec(){
  var list=S.reviews.length?'<div class="revs">'+S.reviews.map(function(r,i){
    return '<article class="rev"><div class="stars" aria-label="'+r.rating+' '+t("revOf")+'">'+stars(r.rating)+'</div><p>“'+esc(r.text)+'”</p><div class="who"><b>'+esc(r.name)+'</b><span>'+esc(r.service)+'</span></div>'+'</article>';
  }).join("")+'</div>':'<div class="empty"><h3>'+t("revEmptyT")+'</h3><p class="lead">'+t("revEmptyP")+'</p>'+(waNum()?'<a class="btn sm" style="justify-self:start" target="_blank" rel="noopener" href="https://wa.me/'+waNum()+'?text='+encodeURIComponent(t("revWa")(S.brand))+'">'+t("revSend")+'</a>':'')+'</div>';

  return '<section id="review"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+t("revEyebrow")+'</span><h2>'+t("revTitle")+'</h2></div></div>'+list+'</div></section>';
}
function processSec(){
  return '<section id="proses"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+t("prEyebrow")+'</span><h2>'+t("prTitle")+'</h2></div></div>'+
  '<ol class="steps">'+t("steps").map(function(s){return '<li><b>'+s[0]+'</b><span>'+s[1]+'</span></li>';}).join("")+'</ol></div></section>';
}
function faqSec(){
  return '<section id="soalan"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+t("faqEyebrow")+'</span><h2>'+t("faqTitle")+'</h2></div></div><div class="faq">'+
  t("faq").map(function(x){return '<details><summary>'+x[0]+'</summary><p>'+x[1]+'</p></details>';}).join("")+'</div></div></section>';
}
function footer(){
  var wa=waNum();
  var soc=[["instagram","Instagram"],["tiktok","TikTok"],["facebook","Facebook"],["youtube","YouTube"]].filter(function(s){return /^https:\/\//.test(S.social[s[0]]||"");})
   .map(function(s){return '<a href="'+esc(S.social[s[0]])+'" target="_blank" rel="noopener">'+ICON[s[0]]+s[1]+'</a>';}).join("");
  if(wa) soc='<a href="https://wa.me/'+wa+'" target="_blank" rel="noopener">'+ICON.whatsapp+'WhatsApp '+esc(S.whatsapp)+'</a>'+soc;
  return '<footer id="hubungi"><div class="wrap"><div><h2>'+t("ftTitle")+'</h2><p class="lead">'+t("ftLead")+'</p>'+
  (soc?'<div class="socials">'+soc+'</div>':'<p class="lead" style="margin-top:18px">'+t("ftNoSoc")+'</p>')+'</div>'+
  '<div class="area"><span class="mono" style="color:var(--film-ink)">'+t("ftArea")+'</span><p style="margin-top:12px">'+t("ftAreaP")+'</p><p style="margin-top:10px">'+t("ftAreaP2")+'</p></div>'+
  '<div class="ft-logo">'+logo(true)+'</div>'+
  '<div class="fine"><span>© '+now.getFullYear()+' '+esc(S.brand)+' · '+t("ftFine")+'</span>'+'</div></div></footer>';
}
function lightbox(){
  if(lbIndex<0)return "";
  var p=S.portfolio[lbIndex], alt=lang==="en"&&p.alt_en?p.alt_en:p.alt;
  return '<div class="lb" role="dialog" aria-modal="true" aria-label="'+t("lbLabel")+'"><button type="button" data-act="lbprev" aria-label="'+t("lbPrev")+'">‹</button><img src="'+p.src+'" alt="'+esc(alt)+'"><button type="button" data-act="lbnext" aria-label="'+t("lbNext")+'">›</button><button type="button" class="close" data-act="lbclose">'+t("lbClose")+'</button><div class="cap mono">№ '+String(lbIndex+1).padStart(2,"0")+' · '+esc(t("pcats")[p.cat])+'</div></div>';
}

function render(){
  document.documentElement.lang=lang==="en"?"en":"ms";
  app.innerHTML=header()+'<main>'+hero()+pricingSec()+quoteSec()+calSec()+portfolioSec()+processSec()+faqSec()+reviewSec()+'</main>'+footer()+mbar()+'<div id="lbw">'+lightbox()+'</div>';
  reveal(); watchBar();
}
/* Bar bawah telefon: pintasan ke harga, tempah, tarikh dan WhatsApp; di bahagian tempahan ia tunjuk jumlah + butang hantar. */
function mbar(){
  var B=x("bar"), c=calcQuote(), wa=waNum();
  return '<nav class="mbar" id="mbar" aria-label="'+(lang==="en"?"Quick links":"Pintasan")+'">'+
   '<div class="mb-links"><a href="#harga"><span class="ico">RM</span>'+B[0]+'</a><a href="#sebut-harga" class="mb-book"><span class="ico">✓</span>'+B[1]+'</a><a href="#tarikh"><span class="ico">▦</span>'+B[2]+'</a>'+
   (wa?'<a href="'+waLink(x("waHello"))+'" target="_blank" rel="noopener" class="mb-wa">'+ICON.whatsapp+B[3]+'</a>':'')+'</div>'+
   '<div class="mb-total"><span><small>'+x("barTotal")+'</small><b id="mb-sum">'+rm(c.total)+'</b></span><a class="btn pri sm" href="#receipt">'+x("barSend")+' ↓</a></div></nav>';
}
var barIO=null;
function watchBar(){
  if(barIO){barIO.disconnect();barIO=null;}
  var sec=document.getElementById("sebut-harga"), bar=document.getElementById("mbar"); if(!sec||!bar||!("IntersectionObserver" in window))return;
  barIO=new IntersectionObserver(function(es){es.forEach(function(e){bar.classList.toggle("in-quote",e.isIntersecting);});},{rootMargin:"-30% 0px -40% 0px"});
  barIO.observe(sec);
}
function swap(id,html){var el=document.getElementById(id);if(el)el.outerHTML=html;reveal();if(id==="sebut-harga"){watchBar();var m=document.getElementById("mb-sum");if(m)m.textContent=rm(calcQuote().total);}}

/* ---------- animasi ---------- */
var MOTION=!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)&&"IntersectionObserver" in window;
var seen={}, io=MOTION?new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target;el.classList.add("in");seen[el.dataset.rv]=1;io.unobserve(el);setTimeout(function(){el.classList.remove("rv");el.style.removeProperty("--d");},1300);});},{rootMargin:"0px 0px -8% 0px",threshold:.08}):null;
var RV=[".sec-head",".filters",".shot",".tabs",".cat",".pkg",".addons",".fbox",".quote .panel",".receipt",".month",".legend",".rev",".empty",".steps li",".faq details","footer .wrap > div:not(.fine)"];
function reveal(){
  if(!MOTION)return;
  document.querySelectorAll("main section, footer").forEach(function(sec){
    var id=sec.id||sec.tagName, n=0;
    sec.querySelectorAll(RV.join(",")).forEach(function(el){
      if(el.dataset.rv)return;
      var key=id+":"+(n++); el.dataset.rv=key;
      if(seen[key])return;
      el.classList.add("rv");
      el.style.setProperty("--d",Math.min((n-1)%6,5)*70+"ms"); io.observe(el);
    });
  });
}
function intro(){
  var first=true; try{first=!sessionStorage.getItem("ss-intro");sessionStorage.setItem("ss-intro","1");}catch(e){}
  var root=document.documentElement;
  if(!MOTION||!first){root.classList.add("hero-go");setTimeout(function(){root.classList.remove("hero-go");},2200);return;}
  var ov=document.createElement("div"); ov.className="intro"; ov.setAttribute("aria-hidden","true");
  ov.innerHTML='<div class="intro-in">'+logo(true)+'<span class="intro-bar"></span></div>';
  document.body.appendChild(ov);
  var done=false; function end(){if(done)return;done=true;ov.classList.add("out");root.classList.add("hero-go");setTimeout(function(){ov.remove();},800);setTimeout(function(){root.classList.remove("hero-go");},3000);}
  ov.addEventListener("click",end); setTimeout(end,2300);
}
function updReceipt(){var r=document.getElementById("receipt");if(r)r.innerHTML=receiptHtml();var m=document.getElementById("mb-sum");if(m)m.textContent=rm(calcQuote().total);}
function closeLb(){lbIndex=-1;document.getElementById("lbw").innerHTML="";}
function stepLb(dir){var vis=S.portfolio.map(function(p,i){return i;}).filter(function(i){return pf==="all"||S.portfolio[i].cat===pf;});var pos=vis.indexOf(lbIndex);lbIndex=vis[(pos+dir+vis.length)%vis.length];document.getElementById("lbw").innerHTML=lightbox();}

/* ---------- interaksi ---------- */
app.addEventListener("click",function(e){
  var el=e.target.closest("[data-act]"); if(!el)return;
  var a=el.dataset.act;
  if(a==="lang"){var nl=el.dataset.l; if(nl!==lang){var y=window.scrollY; lang=nl; try{localStorage.setItem("ss-lang",lang);}catch(err){} render(); window.scrollTo(0,y);}}
  else if(a==="pf"){pf=el.dataset.k;pfShow=PF_STEP;swap("portfolio",portfolioSec());}
  else if(a==="tab"){priceTab=el.dataset.k;document.querySelectorAll('[data-act="tab"]').forEach(function(b){b.setAttribute("aria-pressed",b.dataset.k===priceTab);});
    document.querySelectorAll("[data-group]").forEach(function(g){g.hidden=g.dataset.group!==priceTab;});
    if(el.classList.contains("cat")){var pa=document.getElementById("pakej"),fd=el.parentNode;
      if(fd&&fd.scrollWidth>fd.clientWidth)el.scrollIntoView({block:"nearest",inline:"center"});
      if(pa&&window.innerWidth<=760&&pa.getBoundingClientRect().top>window.innerHeight*.6)pa.scrollIntoView();}}
  else if(a==="pick"){var p=pkgById(el.dataset.id);q.pkg=p.id;q.qty=p.min||1;booking.err="";swap("sebut-harga",quoteSec());toast(x("picked")(L(p,"name")));document.getElementById("sebut-harga").scrollIntoView();}
  else if(a==="pfmore"){pfShow+=PF_STEP;swap("portfolio",portfolioSec());}
  else if(a==="lb"){lbIndex=+el.dataset.i;document.getElementById("lbw").innerHTML=lightbox();}
  else if(a==="lbclose"){closeLb();}
  else if(a==="lbprev"||a==="lbnext"){stepLb(a==="lbnext"?1:-1);}
  else if(a==="cal"){calM+=+el.dataset.dir;if(calM<0){calM=11;calY--;}if(calM>11){calM=0;calY++;}swap("tarikh",calSec());}
  else if(a==="day"){var k=el.dataset.d;
    if(S.dates[k]!=="penuh"){q.date=k;swap("tarikh",calSec());swap("sebut-harga",quoteSec());toast(t("toastDate")(fmtDate(k)));document.getElementById("sebut-harga").scrollIntoView();}
    else toast(t("toastFull"));}
  else if(a==="book"){submitBooking();}
  else if(a==="newbook"){booking={state:"idle",id:"",err:""};q.date="";q.note="";swap("sebut-harga",quoteSec());swap("tarikh",calSec());}
  else if(a==="copy"){var c=calcQuote(),txt=quoteText(c),box=document.getElementById("copybox");
    var fallback=function(){box.hidden=false;box.focus();box.select();toast(t("toastSelect"));};
    try{navigator.clipboard.writeText(txt).then(function(){toast(t("toastCopied"));},fallback);}catch(err){fallback();}}
});
document.addEventListener("keydown",function(e){if(lbIndex<0)return;if(e.key==="Escape")closeLb();else if(e.key==="ArrowRight")stepLb(1);else if(e.key==="ArrowLeft")stepLb(-1);});

app.addEventListener("input",function(e){
  var el=e.target;
  if(el.dataset.q){var k=el.dataset.q;q[k]=el.value;
    if(k==="pkg"){var p=pkgById(q.pkg);q.qty=p.min||1;swap("sebut-harga",quoteSec());document.getElementById("q-pkg").focus();return;}
    if(k==="date"){swap("tarikh",calSec());}
    booking.err="";updReceipt();}
  else if(el.dataset.addon){q.addons[el.dataset.addon]=el.checked;updReceipt();
    var sm=document.querySelector(".step-add summary"),n=S.addons.filter(function(a){return q.addons[a.id];}).length;
    if(sm){var b=sm.querySelector(".n");if(!n){if(b)b.remove();}else{if(!b){b=document.createElement("b");b.className="n";sm.appendChild(b);}b.textContent=n;}}}
  else if(el.dataset.addonqty){q.addonQty[el.dataset.addonqty]=Math.max(1,+el.value||1);updReceipt();}
});
intro();
render();

loadRemote();
})();
