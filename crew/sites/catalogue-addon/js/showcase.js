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
  {key:"masdora",brand:"Masdora Jewellery", name:{ms:"Amira Series Collection",en:"Amira Series Collection"},
   tag:{ms:"Marketing + Videografi",en:"Marketing + Videography"},
   role:{ms:"Project Manager",en:"Project Manager"}, period:{ms:"Jan – Jul 2026",en:"Jan – Jul 2026"}, budget:"RM100,000",
   problem:{ms:"Bajet dan masa yang terhad untuk pelancaran koleksi baharu.",en:"A limited budget and timeline for a new collection launch."},
   strategy:{ms:"Bina jenama dan naikkan jualan serentak melalui media sosial dan marketplace, disokong filem kempen dan content TikTok yang bercerita.",en:"Build the brand and grow sales at the same time through social media and marketplaces, backed by campaign films and story-led TikTok content."},
   results:[{n:"4J",en_n:"4M",ms:"jangkauan",en:"reach"},{n:"3,500",ms:"leads",en:"leads"},{n:"+40%",ms:"jualan",en:"sales"}],
   yt:[{id:"0tuCKVUMFAQ",t:"Kenangan Tidak Ternilai",s:"Masdora Raya 2026"},{id:"0_pnF8EKt4A",t:"Serumpun Kasih",s:"Masdora Jewellery"}],
   tt:[{f:"tt-masdora-1",h:"TTM1",ms:"Live bersama Amira Othman",en:"Live with Amira Othman"},{f:"tt-masdora-2",h:"TTM2",ms:"Koleksi Amira",en:"Amira Collection"},{f:"tt-masdora-3",h:"TTM3",ms:"Terima kasih semua",en:"Thank you, everyone"}]},
  {key:"haos",brand:"Haos Ek?", name:{ms:"Tekan, Goncang, Buka & Menang",en:"Press, Shake, Open & Win"},
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
/* Graf bar mendatar (HTML, responsif). Satu siri = satu warna; nilai dilabel terus; jadual untuk pembaca skrin. */
var CHART={
  ms:{tiktok:"Pertumbuhan pengikut TikTok",tiktokNote:"Dalam 3 bulan",before:"Mula",after:"Selepas 3 bulan",
      sales:"Jualan Masdora (indeks, sebelum kempen = 100)",salesBefore:"Sebelum kempen",salesAfter:"Selepas kempen",
      ig:"Post Instagram SnapSense paling disukai",igNote:"Jumlah likes setiap post",likes:"likes",table:"Lihat dalam jadual",item:"Item",val:"Nilai",
      igTot:"post",igLikes:"likes keseluruhan",igFol:"pengikut Instagram"},
  en:{tiktok:"TikTok follower growth",tiktokNote:"In 3 months",before:"Start",after:"After 3 months",
      sales:"Masdora sales (index, pre-campaign = 100)",salesBefore:"Before campaign",salesAfter:"After campaign",
      ig:"Most-liked SnapSense Instagram posts",igNote:"Likes per post",likes:"likes",table:"View as table",item:"Item",val:"Value",
      igTot:"posts",igLikes:"total likes",igFol:"Instagram followers"}
};
var IG={posts:42,likes:248,followers:1390,top:[
  {ms:"Empty Page × ROTF, MAHA 2024",en:"Empty Page × ROTF, MAHA 2024",v:26,u:"https://www.instagram.com/p/C_8pjj6TnsT/"},
  {ms:"Sony Portrait Workshop (a9 III)",en:"Sony Portrait Workshop (a9 III)",v:16,u:"https://www.instagram.com/p/DHSWUTlz9dI/"},
  {ms:"Sony Portrait Workshop",en:"Sony Portrait Workshop",v:15,u:"https://www.instagram.com/p/DHSWJ3EzcH7/"},
  {ms:"Potret Raya · Fujifilm",en:"Raya portraits · Fujifilm",v:13,u:"https://www.instagram.com/p/DHiB8sOzX1c/"},
  {ms:"Sony Workshop · cahaya semula jadi",en:"Sony Workshop · natural light",v:11,u:"https://www.instagram.com/p/DHREronzbRu/"},
  {ms:"Karnival Rakyat Karangkraf & Sinar",en:"Karangkraf & Sinar People's Carnival",v:11,u:"https://www.instagram.com/p/C945sr1yL95/"}
]};
function fmt(n,l){return n.toLocaleString(l==="en"?"en-MY":"ms-MY");}
function hbars(title,note,rows,l){
  var max=0; rows.forEach(function(r){if(r.v>max)max=r.v;});
  var C=CHART[l];
  return '<figure class="sc-chart"><figcaption><strong>'+title+'</strong>'+(note?'<small>'+note+'</small>':'')+'</figcaption>'+
    '<div class="sc-bars" role="img" aria-label="'+title+'">'+rows.map(function(r){
      var w=max?Math.max(0.8,r.v/max*100):0, d=r.d||fmt(r.v,l);
      var lab=r.u?'<a href="'+r.u+'" target="_blank" rel="noopener">'+r.label+'</a>':r.label;
      return '<div class="sc-row" title="'+r.label+': '+d+'"><span class="sc-lab">'+lab+'</span><span class="sc-track"><span class="sc-bar" style="width:'+w.toFixed(1)+'%"></span></span><span class="sc-num">'+d+'</span></div>';
    }).join("")+'</div>'+
    '<details class="sc-tbl"><summary>'+C.table+'</summary><table><thead><tr><th>'+C.item+'</th><th>'+C.val+'</th></tr></thead><tbody>'+
    rows.map(function(r){return '<tr><td>'+r.label+'</td><td>'+(r.d||fmt(r.v,l))+'</td></tr>';}).join("")+'</tbody></table></details></figure>';
}
var TT={"masdora": {"videos": 159, "t": {"likes": 109513, "comments": 3153, "saves": 6542, "shares": 3616}, "months": [["2026-01", 5, 212], ["2026-02", 31, 26866], ["2026-03", 31, 18663], ["2026-04", 32, 60014], ["2026-05", 26, 1056], ["2026-06", 20, 919], ["2026-07", 14, 1783]], "top": [{"t": "Semoga @Amira Othman diberikan kesihatan…", "s": "@masdorajewellerymy · 18 Apr", "l": 54500, "c": 1343, "sv": 3485, "sh": 1303}, {"t": "Done buat trend Raya ni", "s": "@masdorajewelry_os · 5 Mac", "l": 8705, "c": 244, "sv": 458, "sh": 341}, {"t": "Rugi lah siapa yang tak join live semalam", "s": "@masdorajewelry_os · 4 Mac", "l": 7577, "c": 132, "sv": 434, "sh": 151}, {"t": "Jumpa korang di Meet And Greet di Masdora KL", "s": "@masdorajewelry_os · 10 Feb", "l": 5362, "c": 290, "sv": 328, "sh": 118}, {"t": "Jangan lupa janji temu kita, 15/2", "s": "@masdorajewelry_os · 10 Feb", "l": 4455, "c": 93, "sv": 352, "sh": 147}], "followers": [["@masdorajewellerymy", 217200], ["@masdorajewelry_os", 187200]], "period": {"ms": "Jan – Jul 2026, 2 akaun", "en": "Jan – Jul 2026, 2 accounts"}}, "haos": {"videos": 123, "t": {"likes": 46869, "comments": 1065, "saves": 4664, "shares": 1732}, "months": [["2024-03", 14, 3420], ["2024-04", 21, 2287], ["2024-05", 9, 9231], ["2024-06", 9, 2118], ["2024-07", 15, 5198], ["2024-08", 15, 15751], ["2024-09", 19, 5728], ["2024-10", 16, 2850], ["2024-11", 4, 232], ["2024-12", 1, 54]], "top": [{"t": "Haos Ek? ASMR", "s": "24 Mei 2024", "l": 8169, "c": 77, "sv": 827, "sh": 116}, {"t": "Takkan nak tunggu umur 80 tahun baru menang", "s": "20 Ogo 2024", "l": 4433, "c": 42, "sv": 135, "sh": 84}, {"t": "Citarasa kita, rahsia perpaduan kita: Teh Tarik", "s": "25 Ogo 2024", "l": 2647, "c": 25, "sv": 230, "sh": 74}, {"t": "Sempena bulan kemerdekaan ke-67", "s": "16 Ogo 2024", "l": 2420, "c": 114, "sv": 404, "sh": 196}, {"t": "Lari laju-laju nak gi manew tuuu", "s": "22 Jul 2024", "l": 2362, "c": 23, "sv": 204, "sh": 22}], "period": {"ms": "Mac – Dis 2024 (video 2023 tiada dalam rakaman)", "en": "Mar – Dec 2024 (2023 videos not in the recording)"}}};
var MON={ms:["Jan","Feb","Mac","Apr","Mei","Jun","Jul","Ogo","Sep","Okt","Nov","Dis"],en:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]};
var TTX={
  ms:{h:"Prestasi TikTok",src:"Dikira daripada video yang dipost di TikTok, dirakam 19 Okt 2026.",vids:"video",likes:"likes",cmt:"komen",sav:"saves",shr:"shares",fol:"pengikut",
      mon:"Likes mengikut bulan",monN:"Jumlah likes video yang dipost setiap bulan",top:"5 video terbaik",topN:"Likes setiap video",tbl:"Butiran video terbaik",vid:"Video"},
  en:{h:"TikTok performance",src:"Counted from videos posted on TikTok, recorded 19 Oct 2026.",vids:"videos",likes:"likes",cmt:"comments",sav:"saves",shr:"shares",fol:"followers",
      mon:"Likes by month",monN:"Total likes on videos posted each month",top:"Top 5 videos",topN:"Likes per video",tbl:"Top video details",vid:"Video"}
};
function short(n,l){return n>=1e6?(n/1e6).toFixed(1).replace(".0","")+(l==="en"?"M":"J"):n>=1000?(n/1000).toFixed(n>=1e4?0:1).replace(".0","")+"K":String(n);}
function ttBlock(key,l){
  var d=TT[key]; if(!d)return ""; var k=TTX[l];
  var tiles=[[d.videos,k.vids],[d.t.likes,k.likes],[d.t.comments,k.cmt],[d.t.saves,k.sav],[d.t.shares,k.shr]];
  if(d.followers){var f=0; d.followers.forEach(function(x){f+=x[1];}); tiles.push([f,k.fol]);}
  var monRows=d.months.map(function(m){var p=m[0].split("-"); return {label:MON[l][+p[1]-1]+" "+p[0],v:m[2],d:fmt(m[2],l)};});
  var topRows=d.top.map(function(x){return {label:x.t+" · "+x.s,v:x.l,d:fmt(x.l,l)};});
  return '<div class="sc-tt"><h4 class="sc-sub">'+k.h+' · '+d.period[l]+'</h4>'+
    '<div class="sc-tiles">'+tiles.map(function(t){return '<div><b>'+short(t[0],l)+'</b><span>'+t[1]+'</span></div>';}).join("")+'</div>'+
    '<div class="sc-charts">'+hbars(k.mon,k.monN,monRows,l)+hbars(k.top,k.topN,topRows,l)+'</div>'+
    '<details class="sc-tbl"><summary>'+k.tbl+'</summary><table><thead><tr><th>'+k.vid+'</th><th>'+k.likes+'</th><th>'+k.cmt+'</th><th>'+k.sav+'</th><th>'+k.shr+'</th></tr></thead><tbody>'+
    d.top.map(function(x){return '<tr><td>'+x.t+'<br><small>'+x.s+'</small></td><td>'+fmt(x.l,l)+'</td><td>'+fmt(x.c,l)+'</td><td>'+fmt(x.sv,l)+'</td><td>'+fmt(x.sh,l)+'</td></tr>';}).join("")+
    '</tbody></table></details><p class="sc-src">'+k.src+'</p></div>';
}
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
    '<div class="sc-stats">'+STATS.map(function(s){return '<div class="sc-stat"><b>'+num(s,l)+'</b><span>'+s[l]+'</span></div>';}).join("")+'</div>'+
    '<div class="sc-charts">'+hbars(CHART[l].tiktok,CHART[l].tiktokNote,[{label:CHART[l].before,v:500},{label:CHART[l].after,v:187000,d:"187K"}],l)+
    hbars(CHART[l].sales,"",[{label:CHART[l].salesBefore,v:100},{label:CHART[l].salesAfter,v:140,d:"140 (+40%)"}],l)+'</div></div></section>';
}
function campSec(l){
  var k=T[l];
  return '<section id="kempen" class="sc-camp"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+k.campEyebrow+'</span><h2>'+k.campTitle+'</h2></div></div>'+
    CAMPS.map(function(c,i){
      return '<article class="sc-case"><header class="sc-case-h"><span class="mono">'+String(i+1).padStart(2,"0")+' · '+c.tag[l]+'</span><h3>'+c.name[l]+'</h3><p class="sc-brand">'+c.brand+'</p></header>'+
      '<dl class="sc-meta"><div><dt>'+k.role+'</dt><dd>'+c.role[l]+'</dd></div><div><dt>'+k.period+'</dt><dd>'+c.period[l]+'</dd></div><div><dt>'+k.budget+'</dt><dd>'+c.budget+'</dd></div></dl>'+
      '<div class="sc-story"><div><h4>'+k.problem+'</h4><p>'+c.problem[l]+'</p></div><div><h4>'+k.strategy+'</h4><p>'+c.strategy[l]+'</p></div></div>'+
      '<div class="sc-kpi">'+c.results.map(function(r){return '<div><b>'+num(r,l)+'</b><span>'+r[l]+'</span></div>';}).join("")+'</div>'+
      ttBlock(c.key,l)+
      '<h4 class="sc-sub">'+k.films+'</h4><div class="sc-grid h">'+c.yt.map(function(v){return ytCard(v,l);}).join("")+'</div>'+
      '<h4 class="sc-sub">'+k.social+'</h4><div class="sc-grid v">'+c.tt.map(function(v){return mp4Card(v,l);}).join("")+'</div></article>';
    }).join("")+'</div></section>';
}
function ccSec(l){
  var k=T[l];
  return '<section id="content-creator" class="sc-cc"><div class="wrap"><div class="sec-head"><div><span class="mono eyebrow">'+k.ccEyebrow+'</span><h2>'+k.ccTitle+'</h2></div><p class="lead">'+k.ccLead+'</p></div>'+
    '<div class="sc-growth"><div><b>500</b><span>→</span><b>187K</b></div><ul>'+k.skills.map(function(s){return '<li>'+s+'</li>';}).join("")+'</ul></div>'+
    '<div class="sc-ig"><div class="sc-igstats"><div><b>'+fmt(IG.followers,l)+'</b><span>'+CHART[l].igFol+'</span></div><div><b>'+IG.posts+'</b><span>'+CHART[l].igTot+'</span></div><div><b>'+IG.likes+'</b><span>'+CHART[l].igLikes+'</span></div></div>'+
    hbars(CHART[l].ig,CHART[l].igNote,IG.top.map(function(t){return {label:t[l],v:t.v,u:t.u,d:t.v+" "+CHART[l].likes};}),l)+'</div>'+
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
