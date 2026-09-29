// Placeholder product artwork, rendered as SVG. Used only when a product has no uploaded photos.
/* eslint-disable */
const MAT = {
  brass:['#6B4A17','#B38A3E','#EED9A0'], bronze:['#3F2612','#8A5A2E','#D6A66E'], bidri:['#0F0F11','#29292E','#5D5D66'],
  marble:['#BDB5A6','#E7E3DA','#FFFFFF'], soap:['#9C8F76','#D3C9B6','#F3EDE1'], sheesham:['#351C0C','#6B3F22','#A8744A'],
  walnut:['#2B1A0F','#5B3B25','#94694A'], copper:['#5E2A12','#AD6239','#EBAA80'], terra:['#6A2E15','#AE5E36','#DE9468'],
  blackclay:['#0E0D0C','#282523','#5E5953'], bluepot:['#C9C5BC','#F1EEE7','#FFFFFF'], pashmina:['#8E7A63','#C9B79C','#E8DCC7'],
  ajrakh:['#152037','#22314F','#34497A'], kantha:['#5E2723','#9C433A','#CC7466']
};
let U = 0;
function shade(hex,a){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;r=Math.max(0,Math.min(255,r+a));g=Math.max(0,Math.min(255,g+a));b=Math.max(0,Math.min(255,b+a));return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function rnd(seed){let s=seed;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5)>>>0)/4294967296}
function smooth(pts,start='M'){let d=`${start}${pts[0][0]},${pts[0][1]}`;for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;d+=` C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)},${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)},${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0]},${p2[1]}`}return d}
function lg(id,c){return `<linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".22" stop-color="${c[1]}"/><stop offset=".38" stop-color="${c[2]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/></linearGradient>`}
function vpath(prof,cx=200,b=400){const L=prof.map(([h,w])=>[cx-w,b-h]);const R=prof.slice().reverse().map(([h,w])=>[cx+w,b-h]);return smooth(L)+' '+smooth(R,'L')+' Z'}
function pattern(u,type,c,box){
  const R=rnd(type.length*97+7);let s='';
  const [x0,y0,x1,y1]=box;
  if(type==='bidri'){for(let y=y0+14,r=0;y<y1;y+=30,r++){s+=`<path d="M${x0} ${y} Q${(x0+x1)/2} ${y-8} ${x1} ${y}" stroke="#CFCFD5" stroke-width=".9" fill="none" opacity=".7"/>`;for(let x=x0+(r%2?10:24);x<x1;x+=28)s+=`<path d="M${x} ${y} q7 -11 14 0 q-7 11 -14 0z" fill="#DADAE0"/><circle cx="${x+7}" cy="${y-13}" r="1.6" fill="#DADAE0"/>`}}
  if(type==='blue'){for(let y=y0+20,r=0;y<y1;y+=38,r++){for(let x=x0+(r%2?14:32);x<x1;x+=36){s+=`<g transform="translate(${x} ${y})"><circle r="8" fill="#23579A"/><circle r="3.4" fill="#9CC0E3"/><path d="M-14 6q7-2 10 4M14 6q-7-2-10 4" stroke="#3E7B5B" stroke-width="2" fill="none"/></g>`}s+=`<rect x="${x0}" y="${y+22}" width="${x1-x0}" height="2" fill="#23579A" opacity=".8"/>`}}
  if(type==='dhokra'){for(let y=y0;y<y1;y+=6)s+=`<path d="M${x0} ${y} q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0" stroke="${c[0]}" stroke-width="1.1" fill="none" opacity=".55"/>`}
  if(type==='hammer'){for(let i=0;i<260;i++)s+=`<ellipse cx="${(x0+R()*(x1-x0)).toFixed(1)}" cy="${(y0+R()*(y1-y0)).toFixed(1)}" rx="${(2+R()*4).toFixed(1)}" ry="${(1.5+R()*2.5).toFixed(1)}" fill="${R()>.5?c[2]:c[0]}" opacity=".28"/>`}
  if(type==='jaali'){for(let y=y0+22,r=0;y<y1-10;y+=17,r++)for(let x=x0+(r%2?8:17);x<x1;x+=18)s+=`<circle cx="${x}" cy="${y}" r="5.4" fill="#3A2812"/><circle cx="${x}" cy="${y}" r="3.2" fill="#F6C66A" opacity=".95"/>`}
  if(type==='terra'){for(let y=y0+10;y<y1;y+=16)s+=`<path d="M${x0} ${y}H${x1}" stroke="#F1E3CF" stroke-width="1.6" stroke-dasharray="2 5" opacity=".75"/>`}
  if(type==='ajrakh'){for(let y=y0;y<y1;y+=18)for(let x=x0;x<x1;x+=18)s+=`<path d="M${x+9} ${y} l7 9 -7 9 -7 -9z" fill="#A83A2A" opacity=".9"/><circle cx="${x}" cy="${y}" r="2.4" fill="#EFE3CD"/>`}
  if(type==='kantha'){for(let y=y0;y<y1;y+=6)s+=`<path d="M${x0} ${y}H${x1}" stroke="#F3E6D6" stroke-width="1" stroke-dasharray="4 4" opacity=".55"/>`}
  return s;
}
function flame(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})"><circle r="14" cy="-10" fill="#F7C96B" opacity=".25"/><path d="M0 0c5-8 5-15 0-24c-5 9-5 16 0 24z" fill="#F4B84E"/><path d="M0 -2c2-4 2-8 0-12c-2 4-2 8 0 12z" fill="#FFF1C9"/></g>`}
function vessel(u,c,prof,o={}){
  const id=u+'v',cx=o.cx||200,b=o.base||400,d=vpath(prof,cx,b),top=prof[0];
  const hs=prof.map(p=>p[0]),ws=prof.map(p=>p[1]);const H=Math.max(...hs),W=Math.max(...ws);
  let s=`<defs><clipPath id="${id}c"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${u}g)"/>`;
  if(o.pat)s+=`<g clip-path="url(#${id}c)">${pattern(u,o.pat,c,[cx-W,b-H,cx+W,b])}</g>`;
  s+=`<path d="${d}" fill="url(#${u}s)" opacity=".5"/>`;
  if(o.mouth!==false)s+=`<ellipse cx="${cx}" cy="${b-top[0]}" rx="${top[1]}" ry="${(top[1]*.2).toFixed(1)}" fill="${c[0]}" stroke="${c[2]}" stroke-width="1.2" stroke-opacity=".6"/>`;
  return s;
}
const SHAPES = {
  vaseTall:(u,c,p)=>vessel(u,c,[[300,30],[288,24],[262,26],[228,52],[176,84],[120,92],[66,80],[26,58],[8,52],[0,54]],{pat:p.pat}),
  vaseBlue:(u,c,p)=>vessel(u,c,[[262,34],[248,26],[214,34],[168,86],[112,98],[58,82],[18,58],[0,52]],{pat:p.pat}),
  kalash:(u,c,p)=>vessel(u,c,[[214,44],[204,38],[186,42],[160,84],[112,106],[62,98],[20,66],[0,52]],{pat:p.pat}),
  urli:(u,c,p)=>vessel(u,c,[[118,168],[110,166],[76,150],[40,108],[14,70],[0,62]],{pat:p.pat}),
  bowlDeep:(u,c,p)=>vessel(u,c,[[132,118],[124,116],[82,106],[40,82],[12,56],[0,48]],{}),
  lamp:(u,c,p)=>vessel(u,c,[[336,6],[326,10],[312,6],[300,58],[292,74],[284,44],[272,14],[180,12],[166,26],[152,12],[70,16],[46,30],[30,76],[12,108],[0,112]],{mouth:false})+flame(144,94,.9)+flame(200,98,1)+flame(256,94,.9),
  lantern:(u,c,p)=>{const d=vessel(u,c,[[252,6],[240,10],[226,30],[208,72],[176,90],[72,90],[26,84],[8,78],[0,80]],{pat:'jaali',mouth:false});return d},
  pillars:(u,c)=>vessel(u,c,[[226,34],[0,34]],{cx:162})+`<ellipse cx="162" cy="174" rx="30" ry="6" fill="#F4EFE4"/>`+flame(162,172)+vessel(u,c,[[152,36],[0,36]],{cx:246})+`<ellipse cx="246" cy="248" rx="32" ry="6.5" fill="#F4EFE4"/>`+flame(246,246),
  platter:(u,c)=>{let s=`<ellipse cx="200" cy="384" rx="160" ry="56" fill="${c[0]}"/><g transform="translate(200 370) scale(1 .34)"><circle r="160" fill="url(#${u}g)"/><circle r="146" fill="${c[2]}"/><circle r="146" fill="none" stroke="#B89A5A" stroke-width="3"/>`;
    const cols=['#2B4E8C','#B2452B','#2F7A55','#C39B4A','#7E3B7A'];
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2,x=Math.cos(a)*112,y=Math.sin(a)*112;s+=`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${i*22.5})"><ellipse rx="12" ry="5" fill="${cols[i%5]}"/><ellipse rx="5" ry="12" fill="${cols[(i+2)%5]}" opacity=".9"/></g>`}
    for(let i=0;i<8;i++)s+=`<ellipse rx="40" ry="13" transform="rotate(${i*22.5})" fill="${cols[i%4]}" opacity=".92"/>`;
    s+=`<circle r="16" fill="#C39B4A"/><circle r="7" fill="#F2EEE6"/></g>`;return s},
  tray:(u,c)=>{let s=`<rect x="54" y="352" width="292" height="42" rx="18" fill="${c[0]}"/><g transform="translate(200 360) scale(1 .4)"><rect x="-150" y="-110" width="300" height="220" rx="24" fill="url(#${u}g)"/><rect x="-132" y="-92" width="264" height="184" rx="16" fill="${c[0]}"/>`;
    for(let i=0;i<7;i++){const x=-100+i*33,y=(i%2?-30:30);s+=`<path transform="translate(${x} ${y}) rotate(${i*40})" d="M0 -26 C14 -18 20 -4 10 6 L22 10 L8 14 L6 28 L0 18 L-6 28 L-8 14 L-22 10 L-10 6 C-20 -4 -14 -18 0 -26z" fill="${c[2]}" opacity=".75"/>`}
    return s+`</g>`},
  box:(u,c)=>{let s=`<polygon points="104,316 296,316 316,290 124,290" fill="${c[2]}"/><polygon points="296,316 316,290 316,374 296,400" fill="${c[0]}"/><rect x="104" y="316" width="192" height="84" fill="url(#${u}g)"/><rect x="104" y="334" width="192" height="2" fill="${c[0]}"/>`;
    s+=`<rect x="114" y="344" width="172" height="46" fill="none" stroke="#D6B25E" stroke-width="1.4"/><rect x="118" y="294" width="176" height="18" fill="none" stroke="#D6B25E" stroke-width="1.2" transform="skewX(-38) translate(234 0)"/>`;
    for(let i=0;i<5;i++){const x=134+i*33;s+=`<g transform="translate(${x} 367)"><circle r="7" fill="none" stroke="#D6B25E" stroke-width="1.4"/><circle r="2" fill="#D6B25E"/><path d="M-16 0h-4M16 0h4" stroke="#D6B25E" stroke-width="1.2"/></g>`}
    return s},
  throw:(u,c)=>{let s='';const cols=[c[1],c[2],c[1]];for(let i=0;i<3;i++){const y=370-i*30;s+=`<rect x="${86+i*6}" y="${y}" width="${228-i*12}" height="30" rx="14" fill="${cols[i]}"/><rect x="${86+i*6}" y="${y+22}" width="${228-i*12}" height="3" fill="#9C6B3C" opacity=".5"/>`;for(let x=100+i*6;x<300-i*6;x+=16)s+=`<path d="M${x} ${y+12}q4-6 8 0q-2 5-8 0z" fill="#8A5A34" opacity=".55"/>`}
    for(let x=100;x<300;x+=5)s+=`<line x1="${x}" y1="400" x2="${x}" y2="406" stroke="${c[1]}" stroke-width="1.2"/>`;return s},
  quilt:(u,c)=>{let s='';const cols=[c[1],'#D9B25A','#2E5B6A',c[1]];for(let i=0;i<4;i++){const y=374-i*26;s+=`<rect x="${80+i*5}" y="${y}" width="${240-i*10}" height="26" rx="12" fill="${cols[i]}"/>`;for(let yy=y+5;yy<y+24;yy+=5)s+=`<path d="M${88+i*5} ${yy}H${312-i*5}" stroke="#F3E6D6" stroke-width=".9" stroke-dasharray="4 4" opacity=".6"/>`}return s},
  cushion:(u,c,p)=>{const d1='M84 250 Q170 238 256 250 Q268 324 256 398 Q170 410 84 398 Q72 324 84 250Z',d2='M150 272 Q236 262 322 272 Q334 336 322 400 Q236 410 150 400 Q138 336 150 272Z';
    return `<defs><clipPath id="${u}k1"><path d="${d1}"/></clipPath><clipPath id="${u}k2"><path d="${d2}"/></clipPath></defs><path d="${d1}" fill="${c[1]}"/><g clip-path="url(#${u}k1)">${pattern(u,'ajrakh',c,[70,236,270,410])}</g><path d="${d1}" fill="url(#${u}s)" opacity=".45"/><path d="${d2}" fill="#8E2F22"/><g clip-path="url(#${u}k2)">${pattern(u,'ajrakh',['#152037'],[136,258,336,410]).replace(/#A83A2A/g,'#1E2C4C')}</g><path d="${d2}" fill="url(#${u}s)" opacity=".45"/>`},
  horse:(u,c,p)=>horse(u,c,1,0,p.pat),
  rider:(u,c,p)=>horse(u,c,.86,18,p.pat)+`<g><path d="M186 222 q12 -6 22 0 l6 50 h-34z" fill="url(#${u}g)"/><circle cx="197" cy="206" r="13" fill="url(#${u}g)"/><path d="M184 200 q13 -20 26 0" fill="${c[0]}"/><path d="M190 236 l-26 22 M204 236 l30 14" stroke="${c[1]}" stroke-width="7" stroke-linecap="round"/></g>`
};
function horse(u,c,s,dy,pat){
  const id=u+'h';const body=`<ellipse cx="186" cy="296" rx="74" ry="34"/><path d="M228 292 C240 240 244 190 250 150 L276 152 C272 196 262 250 258 300z"/><ellipse cx="274" cy="146" rx="32" ry="15" transform="rotate(14 274 146)"/><path d="M252 136 l2 -30 l8 28z M264 134 l6 -28 l6 28z"/><rect x="128" y="316" width="16" height="84" rx="5"/><rect x="156" y="318" width="16" height="82" rx="5"/><rect x="204" y="318" width="16" height="82" rx="5"/><rect x="230" y="314" width="16" height="86" rx="5"/><path d="M116 286 q-26 20 -18 64 q12 -30 24 -44z"/>`;
  return `<g transform="translate(${200-200*s} ${400-400*s+dy*0}) scale(${s})"><defs><clipPath id="${id}"><g>${body}</g></clipPath></defs><g fill="url(#${u}g)">${body}</g><g clip-path="url(#${id})">${pattern(u,pat,c,[90,100,310,400])}</g><g fill="url(#${u}s)" opacity=".4">${body}</g></g>`;
}
export function art(prod,v=0,label=true){
  const a=prod.art&&MAT[prod.art.mat]&&SHAPES[prod.art.shape]?prod.art:{mat:'marble',shape:'bowlDeep',pat:'',bg:'#DDD5C6'};
  const p={...a,bg:/^#[0-9a-f]{6}$/i.test(a.bg||'')?a.bg:'#DDD5C6',name:prod.name};
  const lite=true;const u='a'+(++U),c=MAT[p.mat],wall=v===2?(lite?'#E7E1D6':'#2D2924'):(p.bg||'#DDD5C6'),floor=shade(wall,v===2?(lite?-14:10):-18);
  const zy=({vaseTall:250,vaseBlue:270,kalash:300,urli:350,bowlDeep:340,lamp:230,lantern:290,pillars:290,platter:370,tray:370,box:350,throw:350,quilt:350,cushion:330,horse:270,rider:270})[p.shape]||300;
  const zx=p.shape==='horse'||p.shape==='rider'?230:200;
  const t=v===1?`transform="translate(${zx} ${zy}) scale(1.85) translate(${-zx} ${-zy})"`:v===2?'transform="translate(0 -26)"':'';
  const plinth=v===2?`<rect x="78" y="374" width="244" height="126" fill="${lite?'#F6F2EB':'#3C352E'}"/><rect x="78" y="374" width="244" height="8" fill="${lite?'#FFFFFF':'#4E463D'}"/>`:'';
  return `<svg class="art" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" ${label?`role="img" aria-label="${esc(p.name)}, ${['front view','detail','studio view'][v]}"`:'aria-hidden="true"'}><defs>${lg(u+'g',c)}<linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient><radialGradient id="${u}l" cx=".3" cy=".22" r=".85"><stop offset="0" stop-color="#fff" stop-opacity="${v===2&&!lite?.1:.5}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="${u}b" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="9"/></filter></defs><rect width="400" height="500" fill="${wall}"/><rect y="400" width="400" height="100" fill="${floor}"/><rect width="400" height="500" fill="url(#${u}l)"/>${plinth}<g ${t}><ellipse cx="200" cy="402" rx="130" ry="11" fill="#000" opacity=".32" filter="url(#${u}b)"/>${SHAPES[p.shape](u,c,p)}</g></svg>`;
}
export function jaaliSVG(){let s='<svg viewBox="0 0 240 240" aria-hidden="true"><defs><pattern id="jp" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M20 2 L25 15 L38 20 L25 25 L20 38 L15 25 L2 20 L15 15Z M0 0 L6 6 M40 0 L34 6 M0 40 L6 34 M40 40 L34 34" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="20" cy="20" r="3" fill="none" stroke="currentColor" stroke-width="1"/></pattern><radialGradient id="jm"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="jmask"><circle cx="120" cy="120" r="120" fill="url(#jm)"/></mask></defs><rect width="240" height="240" fill="url(#jp)" mask="url(#jmask)"/></svg>';return s}
export function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
