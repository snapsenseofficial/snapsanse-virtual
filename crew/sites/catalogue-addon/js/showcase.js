/* Bahagian Hasil, Kempen dan Content Creator untuk catalogue SnapSense.
   Disisip sebelum #portfolio selepas app.js melukis laman (dan setiap kali ia melukis semula, contohnya tukar bahasa).
   Semua angka dan video diambil daripada portfolio pemilik (snapsenseportfolio.netlify.app). */
(function(){
var PF="https://snapsenseportfolio.netlify.app/";
var HOST={
  m3:"https://brilliant-naiad-af768e.netlify.app/",
  CAR:"https://sparkly-mousse-1e5c79.netlify.app/", INSPIRA:"https://sparkly-mousse-1e5c79.netlify.app/",
  MYVI:"https://fanciful-biscotti-439240.netlify.app/", PLESTIK:"https://fanciful-biscotti-439240.netlify.app/",
  TGBM3:"https://funny-empanada-0b53b0.netlify.app/", TEASER:"https://funny-empanada-0b53b0.netlify.app/", TTM1:"https://funny-empanada-0b53b0.netlify.app/",
  TTH2:"https://friendly-marzipan-ca3b70.netlify.app/", TTM2:"https://friendly-marzipan-ca3b70.netlify.app/", CARA:"https://friendly-marzipan-ca3b70.netlify.app/",
  TTM3:"https://lively-tulumba-699e25.netlify.app/", TTH1:"https://lively-tulumba-699e25.netlify.app/", TTH3:"https://lively-tulumba-699e25.netlify.app/",
  VIOS:"https://incandescent-moonbeam-7c8d0e.netlify.app/"
};
var T={
  ms:{
    navCamp:"Kempen",
    resEyebrow:"Hasil", resTitle:"Angka dari kempen sebenar",
    resLead:"Kami bukan sekadar ambil gambar. Kami rancang strategi, hasilkan content dan ukur hasilnya.",
    campEyebrow:"Kempen", campTitle:"Kempen yang kami jalankan",
    role:"Peranan", period:"Tempoh", budget:"Bajet",
    problem:"Cabaran", strategy:"Strategi", result:"Hasil",
    films:"Filem kempen", social:"Video media sosial",
    ccEyebrow:"Content Creator", ccTitle:"Content yang buat orang berhenti scroll",
    ccLead:"TikTok kami naik dari 500 ke 187 ribu pengikut dalam 3 bulan, dengan content yang dirancang, dirakam dan disunting sendiri. Cara yang sama kami guna untuk jenama anda.",
    reels:"Reel & short content", ccCta:"Lihat pakej Content Creator", play:"Main video",
    skills:["Strategi jenama","Storytelling","Meta & Google Ads","Suntingan video","Pengurusan kempen","Kalendar content"]
  },
  en:{
    navCamp:"Campaigns",
    resEyebrow:"Results", resTitle:"Numbers from real campaigns",
    resLead:"We don't just take photos. We plan the strategy, produce the content and measure the results.",
    campEyebrow:"Campaigns", campTitle:"Campaigns we've run",
    role:"Role", period:"Period", budget:"Budget",
    problem:"Challenge", strategy:"Strategy", result:"Results",
    films:"Campaign films", social:"Social media videos",
    ccEyebrow:"Content Creator", ccTitle:"Content that stops the scroll",
    ccLead:"Our TikTok grew from 500 to 187K followers in 3 months, with content we planned, shot and edited ourselves. We use the same approach for your brand.",
    reels:"Reels & short content", ccCta:"See Content Creator packages", play:"Play video",
    skills:["Brand strategy","Storytelling","Meta & Google Ads","Video editing","Campaign management","Content calendars"]
  }
};
var STATS=[
  {n:"187K", ms:"pengikut TikTok, dari 500 dalam 3 bulan", en:"TikTok followers, up from 500 in 3 months"},
  {n:"5.2J", en_n:"5.2M", ms:"tontonan video", en:"video views"},
  {n:"9.5%", ms:"kadar penglibatan", en:"engagement rate"},
  {n:"4J", en_n:"4M", ms:"jangkauan kempen Masdora", en:"Masdora campaign reach"},
  {n:"3,500", ms:"leads dijana untuk Masdora", en:"leads generated for Masdora"},
  {n:"+40%", ms:"jualan Masdora", en:"Masdora sales growth"},
  {n:"20K", ms:"botol Haos Ek? terjual dalam 3 bulan", en:"Haos Ek? bottles sold in 3 months"}
];
var CAMPS=[
  {brand:"Masdora Jewellery", name:{ms:"Amira Series Collection",en:"Amira Series Collection"},
   tag:{ms:"Marketing + Videografi",en:"Marketing + Videography"},
   role:{ms:"Project Manager",en:"Project Manager"}, period:{ms:"Jan – Jul 2026",en:"Jan – Jul 2026"}, budget:"RM100,000",
   problem:{ms:"Bajet dan masa yang terhad untuk pelancaran koleksi baharu.",en:"A limited budget and timeline for a new collection launch."},
   strategy:{ms:"Bina jenama dan naikkan jualan serentak melalui media sosial dan marketplace, disokong filem kempen dan content TikTok yang bercerita.",en:"Build the brand and grow sales at the same time through social media and marketplaces, backed by campaign films and story-led TikTok content."},
   results:[{n:"4J",en_n:"4M",ms:"jangkauan",en:"reach"},{n:"3,500",ms:"leads",en:"leads"},{n:"+40%",ms:"jualan",en:"sales"}],
   yt:[{id:"0tuCKVUMFAQ",t:"Kenangan Tidak Ternilai",s:"Masdora Raya 2026"},{id:"0_pnF8EKt4A",t:"Serumpun Kasih",s:"Masdora Jewellery"}],
   tt:[{f:"tt-masdora-1",h:"TTM1",ms:"Live bersama Amira Othman",en:"Live with Amira Othman"},{f:"tt-masdora-2",h:"TTM2",ms:"Koleksi Amira",en:"Amira Collection"},{f:"tt-masdora-3",h:"TTM3",ms:"Terima kasih semua",en:"Thank you, everyone"}]},
  {brand:"Haos Ek?", name:{ms:"Tekan, Goncang, Buka & Menang",en:"Press, Shake, Open & Win"},
   tag:{ms:"Marketing + Videografi",en:"Marketing + Videography"},
   role:{ms:"Asst. Project Manager",en:"Asst. Project Manager"}, period:{ms:"2023 – 2024",en:"2023 – 2024"}, budget:"RM50,000",
   problem:{ms:"Jenama yang belum dikenali dalam niche yang kecil.",en:"An unknown brand in a small niche."},
   strategy:{ms:"Cari audiens yang tepat, kemudian guna media sosial dan filem jenama untuk bawa Haos Ek? dari lokal ke global.",en:"Find the right audience, then use social media and brand films to take Haos Ek? from local to global."},
   results:[{n:"20K",ms:"botol terjual",en:"bottles sold"},{n:"3",ms:"bulan kempen",en:"campaign months"},{n:"3",ms:"filem jenama",en:"brand films"}],
   yt:[{id:"wzuYPeVcbBI",t:"This Isn't Just A Dream",s:"From Local To Global"},{id:"_8zWA9dj6FY",t:"Merdeka Film",s:"Haos Ek?"},{id:"e00DXlIkGws",t:"Cerita Raya 2024",s:"Haos Ek?"}],
   tt:[{f:"tt-haos-1",h:"TTH1",ms:"POV menang RM1,000",en:"POV: winning RM1,000"},{f:"tt-haos-2",h:"TTH2",ms:"Program Madani Zon Selatan",en:"Madani Programme, South Zone"},{f:"tt-haos-3",h:"TTH3",ms:"Menang sehingga RM50,000",en:"Win up to RM50,000"}]}
];
var REELS=[
  {f:"reel-vios-jerung",h:"VIOS",t:"Vios Jerung",s:"Reel"},
  {f:"reel-myvi-av",h:"MYVI",t:"Myvi AV",s:"Reel"},
  {f:"reel-inspira",h:"INSPIRA",t:"Inspira 2.0",s:"Reel"},
  {f:"reel-plestik-lajen",h:"PLESTIK",t:"Plestik Lajen",s:"Reel"},
  {f:"reel-tgbm-3",h:"TGBM3",t:"TGBM",s:"Reel"},
  {f:"short-cara-penggunaan",h:"CARA",t:{ms:"Cara Penggunaan",en:"How to Use"},s:{ms:"Video produk",en:"Product explainer"}}
];
var PLAY='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5v13l11-6.5z"/></svg>';
function L(){return (document.documentElement.lang||"").indexOf("en")===0?"en":"ms";}
function tx(v,l){return typeof v==="string"?v:v[l];}
function num(o,l){return l==="en"&&o.en_n?o.en_n:o.n;}

function ytCard(v,l){
  return '<button type="button" class="sc-v h" data-sc="yt" data-id="'+v.id+'" aria-label="'+T[l].play+': '+v.t+'">'+
    '<img src="https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg" alt="" loading="lazy">'+
    '<span class="sc-cap"><span><strong>'+v.t+'</strong><small>'+v.s+'</small></span><span class="sc-play">'+PLAY+'</span></span></button>';
}
function mp4Card(v,l){
  var t=tx(v.t||v,l); if(v.ms) t=v[l];
  var s=v.s?tx(v.s,l):"";
  return '<button type="button" class="sc-v v" data-sc="mp4" data-src="'+HOST[v.h]+v.f+'.mp4" data-poster="'+PF+v.f+'.jpg" aria-label="'+T[l].play+': '+t+'">'+
    '<img src="'+PF+v.f+'.jpg" alt="" loading="lazy">'+
    '<span class="sc-cap"><span><strong>'+t+'</strong>'+(s?'<small>'+s+'</small>':'')+'</span><span class="sc-play">'+PLAY+'</span></span></button>';
}
function resultsSec(l){
  var k=T[l];
  return '<section id="hasil" class="sc-res"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+k.resEyebrow+'</span><h2>'+k.resTitle+'</h2></div><p class="lead">'+k.resLead+'</p></div>'+
    '<div class="sc-stats">'+STATS.map(function(s){return '<div class="sc-stat"><b>'+num(s,l)+'</b><span>'+s[l]+'</span></div>';}).join("")+'</div></div></section>';
}
function campSec(l){
  var k=T[l];
  return '<section id="kempen" class="sc-camp"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+k.campEyebrow+'</span><h2>'+k.campTitle+'</h2></div></div>'+
    CAMPS.map(function(c,i){
      return '<article class="sc-case"><header class="sc-case-h"><span class="mono">'+String(i+1).padStart(2,"0")+' · '+c.tag[l]+'</span><h3>'+c.name[l]+'</h3><p class="sc-brand">'+c.brand+'</p></header>'+
      '<dl class="sc-meta"><div><dt>'+k.role+'</dt><dd>'+c.role[l]+'</dd></div><div><dt>'+k.period+'</dt><dd>'+c.period[l]+'</dd></div><div><dt>'+k.budget+'</dt><dd>'+c.budget+'</dd></div></dl>'+
      '<div class="sc-story"><div><h4>'+k.problem+'</h4><p>'+c.problem[l]+'</p></div><div><h4>'+k.strategy+'</h4><p>'+c.strategy[l]+'</p></div></div>'+
      '<div class="sc-kpi">'+c.results.map(function(r){return '<div><b>'+num(r,l)+'</b><span>'+r[l]+'</span></div>';}).join("")+'</div>'+
      '<h4 class="sc-sub">'+k.films+'</h4><div class="sc-grid h">'+c.yt.map(function(v){return ytCard(v,l);}).join("")+'</div>'+
      '<h4 class="sc-sub">'+k.social+'</h4><div class="sc-grid v">'+c.tt.map(function(v){return mp4Card(v,l);}).join("")+'</div></article>';
    }).join("")+'</div></section>';
}
function ccSec(l){
  var k=T[l];
  return '<section id="content-creator" class="sc-cc"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+k.ccEyebrow+'</span><h2>'+k.ccTitle+'</h2></div><p class="lead">'+k.ccLead+'</p></div>'+
    '<div class="sc-growth"><div><b>500</b><span>→</span><b>187K</b></div><ul>'+k.skills.map(function(s){return '<li>'+s+'</li>';}).join("")+'</ul></div>'+
    '<h4 class="sc-sub">'+k.reels+'</h4><div class="sc-grid v">'+REELS.map(function(v){return mp4Card(v,l);}).join("")+'</div>'+
    '<p class="sc-cta"><a class="btn pri" href="#harga" data-sc="cc">'+k.ccCta+' →</a></p></div></section>';
}
function inject(){
  var pf=document.getElementById("portfolio"); if(!pf)return;
  var l=L();
  if(!document.getElementById("hasil")||document.getElementById("hasil").dataset.l!==l){
    ["hasil","kempen","content-creator"].forEach(function(id){var e=document.getElementById(id); if(e)e.parentNode.removeChild(e);});
    var box=document.createElement("div"); box.innerHTML=resultsSec(l)+campSec(l)+ccSec(l);
    box.firstChild.dataset.l=l;
    while(box.firstChild) pf.parentNode.insertBefore(box.firstChild,pf);
  }
  var nav=document.querySelector("header nav.links");
  if(nav&&!nav.querySelector('a[href="#kempen"]')){
    var a=document.createElement("a"); a.href="#kempen"; a.textContent=T[l].navCamp;
    var first=nav.querySelector("a"); if(first&&first.nextSibling) nav.insertBefore(a,first.nextSibling); else nav.appendChild(a);
  }
}
document.addEventListener("click",function(e){
  var el=e.target.closest&&e.target.closest("[data-sc]"); if(!el)return;
  var k=el.dataset.sc;
  if(k==="cc"){var c=document.querySelector('[data-act="tab"][data-k="content"]'); if(c)c.click(); return;}
  e.preventDefault();
  document.querySelectorAll(".sc-v video").forEach(function(o){try{o.pause();}catch(err){}});
  var box=document.createElement("div"); box.className=el.className+" playing";
  if(k==="yt"){
    box.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+el.dataset.id+'?autoplay=1&rel=0" title="YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
  } else {
    var v=document.createElement("video"); v.src=el.dataset.src; v.poster=el.dataset.poster; v.controls=true; v.autoplay=true; v.playsInline=true; v.setAttribute("playsinline","");
    box.appendChild(v); var p=v.play&&v.play(); if(p&&p.catch)p.catch(function(){});
  }
  el.parentNode.replaceChild(box,el);
});
document.addEventListener("DOMContentLoaded",function(){
  var app=document.getElementById("app"); if(!app)return;
  inject(); new MutationObserver(inject).observe(app,{childList:true});
});
})();
