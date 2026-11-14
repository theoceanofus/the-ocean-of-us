import {COMMUNITY_SPECIES} from '../core/community-species.js';
const TAU=Math.PI*2;
function ellipse(c,x,y,rx,ry,color,angle=0){if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill();}
// A filled oval with an outline (ellipse's seventh argument is an angle, not an outline colour).
function oval(c,x,y,rx,ry,fill,stroke,width=1){if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}c.beginPath();c.ellipse(x,y,Math.max(rx,.01),Math.max(ry,.01),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function path(c,d,fill,stroke,width=1){const p=flex.map?flexedPath(d):new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke(p);}return p;}
function line(c,pts,col,width=1){c.strokeStyle=col;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>{if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}c[i?'lineTo':'moveTo'](x,y);});c.stroke();}
function grad(c,P,a,b,y0=-35,y1=35){
 const g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,P(a,-.4));g.addColorStop(.24,P(a,.17));g.addColorStop(.51,P(a,.015));g.addColorStop(.78,P(b,-.07));g.addColorStop(1,P(b,-.35));return g;
}
// Eyes, and the record of where each eye and helmet is for requested looks, come from the face kit (render/face.js).
import {setEyeLook,note,ownEye,eyeScale,lookIris,eye as faceEye,isProbing,teeth as faceTeeth,faceLine as faceStroke} from './face.js';
import {flex,setFlex,setFollow,bodyMap,bobHeight,motionOf,flexedPath,pulseAt} from './body-motion.js';
// Parts that move with the body: a drawing's eyes follow the flex, and tails stop sliding on their own once the whole body carries them.
function eye(c,x,y,...more){if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}return faceEye(c,x,y,...more);}
let bodyCarriesTail=false;
const swing=(p,n)=>bodyCarriesTail?0:Math.sin(p.swim)*n;
// A rigid piece: drawn in its own coordinates, it rides on the body at the point where it joins.
function rigid(fn){const keep=flex.map;flex.map=null;try{fn();}finally{flex.map=keep;}}
// A rigid piece fixed to the body at (x,y): it rides on the point where it joins.
function rigidAt(c,x,y,fn){if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}rigid(()=>{c.save();c.translate(x,y);fn();c.restore();});}
function atBody(x,y){if(flex.map){flex.map(x,y);return[flex.x,flex.y];}return[x,y];}
// Teeth and face lines ride on the bending head like everything else.
function teeth(c,P,jaw,o){if(!flex.map)return faceTeeth(c,P,jaw,o);const [x0,y0]=atBody(jaw.x0,jaw.y0),[x1,y1]=atBody(jaw.x1,jaw.y1);return rigid(()=>faceTeeth(c,P,{...jaw,x0,y0,x1,y1},o));}
function faceLine(c,P,d,col,weight){return faceStroke(c,P,flex.map&&typeof d==='string'?flexedPath(d):d,col,weight);}
// Long bodies: the drawing gives its own wave by position along the body. While swimming the wave goes through the body flex, so every part rides on it.
function waveBody(p,fn){if(p.effort===undefined)return fn;flex.map=(x,y)=>{flex.x=x;flex.y=y+fn(x);};return()=>0;}
import {crisp} from './crisp.js';
import {variantOf,nickedEdge} from './variation.js';
import {finFill,farPalette,glassBody} from './shade.js';
export {setEyeLook};
function skin(c,shape,P,a,seed=1,n=70){
 c.save();c.clip(shape);
 const gloss=c.createRadialGradient(18,-22,3,18,-15,125);gloss.addColorStop(0,P('#c8e4dd',0,.14));gloss.addColorStop(.48,P(a,.15,.055));gloss.addColorStop(1,P('#05202a',0,.16));c.fillStyle=gloss;c.fillRect(-250,-110,520,230);
 for(let i=0;i<n;i++){const u=Math.sin((i+seed*.01)*127.1)*43758.5453,v=Math.sin((i+seed*.01)*311.7)*96321.912;const x=(u-Math.floor(u))*383-190,y=(v-Math.floor(v))*131-65;ellipse(c,x,y,.7+(i%5)*.45,.45+(i%3)*.35,P(a,i%2?.42:-.36,.4),i*.17);}
 c.strokeStyle=P('#d2e6dc',0,.22);c.lineWidth=.55;c.stroke(shape);c.restore();
}
function fishScales(c,shape,P,a){
 c.save();c.clip(shape);for(let row=0;row<9;row++)for(let col=0;col<17;col++){const x=-59+col*6+(row%2)*3,y=-28+row*7;path(c,`M${x} ${y-3} q5 3 0 6`,null,P(a,.48,.3),.6);}c.restore();
}
function helmet(c,x,y,r,P,water=false){
 if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}
 rigid(()=>helmetAt(c,x,y,r,P,water));
}
function helmetAt(c,x,y,r,P,water){
 note(c,'helmet',x,y,r);if(isProbing())return;
 c.save();const glass=c.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r);glass.addColorStop(0,P('#e3ffff',0,.025));glass.addColorStop(.75,P('#aee6e8',0,.035));glass.addColorStop(1,P('#b9efff',0,.32));
 ellipse(c,x,y,r,r,glass);c.strokeStyle=P('#cbf4f2',0,.72);c.lineWidth=1.6;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
 if(water){c.save();c.beginPath();c.arc(x,y,r-1,0,TAU);c.clip();c.fillStyle=P('#88dcf2',0,.12);c.fillRect(x-r,y-r*.48,r*2,r*1.7);line(c,[[x-r,y-r*.48],[x+r,y-r*.48]],P('#c4f5ff',0,.55),.8);c.restore();}
 c.strokeStyle=P('#efffff',0,.85);c.lineWidth=3;c.beginPath();c.arc(x,y,r*.86,3.55,4.38);c.stroke();c.lineWidth=1;c.beginPath();c.arc(x,y,r*.92,.2,.8);c.stroke();
 ellipse(c,x,y+r*.85,r*.5,5,P('#537b83'));ellipse(c,x,y+r*.83,r*.48,2,P('#c4e0d9'));c.restore();
}
// Shark skin: rows of tiny scales, a lateral line and sensory pores on the snout. Each is one long path, so it bends with the body and stays cheap.
function sharkSkin(c,body,P,a,b,id,v=0){
 let d='',pores='';
 for(let r=0;r<11;r++)for(let x=-84+(r%2)*4;x<100;x+=8)d+=`M${x} ${-30+r*5.4} l2.8 .5`;
 for(let i=0;i<18;i++)pores+=`M${80+(i%6)*3.6+(i%2)} ${-9+Math.floor(i/6)*3.2} l.5 .2`;
 c.save();c.clip(body);
 if(id==='great_white_shark'){ // the ragged line where a great white's dark back meets its white belly
  // Each great white's line is its own (render/variation.js); variant 0 is the line it always had.
  const vs=v*1.7,amp=1+v*.14;let e='M-92 8';for(let i=0;i<50;i++){const x=-84+i*3.9,s=(x-22)/112;e+=` L${x} ${8-s*s*5+(Math.sin(i*1.3+vs)*.9+Math.sin(i*.37+vs*.6)*1.1)*amp+(v?Math.sin(i*.17+v)*1.6:0)}`;}
  const g=c.createLinearGradient(0,6,0,30);g.addColorStop(0,P(b,0,.95));g.addColorStop(1,P(b,-.18,.95));path(c,e+' L112 50 L-92 50Z',g);
 }
 if(id==='leopard_shark'){for(let i=0;i<9;i++)path(c,`M${-82+i*20} -34 q-8 18 2 30 q10 -12 6 -30Z`,P('#2a2620',0,.8));for(let i=0;i<26;i++)ellipse(c,-84+((i*37)%100)/100*170,-14+((i*53)%100)/100*26,3,2.2,P('#2a2620',0,.75));}
 if(id==='cookiecutter_shark')path(c,'M62 -34 L70 -34 L72 30 L64 30Z',P('#1c1a18',0,.8));
 if(id==='ghost_shark')for(let i=0;i<34;i++)ellipse(c,-84+((i*37)%100)/100*170,-24+((i*53)%100)/100*32,1.8,1.5,P('#ffffff',0,.75));
 path(c,d,null,P(a,-.38,.2),.45);
 path(c,'M44 -6 Q-30 -11 -86 1',null,P(b,.12,.3),.55);
 if(id!=='whale_shark')path(c,pores,null,P(a,-.6,.65),.7);
 c.restore();
}
function shark(c,res,p,P,low){
 if(res.species==='catshark'||res.species==='pyjama_shark'||res.species==='horned_shark'){catshark(c,res,p,P,low);return;}
 if(res.species==='ghost_shark'){ratfish(c,res,p,P,low);return;}
 const id=res.species,a=res.colors.primary,b=res.colors.secondary,s=swing(p,5);
 // Shark fins are skin over cartilage, so they are solid: darker at the root, the body colour at the tip; fins under the
 // body are in its shadow and darken toward the tip instead (2026-11-13).
 const sharkFin=(x0,y0,x1,y1,under)=>{const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,P(a,under?-.16:-.04));g.addColorStop(1,P(a,under?-.34:.14,.97));return g;},finEdge=P(a,-.42,.6);
 const tiger=id==='tiger_shark',th=id==='thresher_shark'||id==='bigeye_thresher'||id==='pelagic_thresher',big=id==='bigeye_thresher',saw=id==='sawfish'||id==='sawshark',whale=id==='whale_shark',dog=id==='spiny_dogfish',hex=id==='bluntnose_sixgill_shark'||id==='sevengill_shark',nv=variantOf(res);
 const lemon=id==='lemon_shark';
 // Thresher (2026-11-14): the upper tail lobe is as long as the body, a curved scythe with a small notch at its tip, and as dark as the
 // back, not a pale paddle. Whale shark: a big half-moon tail with a strong lower lobe.
 const tail=th?`M-60 -10 C-100 -30 -150 -48 -206 ${-76+s} Q-222 ${-86+s} -234 ${-90+s} Q-228 ${-80+s} -218 ${-72+s} C-168 -34 -124 -8 -86 8 L-118 34 Q-104 30 -89 22 Z`:whale?`M-77 0 L-142 ${-60+s} Q-120 -17 -101 2 L-134 ${44+s} L-97 22 Z`:`M-77 0 L-137 ${-55+s} Q-119 -17 -102 2 L-132 ${37+s} L-98 22 Z`;
 {const g=th?c.createLinearGradient(-150,-60,-142,-12):c.createLinearGradient(-100,40,-100,-55);if(th){g.addColorStop(0,P(a,-.2));g.addColorStop(1,P(a,-.34));}else{g.addColorStop(0,P(a,-.2));g.addColorStop(1,P(a,0,.97));}path(c,tail,g,finEdge,.7);}
 // A great white's dorsal fin carries its own nicks on the trailing edge (render/variation.js).
 if(id==='great_white_shark'&&nv&&!low){const edge=nickedEdge(nv,[-20,-12],[-15,-65],[4,-67],[.95,.3],5);path(c,`M-20 -12 ${edge.map(([x,y])=>`L${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')} Q1 -38 25 -14 Z`,sharkFin(3,-23,-3,-66),finEdge,.7);}
 // Six- and sevengill sharks have one back fin, far back near the tail (2026-11-13). A whale shark's sits behind the middle of its
 // back, lower and broader than a hunter's (2026-11-14).
 else if(whale)path(c,'M-50 -20 Q-44 -56 -28 -60 Q-26 -38 -4 -24 Z',sharkFin(-26,-24,-34,-58),finEdge,.7);
 else if(!hex)path(c,'M-20 -12 Q-15 -65 4 -67 Q1 -38 25 -14 Z',sharkFin(3,-23,-3,-66),finEdge,.7);
 // A thresher's pectoral fins are long, curved blades (2026-11-14).
 path(c,th?'M31 9 Q14 48 -20 60 Q-2 42 6 13 Z':'M30 9 Q8 46 -14 47 L6 13 Z',farPalette(P)(a,-.05));
 path(c,'M-55 5 L-63 32 L-37 8 Z',farPalette(P)(a,0));
 let d=hex?'M-88 0 Q-30 -32 50 -26 Q90 -22 100 -8 Q104 4 92 13 Q40 28 -30 18 L-88 5Z':saw?'M-84 0 Q-20 -30 62 -16 L81 -6 L81 9 Q6 25 -84 5Z':whale?'M-86 0 Q-38 -34 30 -31 Q82 -27 106 -15 Q114 -10 114 -3 L113 9 Q82 32 8 26 L-86 6Z':th?'M-88 0 Q-24 -36 46 -25 Q82 -19 98 -5 Q101 2 92 8 Q62 22 30 25 Q-24 26 -88 5Z':lemon?'M-88 0 Q-26 -36 50 -25 Q90 -20 100 -7 Q104 2 96 10 Q60 26 22 26 Q-30 25 -88 5Z':tiger?'M-88 0 Q-30 -34 55 -26 Q101 -24 104 -6 Q110 10 89 19 Q30 35 -35 17 L-88 5Z':'M-88 0 Q-23 -38 51 -22 Q86 -14 104 -2 Q82 14 48 24 Q-20 27 -88 5Z';
 const body=path(c,d,grad(c,P,a,b),P(a,-.3),.8);
 path(c,th?'M40 11 Q24 52 -12 66 Q6 46 11 15 Z':'M39 11 Q17 53 -4 49 L11 15 Z',sharkFin(25,13,th?-6:1,th?62:50,true),finEdge,.7);
 if(id==='sawshark')for(const dy of [0,3])path(c,`M${128+dy} 2 q-2 9 1 ${16+dy}`,null,P(a,-.1),1.4);
 if(saw){path(c,'M75 -6 L173 -3 L173 3 L76 8Z',P(a,.15));teeth(c,P,{x0:80,y0:-5.6,x1:172,y1:-3.1,upper:false},{type:'triangle',size:6,color:'#e5dbc2',gum:false});teeth(c,P,{x0:80,y0:7.6,x1:172,y1:3.1},{type:'triangle',size:6,color:'#e5dbc2',gum:false});}
 if((id==='blacktip_reef_shark'||id==='baby_shark')){path(c,'M-14 -50 L4 -67 L-1 -48Z',P('#1c2b2e'));path(c,'M-128 -46 L-137 -55 L-122 -25Z',P('#1c2b2e'));}
 // A lemon shark's second back fin is nearly as big as its first, the easiest way to tell one (2026-11-14).
 path(c,hex?'M-68 -12 Q-62 -46 -46 -46 L-34 -12Z':lemon?'M-66 -10 Q-62 -40 -51 -46 Q-50 -28 -36 -13Z':whale?'M-76 -8 Q-72 -24 -66 -25 L-60 -8Z':'M-61 -12 Q-55 -30 -48 -30 L-39 -12Z',sharkFin(-50,-12,-51,hex||lemon?-46:-30),finEdge,.6);
 if(!low){
 skin(c,body,P,a,res.seed,80);sharkSkin(c,body,P,a,b,id,nv);
 // A whale shark's three ridges along each side (2026-11-14): lit on top, shadowed beneath.
 if(whale){c.save();c.clip(body);for(let j=0;j<3;j++){const y0=-14+j*8,y1=-21+j*8,y2=-18+j*7.5;path(c,`M-76 ${y0+1.3} Q2 ${y1+1.3} 88 ${y2+1.3}`,null,P(a,-.4,.4),1.6);path(c,`M-76 ${y0} Q2 ${y1} 88 ${y2}`,null,P('#d4e2da',0,.46),.9);}for(let i=0;i<13;i++)path(c,`M${-60+i*11} -27 Q${-63+i*11} -6 ${-60+i*11} 12`,null,P('#dddcca',0,.26),.7);// Each whale shark's spots are its own, as researchers identify them (render/variation.js); variant 0 is the old pattern.
 const ws=nv*2.399,wa=1+nv*.18;for(let row=-3;row<3;row++)for(let i=0;i<19;i++){if(nv&&((i*5+row*7+nv*3)%13===0))continue;const jx=Math.sin(i*7.1+row+ws)*2*wa,jy=Math.sin(i*3.3+row*2+ws*1.3)*1.6*wa,sz=1.05+((i+row*3+nv)&3)*.22;ellipse(c,-67+i*9.4+jx,row*7.4+(i%2)*2.4+jy,sz,sz*.86,P('#dddcca',0,.82));}for(let i=0;i<22;i++)ellipse(c,66+(i%7)*6+(i%2)+(nv?Math.sin(i*2.1+ws)*1.5:0),-21+Math.floor(i/7)*7+(i%3)+(nv?Math.sin(i*1.3+ws)*1.2:0),.7,.6,P('#dddcca',0,.7));c.restore();}
 if((id==='blacktip_reef_shark'||id==='baby_shark')){path(c,'M-14 -50 L4 -67 L-1 -48Z',P('#1c2b2e'));path(c,'M-128 -46 L-137 -55 L-122 -25Z',P('#1c2b2e'));}
 if(dog){c.save();c.clip(body);for(let i=0;i<22;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-78+(u-Math.floor(u))*150,-18+(v-Math.floor(v))*20,1.6,1.4,P('#f1efe6',0,.9));}c.restore();for(const [x,y] of [[-18,-14],[-58,-12]])path(c,`M${x} ${y} L${x+2} ${y-17} L${x+5} ${y}Z`,P('#e8e2d0'),P(a,-.5,.6),.5);}
 // The broadnose sevengill's scattering of small black and pale spots.
 if(id==='sevengill_shark'){c.save();c.clip(body);for(let i=0;i<46;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-84+(u-Math.floor(u))*176,-28+(v-Math.floor(v))*40,1.3,1.1,P(i%4?'#1c1c18':'#f2efe4',0,.8));}c.restore();}
 if(id==='tiger_shark'){c.save();c.clip(body);for(let i=0;i<15;i++){const x=-72+i*10,l=14+(i*7)%13;path(c,`M${x} -29 q-4 ${l*.5} 2 ${l}`,null,P('#344d49',0,.62),2.4);if(i%2)path(c,`M${x+4} ${-26+l} q-1 5 1 9`,null,P('#344d49',0,.5),1.8);}for(let i=0;i<16;i++)ellipse(c,64+(i%6)*6+(i%2),-20+Math.floor(i/6)*6+(i%3),1.1,.9,P('#344d49',0,.55));c.restore();}
 for(let i=0;i<(id==='sevengill_shark'?7:hex?6:5);i++)path(c,`M${48-i*5} -9 q-5.5 9.5 -.6 20 q-1.8 -10 .6 -20Z`,P(a,-.62,.92));
 if(id==='great_white_shark')teeth(c,P,{x0:67,y0:13.6,x1:88,y1:8.6,bend:.8},{type:'triangle',size:2.7,color:'#f1e9d6'});
 // A whale shark's mouth runs right across the front of its broad, flat head.
 if(whale)path(c,'M113.6 .6 Q104 5.6 88 8.4 Q103 8.8 113.4 5.4Z',P('#162428',0,.88));
 faceLine(c,P,whale?'M113.6 2.4 Q104 7.4 87 8.8':th?'M70 12 Q82 10 90 5':'M65 14 Q82 11 94 3',P('#213237'),1.3);
 if(!saw)ellipse(c,whale?110:tiger?97:th?93:96,whale?-2.5:-3.5,whale?1.4:1.7,.7,P(a,-.6,.8),-.2);
 path(c,'M-84 1 L-100 1',null,P(a,-.4,.55),1.4);
 if(id==='great_white_shark')path(c,'M72 -12 Q79 -14 85 -10',null,P(a,-.4,.7),.9);
 }
 // The bigeye thresher's eye is huge and reaches up onto the top of its head, with a deep groove above it running back to the gills.
 if(big)path(c,'M66 -20 Q56 -22 44 -14',null,P(a,-.5,.7),1.2);
 if(COMMUNITY_SPECIES[id]?.family!=='hammerhead')eye(c,saw?64:whale?96:big?77:78,whale?-6:big?-11:-7,P,whale?1.5:big?5.2:th?3:2,{iris:id==='lemon_shark'?'#6e6330':id==='bluntnose_sixgill_shark'?'#3fd08a':big?'#2a3e46':'#262f33'});
}
// Humpback (Megaptera novaeangliae), redrawn 2026-11-14: a stocky body with a narrow keeled tail stock; a flat head with rows of
// knobs (tubercles) and a jutting chin; a small fin on a hump; pleats down the throat; and the flippers that give it its name
// ("big wing"): a third of its length, pale, with a scalloped leading edge. The flukes have a ragged trailing edge.
function humpback(c,res,p,P,low){
 const a=res.colors.primary,b=res.colors.secondary,sw=swing(p,6),fl=Math.sin(p.swim*.7)*8;
 // Flukes, with the trailing edge scalloped.
 let fk=`M-126 1 Q-150 ${-20+sw} -178 ${-34+sw}`;for(let i=1;i<=5;i++){const u=i/5,x=-178+u*18,y=-34+u*35;fk+=` Q${(x-4+(i%2)*2).toFixed(1)} ${(y-4+sw).toFixed(1)} ${x.toFixed(1)} ${(y+sw).toFixed(1)}`;}
 for(let i=1;i<=5;i++){const u=i/5,x=-160-u*18,y=1+u*36;fk+=` Q${(x-4).toFixed(1)} ${(y-3+sw).toFixed(1)} ${x.toFixed(1)} ${(y+sw).toFixed(1)}`;}
 fk+=` Q-150 ${26+sw} -126 9Z`;
 path(c,fk,finFill(c,P,a,-128,4,-176,4),P(a,-.45,.6),.8);
 // The small fin, on its hump.
 path(c,'M-70 -22 Q-60 -30 -52 -38 Q-46 -42 -42 -38 Q-41 -31 -30 -27Z',finFill(c,P,a,-46,-24,-48,-40),P(a,-.4,.5),.6);
 const body=path(c,'M-136 3 Q-104 -18 -44 -33 Q14 -44 70 -33 Q112 -25 133 -10 Q141 -3 138 4 Q134 11 122 17 Q88 35 28 36 Q-42 34 -100 17 Q-124 11 -136 8Z',grad(c,P,a,b,-38,36),P(a,-.4),.7);
 c.save();c.clip(body);path(c,'M-96 19 Q8 38 136 6 L140 46 L-104 46Z',P(b,0,.9));
 if(!low)for(let i=0;i<7;i++)path(c,`M${-34+i*6} ${33-i*2.4} Q${62+i*2} ${37-i*2.9} ${130-i*1.6} ${12-i*1.3}`,null,P(a,-.2,.42),.8);c.restore();
 // Barnacles on the chin, and a scar or two.
 if(!low){skin(c,body,P,a,res.seed,70);
  // Knobs along the top of the head and on the jaw, each lit from above.
  for(let i=0;i<8;i++){const x=88+i*6.2,y=-29+i*2.5-(i%2)*1.2;ellipse(c,x,y+.7,2.3,1.8,P(a,-.3,.8));ellipse(c,x,y,2.1,1.6,P(a,.18,.95));}
  for(let i=0;i<5;i++){const x=98+i*8,y=-18+i*1.6;ellipse(c,x,y+.6,1.9,1.5,P(a,-.3,.7));ellipse(c,x,y,1.7,1.3,P(a,.16,.9));}
  for(let i=0;i<6;i++){const x=104+i*6,y=13-i*1.8;ellipse(c,x,y,1.7,1.3,P(a,.1,.9));}
  for(let i=0;i<14;i++){const u=Math.sin(i*12.9898+res.seed*.01)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=112+(u-Math.floor(u))*18,y=8+(v-Math.floor(v))*6-(x-112)*.25;ellipse(c,x,y,.9+(i%3)*.35,.75+(i%2)*.3,P('#d8d4c4',0,.85));}}
 eye(c,84,-3,P,1.7,{iris:'#2b2119'});faceLine(c,P,'M138 3 Q114 12 86 6',P(a,-.6),1.1);
 // The near flipper: long, pale, with knobs along its leading edge, beating slowly.
 const tip=[-44,84+fl];let w=`M64 13 Q26 ${30+fl*.4} ${tip[0]} ${tip[1]}`;
 for(let i=1;i<=7;i++){const u=i/7,x=tip[0]+u*(56-tip[0]),y=tip[1]+u*(25-tip[1])+Math.sin(u*Math.PI)*10;const mx=x-(56-tip[0])/14,my=y-(25-tip[1])/14+Math.sin(u*Math.PI)*1+3.2;w+=` Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;}
 w+=' Q66 22 64 13Z';
 const fg=c.createLinearGradient(60,14,-40,80);fg.addColorStop(0,P(a,-.05));fg.addColorStop(.28,P(b,-.04));fg.addColorStop(1,P(b,-.16));
 path(c,w,fg,P(a,-.35,.6),.8);
 if(!low)for(let i=0;i<5;i++)ellipse(c,30-i*14,32+i*9+fl*(.25+i*.12),1.8,1.3,P(a,-.1,.55));
}
function cetacean(c,res,p,P,low){
 if(res.species==='humpback_whale'){humpback(c,res,p,P,low);return;}
 if(res.species==='beluga'){beluga(c,res,p,P,low);return;}
 const id=res.species,a=res.colors.primary,b=res.colors.secondary,sp=id==='sperm_whale'||id==='white_whale',fin=id==='fin_whale'||id==='minke_whale',vq=id==='vaquita',beak=id==='spade_toothed_whale',sw=swing(p,5);
 const tailX=fin?-165:sp?-145:vq?-90:-140;
 path(c,`M${tailX+20} 0 Q${tailX-12} ${-20+sw} ${tailX-25} ${-13+sw} L${tailX-13} ${3+sw} L${tailX-24} ${20+sw} Q${tailX+6} ${14+sw} ${tailX+23} 6Z`,finFill(c,P,a,tailX+20,0,tailX-25,0));
 if(beak)path(c,'M-64 -20 Q-68 -42 -56 -44 L-42 -22Z',finFill(c,P,a,-54,-20,-60,-42),P(a,-.4),.6);
 else if(!sp)path(c,vq?'M-15 -17 L-17 -55 Q5 -41 10 -19Z':fin?'M-74 -20 Q-80 -47 -67 -50 L-47 -20Z':'M-21 -24 Q-26 -80 -11 -82 L16 -24Z',finFill(c,P,a,-2,-23,-14,-70));
 const body=path(c,sp?'M-131 0 Q-42 -39 117 -34 Q135 -31 135 0 L127 28 Q23 40 -70 18Z':fin?'M-157 1 Q-28 -43 89 -21 L135 -2 Q109 15 30 24 Q-56 26 -157 6Z':vq?'M-85 0 Q-58 -18 -16 -26 Q30 -33 62 -22 Q82 -14 86 -2 Q88 6 82 10 Q60 23 10 25 Q-46 21 -85 5Z':'M-124 0 Q-65 -40 45 -29 Q95 -25 108 0 Q99 23 34 29 Q-46 30 -124 6Z',id==='orca'?grad(c,P,a,a):grad(c,P,a,b),P(a,-.4),.7);
 if(id==='orca'){
 // An orca's white (2026-11-14): chin and throat, a narrow band down the belly, and the flank patch sweeping up behind the back fin
 // and pointing to the tail; the underside of the tail stock is black.
 c.save();c.clip(body);{const wg=c.createLinearGradient(0,-4,0,30);wg.addColorStop(0,P(b,.02));wg.addColorStop(1,P(b,-.2));path(c,'M104 8 Q80 18 52 17 Q30 20 8 24 Q-14 22 -30 19 L-40 40 L112 40Z',wg);path(c,'M-24 21 Q-30 4 -54 -2 Q-78 -6 -98 5 Q-78 7 -64 15 Q-50 24 -36 30Z',wg);}// Each orca's eye patch and saddle patch are its own (render/variation.js); variant 0 is the old shape.
 // Only at full art: small pictures are shared by every orca (pictures.js), so they keep the one look.
 const ov=low?0:variantOf(res),O=[[0,0,0,0,0,0],[1.5,.06,-4,2,3,0],[-1.5,-.05,5,-2,-2,1],[2.5,.1,-2,3,5,0],[-1,-.08,3,1,-3,1],[1,.03,-6,-1,2,0]][ov];
 ellipse(c,65,-13,16+O[0],6+O[0]*.25,P(b),-.12+O[1]);path(c,`M-66 -20 Q${-40+O[2]} ${-34-O[3]} ${-10+O[4]} -28 Q${-20+O[4]} ${-19+O[3]} -38 ${-15+O[3]*.5} Q-54 -13 -66 -20Z`,P('#8e9a9a',0,.9));
 // An "open" saddle: a dark notch running in from the saddle's top edge.
 if(O[5]){const u=.55,v=1-u,x=v*v*-66+2*v*u*(-40+O[2])+u*u*(-10+O[4]),y=v*v*-20+2*v*u*(-34-O[3])+u*u*-28;path(c,`M${(x-2).toFixed(2)} ${(y-1).toFixed(2)} q3 5 2 10 q2 -5 3 -10Z`,P(a,-.1));}c.restore();}
 // Vaquita (15 Nov 2026): deepest just behind its blunt, rounded head, as a porpoise is, not near the tail like a fish; a pale belly.
 if(vq){c.save();c.clip(body);path(c,'M84 6 Q60 14 20 14 Q-30 12 -70 6 L-70 40 L90 40Z',P(b,.06,.8));const ring=c.createRadialGradient(58,-6,2,58,-6,10);ring.addColorStop(0,P('#2f3f44'));ring.addColorStop(.7,P('#384b50',0,.9));ring.addColorStop(1,P('#384b50',0,0));c.fillStyle=ring;c.fillRect(46,-18,24,24);path(c,'M66 12 Q77 12 85 6',null,P('#33454a'),3.4);c.restore();}
 path(c,sp?'M58 18 Q23 52 10 39 L31 19 Z':fin?'M54 15 Q28 47 11 40 L30 16Z':vq?'M30 14 Q17 36 4 30 L12 15Z':id==='orca'?'M70 16 Q66 46 44 56 Q24 62 26 44 L40 18Z':'M44 18 Q28 62 2 47 L12 18Z',id==='orca'?P(a,-.02):finFill(c,P,a,28,17,8,46));
 if(sp&&!low){c.save();c.clip(body);for(let i=0;i<34;i++){const x=-128+i*4.4,l=10+(i*7)%14;path(c,`M${x} ${-20+(i*13)%18} q5 ${l*.5} 2 ${l}`,null,P(a,-.34,.42),1);}for(let i=0;i<6;i++)ellipse(c,-82+i*14,-20-(i*1.6),5,2.6,P(a,-.18,.8));c.restore();ellipse(c,126,-30,3,1.4,P(a,-.5,.8));}
 if(sp)teeth(c,P,{x0:64,y0:24.5,x1:122,y1:17.8,upper:false},{type:'peg',size:2.2,color:'#efe7cf'});
 if(id==='white_whale'&&!low){c.save();c.clip(body);for(let i=0;i<14;i++){const x=-60+((i*37)%100)*1.5,y=-24+((i*53)%100)*.4;path(c,`M${x} ${y} l${10+(i%3)*5} ${(i%2?-1:1)*(2+i%4)}`,null,P('#9aa0a0',0,.55),1.1);}for(let i=0;i<5;i++)path(c,`M${-20+i*14} ${-30+i*2} q4 6 2 12 M${-16+i*14} ${-30+i*2} q4 6 2 12`,null,P('#8c9292',0,.45),.9);c.restore();}
 if(!low){skin(c,body,P,a,res.seed,65);path(c,sp?'M49 26 L126 17':vq?'M70 11 Q79 11 86 5':'M67 11 Q86 15 103 5',null,P(a,-.55),1);
 if(sp){for(let i=0;i<7;i++)path(c,`M${-70+i*15} -23 q-4 16 2 39`,null,P(a,-.25,.45),1.4);for(let i=0;i<5;i++)path(c,`M${-97+i*12} -9 l5 -8 l6 7`,null,P(a,.15),2);c.save();c.clip(body);for(let i=0;i<16;i++)path(c,`M${-60+i*9} ${-8+(i%3)*5} q4 8 -1 ${12+(i%4)*2}`,null,P(a,-.3,.28),.7);for(let i=0;i<9;i++){const x=68+(i%5)*11+(i%2)*3,y=-24+Math.floor(i/5)*12+(i%3)*2;ellipse(c,x,y,2,1.6,P(b,0,.35));ellipse(c,x,y,1.2,.9,P(a,0,.9));}c.restore();path(c,'M124 -31 q4 -3 8 -1',null,P(a,-.55),1.4);teeth(c,P,{x0:60,y0:24.7,x1:122,y1:17.5,upper:false},{type:'peg',size:2,color:'#e7e1cf'});}
 if(id==='minke_whale')path(c,'M41 19 Q35 30 27 36 L23 33 Q30 27 34 18Z',P('#f2f0e8',0,.95));
 if(fin){for(let i=0;i<5;i++)path(c,`M111 ${3+i*2} Q42 ${20+i*2} 5 19`,null,P('#50616a',0,.5),.6);}}
 // The spade-toothed whale's short beak, the two flat teeth that give it its name, and the pale scars beaked whales carry.
 if(beak){path(c,'M100 -8 Q122 -6 132 0 Q122 7 100 9Z',grad(c,P,a,b,-8,9),P(a,-.45),.6);path(c,'M112 5 l2 -6 l3 6Z',P('#f2ecd8'),P('#8a8470',0,.6),.4);if(!low){c.save();c.clip(body);for(let i=0;i<9;i++){const x=-80+i*20,y=-20+(i*7)%22;path(c,`M${x} ${y} l${12+(i%3)*4} ${(i%2?-1:1)*3}`,null,P('#e8eae6',0,.55),1);}c.restore();}}
 eye(c,sp?67:vq?58:73,sp?9:-5,P,sp?1.7:1.8,{iris:'#2b2119'});
}
function fish(c,res,p,P,low){
 const id=res.species,a=res.colors.primary,b=res.colors.secondary,sw=swing(p,7);
 if(id==='ocean_sunfish'){
 path(c,'M-10 -36 Q-34 -98 -4 -98 L21 -35 M-8 28 L-12 87 Q11 98 23 27',P(a,-.15));
 const body=path(c,'M-61 -25 Q-51 -48 4 -46 Q62 -44 76 -9 L81 1 L72 10 Q49 53 -12 47 Q-47 44 -63 23 Q-49 12 -61 -1 Q-51 -14 -61 -25Z',grad(c,P,a,b));if(!low)skin(c,body,P,a,res.seed,100);
 // Ocean sunfish are blotched and mottled, each in its own way (render/variation.js); variant 0 stays plain.
 const fv=variantOf(res);if(!low&&fv){c.save();c.clip(body);for(let i=0;i<7+fv*2;i++){const q=i*2.399+fv*1.1,x=-48+((Math.sin(q*3.7)+1)/2)*118,y=-38+((Math.sin(q*5.3+fv)+1)/2)*78,r=4+((i*7+fv)%5)*1.6;ellipse(c,x,y,r*1.3,r,P(i%3?b:a,i%3?.12:-.18,.32),q);}c.restore();}eye(c,48,-9,P,3);ellipse(c,76,3,3,5,P('#33464b'));path(c,'M33 3 Q8 20 4 6Z',P(a,-.25));return;
 }
 const angel=id==='angelfish',lion=id==='lionfish',gold=id==='goldfish',betta=id==='betta',tuna=id==='bluefin_tuna'||id==='yellowfin_tuna',mand=id==='mandarinfish',koi=id==='koi',mahi=id==='mahi_mahi';
 // 2026-11-13 fish people were waiting for: their own bodies, tails, back fins, eyes and mouths.
 const NEWBODY={goliath_grouper:'M-56 0 Q-46 -34 10 -36 Q50 -34 68 -14 Q78 0 72 12 Q54 34 6 36 Q-42 30 -56 6Z',king_mackerel:'M-58 0 Q-36 -18 18 -18 Q58 -16 76 -4 Q78 2 74 5 Q54 16 12 16 Q-38 14 -58 4Z',
  opah:'M-50 0 Q-40 -46 10 -48 Q56 -44 66 -10 Q70 4 64 14 Q50 44 6 46 Q-40 40 -50 6Z',humphead_wrasse:'M-56 0 Q-46 -34 0 -38 Q34 -40 48 -46 Q66 -46 72 -26 Q76 -6 72 6 Q56 30 4 32 Q-40 28 -56 6Z',
  remora:'M-58 0 Q-40 -16 16 -16 Q56 -16 74 -6 Q78 0 74 4 Q54 12 12 13 Q-38 12 -58 4Z',
  // Tunas (15 Nov 2026): a spindle-shaped torpedo deepest a third of the way back, tapering to a very narrow tail stock.
  bluefin_tuna:'M-56 0 Q-40 -12 0 -26 Q40 -32 66 -14 Q78 -4 78 2 Q74 10 62 14 Q30 26 -6 22 Q-40 14 -56 4Z',yellowfin_tuna:'M-56 0 Q-40 -12 0 -24 Q40 -30 66 -13 Q78 -4 78 2 Q74 10 62 13 Q30 24 -6 20 Q-40 13 -56 4Z',deepsea_lizardfish:'M-58 0 Q-40 -14 10 -14 Q50 -14 70 -8 Q82 -4 82 0 Q80 6 66 8 Q40 12 10 12 Q-40 11 -58 4Z'};
 const tk={goliath_grouper:'round',humphead_wrasse:'round',deepsea_lizardfish:'small',sheepshead:'fork',remora:'fork',blue_green_chromis:'deep',king_mackerel:'deep',opah:'deep',achilles_tang:'lyre'}[id];
 const ownFin=['opah','goliath_grouper','remora','deepsea_lizardfish','king_mackerel','humphead_wrasse','sheepshead'].includes(id);
 const EYE={bluefin_tuna:[56,-7,2.6],yellowfin_tuna:[56,-7,2.6],goliath_grouper:[54,-12,2.4],humphead_wrasse:[52,-18,2.4],opah:[46,-14,3.8,'#e0b030'],remora:[56,-5,2.2],deepsea_lizardfish:[58,-6,3.2,'#c8d0b0'],king_mackerel:[56,-6,2.6]}[id];
 const MOUTH={bluefin_tuna:'M64 5 Q71 6 77 1',yellowfin_tuna:'M64 5 Q71 6 77 1',goliath_grouper:'M58 10 Q70 11 76 2',king_mackerel:'M60 4 Q70 4 76 0',opah:'M58 6 Q64 7 67 3',humphead_wrasse:'M60 10 Q70 12 76 4',remora:'M56 4 L78 1',deepsea_lizardfish:'M46 4 Q66 6 82 1'}[id];
 if(betta){const flow=Math.sin(p.swim)*7;for(let i=0;i<14;i++){const t=i/13,ang=-1.25+t*2.5;path(c,`M-40 ${Math.sin(ang)*8} Q-90 ${Math.sin(ang)*55+flow} ${-112-Math.cos(ang)*14} ${Math.sin(ang)*72+flow*1.4}`,null,P(i%2?b:a,i%3?.1:-.1,.85),9);}
 path(c,`M-30 -20 Q-5 ${-78+flow*.6} 35 -26Z`,P(b,0,.85));path(c,`M-30 18 Q-10 ${80+flow*.6} 30 22Z`,P(b,-.1,.85));}
 // A tuna's tail is a tall thin crescent; its second back fin and the fin under it are small sickles, the first back fin low and spiny.
 if(tuna){path(c,`M-52 -2 Q-66 ${-8+sw*.4} -86 ${-44+sw*.4} Q-76 ${-12+sw*.4} -73 ${2+sw*.4} Q-76 ${16+sw*.4} -86 ${48+sw*.4} Q-66 ${12+sw*.4} -52 6Z`,P(a,-.15),P(a,-.45),.6);path(c,'M-4 -22 Q4 -38 16 -44 Q12 -32 16 -25Z',P(a,-.05));path(c,'M-4 19 Q4 32 16 38 Q12 28 14 21Z',P(b,-.12));path(c,'M16 -22 L22 -36 L28 -31 L32 -37 L38 -30 L46 -32 L52 -20Z',P(a,-.1));}
 // The yellowfin's second dorsal and anal fins grow into long yellow sickles.
 if(id==='yellowfin_tuna'){path(c,`M-6 -20 Q-6 -52 ${-26+sw*.3} -68 Q-4 -54 12 -23Z`,P('#f2c230',0,.95),P('#a07a12',0,.5),.6);path(c,`M-6 17 Q-6 48 ${-26+sw*.3} 64 Q-4 50 12 20Z`,P('#f2c230',0,.95),P('#a07a12',0,.5),.6);}
 if(lion){path(c,'M6 5 Q84 18 55 81 Q-4 76 -39 39Z',P(b,0,.4),P(a),1);for(let i=0;i<11;i++){const x=-50+i*9;path(c,`M${x} -12 L${x-20} ${-65-(i%3)*8} L${x+8} -8Z`,P(b,0,.65),P(a,-.15),.6);}for(let i=0;i<10;i++){const a1=.25+i*.22;line(c,[[8,9],[10+Math.cos(a1)*74,15+Math.sin(a1)*64]],P(b,0,.85),3);}}
 // Angelfish (15 Nov 2026): tall back and belly fins sweeping up and back to long points, and two thread-like fins trailing below,
 // instead of two straight triangles.
 if(angel){const fw=Math.sin(p.swim)*3;path(c,`M30 -22 Q10 -48 ${-18+fw} -94 Q-22 -60 -34 -14Z`,grad(c,P,a,b,-94,0),P(a,-.35,.5),.6);path(c,`M26 20 Q8 48 ${-16+fw} 94 Q-20 60 -32 12Z`,grad(c,P,b,a,0,94),P(a,-.35,.5),.6);for(const dx of [0,4])path(c,`M${22+dx} 24 Q${16+dx} 54 ${2+dx+fw} 92`,null,P(a,-.1,.85),1.4);}
 if(mahi){path(c,`M-46 0 L-92 ${-36+sw} Q-80 ${-8+sw*.5} -74 ${sw*.5} Q-80 ${8+sw*.5} -92 ${36+sw} Z`,grad(c,P,a,b));path(c,'M-48 -8 Q-10 -26 40 -32 Q58 -36 66 -32 L64 -24 Q20 -22 -44 -2Z',P('#2c6fb8',0,.9));path(c,'M-46 8 Q-20 16 0 18 L-2 24 Q-24 22 -46 12Z',P('#2c6fb8',0,.85));}
 else if(!tuna&&!betta&&!tk)path(c,`M-44 0 Q-70 ${-20+sw} -88 ${-26+sw} Q-76 ${sw} -86 ${27+sw} L-45 10Z`,grad(c,P,a,b));
 if(tk==='round')path(c,`M-50 -6 Q-82 ${-34+sw} -98 ${sw} Q-82 ${34+sw} -50 6Z`,grad(c,P,a,b),P(a,-.35),.6);
 if(tk==='deep')path(c,`M-46 -2 Q-70 ${-14+sw} -92 ${-34+sw} Q-78 ${-8+sw} -72 ${sw} Q-78 ${8+sw} -92 ${34+sw} Q-70 ${14+sw} -46 2Z`,id==='opah'?P('#d8322e',0,.95):grad(c,P,a,b),P(a,-.35),.6);
 if(tk==='fork')path(c,`M-46 -2 L-84 ${-26+sw} L-70 ${sw} L-84 ${26+sw} L-46 2Z`,grad(c,P,a,b),P(a,-.35),.6);
 if(tk==='lyre'){path(c,`M-46 -3 Q-74 ${-20+sw} -90 ${-30+sw} Q-80 ${sw} -90 ${30+sw} Q-74 ${20+sw} -46 3Z`,grad(c,P,a,a),P(a,-.35),.6);path(c,`M-84 ${-20+sw} Q-78 ${sw} -84 ${20+sw}`,null,P('#ff7a1e',0,.9),3);}
 if(tk==='small')path(c,`M-50 -2 L-76 ${-16+sw} Q-70 ${sw} -76 ${16+sw} L-50 2Z`,grad(c,P,a,b),P(a,-.35),.6);
 if(id==='guppy')path(c,`M-44 -4 Q-96 ${-50+sw} -112 ${sw} Q-96 ${50+sw} -44 6Z`,grad(c,P,b,a,-40,40),P(a,-.3),.6);
 if(!tuna&&!betta&&gold)path(c,`M-44 6 Q-62 ${48+sw} -96 40 Q-62 22 -55 -3Z`,P(a,.2,.75));
 if(koi||id==='atlantic_salmon'||id==='common_snook'||id==='spotted_seatrout'||(id==='goliath_tigerfish'||id==='african_tigerfish'))path(c,koi?'M-34 -20 Q-14 -38 26 -24 L30 -20Z':'M-10 -22 Q0 -40 18 -24Z',P(a,.05,.85));else if(id==='grayling'){path(c,'M-34 -20 Q-30 -66 4 -62 Q24 -56 30 -24Z',P('#7a4a8a',0,.88),P('#4a2a5a',0,.6),.8);if(!low)for(let i=0;i<6;i++){path(c,`M${-28+i*9} -24 L${-26+i*9} ${-58+Math.abs(i-2)*2}`,null,P('#d84a6a',0,.6),1);ellipse(c,-20+i*8,-40+(i%2)*6,1.8,1.4,P('#e85a7a',0,.85));}}
 else if(gold)path(c,'M-32 -30 Q-16 -68 22 -36 L32 -28Z',P(a,.05,.85));else if(!angel&&!lion&&!mahi&&!ownFin&&!tuna)path(c,'M-35 -21 Q-22 -59 13 -32 L30 -20Z',P(a,.05,.85));
 if(id==='goliath_grouper'||id==='humphead_wrasse'||id==='sheepshead')path(c,'M-40 -26 L-36 -40 L-28 -32 L-22 -44 L-14 -36 L-8 -46 L0 -38 L6 -46 L14 -38 Q30 -44 36 -34 L40 -30Z',P(a,-.08,.9),P(a,-.4),.6);
 if(id==='opah'){path(c,`M-12 -40 Q-14 -74 ${-30+sw*.3} -92 Q6 -70 20 -42Z`,P('#d8322e',0,.95));path(c,'M-44 -28 Q-20 -40 -6 -42 L-4 -30 Q-24 -22 -40 -12Z',P('#d8322e',0,.9));path(c,'M-40 26 Q-20 36 -4 38 L-2 28 Q-22 22 -38 12Z',P('#d8322e',0,.9));}
 if(id==='remora'){path(c,'M-50 -10 Q-20 -20 10 -15 L10 -10Z',P(a,-.05,.9));path(c,'M-50 8 Q-20 18 6 13 L6 8Z',P(a,-.05,.9));}
 if(id==='deepsea_lizardfish')path(c,'M-6 -13 L4 -28 L14 -13Z',P(a,-.05,.9),P(a,-.4),.5);
 if(id==='king_mackerel'){path(c,'M-4 -17 L10 -30 L24 -17Z',P(a,-.05,.9));for(let i=0;i<6;i++){const x=-50+i*6;path(c,`M${x} -9 l3 -5 l3 5Z M${x} 8 l3 5 l3 -5Z`,P(a,-.05));}}
 const body=path(c,NEWBODY[id]?NEWBODY[id]:mahi?'M-50 0 Q-30 -22 28 -28 Q54 -32 66 -31 Q73 -18 72 -4 Q70 6 60 10 Q30 22 -10 20 Q-36 16 -50 6Z':koi?'M-58 0 Q-44 -24 14 -24 Q54 -22 72 -2 Q66 12 46 17 Q10 22 -28 18 Q-50 14 -58 5Z':angel?'M-46 0 Q-32 -32 6 -34 Q40 -30 56 -6 L58 2 Q40 26 6 32 Q-32 30 -46 0Z':id==='piranha'?'M-51 0 Q-35 -45 15 -34 Q54 -30 65 -5 L55 17 Q25 46 -21 30Z':gold?'M-48 0 Q-38 -41 12 -35 Q48 -32 62 -11 Q70 0 64 9 Q46 35 -2 34 Q-34 29 -48 6Z':id==='atlantic_salmon'||id==='common_snook'||id==='spotted_seatrout'||id==='grayling'||(id==='goliath_tigerfish'||id==='african_tigerfish')?'M-56 0 Q-40 -22 10 -24 Q50 -22 68 -6 Q73 1 67 7 Q48 20 0 21 Q-40 18 -56 5Z':'M-52 0 Q-39 -36 16 -28 Q52 -25 65 -7 Q71 1 66 7 Q52 28 -1 29Z',grad(c,P,a,b),P(a,-.3),.8);
 // The tuna's finlets: little yellow, dark-edged flags along the top and bottom of the tail stock.
 if(tuna)for(let i=0;i<7;i++){const t=.1+i*.085,u=1-t,xt=u*u*-56+2*u*t*-40,yt=u*u*0+2*u*t*-12+t*t*-26,yb=u*u*4+2*u*t*14+t*t*22;const X=xt+t*t*0;path(c,`M${X} ${yt+.8} l1.6 -4 l2.8 4Z M${X} ${yb-.8} l1.6 4 l2.8 -4Z`,P('#f0c63a'),P('#3a3418',0,.6),.4);}
 if(!low){skin(c,body,P,a,res.seed,100);fishScales(c,body,P,a);c.save();c.clip(body);
 if(tuna){path(c,'M-56 1 Q0 -6 78 0',null,P(b,.2,.35),2.4);for(let i=0;i<8;i++)for(let j=0;j<3;j++)ellipse(c,-30+i*9,8+j*4,.9,1.4,P('#ffffff',0,.35));}
 if(id==='yellowfin_tuna')path(c,'M-54 -2 Q0 -12 66 -5',null,P('#f2c230',0,.6),3.2);
 if(id==='zebrafish')for(let i=0;i<5;i++)path(c,`M-60 ${-14+i*7} Q0 ${-18+i*7} 74 ${-8+i*5}`,null,P('#2b3a6a',0,.85),3.2);
 if(id==='lanternfish')for(let i=0;i<14;i++)ellipse(c,-44+i*7.5,12+Math.sin(i*.5)*3,1.7,1.7,P('#9fe9ff',0,.95));
 if(id==='mudskipper')for(let i=0;i<26;i++)ellipse(c,-50+((i*37)%100)/100*118,-22+((i*53)%100)/100*40,1.4,1.2,P('#2b2a20',0,.7));
 if(angel||lion)for(let i=0;i<6;i++)path(c,`M${-40+i*18} -42 q-18 40 -1 86`,null,P(lion?b:'#273840',0,.8),lion?7:10);
 if(id==='tarpon')for(let row=0;row<4;row++)for(let col=0;col<8;col++){const x=-40+col*13+(row%2)*6,y=-18+row*10;path(c,`M${x} ${y-5} q8 5 0 10`,null,P('#ffffff',0,.55),1.4);}
 if(id==='neon_tetra'){path(c,'M-48 -4 L60 -8 L60 -2 L-48 2Z',P('#3fd6ff'));path(c,'M-50 6 Q0 14 30 10 L30 22 Q-20 26 -50 14Z',P('#e8322e'));}
 if(id==='bluegill')for(let i=0;i<6;i++)path(c,`M${-40+i*16} -28 q-4 28 0 56`,null,P('#2f4a46',0,.55),5);
 if(id==='palette_surgeonfish')path(c,'M-46 -6 Q-10 -30 34 -20 Q50 -18 56 -6 Q30 -14 8 -8 Q-12 2 -2 14 Q-30 8 -46 -6Z',P('#141820'));
 if(id==='red_tail_catfish')path(c,'M-52 8 Q0 16 60 10 L64 30 L-52 30Z',P('#f2efe6',0,.95));
 if(id==='armoured_searobin')for(let i=0;i<10;i++)path(c,`M${-44+i*10} -24 l5 -4 l5 4`,null,P(a,-.35),1.6);
 if(mand)for(let i=0;i<9;i++)path(c,`M${-45+i*13} ${-20+(i%3)*6} q8 10 0 22 q-8 10 2 18`,null,P(b,.1,.9),4);
 if(id==='atlantic_salmon')for(let i=0;i<22;i++)path(c,`M${-35+(i*37)%90} ${-22+(i*13)%20} l3 2 l-3 2 l-3 -2Z`,P('#2b3236',0,.7));
 // Spotted seatrout: round black spots over the back, tail and back fins; grayling: scattered small dark spots.
 if(id==='spotted_seatrout'||id==='grayling')for(let i=0;i<(id==='grayling'?14:34);i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-50+(u-Math.floor(u))*104,-20+(v-Math.floor(v))*(id==='grayling'?24:16),1.6,1.4,P('#1d1c1e',0,.85));}
 // Goliath tigerfish: dark lines along a silver body, and long fangs that show even with the mouth shut.
 if((id==='goliath_tigerfish'||id==='african_tigerfish'))for(let i=0;i<5;i++)path(c,`M-54 ${-12+i*6} Q0 ${-16+i*6} 64 ${-8+i*4}`,null,P('#22262a',0,.7),1.2);
 // Snook: the black lateral line running from gill to tail, unmistakable.
 if(id==='common_snook')path(c,'M-56 2 Q0 -3 40 -3 Q56 -3 60 -5',null,P('#121416',0,.92),1.8);
 if(id==='slippery_dick')for(const y of [-6,8])line(c,[[-50,y],[66,y-3]],P('#3c5f4c',0,.75),3.5);
 if(id==='northern_pike')for(let i=0;i<30;i++)ellipse(c,-40+(i*29)%100,-18+(i*17)%34,3,1.6,P('#e9e4b6',0,.55));
 // Koi: patches of the second colour (hi), a few small black marks (sumi) and a pearly sheen along the back.
 if(koi){for(const [x,y,rx,ry,q] of [[-32,-8,15,9,.25],[4,-13,17,8,-.15],[40,-10,12,7,.35],[-8,7,10,5,.1]])ellipse(c,x,y,rx,ry,P(b,0,.95),q);
  for(const [x,y,r2] of [[-16,-20,3.4],[24,-4,2.6],[-40,4,2.2],[52,-20,2]])ellipse(c,x,y,r2*1.3,r2,P('#1c1c1f',0,.85));ellipse(c,0,-22,46,4,P('#ffffff',0,.28));}
 // Goliath grouper: big dark blotches and small black spots over a heavy body.
 if(id==='goliath_grouper'){for(const [x,y,rx,ry] of [[-34,-12,12,9],[-8,-18,11,8],[18,-14,10,9],[-20,10,12,7],[10,14,10,6],[40,-4,8,7]])ellipse(c,x,y,rx,ry,P(a,-.35,.5),.3);for(let i=0;i<40;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-50+(u-Math.floor(u))*120,-30+(v-Math.floor(v))*60,1.1,1,P('#1d1a16',0,.7));}}
 // Achilles tang: an orange teardrop on the tail base and a pale bar at the gill.
 if(id==='achilles_tang'){ellipse(c,-38,0,13,8,P('#ff7a1e'));ellipse(c,-28,0,7,5,P('#ff7a1e'));path(c,'M30 -24 Q24 0 30 26',null,P('#f4f6f8',0,.85),4);}
 if(id==='blue_green_chromis')ellipse(c,6,-10,46,6,P('#e8fffa',0,.25));
 // Opah: white spots all over a silver-blue and pink body.
 if(id==='opah')for(let i=0;i<42;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-46+(u-Math.floor(u))*108,-44+(v-Math.floor(v))*88,2.2,2,P('#f6f4ee',0,.85));}
 // Sheepshead: five or six bold black bars.
 if(id==='sheepshead')for(let i=0;i<6;i++)path(c,`M${-42+i*16} -32 q-4 32 0 64`,null,P('#17181c',0,.85),5.5);
 // Humphead wrasse: wavy lines over the face and two dark lines behind the eye.
 if(id==='humphead_wrasse'){for(let i=0;i<6;i++)path(c,`M${40+i*5} -30 q-3 4 0 8 q3 4 0 8 q-3 4 0 8`,null,P('#1d3c38',0,.5),1.1);path(c,'M56 -14 L74 -18 M56 -10 L74 -8',null,P('#1d2a28',0,.7),1.4);}
 // Remora: the dark stripe along the side, edged white.
 if(id==='remora'){path(c,'M-58 0 Q0 -2 74 -2',null,P('#f4f6f8',0,.8),6);path(c,'M-58 0 Q0 -2 74 -2',null,P('#1d2024',0,.95),3.5);}
 if(id==='deepsea_lizardfish')for(let i=0;i<4;i++)ellipse(c,-40+i*24,-12,8,4,P(a,-.3,.5));
 if(id==='king_mackerel')path(c,'M-56 -4 Q-20 -6 6 -6 Q20 4 74 -2',null,P(a,-.35,.8),1);
 // Mahi-mahi: a green-gold body with electric blue speckles, gold belly and an iridescent back.
 if(mahi){ellipse(c,4,12,58,9,P(b,.15,.85));for(let i=0;i<34;i++)ellipse(c,-44+((i*37)%100),-22+((i*53)%100)/100*28,1.4,1.2,P('#2c6fb8',.2,.9));ellipse(c,10,-20,52,4,P('#9ff0ff',0,.25));}
 c.restore();}
 path(c,'M26 3 Q1 24 -2 15 L14 0Z',P(a,.15,.65));if(!low){for(let i=0;i<6;i++)line(c,[[20,3],[i*4-3,17-i]],P(b,0,.55),.5);path(c,'M31 -21 Q18 -2 29 17',null,P(a,-.4),1.1);if(!tuna)for(let i=0;i<8;i++)path(c,`M-47 5 Q-66 ${-14+i*5} -85 ${-23+i*7}`,null,P(b,0,.42),.7);}
 if(id==='bluegill'){ellipse(c,30,-6,6,8,P('#141820'));}
 if(id==='palette_surgeonfish')path(c,`M-44 0 L-82 ${-24+sw} L-74 ${sw} L-82 ${24+sw}Z`,P('#f2c94c'));
 if((id==='goliath_tigerfish'||id==='african_tigerfish'))path(c,`M-44 0 L-88 ${-28+sw} L-74 ${sw} L-88 ${28+sw}Z`,P('#d8462e',0,.92),P('#7a2416',0,.6),.6);
 if(id==='red_tail_catfish'){path(c,`M-44 0 L-86 ${-26+sw} L-78 ${sw} L-86 ${26+sw}Z`,P('#d8322e'));for(const [dx,dy,l] of [[62,6,40],[60,10,34],[58,14,26]])path(c,`M${dx} ${dy} q${l*.5} ${l*.3} ${l} ${l*.2}`,null,P('#2a2626'),1.6);}
 if(id==='armoured_searobin')path(c,'M10 8 Q-14 50 -40 44 Q-20 30 -4 10Z',P('#e8822e',0,.85),P('#9a4a1e'),1);
 if(id==='tarpon')path(c,'M56 4 Q64 -6 70 -2',null,P(a,-.5),1.6);
 if(id==='goliath_grouper')path(c,'M58 10 Q70 11 76 2',null,P(a,-.45),3);
 if(id==='humphead_wrasse')path(c,'M60 10 Q70 12 76 4',null,P(b,.05),4);
 if(id==='opah'){path(c,'M32 2 Q12 0 -18 10 Q-22 16 -16 18 Q10 16 32 10Z',P('#d8322e'),P('#8a1a14',0,.6),.6);path(c,'M58 6 Q64 7 67 3',null,P('#d8322e'),2.4);}
 if(id==='sheepshead'&&!low)for(let i=0;i<4;i++)ellipse(c,61+i*2.2,6.6-i*.9,1.1,1.6,P('#f4efe0'));
 // The remora's sucking disc on top of its head, ridged like a grip, and its jutting lower jaw.
 if(id==='remora'){path(c,'M22 -18 Q44 -24 66 -12 Q44 -14 22 -12Z',P(a,-.15),P(a,-.45),.6);if(!low)for(let i=0;i<9;i++)line(c,[[26+i*4.4,-19+i*.7],[26+i*4.4,-13]],P(a,-.45,.8),.7);}
 if(id==='deepsea_lizardfish'&&!low){teeth(c,P,{x0:52,y0:3.6,x1:80,y1:1.2},{type:'needle',size:2,color:'#efe9d6'});}
 {const ey=EYE;eye(c,ey?ey[0]:angel?39:mahi?56:koi?50:44,ey?ey[1]:mahi?-12:-8,P,ey?ey[2]:id==='tarpon'?3.2:2.5,ey&&ey[3]?{iris:ey[3]}:undefined);}
 path(c,MOUTH?MOUTH:mahi?'M62 6 Q68 6 72 2':koi?'M60 6 Q68 7 72 2':gold?'M60 6 Q65 7.5 68 3':angel?'M49 4 Q54 4.5 57 0.5':'M53 8 Q62 8 67 3',null,P(a,-.6),1.2);
 if(gold&&!low){ellipse(c,30,-4,22,14,P('#fff3c4',0,.16));ellipse(c,8,-26,30,4,P('#ffffff',0,.22));}
 // Koi have two pairs of barbels at the corners of the mouth.
 if(koi)crisp(c,(c)=>{for(const [dx,dy,l] of [[68,4,10],[66,7,8]])path(c,`M${dx} ${dy} q${l*.3} ${l*.6} ${-l*.2} ${l}`,null,P(a,-.25),1.3);});
 if((id==='goliath_tigerfish'||id==='african_tigerfish')&&!low){teeth(c,P,{x0:52,y0:6.5,x1:67,y1:3},{type:'fang',size:3.2,color:'#f2ecd8',gum:false});teeth(c,P,{x0:52,y0:8,x1:66,y1:5,upper:false},{type:'fang',size:2.8,color:'#f2ecd8',gum:false});}
 // Cubera snapper: thick lips and big canine teeth at the front of the jaws.
 if(id==='cubera_snapper'&&!low){path(c,'M53 8 Q62 8 67 3',null,P(a,-.2),3.2);teeth(c,P,{x0:58,y0:6.5,x1:66,y1:4},{type:'fang',size:2.6,color:'#f0e7cd',gum:false});}
 if(id==='piranha'&&!low)teeth(c,P,{x0:52.5,y0:7,x1:63.5,y1:6.2},{type:'triangle',size:2.3,color:'#f0e7cd',gum:false});
 if(COMMUNITY_SPECIES[id].helmet)helmet(c,48,-3,35,P,true);
}
const armFan=(p)=>p.effort===undefined?1:1-.34*pulseAt(p.swim,'jet');
const armTrail=(p,i)=>p.effort===undefined?Math.sin(p.swim+i)*7:Math.sin(p.swim*.5-i*.9)*9;
// Arms redrawn 15 Nov 2026: each thick at the base and tapering to a fine tip that curls, not a paddle, with a web of skin joining the
// arms near the head, as a real octopus has; suckers along each arm.
function commonOctopus(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,mimic=r.species==='mimic_octopus';
 const arms=Array.from({length:8},(_,i)=>{const sy=(i-3.5)*3,ex=60+(i%4)*15,ey=(i-3.5)*17*armFan(p)+armTrail(p,i),cy=sy*3,curl=(i<4?-1:1)*(i%2?1:-.8);
  const bz=(t)=>{const u=1-t;return[u*u*u*2+3*u*u*t*36+3*u*t*t*(ex-23)+t*t*t*ex,u*u*u*sy+3*u*u*t*cy+3*u*t*t*(ey-5)+t*t*t*ey];};
  const pts=[];for(let j=0;j<=14;j++){const t=j/14,[x,y]=bz(t);pts.push([x,y,6.6*(1-t*.72)+.8]);}
  const [x1,y1]=bz(1),[x0,y0]=bz(.96);let th=Math.atan2(y1-y0,x1-x0),x=x1,y=y1;
  for(let j=1;j<=8;j++){th+=curl*.44;const st=5.6*(1-j/11);x+=Math.cos(th)*st;y+=Math.sin(th)*st;pts.push([x,y,Math.max(.45,2-j*.19)]);}
  return{S:spineOf(pts),bz};});
 // The web between the arms, from the top of the head round to the bottom, scalloped between arm bases.
 {const w=arms.map((m)=>m.bz(.3));let d=`M4 -10 Q${w[0][0]-6} ${w[0][1]-8} ${w[0][0]} ${w[0][1]}`;for(let i=1;i<8;i++){const [xa,ya]=w[i-1],[xb,yb]=w[i];d+=` Q${(xa+xb)/2-7} ${(ya+yb)/2} ${xb} ${yb}`;}d+=` Q${w[7][0]-6} ${w[7][1]+8} 4 14Z`;path(c,d,P(a,-.06,.9),P(a,-.3,.6),.6);}
 for(const {S} of arms){const n=S.n;
  path(c,S.outline(),grad(c,P,a,b,-35,45),P(a,-.25),.6);
  if(mimic)for(let j=1;j<14;j+=3){const [x,y]=S.at(j,0);ellipse(c,x,y,3.4-j*.15,4.4-j*.2,P(b,.1,.95),S.pt[j].th+1.57);}
  else if(!low)for(let j=2;j<n-2;j+=1.5){const k=Math.floor(j),q=S.pt[k],[x,y]=S.at(k,.42),rr=Math.max(.5,q.w*.32);ellipse(c,x,y,rr,rr*.8,P(b,.05));ellipse(c,x,y,rr*.45,rr*.35,P(a,-.35));}
 }
 path(c,'M8 -12 Q40 -4 46 4 Q40 12 8 14Z',P(a,-.08,.85));
 ellipse(c,-10,0,12,18,grad(c,P,a,b));
 path(c,'M-12 -19 Q12 -31 28 -12 L41 15 Q19 24 -10 19Z',grad(c,P,a,b));
 const mantle=path(c,'M-15 -19 C-42 -57 -104 -37 -100 -7 Q-99 24 -58 28 Q-25 30 -12 14Z',grad(c,P,a,b));
 if(!low){skin(c,mantle,P,a,r.seed,170);c.save();c.clip(mantle);for(let i=0;i<34;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);ellipse(c,-100+fu*86,-38+fv*64,2+i%4,1.4+(i%3)*.6,P(a,-.3,.3),i*.6);}for(let i=40;i<58;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);const x=-98+fu*82,y=-36+fv*60;ellipse(c,x,y+1,1.8,1.4,P(a,-.4,.4));ellipse(c,x,y,1.7,1.3,P(a,.22,.75));}c.restore();}
 if(r.species==='mimic_octopus'){c.save();c.clip(mantle);for(let i=0;i<7;i++)path(c,`M${-96+i*14} -44 q-8 30 4 76`,null,P(b,.1,.85),4);c.restore();}
 if(r.species==='giant_pacific_octopus'&&!low){c.save();c.clip(mantle);for(let i=0;i<7;i++)path(c,`M${-92+i*12} -40 q-8 26 4 62`,null,P(a,-.35,.45),1.4);for(let i=0;i<14;i++)ellipse(c,-96+(i*37)%84,-30+(i*53)%52,1.5,1.2,P('#f6e2d0',0,.7));c.restore();}
 ellipse(c,11,-14,11,9,P(a,-.15));eye(c,13,-16,P,4,{iris:'#c9a25a',bar:true});path(c,'M2 9 Q17 6 25 12 L22 19 L5 17Z',P(b,-.2));
}
function cephalopod(c,res,p,P,low){
 if(['octopus','giant_pacific_octopus','mimic_octopus'].includes(res.species)){commonOctopus(c,res,p,P,low);return;}
 if(res.species==='kraken'){kraken(c,res,p,P,low);return;}
 if(res.species==='giant_squid'){giantSquid(c,res,p,P,low);return;}
 const id=res.species,a=res.colors.primary,b=res.colors.secondary,oct=id==='octopus'||id==='kraken',sq=id==='giant_squid';
 const roots=oct?8:8;
 // Cuttlefish: eight short, thick arms that taper to points and hold together in a soft cone, as they do when hovering.
 if(id==='cuttlefish')for(const i of [0,7,1,6,2,5,3,4]){const y0=(i-3.5)*3.2,ph=p.swim*1.3+i*.8,ex=88+Math.abs(i-3.5)*-3,ey=(i-3.5)*5.5+Math.sin(ph)*4,mx=64,my=y0+(ey-y0)*.4+Math.sin(ph+1)*3;
  const N=8,L=[],R=[];for(let k=0;k<=N;k++){const t=k/N,u=1-t,x=u*u*36+2*u*t*mx+t*t*ex,y=u*u*y0+2*u*t*my+t*t*ey,dx=2*u*(mx-36)+2*t*(ex-mx),dy=2*u*(my-y0)+2*t*(ey-my),dl=Math.hypot(dx,dy)||1,w=3.6*(1-t)+.4;L.push([x-dy/dl*w,y+dx/dl*w]);R.unshift([x+dy/dl*w,y-dx/dl*w]);}
  const far=i===0||i===7||i===1||i===6;path(c,'M'+[...L,...R].map(([x,y])=>x.toFixed(2)+' '+y.toFixed(2)).join(' L')+'Z',P(a,far?-.25:.02),P(a,-.4,.5),.5);
  if(!low&&!far)for(let k=1;k<5;k++){const q=L[k];ellipse(c,q[0],q[1]+(i<4?1:-1)*.6,.9,.7,P(b,.1,.75));}}
 else for(let i=0;i<roots;i++){
  const x=oct?-28+i*8:35,y=oct?12:(i-3.5)*4,len=sq?130:oct?78:65,phase=p.swim+i*.7;
  const ex=oct?x+(i-3.5)*20:len+30,ey=oct?40+Math.sin(phase)*12:(i-3.5)*7+Math.sin(phase)*12;
  path(c,`M${x} ${y} Q${oct?x:78} ${oct?60:y+Math.sin(phase)*30} ${ex} ${ey} q${oct?12:18} -12 3 -18`,null,P(a,i%2?-.15:.05),oct?10:sq?5:4);
  if(!low)for(let j=0;j<5;j++)ellipse(c,x+(ex-x)*j/6,y+(ey-y)*j/6+3,oct?2:1.3,1,P(b,0,.7));
 }
 if(sq){for(const side of [-1,1]){path(c,`M40 ${side*9} Q130 ${side*65+Math.sin(p.swim)*12} 228 ${side*40} q20 5 30 -5`,null,P(a,.1),5);ellipse(c,244,side*40,17,5.5,P(a,.16),side*-.1);if(!low)for(let i=0;i<7;i++)ellipse(c,233+i*3.8,side*40,1.3,1,P(b,0,.85));}path(c,'M-118 0 L-57 -47 L-22 -7 L-54 39Z',P(a,.1,.7));}
 if(!oct&&!sq){path(c,'M-83 0 Q-64 -54 -10 -39 Q37 -38 48 -13 Q7 -31 -28 -24 Q-70 -22 -83 0 M-83 0 Q-50 48 17 33 L44 10 Q1 25 -34 19Z',P(b,0,.5));}
 const body=path(c,oct?'M-35 13 C-72 -58 20 -78 41 -23 Q53 16 25 29Z':sq?'M-132 0 Q-82 -27 -19 -21 L44 -12 L45 13 Q-35 27 -132 0Z':'M-85 0 Q-64 -41 -12 -29 Q26 -23 45 -8 L45 12 Q-17 43 -85 0Z',grad(c,P,a,b));
 if(!low){skin(c,body,P,a,res.seed,90);if(!oct)c.save(),c.clip(body);if(!oct){for(let i=0;i<11;i++)path(c,`M${-65+i*8} -25 q-9 20 0 47`,null,P(a,-.35,.5),2);if(sq)for(let i=0;i<70;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);ellipse(c,-125+fu*165,-20+fv*40,.9+(i%3)*.4,.7+(i%2)*.3,P(a,-.42,.42));}c.restore();}if(sq)path(c,'M30 9 L48 13 L30 16Z',P(a,-.22));}
 if(id==='firefly_squid')crisp(c,(c)=>{c.save();c.clip(body);for(let i=0;i<34;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-78+(u-Math.floor(u))*118,y=-22+(v-Math.floor(v))*40,g=c.createRadialGradient(x,y,0,x,y,3.4);g.addColorStop(0,P('#c8f4ff',0,.95));g.addColorStop(.4,P('#3aa8ff',0,.6));g.addColorStop(1,P('#3aa8ff',0,0));c.fillStyle=g;c.beginPath();c.arc(x,y,3.4,0,TAU);c.fill();}c.restore();});
 eye(c,oct?28:36,oct?1:0,P,oct?5:4);if(id==='cuttlefish')path(c,'M31 -1 l3 -2 l2 3 l3 -2',null,P('#111e22'),1.2);
}
// The Kraken's arms, redrawn 15 Nov 2026: ten long arms fanning out ahead of the mantle and writhing in waves, each thick at the root
// and tapering to a fine tip that curls round, with suckers along it. They had hooked back on themselves into a box-like knot.
function kraken(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 for(const i of [0,9,1,8,2,7,3,6,4,5]){
  const th=-.62+i*.138,ph=p.swim*.8+i*.9,L=170+((i*7)%4)*16,x0=-8+i*2,y0=6+(i-4.5)*3.2,w0=13.5-Math.abs(i-4.5)*.8,curl=(i<5?-1:1)*(i%2?1:.7),pts=[];
  for(let j=0;j<=16;j++){const t=j/16,al=t*L,lat=Math.sin(ph-t*4.2)*22*t;pts.push([x0+Math.cos(th)*al-Math.sin(th)*lat,y0+Math.sin(th)*al+Math.cos(th)*lat,w0*(1-t*.8)+.8]);}
  let [x,y]=pts[16];const [px,py]=pts[15];let q=Math.atan2(y-py,x-px);
  for(let j=1;j<=9;j++){q+=curl*.5;const st=9*(1-j/11);x+=Math.cos(q)*st;y+=Math.sin(q)*st;pts.push([x,y,Math.max(.6,2.4-j*.2)]);}
  const A=spineOf(pts),far=Math.abs(i-4.5)>2.5;
  path(c,A.outline(),far?P(a,-.28):grad(c,P,a,b,-90,90),P(a,-.45),.6);
  if(!low)for(let k=2;k<15;k+=1.6){const n=Math.floor(k),[sx,sy]=A.at(n,.45),rr=Math.max(.7,A.pt[n].w*.3);ellipse(c,sx,sy,rr,rr*.8,P(b,.15,.85));ellipse(c,sx,sy,rr*.45,rr*.36,P(a,-.35,.85));}
 }
 const mantle=path(c,'M-118 -6 C-150 -78 -60 -112 6 -80 Q48 -58 52 -12 Q50 24 16 34 Q-70 40 -118 -6Z',grad(c,P,a,b,-100,36),P(a,-.45),1.2);
 if(!low){skin(c,mantle,P,a,r.seed,160);c.save();c.clip(mantle);for(let i=0;i<9;i++)path(c,`M${-110+i*16} -90 q-10 50 4 120`,null,P(a,-.3,.45),3);for(let i=0;i<40;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);const x=-125+fu*175,y=-95+fv*125,s=1.4+(i%4)*.6;ellipse(c,x,y+1,s,s*.8,P(a,-.4,.4));ellipse(c,x,y,s*.9,s*.72,P(a,.2,.7));}c.restore();}
 const glow=c.createRadialGradient(28,-14,0,28,-14,26);glow.addColorStop(0,P('#ffd36b',0,.85));glow.addColorStop(1,P('#ffb347',0,0));ellipse(c,28,-14,26,26,glow);
 ellipse(c,28,-14,10,8,P('#f2c14e'));ellipse(c,30,-14,3,7,P('#141010'));path(c,'M14 -28 Q28 -34 42 -26',null,P(a,-.5),3);
}
function eel(c,res,p,P,low){
 if(res.species==='moray_eel'){moray(c,res,p,P,low);return;}
 if(res.species==='sea_snake'){seaKrait(c,res,p,P,low);return;}
 const a=res.colors.primary,b=res.colors.secondary;
 const wv=waveBody(p,x=>{const i=(x+160)/12;return Math.sin(p.swim-i*.17)*(1-i/28)*13;});
 let top=[],bottom=[];for(let i=0;i<=24;i++){const x=-160+i*12,y=wv(x),w=2+17*Math.sin((i/24)*Math.PI*.72);top.push([x,y-w]);bottom.unshift([x,y+w]);}
 // The long dorsal fin follows the body as it bends.
 if(res.species!=='sea_snake'){const fin=[];for(let i=1;i<=20;i++){const [x,y]=top[i];fin.push([x,y-7*Math.sin(Math.min(1,i/4)*Math.PI/2)]);}path(c,'M'+top.slice(1,21).map(q=>q.join(' ')).join(' L')+' L'+fin.reverse().map(q=>q.join(' ')).join(' L')+'Z',P(a,.1,.75),P(a,-.3,.5),.5);}
 const d='M'+top.map(q=>q.join(' ')).join(' L')+' Q149 -9 132 8 L'+bottom.map(q=>q.join(' ')).join(' L')+'Z';const body=path(c,d,grad(c,P,a,b));
 if(res.species==='sea_snake'){c.save();c.clip(body);for(let i=0;i<14;i++){const x=-150+i*20;path(c,`M${x} -40 L${x+9} -40 L${x+9} 40 L${x} 40Z`,P('#1c2027',0,.92));}c.restore();path(c,`M-150 ${-8} Q-176 -2 -170 14 Q-158 18 -148 6Z`,P(a,-.1));eye(c,104,-8,P,2);path(c,'M110 6 l12 3',null,P('#e4b3b8'),1.2);return;}
 if(!low){skin(c,body,P,'#c9c79a',res.seed,130);c.save();c.clip(body);
  // Moray detail: a thick muscular head with wrinkles, the small round gill opening, and fine mottling.
  for(let i=0;i<5;i++)path(c,`M${70+i*5} -14 q-3 12 1 24`,null,P(a,-.3,.4),.8);ellipse(c,78,4,3,2.2,P('#1c2618',0,.8));
  for(let i=0;i<70;i++){const x=-150+((i*37)%100)/100*270,y=-14+((i*53)%100)/100*26;ellipse(c,x,y,1.4,.9,P(a,i%2?-.25:.2,.5));}
  for(let i=0;i<14;i++)path(c,`M${-110+i*14} -15 q4 12 -1 26`,null,P(a,-.3,.18),.6);
  c.restore();
  path(c,'M88 9 Q110 15 128 1 L126 6 Q110 18 90 13Z',P('#3a1f22',0,.85));teeth(c,P,{x0:99,y0:10.6,x1:124,y1:3.6,bend:2},{type:'fang',size:1.9,color:'#efe7c9'});faceLine(c,P,'M91 10 Q111 12 127 1',P('#263823'),1.6);
  for(const dy of [-4,-1])path(c,`M127 ${dy} l5 -2`,null,P(a,-.2),1.6);}
 eye(c,104,-8,P,2.2);}
function land(c,res,p,P,low){
 const id=res.species,a=res.colors.primary,b=res.colors.secondary,hip=id==='hippo',bear=id==='bear',lion=id==='lion',sw=swing(p,8);
 for(let i=0;i<4;i++){let x=-44+(i%2)*81,y=i<2?10:22;path(c,`M${x} ${y} Q${x+8} ${43+(i%2?sw:-sw)} ${x+27} 40`,null,P(a,i<2?-.3:-.06),hip?18:bear?17:11);ellipse(c,x+28,40,hip?12:10,6,P(a,-.05));}
 if(!hip&&!bear){path(c,'M-67 1 Q-115 -11 -117 20 Q-115 40 -98 31',null,P(a),6);if(lion)ellipse(c,-99,31,8,6,P('#6c5039'));}
 const body=path(c,hip?'M-77 0 C-85 -50 18 -60 67 -22 Q91 15 52 30 L-48 31 Q-80 23 -77 0Z':bear?'M-75 2 Q-83 -35 -42 -39 Q-7 -62 28 -35 Q50 -30 64 -7 L60 21 Q6 45 -64 28Z':id==='black_panther'?'M-83 3 Q-60 -25 -13 -23 Q27 -41 60 -13 L63 17 Q19 29 -8 15 Q-49 30 -73 19Z':'M-75 2 Q-66 -42 -8 -32 Q41 -36 64 -7 L60 21 Q-5 42 -63 24Z',grad(c,P,a,b));
 if(lion){const mane=c.createRadialGradient(63,-11,10,58,-12,44);mane.addColorStop(0,P('#c19756'));mane.addColorStop(1,P('#795639'));ellipse(c,61,-11,39,43,mane);if(!low)for(let i=0;i<35;i++){const q=i/35*TAU;line(c,[[61+Math.cos(q)*25,-11+Math.sin(q)*28],[61+Math.cos(q)*38,-11+Math.sin(q)*41]],P('#d1ab67',0,.4),.8);}}
 ellipse(c,68,-12,hip?43:bear?29:25,hip?29:27,grad(c,P,a,b));
 ellipse(c,hip?97:87,hip?2:-3,hip?25:16,hip?21:12,P(a,.17));
 ellipse(c,55,-37,hip?8:bear?10:7,hip?7:bear?10:9,P(a,-.05));ellipse(c,57,-38,4,5,P(b,-.2));
 ellipse(c,hip?108:98,hip?-1:-8,hip?5:6,hip?4:4,P('#263030'));eye(c,78,-20,P,2.4);
 path(c,hip?'M92 18 Q111 22 117 12':'M83 5 Q94 8 101 1',null,P(a,-.5),1.2);
 if(!low){skin(c,body,P,a,res.seed,100);c.save();c.clip(body);if(!hip)for(let i=0;i<200;i++){const x=-80+(i*31)%160,y=-45+(i*43)%90;line(c,[[x,y],[x-3,y+2]],P(b,0,.2),.5);}if(id==='black_panther')for(let i=0;i<28;i++){const x=-65+(i*29)%120,y=-20+(i*19)%40;ellipse(c,x,y,4,2,P('#081e24',0,.3));}c.restore();if(!hip)for(let i=0;i<3;i++)line(c,[[88,1+i*3],[111,0+i*5]],P(b,0,.45),.5);}
 if(!low){for(const x of [-16,65])for(let j=0;j<3;j++)path(c,`M${x+j*3} 39 l1 5`,null,P('#c8c4ad',0,.65),.8);if(!hip){path(c,'M65 -35 Q70 -24 77 -23',null,P(a,-.4),1);path(c,'M80 -13 L83 -8',null,P(a,-.3),.8);}else{path(c,'M92 17 Q100 27 110 19',null,P(a,-.35),1.2);ellipse(c,103,-2,2,2,P('#544e51'));}}
 if(COMMUNITY_SPECIES[id].helmet)helmet(c,78,-10,lion?57:49,P);
}
function seahorse(c,res,p,P,low){
 const a=res.colors.primary,b=res.colors.secondary;
 {const pts=Array.from({length:30},(_,j)=>{const t=j/29;if(t<.3){const u=t/.3;return[2-4*u,32+34*u,8.5-u*1.6];}const u=(t-.3)/.7,q=Math.PI-u*TAU*1.35,R=16*(1-u*.75);return[14+Math.cos(q)*R,66+Math.sin(q)*R,6.9*(1-u)+1.5];}),T=spineOf(pts);path(c,T.outline(),grad(c,P,a,b,30,86),P(a,-.3),.8);if(!low)for(let j=1;j<29;j+=2)line(c,[T.at(j,-1),T.at(j,1)],P(a,-.28,.55),.6);}
 // Redrawn 15 Nov 2026: a horse's head set at an angle, with a crown (coronet) on top and a tube snout pointing down and forward that
 // flares at the mouth, not a straight pipe; an arched neck, a pot belly, bony rings round the trunk, and a small fin behind the head.
 const body=path(c,'M-12 -51 Q-7 -62 4 -59 Q13 -56 17 -47 Q30 -41 43 -34 Q49 -32 48 -28 Q46 -24 41 -26 Q29 -31 19 -33 Q12 -31 12 -24 Q13 -14 20 -6 Q31 8 25 24 Q17 40 -1 44 Q-14 39 -20 19 Q-26 -3 -24 -24 Q-22 -42 -12 -51Z',grad(c,P,a,b,-56,44),P(a,-.25),1);
 path(c,`M-23 -8 Q${-48-Math.sin(p.swim)*7} 4 -21 22Z`,P(b,0,.55));
 path(c,`M10 -31 Q${3+Math.sin(p.swim*2)*2} -34 0 -26 Q5 -24 10 -27Z`,P(b,.1,.6));
 if(!low){c.save();c.clip(body);for(let i=0;i<8;i++){const y=-24+i*8;path(c,`M-30 ${y-3} Q0 ${y+7} 34 ${y-2}`,null,P(a,-.3),1);for(const dx of [-12,-2,9])ellipse(c,dx,y+3+Math.abs(dx)*.06,1,.8,P(a,.22,.8));}path(c,'M-30 -42 Q-8 -48 20 -40',null,P(a,-.3,.6),.9);c.restore();
  for(const [x,y] of [[-19,-40],[-23,-28],[-25,-16],[-25,-4],[-24,8],[-21,20],[-15,31]])path(c,`M${x} ${y-4} l-7 -1 l6 7Z`,P(a,-.15));
  for(let i=0;i<6;i++)path(c,`M-22 ${-6+i*5} L${-36+Math.abs(i-2.5)*2.4} ${-1+i*3}`,null,P(a,-.1,.45),.5);
  for(const [x,h] of [[-6,3.6],[-1.4,5],[3.2,4]])ellipse(c,x,-59-h*.5,1.8,h*.9,P(a,.06));
  path(c,'M19 -38 Q32 -33 44 -30',null,P(a,-.2,.35),.7);}
 eye(c,6,-47,P,2.7);path(c,'M48 -29.5 L44 -28',null,P(a,-.55),1.2);
}
function benthic(c,res,p,P,low){
 const id=res.species,a=res.colors.primary,b=res.colors.secondary;
 if(['snow_crab','red_crab','hermit_crab','coconut_crab','caribbean_king_crab','karkinos','yeti_crab','pom_pom_crab'].includes(id)){crab(c,res,p,P,low);return;}
 if(id==='horseshoe_crab'){
 path(c,'M-10 -2 L-136 -1 L-10 8Z',P(a,-.2));for(let i=0;i<5;i++)for(const side of [-1,1])line(c,[[0,side*14],[-15+i*7,side*38]],P(a,-.2),3);
 path(c,'M-36 -23 Q-43 -41 -12 -42 Q48 -48 65 -3 Q49 45 -13 43 Q-45 41 -36 20 L-13 11 L-13 -11Z',grad(c,P,a,b),P(a,-.4),1);
 path(c,'M-28 -19 Q12 -33 38 0 Q11 32 -28 19',null,P(a,-.3),1.4);eye(c,29,-23,P,1.7);eye(c,29,23,P,1.7);return;
 }
 // Leaf sheep (Costasiella): the leaves (cerata) are plump and rounded with pale tips (15 Nov 2026), not pointed.
 if(id==='leaf_sheep'){
 ellipse(c,0,8,59,18,P(b));for(let row=0;row<3;row++)for(let i=0;i<8;i++){const x=-47+i*12+(row%2)*4,y=14-row*10,h=23+((i*7+row*11)%22),lean=-16+row*11;path(c,`M${x-5} ${y} Q${x-9+lean} ${y-h*.6} ${x-3+lean} ${y-h*.92} Q${x+lean} ${y-h*1.06} ${x+4+lean} ${y-h*.9} Q${x+9+lean} ${y-h*.55} ${x+5} ${y}Z`,grad(c,P,a,b,-50,10),P('#71994a'),.7);line(c,[[x,y-3],[x+lean*.9,y-h+6]],P('#d6e49b',0,.5),.7);ellipse(c,x+lean+.5,y-h+2.5,3.2,3,P('#f2f6dc',0,.85));}
 ellipse(c,53,0,19,16,P(b));for(const side of [-1,1]){path(c,`M${51+side*8} -10 l${side*4} -22`,null,P('#e8dcd6'),4);ellipse(c,51+side*8,-24,3,5,P('#625c74'));}eye(c,64,-2,P,1.7);return;
 }
 if(id==='sea_bunny'){seaBunny(c,res,p,P,low);return;}
 if(id==='nudibranch'){nudibranch(c,res,p,P,low);return;}
 if(id==='sea_cucumber'){seaCucumber(c,res,p,P,low);return;}
 const body=path(c,'M-80 0 Q-75 -28 -13 -26 Q73 -29 80 -1 Q72 25 1 25 Q-74 29 -80 0Z',grad(c,P,a,b));
 if(!low){skin(c,body,P,a,res.seed,120);for(let i=0;i<15;i++){const x=-66+i*9,t1=x<-13?(x+80)/67:(x+13)/93,up=x<-13?2*(1-t1)*t1*-28+t1*t1*-26:(1-t1)*(1-t1)*-26+2*(1-t1)*t1*-29+t1*t1*-1,t2=x>1?(80-x)/79:(1-x)/81,dn=x>1?(1-t2)*(1-t2)*-1+2*(1-t2)*t2*25+t2*t2*25:(1-t2)*(1-t2)*25+2*(1-t2)*t2*29;path(c,`M${x} ${up+2} l2 -8 l3 8 M${x} ${dn-2} l1 8 l3 -8`,P(a,.18));}}
 for(let i=0;i<7;i++)path(c,`M74 0 q${14+i} ${-22+i*7} 24 ${-18+i*6}`,null,P(b),1);
}
function angler(c,res,p,P,low){
 const a=res.colors.primary,b=res.colors.secondary;
 path(c,'M-43 7 L-84 -12 L-78 31Z',P(a));path(c,'M-26 -19 L-42 -43 L2 -25Z',P(a));
 const body=path(c,'M-51 2 Q-45 -50 11 -36 Q51 -29 70 15 Q28 52 -23 35Z',grad(c,P,a,b));
 path(c,'M16 -15 Q51 -23 65 15 Q48 39 16 21 Q27 1 16 -15Z',P('#182227'),P(b,-.3),1);
 teeth(c,P,{x0:19,y0:-14,x1:59,y1:1,bend:-8},{type:'needle',size:3.4,color:'#e7dbc1',gum:false});teeth(c,P,{x0:20,y0:22.5,x1:60,y1:18,bend:7,upper:false},{type:'needle',size:3.2,color:'#e7dbc1',gum:false});
 path(c,`M-2 -29 Q-8 -91 55 -67 L61 -50`,null,P(a,.25),2.4);
 crisp(c,(c)=>{const glow=c.createRadialGradient(61,-50,0,61,-50,20);glow.addColorStop(0,P('#b4fce7',0,.8));glow.addColorStop(1,P('#7be8d6',0,0));ellipse(c,61,-50,20,20,glow);ellipse(c,61,-50,5,5,P('#e2ffe8'));});
 if(!low)skin(c,body,P,a,res.seed,60);eye(c,20,-25,P,3);
}
function swordfish(c,res,p,P,low){
 const a=res.colors.primary,b=res.colors.secondary,sw=swing(p,5);
 path(c,`M-76 0 L-136 ${-55+sw} L-105 2 L-130 ${42+sw} L-75 7Z`,P(a));
 if(res.species==='sailfish'){const sail=path(c,'M-70 -12 Q-58 -92 -10 -98 Q30 -96 38 -20Z',P(a,.05,.92),P(a,-.35),1);if(!low){for(let i=0;i<10;i++)line(c,[[-62+i*10,-14],[-50+i*9,-88+Math.abs(i-5)*3]],P(a,-.35,.7),1);for(let i=0;i<14;i++)ellipse(c,-50+(i*23)%80,-70+(i*17)%45,2,2,P('#3e7fb8',0,.8));}}
 else path(c,res.species==='blue_marlin'?'M-40 -17 L-8 -62 L-2 -36 L22 -17Z':'M-44 -18 L-17 -71 L2 -18Z',P(a));
 if(res.species==='blue_marlin'&&!low)for(let i=0;i<12;i++)path(c,`M${-60+i*10} -14 q-3 14 0 26`,null,P('#7bb3df',0,.6),1.6);
 const body=path(c,'M-91 0 Q-27 -27 43 -17 L68 -5 L171 -2 L69 2 Q39 23 -91 5Z',grad(c,P,a,b));c.save();c.clip(body);path(c,'M-95 2 Q-30 1 30 3 Q55 3 70 1 L70 30 L-95 30Z',P(b,.02,.92));c.restore();path(c,'M29 10 L-6 50 L3 11Z',P(a,-.15));if(!low)skin(c,body,P,a,res.seed);eye(c,45,-7,P,2);
}
function tinyJelly(c,res,p,P,low){
 const id=res.species,a=res.colors.primary,b=res.colors.secondary,sw=p.swim,moon=id==='moon_jellyfish',mane=id==='lions_mane_jellyfish';
 if(mane){crisp(c,(c)=>{for(let i=0;i<70;i++){const x=-40+(i*1.17)%80,len=60+(i*37)%70;path(c,`M${x} 0 Q${x+Math.sin(sw+i*.3)*14} ${len*.5} ${x+Math.sin(sw*.8+i*.2)*22} ${len}`,null,P(i%3?b:a,0,.55),.7);}});
 for(let i=0;i<8;i++){const x=-22+i*6;path(c,`M${x} 2 Q${x+Math.sin(sw+i)*6} 26 ${x-4+Math.sin(sw+i)*8} 46`,null,P(a,.15,.85),5);}}
 else for(let i=0;i<(moon?40:24);i++){const x=-(moon?42:35)+i*(moon?2.1:3);path(c,`M${x} 0 Q${x+Math.sin(sw+i)*(moon?3:9)} ${moon?7:22} ${x+Math.sin(sw+i)*(moon?4:12)} ${moon?12+(i%3)*2:36+(i%5)*6}`,null,P(moon?'#eef0ff':'#e8cbc4',0,.65),.8);}
 const g=c.createRadialGradient(0,-14,0,0,-14,45);g.addColorStop(0,P(moon?b:mane?a:'#e4a296',0,.7));g.addColorStop(.7,P(a,0,moon?.25:.15));g.addColorStop(1,P(moon?'#f3f6ff':mane?b:'#fff0e4',0,.7));
 path(c,moon?'M-46 1 C-46 -30 46 -30 46 1 Q0 7 -46 1Z':'M-43 1 C-44 -49 43 -49 43 1 Q0 11 -43 1Z',g,P(moon?'#f1f3ff':'#f4e2d8',0,.8),1);
 if(moon)for(const [x,y] of [[-15,-12],[15,-12],[-6,-4],[6,-4]]){let X=x*.9,Y=y+3;if(flex.map){flex.map(X,Y);X=flex.x;Y=flex.y;}c.strokeStyle=P('#c79bd9',0,.85);c.lineWidth=3;c.beginPath();c.arc(X,Y,7,0,TAU);c.stroke();}
 else if(!mane)ellipse(c,0,-14,8,12,P('#b75b4d',0,.6));
}
// The Trench Titan, the sea kaiju (fictional), from the owner's brief of 2026-11-08: a generic giant of the deep. A heavy
// marine reptile swimming low and level, with pebbled charcoal-green hide, a broad blunt head, a thick tail, webbed
// feet, and one jagged ridge of uneven spines down its back.
function trenchTitan(c,res,p,P,low){
 const a=res.colors.primary,b=res.colors.secondary,far=farPalette(P),N=28,s=p.swim*.7,K='#171b1b',pts=[];
 for(let i=0;i<=N;i++){const t=i/N,w=4+52*Math.pow(Math.sin(Math.PI*Math.min(.5,t*.6)),.62)*(t>.82?1-(t-.82)*1.3:1);pts.push([-214+t*330,Math.sin(s-i*.24)*13*(1-t*.85),w]);}
 const S=spineOf(pts),e=S.pt[N],n=e.w;
 const leg=(i,u,rot,near)=>{const [x,y]=S.at(i,u),col=near?P:far;c.save();c.translate(x,y);c.rotate(rot+Math.sin(s+i)*.2);
  const thigh=path(c,'M-21 -8 C-29 16 -19 38 -9 47 C3 52 14 46 17 39 C25 21 25 4 21 -8Z',grad(c,P,a,a,-8,50),P(a,-.5),.8);if(!near){c.fillStyle=P('#000000',0,.26);c.fill(thigh);}
  path(c,'M-13 42 C-30 50 -43 60 -43 69 Q-12 79 14 73 C28 66 26 50 15 42 Q2 48 -13 42Z',col(a,-.12),P(a,-.5),.8);
  if(!low)for(let t=0;t<3;t++)path(c,`M${-8+t*7} 48 L${-30+t*17} 70`,null,P(a,.12,.3),1);
  for(const [fx,fy] of [[-42,69],[-24,74],[-6,76],[12,73]])path(c,`M${fx-3} ${fy-2} L${fx-3} ${fy+7} L${fx+4} ${fy}Z`,P('#cfc8ac',near?0:-.22),P(K,0,.5),.5);
  c.restore();};
 leg(13,.5,.62,false);leg(23,.5,.5,false);
 // The ridge sits behind the body so each spine grows out of the hide. Heights vary, so the line is jagged and never even.
 const spine=(x,y,q,h,bw)=>{const ux=Math.cos(q.th),uy=Math.sin(q.th),tx=x-q.nx*h-ux*h*.42,ty=y-q.ny*h-uy*h*.42;path(c,`M${x-ux*bw} ${y-uy*bw} L${tx} ${ty} L${x+ux*bw} ${y+uy*bw}Z`,P(b,-.3),P(K,0,.6),.8);if(!low)line(c,[[x-ux*bw*.3,y-uy*bw*.3],[tx,ty]],P(b,.18,.55),.9);};
 for(let i=1;i<N;i++){const [x,y]=S.at(i,-.9),q=S.pt[i];spine(x,y,q,(6+q.w*.44)*(.66+.44*((i*7)%5)/4),5.2+q.w*.07);}
 const body=path(c,S.outline(),grad(c,P,a,a,-72,70),P(a,-.5),.9);
 c.save();c.clip(body);roundLong(c,S,P,a,b);
 if(!low){for(let i=2;i<N;i++){path(c,S.ribbon(.6,1.15,i,i+1),null,P(a,-.45,.55),1);for(let u=-.86;u<.5;u+=.17){const [x,y]=S.at(i,u+(i%2)*.08);ellipse(c,x,y,2.9-(i%3)*.5,2-(i%2)*.35,P(a,(i+Math.round(u*9))%3?.2:-.26,.36),S.pt[i].th);}}skin(c,body,P,a,res.seed,120);for(const i of [12,14,22,24]){const [x0,y0]=S.at(i,-.7),[x1,y1]=S.at(i,.5);path(c,`M${x0} ${y0} Q${(x0+x1)/2-7} ${(y0+y1)/2} ${x1} ${y1}`,null,P(a,-.42,.45),1.2);}}
 c.restore();
 leg(14,.58,.5,true);leg(24,.58,.4,true);
 c.save();c.translate(e.x,e.y);c.rotate(e.th);
 for(let i=0;i<5;i++){const x=-2+i*11,y=-n-5+i*2.2;spine(x,y+7,{th:0,nx:0,ny:1},9+((i*3)%4)*2.6,5.5);}
 const jaw=path(c,`M-10 ${n*.3} Q24 16 66 18 Q96 18 108 15 Q106 33 78 41 Q34 49 -10 ${n}Z`,grad(c,P,a,b,12,48));
 const skull=path(c,`M-10 ${-n} Q30 ${-n-12} 70 -36 Q100 -26 116 -8 Q120 4 108 9 Q66 13 34 15 Q8 17 -10 ${n*.45}Z`,grad(c,P,a,a,-n-10,16));
 if(!low)for(const sh of [skull,jaw]){c.save();c.clip(sh);for(let i=0;i<60;i++){const x=-8+((i*37)%100)/100*122,y=-52+((i*53)%100)/100*96;ellipse(c,x,y,2.4-(i%3)*.5,1.7-(i%2)*.3,P(a,i%3?.2:-.26,.34));}skin(c,sh,P,a,res.seed+4,24);c.restore();}
 path(c,`M-10 ${-n} Q30 ${-n-12} 70 -36 Q100 -26 116 -8 Q120 4 108 9`,null,P(a,-.5),.9);path(c,`M108 15 Q106 33 78 41 Q34 49 -10 ${n}`,null,P(a,-.5),.9);
 path(c,'M34 15 Q70 12 108 9 Q94 21 66 21 Q46 21 34 15Z',P('#1a1d1f'));
 teeth(c,P,{x0:40,y0:13.8,x1:106,y1:9},{type:'fang',size:3.4,color:'#d9d2b8'});teeth(c,P,{x0:46,y0:20,x1:102,y1:15,upper:false},{type:'fang',size:2.9,color:'#d9d2b8'});
 faceLine(c,P,'M30 15 Q18 22 16 34',P(a,-.5,.6),1);faceLine(c,P,'M8 12 Q0 26 2 40',P(a,-.5,.45),1);
 path(c,'M50 -31 Q64 -38 81 -24 Q65 -28 51 -26Z',P(a,-.12),P(a,-.45),.5);
 ellipse(c,108,-7,2.4,1.7,P(K,0,.85));
 eye(c,66,-21,P,3.2,{slit:true,iris:'#b9853a'});
 c.restore();
}
// Godzilla (requested by name; redrawn for the owner, 15 Nov 2026: "improve godzilla to actually look like godzilla"). Drawn as
// himself: a heavy upright reptile leaning forward as he wades through the water, charcoal-grey with bumpy, scaly hide and a long
// thick tail, three rows of big jagged pale dorsal plates from the neck to the tail tip (their edges glow blue, ready for the
// atomic breath), a broad head with a short snout, small fierce eyes under a heavy brow, and thick arms and legs with claws.
// The spine runs from the tail tip to the neck: x, y and the body's half-width there.
const GODZILLA_LINE=[[-236,28,4],[-202,46,10],[-164,58,18],[-124,63,26],[-86,60,34],[-48,50,42],[-12,35,49],[22,15,55],[50,-9,59],[74,-35,59],[94,-61,55],[112,-85,48],[128,-104,43]];
// A smooth curve through the points (Catmull-Rom), n+1 points out.
function curveThrough(ctrl,n){const out=[],m=ctrl.length-1;for(let i=0;i<=n;i++){const f=i/n*m,k=Math.min(m-1,Math.floor(f)),t=f-k,p0=ctrl[Math.max(0,k-1)],p1=ctrl[k],p2=ctrl[k+1],p3=ctrl[Math.min(m,k+2)];
 out.push(p1.map((_,j)=>.5*(2*p1[j]+(p2[j]-p0[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t*t+(3*p1[j]-p0[j]-3*p2[j]+p3[j])*t*t*t)));}return out;}
function godzilla(c,res,p,P,low){
 const a=res.colors.primary,b=res.colors.secondary,far=farPalette(P),s=p.swim,K='#121516',moving=p.effort!==undefined,N=24,claw='#d9d3c1';
 // The tail sweeps in a slow wave that grows towards its tip, and the trunk rocks a little with each stroke.
 const S=spineOf(curveThrough(GODZILLA_LINE,N).map(([x,y,w],i)=>{const t=i/N,tail=Math.max(0,1-t/.55);return[x+Math.sin(s)*2.5*t,y+Math.sin(s-t*4)*(2.5+15*Math.pow(tail,1.4)),w];})),e=S.pt[N];
 // Legs: a huge thigh, a short thick shin and a broad three-toed foot with pale claws. They kick in turn while he swims.
 const leg=(near)=>{const [hx,hy]=S.at(14,near?.25:.05),ph=s+(near?0:Math.PI),kick=moving?Math.sin(ph)*.24:(near?.05:-.12),knee=moving?.12+Math.cos(ph)*.16:.1,col=near?P:far;
  rigidAt(c,hx+(near?0:-14),hy+(near?0:-6),()=>{c.rotate(kick);
   const tg=c.createRadialGradient(-12,-6,4,0,14,74);tg.addColorStop(0,col(a,.16));tg.addColorStop(.7,col(a,-.04));tg.addColorStop(1,col(a,-.3));
   c.save();c.translate(4,58);c.rotate(knee);
   path(c,'M-24 -8 C-30 18 -28 40 -24 56 L16 58 C16 40 22 18 26 -6Z',col(a,-.08),P(a,-.55),.8);
   path(c,'M-30 46 C-36 62 -28 74 -10 75 L38 76 C50 74 52 64 44 58 C26 50 0 46 -30 46Z',col(a,-.02),P(a,-.55),.8);
   for(const [x,y] of [[32,75],[42,75],[50,69]])path(c,`M${x-4} ${y-5} Q${x+6} ${y-5} ${x+9} ${y+3} Q${x+2} ${y+1} ${x-3} ${y+1}Z`,col(claw,near?0:-.2),P(K,0,.5),.5);
   if(!low)for(const y of [8,20,32,44])path(c,`M-22 ${y} Q-2 ${y+3} 20 ${y-1}`,null,P(a,-.4,.45),1);
   c.restore();
   path(c,'M-40 -34 C-54 6 -42 50 -14 68 C6 80 32 70 40 48 C50 18 42 -18 26 -38 Q-6 -54 -40 -34Z',tg,P(a,-.55),.9);
   if(!low)for(let i=0;i<26;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-34+(u-Math.floor(u))*68,y=-28+(v-Math.floor(v))*90;ellipse(c,x,y,2.6-(i%3)*.5,1.9-(i%2)*.4,P(a,i%3?.24:-.3,.38));}
  });};
 // Arms: thick, bent at the elbow and held forward, with four curved claws. They paddle a little out of step with the legs.
 const arm=(near)=>{const [ax,ay]=S.at(19,near?.6:.4),sw=moving?Math.sin(s+(near?1.3:1.3+Math.PI))*.2:(near?0:-.1),col=near?P:far;
  rigidAt(c,ax+(near?0:-10),ay+(near?0:-5),()=>{c.rotate(.15+sw);
   path(c,'M-18 -14 C-23 12 -17 36 -3 47 C10 55 28 49 40 40 L37 21 C27 27 20 28 17 20 C18 4 18 -8 15 -16Z',col(a,.04),P(a,-.55),.8);
   if(!low)for(const y of [4,16,28])path(c,`M-12 ${y} Q0 ${y+2} 12 ${y-1}`,null,P(a,-.4,.4),.9);
   ellipse(c,38,30,9,9.5,col(a,-.06));
   for(const [x,y,r] of [[42,21,-.5],[46,27,-.15],[46,34,.2],[42,39,.55]]){c.save();c.translate(x,y);c.rotate(r);path(c,'M-1 -2.6 Q8 -3 11 4 Q5 1 -1 2.6Z',col(claw,near?0:-.2),P(K,0,.5),.5);c.restore();}
  });};
 // Dorsal plates, maple-leaf shaped with jagged points and leaning back towards the tail: smallest at the tail tip, biggest over the
 // back and shoulders, a little smaller up the neck. Bone-pale, darker at the base, with a faint blue glow along their edges.
 const size=(t)=>t<.8?.2+.8*Math.pow(t/.8,1.15):1-(t-.8)/.2*.38,glow=.8+.2*Math.sin(s),plates=[];
 const plate=(i,u,k,shade)=>{const q=S.pt[i],t=i/N,f=size(t),h=(18+112*f)*k,w=h*.3+3,[x,y]=S.at(i,u),ux=Math.cos(q.th),uy=Math.sin(q.th),m=([pu,pv])=>{pu-=pv*.2;return[x+pu*ux-pv*q.nx,y+pu*uy-pv*q.ny];};
  const pts=[[-w*.8,0],[-w*.9,h*.18],[-w*1.35,h*.28],[-w*.72,h*.4],[-w*1.08,h*.68],[-w*.4,h*.6],[-w*.34,h*.84],[0,h],[w*.24,h*.72],[w*.78,h*.8],[w*.42,h*.52],[w*1.08,h*.42],[w*.66,h*.24],[w*.8,0]].map(m);
  const d='M'+pts.map(([px,py])=>px.toFixed(2)+' '+py.toFixed(2)).join(' L')+'Z',[tx,ty]=m([0,h]),g=c.createLinearGradient(x,y,tx,ty);
  g.addColorStop(0,P(b,-.55+shade));g.addColorStop(.38,P(b,-.02+shade));g.addColorStop(1,P(b,.5+shade));
  // The side towards the tail is in shade, so each plate stands out as a ridged, faceted blade.
  const facet='M'+[m([0,0]),...pts.slice(0,8)].map(([px,py])=>px.toFixed(2)+' '+py.toFixed(2)).join(' L')+'Z';
  plates.push(()=>{path(c,d,g);path(c,facet,P(b,-.5+shade,.5));path(c,d,null,P(K,0,.75),1.1);
  if(!low){const [cx,cy]=m([0,h*.12]),[mx,my]=m([0,h*.86]);line(c,[[cx,cy],[mx,my]],P(b,-.35+shade,.55),1);
   for(const sd of [-1,1]){const [lx,ly]=m([sd*w*.12,h*.36]),[ox,oy]=m([sd*w*.78,h*(sd<0?.6:.66)]);line(c,[[lx,ly],[ox,oy]],P(b,-.35+shade,.4),.8);}
  }});return d;};
 leg(false);arm(false);
 // Two rows behind the body (the far one darker and set between), then the body, then the near row in front.
 const outlines=[];for(let i=3;i<N;i+=2)outlines.push(plate(i,-.5,.8,-.2));for(let i=2;i<=N;i+=2)outlines.push(plate(i,-.72,1,0));
 // The blue glow first, so the plates cover its inner half and it shows only round the outside of the row.
 if(!low)for(const d of outlines){path(c,d,null,P('#2fb2ff',0,.5*glow),8);path(c,d,null,P('#a8ecff',0,.9*glow),3.4);}
 for(const draw of plates)draw();
 const body=path(c,S.outline(),P(a,.02),P(a,-.55),1);
 c.save();c.clip(body);
 path(c,S.ribbon(-1.1,-.5),P(a,-.32,.55));path(c,S.ribbon(-.42,-.08),P(a,.16,.22));path(c,S.ribbon(.35,1.1),P(a,.1,.42));
 if(!low){
  // The ridged chest and belly, then the scales, and bigger knobs along the back.
  for(let i=8;i<N-1;i++)path(c,S.ribbon(.38,1.15,i,i+1),null,P(a,-.38,.5),1.1);
  // Scales and knobs scattered unevenly, as on a crocodile's hide, not in rows.
  const rnd=(k)=>{const v=Math.sin(k*12.9898+res.seed*.013)*43758.5453;return v-Math.floor(v);};
  for(let k=0;k<420;k++){const i=1+Math.floor(rnd(k)*(N-1)),f=rnd(k+.5),u=-.95+rnd(k+.25)*1.9,[x,y]=S.at(i+0,u),q=S.pt[i],z=Math.max(.45,q.w/50),big=k%9===0;
   if(big){ellipse(c,x,y,4.4*z,3.3*z,P(a,.24,.5),q.th+f);ellipse(c,x+.8*z,y+1.3*z,3.4*z,1.7*z,P(a,-.44,.4),q.th+f);}else ellipse(c,x+(f-.5)*8,y,(1.6+f*1.6)*z,(1.1+f)*z,P(a,k%3?.24:-.34,.46),q.th+f*3);}
 }
 c.restore();
 leg(true);
 // The head: a broad flat skull, a short blunt snout, a deep heavy jaw with a row of fangs, small eyes deep under a heavy brow.
 rigidAt(c,e.x,e.y,()=>{c.rotate(.1+(moving?Math.sin(s+.6)*.035:0));
  const hg=c.createLinearGradient(0,-46,0,40);hg.addColorStop(0,P(a,-.2));hg.addColorStop(.45,P(a,.06));hg.addColorStop(1,P(a,.14));
  const head=path(c,'M-40 -22 C-30 -38 -6 -46 18 -45 C34 -44 46 -40 58 -34 C70 -30 82 -26 90 -18 Q97 -11 96 -2 Q95 4 90 6 Q92 16 84 24 Q64 37 30 39 Q-6 40 -36 24 Q-48 2 -40 -22Z',hg,P(a,-.55),1);
  if(!low){c.save();c.clip(head);for(let i=0;i<60;i++){const x=-38+((i*37)%100)/100*134,y=-46+((i*53)%100)/100*86;ellipse(c,x,y,2.5-(i%3)*.5,1.8-(i%2)*.3,P(a,i%3?.24:-.3,.46));}
   for(const [x,y,r] of [[8,-8,6],[20,4,5],[-6,6,5.5],[6,20,5],[-20,-4,5]]){ellipse(c,x,y,r,r*.8,P(a,.2,.45));ellipse(c,x+.8,y+1.2,r*.7,r*.4,P(a,-.38,.35));}
   path(c,'M-30 -16 Q0 -24 34 -16',null,P(a,-.45,.5),1.3);path(c,'M-20 28 Q20 36 66 28',null,P(a,-.45,.5),1.3);c.restore();}
  path(c,'M26 8 Q58 6 92 3 Q88 11 70 13 Q46 14 26 8Z',P('#1a1d1f'));
  teeth(c,P,{x0:34,y0:7,x1:90,y1:3.6},{type:'fang',size:2.9,color:'#e4ddca'});teeth(c,P,{x0:40,y0:12,x1:84,y1:10,upper:false},{type:'fang',size:2.4,color:'#e4ddca'});
  faceLine(c,P,'M26 8 Q18 12 14 19',P(a,-.5,.6),1.1);
  ellipse(c,90,-12,2.8,1.7,P(K,0,.85),-.3);
  eye(c,50,-22,P,2.6,{iris:'#e8b53a'});
  // The brow comes down over the top of the eye, lower at the front, so the look is fierce.
  crisp(c,(c)=>{path(c,'M30 -31 Q50 -42 72 -27 L70 -23 Q52 -29 34 -25Z',P(a,-.28),P(a,-.6),.7);if(!low)path(c,'M36 -31 Q50 -37 66 -29',null,P(a,.14,.5),.8);});
 });
 arm(true);
}
function monster(c,res,p,P,low){
 const id=res.species,a=res.colors.primary,b=res.colors.secondary;
 if(id==='hydra'||id==='scylla'||id==='king_ghidorah'){hydra(c,res,p,P,low);return;}
 if(id==='trench_titan'){trenchTitan(c,res,p,P,low);return;}
 if(id==='godzilla'){godzilla(c,res,p,P,low);return;}
 path(c,`M-74 0 L-139 ${-32+Math.sin(p.swim)*5} L-111 3 L-132 39 L-74 12Z`,P(a,-.1));
 const body=path(c,'M-97 2 Q-57 -70 34 -48 Q97 -41 119 4 Q94 60 12 44 Q-66 48 -97 2Z',grad(c,P,a,b));
 path(c,'M29 26 Q-1 72 -34 49 L-4 24Z',P(a,-.2));path(c,'M55 -22 Q105 -31 113 4 Q103 41 56 31 Q73 4 55 -22Z',P('#13242b'),P(b,-.25),3);ellipse(c,82,21,15,4.5,P('#5a3038',0,.6),-.06);teeth(c,P,{x0:60,y0:-18,x1:104,y1:-16},{type:'fang',size:4,color:'#d6d4bc'});teeth(c,P,{x0:60,y0:30,x1:100,y1:28,upper:false},{type:'fang',size:4,color:'#d6d4bc'});
 eye(c,46,-24,P,3);if(!low){skin(c,body,P,a,res.seed,130);for(let i=0;i<5;i++)path(c,`M${42-i*5} -5 q-9 10 -2 20`,null,P(a,-.4),1.3);for(let i=0;i<9;i++){const t=.14+i*.1,m=1-t,x=m*m*-97+2*m*t*-57+t*t*34,y=m*m*2+2*m*t*-70+t*t*-48;path(c,`M${x-7} ${y+3} l6 -9 l8 9Z`,P(a,-.22),P(a,-.45),.5);}c.save();c.clip(body);for(let i=0;i<6;i++)path(c,`M58 ${33+i*2.6} Q20 ${44+i*2.6} -30 ${42+i*2.2}`,null,P(a,-.35,.4),.7);for(let i=0;i<12;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);const x=-70+fu*120,y=-44+fv*50;path(c,`M${x} ${y} l${5+(i%4)*3} ${(i%3)*2-2} l${3+(i%3)*2} ${3-(i%4)*2}`,null,P(a,-.42,.35),.6);}c.restore();crisp(c,(c)=>{for(let i=0;i<11;i++)ellipse(c,-52+i*10,36+Math.sin(i*.6)*2.6,1.5,1.2,P('#bff3ff',0,.85));});}
}
function livingOcean(c,res,p,P,low){
 const a=res.colors.primary,b=res.colors.secondary;
 const body=path(c,'M-147 25 C-112 6 -112 -26 -69 -17 C-24 -7 -16 -68 26 -62 C74 -59 89 -25 64 -12 C80 -46 27 -48 37 -13 C45 15 96 -6 151 34 C82 71 -76 69 -147 25Z',grad(c,P,a,b,-65,70),P(b,0,.6),1);
 c.save();c.clip(body);for(let i=0;i<12;i++){const y=-25+i*8;path(c,`M-145 ${y} C-60 ${y+20+Math.sin(p.swim+i)*9} 5 ${y-22} 155 ${y+3}`,null,P(i%2?b:'#116b8b',0,.45),1.6);}c.restore();
 path(c,'M-143 25 Q-109 12 -98 -8 Q-82 -25 -62 -16 M-23 -28 Q-2 -64 29 -62 Q70 -59 72 -29',null,P('#e7fff5',0,.88),4);
 for(let i=0;i<24;i++){const x=-100+(i*43)%230,y=24+Math.sin(i+p.swim)*16;ellipse(c,x,y,1+(i%3),1,P('#eafff6',0,.6));}
}
function skeleton(c,res,p,P,low){
 const bone=P('#ded6bc'),shade=P('#8f927d'),sw=swing(p,5);
 path(c,'M-95 0 Q-13 -24 66 -12 L96 -1',null,bone,5);
 for(let i=0;i<20;i++){const x=-90+i*8;ellipse(c,x,-4-Math.sin(i/19*Math.PI)*7,3,4,bone);}
 for(let i=0;i<11;i++){const x=-52+i*10,w=13+Math.sin(i/11*Math.PI)*14;path(c,`M${x} -12 Q${x-15} ${w} ${x+7} ${w-2}`,null,bone,2.2);path(c,`M${x+1} -10 Q${x+13} ${w-6} ${x+7} ${w-2}`,null,shade,1);}
 path(c,'M57 -16 Q81 -25 104 -6 L92 4 L65 1Z',bone,shade,1);ellipse(c,77,-10,7,5,P('#122b35'));ownEye(c,77,-10,2.6,'');
 path(c,'M64 12 L92 13 L104 3',null,bone,4);teeth(c,P,{x0:66,y0:0,x1:99,y1:1},{type:'triangle',size:3.1,color:'#f3ead5',gum:false});teeth(c,P,{x0:66,y0:12,x1:91,y1:12.5,upper:false},{type:'triangle',size:2.6,color:'#f3ead5',gum:false});
 for(let i=0;i<7;i++){path(c,`M-90 0 L${-128+i*4} ${-47+sw+i*5}`,null,bone,1.4);path(c,`M-90 2 L${-127+i*4} ${34+sw-i*4}`,null,bone,1.2);path(c,`M-11 -11 L${-15+i*4} ${-58+i*6}`,null,bone,1.2);path(c,`M25 10 L${-4+i*4} ${49-i*4}`,null,bone,1.3);}
}
function leatherback(c,res,p,P,low){
 const a=res.colors.primary,b=res.colors.secondary,sw=swing(p,8);
 path(c,`M21 -11 Q-23 ${-73-sw} -44 -65 L-5 -7 M22 10 Q-18 ${83+sw} -39 68 L-6 6 M-45 -11 L-77 -37 L-63 0 M-45 13 L-77 36 L-60 0`,P(a,-.1));
 const body=path(c,'M-67 0 Q-30 -35 21 -23 Q48 -16 48 0 Q44 24 15 26 Q-34 31 -67 0Z',grad(c,P,a,b));
 for(let i=-3;i<=3;i++)path(c,`M-60 0 Q-10 ${i*11} 39 ${i*4}`,null,P('#b0b9ae',0,.8),1.3);
 if(!low)skin(c,body,P,'#dbe0c9',res.seed,120);
 path(c,'M38 -10 Q74 -17 78 -2 Q73 12 40 10Z',P(a));eye(c,65,-6,P,2);path(c,'M66 5 L76 2',null,P('#192c31'),1);
}
// True seals (harbour, Baikal, Saimaa ringed, Hawaiian monk), redrawn 2026-11-14: a plump torpedo with no neck to speak of, a
// rounded, dog-like head with a short muzzle and V-shaped nostrils, big dark eyes and no ear flaps, small clawed fore-flippers,
// and two webbed hind flippers held together behind, which sweep as it swims. Light from above: the back darker, the belly pale.
function seal(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),spread=Math.sin(p.swim)*3.5,far=farPalette(P);
 // Hind flippers: a fan of five webbed toes, the outer toes longest, so the trailing edge dips in the middle.
 const hind=(dy,o,fill)=>{const d=`M-68 ${dy} Q-80 ${dy-3} -88 ${dy-4+o*.2} Q-100 ${dy-13+o+sw} -114 ${dy-15+o+sw} Q-108 ${dy-6+o*.6+sw} -105 ${dy+1+sw} Q-108 ${dy+7-o*.4+sw} -114 ${dy+15-o+sw} Q-100 ${dy+14-o+sw} -88 ${dy+5} Q-78 ${dy+7} -68 ${dy+8}Z`;
  path(c,d,fill,P(a,-.45,.6),.6);if(!low)for(const [x,y] of [[-110,-11],[-107,-5],[-105,1],[-107,7],[-110,12]])line(c,[[-90,dy+.5],[x,dy+y+(y<0?o:-o)*.6+sw]],P(a,-.36,.32),.5);};
 // Both behind the body, which tapers into them; the far one higher and in shadow.
 hind(-5,spread,far(a,-.05));hind(2,-spread,grad(c,P,a,a,-12,14));
 // The far fore-flipper, in the body's shadow.
 path(c,'M48 14 Q50 27 42 32 Q37 34 36 30 Q38 22 40 14Z',far(a,-.08));
 const body=path(c,'M-84 5 C-62 -22 -20 -36 14 -35 C44 -34 60 -31 70 -29 C82 -29 92 -26 96 -18 C99 -13 104 -9 107 -4 C109 0 106 5 99 7 C92 10 86 10 80 12 C60 23 20 30 -10 28 C-40 26 -64 16 -84 5Z',grad(c,P,a,b,-36,30),P(a,-.42),.7);
 c.save();c.clip(body);
 // A pale muzzle and throat; the face reads as the seal's.
 const mz=c.createRadialGradient(101,-2,1,99,-1,13);mz.addColorStop(0,P(b,.06,.95));mz.addColorStop(1,P(b,0,0));c.fillStyle=mz;c.fillRect(84,-16,26,26);
 c.restore();
 if(!low){skin(c,body,P,a,r.seed,160);c.save();c.clip(body);
  if(r.species==='saimaa_ringed_seal')for(let i=0;i<30;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-70+(u-Math.floor(u))*140,y=-34+(v-Math.floor(v))*50,rr=3+(i%3)*1.4;c.strokeStyle=P(b,.1,.75);c.lineWidth=1.3;c.beginPath();c.ellipse(x,y,rr*1.3,rr,i*.5,0,TAU);c.stroke();}
  // A harbour seal's dark spots, and a few pale rings among them; each seal's are its own (render/variation.js).
  if(r.species==='harbour_seal'){const sv=variantOf(r)*1.618;for(let i=0;i<64;i++){const u=Math.sin(i*12.9898+sv)*43758.5453,v=Math.sin(i*78.233+sv)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);const x=-72+fu*150,y=-36+fv*58;if(x>78)continue;ellipse(c,x,y,1.4+(i%4)*.7,1+(i%3)*.5,P(a,-.42,.55),i*.4);if(i%5===0)ellipse(c,x,y,.6+(i%4)*.3,.45+(i%3)*.2,P(a,.1,.6),i*.4);}}
  c.restore();}
 // Nostrils in a V at the tip of the muzzle, a small mouth, whisker pads and the ear opening behind the eye.
 ellipse(c,105,-4.6,2.6,1.9,P('#26353b'));path(c,'M103.2 -5.4 l1.6 1.6 M106.8 -5.4 l-1.6 1.6',null,P('#0f1c20'),.8);
 faceLine(c,P,'M105 2.4 Q102 4.4 97 3.8',P('#1d2a2e',0,.8),.9);
 if(!low){for(let i=0;i<10;i++)ellipse(c,97+(i%4)*2.6,-2+Math.floor(i/4)*2.4,.45,.4,P('#2b383b',0,.7));ellipse(c,73,-14,1,.8,P(a,-.55,.8));}
 crisp(c,(c)=>{for(let i=0;i<6;i++)path(c,`M101 ${-1+i*.8} Q114 ${-8+i*4} 122 ${-10+i*5.5}`,null,P('#d7dedb',0,.8),.6);});
 eye(c,85,-15,P,4.3,{iris:'#2a1d14'});
 // The near fore-flipper: short, with five claws along its tip.
 path(c,'M63 14 Q64 26 55 32 Q49 36 47 32 Q49 24 50 16 Q56 12 63 14Z',grad(c,P,a,a,8,36));path(c,'M63.6 18 Q64 26 55 32 Q49 36 47 32 Q48.6 26 49.6 20',null,P(a,-.45,.6),.6);
 if(!low)for(let i=0;i<5;i++)line(c,[[48.6+i*1.5,32.6-i*.9],[47.6+i*1.5,35-i*.9]],P('#1d2224',0,.8),.7);
}
// The older round seal body: walruses and Weddell seals are drawn on it (pinniped).
function pinnipedBody(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 path(c,'M-69 7 Q-104 -17 -111 -5 L-94 13 L-112 29 Q-88 40 -67 17Z',finFill(c,P,a,-70,10,-112,10),P(a,-.42),.6);
 if(!low)for(const [x,y] of [[-104,-5],[-100,3],[-101,23],[-99,31]])line(c,[[-74,10],[x,y]],P(a,-.34,.5),.6);
 const body=path(c,'M-83 4 C-77 -47 15 -61 57 -25 Q87 -16 83 8 Q77 42 26 43 Q-49 48 -83 4Z',grad(c,P,a,b));
 path(c,'M13 21 Q-10 65 -34 43 L-14 15Z',P(a,-.2));ellipse(c,67,-7,25,22,grad(c,P,a,b));ellipse(c,82,3,16,11,P(b,-.1));eye(c,67,-13,P,6,{iris:'#2a1d14'});ellipse(c,90,-2,4,3,P('#26353b'));path(c,'M87 -3 l3 2 l3 -2',null,P('#0f1c20'),.8);if(!low)for(let i=0;i<12;i++)ellipse(c,78+(i%4)*4,1+Math.floor(i/4)*3.2,.45,.4,P('#2b383b',0,.7));
 crisp(c,(c)=>{for(let i=0;i<6;i++)path(c,`M83 5 Q104 ${-8+i*5} 113 ${-10+i*6}`,null,P('#d7dedb',0,.8),.6);});
 if(!low){skin(c,body,P,a,r.seed,160);if(r.species==='saimaa_ringed_seal'){c.save();c.clip(body);for(let i=0;i<30;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-74+(u-Math.floor(u))*140,y=-42+(v-Math.floor(v))*56,rr=3+(i%3)*1.4;c.strokeStyle=P(b,.1,.75);c.lineWidth=1.3;c.beginPath();c.ellipse(x,y,rr*1.3,rr,i*.5,0,TAU);c.stroke();}c.restore();}
  if(r.species==='harbour_seal'){c.save();c.clip(body);const sv=variantOf(r)*1.618;for(let i=0;i<64;i++){const u=Math.sin(i*12.9898+sv)*43758.5453,v=Math.sin(i*78.233+sv)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);const x=-80+fu*150,y=-46+fv*66;ellipse(c,x,y,1.4+(i%4)*.7,1+(i%3)*.5,P(a,-.42,.55),i*.4);if(i%5===0)ellipse(c,x,y,.6+(i%4)*.3,.45+(i%3)*.2,P(a,.1,.6),i*.4);}c.restore();}}
}
function wingSlug(c,r,p,P){
 // Glassy wings and body in the first colour, the gut showing through in the second.
 const sw=swing(p,18),a=r.colors.primary,b=r.colors.secondary;
 path(c,`M-8 -10 Q-62 ${-62+sw} -62 -12 Q-38 12 -8 9 M8 -10 Q62 ${-62-sw} 62 -12 Q38 12 8 9Z`,P(a,.02,.55),P(a,.12,.85),1);
 path(c,'M-12 -38 Q-24 -67 -9 -59 L-3 -48 L7 -59 Q22 -67 16 -33 Q23 0 1 65 Q-24 15 -12 -38Z',P(a,-.04,.5),P(a,.1,.85),1);
 ellipse(c,0,-33,10,18,P(b,.02,.88));path(c,'M-4 -17 Q-8 6 0 29 Q10 2 5 -17Z',P(b,-.1,.7));
}
// Long-bodied fish, each with its own fins and markings (2026-11-08 detail pass). The frilled shark keeps its design.
const LONG={
 sea_lamprey:{d:18,amp:10,eel:true,dor:[.08,.36,6],anal:null,tail:'point',snout:'round'},
 // Electric eel (15 Nov 2026): thick and round from the broad flat head back, tapering only towards the tail, with a long rippling
 // fin under most of its length, a wide mouth and an orange throat. It had been a thin blade, pointed at both ends.
 electric_eel:{d:19,amp:11,eel:true,thickHead:true,dor:null,anal:[.03,.84,14],tail:'eel',snout:'round'},
 northern_pike:{d:23,amp:6,dor:[.08,.22,18],anal:[.08,.2,13],tail:'fork',snout:'duck'},
 alligator_gar:{d:21,amp:5,dor:[.08,.19,15],anal:[.07,.21,13],tail:'round',snout:'gar'},
 arowana:{d:33,amp:5,dor:[.06,.34,16],anal:[.05,.5,19],tail:'round',snout:'up'},
 pearlfish:{d:18,amp:9,eel:true,dor:[.02,.55,6],anal:[.02,.7,7],tail:'point',snout:'round'},
 barracuda:{d:21,amp:5,dor:[.14,.24,14],anal:[.12,.2,12],tail:'fork',snout:'duck'},
 amphioxus:{d:15,amp:8,eel:true,dor:[.04,.92,3],anal:[.04,.5,3],tail:'point',snout:'round'},
};
function longFish(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary;
 if(id==='frilled_shark'){frilledShark(c,r,p,P,low);return;}
 const C=LONG[id]||LONG.pearlfish,N=26,top=[],bot=[],mid=[];
 const wv=waveBody(p,x=>{const t=(x+160)/296;return Math.sin(p.swim-t*N*.17)*C.amp*Math.pow(Math.max(0,1-t),1.4);});
 for(let i=0;i<=N;i++){const t=i/N,x=-160+t*296,y=wv(x),w=C.thickHead?C.d*(.14+.86*Math.min(1,Math.pow(t/.62,.7))):C.eel?C.d*(.2+.8*Math.pow(Math.sin(Math.PI*Math.min(1,.06+t*.9)),.7)):C.d*(.22+.78*Math.pow(Math.sin(Math.PI*Math.min(1,.08+t*.76)),.6));mid.push([x,y,w]);top.push([x,y-w]);bot.unshift([x,y+w]);}
 const fin=(t0,t1,h,side,col)=>{const i0=Math.round(t0*N),i1=Math.max(i0+1,Math.round(t1*N)),edge=[],out=[];
  for(let i=i0;i<=i1;i++){const [x,y,w]=mid[i],u=(i-i0)/(i1-i0),hh=h*Math.pow(Math.sin(Math.PI*Math.min(1,u*.9+.08)),.6);edge.push([x,y+side*w*.85]);out.push([x-hh*.35,y+side*(w*.85+hh)]);}
  path(c,'M'+edge.map(q=>q.join(' ')).join(' L')+' L'+[...out].reverse().map(q=>q.join(' ')).join(' L')+'Z',col,P(a,-.35,.5),.5);
  if(!low)edge.forEach((e,k)=>line(c,[e,out[k]],P(a,-.3,.35),.45));};
 const [tx,ty,tw]=mid[0],[hx,hy,hw]=mid[N];
 // Tail first, then fins along the back and belly, then the body over their roots.
 if(C.tail==='fork')path(c,`M${tx+8} ${ty-tw} L${tx-30} ${ty-28} Q${tx-16} ${ty} ${tx-30} ${ty+28} L${tx+8} ${ty+tw}Z`,grad(c,P,a,b,-22,22),P(a,-.35),.5);
 if(C.tail==='round'){path(c,`M${tx+8} ${ty-tw} Q${tx-34} ${ty-C.d*1.1} ${tx-36} ${ty} Q${tx-34} ${ty+C.d*1.1} ${tx+8} ${ty+tw}Z`,P(a,.05,.78),P(a,-.35),.5);if(!low)for(let i=-4;i<=4;i++)line(c,[[tx+4,ty+i*tw*.2],[tx-32,ty+i*C.d*.22]],P(a,-.3,.45),.5);}
 if(C.tail==='point'||C.tail==='eel')path(c,`M${tx+10} ${ty-tw*1.5} Q${tx-10} ${ty} ${tx-18} ${ty+1} Q${tx-8} ${ty+4} ${tx+10} ${ty+tw*1.8}Z`,P(b,-.05,.75));
 if(C.dor)fin(C.dor[0],C.dor[1],C.dor[2],-1,P(a,-.05,.88));
 if(C.anal)fin(C.anal[0],C.anal[1],C.anal[2],1,P(C.tail==='eel'?b:a,-.08,.85));
 const snout=C.snout==='duck'?` L${hx+28} ${hy-2.5} Q${hx+32} ${hy} ${hx+28} ${hy+3}`:C.snout==='gar'?` L${hx+40} ${hy-3} Q${hx+45} ${hy} ${hx+40} ${hy+3.5}`:C.snout==='up'?` L${hx+12} ${hy-hw*1.05} L${hx+16} ${hy-hw*.7} Q${hx+14} ${hy+hw*.5} ${hx+4} ${hy+hw*.9}`:` Q${hx+14} ${hy-hw*.7} ${hx+16} ${hy} Q${hx+14} ${hy+hw*.7} ${hx+2} ${hy+hw*.95}`;
 const body=path(c,'M'+top.map(q=>q.join(' ')).join(' L')+snout+' L'+bot.map(q=>q.join(' ')).join(' L')+'Z',grad(c,P,a,b,-C.d,C.d),P(a,-.38),.7);
 if(!low){skin(c,body,P,a,r.seed,120);c.save();c.clip(body);
  if(id==='barracuda'){ellipse(c,20,14,140,9,P('#f4f1e6',0,.7));for(let i=0;i<18;i+=3){const [x,y,w]=mid[3+i];ellipse(c,x,y-w*.35,4.5,w*.5,P('#27333a',0,.5));}}
  if(id==='amphioxus')for(let i=2;i<N;i++){const [x,y,w]=mid[i];path(c,`M${x+3} ${y-w} L${x-3} ${y} L${x+3} ${y+w}`,null,P(a,-.25,.6),.8);}
  if(id==='electric_eel'){ellipse(c,80,13,82,10,P(b,.12,.85));ellipse(c,128,12,20,8,P(b,.2,.85));for(let row=0;row<3;row++)for(let i=0;i<14;i++)ellipse(c,40+i*7,-8+row*4,.7,.6,P('#e8dcc0',0,.45));line(c,mid.slice(3).map(([x,y])=>[x,y-1]),P('#d9c79a',0,.35),.6);}
  if(id==='northern_pike'){ellipse(c,20,12,140,8,P('#f2ecd0',0,.65));for(let i=0;i<44;i++){const [x,y,w]=mid[2+(i*7)%22];ellipse(c,x+((i*13)%9)-4,y-w*.6+((i*29)%100)/100*w*1.1,3,1.5,P('#e9e4b6',0,.75),.2);}}
  if(id==='alligator_gar'){for(let i=2;i<N;i++){const [x,y,w]=mid[i];for(let j=-2;j<=2;j++)path(c,`M${x} ${y+j*w*.36-3} l4 3 l-4 3 l-4 -3Z`,null,P(a,-.3,.45),.5);}for(let i=0;i<16;i++){const [x,y,w]=mid[2+i];ellipse(c,x,y-w*.55,2.4,1.8,P('#2b2a1c',0,.6));}}
  if(id==='arowana'){for(let row=0;row<5;row++)for(let i=0;i<13;i++){const x=-130+i*21+(row%2)*10,y=-C.d*.8+row*C.d*.38;path(c,`M${x} ${y-6} q9 6 0 12`,P('#ffffff',0,.08),P('#f2b8c6',0,.55),1);}ellipse(c,0,-C.d*.5,120,4,P('#ffffff',0,.3));}
  if(id==='pearlfish'){line(c,mid.slice(1).map(([x,y])=>[x,y]),P('#c9b4a8',0,.55),1.4);for(let i=0;i<40;i++){const [x,y,w]=mid[1+(i*5)%24];ellipse(c,x,y+((i*37)%100)/100*w-w*.5,.8,.7,P('#ffffff',0,.75));}}
  c.restore();}
 // Head details: eye, mouth, teeth, barbels.
 const ex=C.snout==='duck'?hx-4:C.snout==='gar'?hx-2:C.snout==='up'?hx-4:hx+2,ey=hy-hw*(C.snout==='up'?.35:.4);
 if(id!=='amphioxus')eye(c,ex,ey,P,id==='arowana'?3.2:id==='electric_eel'?1.9:id==='pearlfish'?2.2:2.4);
 if(id==='electric_eel')faceLine(c,P,`M${hx+15} ${hy+3} Q${hx+6} ${hy+7} ${hx-6} ${hy+6}`,P('#1e1c16',0,.8),1.2);
 if(C.snout==='duck'){teeth(c,P,{x0:hx+5,y0:hy+.7,x1:hx+27,y1:hy+.1},{type:'needle',size:1.5,color:'#efe7cf',gum:false});faceLine(c,P,`M${hx+2} ${hy+1} L${hx+28} ${hy}`,P('#2a2e24'));}
 if(C.snout==='gar'){teeth(c,P,{x0:hx+1,y0:hy+1,x1:hx+39,y1:hy+.6},{type:'needle',size:1.8,color:'#efe7cf',gum:false});teeth(c,P,{x0:hx+2,y0:hy+1.2,x1:hx+38,y1:hy+.8,upper:false},{type:'needle',size:1.5,color:'#efe7cf',gum:false});faceLine(c,P,`M${hx-2} ${hy+1} L${hx+40} ${hy+.5}`,P('#2a2e24'));ellipse(c,hx+42,hy-1.5,1,.7,P('#2a2e24'));}
 if(C.snout==='up'){path(c,`M${hx+14} ${hy-hw*.9} Q${hx+4} ${hy-hw*.1} ${hx-6} ${hy+hw*.2}`,null,P('#2a2e24'),1.1);for(const dx of [0,3])path(c,`M${hx+12+dx} ${hy-hw*.75} q8 -4 14 -12`,null,P(a,-.15),1.4);}
 // Sea lamprey: no jaw, but a round sucking disc ringed with horny teeth, and seven gill pores in a row.
 if(id==='sea_lamprey'){oval(c,hx+16,hy+2,4,8,P(a,-.25),P(a,-.5,.8),.6);ellipse(c,hx+16.6,hy+2,2.4,5.6,P('#3a1c22'));for(let i=0;i<8;i++){const q=i/8*TAU;ellipse(c,hx+16.6+Math.cos(q)*1.6,hy+2+Math.sin(q)*4,.45,.45,P('#efe6c8'));}for(let i=0;i<7;i++)ellipse(c,hx-6-i*4.2,hy+1,1.1,1.4,P('#1a1614',0,.85));}
 else if(C.snout==='round')path(c,`M${hx+14} ${hy+1} Q${hx+8} ${hy+4} ${hx+1} ${hy+3}`,null,P(a,-.5),1);
 // Pectoral fin behind the head.
 path(c,`M${hx-22} ${hy+hw*.3} Q${hx-40} ${hy+hw*1.6} ${hx-48} ${hy+hw*1.4} Q${hx-36} ${hy+hw*.7} ${hx-26} ${hy+hw*.15}Z`,P(a,.1,.7),P(a,-.3,.5),.5);
 if(!low)path(c,`M${hx-24} ${hy-hw*.75} Q${hx-30} ${hy} ${hx-24} ${hy+hw*.75}`,null,P(a,-.4,.6),1);
}
function frilledShark(c,r,p,P,low){
 const fr=true,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,12);
 const body=path(c,`M-160 ${sw} Q-95 ${-17-sw} -10 -19 Q73 -29 126 -13 Q146 -5 137 9 Q74 31 -12 18 Q-94 ${8-sw} -160 ${sw}Z`,grad(c,P,a,b));
 path(c,`M-151 ${sw} Q-70 36 72 21 L96 13 Q-3 44 -98 ${18+sw}Z`,P(b,-.2,.65));
 if(fr){path(c,'M-92 -8 Q-108 -39 -83 -34 L-60 -14Z',P(a));path(c,'M54 12 L26 44 L16 10Z',P(a));for(let i=0;i<6;i++)path(c,`M${77-i*5} -15 q-7 14 0 32`,null,P('#b9a094'),2);}
 path(c,'M106 8 Q123 13 139 1',null,P('#292d2b'),2);if(fr)teeth(c,P,{x0:107,y0:8.3,x1:134,y1:5.6,bend:1.5},{type:'needle',size:3,color:'#e7e1d1',gum:false});
 eye(c,119,-9,P,fr?2:1.5);if(!low)skin(c,body,P,a,r.seed,120);
}
// The hammer (cephalofoil), redrawn 15 Nov 2026: a thin flat wing across the front of the head, not a rounded paddle, so it reads as a
// hammer at phone size. Seen from the side and a little above, the far lobe rises up and a little back and the near lobe comes down
// and a little forward, with an eye at each tip, the scalloped notches of the front edge, and the body narrowing into its middle.
// The head seen from above, so its shape tells the four apart (2026-11-15): the great hammerhead's is nearly straight across
// the front with a notch in the middle; the scalloped hammerhead's is arched, with a deep notch in the middle and a shallow
// one either side; the bonnethead's is a rounded shovel; the winghead's narrow blades span half the length of its body.
const HAMMER_HEADS={
 scalloped_hammerhead:{edge:'M62 -18 Q72 -24 78 -36 Q84 -50 90 -56 Q99 -60 104 -54 Q106 -46 108 -38 Q110 -32 108 -26 Q110 -18 112 -10 Q114 -4 110 0 Q114 4 112 10 Q110 18 108 26 Q110 32 108 38 Q106 46 104 54 Q99 60 90 56 Q84 50 78 36 Q72 24 62 18',eyes:[[100,-56],[100,56]],ridge:'M92 -50 Q99 -20 100 0 Q99 22 92 50'},
 bonnethead:{edge:'M62 -16 Q66 -30 76 -32 Q92 -30 100 -14 Q103 -6 103 0 Q103 6 100 14 Q92 30 76 32 Q66 30 62 16',eyes:[[78,-31],[78,31]],ridge:'M86 -24 Q94 -8 94 0 Q94 8 86 24'},
 winghead_shark:{edge:'M62 -14 Q72 -22 78 -46 Q82 -80 86 -102 Q92 -110 98 -104 Q98 -80 96 -50 Q96 -24 104 -8 Q108 0 104 8 Q96 24 96 50 Q98 80 98 104 Q92 110 86 102 Q82 80 78 46 Q72 22 62 14',eyes:[[92,-104],[92,104]],ridge:'M90 -96 Q94 -40 98 0 Q94 40 90 96'},
};
function hammerhead(c,r,p,P,low){shark(c,r,p,P,low);const a=r.colors.primary,b=r.colors.secondary,own=HAMMER_HEADS[r.species];
 if(own){const hg=c.createLinearGradient(0,-60,0,60);hg.addColorStop(0,P(a,-.22));hg.addColorStop(.45,P(a,.04));hg.addColorStop(.7,P(b,-.02));hg.addColorStop(1,P(b,-.2));
  const head=path(c,own.edge+'Z',hg);path(c,own.edge,null,P(a,-.4,.65),.8);
  if(!low){skin(c,head,P,a,r.seed,26);c.save();c.clip(head);path(c,own.ridge,null,P(a,.2,.3),1.4);c.restore();}
  for(const [x,y] of own.eyes)eye(c,x,y,P,2,{iris:'#262f33'});return;}

 const hg=c.createLinearGradient(0,-56,0,54);hg.addColorStop(0,P(a,-.22));hg.addColorStop(.45,P(a,.04));hg.addColorStop(.7,P(b,-.02));hg.addColorStop(1,P(b,-.2));
 const edge='M62 -18 Q76 -22 81 -32 Q85 -46 87 -54 Q91 -61 101 -61 Q112 -60 113 -52 Q111 -45 112 -38 Q113 -31 110 -25 Q108 -18 111 -12 Q113 -6 112 -2 Q114 2 112 6 Q109 12 111 18 Q113 25 110 31 Q108 37 110 43 Q111 52 104 57 Q94 60 88 55 Q84 47 80 35 Q74 20 62 16',head=path(c,edge+'Z',hg);path(c,edge,null,P(a,-.4,.65),.8);
 if(!low){skin(c,head,P,a,r.seed,26);c.save();c.clip(head);let d='';for(let i=0;i<32;i++)d+=`M${104+(i%3)*2} ${-52+i*3.3} l.5 .2`;path(c,d,null,P(a,-.6,.6),.7);path(c,'M95 -54 Q100 -20 101 0 Q102 22 97 52',null,P(a,.2,.3),1.4);c.restore();path(c,'M110 -42 l1.4 6 M109 30 l2 6',null,P(a,-.55,.8),1);}
 eye(c,106,-54,P,2,{iris:'#262f33'});eye(c,103,52,P,2,{iris:'#262f33'});}
function smallFish(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6);
 if(id==='pufferfish'){
 path(c,`M-57 0 L-97 ${-23+sw} L-94 ${27+sw} L-53 11Z`,P(a));const body=path(c,'M-60 0 C-66 -73 70 -74 74 -4 Q90 61 9 61 Q-58 60 -60 0Z',grad(c,P,a,b));
 c.save();c.clip(body);ellipse(c,6,48,70,20,P(b,.12,.75));if(!low){skin(c,body,P,a,r.seed,50);for(let row=0;row<13;row++)for(let i=0;i<16;i++){const x=-68+i*10+(row%2)*5+Math.sin(i*7.3+row*3.1)*1.8,y=-58+row*9.4+Math.sin(i*2.7+row*5.3)*1.6;ellipse(c,x,y,1.9,1.7,P('#f2ecd6',0,.95));}}c.restore();path(c,`M-30 -46 Q-44 -66 -54 -58 Q-50 -46 -46 -36Z`,finFill(c,P,a,-38,-42,-52,-60),P(a,-.4),.6);path(c,`M24 6 Q${6+sw*.6} ${-8+sw} ${-6+sw*.6} ${6+sw} Q${4+sw*.4} ${26+sw*.6} 26 22Z`,finFill(c,P,a,22,12,-4,10),P(a,-.4),.6);path(c,'M74 -6 Q88 -7 88 1 Q88 8 76 9Z',P('#efe6cf'),P(a,-.5),.7);faceLine(c,P,'M87 1 L76 1',P('#3a332a'),.9);eye(c,52,-22,P,4,{iris:'#c9a84a'});return;}
 if(id==='blobfish'){
 path(c,'M-58 5 L-90 -14 L-85 28Z',P(a));const body=path(c,'M-68 3 Q-27 -12 0 -26 Q49 -52 77 -17 Q98 13 69 30 Q16 44 -68 3Z',grad(c,P,a,b));path(c,'M32 9 Q-9 45 -9 21Z',P(a,.1));if(!low)skin(c,body,P,a,r.seed);path(c,'M78 -14 Q104 -12 104 8 Q102 22 88 20 Q76 18 74 4Z',grad(c,P,a,b,-14,22),P(a,-.3),.7);path(c,'M52 22 Q70 31 88 20',null,P('#684f4a',0,.85),1.7);path(c,'M52 22 q-3 3 -6 2',null,P('#684f4a',0,.7),1.3);ellipse(c,84,-2,8,5,P('#ffffff',0,.16));eye(c,62,-14,P,2.8,{iris:'#2a2422'});return;}
 const fly=id==='flying_fish',tr=id==='reef_triggerfish',cory=id==='corydoras';
 path(c,`M-55 0 L-91 ${-23+sw} L-77 1 L-103 ${35+sw} L-56 9Z`,P(fly?'#7daeb9':a));
 if(fly){path(c,'M17 -7 Q-47 -89 -106 -65 L-62 -4Z',P('#96c9ce',0,.55));path(c,'M12 8 Q-25 95 -104 66 L-55 9Z',P('#96c9ce',0,.65));for(let i=0;i<9;i++){line(c,[[11,5],[-98+i*9,70-i*2]],P('#b8dadd',0,.6),.7);line(c,[[14,-3],[-101+i*9,-65+i*2]],P('#b8dadd',0,.6),.7);}}
 path(c,tr?'M-25 -24 L-10 -66 L0 -29Z':cory?'M-34 -18 L-19 -51 L9 -20Z':'M-33 -10 L-27 -29 L-4 -11Z',P(a));
 const body=path(c,tr?'M-61 2 Q-40 -43 8 -38 L72 -1 Q37 36 -18 34Z':cory?'M-63 5 Q-34 -34 21 -24 L68 12 Q43 26 -19 23Z':'M-65 0 Q-14 -18 41 -10 L75 0 Q39 15 -65 7Z',grad(c,P,a,b));
 if(tr){path(c,'M-3 -35 L24 -20 L54 -18 L41 -7 L15 -11 L-8 32 L-22 27 L-1 -8 L-33 -17Z',P('#253b3e'));path(c,'M19 -26 L50 -12',null,P('#4ba9b0'),4);path(c,'M-52 4 L-31 -6 L-34 17Z',P('#f1c352'));ellipse(c,68,1,5,4,P('#496f83'));}
 if(cory){for(let i=0;i<9;i++)path(c,`M${-46+i*10} -13 l-5 14 l8 13`,null,P(a,-.35),1);for(let i=0;i<3;i++)path(c,`M62 15 q16 ${i*4} 19 ${8+i*4}`,null,P(b),1);}
 path(c,'M24 7 Q-1 30 -9 13Z',P(b,0,.6));eye(c,tr?42:48,tr?-14:-6,P,2.3);if(!low)skin(c,body,P,a,r.seed,60);
}
function mosasaur(c,r,p,P,low){
 // Tylosaurus had a long bony snout (rostrum) reaching past its front teeth, used to ram prey.
 // 2026-11-13: deeper and more reptilian, with four big paddle flippers (the far pair in shadow) and the downturned tail
 // fluke known from fossils with soft tissue: a shark-like tail upside down, the backbone bending into the bigger lower lobe.
 // 15 Nov 2026: a long tapering, lizard-like tail section, not a whale's stubby one.
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,8),fl=Math.sin(p.swim*1.2)*8,tylo=r.species==='tylosaurus',nx=tylo?20:0;
 path(c,`M-148 ${2+sw} Q-166 ${-6+sw} -178 ${-34+sw} Q-178 ${-6+sw} -186 ${8+sw} Q-180 ${30+sw} -170 ${46+sw} Q-160 ${22+sw} -146 ${14+sw}Z`,P(a,-.1),P(a,-.45),1);
 const flipper=(x,y,len,k,fill,stroke)=>path(c,`M${x+8} ${y-2} Q${x+10} ${y+len*.5+fl*k} ${x-len*.42} ${y+len*.92+fl*k} Q${x-len*.66} ${y+len*.98+fl*k} ${x-len*.62} ${y+len*.72+fl*k} Q${x-len*.55} ${y+len*.32} ${x-24} ${y}Z`,fill,stroke,.8);
 flipper(64,10,54,-1,P(a,-.32));flipper(-32,10,42,1,P(a,-.32));
 const body=path(c,`M-150 ${4+sw} Q-112 ${-12+sw*.5} -54 -32 Q0 -46 56 -42 Q86 -38 100 -30 Q118 -34 138 -26 L${176+nx} ${tylo?-10:-12} Q${188+nx*1.2} -2 ${180+nx} 6 L144 16 Q124 26 104 22 Q80 40 10 38 Q-60 32 -110 ${18+sw*.5} Q-134 ${14+sw} -150 ${12+sw}Z`,grad(c,P,a,b,-46,40),P(a,-.45),.8);
 if(!low){skin(c,body,P,a,r.seed,180);c.save();c.clip(body);path(c,'M-150 22 Q0 48 176 6 L180 50 L-150 50Z',P(b,0,.55));
 let sc='';for(let row=0;row<15;row++)for(let x=-150+(row%2)*4;x<172;x+=8)sc+=`M${x} ${-44+row*5.6} l4 -2.6 l4 2.6 l-4 2.6Z`;path(c,sc,null,P(a,-.42,.2),.45);
 for(let i=0;i<8;i++){const x=-126+i*32;path(c,`M${x} -46 Q${x+8} -26 ${x-2} -12 Q${x+14} -22 ${x+16} -46Z`,P(a,-.38,.32));}
 path(c,'M-150 6 Q-40 -4 112 -4',null,P(b,.1,.28),.6);
 for(let i=0;i<5;i++)path(c,`M${110+i*7} 16 q-4 6 -10 8`,null,P(a,-.4,.35),.8);
 c.restore();
 ellipse(c,tylo?170:166,-8,1.8,.8,P(a,-.6,.8),-.1);}
 // The near flippers: long paddles with the finger bones showing through.
 const near=[[76,12,62,1],[-22,14,50,-1]];
 for(const [x,y,len,k] of near)flipper(x,y,len,k,grad(c,P,a,a,y,y+len),P(a,-.45));
 if(!low)for(const [x,y,len,k] of near)for(let i=0;i<4;i++)path(c,`M${x+2-i*7} ${y+4} Q${x-2-i*8} ${y+len*.5+fl*k} ${x-len*.42-i*4} ${y+len*.86+fl*k-i*2}`,null,P(a,-.5,.45),.7);
 if(tylo){ellipse(c,184+nx*.6,0,12,5,P(a,-.12));if(!low)for(let i=0;i<5;i++)path(c,`M${180+i*5} -5 q2 5 0 10`,null,P(a,-.35,.5),.7);}
 teeth(c,P,{x0:114,y0:2.8,x1:178,y1:0},{type:'fang',size:3,color:'#efe7cb'});teeth(c,P,{x0:117.3,y0:5,x1:174.7,y1:2.4,upper:false},{type:'fang',size:3,color:'#efe7cb'});faceLine(c,P,'M112 4 L178 1',P('#1f312c'),1.5);
 // Phosphorosaurus, a small mosasaur, had big eyes facing forward for judging distance, likely hunting at night.
 eye(c,r.species==='phosphorosaurus'?132:128,r.species==='phosphorosaurus'?-15:-14,P,r.species==='phosphorosaurus'?4:2.6,{iris:'#c9a23c',slit:true});path(c,'M118 -20 Q128 -27 140 -19',null,P(a,-.5),1.8);
}
function colossal(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 path(c,'M-122 0 C-129 -72 -29 -76 14 -19 L10 18 C-42 84 -126 65 -122 0Z',P(a,-.12));
 for(let i=0;i<8;i++){const y=(i-3.5)*5;path(c,`M30 ${y} Q89 ${y*2+Math.sin(p.swim+i)*14} ${126+(i%3)*15} ${y*2} q${18+(i%2)*9} ${-9+Math.sin(p.swim+i)*10} ${8+(i%3)*9} -19`,null,P(a,i%2?.1:-.15),7);if(!low)for(let j=0;j<6;j++)path(c,`M${65+j*13} ${y*1.6} q4 -7 7 -3`,null,P('#513b31'),1.3);}
 for(const side of [-1,1])path(c,`M37 ${side*8} Q120 ${side*65} 197 ${side*46} l17 -9`,null,P(a,.1),6);
 const body=path(c,'M-127 0 C-107 -49 -20 -47 38 -15 L41 16 C-27 51 -107 48 -127 0Z',grad(c,P,a,b));eye(c,29,0,P,9);if(!low)skin(c,body,P,a,r.seed,120);
}
function fossil(c,r,p,P){ellipse(c,0,0,78,48,grad(c,P,r.colors.primary,r.colors.secondary));for(let i=-18;i<=18;i++){const x=i*4,h=46*Math.sqrt(1-(x/78)**2);path(c,`M${x} 0 Q${x-8} ${h*.4} ${x-5} ${h} M${x+2} 0 Q${x-6} ${-h*.4} ${x-4} ${-h}`,null,P('#846e58',0,.6),1);}line(c,[[-74,0],[75,0]],P('#e3c7a3'),2);}
function whimsical(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary;
  // White domestic (Pekin) duck, redrawn 15 Nov 2026 as one smooth bird: a plump boat-shaped body with the breast forward, a curved
  // neck and round head, a broad flat orange bill, a folded wing, an upturned tail with a curled feather, and orange webbed feet
  // paddling underneath. It had been an oval with a block of a neck.
 if(id==='white_duck'){const k=Math.sin(p.swim),F='#e8963a';
  const body=path(c,'M-86 -14 Q-74 -20 -56 -23 Q-20 -30 16 -22 Q30 -24 35 -40 Q39 -60 56 -66 Q74 -70 80 -56 Q82 -48 78 -44 Q68 -40 62 -32 Q56 -22 56 -8 Q56 14 40 22 Q12 32 -30 28 Q-62 24 -74 8 Q-82 -4 -86 -14Z',(()=>{const g=c.createLinearGradient(0,-68,0,30);g.addColorStop(0,P(a,.12));g.addColorStop(.55,P(a,0));g.addColorStop(1,P(b,-.18));return g;})(),P(a,-.3),.8);
  path(c,'M-82 -14 q-8 -10 2 -14 q4 2 1 6',null,P(a,-.25),3.4);
  c.save();c.clip(body);path(c,'M-52 0 Q-16 -14 20 -2 Q8 13 -26 13 Q-46 11 -56 5Z',P(a,-.04),P(a,-.22,.45),.7);if(!low)for(let i=0;i<4;i++)path(c,`M${-44+i*12} ${4+i*.5} q8 7 15 5`,null,P('#aeb8af',0,.5),1);c.restore();
  path(c,'M78 -54 Q94 -57 104 -51 Q107 -46 101 -44 Q90 -42 78 -45Z',P(F),P(F,-.4,.7),.6);path(c,'M80 -48 Q92 -48 103 -47',null,P(F,-.35,.7),.7);ellipse(c,86,-52,1.4,.8,P('#7a4a1c'));
  for(const [x,o,far] of [[-2,k,true],[14,-k,false]]){const fx=x-8-o*10,fy=42+o*3;line(c,[[x,24],[x-4-o*4,33],[fx,fy]],P(F,far?-.25:0),3);path(c,`M${fx} ${fy} l${-14-o*2} ${-3} l${2} ${7} l${-8} ${4} l${16+o*2} ${2}Z`,P(F,far?-.25:-.05),P(F,-.4,.6),.5);}
  eye(c,67,-55,P,2.2);return;}
 if(id==='chipmunk'){
 path(c,'M-93 93 L-41 17 L-13 49 L18 -4 L90 93Z',P('#637577'));path(c,'M18 -4 L0 34 L25 25 L44 43Z',P('#c5d1ca'));path(c,'M-28 23 Q-91 -6 -76 -51 Q-36 -47 -31 4',null,P(a),19);ellipse(c,-12,7,33,39,grad(c,P,a,b));for(let i=-1;i<=1;i++)path(c,`M${-22+i*8} -22 q-16 28 7 53`,null,P(i===0?'#332d28':'#e3cbaa'),4);ellipse(c,16,-24,25,23,P(a));ellipse(c,5,-44,7,10,P(a));ellipse(c,35,-17,11,9,P(b));eye(c,27,-31,P,3);ellipse(c,43,-19,3,3,P('#332d2a'));path(c,'M-18 34 L12 37 M6 9 L32 15',null,P(a),9);helmet(c,20,-24,39,P);return;}
 catFish(c,r,p,P,low);
}

// The Sea Eater, from the Trevor Henderson creature fandom (drawn as itself, owner 2026-11-10): a colossal tube of a body,
// grey and wrinkled, opening at the front into a huge round mouth ringed with teeth, and two long spindly arms with long
// fingers hanging from under its front. No eyes.
function seaEater(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,10),K='#120c0e';
 // The far arm, behind the body.
 const arm=(x0,far,ph)=>{const q=Math.sin(p.swim*.8+ph)*7,col=far?P(a,-.32):P(a,-.06),w=far?12:15,sh=[x0,40],el=[x0-18+q*.4,118],wr=[x0+40+q,178];
  // Upper arm down to a bony elbow, forearm reaching forward, then a hand of four long fingers.
  path(c,`M${sh[0]} ${sh[1]} Q${sh[0]-14} ${(sh[1]+el[1])/2} ${el[0]} ${el[1]}`,null,col,w);
  path(c,`M${el[0]} ${el[1]} Q${el[0]+8} ${el[1]+44} ${wr[0]} ${wr[1]}`,null,col,w*.8);
  ellipse(c,el[0],el[1],w*.62,w*.62,col);
  for(let i=0;i<4;i++){const ang=-.5+i*.34,l=34-Math.abs(i-1.5)*5;path(c,`M${wr[0]} ${wr[1]} q${Math.cos(ang)*l*.6} ${Math.sin(ang)*l*.4+8} ${Math.cos(ang)*l} ${Math.sin(ang)*l+14}`,null,col,far?3.4:4.2);}};
 arm(10,true,1.3);
 const body=path(c,`M-230 ${sw} C-200 ${-30+sw*.8} -140 -40 -60 -48 Q40 -60 120 -70 Q168 -78 182 -54 L188 54 Q170 78 120 70 Q40 62 -60 50 C-140 42 -200 ${30+sw*.8} -230 ${sw}Z`,grad(c,P,a,b,-72,72),P(a,-.45),1);
 c.save();c.clip(body);
 path(c,`M-230 ${12+sw} Q-60 50 190 60 L190 90 L-230 90Z`,P(b,-.05,.5));
 if(!low){skin(c,body,P,a,r.seed,220);for(let i=0;i<22;i++){const x=-190+i*17;path(c,`M${x} ${-30+Math.sin(i*1.7)*6} q-8 ${30+Math.sin(i)*8} 2 ${60+Math.sin(i*.7)*6}`,null,P(a,-.3,.4),1.2);}
  for(let i=0;i<40;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-200+(u-Math.floor(u))*360,-50+(v-Math.floor(v))*100,2.4,1.6,P(a,-.38,.5),i*.6);}}
 c.restore();
 // The mouth, seen a little from the side: a deep pit inside a fleshy rim, with rings of teeth pointing in.
 ellipse(c,182,0,26,66,P(a,-.2));
 ellipse(c,184,0,20,58,P('#5a3438'));
 const pit=c.createRadialGradient(188,0,4,186,0,52);pit.addColorStop(0,P(K));pit.addColorStop(.7,P('#2a1418'));pit.addColorStop(1,P('#6a3a3e'));ellipse(c,186,0,16,52,pit);
 for(const [rx,ry,n,s] of [[19,56,22,7],[13,40,16,5.5]])for(let i=0;i<n;i++){const ang=i/n*TAU,x=186+Math.cos(ang)*rx,y=Math.sin(ang)*ry,ix=186+Math.cos(ang)*(rx-s*.9),iy=Math.sin(ang)*(ry-s*1.6),tx=-Math.sin(ang),ty=Math.cos(ang)*(ry/rx);const tl=Math.hypot(tx,ty)||1;
  path(c,`M${(x+tx/tl*s*.35).toFixed(2)} ${(y+ty/tl*s*.9).toFixed(2)} L${ix.toFixed(2)} ${iy.toFixed(2)} L${(x-tx/tl*s*.35).toFixed(2)} ${(y-ty/tl*s*.9).toFixed(2)}Z`,P('#e8dcc4'),P('#8a7a62',0,.6),.4);}
 // The near arm, in front.
 arm(70,false,0);
}
// Rayquaza, the sky-dragon Pokémon, drawn as itself (owner, 2026-11-10): a long serpent body in dark green, a yellow line
// down each side that loops into hollow ovals, red-tipped fins along the back and on the tail, small clawed arms, and a head
// with long flat appendages sweeping back, edged in yellow, and yellow eyes.
function rayquaza(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#16261c',R='#d8402e',ph=p.swim;
 const at=(u)=>[-200+u*330,Math.sin(u*6.2-ph)*30*(1-u*.5)],wid=(u)=>11+24*Math.sin(Math.min(1,u*1.2)*Math.PI*.5)-u*6;
 const dir=(u)=>{const [x,y]=at(Math.max(0,u-.01)),[x2,y2]=at(Math.min(1,u+.01));return Math.atan2(y2-y,x2-x);};
 // Tail fin, red-tipped.
 const t0=at(0);path(c,`M${t0[0]+6} ${t0[1]} L${t0[0]-28} ${t0[1]-24} L${t0[0]-14} ${t0[1]} L${t0[0]-28} ${t0[1]+24}Z`,P(a,-.05),P(K,0,.7),1);
 for(const s of [-1,1])path(c,`M${t0[0]-28} ${t0[1]+s*24} L${t0[0]-20} ${t0[1]+s*15} L${t0[0]-30} ${t0[1]+s*14}Z`,P(R));
 // Fins along the back, red at the tips.
 for(const u of [.24,.44,.64]){const [x,y]=at(u),w=wid(u);path(c,`M${x-10} ${y-w*.8} L${x-26} ${y-w-26} L${x+8} ${y-w*.9}Z`,P(a,.05),P(K,0,.6),.8);path(c,`M${x-26} ${y-w-26} L${x-21} ${y-w-16} L${x-14} ${y-w-19}Z`,P(R));}
 // The body.
 for(let i=0;i<=60;i++){const u=i/60,[x,y]=at(u);ellipse(c,x,y,wid(u)*.9,wid(u),P(a,-.04));}
 for(let i=0;i<=60;i++){const u=i/60,[x,y]=at(u);ellipse(c,x,y+wid(u)*.35,wid(u)*.7,wid(u)*.5,P(a,.1,.45));}
 // The yellow line down the side, looping into hollow ovals.
 c.strokeStyle=P(b);c.lineWidth=2.6;c.lineCap='round';c.beginPath();for(let i=0;i<=56;i++){const u=.06+i/56*.84,[x,y]=at(u);c[i?'lineTo':'moveTo'](x,y-wid(u)*.1);}c.stroke();
 for(const u of [.16,.32,.48,.64,.8]){const [x,y]=at(u),w=wid(u);c.save();c.translate(x,y-w*.1);c.rotate(dir(u));c.fillStyle=P(a,-.02);c.beginPath();c.ellipse(0,0,w*.42,w*.5,0,0,TAU);c.fill();c.strokeStyle=P(b);c.lineWidth=2.6;c.stroke();c.restore();}
 // Small arms near the front, each with three claws.
 for(const [u,far] of [[.83,true],[.87,false]]){const [x,y]=at(u),w=wid(u),col=far?P(a,-.3):P(a,-.02);path(c,`M${x} ${y+w*.6} Q${x+4} ${y+w+10} ${x+10} ${y+w+16}`,null,col,far?4:5);for(let k=0;k<3;k++)path(c,`M${x+10} ${y+w+16} l${4+k*2} ${4-k*2}`,null,P('#f2ead2'),1.4);}
 // The head, with its long flat appendages sweeping back.
 const [hx,hy]=at(1),hs=1.35;c.save();c.translate(hx,hy);c.scale(hs,hs);c.translate(-hx,-hy);
 const blade=(bx,by,ang,l,w)=>{const ex=hx+bx+Math.cos(ang)*l,ey=hy+by+Math.sin(ang)*l,nx=-Math.sin(ang)*w/2,ny=Math.cos(ang)*w/2,mx=hx+bx+Math.cos(ang)*l*.55,my=hy+by+Math.sin(ang)*l*.55;
  path(c,`M${hx+bx+nx} ${hy+by+ny} Q${mx+nx*.8} ${my+ny*.8} ${ex} ${ey} Q${mx-nx*.8} ${my-ny*.8} ${hx+bx-nx} ${hy+by-ny}Z`,P(a,.04),P(b),1.8);};
 blade(-2,-10,-2.75,58,9);blade(4,-12,-2.55,44,7);blade(-6,6,2.8,34,6);blade(10,8,2.65,22,5);
 const head=path(c,`M${hx-10} ${hy-12} Q${hx+16} ${hy-18} ${hx+36} ${hy-6} Q${hx+42} ${hy} ${hx+34} ${hy+6} Q${hx+12} ${hy+14} ${hx-10} ${hy+12}Z`,grad(c,P,a,a,hy-18,hy+14),P(K,0,.7),1);
 path(c,`M${hx+36} ${hy+1} L${hx+8} ${hy+4}`,null,P(R),1.6);
 path(c,`M${hx+2} ${hy-14} Q${hx+12} ${hy-22} ${hx+20} ${hy-13}`,null,P(b),2.2);
 eye(c,hx+14,hy-6,P,2.6,{iris:'#f2d03a'});
 c.restore();
}
// Phytoplankton: the drifting algae of the sunlit sea, here diatoms, cells in glassy silica shells that often live joined
// in chains and clusters. A round centric diatom with ribs like a wheel, long boat-shaped pennate ones, and a chain of
// box-shaped cells, each with its golden-green chloroplasts inside, held together as one colony.
function phytoplankton(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,t=p.swim;
 const glass=()=>[P(b,0,.55),P(a,-.3,.85)];
 // A chain of cells.
 for(let i=0;i<4;i++){const x=-62+i*21,y=17+Math.sin(t*.6+i)*1.5;path(c,`M${x-10} ${y-9} L${x+10} ${y-9} Q${x+12} ${y} ${x+10} ${y+9} L${x-10} ${y+9} Q${x-12} ${y} ${x-10} ${y-9}Z`,...glass());for(let j=0;j<3;j++)ellipse(c,x-5+j*5,y+(j%2?2:-2),3,2.2,P(a,0,.85));}
 // A centric diatom.
 const cx=-10,cy=-18;ellipse(c,cx,cy,30,30,...glass());c.strokeStyle=P(a,-.25,.55);c.lineWidth=.7;
 for(let i=0;i<28;i++){const q=i/28*TAU;c.beginPath();c.moveTo(cx+Math.cos(q)*8,cy+Math.sin(q)*8);c.lineTo(cx+Math.cos(q)*29,cy+Math.sin(q)*29);c.stroke();}
 for(const rr of [8,18,26]){c.beginPath();c.arc(cx,cy,rr,0,TAU);c.stroke();}
 for(let i=0;i<6;i++){const q=i/6*TAU+t*.1;ellipse(c,cx+Math.cos(q)*15,cy+Math.sin(q)*15,4.5,3,P(a,.05,.8),q);}
 // Two pennate diatoms.
 for(const [x,y,ang,l] of [[36,-10,-.4,34],[30,24,.25,26]]){c.save();c.translate(x,y);c.rotate(ang+Math.sin(t*.5+x)*.05);ellipse(c,0,0,l,l*.22,...glass());c.strokeStyle=P(a,-.3,.5);c.lineWidth=.6;for(let i=-8;i<=8;i++){c.beginPath();c.moveTo(i*l/9,-l*.2);c.lineTo(i*l/9,l*.2);c.stroke();}path(c,`M${-l*.9} 0 L${l*.9} 0`,null,P(a,-.3,.6),.8);ellipse(c,-l*.35,0,l*.25,l*.12,P(a,0,.75));ellipse(c,l*.35,0,l*.25,l*.12,P(a,0,.75));c.restore();}
}
// Bahamut of Arabic and Islamic cosmology: the vast fish at the bottom of creation. On its back stands the bull Kuyuta,
// on the bull a rock of ruby, and on the rock an angel who holds up the earth. Drawn as the fish, with the bull and the rock.
function bahamut(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),K='#10202e';
 path(c,`M-150 -6 Q-182 ${-46+sw} -206 ${-62+sw} Q-190 ${-20+sw*.6} -184 ${sw*.4} Q-190 ${22+sw*.6} -206 ${62+sw} Q-182 ${46+sw} -150 8Z`,finFill(c,P,b,-150,0,-204,0),P(b,-.4),.8);
 path(c,'M40 36 Q20 74 -14 80 Q0 56 4 36Z',farPalette(P)(b,-.05));
 const body=path(c,'M-160 0 Q-120 -56 -10 -62 Q100 -64 160 -30 Q186 -12 188 4 Q184 22 156 34 Q90 62 -10 60 Q-120 56 -160 0Z',grad(c,P,a,b,-64,62),P(a,-.45),1);
 c.save();c.clip(body);path(c,'M-170 14 Q0 40 190 18 L190 70 L-170 70Z',P(b,.2,.55));
 if(!low)for(let row=0;row<6;row++)for(let i=0;i<20;i++){const x=-150+i*17+(row%2)*8,y=-50+row*18;path(c,`M${x} ${y} q8 6 0 12`,null,P(b,.1,.55),1.2);}
 c.restore();
 path(c,'M44 -60 Q20 -96 -60 -100 Q-40 -76 -40 -60Z',finFill(c,P,b,0,-62,-50,-98),P(b,-.4),.8);
 path(c,'M60 34 Q48 80 10 92 Q22 64 28 34Z',finFill(c,P,b,44,36,16,88),P(b,-.4),.8);
 faceLine(c,P,'M186 6 Q170 14 150 12',P(K,0,.8),1.4);
 eye(c,150,-12,P,4.5,{iris:'#e8c860'});
 // The bull Kuyuta standing on its back, and the ruby rock on the bull.
 const bx=-6,by=-60;const cow=P('#6a4a32');c.save();c.translate(bx,by);c.scale(1.7,1.7);c.translate(-bx,-by);
 for(const lx of [-14,-4,10,20])path(c,`M${bx+lx} ${by-14} L${bx+lx} ${by+2}`,null,cow,3.4);
 ellipse(c,bx+3,by-20,22,9,cow);ellipse(c,bx+28,by-26,8,6,cow);path(c,`M${bx+26} ${by-31} q-4 -8 -10 -8 M${bx+31} ${by-31} q4 -8 10 -8`,null,P('#e8dcc0'),1.6);
 path(c,`M${bx-19} ${by-22} q-8 6 -6 14`,null,cow,1.6);
 path(c,`M${bx-8} ${by-29} L${bx+2} ${by-48} L${bx+16} ${by-50} L${bx+20} ${by-30}Z`,P('#c0283a'),P('#6a0e1a'),1);path(c,`M${bx+2} ${by-46} L${bx+8} ${by-34}`,null,P('#ff8a9a',0,.7),1.2);
 c.restore();
}
// Aspidochelone, the "asp-turtle" of the medieval bestiaries: a sea creature so vast that sailors took it for an island,
// landed and lit their fires on its back, and were dragged under when it dived. Drawn as a giant sea turtle with its island.
function aspidochelone(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*10,K='#1e2418';
 path(c,`M60 20 Q40 ${60+f} -6 ${84+f} Q-10 ${70+f} 24 18Z`,farPalette(P)(a,-.05));
 path(c,`M-80 18 Q-104 ${36-f*.5} -120 ${46-f*.5} Q-104 ${30} -88 14Z`,farPalette(P)(a,-.05));
 // The head and neck.
 const head=path(c,'M92 0 Q120 -14 146 -8 Q160 -2 156 8 Q140 18 112 16 Q96 14 92 0Z',grad(c,P,a,b,-14,18),P(a,-.45),.8);
 eye(c,138,-3,P,3,{iris:'#3a2a14'});faceLine(c,P,'M156 6 Q144 10 132 9',P(K,0,.7),1);
 // The shell, and the island on it: sand, rocks, grass and two palms.
 const shell=path(c,'M-110 14 Q-100 -46 -10 -56 Q80 -54 104 10 Q60 30 -10 30 Q-80 30 -110 14Z',grad(c,P,a,b,-56,30),P(a,-.45),1);
 c.save();c.clip(shell);for(const [x,y] of [[-60,-14],[-14,-26],[34,-18],[-36,10],[12,6],[60,4]])path(c,`M${x-18} ${y} L${x-9} ${y-14} L${x+9} ${y-14} L${x+18} ${y} L${x+9} ${y+14} L${x-9} ${y+14}Z`,null,P(a,-.35,.6),1.4);c.restore();
 path(c,'M-84 -30 Q-40 -66 10 -64 Q60 -62 82 -26 Q30 -44 -20 -42 Q-60 -40 -84 -30Z',P('#e6d59a'),P('#b8a56a',0,.8),.8);
 for(const [x,y,rx] of [[-50,-46,10],[34,-48,8]])ellipse(c,x,y,rx,rx*.6,P('#8a8a7a'));
 for(let i=0;i<14;i++)path(c,`M${-70+i*10} ${-40-Math.sin(i)*4} l${-2+(i%3)} -7`,null,P('#4a8a3a'),1.4);
 const palm=(x,y,h,lean)=>{path(c,`M${x} ${y} Q${x+lean*.5} ${y-h*.6} ${x+lean} ${y-h}`,null,P('#7a5a3a'),3.2);for(let i=0;i<6;i++){const q=-Math.PI+i/5*Math.PI*1.0;path(c,`M${x+lean} ${y-h} q${Math.cos(q)*12} ${Math.sin(q)*6-6} ${Math.cos(q)*24} ${Math.sin(q)*12+4}`,null,P('#3e8a3a'),2.4);}ellipse(c,x+lean,y-h+3,2.6,2.6,P('#6a4a2a'));};
 palm(-20,-58,46,10);palm(14,-60,36,-8);
 path(c,`M-10 26 Q-30 ${56+f*.6} -64 ${70+f*.6} Q-60 ${56+f*.6} -40 26Z`,grad(c,P,a,b,26,70),P(a,-.45),.8);
 path(c,`M64 22 Q60 ${64+f} 24 ${88+f} Q30 ${62+f} 44 24Z`,grad(c,P,a,b,24,88),P(a,-.45),.8);
}
// Sladenia shaefersi, a monkfish (family Lophiidae) of the deep western Atlantic: a big rounded head that is mostly mouth,
// a short fishing lure on the snout with a small fleshy tip, a fringe of skin flaps round the jaw, arm-like pectoral fins
// and a short tapering tail; brown to grey. About 30 cm.
function monkfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),K='#1a1410';
 path(c,`M-60 -4 Q-84 ${-20+sw} -96 ${-22+sw} Q-90 ${sw} -96 ${22+sw} Q-84 ${20+sw} -60 6Z`,finFill(c,P,a,-62,0,-94,0),P(a,-.4),.6);
 path(c,'M-6 -30 L-20 -48 M-14 -28 L-30 -42',null,P(a,-.2),2);
 const body=path(c,'M-66 0 Q-50 -26 -10 -34 Q30 -44 56 -30 Q74 -18 76 2 Q74 22 56 30 Q20 40 -10 30 Q-50 22 -66 0Z',grad(c,P,a,b,-44,36),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-70 12 Q0 26 80 14 L80 44 L-70 44Z',P(b,.05,.8));if(!low){skin(c,body,P,a,r.seed,90);for(let i=0;i<18;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-56+(u-Math.floor(u))*120,-30+(v-Math.floor(v))*40,3,2.2,P(a,-.25,.5));}}c.restore();
 // The wide mouth, fringed with skin flaps underneath.
 path(c,'M76 4 Q60 12 34 12',null,P(K,0,.85),2);
 teeth(c,P,{x0:40,y0:10.6,x1:74,y1:5},{type:'needle',size:2.4,color:'#e8dcc4',gum:false});
 for(let i=0;i<9;i++){const x=70-i*9,y=18+i*1.4;path(c,`M${x} ${y} q-2 6 -5 7 q4 0 6 -6`,P(a,.05),P(a,-.4,.6),.5);}
 path(c,'M10 20 Q2 38 -10 42 Q-4 32 -2 22Z',P(a,-.12),P(a,-.45),.6);
 path(c,'M60 -26 Q64 -46 72 -50',null,P(a,-.1),1.6);ellipse(c,73,-51,3,2.4,P('#c8a07a'));
 eye(c,46,-18,P,2.4,{iris:'#8a7a3a'});
}
function maw(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,14);
 const body=path(c,`M-234 ${sw} C-181 -57 -135 29 -70 4 C-19 -20 4 -71 84 -63 Q177 -58 197 -4 Q170 77 65 46 C0 33 -22 16 -68 26 C-142 60 -175 -18 -234 ${sw}Z`,grad(c,P,a,b,-70,65),P(a,-.3),1);
 path(c,'M65 -20 Q120 -51 184 -9 Q171 48 70 30 Q98 5 65 -20Z',P('#102735'),P('#9c7f7b'),3);
 for(let i=0;i<24;i++){const x=73+i*4.4,y=-23-Math.sin(i/23*Math.PI)*10;path(c,`M${x} ${y} l2 18 l2 -18 M${x} ${31+Math.sin(i/23*Math.PI)*6} l2 -17 l2 17Z`,P('#e0d7b9'));}
 for(let i=0;i<3;i++){ellipse(c,84+i*22,-43-i%2*6,7,5,P('#96deea'));ellipse(c,84+i*22,-43-i%2*6,2,4,P('#183d4d'));}
 if(!low){skin(c,body,P,a,r.seed,260);for(let i=0;i<16;i++)path(c,`M${-160+i*16} ${-5-Math.sin(i)*6} q-10 12 1 24`,null,P('#78949b',0,.45),1);}
}
// Long-necked dinosaurs, redrawn 2026-11-10: a deep barrel on four pillar legs, a tail tapering behind and a neck about as long again in front.
// Brachiosaurus holds its neck high, with a domed snout. Dreadnoughtus holds it level. Nigersaurus carries a short neck low, with a wide straight-edged mouth for grazing the ground.
function sauropod(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,7),N=id==='nigersaurus',B=id==='brachiosaurus',K='#20261e',hx=B?128:N?150:152,hy=B?-132:N?-10:-74;
 const leg=(x,y0,far,ph)=>{const q=Math.sin(p.swim+ph)*4,col=far?P(a,-.3):grad(c,P,a,b,y0,70);path(c,`M${x-15} ${y0} Q${x-15} 50 ${x-11+q} 80 Q${x-12+q} 88 ${x-5+q} 88 L${x+9+q} 88 Q${x+15+q} 88 ${x+12+q} 80 Q${x+14} 50 ${x+15} ${y0}Z`,col,P(a,-.45,.6),.6);if(!far)for(const dx of [-7,1,9])ellipse(c,x+dx+q+.5,86,2.4,1.5,P('#e6dfc6',0,.8));};
 leg(-34,12,true,0);leg(38,12,true,2.2);
 const neckCtl=B?'M38 -36 Q86 -66 112 -138 L136 -126 Q118 -40 70 8Z':N?'M40 -28 Q88 -30 140 -20 L146 2 Q90 10 62 12Z':'M40 -34 Q92 -62 142 -84 L154 -62 Q112 -18 66 8Z';
 path(c,neckCtl,grad(c,P,a,b,hy-10,10),P(a,-.45),.7);
 const body=path(c,`M-178 ${16+sw*1.5} Q-120 ${-10+sw*.8} -66 -30 Q-20 -54 30 -44 Q60 -36 70 -6 Q62 26 18 34 Q-30 42 -66 22 Q-120 ${18+sw*.8} -178 ${20+sw*1.5}Z`,grad(c,P,a,b,-50,40),P(a,-.45),.8);
 c.save();c.clip(body);path(c,`M-180 ${20+sw*1.5} Q-60 20 70 14 L70 50 L-180 50Z`,P(b,.06,.6));for(let i=0;i<7;i++){const x=-56+i*18;path(c,`M${x} -56 Q${x+6} -30 ${x-2} -8 Q${x+10} -28 ${x+11} -56Z`,P(a,-.3,.34));}if(!low){skin(c,body,P,a,r.seed,130);ellipse(c,-10,-44,60,5,P('#ffffff',0,.14));}c.restore();
 leg(-52,20,false,3.1);leg(20,22,false,5.2);
 if(!low)for(let i=0;i<8;i++){const t=(i+1)/9,x=B?44+t*72:N?46+t*90:46+t*92,y=B?-34-t*90:N?-26+t*6:-36-t*44;path(c,`M${x} ${y} q5 ${N?16:18} ${B?10:0} ${N?22:30}`,null,P(a,-.32,.4),.8);}
 const head=N?`M${hx-14} ${hy-8} Q${hx+2} ${hy-14} ${hx+18} ${hy-6} L${hx+24} ${hy+8} L${hx+24} ${hy+14} Q${hx+4} ${hy+15} ${hx-12} ${hy+8}Z`:B?`M${hx-14} ${hy-3} Q${hx-10} ${hy-20} ${hx+6} ${hy-20} Q${hx+15} ${hy-16} ${hx+19} ${hy-4} L${hx+25} ${hy+5} Q${hx+23} ${hy+12} ${hx+6} ${hy+11} Q${hx-10} ${hy+9} ${hx-14} ${hy-3}Z`:`M${hx-14} ${hy-3} Q${hx-6} ${hy-14} ${hx+10} ${hy-11} L${hx+25} ${hy-3} Q${hx+27} ${hy+6} ${hx+18} ${hy+8} Q${hx-4} ${hy+10} ${hx-14} ${hy-3}Z`;
 const skull=path(c,head,grad(c,P,a,b,hy-18,hy+14),P(a,-.45),.7);if(!low)skin(c,skull,P,a,r.seed+6,18);
 faceLine(c,P,N?`M${hx+24} ${hy+8} L${hx-6} ${hy+8}`:`M${hx+25} ${hy+3} Q${hx+12} ${hy+6} ${hx-2} ${hy+3}`,P(K,0,.75));
 if(N)for(let i=0;i<9;i++)line(c,[[hx+4+i*2.4,hy+8],[hx+4+i*2.4,hy+11.5]],P('#e7e5c7'),.8);
 ellipse(c,hx+(B?12:20),hy-(B?13:3),1.5,1,P(K,0,.7));
 eye(c,hx+1,hy-(B?8:5),P,2.2,{iris:'#a88a4a'});
 helmet(c,hx+6,hy,34,P);
}
// Species-specific silhouettes; lengths include fins and tusks where applicable.
// Axolotl (15 Nov 2026): the familiar pale pink (leucistic) one by default, the body in the first colour and the feathery gills in the
// second (they had been a fixed purple-pink).
function axolotl(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,w=swing(p,7);
 if(r.upgrade?.effect==='halo'){const g=c.createRadialGradient(0,0,12,0,0,125);g.addColorStop(0,P(a,.3,.27));g.addColorStop(1,P(a,0,0));ellipse(c,0,0,125,125,g);}
 path(c,`M-30 -15 Q-78 -47 -129 ${w} Q-82 34 -30 16Z`,P(a,.12,.65),P(b,0,.5),.7);
 if(!low)for(let i=0;i<8;i++){const x=-44-i*10;path(c,`M${x} -8 l-9 ${-11+i*.8} M${x} 10 l-9 ${10-i*.8}`,null,P(b,0,.3),.5);}
 path(c,`M-35 -8 Q-87 -16 -129 ${w} Q-78 17 -32 12Z`,grad(c,P,a,b));
 for(const [x,y,side]of [[-23,-9,-1],[30,-10,-1],[-23,12,1],[30,13,1]]){
 path(c,`M${x} ${y} q-12 ${side*15} 0 ${side*24} l13 4`,null,P(a,-.12),5);
 for(let i=0;i<(x<0?5:4);i++)path(c,`M${x+11} ${y+side*24+4} l${8-i*2} ${-5+i*3}`,null,P(b),1.5);
 }
 const body=path(c,'M-49 0 Q-33 -23 35 -17 Q63 -23 80 -9 Q92 6 77 18 Q56 28 34 17 Q-24 24 -49 0Z',grad(c,P,a,a));
 // Gills: three feathery stalks a side, a deep pink core fringed with soft filaments.
 for(const side of [-1,1])for(let i=0;i<3;i++){
 const x=48-i*7,y0=side*12,wg=0,ex=34-i*15+wg,ey=side*(33+i*8),cx=ex-4,cy=side*(24+i*3);
 const at=(t)=>{const u=1-t;return[u*u*x+2*u*t*cx+t*t*ex,u*u*y0+2*u*t*cy+t*t*ey];};
 if(!low)for(let j=1;j<=9;j++){const t=j/10,[px,py]=at(t),[qx,qy]=at(Math.min(1,t+.05)),dx=qx-px,dy=qy-py,dl=Math.hypot(dx,dy)||1,nx=-dy/dl,ny=dx/dl,l=5.2*(1-t*.35);
  for(const s2 of [-1,1])path(c,`M${px.toFixed(2)} ${py.toFixed(2)} q${(nx*s2*l*.6+dx/dl*l*.5).toFixed(2)} ${(ny*s2*l*.6+dy/dl*l*.5).toFixed(2)} ${(nx*s2*l*.5+dx/dl*l*1.1).toFixed(2)} ${(ny*s2*l*.5+dy/dl*l*1.1).toFixed(2)}`,null,P(b,.35,.78),1.5);}
 path(c,`M${x} ${y0} Q${cx} ${cy} ${ex} ${ey}`,null,P(b,-.1),3);
 ellipse(c,ex,ey,2,2,P(b,.15));
 }
 if(!low){skin(c,body,P,a,r.seed,65);for(let i=0;i<9;i++)path(c,`M${-24+i*6} -12 q-3 13 0 24`,null,P(a,-.3,.35),.7);c.save();c.clip(body);for(let i=0;i<26;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);ellipse(c,-44+fu*124,-18+fv*36,.8+(i%3)*.35,.7+(i%2)*.25,P(a,-.28,.32));}c.restore();}
 eye(c,71,-8,P,2.1,{iris:'#2a2030'});path(c,'M72 10 Q82 12 87 5',null,P(a,-.55),1);ellipse(c,83,-2,1.1,1,P(a,-.5));
}
function humboldt(c,r,p,P,low){giantSquid(c,r,p,P,low,.6);}
function stonefish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 path(c,'M-53 5 L-90 -18 Q-82 1 -91 23 L-51 19Z',P(a));
 for(let i=0;i<13;i++)path(c,`M${-52+i*8} -7 l${-6+i%3} ${-20-(i%4)*4} l10 25Z`,P(a,-.15));
 const body=path(c,'M-66 6 Q-52 -27 -22 -24 Q-12 -45 5 -32 Q34 -45 54 -26 Q83 -25 86 0 L74 28 Q38 36 -5 29 Q-49 33 -66 6Z',grad(c,P,a,b));
 path(c,'M21 6 Q-12 17 -28 40 Q7 55 40 28Z',P(a,-.1));for(let i=0;i<8;i++)line(c,[[26,13],[-22+i*8,39]],P(b,0,.65),.8);
 if(!low){skin(c,body,P,a,r.seed,190);for(let i=0;i<28;i++){const x=-45+(i*37)%115,y=-20+(i*23)%43;ellipse(c,x,y,3+i%3,2+i%2,P(i%2?'#595a43':'#b5a188',0,.5));}}
 eye(c,56,-24,P,2.4);path(c,'M73 -12 Q63 -2 73 12 L82 2',null,P('#3c3f32'),3);path(c,'M71 -13 l14 -5',null,P(b),3);
}
function narwhal(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,4);
 path(c,`M-93 0 Q-119 ${-23+sw} -135 ${-16+sw} L-122 3 L-136 ${23+sw} Q-113 20 -91 8Z`,P(a,-.15));
 const body=path(c,'M-104 1 Q-68 -30 18 -29 Q75 -30 91 -7 Q100 7 80 20 Q14 41 -60 19Z',grad(c,P,a,b));
 path(c,'M32 14 Q15 46 -10 43 L3 16Z',P(a,-.15));path(c,'M83 2 L234 -3 L84 7Z',P('#e3d9bc'),P('#9d937d'),.6);
 if(!low){skin(c,body,P,a,r.seed,260);c.save();c.clip(body);for(let i=0;i<60;i++){const x=-81+(i*47)%165,y=-27+(i*29)%44;ellipse(c,x,y,1+i%3,1+i%2,P('#35444b',0,.48));}c.restore();for(let i=0;i<37;i++)line(c,[[91+i*3.8,2],[94+i*3.8,6-i*.15]],P('#968a72',0,.75),.6);}
 eye(c,70,-8,P,1.8);path(c,'M71 11 L88 9',null,P(a,-.55),1.2);path(c,'M44 -26 q5 -3 9 0',null,P(a,-.5),1);
}
function placoderm(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 path(c,'M-64 2 L-130 -41 L-106 1 L-125 27 L-64 15Z',P(a));path(c,'M-43 -17 L-29 -57 L4 -24Z',P(a,-.2));path(c,'M-6 13 L-37 56 L22 25Z',P(a,-.2));
 const body=path(c,'M-83 0 Q-48 -32 19 -35 Q57 -45 89 -25 L117 -7 L111 14 Q70 41 7 31 Q-38 30 -83 8Z',grad(c,P,a,b));
 path(c,'M61 4 L112 -4 L104 15 L76 19Z',P('#1b3032'));path(c,'M65 4 l13 0 l-2 10Z M95 1 l12 -3 l-4 11Z M78 18 l4 -9 l7 9Z',P('#d0c7a4'));
 if(!low){skin(c,body,P,a,r.seed,140);path(c,'M17 -32 L36 -12 L34 18 L18 30 M37 -12 L63 -19 L87 -23 M36 18 L61 27 L91 24 M58 -32 L63 -19 L58 -2',null,P(a,-.35),1.4);path(c,'M27 -28 L42 -14 L57 -18',null,P(b,0,.45),.7);}
 eye(c,74,-17,P,3.1);path(c,'M109 17 Q93 28 70 24',null,P(b),2);
}
// Crocodiles and the alligator, redrawn 2026-11-13 (owner: "improve crocodile/alligator look"). Side on, facing right: a raised
// cranium with a brow ridge over a high golden eye and an ear slit behind it; a long flat snout with a nostril bump at the tip,
// the mouth line running back along it with teeth top and bottom (the crocodile's big fourth lower tooth shows outside the lip;
// the alligator's broad round snout hides its teeth); a keeled crest of scutes down the back and tail; plated flank scales under
// darker mottled bands; a pale belly with its rows of ventral scales; four stout bent legs with clawed feet, the far pair behind
// the body; and a thick tail growing out of the hips, tapering to the tip, carrying the swim.
function crocodile(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,8),gator=r.species==='american_alligator',sarco=r.species==='sarcosuchus',kapro=r.species==='kaprosuchus';
 const dark=P(a,-.42),edge=P(a,-.5,.7),claw=P('#2b2d24');
 // Legs: the far pair first, darker and a little higher, then the body, then the near pair over it.
 // A leg in two parts: the thigh, drawn before the body so it comes out from under the belly, and the shin with its clawed
 // foot, drawn after. The far pair is darker, a little higher and smaller.
 const thigh=(x,hind,near)=>{const k=near?1:.82,dy=near?0:-6,s=hind?-1:1;c.save();c.translate(x,dy);c.scale(k,k);path(c,`M${s*6} 0 Q${s*-12} 4 ${s*-12} 20 Q${s*-10} 30 ${s*-2} 30 Q${s*8} 28 ${s*10} 12Z`,near?grad(c,P,a,b,0,32):P(a,-.28),edge,.8);c.restore();};
 const shin=(x,hind,near)=>{
  const k=near?1:.82,dy=near?0:-6,s=hind?-1:1,fill=near?grad(c,P,a,b,18,44):P(a,-.26),toe=near?P(b,-.12):P(a,-.2);
  c.save();c.translate(x,dy);c.scale(k,k);
  path(c,`M${s*-9} 22 Q${s*-16} 30 ${s*-12} 38 L${s*-2} 38 Q${s*2} 30 ${s*-1} 24Z`,fill,edge,.8);
  path(c,hind?'M-20 33 Q-26 42 -6 43 L18 41 Q22 37 12 35Z':'M-12 33 Q-18 42 2 43 L26 41 Q30 37 20 35Z',toe,edge,.8);
  for(let i=0;i<4;i++)path(c,hind?`M${2+i*5} 41 l5 3`:`M${10+i*5} 41 l5 3`,null,claw,1.5);
  c.restore();
 };
 thigh(-34,true,false);shin(-34,true,false);thigh(46,false,false);shin(46,false,false);
 // The tail, out of the hips: thick, tapering, with its crest of scutes.
 const tail=path(c,`M-44 -17 Q-100 -14 -181 ${sw} Q-100 24 -44 22Z`,grad(c,P,a,b,-18,24),edge,.7);
 if(!low){c.save();c.clip(tail);for(let i=0;i<9;i++){const x=-58-i*14;ellipse(c,x,2+i*.3,7,9-i*.6,P(a,-.22,.35));}c.restore();}
 for(let i=0;i<10;i++){const x=-52-i*13,h=7.5-i*.55,y=-16.6+i*1.7+(sw*(i/9))*.9;path(c,`M${x+6} ${y} L${x} ${y-h} L${x-7} ${y+.4}Z`,P(a,-.2),edge,.6);}
 thigh(-30,true,true);thigh(50,false,true);
 // The body and head in one outline, the snout by species.
 const snout=gator?'L118 -14 Q150 -13 166 -6 Q172 0 166 6 Q150 9 120 10':kapro?'L112 -15 Q130 -16 144 -9 Q150 -2 147 6 Q132 10 116 10':'L112 -13 Q146 -11 170 -2 L171 2 Q146 8 118 10';
 const body=path(c,`M-48 -17 Q-10 -28 44 -22 Q60 -21 70 -18 Q84 -27 100 -16 Q106 -15 112 -14 ${snout} L100 12 Q80 16 62 22 Q10 32 -48 22Z`,grad(c,P,a,b,-30,32),edge,.8);
 if(!low){
  c.save();c.clip(body);
  // Mottled bands across the back, plated flank scales, and the belly's rows of scales.
  path(c,'M-48 -17 Q-10 -28 44 -22 Q60 -21 70 -18 L70 -9 Q20 -14 -46 -8Z',P(a,-.22,.4));
  for(let i=0;i<7;i++){const x=-36+i*17;ellipse(c,x,-14+(i%2)*3,9,6,P(a,-.3,.38),.2);}
  for(let row=0;row<3;row++)for(let i=0;i<13;i++){const x=-44+i*9+(row%2)*4,y=-8+row*8;path(c,`M${x} ${y} h6 q1 0 1 1 v4 q0 1 -1 1 h-6 q-1 0 -1 -1 v-4 q0 -1 1 -1Z`,P(a,row===2?.06:-.06,.35),P(a,-.3,.45),.5);}
  for(let i=0;i<8;i++)path(c,`M${-46+i*2} ${16+i*1.6} Q10 ${22+i*1.4} 64 ${18+i*1.1}`,null,P(b,-.25,.35),.6);
  skin(c,body,P,a,r.seed,110);
  c.restore();
  // The crest of scutes down the back, a double row seen as one saw-toothed line.
  for(let i=0;i<10;i++){const x=48-i*10;path(c,`M${x+5} ${-21+i*.4} L${x} ${-26+i*.4} L${x-5} ${-21+i*.4}Z`,P(a,-.18),edge,.6);}
  // Teeth along the snout; the crocodile's fourth lower tooth shows outside the mouth.
  // Kaprosuchus, the boar croc: a short deep snout with three pairs of tusk-like teeth that stick out above and below.
  if(kapro){teeth(c,P,{x0:114,y0:2,x1:142,y1:1},{type:'fang',size:2.2,color:'#e2ddb8'});for(const [x,up] of [[122,1],[132,-1],[139,1]])path(c,up>0?`M${x} 6 l2.6 -14 l2.6 14Z`:`M${x} -4 l2.6 14 l2.6 -14Z`,P('#f0ead0'),P('#8a8460',0,.6),.5);}
  else if(!gator){teeth(c,P,{x0:116,y0:2,x1:164,y1:0},{type:'fang',size:2.4,color:'#e2ddb8'});teeth(c,P,{x0:120,y0:4,x1:160,y1:2.4,upper:false},{type:'fang',size:2,color:'#e2ddb8'});path(c,'M136 4 l2.2 -7 l2.2 7Z',P('#ece7c2'),P('#8a8460',0,.6),.4);}
  else teeth(c,P,{x0:122,y0:3,x1:160,y1:1.5},{type:'fang',size:1.8,color:'#d9d4b2'});
 }
 // ...and horn-like bosses at the back of its skull.
 if(kapro)for(const [x,y] of [[98,-17],[105,-15]])path(c,`M${x-4} ${y+3} L${x} ${y-9} L${x+4} ${y+2}Z`,P(a,-.1),P(a,-.45),.5);
 if(sarco){oval(c,163,-9,9,7.5,grad(c,P,a,b,-16,0),P(a,-.45),.6);ellipse(c,166,-12,1.8,1,P('#2e3b2c'));}
 shin(-30,true,true);shin(50,false,true);
 // The face: brow ridge, eye, ear slit, nostril and the mouth line.
 path(c,'M85 -19 Q93 -23 101 -17',null,P(a,-.3,.8),1.6);
 eye(c,93,-14,P,2.4,{iris:'#b89a3c'});
 path(c,'M84 -10 l-4 4',null,dark,1.4);
 ellipse(c,gator?160:165,gator?-8:-5,1.9,1.1,P('#2e3b2c'));
 faceLine(c,P,gator?'M104 7 Q130 10 150 7 Q160 5 166 3':'M106 6 Q128 9 146 5 T171 1',P('#36432e'),1.2);
}
// Little clownfish (Amphiprion ocellaris): a short round orange fish with three white bands edged in thin black and
// black-tipped fins. Small, curious, and never far from its anemone.
function clownfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,4),K='#22262a',edge=P(K,0,.85);
 path(c,`M-44 -4 Q-66 ${-24+sw} -80 ${-20+sw} Q-88 ${sw} -80 ${20+sw} Q-66 ${24+sw} -44 7Z`,finFill(c,P,a,-44,0,-84,0),edge,1.5);
 if(!low)for(let i=0;i<8;i++)line(c,[[-46,-3+i],[-78,-17+i*5+sw]],P(a,-.28,.55),.6);
 path(c,'M-36 -21 Q-30 -43 -12 -38 Q-2 -34 4 -30 Q14 -45 30 -35 L44 -19Z',P(a,.03),edge,1.5);
 path(c,'M-30 22 Q-22 43 -4 35 L6 26Z',P(a,.02),edge,1.4);path(c,'M24 24 Q22 43 9 43 L5 26Z',P(a,-.05),edge,1.3);
 const body=path(c,'M-50 0 Q-33 -35 19 -29 Q57 -25 74 0 Q60 26 18 30 Q-27 34 -50 8Z',grad(c,P,a,a,-32,32),P(a,-.4),.7);
 c.save();c.clip(body);ellipse(c,6,26,60,9,P(b,.05,.3));
 for(const [x,w,bend] of [[-41,8,5],[-3,15,18],[41,12,10]]){const d=`M${x} -38 Q${x+bend} 0 ${x} 38`;path(c,d,null,edge,w+3.2);path(c,d,null,P(b),w);}
 if(!low){fishScales(c,body,P,a);skin(c,body,P,a,r.seed,40);}c.restore();
 // Nemo (requested by name, owner 2026-11-10): the same clownfish, with his small "lucky" fin on the near side.
 const nemo=r.species==='nemo';if(nemo){c.save();c.translate(33,5);c.scale(.5,.5);c.translate(-33,-5);}
 path(c,'M33 5 Q9 7 5 20 Q15 31 31 23 Q39 14 33 5Z',finFill(c,P,a,32,8,8,24),edge,1.3);if(!low)for(let i=0;i<5;i++)line(c,[[31,8],[8+i*3,20+i*2]],P(a,-.3,.5),.5);
 if(nemo)c.restore();
 faceLine(c,P,'M73 3 Q67 9 60 7',P('#4a2c1c'),1);
 eye(c,56,-7,P,r.species==='nemo'?4.2:3.7,{iris:'#c96a1c'});
}
function goblin(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 path(c,'M-87 0 Q-153 -17 -178 -35 L-153 5 L-163 23 L-87 12Z',P(a));
 path(c,'M-47 -13 Q-49 -35 -28 -29 L-13 -14 M-97 -8 Q-94 -25 -79 -21 L-64 -9',P(a,-.15));
 const body=path(c,'M-111 3 Q-60 -24 32 -20 Q50 -20 62 -19 L146 -22 Q158 -20 156 -15 Q120 -9 78 -5 Q72 -2 72 4 L75 12 Q28 30 -46 17Z',grad(c,P,a,b),P(a,-.4),.6);
 path(c,'M34 11 Q11 47 -4 41 L10 13Z',P(a,-.15));path(c,'M44 1 Q60 -3 76 1 Q87 6 82 15 Q64 24 44 18Z',P('#3a2430'));path(c,'M46 20 Q66 27 85 15',null,P(a,-.06),4.6);path(c,'M46 0 Q62 -5 80 0',null,P(a,-.08),3);
 teeth(c,P,{x0:50,y0:1,x1:80,y1:2.5},{type:'needle',size:2.2,color:'#e2d7c5'});teeth(c,P,{x0:50,y0:18,x1:81,y1:14.5,upper:false},{type:'needle',size:2,color:'#e2d7c5'});
 for(let i=0;i<5;i++)path(c,`M${29-i*5} -8 q-2 8 0 18`,null,P(a,-.4),1);
 if(!low)skin(c,body,P,a,r.seed,120);ellipse(c,132,-18.5,1.2,.7,P(a,-.6,.7));eye(c,60,-11,P,1.5,{iris:'#2a2228'});
}
function blueDragon(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 for(const side of [-1,1])for(let arm=0;arm<3;arm++){
 const x=39-arm*34,len=arm===0?59:arm===1?44:26;
 path(c,`M${x} ${side*5} Q${x-5} ${side*25} ${x-20} ${side*len}`,null,P(b),7);
 for(let i=0;i<9;i++){const t=i/8,xx=x-4-t*16,yy=side*(16+t*(len-16)),ex=xx-17-i%3*3,ey=yy+side*(13-i*.3);path(c,`M${xx} ${yy} Q${ex+3} ${ey} ${ex} ${ey+side*4}`,null,P('#153c79'),3.6);path(c,`M${xx} ${yy} Q${ex+3} ${ey} ${ex} ${ey+side*4}`,null,P(a,.2),1.8);}
 }
 const body=path(c,'M-84 0 Q-30 -13 23 -12 Q54 -22 66 -7 L76 0 L66 7 Q54 22 23 12 Q-30 13 -84 0Z',grad(c,P,b,a,-13,13));
 path(c,'M-77 0 Q-18 -3 51 0',null,P('#14376c'),4);for(const s of [-1,1])path(c,`M59 ${s*7} l13 ${s*13}`,null,P(a),2.5);
 if(!low)skin(c,body,P,a,r.seed,40);eye(c,65,-5,P,1);
}

// ---- 2026-11-07 batch B: new body types for requested creatures ----
// Mermaids and sirens, redrawn 2026-11-10: swimming level, arm reaching forward, hair streaming back, one long line from the waist to the flukes.
function mermaid(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,10),demon=r.species==='demon_siren',merman=r.species==='merman',drift=Math.sin(p.swim)*8,SK=demon?'#9a8697':'#e8bd9b',SD=demon?'#8c7a8a':'#dba983',hair=demon?'#2a1d2e':merman?'#4a3426':b;
 path(c,`M-70 ${4+sw} Q-112 ${-26+sw} -128 ${-18+sw} Q-112 ${4+sw} -126 ${30+sw} Q-108 ${26+sw} -70 ${12+sw}Z`,finFill(c,P,a,-72,6+sw,-126,6+sw),P(a,-.3),.8);
 if(!low)for(let i=0;i<6;i++)path(c,`M-74 ${8+sw} L${-120-(i%2)*3} ${-16+i*8+sw}`,null,P(a,-.2,.45),.6);
 path(c,`M50 -12 Q34 ${8} 14 ${20+drift*.2}`,null,P(SD),5.5);ellipse(c,13,21+drift*.2,3.2,2.8,P(SD));
 const tail=path(c,`M-74 ${8+sw} Q-40 ${-12+sw*.6} 0 -13 Q14 -15 26 -13 Q30 0 24 12 Q12 15 0 15 Q-40 ${22+sw*.6} -74 ${14+sw}Z`,grad(c,P,a,b,-14,18),P(a,-.35),.6);
 if(!low)fishScales(c,tail,P,a);
 const torso=path(c,merman?'M18 -14 Q32 -26 48 -25 Q62 -25 67 -15 Q69 -5 62 3 Q44 13 18 13Z':'M18 -14 Q32 -23 46 -22 Q60 -22 64 -14 Q66 -5 60 3 Q44 12 18 13Z',grad(c,P,SK,SD,-23,13));
 if(!low)path(c,'M20 -13 L27 -8 L20 -3 L27 2 L20 7 L27 11',null,P(a,.18,.85),1.3);
 // The merman (2026-11-13): a broader chest, short hair and a short beard, no shell top.
 if(merman)path(c,'M40 -14 Q48 -8 56 -14 M48 -6 L48 6',null,P(SD,-.25,.6),1.1);
 else if(!demon){path(c,'M38 2 Q45 -7 52 2 Q45 8 38 2Z M50 1 Q57 -7 63 0 Q57 7 50 1Z',P(a,.2),P(a,-.25),.5);}else path(c,'M36 -1 Q50 -9 63 -3 Q60 8 40 9Z',P('#3a2c45'));
 line(c,[[58,-17],[69,-26]],P(SK),10);
 if(!merman)path(c,`M86 -47 Q78 -56 64 -51 Q52 -46 51 -34 Q30 ${-37+drift*.6} -6 ${-29+drift} Q24 ${-21+drift*.7} 52 -20 Q62 -19 66 -26 Q62 -37 70 -43 Q79 -47 86 -47Z`,grad(c,P,hair,hair,-54,-20),P(hair,-.3),.6);
 if(!low&&!merman)for(let i=0;i<5;i++)path(c,`M${56+i*3} ${-42+i*3} Q30 ${-33+i*3+drift*.6} ${4+i*2} ${-28+i*2+drift}`,null,P(hair,i%2?.2:-.22,.5),.8);
 const head=path(c,'M64 -36 Q66 -49 78 -49 Q88 -48 89 -37 L92.5 -31.5 L88.5 -29.5 Q88.5 -22 82 -20 Q72 -18 66 -24 Q63 -30 64 -36Z',grad(c,P,SK,SD,-49,-18),P(SD,-.3),.5);
 path(c,'M88 -46 Q78 -53 66 -46 Q62 -38 66 -30 Q69 -40 78 -43 Q84 -44 88 -46Z',P(hair));
 if(!low)ellipse(c,80,-29,3.2,2,P('#e8806a',0,.3));
 path(c,'M79 -41 q4 -2 7 0',null,P(hair,-.15,.9),1);
 path(c,'M82 -25 q3 1.5 5.5 0',null,P('#a0554c'),1.1);
 if(merman)path(c,'M88 -27 Q88 -19 81 -18 Q72 -18 68 -24 Q74 -21 80 -22 Q86 -23 88 -27Z',P(hair),P(hair,-.3),.5);
 eye(c,82,-36,P,1.9);
 // Near arm: shoulder, a soft bend at the elbow, a slimmer forearm and a hand with the fingers together, palm down.
 const ex=78,ey=-4+drift*.15,wx=95,wy=-10+drift*.3;
 path(c,`M58 -13 Q68 -6 ${ex} ${ey}`,null,P(SD,-.04),6.4);path(c,`M58 -13 Q68 -6 ${ex} ${ey}`,null,P(SK),5.4);
 path(c,`M${ex} ${ey} Q${(ex+wx)/2} ${ey-1} ${wx} ${wy}`,null,P(SK),4.4);
 path(c,`M${wx-1} ${wy-2.2} Q${wx+5} ${wy-4.2} ${wx+10} ${wy-2.2} Q${wx+11.5} ${wy-.6} ${wx+9} ${wy+.8} Q${wx+4} ${wy+2.4} ${wx-1} ${wy+2}Z`,P(SK),P(SD,-.2,.7),.5);
 if(demon){path(c,'M68 -48 l-9 -15 l14 10Z M78 -49 l5 -16 l5 14Z',P('#d9cfbe'));[-2,-6,-9,-10,-10].forEach((y,i)=>path(c,`M${-44+i*12} ${y} l-3 -11 l9 8Z`,P('#5d4a5e')));}
 else if(!merman)ellipse(c,70,-49,3.6,3.6,P('#f2c75c'));
}
function theropod(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,7),spino=['spinosaurus','baryonyx','suchomimus'].includes(id),K='#1a1a14',longArm=spino||id==='allosaurus';
 const leg=(x,ph,far)=>{const k=Math.sin(p.swim+ph)*9,col=far?P(a,-.3):P(a,-.08);
  // Big theropods stood on massive legs (15 Nov 2026): a thick shin, a long heavy foot and three broad clawed toes, not sticks.
  path(c,`M${x-10} 26 L${x-16+k*.4} 58`,null,col,20);path(c,`M${x-16+k*.4} 58 L${x-8+k} 77`,null,col,13);
  path(c,`M${x-8+k} 77 l20 3 M${x-8+k} 77 l16 9 M${x-8+k} 77 l-9 5`,null,far?P(a,-.38):P(a,-.2),5.2);
  if(!low)for(const [dx,dy] of [[20,3],[16,9],[-9,5]])path(c,`M${x-8+k+dx} ${77+dy} l${dx>0?4:-3} ${dy>5?2:1}`,null,P('#2a2620',0,far?.5:.8),2.2);
  path(c,`M${x-26} -14 Q${x-38} 14 ${x-10} 32 Q${x+18} 26 ${x+24} -12 Q${x} -36 ${x-26} -14Z`,far?P(a,-.3):grad(c,P,a,b,-34,34),P(a,-.45,.45),.6);};
 leg(4,Math.PI,true);
 // Acrocanthosaurus (2026-11-13): tall spines along its back made a low, thick ridge rather than a sail.
 if(id==='spinosaurus'||id==='suchomimus'||id==='acrocanthosaurus'){const tall=id==='spinosaurus',H=tall?116:id==='acrocanthosaurus'?62:78;path(c,`M-50 -42 Q-32 ${-H+4} 4 ${-H} Q36 ${-H+4} 50 -42Z`,P(b,-.1,.92),P(a,-.3),1);if(!low)for(let i=0;i<9;i++)line(c,[[-42+i*10.5,-44],[-30+i*7.5,-H+6+Math.abs(i-4)*(tall?4:2)]],P(a,-.25,.7),1.3);}
 if(!low)for(let i=0;i<16;i++){const x=-150+i*14,y=x<-60?-34-(x+150)*.11+sw*.5:-48-Math.sin((x+60)/130*Math.PI)*5;path(c,`M${x-3.5} ${y+3} L${x} ${y-3} L${x+3.5} ${y+3}Z`,P(a,-.2));}
 const body=path(c,`M-172 ${-12+sw*1.5} Q-120 ${-30+sw*.8} -60 -44 Q-20 -54 24 -44 Q48 -38 66 -50 L84 -66 L100 -34 Q86 -6 58 10 Q26 30 -14 24 Q-44 20 -66 8 Q-120 ${sw*.7} -172 ${-8+sw*1.5}Z`,grad(c,P,a,b,-52,26),P(a,-.45),.8);
 c.save();c.clip(body);
 path(c,`M-176 ${-6+sw*1.5} Q-100 2 -40 10 Q20 12 60 -6 Q84 -22 102 -36 L110 40 L-176 40Z`,P(b,.06,.72));
 for(let i=0;i<9;i++){const x=-124+i*25;path(c,`M${x} -56 Q${x+6} -32 ${x-3} -14 Q${x+12} -30 ${x+12} -56Z`,P(a,-.32,.4));}
 if(!low)skin(c,body,P,a,r.seed,140);
 c.restore();
 leg(-22,0,false);
 path(c,longArm?'M56 -2 Q72 14 86 8':'M58 2 Q66 11 73 11',null,P(a,-.12),longArm?6.5:5);
 if(longArm)path(c,'M86 8 l8 -5 M86 8 l10 0 M86 8 l8 5',null,P('#e8dfc4'),1.8);else path(c,'M73 11 l6 -3 M73 11 l7 2',null,P('#e8dfc4'),1.7);
 const upper=spino?'M76 -62 Q96 -74 122 -66 L170 -58 Q178 -52 172 -47 L118 -41 Q98 -37 90 -30 L76 -36Z':'M70 -66 Q92 -88 124 -82 Q150 -76 158 -60 Q162 -50 154 -46 L112 -40 Q96 -38 88 -28 L74 -34Z';
 const lower=spino?'M90 -31 L118 -35 L168 -40 Q166 -32 124 -28 Q104 -25 90 -31Z':'M88 -29 Q100 -33 110 -34 L150 -38 Q150 -26 126 -22 Q104 -20 88 -29Z';
 path(c,lower,grad(c,P,a,b,-40,-22),P(a,-.45),.7);
 path(c,spino?'M100 -38 L172 -48 L168 -40 L100 -32Z':'M100 -40 L155 -47 L150 -38 L100 -33Z',P('#3a1a20'));
 const j=spino?[[106,-39.5,170,-47.5],[108,-34,164,-40]]:[[106,-40.5,153,-46.5],[108,-33.5,148,-38]];
 teeth(c,P,{x0:j[0][0],y0:j[0][1],x1:j[0][2],y1:j[0][3]},{type:'fang',size:spino?2:2.7,color:'#efe8d0'});teeth(c,P,{x0:j[1][0],y0:j[1][1],x1:j[1][2],y1:j[1][3],upper:false},{type:'fang',size:spino?1.8:2.2,color:'#efe8d0'});
 const skull=path(c,upper,grad(c,P,a,b,-84,-30),P(a,-.45),.7);
 if(!low)skin(c,skull,P,a,r.seed+6,30);
 if(id==='allosaurus')path(c,'M100 -80 Q110 -98 122 -80Z',P(b,-.05),P(a,-.4),.7);
 if(id==='pycnonemosaurus'&&!low)for(let i=0;i<7;i++)ellipse(c,92+i*8,-79+Math.abs(i-3)*.8,2.6,1.7,P(a,-.18));
 path(c,spino?'M92 -66 Q102 -71 112 -65':'M104 -80 Q116 -83 128 -74',null,P(a,-.5),2.2);
 ellipse(c,spino?164:150,spino?-55:-61,1.7,1.1,P(K,0,.75));
 eye(c,spino?102:116,spino?-60:-69,P,2.6,{iris:'#c29a3c',slit:true});
 helmet(c,spino?126:114,spino?-50:-58,spino?54:50,P);
}
function mammal(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,7);
 const cfg={guinea_pig:{w:46,h:28,head:20,ears:'round',tail:0,snout:6},hamster:{w:36,h:30,head:21,ears:'round',tail:0,snout:6,bow:true},bunny:{w:40,h:28,head:19,ears:'long',tail:'puff',snout:6},
  cat:{w:52,h:22,head:20,ears:'pointy',tail:'long',snout:6},pallas_cat:{w:52,h:28,head:23,ears:'low',tail:'thick',snout:5},wolf:{w:62,h:24,head:21,ears:'pointy',tail:'bushy',snout:22},
  monkey:{w:40,h:28,head:22,ears:'side',tail:'curl',snout:7,face:true},sloth:{w:56,h:28,head:20,ears:'none',tail:0,snout:6,mask:true,claws:true},thalassocnus:{w:66,h:24,head:18,ears:'none',tail:'long',snout:16,claws:true}}[id]||{w:44,h:26,head:20,ears:'round',tail:0,snout:6};
 const hx=cfg.w+cfg.head*.55,hy=-cfg.h*.45;
 if(cfg.tail==='long')path(c,`M${-cfg.w+4} -4 Q${-cfg.w-40} ${-20+sw} ${-cfg.w-62} ${-6+sw}`,null,P(a),7);
 if(cfg.tail==='thick')path(c,`M${-cfg.w+4} -4 Q${-cfg.w-34} ${-8+sw} ${-cfg.w-58} ${4+sw}`,null,P(a),14),!low&&[0,1,2].forEach(i=>path(c,`M${-cfg.w-28-i*10} ${-6+sw} l2 12`,null,P('#2b2622'),3));
 if(cfg.tail==='bushy')path(c,`M${-cfg.w+4} -6 Q${-cfg.w-36} ${-16+sw} ${-cfg.w-56} ${10+sw} Q${-cfg.w-30} ${12+sw} ${-cfg.w+4} 4Z`,P(a,-.05));
 if(cfg.tail==='curl')path(c,`M${-cfg.w+4} -2 Q${-cfg.w-36} ${-4+sw} ${-cfg.w-30} ${-34+sw} Q${-cfg.w-18} ${-46+sw} ${-cfg.w-14} ${-30+sw}`,null,P(a),5);
 if(cfg.tail==='puff')ellipse(c,-cfg.w-2,-6,10,9,P(b,.2));
 for(let i=0;i<4;i++){const x=-cfg.w*.6+(i%2)*cfg.w*1.1,k=Math.sin(p.swim+i)*6;path(c,`M${x} ${cfg.h*.4} Q${x+4} ${cfg.h+8+k} ${x+14} ${cfg.h+10+k}`,null,P(a,i<2?-.25:-.05),cfg.claws?7:9);if(cfg.claws)for(let j=0;j<3;j++)path(c,`M${x+12} ${cfg.h+10+k} l${4+j*2} ${2+j}`,null,P('#e8e0cc'),1.2);}
 const body=path(c,`M${-cfg.w} 0 Q${-cfg.w} ${-cfg.h} ${-cfg.w*.2} ${-cfg.h} Q${cfg.w*.7} ${-cfg.h*1.05} ${cfg.w} ${-cfg.h*.4} L${cfg.w} ${cfg.h*.5} Q0 ${cfg.h*1.15} ${-cfg.w*.9} ${cfg.h*.6}Z`,grad(c,P,a,b,-cfg.h,cfg.h));
 if(cfg.ears==='long')for(const dx of [-7,5])path(c,`M${hx+dx} ${hy-cfg.head*.6} Q${hx+dx-10} ${hy-cfg.head*2.6} ${hx+dx+2} ${hy-cfg.head*2.8} Q${hx+dx+10} ${hy-cfg.head*1.6} ${hx+dx+6} ${hy-cfg.head*.6}Z`,P(a),P(b,.1),1);
 if(cfg.ears==='pointy')for(const dx of [-10,6])path(c,`M${hx+dx-6} ${hy-cfg.head*.6} L${hx+dx} ${hy-cfg.head*1.55} L${hx+dx+8} ${hy-cfg.head*.55}Z`,P(a,-.05));
 if(cfg.ears==='round'||cfg.ears==='low')for(const dx of [-10,6])ellipse(c,hx+dx,hy-cfg.head*(cfg.ears==='low'?.6:.8),cfg.ears==='low'?8:7,cfg.ears==='low'?5:7,P(a,-.1));
 if(cfg.ears==='side')for(const dx of [-cfg.head*.95])ellipse(c,hx+dx,hy,7,8,P('#d9b48f'));
 ellipse(c,hx,hy,cfg.head,cfg.head*.92,grad(c,P,a,b,hy-cfg.head,hy+cfg.head));
 if(cfg.snout>8)path(c,`M${hx+cfg.head*.5} ${hy-6} L${hx+cfg.head+cfg.snout} ${hy+2} L${hx+cfg.head*.5} ${hy+10}Z`,P(a,.05));
 if(cfg.face)ellipse(c,hx+6,hy+2,12,13,P('#e3c3a0'));
 if(cfg.mask)path(c,`M${hx-4} ${hy-4} q8 -6 16 0 q-8 8 -16 0Z`,P('#3a2c22'));
 if(id==='pallas_cat'&&!low)for(let i=0;i<3;i++)line(c,[[hx-10+i*5,hy-14],[hx-12+i*5,hy-6]],P('#2b2622'),1.5);
 eye(c,hx+cfg.head*.38,hy-cfg.head*.15,P,id==='pallas_cat'?2.6:2.2);
 ellipse(c,hx+cfg.head*.92+(cfg.snout>8?cfg.snout:0),hy+3,2.8,2.2,P('#3a2a26'));
 if(!low){skin(c,body,P,a,r.seed,90);crisp(c,(c)=>{for(let i=0;i<3;i++)line(c,[[hx+cfg.head*.85,hy+5+i*2],[hx+cfg.head*1.6,hy+2+i*5]],P('#f0ece1',0,.6),.6);});}
 if(cfg.bow){path(c,`M${hx-6} ${hy-cfg.head*.9} l-12 -8 l2 14Z M${hx-6} ${hy-cfg.head*.9} l10 -10 l2 14Z`,P('#e8578a'));ellipse(c,hx-6,hy-cfg.head*.9,3,3,P('#c43d6e'));}
 if(id!=='thalassocnus')helmet(c,hx+2,hy,cfg.head*1.85,P);
}
// Sea otter (Enhydra lutris), redrawn 2026-11-10: a long body in the densest fur of any animal, a broad flat head paler than the rest,
// a blunt muzzle with a dark nose and thick whiskers, tiny ears, a flat tail about a third of its length, and webbed hind feet.
function otter(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),K='#231a14',kick=Math.sin(p.swim)*6;
 // A sea otter's tail (2026-11-14): a third of its length, thick and furry at the root and tapering, not a beaver's paddle.
 const tl=path(c,`M-60 -12 Q-98 ${-10+sw} -122 ${-1+sw} Q-131 ${3+sw} -123 ${6+sw} Q-98 ${12+sw} -58 13Z`,grad(c,P,a,a,-12,14),P(a,-.45),.6);
 if(!low){c.save();c.clip(tl);for(let i=0;i<40;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-122+(u-Math.floor(u))*54,y=-10+(v-Math.floor(v))*22;line(c,[[x,y+sw*(x+70)/-52],[x-4,y+1+sw*(x+70)/-52]],P(a,i%2?.2:-.24,.4),.7);}c.restore();}
 const foot=(x,o,far)=>{const col=far?P(a,-.42):P(a,-.28);path(c,`M${x} 18 Q${x-14} ${28+o} ${x-34} ${30+o} L${x-42} ${25+o} L${x-40} ${33+o} L${x-44} ${39+o} Q${x-22} ${42+o} ${x+6} 26Z`,col,P(a,-.5),.6);};
 foot(-30,-kick,true);
 const body=path(c,'M-76 2 Q-68 -26 -14 -31 Q40 -34 68 -24 Q84 -33 102 -27 Q119 -20 120 -7 Q119 5 102 9 Q84 12 72 11 Q42 30 -12 28 Q-60 26 -76 8Z',grad(c,P,a,a,-34,30),P(a,-.45),.8);
 c.save();c.clip(body);
 {const g=c.createLinearGradient(58,0,84,0);g.addColorStop(0,P(b,.1,0));g.addColorStop(1,P(b,.1,.85));c.fillStyle=g;c.fillRect(58,-40,72,70);}
 path(c,'M-80 18 Q-20 30 60 18 L60 40 L-80 40Z',P(a,-.14,.4));
 if(!low){skin(c,body,P,a,r.seed,90);for(let i=0;i<170;i++){const u=Math.sin(i*12.9898+r.seed*.01)*43758.5453,v=Math.sin(i*78.233+r.seed*.01)*12543.1234,x=-76+(u-Math.floor(u))*142,y=-32+(v-Math.floor(v))*60,k=(i*7)%5;line(c,[[x,y],[x-4-k*.4,y+1.2+k*.25]],P(a,i%2?.24:-.26,.38),.75);}for(let i=0;i<34;i++){const x=70+((i*37)%100)/100*46,y=-30+((i*53)%100)/100*36;line(c,[[x,y],[x-3,y+1]],P(b,i%2?.2:-.2,.5),.7);}}
 c.restore();
 foot(-14,kick,false);
 path(c,`M50 6 Q60 ${20+kick*.3} 72 ${22+kick*.3}`,null,P(a,-.2),8);ellipse(c,74,22+kick*.3,5.5,4,P(a,-.32));
 ellipse(c,80,-28,4.2,3.2,P(a,-.22));ellipse(c,80,-27.4,2.2,1.6,P(a,-.42));
 ellipse(c,109,-3,10,8,P(b,.2));
 path(c,'M113 -11 Q120 -10 120 -6 Q116 -2 112 -5Z',P(K));
 faceLine(c,P,'M112 -2 Q110 3 104 4',P(K,0,.72));
 if(!low)crisp(c,(c)=>{for(let i=0;i<6;i++)path(c,`M${108-i*.9} ${-3+i*1.3} Q${122} ${-4+i*4} ${136-i*2} ${-5+i*7}`,null,P('#f4efe2',0,.82),.6);});
 eye(c,99,-15,P,2.5,{iris:'#1c130d'});
}
// Giant manta (Mobula birostris), seen from above. Redrawn 2026-11-14: wings swept back to curved points with a hollow trailing
// edge, not a kite; a broad head with the two cephalic fins reaching forward beside the wide mouth; a short whip of a tail
// with a little fin at its root; black above with the white shoulder patches along the front of each wing.
function manta(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*14;
 path(c,'M-36 -2.4 L-88 0 L-36 2.4Z',P(a,-.25));
 path(c,'M-30 -3 Q-40 -1 -46 0 Q-40 1 -30 3Z',P(a,-.3));
 const body=path(c,`M74 0 Q72 -20 60 -24 Q46 -30 38 -34 Q30 ${-86-f} -14 ${-121-f} Q-8 ${-62-f*.4} -38 -18 Q-50 0 -38 18 Q-8 ${62+f*.4} -14 ${121+f} Q30 ${86+f} 38 34 Q46 30 60 24 Q72 20 74 0Z`,grad(c,P,a,a,-110,110),P(a,-.4),1);
 if(!low){skin(c,body,P,a,r.seed,90);c.save();c.clip(body);
  // The white shoulder patches, running out along the front of each wing.
  for(const s2 of [-1,1])path(c,`M36 ${s2*12} Q32 ${s2*36} 14 ${s2*(66+f*.3)} Q2 ${s2*(44+f*.2)} -14 ${s2*15} Q8 ${s2*13} 20 ${s2*9}Z`,P(b,0,.78));
  c.restore();}
 // Cephalic fins, reaching forward on either side of the mouth.
 for(const s2 of [-1,1]){path(c,`M64 ${s2*8} Q92 ${s2*6} 104 ${s2*16} Q100 ${s2*26} 86 ${s2*24} Q76 ${s2*22} 62 ${s2*18}Z`,grad(c,P,a,a,-30,30),P(a,-.45),.6);if(!low)for(let i=0;i<3;i++)path(c,`M${80+i*6} ${s2*(12+i*2)} q3 ${s2*5} 7 ${s2*8}`,null,P(a,-.35,.6),.7);}
 path(c,'M74 -8 Q80 0 74 8',null,P(b,.1,.9),2.4);
 if(!low){c.save();c.clip(body);for(let i=0;i<18;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-24+(u-Math.floor(u))*60,y=(v-Math.floor(v))*2-1;ellipse(c,x,y*(48-Math.abs(x)*.3),1.8+(i%3)*.7,1.5+(i%2)*.5,P(a,-.5,.55));}c.restore();}
 eye(c,64,-19,P,1.8);eye(c,64,19,P,1.8);
}
function shrimp(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,4),cope=id==='plankton';
 if(cope){ellipse(c,10,0,34,20,grad(c,P,a,b));path(c,'M-24 0 L-70 -8 M-24 4 L-70 14',null,P(a,-.1),2);for(const s2 of [-1,1])path(c,`M38 ${s2*-4} Q80 ${s2*-30} 120 ${s2*-24+sw}`,null,P(a,.1),2);ellipse(c,40,-4,4,4,P('#c33a2c'));for(let i=0;i<4;i++)line(c,[[-4+i*10,14],[-10+i*10,28+sw]],P(a,-.2),1.5);return;}
 for(let i=0;i<5;i++){const x=-60+i*14;path(c,`M${x} 10 q-4 14 2 ${22+Math.sin(p.swim+i)*4}`,null,P(a,-.1),3);}
 path(c,`M-96 ${-2+sw} L-122 ${-18+sw} L-118 ${4+sw} L-124 ${22+sw}Z`,P(a,-.05,.9));
 if(!low)for(let i=0;i<5;i++)path(c,`M-98 ${sw} L${-120+Math.abs(i-2)} ${-16+i*9+sw}`,null,P(a,-.25,.5),.6);
 const body=path(c,`M-98 2 Q-96 -26 -40 -30 Q30 -34 56 -16 L64 4 Q20 22 -40 18 Q-86 18 -98 2Z`,grad(c,P,a,b));
 if(!low){c.save();c.clip(body);for(let i=0;i<7;i+=2)path(c,`M${-84+i*20} -34 q-6 30 0 56 l10 0 q-6 -30 0 -56Z`,P(b,.1,.18));for(let i=0;i<7;i++)path(c,`M${-84+i*20} -34 q-6 30 0 56`,null,P(a,-.3,.6),1.4);path(c,'M30 -30 Q20 -8 34 18',null,P(a,-.3,.5),1);for(let i=0;i<40;i++)ellipse(c,-88+(i*37)%148,-26+(i*53)%42,.8,.6,P(b,.2,.45));c.restore();}
 path(c,'M56 -16 L106 -26 L62 -8Z',P(a,.1));if(!low)for(let i=0;i<7;i++)path(c,`M${62+i*6.2} ${-17.1-i*1.24} l2 -3.4 l2.6 2.9Z`,P(a,.1));path(c,'M46 -11 L52 -14',null,P(a,-.15),2.4);for(const k of [0,1])path(c,`M58 ${-6+k*4} Q120 ${-50+k*8+sw} 170 ${-30+k*20+sw}`,null,P(a,.2,.8),1);
 for(let i=0;i<3;i++)path(c,`M30 8 q${20+i*6} ${8+i*4} ${36+i*8} ${-2+i*6}`,null,P(a,0,.9),2);eye(c,52,-14,P,2.6);
 if(id==='krill')for(let i=0;i<6;i++)ellipse(c,-70+i*20,12,2,2,P('#ff7a4a',0,.9));
}
function nautilus(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 for(let i=0;i<14;i++)path(c,`M28 ${-6+i*1.6} Q${70+i*2} ${-14+i*3+Math.sin(p.swim+i)*6} ${96+i*3} ${-8+i*4}`,null,P('#e8d9c2',0,.8),2);
 const shell=c.createRadialGradient(-6,-4,4,0,0,60);shell.addColorStop(0,P(b));shell.addColorStop(1,P(b,-.2));ellipse(c,-4,0,56,52,shell);
 c.save();c.beginPath();c.ellipse(-4,0,56,52,0,0,TAU);c.clip();for(let i=0;i<9;i++)path(c,`M${-50+i*9} -60 Q${-60+i*12} 0 ${-46+i*10} 60`,null,P(a,0,.85),5);c.restore();
 c.strokeStyle=P(a,-.3);c.lineWidth=2;c.beginPath();for(let t=0;t<12;t+=.1){const rr=3*Math.exp(t*.24);c.lineTo(-4+Math.cos(t)*rr*.7,Math.sin(t)*rr*.65);}c.stroke();
 path(c,'M44 -26 Q64 -20 62 2 L46 14Z',P('#b78a66'));eye(c,48,-6,P,3.2);
}
function manOWar(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=p.swim;
 crisp(c,(c)=>{for(let i=0;i<26;i++){const x=-30+i*2.6,len=60+(i*29)%90;path(c,`M${x} 6 Q${x+Math.sin(sw+i*.4)*12} ${len*.5} ${x+Math.sin(sw*.7+i)*18} ${len}`,null,P(i%4?b:'#5f6fc9',0,.7),i%5?1:2.4);}});
 const g=c.createLinearGradient(0,-50,0,10);g.addColorStop(0,P(a,.25,.85));g.addColorStop(1,P(b,0,.75));
 path(c,'M-52 6 Q-60 -26 -20 -34 Q10 -62 40 -46 Q66 -34 56 6 Q0 16 -52 6Z',g,P('#f0e6ff',0,.8),1.2);
 path(c,'M-30 -30 Q0 -64 34 -44',null,P('#e070b4',0,.9),3);
}
// Sea serpents and dragons, redrawn 2026-11-10: a thick muscular body with a pale throat and belly, a ridge of plates along the back, and a real reptile's head with a jaw, brow and horns.
function serpent(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,dragon=id==='dragon'||id==='sea_wyvern',cetus=id==='cetus',wd=id==='water_dragon',K='#101a1c';
 const wv=waveBody(p,x=>{const i=(x+180)/11;return Math.sin(p.swim-i*.3)*(18*(1-i/34));});
 let top=[],bottom=[];for(let i=0;i<=26;i++){const x=-180+i*11,y=wv(x),w=4+(cetus?34:28)*Math.pow(Math.sin((i/26)*Math.PI*.82),.75);top.push([x,y-w]);bottom.unshift([x,y+w]);}
 const t0=top[0];path(c,`M${t0[0]+6} ${t0[1]-2} Q${t0[0]-16} ${t0[1]-22} ${t0[0]-24} ${t0[1]-18} Q${t0[0]-16} ${t0[1]+4} ${t0[0]-24} ${t0[1]+24} Q${t0[0]-12} ${t0[1]+22} ${t0[0]+6} ${t0[1]+8}Z`,finFill(c,P,a,t0[0],t0[1],t0[0]-22,t0[1]),P(a,-.45),.6);
 if(dragon)for(const k of [0,1]){const f=Math.sin(p.swim+k)*14,o=k*16;
  const w=[[-10+o,-14],[20+o,-70-f],[-30+o,-104-f],[-70+o,-90-f],[-96+o,-56-f*.6],[-60+o,-12]];
  path(c,`M${w[0]} L${w[1]} L${w[2]} Q${-40+o} ${-80-f} ${w[3]} Q${-76+o} ${-62-f} ${w[4]} Q${-70+o} ${-34} ${w[5]}Z`,P(b,k?-.2:0,.88),P(a,-.3),1);
  for(const q of [w[2],w[3],w[4]])line(c,[w[1],q],P(a,-.25),2);line(c,[w[0],w[1]],P(a,-.1),4);}
 for(let i=1;i<25;i++){const [x,y]=top[i],h=6+7*Math.sin((i/25)*Math.PI);path(c,`M${x-5} ${y+3} L${x+1} ${y-h} L${x+6} ${y+3}Z`,P(dragon?'#d8b25a':b,i%2?-.08:.05),P(a,-.45),.4);}
 const body=path(c,'M'+top.map(q=>q.join(' ')).join(' L')+' L120 8 L'+bottom.map(q=>q.join(' ')).join(' L')+'Z',grad(c,P,a,a,-30,30),P(a,-.45),.7);
 c.save();c.clip(body);
 const mid=[...bottom].reverse().map(([x,y])=>[x,y-(y-wv(x))*1.25]);path(c,'M'+mid.map(q=>q.join(' ')).join(' L')+' L'+bottom.map(q=>q.join(' ')).join(' L')+'Z',P(b,.06,.82));
 if(!low){for(let i=1;i<26;i++){const [x,y]=bottom[26-i];path(c,`M${x-4} ${y} q-3 -9 2 -16`,null,P(a,-.3,.5),.8);}let d='';for(let row=0;row<4;row++)for(let i=1;i<26;i++){const [x,y]=top[i];const yy=y+4+row*6.5;d+=`M${x+(row%2)*4-4} ${yy} q4 3 8 0`;}path(c,d,null,P(a,-.4,.45),.6);skin(c,body,P,a,r.seed,90);}
 c.restore();
 const hx=112,hy=wv(hx);
 if(cetus||wd)for(let i=0;i<5;i++)path(c,`M${hx-2} ${hy-12+i*7} q-16 ${-9+i*4} -30 ${-6+i*6}`,null,P(b,.15,.85),2.4);
 path(c,`M${hx-8} ${hy+6} L${hx+20} ${hy+5} L${hx+51} ${hy+6} Q${hx+47} ${hy+15} ${hx+22} ${hy+17} Q${hx+2} ${hy+20} ${hx-10} ${hy+16}Z`,grad(c,P,a,b,hy,hy+18),P(a,-.45),.6);
 path(c,`M${hx+14} ${hy} L${hx+55} ${hy-3} L${hx+51} ${hy+6} L${hx+14} ${hy+6}Z`,P('#3a1a20'));
 teeth(c,P,{x0:hx+18,y0:hy+.4,x1:hx+54,y1:hy-2.6},{type:'fang',size:2.5,color:'#eee6cf'});teeth(c,P,{x0:hx+20,y0:hy+5.4,x1:hx+50,y1:hy+5.6,upper:false},{type:'fang',size:2,color:'#eee6cf'});
 if(dragon||wd)for(const [dx,l] of [[-2,34],[9,26]])path(c,`M${hx+dx} ${hy-20} Q${hx+dx-12} ${hy-20-l*.7} ${hx+dx-l*.9} ${hy-20-l}`,null,P('#e4d6b0'),3.4);
 const skullD=`M${hx-12} ${hy-22} Q${hx+8} ${hy-31} ${hx+26} ${hy-24} L${hx+52} ${hy-13} Q${hx+61} ${hy-7} ${hx+56} ${hy-3} L${hx+20} ${hy+1} Q${hx+8} ${hy+4} ${hx-12} ${hy+10}`,skull=path(c,skullD+'Z',grad(c,P,a,a,hy-30,hy+6));path(c,skullD,null,P(a,-.45),.7);
 if(!low)skin(c,skull,P,a,r.seed+6,24);
 path(c,`M${hx+6} ${hy-26} Q${hx+20} ${hy-27} ${hx+32} ${hy-19}`,null,P(a,-.5),2.2);
 ellipse(c,hx+50,hy-11,1.7,1.1,P(K,0,.8));
 eye(c,hx+22,hy-15,P,2.5,{iris:dragon?'#e0a83a':'#d9c25a',slit:true});
}
function platypus(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),kick=Math.sin(p.swim)*5,K='#1f1a18';
 const tail=path(c,`M-58 -9 Q-92 ${-14+sw} -118 ${-7+sw} Q-126 ${2+sw} -118 ${11+sw} Q-92 ${17+sw} -58 12Z`,grad(c,P,a,a,-14,17),P(a,-.45),.6);if(!low){c.save();c.clip(tail);for(let i=0;i<20;i++)line(c,[[-62-i*3,-12],[-64-i*3,16]],P(a,-.3,.3),.7);c.restore();}
 const foot=(x,o,far)=>{const col=far?P(a,-.32):P(a,-.14);path(c,`M${x} 12 Q${x-4} ${22+o} ${x-14} ${26+o}`,null,col,7);path(c,`M${x-12} ${22+o} L${x-30} ${22+o} L${x-26} ${28+o} L${x-32} ${33+o} L${x-20} ${33+o} L${x-16} ${38+o} L${x-8} ${28+o}Z`,far?P('#4a4038',-.1):P('#5a4c42'),P(K,0,.5),.5);};
 foot(-20,-kick,true);foot(42,kick,true);
 const body=path(c,'M-66 2 Q-60 -26 -6 -29 Q42 -30 64 -19 Q76 -22 86 -15 Q94 -8 90 2 Q84 10 72 11 Q46 26 -6 26 Q-54 24 -66 8Z',grad(c,P,a,b,-30,27),P(a,-.45),.8);
 if(!low){skin(c,body,P,a,r.seed,90);c.save();c.clip(body);for(let i=0;i<130;i++){const x=-66+((i*61)%100)/100*156,y=-30+((i*17)%100)/100*56;line(c,[[x,y],[x-4.5,y+1.2]],P(a,i%2?.26:-.26,.42),.8);}c.restore();}
 foot(-30,kick,false);foot(34,-kick,false);
 path(c,'M84 -13 Q112 -19 130 -13 Q140 -8 138 0 Q134 6 122 6 Q102 7 84 4Z',grad(c,P,'#4d4644','#2f2b2a',-18,7),P(K),.7);
 path(c,'M84 -2 Q110 3 138 -2',null,P(K,0,.8),1);
 for(const x of [116,122])ellipse(c,x,-11,1.5,.9,P(K,0,.9));
 eye(c,79,-11,P,1.9,{iris:'#1c130d'});
}
function iguana(c,r,p,P,low){
 if(r.species==='sea_frog'){seaFrog(c,r,p,P,low);return;}
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,10),frog=id==='sea_frog',sal=id==='salamander';
 if(!frog)path(c,`M-36 -4 Q-110 ${-6+sw} -168 ${sw*1.4} Q-110 ${12+sw} -36 10Z`,grad(c,P,a,b));
 for(const [x,k] of [[-24,0],[36,1]]){const q=Math.sin(p.swim+k*3)*8;path(c,`M${x} 8 Q${x-6} ${frog?40:26} ${x-18+q} ${frog?56:34}`,null,P(a,-.2),frog&&!k?14:8);}
 const body=path(c,frog?'M-46 0 Q-40 -32 4 -30 Q40 -28 50 -8 L48 14 Q0 26 -40 14Z':'M-44 0 Q-40 -20 10 -20 Q48 -20 62 -10 L64 8 Q20 18 -40 12Z',grad(c,P,a,b));
 const hx=frog?48:70;ellipse(c,hx,-6,frog?22:20,frog?16:13,grad(c,P,a,b,-22,10));
 if(id==='marine_iguana'){for(let i=0;i<16;i++){const x=-40+i*7,t=Math.min(1,(x+44)/54),back=-20*(2*t-t*t);path(c,`M${x} ${back+2} l3 -11 l3 11Z`,P(b,.1));}for(let i=0;i<6;i++)ellipse(c,hx-4+i*4,-18+(i%2)*3,2.6,2.2,P('#cfc8b8'));}
 if(sal&&!low)for(let i=0;i<10;i++)ellipse(c,-30+i*9,-12+(i%2)*10,3.4,3,P(b,.15));
 if(frog&&!low)for(let i=0;i<12;i++)ellipse(c,-30+(i*23)%70,-20+(i*13)%30,3,2.4,P(b,-.1,.8));
 eye(c,hx+(frog?2:6),frog?-18:-10,P,frog?3.6:2.2);path(c,`M${hx+6} 2 Q${hx+16} 4 ${hx+20} -2`,null,P(a,-.5),1.2);if(!low)skin(c,body,P,a,r.seed,110);
 if(id==='box_turtle'){}
}
function bird(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,k=Math.sin(p.swim)*6;
 for(const [x,ph] of [[-6,0],[8,1]])path(c,`M${x} 20 L${x-2+Math.sin(p.swim+ph*3)*8} 70 l10 2`,null,P('#e5b38a'),3);
 path(c,'M-30 -4 L-92 6 L-30 12Z M-34 0 L-104 -4',P(b),P('#1d1d1d'),3);
 const body=path(c,'M-36 4 Q-30 -26 6 -24 Q34 -20 36 -2 Q30 22 -6 24 Q-36 22 -36 4Z',grad(c,P,a,b));
 path(c,`M-26 -8 Q-10 ${18+k} 24 6`,null,P('#1e1e1e'),10);
 path(c,'M22 -16 Q32 -50 46 -60',null,P(a),8);ellipse(c,50,-64,12,10,P(a));path(c,'M58 -66 L76 -60 L58 -58Z',P('#4b4b4b'));ellipse(c,52,-64,6,4,P('#e8813c'));eye(c,54,-66,P,1.6);
 for(let i=0;i<7;i++)path(c,`M${40-i*3} -70 q-10 ${-8+i} -18 ${-4+i*2}`,null,P('#2a2a2a'),1.6);
 helmet(c,52,-62,26,P);
}
function angel(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,t=p.swim*.4;
 for(let k=0;k<3;k++){c.save();c.rotate(t*(k%2?-1:1)+k);c.strokeStyle=P(a,.1,.95);c.lineWidth=7-k;c.beginPath();c.ellipse(0,0,74-k*14,26+k*10,k*1.05,0,TAU);c.stroke();
 for(let i=0;i<8;i++){const q=i/8*TAU;const x=Math.cos(q)*(74-k*14),y=Math.sin(q)*(26+k*10);const cx=x*Math.cos(k*1.05)-y*Math.sin(k*1.05),cy=x*Math.sin(k*1.05)+y*Math.cos(k*1.05);ellipse(c,cx,cy,5,3.6,P('#fbf6e6'));ellipse(c,cx,cy,2,2,P('#2b6fd0'));}c.restore();}
 for(const s2 of [-1,1])for(let i=0;i<3;i++)path(c,`M0 0 Q${s2*(40+i*16)} ${-60+i*20} ${s2*(96+i*10)} ${-30+i*28+Math.sin(p.swim+i)*6}`,null,P(b,i*.05,.75),8-i*2);
 ellipse(c,0,0,14,14,P('#fff6d4'));ellipse(c,0,0,6,6,P('#2b6fd0'));ellipse(c,0,0,2.6,2.6,P('#0d1a2a'));
}
// Cthulhu, from H. P. Lovecraft's 1928 story, redrawn 2026-11-10: a vast scaled, crouching body, clawed hands and feet, narrow bat-like wings,
// and a pulpy head whose face is a mass of feelers.
function cthulhu(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*8,K='#10201a';
 const wing=(dx,dy,col,edge)=>{const w=path(c,`M${-8+dx} ${-34+dy} Q${-38+dx} ${-100+dy-f} ${-106+dx} ${-118+dy-f} Q${-92+dx} ${-94+dy-f*.8} ${-98+dx} ${-74+dy-f*.6} Q${-80+dx} ${-82+dy-f*.5} ${-72+dx} ${-60+dy-f*.4} Q${-58+dx} ${-68+dy-f*.3} ${-48+dx} ${-44+dy} Q${-32+dx} ${-48+dy} ${-18+dx} ${-20+dy}Z`,col,edge,.9);if(!low)for(const [x,y] of [[-98,-74],[-72,-60],[-48,-44]])line(c,[[-10+dx,-30+dy],[x+dx,y+dy-f*.4]],P(a,-.34,.55),1.2);return w;};
 wing(26,-8,P(b,-.2,.85),P(a,-.45));
 const leg=(x,far)=>{const col=far?P(a,-.3):grad(c,P,a,b,20,84);path(c,`M${x-22} 18 Q${x-46} 46 ${x-26} 62 L${x-30} 80 L${x+6} 84 Q${x+12} 78 ${x+2} 74 L${x-8} 72 Q${x+6} 46 ${x+10} 22Z`,col,P(a,-.45),.7);for(const dx of [6,0,-7])path(c,`M${x+dx+2} 80 l7 5`,null,P('#d9d2b4'),1.7);};
 leg(4,true);
 const body=path(c,'M-46 32 Q-62 -14 -32 -38 Q0 -52 32 -38 Q52 -26 50 2 Q44 30 22 42 Q-20 52 -46 32Z',grad(c,P,a,b,-48,48),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M20 -40 Q6 0 16 50 L60 50 L60 -40Z',P(b,.05,.55));
 if(!low){skin(c,body,P,a,r.seed,120);let sc='';for(let row=0;row<12;row++)for(let x=-60+(row%2)*5;x<54;x+=10)sc+=`M${x} ${-46+row*8} q5 5 10 0`;path(c,sc,null,P(a,-.38,.42),.7);}
 c.restore();
 wing(0,0,P(b,-.05,.9),P(a,-.45));
 leg(-16,false);
 const arm=(y,far)=>{const col=far?P(a,-.3):P(a,-.06);path(c,`M28 ${y} Q58 ${y+6} 66 ${y+26}`,null,col,10);for(const q of [-.5,0,.5])line(c,[[66,y+29],[66+Math.sin(q)*9,y+29+Math.cos(q)*11]],far?P('#a8a288'):P('#d9d2b4'),2);};
 arm(-22,true);arm(-12,false);
 for(let i=0;i<9;i++){const x=46+i*5.4,q=Math.sin(p.swim*.9+i)*7,len=38+(i%3)*11,S=spineOf(Array.from({length:7},(_,j)=>{const t=j/6;return[x+q*t*t+(i-4)*1.4*t,-36+t*len,4.2*(1-t)+.8];}));path(c,S.outline(),P(i%2?a:b,i%2?.08:-.08),P(a,-.45),.5);}
 const head=path(c,'M28 -40 Q24 -82 56 -92 Q90 -94 96 -60 Q98 -38 84 -28 Q60 -20 40 -26 Q30 -30 28 -40Z',grad(c,P,a,b,-92,-24),P(a,-.45),.8);
 if(!low){skin(c,head,P,a,r.seed+4,50);c.save();c.clip(head);for(let i=0;i<5;i++)path(c,`M${36+i*11} -94 q-4 26 3 48`,null,P(a,-.3,.4),1.3);ellipse(c,60,-90,26,4,P('#ffffff',0,.14));c.restore();}
 path(c,'M60 -72 Q72 -77 86 -68',null,P(K,0,.7),2);
 eye(c,80,-60,P,3,{iris:'#e0b84a',slit:true});eye(c,62,-62,P,2.4,{iris:'#e0b84a',slit:true});
}
function ichthyosaur(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,7);
 path(c,`M-110 0 L-150 ${-40+sw} L-136 0 L-150 ${36+sw}Z`,P(a,-.15));path(c,'M-20 -24 L0 -56 L20 -24Z',P(a,-.1));
 const body=path(c,'M-118 2 Q-60 -34 20 -30 Q70 -26 96 -10 L170 -4 L170 2 L96 8 Q60 30 -30 24 Q-90 18 -118 2Z',grad(c,P,a,b));
 for(const [x,s2] of [[40,1],[-50,1]])path(c,`M${x} 12 Q${x-16} ${40*s2} ${x-36} ${36*s2} L${x-14} 12Z`,P(a,-.2));
 if(!low){skin(c,body,P,a,r.seed,120);teeth(c,P,{x0:103,y0:2,x1:168,y1:1.6},{type:'fang',size:2.2,color:'#ece4cc'});}
 eye(c,94,-10,P,r.species==='ichthyosaurus'?5.4:4);
}
function hallucigenia(c,r,p,P){
 const a=r.colors.primary,b=r.colors.secondary;
 const body=path(c,'M-90 0 Q-60 -10 60 -8 Q86 -6 90 2 Q86 10 60 10 Q-60 10 -90 4Z',grad(c,P,a,b,-10,10));
 for(let i=0;i<7;i++){const x=-60+i*20;path(c,`M${x} -4 L${x+6} -48 L${x+10} -4Z`,P(b,.1));path(c,`M${x+4} 5 Q${x} 26 ${x+4+Math.sin(p.swim+i)*4} 34`,null,P(a,-.1),3);}
 ellipse(c,92,2,9,8,P(a));for(const dx of [0,6]){const col=ownEye(c,92+dx,-1,2,'#d8303a');ellipse(c,92+dx,-1,2*eyeScale(),2*eyeScale(),P(col));}
}
function petRock(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,bob=Math.sin(p.swim)*3;
 const body=path(c,`M-62 ${18+bob} Q-70 ${-26+bob} -20 ${-40+bob} Q40 ${-46+bob} 64 ${-6+bob} Q70 ${30+bob} 10 ${34+bob} Q-50 ${38+bob} -62 ${18+bob}Z`,grad(c,P,a,b,-40,36));
 if(!low)skin(c,body,P,a,r.seed,200);for(const x of [6,30])ellipse(c,x,-10+bob,9,10,P('#ffffff')),ellipse(c,x+2,-8+bob,4*eyeScale(),4.6*eyeScale(),P(ownEye(c,x+2,-8+bob,3.2,'#121212')));path(c,`M10 ${12+bob} q12 8 24 0`,null,P('#2a2a2a'),2);
}
function landTurtle(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 for(const x of [-30,26]){const k=Math.sin(p.swim+x)*6;path(c,`M${x} 12 q2 14 ${8+k} 22`,null,P('#7a6a4e'),11);}
 ellipse(c,60,-2,18,14,P('#8a7a55'));eye(c,66,-6,P,2.2);path(c,'M66 4 q8 2 12 -2',null,P('#3d3426'),1);
 const shell=path(c,'M-56 10 Q-60 -44 0 -48 Q56 -44 56 10Z',grad(c,P,a,b,-48,10),P(a,-.4),1.4);
 if(!low)for(const [x,y] of [[-30,-14],[0,-28],[30,-14],[-14,-2],[16,-2]])path(c,`M${x-10} ${y} l6 -9 l10 0 l6 9 l-6 9 l-10 0Z`,P(b,.1,.8),P(a,-.35),1);
 helmet(c,62,-4,26,P);
}

// ---- 2026-11-08: detailed land animals ("beast"), with markings and head parts switched on per species ----
const BEAST = {
 // 15 Nov 2026: the big cats, dogs, wolves, foxes, bears and pandas had long low bodies on short legs (weasels). Shorter, deeper
 // bodies and longer legs, as the real animals stand; the big cats carry a thick tail out behind (bigcat).
 panda:{L:50,H:31,head:24,snout:8,legScale:1.15,ears:'round',tail:'stub',legs:'thick',mark:'panda',belly:false},
 raccoon:{L:42,H:26,head:19,snout:12,legScale:1.2,ears:'pointy',tail:'ringed',legs:'thin',mark:'mask'},
 elephant:{L:78,H:42,head:30,snout:0,ears:'elephant',tail:'thin',legs:'pillar',trunk:true,tusks:true,belly:false,wrinkle:true},
 leopard:{L:52,H:23,head:19,snout:9,ears:'round',tail:'bigcat',legs:'thin',legScale:1.3,mark:'rosettes'},
 jaguar:{L:52,H:26,head:21,snout:9,ears:'round',tail:'bigcat',legs:'thick',legScale:1.2,mark:'rosettes'},
 leopardus_tilcayo:{L:44,H:19,head:18,snout:6,ears:'round',earScale:.8,tail:'long',legs:'thin',mark:'rosettes'},
 meerkat:{L:30,H:17,head:15,snout:9,ears:'tiny',tail:'long',legs:'thin',mark:'panda'},
 striped_tenrec:{L:24,H:16,head:14,snout:13,ears:'tiny',tail:0,legs:'stub',mark:'tenrec'},
 clouded_leopard:{L:50,H:23,head:18,snout:8,ears:'round',tail:'bigcat',legs:'thick',legScale:1.15,mark:'clouds'},
 lemming:{L:30,H:18,head:15,snout:6,ears:'tiny',tail:0,legs:'stub',cheeks:true},
 tiger:{L:58,H:27,head:22,snout:10,ears:'round',tail:'bigcat',legs:'thick',legScale:1.3,mark:'tiger'},
 hyrax:{L:38,H:22,head:17,snout:7,ears:'round',tail:0,legs:'stub'},
 horse:{neck:true,L:70,H:28,head:20,snout:24,blunt:1,nostril:true,ears:'pointy',tail:'horse',legs:'long',mane:true},
 binturong:{L:56,H:24,head:19,snout:10,ears:'tufted',tail:'thick',legs:'thin',shaggy:true},
 squirrel:{L:36,H:20,head:16,snout:7,ears:'tufted',tail:'squirrel',legs:'stub'},
 dog:{L:44,H:24,head:21,snout:14,legScale:1.3,blunt:.75,ears:'floppy',tail:'wag',legs:'thin'},
 pug:{L:44,H:24,head:22,snout:3,ears:'floppy',tail:'curl',legs:'stub',mark:'pugmask'},
 hyena:{L:52,H:28,head:20,snout:12,legScale:1.25,ears:'round',tail:'tuft',legs:'thin',mark:'spots',slope:true},
 orangutan:{L:44,H:34,head:22,snout:6,ears:'none',tail:0,legs:'arms',shaggy:true,face:'ape'},
 gorilla:{L:50,H:36,head:24,snout:6,ears:'none',tail:0,legs:'arms',face:'ape',silverback:true},
 sugar_glider:{L:30,H:16,head:14,snout:6,ears:'big',tail:'long',legs:'stub',mark:'dorsal',membrane:true},
 sheep:{L:54,H:30,head:17,snout:10,ears:'side',tail:'stub',legs:'thin',wool:true},
 moose:{neck:true,L:74,H:34,head:22,snout:22,ears:'pointy',tail:'stub',legs:'long',antlers:'moose',dewlap:true},
 capybara:{L:58,H:28,head:22,snout:16,blunt:1.1,ears:'tiny',tail:0,legs:'stub',belly:false},
 naked_mole_rat:{L:38,H:15,head:15,snout:7,ears:'none',tail:'bare',legs:'stub',wrinkle:true,buck:true,bare:true},
 // 2026-11-13: a nine-tailed kitsune (fox spirit), the ring-tailed lemur, the fossa and Diprotodon (the giant wombat relative).
 kitsune:{L:48,H:20,head:18,snout:15,ears:'big',tail:0,tails:9,tipCol:'#d8322e',legs:'thin',mark:'fox',kitsune:true},
 ring_tailed_lemur:{L:40,H:19,head:15,snout:10,ears:'pointy',tail:'lemur',legs:'thin',mark:'mask'},
 fossa:{L:62,H:19,head:15,snout:10,ears:'round',tail:'long',legs:'thin'},
 diprotodon:{L:70,H:34,head:25,snout:10,blunt:1.1,ears:'tiny',tail:0,legs:'thick',bigNose:true},
 zebra:{neck:true,L:68,H:28,head:20,snout:24,ears:'pointy',tail:'tuft',legs:'long',mane:'short',mark:'zebra'},
 fox:{L:42,H:20,head:18,snout:16,legScale:1.35,ears:'big',tail:'fox',legs:'thin',mark:'fox'},
 // 2026-11-15: the fennec fox, with the biggest ears for its size of any fox; Grumpy Bear, a round-bodied Care Bear.
 fennec_fox:{L:40,H:17,head:16,snout:12,ears:'big',earScale:1.75,tail:'fox',legs:'thin'},
 grumpy_bear:{L:48,H:30,head:23,snout:7,ears:'round',tail:'stub',legs:'thick'},
 spider_monkey:{L:34,H:20,head:15,snout:5,ears:'none',tail:'long',legs:'arms',legScale:1.5,face:'ape',faceCol:'#c87868'},
 wendigo:{L:56,H:30,head:18,snout:16,ears:'none',tail:0,legs:'long',antlers:'moose',mark:'ribs',neck:true},
 pink_fairy_armadillo:{L:30,H:16,head:13,snout:9,ears:'tiny',tail:'stub',legs:'stub',shell:true},
 cheetah:{L:64,H:19,head:14,snout:8,ears:'round',tail:'long',legs:'thin',legScale:1.45,mark:'cheetah'},
 ferret:{L:58,H:13,head:14,snout:9,ears:'round',tail:'thick',legs:'stub',mark:'mask'},
 ankylosaurus:{L:74,H:20,head:16,snout:8,ears:'none',tail:'club',legs:'pillar',armour:true,belly:false},
 // The first land animals, moved onto this drawer for the 2026-11-08 detail pass.
 guinea_pig:{L:34,H:20,head:17,snout:6,ears:'round',tail:0,legs:'stub'},
 hamster:{L:28,H:20,head:17,snout:6,ears:'round',tail:0,legs:'stub',cheeks:true},
 bunny:{L:34,H:23,head:17,snout:6,ears:'bunny',tail:'puff',legs:'stub',legScale:1.35},
 // House cat (15 Nov 2026): a shorter, deeper body, a bigger head, longer legs and a thick tail carried in a curve, not a rat's.
 cat:{L:37,H:20,head:18,snout:4,ears:'pointy',tail:'cat',legs:'thin',legScale:1.3,mark:'tabby'},
 pallas_cat:{L:46,H:21,head:17,snout:4,ears:'round',tail:'ringed',legs:'stub',shaggy:true,mark:'pallas'},
 wolf:{L:52,H:25,head:19,snout:17,legScale:1.45,ears:'pointy',tail:'bushy',legs:'thin',mark:'saddle'},
 monkey:{L:33,H:23,head:18,snout:5,legScale:1.45,ears:'round',tail:'long',legs:'arms',face:'ape',faceCol:'#d9b48f'},
 sloth:{L:44,H:22,head:15,snout:5,ears:'none',tail:0,legs:'arms',shaggy:true,mark:'mask',claws:true},
 thalassocnus:{L:58,H:24,head:16,snout:13,ears:'none',tail:'thick',legs:'arms',shaggy:true,claws:true},
 lion:{L:56,H:27,head:20,snout:9,legScale:1.3,ears:'round',tail:'tuft',legs:'thick',mane:'lion'},
 bear:{L:54,H:32,head:21,snout:11,legScale:1.15,ears:'round',tail:'stub',legs:'thick',shaggy:true},
 black_panther:{L:52,H:22,head:18,snout:8,ears:'round',tail:'bigcat',legs:'thin',legScale:1.3,mark:'rosettes'},
 hippo:{L:72,H:32,head:25,snout:14,ears:'tiny',tail:'stub',legs:'pillar',belly:false},
 // Requested 2026-11-09.
 red_panda:{L:44,H:17,head:16,snout:6,ears:'round',tail:'ringed',legs:'stub',shaggy:true,mark:'fox'},
 corgi:{L:44,H:15,head:17,snout:11,ears:'big',tail:'stub',legs:'stub',mark:'fox'},
 hedgehog:{L:34,H:18,head:13,snout:9,ears:'round',tail:0,legs:'stub',mark:'spines',belly:false},
 quokka:{L:36,H:20,head:16,snout:5,ears:'round',tail:'thin',legs:'stub',cheeks:true},
 cuscus:{L:40,H:21,head:15,snout:5,ears:'tiny',tail:'long',legs:'arms',shaggy:true},
 chinchilla:{L:30,H:20,head:16,snout:4,ears:'round',earScale:1.8,tail:'squirrel',legs:'stub'},
 marmot:{L:44,H:21,head:15,snout:6,ears:'tiny',tail:'thick',legs:'stub',shaggy:true},
 koala:{L:36,H:24,head:21,snout:4,ears:'round',earScale:1.8,tail:0,legs:'arms',shaggy:true,bigNose:true,claws:true},
 aardwolf:{L:54,H:25,head:17,snout:13,ears:'big',tail:'fox',legs:'thin',mark:'tiger',slope:true},
 giant_anteater:{L:60,H:22,head:11,snout:38,ears:'tiny',tail:'thick',legs:'thick',claws:true,mark:'saddle'},
 pangolin:{L:50,H:19,head:11,snout:13,ears:'none',tail:'thick',legs:'stub',claws:true,mark:'scales',belly:false},
 domestic_pig:{L:54,H:28,head:20,snout:12,ears:'floppy',tail:'curl',legs:'stub',pigNose:true},
 woolly_mammoth:{L:78,H:44,head:30,snout:0,ears:'elephant',tail:'thin',legs:'pillar',trunk:true,tusks:'long',belly:false,shaggy:true},
 liger:{L:74,H:27,head:22,snout:9,ears:'round',tail:'tuft',legs:'thick',mark:'tiger'},
 // Snow leopard (Panthera uncia): smoky grey with wide-spaced dark rosettes, small round ears, thick fur, and a tail nearly as long as its body.
 snow_leopard:{L:50,H:24,head:19,snout:8,legScale:1.2,ears:'round',tail:'snow',legs:'thick',mark:'rosettes',shaggy:true},
 // Requested 2026-11-11. Brown rat (Rattus norvegicus): a long pointed snout, round ears and a long bare tail. North American
 // porcupine (Erethizon dorsatum): stocky and short-legged, covered in long quills. King Kong: the giant gorilla of the films,
 // drawn as himself (owner, 2026-11-10): an ape's heavy shoulders and long arms, dark all over.
 rat:{L:40,H:16,head:14,snout:12,ears:'round',tail:'long',legs:'stub'},
 porcupine:{L:48,H:25,head:15,snout:9,ears:'tiny',tail:'stub',legs:'stub',mark:'spines',belly:false,shaggy:true},
 king_kong:{L:52,H:38,head:24,snout:6,ears:'none',tail:0,legs:'arms',face:'ape'},
};
function beast(c,r,p,P,low){
 // Real body depth is about 0.4-0.5 of body length for most of these, so the configured height is scaled up.
 const id=r.species,k=BEAST[id]||BEAST.dog,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),L=k.L,H=k.H*1.32,hd=k.head;
 // Long-necked grazers carry the head high and forward on a neck.
 const hx=k.neck?L*1.15+hd*.3:L*.95+hd*.35,hy=k.neck?-H*1.45:-H*.55-(k.slope?6:0)-(k.legs==='long'?4:0);
 const dark=P(a,-.38),lite=P(b,.12);
 // Tail first, so the body sits over its root.
 const tx=-L*.95,ty=-H*.25;
 // A rat's tail is long, bare and pinkish grey, with faint rings of scales.
 if(k.tail==='long'&&id==='rat'){path(c,`M${tx+6} ${ty} Q${tx-36} ${ty-22+sw} ${tx-70} ${ty-2+sw}`,null,P('#c9aaa2'),3.6);if(!low)for(let i=1;i<9;i++){const u=i/9,qx=(1-u)*(1-u)*(tx+6)+2*(1-u)*u*(tx-36)+u*u*(tx-70),qy=(1-u)*(1-u)*ty+2*(1-u)*u*(ty-22+sw)+u*u*(ty-2+sw);line(c,[[qx,qy-1.6],[qx,qy+1.6]],P('#a8867e',0,.6),.6);}}
 else if(k.tail==='long')path(c,`M${tx+6} ${ty} Q${tx-36} ${ty-22+sw} ${tx-64} ${ty-4+sw} Q${tx-70} ${ty+4+sw} ${tx-60} ${ty+2+sw}`,null,P(a,-.05),6);
 if(k.tail==='ringed'){path(c,`M${tx+6} ${ty} Q${tx-30} ${ty-14+sw} ${tx-52} ${ty+6+sw}`,null,P(a),11);if(!low)for(let i=0;i<5;i++){const u=.2+i*.17,x=tx+6-58*u,y=ty-12*Math.sin(u*3)+sw*u;ellipse(c,x,y,3,6,P('#2a2420'),.4);}}
 if(k.tail==='thick')path(c,`M${tx+6} ${ty} Q${tx-36} ${ty-6+sw} ${tx-62} ${ty+10+sw}`,null,P(a,-.1),14);
 // A wolf's tail: a bushy brush hanging down behind, darker at the tip.
 if(k.tail==='bushy'){path(c,`M${tx+8} ${ty-4} Q${tx-22} ${ty-2+sw} ${tx-44} ${ty+20+sw} Q${tx-50} ${ty+30+sw} ${tx-40} ${ty+30+sw} Q${tx-20} ${ty+22+sw*.5} ${tx+6} ${ty+10}Z`,P(a,-.04),P(a,-.4,.7),.7);path(c,`M${tx-36} ${ty+16+sw} Q${tx-48} ${ty+24+sw} ${tx-44} ${ty+30+sw} Q${tx-38} ${ty+31+sw} ${tx-32} ${ty+25+sw}Z`,P('#2a2624',0,.8));if(!low)for(let i=0;i<8;i++){const u=.15+i*.1;line(c,[[tx+6-u*44,ty+u*18+sw*u],[tx+2-u*48,ty+4+u*22+sw*u]],P(a,.18,.5),.8);}}
 // A big cat's tail: thick, held out behind and curving up at the end, ringed on a tiger, spotted on a leopard, dark-tipped.
 if(k.tail==='bigcat'){const X=[tx+8,tx-22,tx-44,tx-58],Y=[ty,ty+6+sw*.5,ty+10+sw,ty+2+sw],d=`M${X[0]} ${Y[0]} C${X[1]} ${Y[1]} ${X[2]} ${Y[2]} ${X[3]} ${Y[3]} Q${tx-66} ${ty-4+sw} ${tx-64} ${ty-14+sw}`,bz=(A,u)=>{const m=1-u;return m*m*m*A[0]+3*m*m*u*A[1]+3*m*u*u*A[2]+u*u*u*A[3];};
  path(c,d,null,P(a,-.42),11);path(c,d,null,P(a,-.04),9);
  if(!low&&(k.mark==='tiger'||k.mark==='rosettes'||k.mark==='clouds'))for(const u of [.22,.38,.52,.65,.77,.88,.97]){const th=Math.atan2(bz(Y,u+.01)-bz(Y,u-.01),bz(X,u+.01)-bz(X,u-.01));if(k.mark==='tiger')ellipse(c,bz(X,u),bz(Y,u),1.8,4.8,P('#1d1714',0,.85),th);else ellipse(c,bz(X,u),bz(Y,u)-1.4,2.1,1.7,P('#2b2018',0,.8),th);}
  ellipse(c,tx-64,ty-14+sw,4.2,4.2,P(k.mark==='tiger'||id==='snow_leopard'?'#1d1714':a,k.mark==='tiger'?0:-.35));}
 // A cat's tail: as thick at the tip as near the root, held out and curving up, with dark tabby rings.
 if(k.tail==='cat'){const d=`M${tx+8} ${ty} C${tx-14} ${ty-2} ${tx-30} ${ty-6+sw} ${tx-40} ${ty-22+sw} Q${tx-46} ${ty-34+sw} ${tx-40} ${ty-42+sw}`;path(c,d,null,P(a,-.42),9.5);path(c,d,null,P(a,-.04),7.5);
  if(!low&&k.mark==='tabby'){const X=[tx+8,tx-14,tx-30,tx-40],Y=[ty,ty-2,ty-6+sw,ty-22+sw],bz=(A,u)=>{const m=1-u;return m*m*m*A[0]+3*m*m*u*A[1]+3*m*u*u*A[2]+u*u*u*A[3];};
   for(const u of [.3,.46,.6,.73,.85,.96]){const th=Math.atan2(bz(Y,u+.01)-bz(Y,u-.01),bz(X,u+.01)-bz(X,u-.01));ellipse(c,bz(X,u),bz(Y,u),1.7,4,P('#3a302a',0,.7),th);}}
  ellipse(c,tx-40,ty-42+sw,3.6,3.6,P(a,-.2));}
 // A kitsune's tails fan out behind it, each tipped with the second colour.
 if(k.tails)for(let i=0;i<k.tails;i++){const ang=(i/(k.tails-1)-.5)*1.7,cx=Math.cos(ang),sy=Math.sin(ang),wv=Math.sin(p.swim+i*.7)*4,ex=tx-58*cx,ey=ty+50*sy-16*cx+wv;path(c,`M${tx+6} ${ty-3} Q${tx-30*cx} ${ty+26*sy-12+wv*.5} ${ex} ${ey} Q${tx-24*cx} ${ty+26*sy+6} ${tx+6} ${ty+6}Z`,P(a,-.04+(i%2)*.05),P(a,-.3,.6),.6);ellipse(c,ex+3*cx,ey,6,4,P(k.tipCol||b,0,.9),ang);}
 if(k.tail==='lemur'){const d=`M${tx+6} ${ty} Q${tx-34} ${ty-6+sw} ${tx-56} ${ty-30+sw} Q${tx-70} ${ty-50+sw} ${tx-60} ${ty-66+sw}`;path(c,d,null,P('#f2efe8'),8);{const q=path(c,d);c.save();c.strokeStyle=P('#1d1c1c');c.lineWidth=8;c.lineCap='butt';c.setLineDash([6,6]);c.stroke(q);c.restore();}}
 if(k.tail==='bare')path(c,`M${tx+6} ${ty} Q${tx-12} ${ty-4+sw} ${tx-24} ${ty+3+sw}`,null,P(a,-.06),3);
 if(k.tail==='snow'){path(c,`M${tx+8} ${ty} Q${tx-34} ${ty-26+sw} ${tx-68} ${ty-10+sw} Q${tx-86} ${ty+2+sw} ${tx-96} ${ty+16+sw}`,null,P(a,-.04),15);path(c,`M${tx+8} ${ty+3} Q${tx-34} ${ty-22+sw} ${tx-68} ${ty-6+sw} Q${tx-86} ${ty+6+sw} ${tx-96} ${ty+19+sw}`,null,P(b,.1,.6),5);if(!low)for(let i=0;i<7;i++){const u=.14+i*.13,v=1-u,x=v*v*(tx+8)+2*v*u*(tx-44)+u*u*(tx-96),y=v*v*ty+2*v*u*(ty-30+sw)+u*u*(ty+16+sw);path(c,`M${x-2.5} ${y-6.5} q-3 6 0 12`,null,P('#2b2018',0,.8),2.4);}}
 if(k.tail==='squirrel')path(c,`M${tx+4} ${ty+4} Q${tx-40} ${ty-10} ${tx-30} ${ty-48+sw} Q${tx-10} ${ty-66+sw} ${tx+8} ${ty-50+sw} Q${tx-14} ${ty-34} ${tx+6} ${ty-6}Z`,P(a,.05),P(a,-.3),1);
 if(k.tail==='fox'){path(c,`M${tx+6} ${ty} Q${tx-34} ${ty-14+sw} ${tx-62} ${ty+4+sw} Q${tx-40} ${ty+20+sw} ${tx+6} ${ty+10}Z`,P(a));path(c,`M${tx-48} ${ty+1+sw} Q${tx-58} ${ty+4+sw} ${tx-62} ${ty+4+sw} Q${tx-52} ${ty+12+sw} ${tx-44} ${ty+9+sw}Z`,P('#f6f1e7'));}
 if(k.tail==='horse'){for(let i=0;i<9;i++)path(c,`M${tx+6} ${ty-2} Q${tx-22} ${ty+10+i*2+sw} ${tx-30+i*1.5} ${ty+40+i*3+sw}`,null,P(a,-.4),3);}
 if(k.tail==='tuft'){path(c,`M${tx+6} ${ty} Q${tx-20} ${ty+10+sw} ${tx-26} ${ty+30+sw}`,null,P(a,-.1),3);ellipse(c,tx-26,ty+34+sw,4,7,P('#2a2420'));}
 if(k.tail==='curl'){const [cx,cy]=atBody(tx-4,ty-10);c.strokeStyle=P(a);c.lineWidth=6;c.beginPath();c.arc(cx,cy,8,.6,5.2);c.stroke();}
 if(k.tail==='wag')path(c,`M${tx+6} ${ty} Q${tx-18} ${ty-26+sw*2} ${tx-26} ${ty-36+sw*2}`,null,P(a),6);
 if(k.tail==='thin'){path(c,`M${tx+6} ${ty} Q${tx-14} ${ty+10} ${tx-16} ${ty+30}`,null,P(a,-.1),2.5);ellipse(c,tx-16,ty+32,2.5,5,P('#2a2420'));}
 if(k.tail==='stub')ellipse(c,tx+2,ty,6,5,P(a,-.05));
 if(k.tail==='puff')for(let i=0;i<7;i++)ellipse(c,tx-2+Math.cos(i*.9)*4,ty-2+Math.sin(i*.9)*4,5,4.5,P(b,.25));
 // Ankylosaurus: a thick tail stiffened near the end, finished with a two-lobed bony club.
 if(k.tail==='club'){path(c,`M${tx+10} ${ty-9} Q${tx-40} ${ty-7+sw} ${tx-72} ${ty+3+sw} L${tx-72} ${ty+10+sw} Q${tx-40} ${ty+13+sw} ${tx+10} ${ty+10}Z`,grad(c,P,a,b,ty-9,ty+13));
  if(!low)for(let i=0;i<6;i++)ellipse(c,tx-8-i*10,ty-5+sw*(i/6),3.2,2.2,P(a,-.18));
  for(const dy of [-3,5]){ellipse(c,tx-80,ty+dy+sw,12,8,P(a,-.16));ellipse(c,tx-83,ty+dy-2.5+sw,5,2.4,P(a,.15,.6));}}
 if(k.mark==='cheetah'){const P0=[tx+6,ty],P1=[tx-36,ty-22+sw],P2=[tx-64,ty-4+sw];for(let i=0;i<5;i++){const u=.6+i*.08,x=(1-u)*(1-u)*P0[0]+2*u*(1-u)*P1[0]+u*u*P2[0],y=(1-u)*(1-u)*P0[1]+2*u*(1-u)*P1[1]+u*u*P2[1];ellipse(c,x,y,2,3.4,P('#1d1714'));}ellipse(c,tx-63,ty-3+sw,3,3,P('#f6efe0'));}
 if(k.membrane)path(c,`M${-L*.7} ${-2} Q0 ${H*1.2} ${L*.7} ${-2} Z`,P(a,-.1,.75));
 // Legs: shaped limbs (thigh, shin, paw or hoof); the far pair darker, behind the body.
 const legLen=(k.legs==='long'?H*1.55:k.legs==='pillar'?H*1.0:k.legs==='stub'?H*.5:k.legs==='arms'?H*.85:H*.95)*(k.legScale||1);
 const thick=k.legs==='pillar'?15:k.legs==='thick'?12:k.legs==='arms'?11:k.legs==='stub'?9:k.legs==='long'?7:8;
 // A dog-paddle: each paw goes round in a circle, opposite corners together. A still picture keeps the old small sway.
 // On the sand (p.walk) it walks: opposite corners step together, and a foot lifts only while it swings forward.
 const limb=(x,front,far,i)=>{const walking=!!p.walk,paddling=p.effort!==undefined&&!walking,ph=p.swim+(walking?[0,Math.PI,Math.PI,0]:[0,Math.PI,Math.PI+.5,.5])[i],q=Math.sin(p.swim+i*1.7)*.22,top=H*.15,lift=paddling?(.5+.5*Math.cos(ph))*legLen*.3:walking?Math.max(0,Math.cos(ph))*legLen*.16:0,knee=top+(legLen-lift)*.5,foot=top+legLen-lift;
  const kx=x+(front?2:-thick*1.25)+(paddling?Math.sin(ph)*legLen*.14:walking?Math.sin(ph)*legLen*.12:Math.sin(q)*6),fx=x+(front?4:thick*.45)+(paddling?Math.sin(ph)*legLen*.34:walking?Math.sin(ph)*legLen*.3:Math.sin(q)*12);
  // A giant panda's legs are black (15 Nov 2026).
  const lc=k.mark==='panda'?'#1f1f22':a,col=grad(c,P,lc,lc,top,foot);c.save();if(far)c.globalAlpha*=.85;
  path(c,`M${x-thick*1.1} ${top} Q${x-thick*1.2} ${knee-6} ${kx-thick*.5} ${knee} L${fx-thick*.42} ${foot-3} L${fx+thick*.42} ${foot-3} L${kx+thick*.5} ${knee} Q${x+thick*1.2} ${knee-8} ${x+thick*1.1} ${top}Z`,far?P(lc,-.32):col);
  if(k.legs==='long'||k.legs==='pillar'&&id!=='elephant'&&id!=='woolly_mammoth')path(c,`M${fx-thick*.55} ${foot-3} L${fx+thick*.55} ${foot-3} L${fx+thick*.6} ${foot+3} L${fx-thick*.65} ${foot+3}Z`,P('#2b2622'));
  else{if(k.claws)for(let t=0;t<3;t++)path(c,`M${fx+t*2.4-1} ${foot} q7 2 9 9`,null,P('#e6dcc2',0,far?.6:.9),1.6);ellipse(c,fx+2,foot,thick*.75,thick*.42,far?P(lc,-.35):P(lc,-.08));if(!low)for(let t=-1;t<=1;t++)path(c,`M${fx+2+t*thick*.35} ${foot-1} l1 ${thick*.35}`,null,P(id==='elephant'?'#e8e0cc':'#3a302a',0,.7),1);}
  c.restore();};
 limb(-L*.48,false,true,0);limb(L*.62,true,true,1);limb(-L*.6,false,false,2);limb(L*.5,true,false,3);
 // Body: hip and shoulder masses, a waist, a sloping neck into the head.
 const top=-H*(k.slope?1.15:1),sh=k.slope?-H*1.25:-H*1.05;
 const body=path(c,`M${-L*1.02} ${-H*.05} C${-L*1.08} ${-H*.85} ${-L*.75} ${top} ${-L*.45} ${top*.95} C${-L*.1} ${top*.82} ${L*.25} ${sh} ${L*.62} ${sh} C${L*.9} ${sh} ${L*1.02} ${-H*.75} ${L*1.02} ${-H*.3} C${L*1.05} ${H*.25} ${L*.8} ${H*.5} ${L*.45} ${H*.45} C${L*.1} ${H*.36} ${-L*.25} ${H*.36} ${-L*.55} ${H*.5} C${-L*.9} ${H*.55} ${-L*1.0} ${H*.3} ${-L*1.02} ${-H*.05}Z`,grad(c,P,a,b,-H,H*.6),P(a,-.45),.6);
 c.save();c.clip(body);
 if(k.belly!==false)ellipse(c,0,H*.5,L*.75,H*.32,P(b,.15,.75));
 if(k.mark==='panda'){path(c,`M${L*.25} ${-H*1.2} Q${L*.5} ${-H*.6} ${L*.35} ${H*.6} L${L*.75} ${H*.6} Q${L*.8} ${-H*.4} ${L*.6} ${-H*1.2}Z`,P('#1c1c1f'));ellipse(c,-L*.6,H*.35,L*.32,H*.45,P('#1c1c1f'));}
 if(k.mark==='tiger'&&!low)for(let i=0;i<10;i++){const x=-L*.85+i*L*.19;path(c,`M${x} ${top-4} q${-6} ${H*.45} ${2} ${H*.85} q4 -${H*.4} -2 -${H*.85}Z`,P('#1d1714',0,.88));}
 if(k.mark==='zebra')for(let i=0;i<14;i++){const x=-L*.95+i*L*.15;path(c,`M${x} ${top-4} q${-5} ${H*.7} ${3} ${H*1.6}`,null,P('#1b1b1d'),5.5);}
 // Clouded leopard: big cloud-shaped blotches, each darker round the edge, with smaller spots between.
 if(k.mark==='clouds')for(let i=0;i<16;i++){const x=-L*.85+((i*37)%100)/100*L*1.7,y=top*.85+((i*53)%100)/100*H*1.1,w=5+(i%3)*2,h=3.5+(i%2)*1.5;ellipse(c,x,y,w,h,P('#3a2a1e',0,.75),i*.7);ellipse(c,x+.6,y+.4,w*.62,h*.55,P(a,-.12,.9),i*.7);}
 // Lowland streaked tenrec: black with yellow stripes from crown to rump, and a crest of pale quills.
 if(k.mark==='tenrec'){for(const dy of [.25,.55,.85])path(c,`M${-L*.95} ${top*(1-dy)+H*dy*.2} Q0 ${top*(1-dy)-2+H*dy*.2} ${L*.95} ${top*(1-dy)+H*dy*.2}`,null,P(b,.1,.95),2.4);if(!low)for(let i=0;i<22;i++){const x=-L*.85+i*L*.08;line(c,[[x,top*.9],[x-3,top*.9-5-(i%3)*1.5]],P(b,.2,.95),1.1);}}
 if(k.mark==='rosettes')for(let i=0;i<46;i++){const x=-L*.92+((i*37)%100)/100*L*1.85,y=top*.9+((i*53)%100)/100*H*1.15,r2=1.6+(i%3)*.5;ellipse(c,x,y,r2*1.2,r2,P(a,-.2,.85));for(let j=0;j<4;j++)ellipse(c,x+Math.cos(j*1.6+i)*r2*1.3,y+Math.sin(j*1.6+i)*r2*1.1,r2*.55,r2*.45,P('#2b2018',0,.9));}
 if(k.mark==='cheetah')for(let i=0;i<80;i++){const x=-L*.95+((i*37)%100)/100*L*1.9,y=top*.92+((i*53)%100)/100*H*1.25;ellipse(c,x,y,1.9+(i%3)*.4,1.7+(i%3)*.35,P('#1d1714',0,.9));}
 // Ankylosaurus armour: rows of oval bony plates (osteoderms), each with a low keel.
 if(k.armour)for(let row=0;row<4;row++)for(let i=0;i<9;i++){const x=-L*.9+i*L*.22+(row%2)*L*.11,y=top*.82+row*H*.34,rx=L*.075*(1-row*.12),ry=H*.14;ellipse(c,x,y,rx,ry,P(a,-.14));ellipse(c,x-rx*.2,y-ry*.3,rx*.55,ry*.35,P(a,.12,.6));line(c,[[x-rx*.6,y],[x+rx*.6,y-ry*.2]],P(a,-.35,.7),.9);}
 if(k.mark==='tabby'&&!low)for(let i=0;i<12;i++){const x=-L*.85+i*L*.155;path(c,`M${x} ${top-4} q-4 ${H*.4} 2 ${H*.75}`,null,P(a,-.32,.55),2.2);}
 if(k.mark==='saddle'){ellipse(c,-L*.1,top*.85,L*.62,H*.42,P(a,-.3,.75));ellipse(c,L*.55,H*.2,L*.4,H*.45,P(b,.12,.55));}
 if(k.mark==='spots')for(let i=0;i<24;i++)ellipse(c,-L*.85+((i*41)%100)/100*L*1.7,top*.8+((i*29)%100)/100*H,3,2.4,P('#3a2c22',0,.8));
 if(k.mark==='ribs')for(let i=0;i<7;i++)path(c,`M${-L*.3+i*L*.12} ${top*.7} q-6 ${H*.5} 2 ${H*.9}`,null,P('#d9d2bf',0,.7),2.2);
 if(k.mark==='dorsal')path(c,`M${-L} ${top*.9} Q0 ${top*1.1} ${L} ${top*.6}`,null,P('#2e2a2a'),3);
 if(k.mark==='fox')ellipse(c,L*.5,H*.35,L*.35,H*.35,P('#f6f1e7'));
 if(k.mark==='spines'){ellipse(c,L*.5,H*.42,L*.5,H*.34,P(b,.08,.95));for(let row=0;row<7;row++)for(let i=0;i<16;i++){const x=-L*1.05+i*L*.15+(row%2)*L*.07,y=top*1.02+row*H*.2;line(c,[[x,y],[x-6,y-8]],P(i%3?'#2e2620':'#efe6d2',0,.95),1.7);}}
 if(k.mark==='scales')for(let row=0;row<7;row++)for(let i=0;i<12;i++){const x=-L*1.02+i*L*.19+(row%2)*L*.095,y=top*1.05+row*H*.28;path(c,`M${x-L*.1} ${y} Q${x} ${y+H*.34} ${x+L*.1} ${y} Q${x} ${y-H*.14} ${x-L*.1} ${y}Z`,P(a,row%2?.06:-.06),P(a,-.45),.9);}
 if(k.wool&&!low)for(let i=0;i<70;i++){const [x,y]=atBody(-L+((i*37)%100)/100*L*1.9,top+((i*53)%100)/100*H*1.5);c.strokeStyle=P(b,.25,.9);c.lineWidth=2;c.beginPath();c.arc(x,y,4.5,0,TAU);c.stroke();}
 if(k.shaggy&&!low)for(let i=0;i<90;i++){const x=-L+((i*37)%100)/100*L*2,y=top+((i*53)%100)/100*H*1.6;line(c,[[x,y],[x-3,y+7]],P(a,i%2?.2:-.25,.7),1.4);}
 if(k.silverback)ellipse(c,-L*.2,top*.6,L*.5,H*.35,P('#b9b6b0',0,.55));
 if(k.wrinkle&&!low)for(let i=0;i<9;i++)path(c,`M${-L*.6+i*L*.15} ${top*.6} q-4 ${H*.6} 2 ${H*1.2}`,null,P(a,-.3,.5),1);
 if(k.shell){for(let i=0;i<9;i++)path(c,`M${-L*.85+i*L*.2} ${top-2} q-3 ${H*.6} 2 ${H*1.1}`,null,P('#c76f86'),2.5);}
 if(!low&&!k.wool&&!k.shell&&!k.mark?.startsWith?.('sc')){ellipse(c,-L*.6,-H*.12,L*.34,H*.62,P(a,.16,.2),-.25);path(c,`M${-L*.28} ${-H*.72} Q${-L*.14} ${-H*.1} ${-L*.4} ${H*.42}`,null,P(a,-.42,.3),1.4);ellipse(c,L*.56,-H*.32,L*.26,H*.5,P(a,.14,.18),.2);path(c,`M${L*.3} ${-H*.8} Q${L*.2} ${-H*.3} ${L*.34} ${H*.34}`,null,P(a,-.42,.22),1.2);}
 if(!low&&!k.wool&&!k.shell)skin(c,body,P,a,r.seed,110);
 if(!low&&!k.wool&&!k.shell&&!k.bare)for(let i=0;i<60;i++){const x=-L+((i*61)%100)/100*L*1.9,y=top+((i*17)%100)/100*H*1.3;line(c,[[x,y],[x-2.5,y+4]],P(a,.25,.35),.7);}
 c.restore();
 // A porcupine's long quills stand out well past its outline, dark with white tips.
 if(id==='porcupine')for(let i=0;i<30;i++){const u=i/29,x=-L*.98+u*L*1.55,y=top*(.82+.14*Math.sin(u*Math.PI))+Math.abs(u-.45)*6,len=14+10*Math.sin(u*Math.PI)+(i%3)*3,ang=-2.1-u*.5+(i%2)*.12,ex=x+Math.cos(ang)*len,ey=y+Math.sin(ang)*len;
  line(c,[[x,y+4],[ex,ey]],P('#2a221c'),1.6);line(c,[[x+(ex-x)*.72,y+4+(ey-y-4)*.72],[ex,ey]],P('#f2ece0'),1.6);}
 if(k.neck){const neck=path(c,`M${L*.45} ${-H*.85} Q${L*.75} ${-H*1.35} ${hx-hd*.55} ${hy-hd*.55} L${hx-hd*.1} ${hy+hd*.55} Q${L*1.0} ${-H*.4} ${L*.95} ${-H*.15}Z`,grad(c,P,a,b,hy,0));if(!low)skin(c,neck,P,a,r.seed+7,40);if(k.mark==='zebra'){c.save();c.clip(neck);for(let i=0;i<7;i++)path(c,`M${L*.5+i*L*.09} ${hy-hd} q8 ${H*.6} -4 ${H*1.6}`,null,P('#1b1b1d'),5);c.restore();}}
 if(k.mane==='short'||k.mane===true)for(let i=0;i<12;i++){const u=i/11,x=k.neck?L*.45+(hx-hd*.55-L*.45)*u:L*.35+i*L*.06,y=k.neck?-H*.85+(hy-hd*.55+H*.85)*u-4:-H*.95-i*1.6;path(c,`M${x} ${y} l-6 -10 l9 4Z`,P(k.mark==='zebra'?'#1b1b1d':a,-.35));}
 if(k.dewlap)path(c,`M${L*.95} ${-H*.1} q4 18 -4 26 q-6 -10 -2 -24Z`,P(a,-.2));
 // Ankylosaurus: spikes along the flank, and horns at the back corners of the armoured skull.
 if(k.armour){for(let i=0;i<7;i++){const x=-L*.78+i*L*.24,y=-H*.2+Math.abs(i-3)*1.5;path(c,`M${x-5} ${y} L${x-13} ${y-15} L${x+4} ${y-1}Z`,P('#b8a888',-.1),P(a,-.45),.7);}
  for(const dy of [-.55,-.2])path(c,`M${hx-hd*.55} ${hy+hd*dy} L${hx-hd*1.25} ${hy+hd*(dy-.35)} L${hx-hd*.45} ${hy+hd*(dy+.25)}Z`,P(b,-.05),P(a,-.4),.7);}
 // Head.
 if(k.mane==='lion'){const g=c.createRadialGradient(hx-hd*.2,hy,hd*.4,hx-hd*.2,hy,hd*1.6);g.addColorStop(0,P(a,-.3));g.addColorStop(1,P(a,-.5,.9));ellipse(c,hx-hd*.25,hy+hd*.1,hd*1.45,hd*1.55,g);if(!low)for(let i=0;i<34;i++){const q=i/34*TAU;line(c,[[hx-hd*.25+Math.cos(q)*hd*.9,hy+hd*.1+Math.sin(q)*hd*.95],[hx-hd*.25+Math.cos(q)*hd*1.55,hy+hd*.1+Math.sin(q)*hd*1.62]],P(a,i%2?-.45:-.2,.8),2.2);}}
 if(k.ears==='elephant'){path(c,`M${hx-8} ${hy-hd*.7} Q${hx-hd*1.6} ${hy-hd*.9} ${hx-hd*1.5} ${hy+hd*.6} Q${hx-hd*.9} ${hy+hd*1.3} ${hx-4} ${hy+hd*.4}Z`,P(a,-.12),P(a,-.4),1.2);if(!low)for(let i=0;i<4;i++)path(c,`M${hx-hd*.4-i*6} ${hy-hd*.3} q-${hd*.3} ${hd*.4} -${hd*.2} ${hd*.9}`,null,P(b,-.1,.5),1.2);}
 const B=k.blunt??.3,S=k.snout;
 // A long muzzle ends in a rounded nose, deeper for horses and capybaras (blunt 1) than for foxes (the default).
 const headPath=k.snout>12?`M${hx-hd} ${hy} Q${hx-hd} ${hy-hd} ${hx} ${hy-hd*.95} Q${hx+hd*.8} ${hy-hd*.9} ${hx+hd+S*.8} ${hy-hd*(.17+.25*B)} Q${hx+hd+S*1.02} ${hy-hd*(.14+.2*B)} ${hx+hd+S} ${hy+hd*(.04+.18*B)} Q${hx+hd+S*.97} ${hy+hd*(.3+.3*B)} ${hx+hd*.7} ${hy+hd*.6} Q${hx-hd*.6} ${hy+hd*.95} ${hx-hd} ${hy}Z`:`M${hx-hd} ${hy} A${hd} ${hd*.95} 0 1 1 ${hx+hd} ${hy} A${hd} ${hd*.95} 0 1 1 ${hx-hd} ${hy}Z`;
 const catFace=['fossa','leopardus_tilcayo','clouded_leopard','jaguar','lion','tiger','leopard','black_panther','cheetah','cat','liger','snow_leopard'].includes(id);
 const catHead=`M${hx-hd} ${hy} Q${hx-hd} ${hy-hd*.98} ${hx} ${hy-hd*.95} Q${hx+hd*.7} ${hy-hd*.9} ${hx+hd*.98} ${hy-hd*.22} Q${hx+hd*1.26} ${hy-hd*.08} ${hx+hd*1.3} ${hy+hd*.2} Q${hx+hd*1.25} ${hy+hd*.62} ${hx+hd*.85} ${hy+hd*.72} Q${hx+hd*.2} ${hy+hd*1.02} ${hx-hd*.55} ${hy+hd*.78} Q${hx-hd} ${hy+hd*.45} ${hx-hd} ${hy}Z`;
 const head=path(c,catFace?catHead:headPath,grad(c,P,a,b,hy-hd,hy+hd));
 c.save();c.clip(head);
 if(k.mark==='panda')for(const dx of [hd*.18,hd*.62])ellipse(c,hx+dx,hy-hd*.1,hd*.24,hd*.32,P('#1c1c1f'),-.4);
 if(k.mark==='mask')path(c,`M${hx-hd*.4} ${hy-hd*.35} Q${hx+hd*.5} ${hy-hd*.6} ${hx+hd*1.1} ${hy-hd*.2} Q${hx+hd*.5} ${hy+hd*.15} ${hx-hd*.4} ${hy-hd*.05}Z`,P('#24201d'));
 if(k.mark==='pugmask')ellipse(c,hx+hd*.55,hy+hd*.15,hd*.55,hd*.5,P('#2a2420'));
 if(k.mark==='tiger')for(let i=0;i<4;i++)path(c,`M${hx-hd*.3+i*hd*.25} ${hy-hd} l2 ${hd*.35}`,null,P('#1d1714'),3);
 if(k.mark==='zebra')for(let i=0;i<5;i++)path(c,`M${hx-hd*.8+i*hd*.45} ${hy-hd} q-3 ${hd} 3 ${hd*1.8}`,null,P('#1b1b1d'),3.5);
 if(k.mark==='fox'||k.mark==='mask')ellipse(c,hx+hd*.9,hy+hd*.35,hd*.7,hd*.35,P('#f6f1e7'));
 // Cheetah: the black tear line from the eye to the corner of the mouth, and small spots on the head.
 if(k.mark==='cheetah'){path(c,`M${hx+hd*.38} ${hy-hd*.05} Q${hx+hd*.42} ${hy+hd*.4} ${hx+hd*.78} ${hy+hd*.55}`,null,P('#1d1714'),2.2);for(let i=0;i<9;i++)ellipse(c,hx-hd*.6+((i*37)%100)/100*hd*1.1,hy-hd*.8+((i*53)%100)/100*hd*.6,1.1,1,P('#1d1714',0,.85));}
 if(k.armour)for(let i=0;i<6;i++)ellipse(c,hx-hd*.6+i*hd*.25,hy-hd*.55+Math.abs(i-2.5)*1.5,hd*.14,hd*.1,P(a,-.16));
 if(k.face==='ape'){const fc=k.faceCol||(id==='orangutan'?'#8a6a55':'#3b3533');ellipse(c,hx+hd*.35,hy+hd*.1,hd*.66,hd*.74,P(fc));ellipse(c,hx+hd*.58,hy+hd*.42,hd*.42,hd*.32,P(fc,.16));path(c,`M${hx-hd*.1} ${hy-hd*.3} Q${hx+hd*.4} ${hy-hd*.6} ${hx+hd*.9} ${hy-hd*.28}`,null,P(fc,-.28),hd*.15);}
 if(k.cheeks)ellipse(c,hx+hd*.45,hy+hd*.5,hd*.5,hd*.38,P(b,.15,.9));
 if(k.mark==='tabby')for(let i=0;i<3;i++)path(c,`M${hx-hd*.2+i*hd*.22} ${hy-hd*.95} l1 ${hd*.38}`,null,P(a,-.35,.7),1.6);
 if(k.mark==='pallas'){for(let i=0;i<7;i++)ellipse(c,hx-hd*.4+(i%4)*hd*.22,hy-hd*.75+Math.floor(i/4)*hd*.2,1.3,1.1,P('#2a2420',0,.8));for(const dy of [.15,.38])path(c,`M${hx+hd*.55} ${hy+hd*dy} q-${hd*.4} 2 -${hd*.75} ${hd*.12}`,null,P('#2a2420',0,.75),1.6);ellipse(c,hx+hd*.75,hy+hd*.45,hd*.45,hd*.3,P('#f3ece0'));}
 if(k.mark==='saddle')ellipse(c,hx+hd*.9,hy+hd*.35,hd*.75,hd*.33,P(b,.2));
 if(k.wool)ellipse(c,hx+hd*.2,hy-hd*.7,hd*.9,hd*.45,P(b,.2));
 // The muzzle: pale whisker pads and chin, with a line of soft shadow up the bridge of the nose.
 if(catFace){const pale=id==='black_panther'?P(a,.14,.7):P('#f4ecdc',0,.92);ellipse(c,hx+hd*.92,hy+hd*.36,hd*.46,hd*.33,pale);ellipse(c,hx+hd*.62,hy+hd*.66,hd*.5,hd*.22,pale);path(c,`M${hx+hd*.55} ${hy-hd*.42} Q${hx+hd*.95} ${hy-hd*.3} ${hx+hd*1.2} ${hy-hd*.02}`,null,P(a,-.22,.45),hd*.14);}
 if(id==='tiger'||id==='liger')for(const [dx,dy,l] of [[-.1,.25,.34],[-.28,.42,.36],[-.42,.05,.28]])path(c,`M${hx+hd*dx} ${hy+hd*dy} q${-hd*l*.5} ${hd*.05} ${-hd*l} ${-hd*.06}`,null,P('#1d1714',0,.85),2.4);
 if(id==='hippo'){ellipse(c,hx+hd+k.snout*.45,hy+hd*.3,hd*.72,hd*.56,P(a,.08));for(let i=0;i<18;i++)ellipse(c,hx+hd*.7+(i%6)*hd*.17,hy+hd*.1+Math.floor(i/6)*hd*.17,.7,.6,P('#2a2220',0,.55));}
 if(!low)skin(c,head,P,a,r.seed+3,40);
 c.restore();
 if(k.trunk){const t=Math.sin(p.swim*.8)*8;path(c,`M${hx+hd*.55} ${hy-hd*.05} Q${hx+hd*1.5} ${hy+hd*.4} ${hx+hd*1.35+t} ${hy+hd*1.7} Q${hx+hd*1.25+t} ${hy+hd*2.4} ${hx+hd*1.55+t} ${hy+hd*2.5}`,null,P(a,-.04),hd*.42);if(!low)for(let i=0;i<7;i++)path(c,`M${hx+hd*.9+i*1.5} ${hy+hd*(.5+i*.2)} l7 -2`,null,P(a,-.35,.6),.8);}
 if(k.tusks==='long')path(c,`M${hx+hd*.5} ${hy+hd*.55} Q${hx+hd*2.2} ${hy+hd*2.2} ${hx+hd*2.7} ${hy+hd*.15}`,null,P('#f2ead6'),6);
 else if(k.tusks)path(c,`M${hx+hd*.55} ${hy+hd*.55} Q${hx+hd*1.2} ${hy+hd*.95} ${hx+hd*1.5} ${hy+hd*.6}`,null,P('#f2ead6'),4);
 const ear=(dx,shape)=>{const ex=hx-hd*.2+dx,ey=hy-hd*.75;
  if(shape==='pointy'||shape==='big'){const s=shape==='big'?1.6*(k.earScale||1):1;path(c,`M${ex-6*s} ${ey+4} L${ex} ${ey-hd*.55*s} L${ex+7*s} ${ey+4}Z`,P(a,-.1));path(c,`M${ex-3*s} ${ey+2} L${ex} ${ey-hd*.35*s} L${ex+3.5*s} ${ey+2}Z`,P('#e8b9a8',0,.8));}
  if(shape==='round'){const es=k.earScale||1,rr=hd*.3*es,dark=k.mark==='panda',ox=(ex-hx-dx*.7)/hd,sx=ex+dx*.7,oy=hy-hd*.95*Math.sqrt(Math.max(.05,1-ox*ox));rigidAt(c,sx,oy+rr*.15,()=>{c.rotate(ox*.85);path(c,`M${-rr} ${rr*.45} Q${-rr*1.15} ${-rr*1.15} 0 ${-rr*1.15} Q${rr*1.15} ${-rr*1.15} ${rr} ${rr*.45}Z`,P(dark?'#1c1c1f':a,-.1),P(dark?'#1c1c1f':a,-.42),.6);if(!dark)path(c,`M${-rr*.58} ${rr*.45} Q${-rr*.66} ${-rr*.62} 0 ${-rr*.66} Q${rr*.66} ${-rr*.62} ${rr*.58} ${rr*.45}Z`,P(k.mark==='tiger'||id==='liger'?'#3a2a20':'#d9a899',0,.75));});}
  if(shape==='tufted'){path(c,`M${ex-6} ${ey+4} L${ex} ${ey-hd*.6} L${ex+6} ${ey+4}Z`,P(a,-.1));line(c,[[ex,ey-hd*.6],[ex-1,ey-hd*.85]],P('#2a2420'),2);}
  // A dog's soft ear hangs down beside the cheek; only the near one shows.
  if(shape==='floppy'&&dx>0)path(c,`M${ex-5} ${ey+3} Q${ex-14} ${ey+hd*.55} ${ex-9} ${ey+hd*1.25} Q${ex-2} ${ey+hd*1.42} ${ex+5} ${ey+hd*1.02} Q${ex+9} ${ey+hd*.45} ${ex+7} ${ey+2} Q${ex+1} ${ey-2} ${ex-5} ${ey+3}Z`,P(a,-.2),P(a,-.5,.7),.8);
  if(shape==='side')ellipse(c,hx-hd*.7,hy-hd*.2,hd*.32,hd*.13,P(a,-.1),-.3);
  if(shape==='tiny')ellipse(c,ex,ey+4,3,2.5,P(a,-.2));
  // A rabbit's ears stand taller than its head is long (15 Nov 2026; they had been short enough to read as a hamster's).
  if(shape==='bunny')rigidAt(c,ex,ey+2,()=>{c.rotate(-.3+dx*.012);ellipse(c,0,-hd*1.02,hd*.26,hd*1.08,P(a,-.06));ellipse(c,0,-hd*.98,hd*.13,hd*.86,P('#e8b9a8',0,.85));});};
 if(k.ears&&k.ears!=='none'&&k.ears!=='elephant'){ear(-hd*.3,k.ears);ear(hd*.25,k.ears);}
 if(k.antlers==='moose')for(const s2 of [-1,1]){const ax=hx-hd*.25,ay=hy-hd*.8;rigidAt(c,ax,ay,()=>{c.scale(s2<0?-1:1,1);c.rotate(-.35);
  path(c,`M0 0 Q${hd*.4} ${-hd*.3} ${hd*1.5} ${-hd*.35} L${hd*1.75} ${-hd*.75} L${hd*1.45} ${-hd*.7} L${hd*1.55} ${-hd*1.1} L${hd*1.2} ${-hd*.95} L${hd*1.2} ${-hd*1.35} L${hd*.9} ${-hd*1.05} L${hd*.75} ${-hd*1.35} L${hd*.55} ${-hd*.9} Q${hd*.2} ${-hd*.6} 0 -2Z`,P(s2<0?'#b9a47e':'#d6c39c'),P('#8a7656'),1.2);});}
 if(k.mane===true)for(let i=0;i<8;i++)path(c,`M${hx-hd*.6+i*3} ${hy-hd*.9} q-8 -4 -12 4`,null,P(a,-.4),3);
 const eyeX=hx+(catFace?hd*.6:k.face==='ape'?hd*.46:k.snout>12?hd*.35:hd*.4),eyeY=hy-hd*(catFace?.28:k.face==='ape'?.14:.2);
 eye(c,eyeX,eyeY,P,id==='naked_mole_rat'?1.2:id==='diprotodon'?2:k.face==='ape'?2.2:id==='pug'||id==='sugar_glider'?3.4:catFace?2.1:2.4,id==='cat'?{iris:'#a8b45a',slit:true}:id==='ring_tailed_lemur'?{iris:'#e8a030'}:id==='kitsune'?{iris:'#e8b030'}:catFace?{iris:id==='snow_leopard'?'#a8b8a4':id==='black_panther'?'#c8b23c':'#c9a23c'}:undefined);
 // The kitsune's red face markings, like flames above the eye and along the cheek.
 if(k.kitsune){path(c,`M${eyeX-hd*.1} ${eyeY-hd*.25} Q${eyeX+hd*.1} ${eyeY-hd*.7} ${eyeX-hd*.35} ${eyeY-hd*.95}`,null,P('#d8322e'),2.2);path(c,`M${eyeX+hd*.25} ${eyeY+hd*.08} q${hd*.25} ${hd*.05} ${hd*.45} ${-hd*.15}`,null,P('#d8322e'),1.6);}
 if(catFace)path(c,`M${eyeX-hd*.22} ${eyeY-hd*.15} Q${eyeX} ${eyeY-hd*.26} ${eyeX+hd*.22} ${eyeY-hd*.08}`,null,P(a,-.45,.7),1.2);
 const noseX=catFace?hx+hd*1.22:k.snout>12?hx+hd+k.snout*(.88+.04*B):hx+hd*.92;
 if(!low&&id==='cat'){path(c,`M${hx-hd*.35} ${hy-hd*.55} l${hd*.16} ${-hd*.3} l${hd*.16} ${hd*.22} l${hd*.16} ${-hd*.22} l${hd*.16} ${hd*.3}`,null,P(a,-.38,.75),1.1);for(let i=0;i<2;i++)path(c,`M${hx+hd*.1} ${hy+hd*.18+i*3} q${hd*.3} ${-1} ${hd*.46} ${1+i}`,null,P(a,-.35,.6),1);}
 if(catFace){path(c,`M${noseX-hd*.16} ${hy-hd*.05} L${noseX+hd*.08} ${hy-hd*.05} Q${noseX+hd*.09} ${hy+hd*.08} ${noseX-hd*.02} ${hy+hd*.12} Q${noseX-hd*.14} ${hy+hd*.08} ${noseX-hd*.16} ${hy-hd*.05}Z`,P(id==='cat'?'#d08a84':id==='black_panther'?'#141414':'#3a2622'));faceLine(c,P,`M${noseX-hd*.03} ${hy+hd*.13} L${noseX-hd*.05} ${hy+hd*.34} Q${noseX-hd*.3} ${hy+hd*.55} ${noseX-hd*.62} ${hy+hd*.38}`,P('#2a2220',0,.72));}
 else if(id==='hippo'){for(const dx of [-hd*.28,0])ellipse(c,hx+hd+k.snout*.5+dx,hy-hd*.14,2.6,1.7,P('#2a2220',0,.85));faceLine(c,P,`M${hx+hd+k.snout*.55} ${hy+hd*.42} Q${hx+hd*.9} ${hy+hd*.74} ${hx+hd*.3} ${hy+hd*.52}`,P('#2a2220',0,.75));}
 else if(k.face==='ape'){for(const dy of [0,hd*.13])ellipse(c,hx+hd*.8,hy+hd*.2+dy,1.5,1.1,P('#17110e',0,.85));faceLine(c,P,`M${hx+hd*.92} ${hy+hd*.56} Q${hx+hd*.62} ${hy+hd*.68} ${hx+hd*.28} ${hy+hd*.52}`,P('#17110e',0,.7));}
 else if(k.nostril){ellipse(c,noseX-1,hy-hd*.02,2.4,1.5,P('#2a2220',0,.75),-.5);ellipse(c,noseX-.4,hy-hd*.06,1,.6,P('#ffffff',0,.18));path(c,`M${noseX} ${hy+hd*.42} Q${noseX-hd*.3} ${hy+hd*.6} ${noseX-hd*.7} ${hy+hd*.48}`,null,P('#2a2220',0,.7),1.1);}
 else if(!k.trunk){ellipse(c,noseX,hy+(k.snout>12?-hd*(.05+.1*B):hd*.12),k.bigNose?hd*.26:k.pigNose?hd*.28:3.2,k.bigNose?hd*.34:k.pigNose?hd*.3:2.5,P(id==='cat'?'#d08a84':k.pigNose?'#e39a98':'#2a2220'));if(k.pigNose)for(const dy of [-2.6,2.6])ellipse(c,noseX+1,hy+hd*.12+dy,1.1,1.5,P('#7a4444'));path(c,`M${noseX-2} ${hy+hd*.3} q-5 4 -11 1`,null,P('#2a2220',0,.7),1.1);}
 if(!low&&['raccoon','fox','dog','leopard','tiger','hyena','pug','squirrel','sugar_glider','cat','pallas_cat','lion','black_panther','cheetah','ferret','guinea_pig','hamster','bunny','snow_leopard'].includes(id))crisp(c,(c)=>{for(let i=0;i<3;i++)line(c,[[noseX-3,hy+hd*.1+i*2],[noseX+14,hy+i*5-2]],P('#f0ece1',0,.65),.6);});
 if(k.buck){const mx=noseX-1,my=hy+hd*.34,T=P('#f0dca8'),E=P('#9a7a4a',0,.7);path(c,`M${mx-2} ${my} Q${mx+2} ${my+hd*.35} ${mx} ${my+hd*.62} L${mx-3.5} ${my+hd*.6} Q${mx-2.5} ${my+hd*.3} ${mx-6} ${my}Z`,T,E,.6);path(c,`M${mx-6} ${my+hd*1.02} Q${mx-1} ${my+hd*.74} ${mx+1.5} ${my+hd*.44} L${mx-2} ${my+hd*.42} Q${mx-4} ${my+hd*.7} ${mx-9.5} ${my+hd*.98}Z`,T,E,.6);}
 // A rabbit's tall ears go inside the helmet too, so it is set a little higher and larger.
 if(COMMUNITY_SPECIES[id]?.helmet)helmet(c,hx+(k.snout>12?k.snout*.35:0),hy-(k.ears==='bunny'?hd*.6:0),hd*1.85+(k.snout>12?k.snout*.5:0)+(k.antlers?hd*.4:0)+(k.mane==='lion'?hd*.45:0)+(k.ears==='bunny'?hd*.75:0),P);
}

// ---- 2026-11-08: birds and bats, with layered feathers ----
const AVIAN = {
 penguin:{L:30,H:52,upright:true,beak:'short',beakCol:'#e0782a',flipper:true,water:true,bib:'#f6f3ec',cap:'#1d1f24'},
 parrot:{L:30,H:34,beak:'hook',beakCol:'#f1e6c8',tail:'long',crest:false,cheek:'#f4f1e8'},
 dove:{L:34,H:26,beak:'thin',beakCol:'#3b3a3a',tail:'fan'},
 chicken:{L:34,H:32,beak:'short',beakCol:'#e9b23c',tail:'plume',comb:true,legs:'#e9b23c'},
 gannet:{L:46,H:22,beak:'dagger',beakCol:'#9fb1bd',tail:'point',water:true,mask:'#e8d48a',wingtip:'#1d1f24'},
 barn_owl:{L:30,H:38,upright:true,beak:'tiny',beakCol:'#e9d8c0',disc:true},
 bat:{L:24,H:20,beak:'none',bat:true},
 // 2026-11-15: the brown long-eared bat, whose ears are nearly as long as its body.
 brown_long_eared_bat:{L:22,H:18,beak:'none',bat:true,longEars:true},
 // 2026-11-13: the male resplendent quetzal, with the long green streamers over its tail, a fuzzy crest and a crimson belly.
 resplendent_quetzal:{L:30,H:26,beak:'short',beakCol:'#f2c230',tail:'streamer',crest:true,belly:'#c8202a'},
 // 2026-11-15: the cockatiel, grey with a yellow face and tall yellow crest, an orange cheek spot and a white bar on the wing.
 cockatiel:{L:28,H:24,beak:'hook',beakCol:'#b8aca0',tail:'long',crest:'tall',cap:'#f2d24a',cheek:'#e8803a',wingbar:'#f4f2ec',tailCol:'#6e6e6c'},
};
function avian(c,r,p,P,low){
 const id=r.species,k=AVIAN[id]||AVIAN.dove,a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*1;
 const L=k.L,H=k.H;
 if(k.bat){ // a fruit bat in its fishbowl, wings half open
  for(const s2 of [-1,1]){const wf=Math.sin(p.swim*1.4)*10*s2;path(c,`M-6 -4 Q${-40} ${-36+wf} ${-72} ${-22+wf} Q${-60} ${-6+wf} ${-50} ${4+wf} Q${-34} ${-2} ${-26} ${12} Q${-14} ${4} -4 10Z`,P(a,-.15,.95),P(a,-.45),1);if(!low)for(let i=0;i<3;i++)line(c,[[-8,-2],[-50-i*8,-24+i*12+wf]],P(a,-.5),1);c.scale(-1,1);}
  c.setTransform(c.getTransform());const body=path(c,'M-16 6 Q-20 -18 2 -20 Q22 -18 20 6 Q10 22 -4 20 Q-16 18 -16 6Z',grad(c,P,a,b,-20,20));if(!low)skin(c,body,P,a,r.seed,40);
  ellipse(c,8,-24,14,12,P(a,.05));for(const dx of [-4,12])path(c,k.longEars?`M${dx-2} -32 Q${dx-6} -52 ${dx+2} -66 Q${dx+10} -52 ${dx+6} -32Z`:`M${dx} -32 l3 -12 l4 11Z`,P(a,-.1));ellipse(c,16,-22,4,3,P('#3a2c2c'));eye(c,10,-27,P,2.6);
  helmet(c,8,-18,40,P);return;}
 // Tail and far wing first.
 const tx=-L*.95,ty=k.upright?H*.35:-H*.05;
 if(k.tail==='long')for(let i=0;i<4;i++)path(c,`M${tx+6} ${ty} L${tx-48-i*6} ${ty+10+i*5+f*4} L${tx-36} ${ty+4}Z`,P(i%2?(k.tailCol||b):a,i*.05));
 if(k.tail==='fan')for(let i=0;i<5;i++)path(c,`M${tx+6} ${ty} L${tx-26} ${ty-10+i*6} L${tx-20} ${ty-6+i*6}Z`,P(a,-.1+i*.04),P(a,-.35),.6);
 if(k.tail==='plume')for(let i=0;i<5;i++)path(c,`M${tx+8} ${ty-4} Q${tx-16} ${ty-34-i*4} ${tx-30+i*3} ${ty-12+i*5}`,null,P(i%2?'#2c5a3a':'#1d2c3f',0,.95),4);
 if(k.tail==='point')path(c,`M${tx+6} ${ty-3} L${tx-26} ${ty+1} L${tx+6} ${ty+5}Z`,P(a));
 if(k.tail==='streamer'){path(c,`M${tx+6} ${ty+2} L${tx-22} ${ty+10} L${tx-16} ${ty+2}Z`,P('#f4f1e8'),P('#9a9a90',0,.5),.5);for(let i=0;i<2;i++)path(c,`M${tx+6} ${ty} Q${tx-40} ${ty+4+i*6+f*5} ${tx-72-i*12} ${ty-4+i*9+f*9} Q${tx-96-i*12} ${ty-10+i*7+f*11} ${tx-118-i*14} ${ty+2+i*11+f*8}`,null,P(a,.04+i*.1,.95),5-i*1.4);}
 // Legs.
 if(!k.water||k.upright)for(const dx of [-6,6]){const lx=dx*(k.upright?1:.8),ly=k.upright?H*.55:H*.45;path(c,`M${lx} ${ly-4} l0 ${k.upright?6:14}`,null,P(k.legs||'#c9a48a'),3);path(c,`M${lx-5} ${ly+(k.upright?4:12)} l10 0 M${lx} ${ly+(k.upright?4:12)} l6 3`,null,P(k.legs||(k.upright?'#e0782a':'#c9a48a')),2.2);}
 // Body: upright birds stand, others lie along x.
 const body=k.upright?path(c,`M0 ${-H*.62} Q${L*.85} ${-H*.6} ${L*.75} ${H*.1} Q${L*.6} ${H*.6} 0 ${H*.6} Q${-L*.7} ${H*.6} ${-L*.75} ${H*.05} Q${-L*.85} ${-H*.6} 0 ${-H*.62}Z`,grad(c,P,a,b,-H*.6,H*.6))
  :path(c,`M${-L} ${-H*.1} Q${-L*.6} ${-H*.7} ${L*.2} ${-H*.62} Q${L*.85} ${-H*.6} ${L*.95} ${-H*.15} Q${L*.8} ${H*.5} ${L*.1} ${H*.55} Q${-L*.6} ${H*.5} ${-L} ${-H*.1}Z`,grad(c,P,a,b,-H*.6,H*.5));
 c.save();c.clip(body);
 if(k.bib)ellipse(c,L*.2,H*.12,L*.48,H*.5,P(k.bib));
 if(k.belly)ellipse(c,L*.15,H*.48,L*.75,H*.42,P(k.belly));
 if(!low){// feather scallops in rows
  for(let row=0;row<9;row++)for(let col=0;col<10;col++){const x=-L*.9+col*L*.2+(row%2)*L*.1,y=-H*.6+row*H*.14;path(c,`M${x-4} ${y} q4 5 8 0`,null,P(a,.2,.35),.8);}
  skin(c,body,P,a,r.seed,30);}
 c.restore();
 // Near wing / flipper with layered primaries.
 if(k.flipper)path(c,`M${-L*.45} ${-H*.3} Q${-L*.85} ${H*.05} ${-L*.75} ${H*.38} Q${-L*.55} ${H*.12} ${-L*.3} ${-H*.22}Z`,P(a,-.1),P(a,-.45),1);
 else{const wing=path(c,`M${L*.45} ${-H*.35} Q${-L*.2} ${-H*.55} ${-L*.95} ${-H*.05+f*3} Q${-L*.3} ${H*.25} ${L*.4} ${H*.05}Z`,grad(c,P,a,a,-H*.5,H*.2),P(a,-.45),.8);
  if(!low){c.save();c.clip(wing);for(let i=0;i<8;i++)path(c,`M${L*.35-i*L*.16} ${-H*.3} Q${L*.2-i*L*.16} ${-H*.05} ${L*.1-i*L*.17} ${H*.15}`,null,P(a,-.3,.6),1.2);c.restore();}
  if(k.wingtip)path(c,`M${-L*.55} ${-H*.15} L${-L*.98} ${-H*.05+f*3} L${-L*.6} ${H*.1}Z`,P(k.wingtip));
  if(k.wingbar){c.save();c.clip(wing);path(c,`M${L*.3} ${-H*.38} Q${-L*.1} ${-H*.3} ${-L*.5} ${-H*.2} L${-L*.45} ${-H*.08} Q${-L*.05} ${-H*.16} ${L*.32} ${-H*.22}Z`,P(k.wingbar,0,.95));c.restore();}}
 // Head.
 const hx=k.upright?L*.05:L*.85,hy=k.upright?-H*.72:-H*.55,hr=k.upright?L*.55:H*.42;
 const head=path(c,`M${hx-hr} ${hy} A${hr} ${hr*.95} 0 1 1 ${hx+hr} ${hy} A${hr} ${hr*.95} 0 1 1 ${hx-hr} ${hy}Z`,grad(c,P,k.cap||a,b,hy-hr,hy+hr));
 if(k.disc){path(c,`M${hx} ${hy-hr*.85} Q${hx+hr*1.05} ${hy-hr*.6} ${hx+hr*.7} ${hy+hr*.4} Q${hx} ${hy+hr*.95} ${hx-hr*.7} ${hy+hr*.4} Q${hx-hr*1.05} ${hy-hr*.6} ${hx} ${hy-hr*.85}Z`,P('#f7efe3'),P('#c9a37a'),1.5);}
 if(k.crest===true)path(c,`M${hx-hr*.95} ${hy-hr*.35} Q${hx-hr*.3} ${hy-hr*1.85} ${hx+hr*.75} ${hy-hr*.7} Q${hx+hr*.1} ${hy-hr*1.05} ${hx-hr*.95} ${hy-hr*.35}Z`,P(k.cap||a,.06),P(a,-.4,.7),.6);
 if(k.crest==='tall')for(let i=0;i<4;i++)path(c,`M${hx-hr*.1+i*2} ${hy-hr*.8} Q${hx-hr*.5+i*2} ${hy-hr*2.2} ${hx-hr*1.1+i*3} ${hy-hr*2.6+i*2}`,null,P(k.cap||a,i*.05),2.4-i*.3);
 if(k.mask)ellipse(c,hx,hy-hr*.2,hr*.9,hr*.55,P(k.mask,0,.85));
 if(k.cheek)ellipse(c,hx+hr*.35,hy+hr*.1,hr*.5,hr*.42,P(k.cheek));
 if(k.comb){for(let i=0;i<4;i++)ellipse(c,hx-hr*.4+i*hr*.32,hy-hr*.95,hr*.22,hr*.3,P('#d8322e'));ellipse(c,hx+hr*.85,hy+hr*.55,hr*.18,hr*.3,P('#d8322e'));}
 if(k.bib&&k.upright)ellipse(c,hx+hr*.3,hy+hr*.25,hr*.45,hr*.35,P('#f2c94c',0,.8));
 const bx=hx+hr*.9,by=hy+hr*.05;
 if(k.beak==='short')path(c,`M${bx-2} ${by-4} L${bx+hr*.6} ${by+1} L${bx-2} ${by+5}Z`,P(k.beakCol));
 if(k.beak==='hook')path(c,`M${bx-3} ${by-6} Q${bx+hr*.8} ${by-7} ${bx+hr*.6} ${by+7} Q${bx+hr*.3} ${by+2} ${bx-2} ${by+5}Z`,P(k.beakCol),P('#5b5242'),.8);
 if(k.beak==='thin')path(c,`M${bx-2} ${by-2} L${bx+hr*.55} ${by+1} L${bx-2} ${by+3}Z`,P(k.beakCol));
 if(k.beak==='dagger')path(c,`M${bx-3} ${by-4} L${bx+hr*1.4} ${by+1} L${bx-3} ${by+5}Z`,P(k.beakCol),P('#5c6b75'),.8);
 if(k.beak==='tiny')path(c,`M${hx+hr*.1} ${hy+hr*.1} l3 7 l3 -7Z`,P(k.beakCol));
 if(k.disc){for(const dx of [-hr*.32,hr*.32])eye(c,hx+dx,hy-hr*.1,P,2.6);}else eye(c,hx+hr*.35,hy-hr*.2,P,k.upright?2.6:2.3);
 if(!low)skin(c,head,P,k.cap||a,r.seed+2,20);
 if(!k.water)helmet(c,hx,hy,hr*2.1+(k.beak==='hook'?6:0),P);
}

// ---- 2026-11-08: sea batch ----
// Hind flippers trailing behind a seal or sea lion: a fan of webbed toes, the outer toes longest. dy: where on the body, o: how far
// the pair is spread, x0: where they leave the body.
function hindFlipper(c,P,a,low,x0,dy,o,sw,fill){const d=`M${x0} ${dy} Q${x0-12} ${dy-3} ${x0-20} ${dy-4+o*.2} Q${x0-32} ${dy-13+o+sw} ${x0-46} ${dy-15+o+sw} Q${x0-40} ${dy-6+o*.6+sw} ${x0-37} ${dy+1+sw} Q${x0-40} ${dy+7-o*.4+sw} ${x0-46} ${dy+15-o+sw} Q${x0-32} ${dy+14-o+sw} ${x0-20} ${dy+5} Q${x0-10} ${dy+7} ${x0} ${dy+8}Z`;
 path(c,d,fill,P(a,-.45,.6),.6);if(!low)for(const y of [-11,-5,1,7,12])line(c,[[x0-22,dy+.5],[x0-42+Math.abs(y)*.4,dy+y+(y<0?o:-o)*.6+sw]],P(a,-.36,.32),.5);}
// Sea lions and fur seals (eared seals), redrawn 15 Nov 2026 from the old round seal body: long and sleek, with a long neck, a dog-like
// head with a pointed muzzle and small ear flaps, and long wing-like front flippers that they 'fly' with. A fur seal's muzzle is
// shorter and its thick fur shows.
function seaLion(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),spread=Math.sin(p.swim)*3.5,far=farPalette(P),fly=Math.sin(p.swim)*.6,fur=id==='fur_seal';
 hindFlipper(c,P,a,low,-80,-3,spread,sw,far(a,-.05));hindFlipper(c,P,a,low,-80,3,-spread,sw,grad(c,P,a,a,-12,14));
 // The far front flipper, in the body's shadow.
 path(c,`M44 8 Q34 ${28+fly*6} 14 ${42+fly*10} Q8 ${46+fly*10} 8 ${42+fly*10} Q20 ${28+fly*6} 30 10Z`,far(a,-.25));
 const body=path(c,'M-84 0 C-64 -14 -30 -24 10 -27 C34 -29 50 -32 62 -37 C70 -44 82 -48 92 -46 C102 -44 110 -38 116 -32 C120 -29 119 -26 114 -25 C108 -24 102 -22 96 -19 C86 -14 76 -6 66 4 C54 16 36 26 10 26 C-24 26 -60 14 -84 0Z',grad(c,P,a,b,-46,26),P(a,-.45),.7);
 if(!low){skin(c,body,P,a,r.seed,140);if(fur){c.save();c.clip(body);for(let i=0;i<90;i++){const x=-78+(i*37)%180,y=-30+(i*23)%58;line(c,[[x,y],[x-3,y+4]],P(a,.2,.45),.8);}c.restore();}}
 // The near front flipper: long, dark and bare, swept back like a wing.
 const fl=path(c,`M58 8 Q48 ${30+fly*8} 22 ${50+fly*12} Q12 ${56+fly*12} 10 ${50+fly*12} Q24 ${34+fly*8} 40 10Z`,grad(c,P,a,a,6,56));path(c,`M58 8 Q48 ${30+fly*8} 22 ${50+fly*12} Q12 ${56+fly*12} 10 ${50+fly*12}`,null,P(a,-.5,.6),.7);
 if(!low)for(let i=0;i<3;i++)path(c,`M${50-i*8} ${12+i*8} Q${40-i*9} ${30+i*6+fly*8} ${22-i*4} ${48+fly*12}`,null,P(a,-.4,.35),.6);
 // Face: the ear flap behind the eye, a dark nose at the tip of the muzzle, the mouth line and long pale whiskers.
 path(c,'M84 -41 Q77 -47 73 -42 Q77 -40 84 -39Z',P(a,-.3),P(a,-.55),.6);
 ellipse(c,fur?114:117,-31,2.2,1.6,P('#1a1410'));faceLine(c,P,fur?'M114 -26.5 Q108 -24.5 102 -24':'M116.5 -26.5 Q110 -24.5 102 -23.5',P('#1d1610',0,.8),.9);
 if(!low)for(let i=0;i<8;i++)ellipse(c,106+(i%4)*2.4,-28+Math.floor(i/4)*2.2,.45,.4,P('#2b241e',0,.7));
 crisp(c,(c)=>{for(let i=0;i<5;i++)path(c,`M110 ${-28+i*.9} Q120 ${-33+i*4} 128 ${-34+i*5.5}`,null,P('#e4e0d4',0,.8),.6);});
 eye(c,96,-38,P,3.6,{iris:'#2a1d14'});
}
// Leopard seal (Hydrurga leptonyx), redrawn 15 Nov 2026: long and serpentine, with a huge, almost reptile-like head and a wide gape
// that runs back past the eye, no ear flaps, long front flippers, dark grey above and silvery below with dark spots on the throat
// and sides.
function leopardSeal(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),spread=Math.sin(p.swim)*3.5,far=farPalette(P);
 hindFlipper(c,P,a,low,-84,-3,spread,sw,far(a,-.05));hindFlipper(c,P,a,low,-84,3,-spread,sw,grad(c,P,a,a,-12,14));
 path(c,'M42 12 Q36 28 22 38 Q16 41 15 37 Q22 26 30 12Z',far(a,-.15));
 const body=path(c,'M-88 2 C-66 -14 -30 -24 8 -26 C30 -27 48 -25 58 -24 C64 -29 76 -32 90 -31 C102 -30 112 -22 118 -13 C121 -9 119 -4 114 -2 C106 1 98 3 88 6 C74 12 56 20 30 23 C-6 26 -60 16 -88 2Z',grad(c,P,a,b,-30,22),P(a,-.45),.7);
 c.save();c.clip(body);
 // Silvery throat and belly, then dark spots over the sides and throat.
 const lg=c.createLinearGradient(0,-6,0,22);lg.addColorStop(0,P(b,0,0));lg.addColorStop(1,P(b,.12,.85));c.fillStyle=lg;c.fillRect(-90,-6,210,32);
 const n=low?16:44;for(let i=0;i<n;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-80+(u-Math.floor(u))*176,y=-14+(v-Math.floor(v))*34;if(x>96)continue;ellipse(c,x,y,1.6+(i%3)*.9,1.2+(i%2)*.6,P('#22292e',0,.7),i*.6);}
 c.restore();
 if(!low)skin(c,body,P,a,r.seed,140);
 path(c,'M56 12 Q50 30 34 42 Q26 47 24 42 Q32 30 42 12Z',grad(c,P,a,a,10,46),P(a,-.5,.6),.7);
 // The long gape, curving up a little at the back like a smile, the nose at the tip, short whiskers.
 faceLine(c,P,'M118 -7 Q106 -5 94 -7 Q86 -8 81 -13',P('#1a2024',0,.85),1.3);
 ellipse(c,117,-12,2.2,1.5,P('#1a2024'));
 crisp(c,(c)=>{for(let i=0;i<4;i++)path(c,`M110 ${-7+i*.9} Q118 ${-12+i*3.5} 126 ${-13+i*4.5}`,null,P('#d7dedb',0,.75),.55);});
 eye(c,95,-21,P,3.4,{iris:'#2a1d14'});
}
function pinniped(c,r,p,P,low){ // walrus and Weddell seal on the older round seal body; eared seals and the leopard seal have their own
 const id=r.species,a=r.colors.primary,b=r.colors.secondary;
 if(id==='sea_lion'||id==='fur_seal'){seaLion(c,r,p,P,low);return;}
 if(id==='leopard_seal'){leopardSeal(c,r,p,P,low);return;}
 pinnipedBody(c,r,p,P,low);
 // Weddell seal (2026-11-13): dark grey with silver-white blotches over the sides and belly, and a small, smiling face.
 if(id==='weddell_seal'&&!low){for(let i=0;i<30;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-70+(u-Math.floor(u))*140,y=-24+(v-Math.floor(v))*56;if(((x+2)/74)**2+((y+2)/36)**2>1)continue;ellipse(c,x,y,4+(i%3)*1.4,2.6+(i%2)*1.2,P('#d8dcdc',0,.5),i*.7);}path(c,'M86 6 q4 3 8 0',null,P('#1a2024'),1);}
 if(id==='walrus'){ellipse(c,84,4,18,12,P(b,-.1));crisp(c,(c)=>{for(let i=0;i<10;i++)line(c,[[78+i*2,6],[80+i*2.4,14]],P('#e8dcc2'),.8);});for(const dx of [80,90])path(c,`M${dx} 12 Q${dx+2} 40 ${dx-4} 56`,null,P('#f2ead6'),4.2);if(!low)for(let i=0;i<12;i++)path(c,`M${-60+i*10} -30 q-3 20 2 50`,null,P(a,-.3,.4),1.4);}
}
// West Indian manatee (Trichechus manatus): a slow, round sea cow. No neck to speak of, a wrinkled grey-brown hide often
// with a film of algae, a big round paddle of a tail (a dugong's is forked), flippers with three or four nails, and a
// broad bristly muzzle with a split upper lip and the nostrils on top, for breathing at the surface.
function sirenian(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),K='#2a2f2c';
 path(c,`M-84 -9 Q-104 ${-24+sw} -126 ${-24+sw} Q-150 ${-20+sw} -152 ${sw} Q-150 ${20+sw} -126 ${24+sw} Q-104 ${24+sw} -84 9Z`,finFill(c,P,a,-86,0,-150,0),P(a,-.45),.7);
 path(c,'M44 16 Q46 34 38 46 Q34 50 30 46 Q30 32 34 18Z',P(a,-.42,.9));
 const body=path(c,'M-92 -7 Q-70 -38 -10 -42 Q50 -44 78 -28 Q94 -20 100 -10 Q110 -8 113 3 Q115 16 107 23 Q98 29 88 25 Q68 38 20 40 Q-50 40 -92 9Z',grad(c,P,a,b,-42,40),P(a,-.45),.8);
 if(!low){skin(c,body,P,a,r.seed,150);c.save();c.clip(body);
  ellipse(c,-6,-38,74,6,P('#ffffff',0,.14));
  const R=(i,k)=>{const u=Math.sin((i+(r.seed||1)*.37)*k)*43758.5453;return u-Math.floor(u);};
  for(let i=0;i<5;i++)ellipse(c,-70+R(i,12.99)*140,-30+R(i,78.2)*22,10+R(i,4.1)*14,4+R(i,9.3)*5,P('#6f8a5a',0,.16));
  for(const x of [58,66,74])path(c,`M${x} -32 Q${x-6} -4 ${x-1} 28`,null,P(a,-.35,.4),.9);
  for(let i=0;i<6;i++)path(c,`M${-60+i*22} 30 Q${-54+i*22} 34 ${-48+i*22} 31`,null,P(a,-.3,.3),.8);
  const under=c.createLinearGradient(0,18,0,40);under.addColorStop(0,P('#04202e',0,0));under.addColorStop(1,P('#04202e',0,.2));c.fillStyle=under;c.fillRect(-100,18,220,24);
  c.restore();}
 const mz=c.createRadialGradient(102,6,2,105,11,13);mz.addColorStop(0,P(b,.12));mz.addColorStop(1,P(b,-.12));oval(c,105,11,11,12.5,mz,P(a,-.35,.6),.6);
 if(!low)crisp(c,(c)=>{for(let i=0;i<22;i++){const u=(i*.618)%1,v=(i*.382+.13)%1,an=u*6.283,rr=Math.sqrt(v)*8.5,x=106+Math.cos(an)*rr,y=13+Math.sin(an)*rr*1.05;line(c,[[x,y],[x+1.4,y+1.1]],P('#d8d2c4',0,.85),.45);ellipse(c,x,y,.45,.4,P(K,0,.7));}});
 faceLine(c,P,'M113 12 Q110 18 104 21',P(K,0,.7));faceLine(c,P,'M112 19 Q106 24 96 22',P(K,0,.55));
 faceLine(c,P,'M106 -5 q2 -1.6 4 0 M100 -6 q2 -1.6 4 0',P(K,0,.7));
 path(c,'M48 14 Q50 38 40 50 Q34 55 28 51 Q30 34 36 16Z',finFill(c,P,a,44,16,32,50),P(a,-.45),.7);
 if(!low)for(const [x,y] of [[33,50],[37,49],[41,46]])ellipse(c,x,y,1.5,1,P('#dcd2c2'));
 eye(c,84,-9,P,1.4,{iris:'#2b2119'});
}
function oarfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 const wv=waveBody(p,x=>Math.sin(p.swim-(x+190)/12*.147)*10);
 let top=[],bot=[],fin=[];for(let i=0;i<=30;i++){const x=-190+i*12,y=wv(x),w=2+13*Math.pow(Math.sin((i/30)*Math.PI*.82+.2),.8);top.push([x,y-w]);bot.unshift([x,y+w]);fin.push([x-2,y-w-9-3*Math.sin(i*.8)]);}
 path(c,'M'+top.map(q=>q.join(' ')).join(' L')+' L'+[...fin].reverse().map(q=>q.join(' ')).join(' L')+'Z',P('#d8322e',0,.85),P('#a51f1c',0,.7),.5);
 if(!low)for(let i=1;i<30;i++)line(c,[top[i],fin[i]],P('#f07a6a',0,.65),.5);
 const [hx,hy]=top[29];
 for(let i=0;i<7;i++){const q=Math.sin(p.swim*.9+i)*3;path(c,`M${152+i*2.2} ${hy-1} Q${146-i*3} ${hy-28-i*5+q} ${120-i*9} ${hy-44-i*5+q}`,null,P('#d8322e',i%2?.08:-.06),2.4-i*.12);if(i%2===0)ellipse(c,120-i*9,hy-44-i*5+q,2.6,1.7,P('#e8604e'));}
 const body=path(c,'M'+top.map(q=>q.join(' ')).join(' L')+' Q184 -4 176 8 L'+bot.map(q=>q.join(' ')).join(' L')+'Z',grad(c,P,a,b,-16,16),P(a,-.4),.6);
 if(!low){c.save();c.clip(body);for(let i=0;i<24;i++){const x=-170+i*14;path(c,`M${x} -16 q6 8 -2 16 q-6 8 2 16`,null,P('#4a5a6a',0,.45),1.3);}for(let i=0;i<30;i++)ellipse(c,-180+i*12,-9,1.8,.9,P('#ffffff',0,.5));c.restore();}
 path(c,'M112 13 Q120 44 92 60 Q104 42 102 15Z',P('#d8322e',0,.82));
 faceLine(c,P,`M176 6 Q168 11 158 8`,P('#2a3038',0,.72));
 path(c,`M150 -12 q-5 12 0 24`,null,P(a,-.4,.7),1);
 eye(c,165,-3,P,2.4,{iris:'#c9a23c'});
}
function crustacean(c,r,p,P,low){ // lobster, mantis shrimp
 if(r.species==='lobster'){lobster(c,r,p,P,low);return;}
 if(r.species==='mantis_shrimp'){mantisShrimp(c,r,p,P,low);return;}
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,4),mantis=id==='mantis_shrimp';
 for(let i=0;i<5;i++){const x=-30+i*14;path(c,`M${x} 10 q2 16 ${-4+i} ${26+Math.sin(p.swim+i)*3}`,null,P(a,-.2),3);}
 path(c,`M-96 ${sw} L-126 ${-18+sw} L-122 ${sw} L-128 ${18+sw}Z`,P(mantis?'#3fa7d6':a,0,.95));
 const body=path(c,'M-100 0 Q-96 -24 -40 -26 Q30 -30 62 -16 L70 4 Q30 20 -40 18 Q-90 18 -100 0Z',grad(c,P,a,b));
 c.save();c.clip(body);for(let i=0;i<8;i++)path(c,`M${-88+i*18} -30 q-6 26 0 52`,null,P(a,-.35,.7),1.6);
 if(mantis){for(let i=0;i<8;i++)ellipse(c,-80+i*18,-8,6,4,P(i%2?'#e85c3a':'#46c27a',0,.8));}c.restore();
 if(!low)skin(c,body,P,a,r.seed,60);
 if(mantis){path(c,'M62 0 Q86 -6 96 6 L84 14 Z',P('#e85c3a'));path(c,'M70 6 Q92 24 86 34',null,P('#e85c3a'),5);for(const dy of [-12,-2]){path(c,`M58 ${dy} L74 ${dy}`,null,P(a,-.2),3);ellipse(c,74,dy,5,4,P('#4cc3c9'));ellipse(c,74,dy,2*eyeScale(),2*eyeScale(),P(dy===-12?ownEye(c,74,dy,2,'#1c2a33'):lookIris()||'#1c2a33'));}}
 else{for(const s2 of [-1,1]){path(c,`M58 ${s2*6} Q78 ${s2*28} 100 ${s2*30}`,null,P(a),9);const cl=path(c,`M96 ${s2*20} Q122 ${s2*10} 150 ${s2*22} Q142 ${s2*30} 124 ${s2*30} L150 ${s2*36} Q130 ${s2*52} 100 ${s2*42}Z`,grad(c,P,a,b,s2*10,s2*50),P(a,-.45),1);if(!low)skin(c,cl,P,a,r.seed+s2,30);for(let i=0;i<5;i++)path(c,`M${126+i*4} ${s2*31} l1 ${s2*-3}`,null,P('#e8dcc2'),1);}
  for(const k of [0,1])path(c,`M66 ${-6+k*4} Q140 ${-40+k*10+sw} 190 ${-20+k*18+sw}`,null,P(a,.15),1.2);eye(c,64,-12,P,2.2);}
}
function isopod(c,r,p,P,low){ // giant isopod, trilobite
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,tri=id==='trilobite';
 for(let i=0;i<7;i++){const x=-50+i*16;path(c,`M${x} 12 q-3 10 ${2+Math.sin(p.swim+i)*3} 16`,null,P(a,-.25),2.4);}
 const body=path(c,tri?'M-70 0 Q-66 -34 0 -36 Q62 -34 74 -4 Q60 30 0 32 Q-66 30 -70 0Z':'M-74 2 Q-72 -30 0 -34 Q66 -30 74 0 Q66 26 0 28 Q-70 28 -74 2Z',grad(c,P,a,b));
 c.save();c.clip(body);for(let i=0;i<10;i++)path(c,`M${-70+i*15} -40 q-6 36 0 72`,null,P(a,-.4,.8),2);if(tri){path(c,'M-70 -10 L74 -10 M-70 10 L74 10',null,P(a,-.3,.8),2);}c.restore();
 if(!low)skin(c,body,P,a,r.seed,70);
 if(tri){path(c,'M40 -30 Q80 -34 82 -2 Q80 30 40 30',P(a,.05),P(a,-.4),1);for(const dy of [-14,14])ellipse(c,62,dy,5*eyeScale(),4*eyeScale(),P(ownEye(c,62,dy,2.6,'#2b3238')));}
 else{for(const dy of [-12,12]){ellipse(c,66,dy,6*eyeScale(),5*eyeScale(),P(ownEye(c,66,dy,3,'#2a2f33')));ellipse(c,67,dy-1,2,1.5,P('#cfd8d8',0,.8));}path(c,'M72 -4 Q100 -24 118 -18 M72 4 Q100 24 118 18',null,P(a,.1),2);path(c,'M-74 -6 L-94 -12 M-74 6 L-94 12',null,P(a,-.1),3);}
}
function seaPig(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 for(let i=0;i<6;i++){const x=-44+i*16;path(c,`M${x} 16 q2 10 ${-2+Math.sin(p.swim+i)*3} 18`,null,P(a,.05),5);}
 const body=path(c,'M-64 6 Q-60 -28 0 -28 Q56 -28 64 2 Q56 24 0 24 Q-60 26 -64 6Z',grad(c,P,a,b));
 c.save();c.clip(body);ellipse(c,0,-14,60,10,P('#ffffff',0,.22));c.restore();
 for(let i=0;i<4;i++){const x=-20+i*16;path(c,`M${x} -24 Q${x-4} ${-46-i*2} ${x+6} ${-52-i*2}`,null,P(a,.05),4);}
 for(let i=0;i<5;i++)path(c,`M58 ${-8+i*4} q12 ${-4+i*2} 18 ${-6+i*3}`,null,P(a,.1),2.4);if(!low)skin(c,body,P,a,r.seed,60);
}
function siphonophore(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 const wv=waveBody(p,x=>Math.sin(p.swim*.6+(150-x)/13*.35)*16);
 const pts=[];for(let i=0;i<=24;i++)pts.push([150-i*13,wv(150-i*13)]);
 line(c,pts,P(b,0,.7),1.5);
 pts.forEach(([x,y],i)=>{if(i%2)return;const [gx,gy]=atBody(x,y),g=c.createRadialGradient(gx,gy,0,gx,gy,9);g.addColorStop(0,P(b,.3,.9));g.addColorStop(1,P(a,0,.15));ellipse(c,x,y,9,7,g);for(let t=0;t<4;t++)path(c,`M${x} ${y+5} q${-3+t*2} 14 ${-1+t} ${22+t*4}`,null,P(a,.2,.5),.7);});
 const g=c.createRadialGradient(158,-6,0,158,-6,14);g.addColorStop(0,P('#ffffff',0,.8));g.addColorStop(1,P(a,0,.2));ellipse(c,158,-6,14,11,g);
}
function loosejaw(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6);
 path(c,`M-80 ${sw} L-104 ${-14+sw} L-98 ${sw} L-104 ${14+sw}Z`,P(a,.05));path(c,'M-60 -10 L-70 -26 L-52 -12Z',P(a));
 const body=path(c,'M-84 0 Q-60 -18 10 -16 Q40 -14 52 -4 L54 6 Q30 14 10 16 Q-60 18 -84 0Z',grad(c,P,a,b));
 path(c,'M50 6 L96 20 L56 12Z',P(a,-.1));teeth(c,P,{x0:57,y0:10.2,x1:93,y1:17.6,upper:false},{type:'needle',size:3,color:'#e8e2d0',gum:false});
 for(let i=0;i<10;i++)ellipse(c,-70+i*12,8,1.6,1.6,P('#7fd6ff',0,.9));
 crisp(c,(c)=>{const glow=c.createRadialGradient(42,4,0,42,4,14);glow.addColorStop(0,P('#ff3b30',0,.95));glow.addColorStop(1,P('#ff3b30',0,0));ellipse(c,42,4,14,14,glow);});
 const g2=c.createRadialGradient(46,-6,0,46,-6,10);g2.addColorStop(0,P('#7fd6ff',0,.9));g2.addColorStop(1,P('#7fd6ff',0,0));ellipse(c,46,-6,10,10,g2);
 if(!low)skin(c,body,P,a,r.seed,40);eye(c,46,-8,P,2.4);
}
// Mata mata (Chelus fimbriata), redrawn 2026-11-10: a South American river turtle that looks like a dead leaf. A rough ridged shell, a long thick neck fringed with skin flaps, a flat triangular head, and a thin snorkel of a nose.
function mataMata(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#231c12',w=Math.sin(p.swim*.7)*2;
 for(const x of [-34,30]){const k=Math.sin(p.swim+x)*5;path(c,`M${x} 14 q4 14 ${10+k} 20`,null,P(a,-.1),9);for(let i=0;i<3;i++)line(c,[[x+10+k,33],[x+15+k+i*2.5,38+i]],P(a,-.3),1.6);}
 const neck=path(c,`M46 -12 Q76 ${-14+w} 102 ${-10+w} L104 ${6+w} Q76 ${12+w} 46 12Z`,grad(c,P,a,b,-14,12),P(a,-.45),.6);
 for(let i=0;i<7;i++){const x=54+i*8;path(c,`M${x-3} ${-12+w*.6} L${x-4} ${-22+w*.6-(i%2)*3} L${x+3} ${-12+w*.6}Z M${x-3} ${10+w*.6} L${x-5} ${20+w*.6+(i%2)*4} L${x+3} ${10+w*.6}Z`,P(a,-.08),P(a,-.4),.4);}
 const head=path(c,`M96 ${-11+w} L120 ${-22+w} Q130 ${-14+w} 128 ${-7+w} L146 ${-8+w} L150 ${-4+w} L146 ${-1+w} L128 ${2+w} Q130 ${10+w} 120 ${15+w} L96 ${9+w}Z`,grad(c,P,a,b,-22+w,15+w),P(a,-.45),.7);
 if(!low)skin(c,head,P,a,r.seed+3,20);
 for(const [x,y] of [[112,-12],[118,6],[106,4]])path(c,`M${x} ${y+w} l-6 -5 l1 7Z`,P(a,-.12));
 faceLine(c,P,`M128 ${2+w} Q116 ${5+w} 102 ${2+w}`,P(K,0,.7));
 eye(c,119,-8+w,P,1.5,{iris:'#c9a23c'});
 const shell=path(c,'M-60 12 Q-62 -28 0 -32 Q58 -28 58 12Z',grad(c,P,a,b,-32,12),P(a,-.45),1.2);
 if(!low)for(let row=0;row<2;row++)for(let i=0;i<4;i++){const x=-42+i*28,y=-20+row*16;path(c,`M${x-11} ${y+7} L${x} ${y-9} L${x+11} ${y+7}`,null,P(a,-.35),1.8);ellipse(c,x,y,3,2,P(b,-.1));}
 if(!low)skin(c,shell,P,a,r.seed,90);
}
function snail(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 const foot=path(c,'M-70 14 Q-60 2 20 4 Q60 4 72 -6 Q86 -2 84 12 Q60 22 -70 20Z',grad(c,P,b,b,0,20));if(!low)skin(c,foot,P,b,r.seed,40);
 for(const dx of [72,80]){path(c,`M${dx} -4 Q${dx+6} -22 ${dx+4} -30`,null,P(b,-.05),3);ellipse(c,dx+4,-31,3*eyeScale(),3*eyeScale(),P(ownEye(c,dx+4,-31,2.2,'#2a2a2a')));}
 const g=c.createRadialGradient(-6,-24,4,-6,-20,44);g.addColorStop(0,P(a,.25));g.addColorStop(1,P(a,-.25));ellipse(c,-6,-18,40,34,g);
 c.strokeStyle=P(a,-.45);c.lineWidth=3;c.beginPath();for(let t=0;t<14;t+=.08){const rr=2.2*Math.exp(t*.24);c.lineTo(-6+Math.cos(t)*rr,-18+Math.sin(t)*rr*.85);}c.stroke();
}
function anemone(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 const col=path(c,'M-34 40 Q-38 0 -26 -12 L26 -12 Q38 0 34 40Z',grad(c,P,b,b,-12,40));if(!low)skin(c,col,P,b,r.seed,40);
 for(let i=0;i<26;i++){const u=i/25,x=-28+u*56,ang=-Math.PI/2+(u-.5)*2.4,len=40+(i%4)*8,s2=Math.sin(p.swim*.8+i)*.25;path(c,`M${x} -12 Q${x+Math.cos(ang+s2)*len*.5} ${-12+Math.sin(ang+s2)*len*.5} ${x+Math.cos(ang+s2*1.6)*len} ${-12+Math.sin(ang+s2*1.6)*len}`,null,P(a,i%2?.15:-.05),4);ellipse(c,x+Math.cos(ang+s2*1.6)*len,-12+Math.sin(ang+s2*1.6)*len,2.6,2.6,P(a,.35));}
 ellipse(c,0,-12,24,6,P(b,-.25));
}
function sponge(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 for(const [x,h,w] of [[-28,70,18],[0,96,22],[30,60,16]]){const t=path(c,`M${x-w} 40 Q${x-w-4} ${40-h*.6} ${x-w*.7} ${40-h} L${x+w*.7} ${40-h} Q${x+w+4} ${40-h*.6} ${x+w} 40Z`,grad(c,P,a,b,40-h,40));ellipse(c,x,40-h,w*.7,5,P(a,-.4));if(!low){skin(c,t,P,a,r.seed+x,60);for(let i=0;i<10;i++)ellipse(c,x-w*.5+(i*7)%(w),40-h*.1-(i*13)%(h*.8),1.8,1.4,P(a,-.35));}}
}
function tardigrade(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 for(let i=0;i<4;i++){const x=-48+i*30,k=Math.sin(p.swim+i)*5;path(c,`M${x} 14 q-2 14 ${2+k} 22`,null,P(a),10);for(let t=0;t<3;t++)path(c,`M${x+k} 36 l${-3+t*3} 5`,null,P('#3b3b3b'),1.2);}
 const body=path(c,'M-70 4 Q-68 -30 -10 -32 Q50 -32 66 -6 Q70 20 40 22 Q-30 30 -70 4Z',grad(c,P,a,b));
 c.save();c.clip(body);for(let i=0;i<6;i++)path(c,`M${-58+i*22} -36 q-6 32 0 64`,null,P(a,-.25,.6),2.5);c.restore();
 if(!low)skin(c,body,P,a,r.seed,70);ellipse(c,66,0,9,8,P(a,.1));ellipse(c,70,0,3,3,P('#5a4a4a'));for(const dy of [-8])ellipse(c,58,dy,1.8*eyeScale(),1.8*eyeScale(),P(ownEye(c,58,dy,1.8,'#1d1d1d')));
}
// Dumbo octopus (Grimpoteuthis), redrawn 15 Nov 2026: a soft rounded dome with two ear-like fins that flap, and eight arms joined by a
// web into an umbrella skirt with a scalloped edge, the arm tips just showing past it. Not a box with strands.
function dumbo(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*14,o=Math.sin(p.swim)*5;
 // The web: an umbrella from the dome's base, opening and closing as it swims, scalloped between the arms.
 const tips=Array.from({length:8},(_,i)=>{const u=(i-3.5)/3.5,x=u*(52+o),y=40+Math.cos(u*1.4)*10-Math.abs(u)*6;return[x,y];});
 let d=`M-28 4 Q${-44-o} 20 ${tips[0][0]} ${tips[0][1]}`;for(let i=1;i<8;i++){const [x0,y0]=tips[i-1],[x1,y1]=tips[i];d+=` Q${(x0+x1)/2} ${(y0+y1)/2-9} ${x1} ${y1}`;}d+=` Q${44+o} 20 28 4Z`;
 const web=path(c,d,grad(c,P,a,b,0,52),P(a,-.3,.7),.8);
 if(!low){c.save();c.clip(web);for(const [x,y] of tips)path(c,`M${x*.25} 6 Q${x*.7} ${y*.6} ${x} ${y}`,null,P(a,-.22,.5),2.6);c.restore();}
 for(const [x,y] of tips)path(c,`M${x} ${y-2} q${x*.04} 7 ${x*.1+1} 8`,null,P(a,-.05,.9),2.4);
 // The ear fins, then the dome.
 for(const s2 of [-1,1])path(c,`M${s2*22} ${-24} Q${s2*48} ${-46+f*.35} ${s2*54} ${-24+f*.2} Q${s2*48} ${-10} ${s2*28} ${-12}Z`,P(a,.08,.95),P(a,-.35),1);
 const body=path(c,'M-30 8 Q-36 -28 -14 -42 Q0 -49 14 -42 Q36 -28 30 8 Q0 14 -30 8Z',grad(c,P,a,b,-48,12));
 if(!low){skin(c,body,P,a,r.seed,40);ellipse(c,-6,-34,9,4,P('#ffffff',0,.2),-.3);}
 eye(c,-12,-8,P,3.6);eye(c,12,-8,P,3.6);
}
function blueRinged(c,r,p,P,low){
 commonOctopus(c,r,p,P,low);
 if(low)return;
 const ring=(x,y,s2)=>{ellipse(c,x,y,1.4*s2,1.2*s2,P('#111a22',0,.9));if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}c.strokeStyle=P('#1f7bff',0,.95);c.lineWidth=2*s2;c.beginPath();c.ellipse(x,y,4*s2,3.4*s2,0,0,TAU);c.stroke();};
 {const d='M-15 -19 C-42 -57 -104 -37 -100 -7 Q-99 24 -58 28 Q-25 30 -12 14Z';c.save();c.clip(flex.map?flexedPath(d):new Path2D(d));}
 for(let i=0;i<16;i++)ring(-92+((i*37)%100)/100*78,-34+((i*53)%100)/100*58,1.1);c.restore();
 for(let i=0;i<8;i++){const ex=63+(i%4)*15,ey=(i-3.5)*17*armFan(p)+armTrail(p,i);for(let j=1;j<4;j++){const t=j/4;ring(ex*t,(i-3.5)*3*(1-t)+ey*t,.75);}}
}
// Leafy seadragon (Phycodurus eques), redrawn 15 Nov 2026: unlike a seahorse it cannot curl its tail. A long slender body held nearly
// level in a gentle S, a long tube snout, bony rings, a straight tapering tail, and leaf-like flaps all along the head, back, belly
// and tail that it drifts with like seaweed. It had been a seahorse with leaves on.
function leafySeadragon(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim);
 const N=20,S=spineOf(Array.from({length:N+1},(_,j)=>{const t=j/N,x=-112+t*150,y=24-t*34+Math.sin(t*Math.PI*1.4-.6)*10+sw*3*(1-t),w=.8+10.5*Math.pow(Math.sin(Math.PI*Math.min(1,t*.85)),.9);return[x,y,w];})),e=S.pt[N];
 const leaf=(x,y,ang,len)=>rigidAt(c,x,y,()=>{c.rotate(ang+Math.sin(p.swim+x*.05)*.14);path(c,`M0 0 Q${len*.25} ${-len*.3} ${len*.55} ${-len*.12} Q${len*.75} ${-len*.32} ${len} 0 Q${len*.7} ${len*.22} ${len*.5} ${len*.08} Q${len*.25} ${len*.3} 0 0Z`,P(b,.05,.9),P(a,-.35),.8);if(!low)path(c,`M0 0 L${len*.9} 0`,null,P(a,-.3,.7),.6);});
 // Flaps on the far side first, then the body, then the near flaps.
 for(const [k,u,ang,len] of [[3,-1,-2.2,22],[7,-1,-2.0,28],[12,-1,-1.9,30],[5,1,2.3,22],[10,1,2.1,26]]){const [x,y]=S.at(k,u);leaf(x,y,ang,len);}
 const body=path(c,S.outline(),grad(c,P,a,b,-30,34),P(a,-.35),.8);
 if(!low){c.save();c.clip(body);for(let k=2;k<N;k++)line(c,[S.at(k,-1.1),S.at(k,1.1)],P(a,-.28,.55),.6);for(let k=3;k<N;k+=2){const [x,y]=S.at(k,-.3);ellipse(c,x,y,1.4,1,P('#f2e8c8',0,.75));}c.restore();}
 // A small see-through back fin.
 {const [x,y]=S.at(9,-1);path(c,`M${x-8} ${y+2} Q${x-2} ${y-12+sw*2} ${x+8} ${y+1}Z`,P(b,.2,.45));}
 for(const [k,u,ang,len] of [[2,1,2.6,20],[6,1,2.2,30],[9,-1,-1.6,24],[13,1,1.8,26],[15,-1,-1.4,22],[17,1,1.4,18]]){const [x,y]=S.at(k,u);leaf(x,y,ang,len);}
 // The head: a tube snout pointing forward and a little down, flaps on the head and throat.
 rigidAt(c,e.x,e.y,()=>{c.rotate(.18);
  const hd=path(c,'M-6 -9 Q6 -14 14 -8 Q24 -5 40 -2 Q44 0 42 3 Q30 4 16 6 Q6 10 -6 9Z',grad(c,P,a,b,-14,10),P(a,-.35),.8);
  if(!low){c.save();c.clip(hd);path(c,'M14 -4 L40 -1',null,P(a,-.2,.4),.7);c.restore();}
  leaf(2,-10,-2.0,16);leaf(10,6,1.9,14);
  eye(c,6,-3,P,2.4);
 });
}

// ---- 2026-11-08: prehistoric, mythical and insects ----
function plesio(c,r,p,P,low){ // plesiosaur, nothosaurus, Loch Ness monster
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),noth=id==='nothosaurus',nessie=id==='loch_ness_monster',elas=id==='elasmosaurus';
 const neckLen=noth?70:elas?150:110;
 // 15 Nov 2026: four long wing-like flippers (the far pair in shadow behind the body, the near pair in front), as plesiosaurs swam,
 // a teardrop body deepest at the shoulders and a short tapering tail, instead of a round body with two small flippers.
 const flip=(x,y,L,ph,fill)=>{const f=Math.sin(p.swim+ph)*L*.2;path(c,`M${x+10} ${y-2} Q${x+6} ${y+L*.35+f*.5} ${x-L*.55} ${y+L*.72+f} Q${x-L*.78} ${y+L*.8+f} ${x-L*.66} ${y+L*.6+f} Q${x-L*.32} ${y+L*.24} ${x-14} ${y}Z`,fill,P(a,-.45),.8);};
 path(c,`M-78 -4 Q-110 ${2+sw} -142 ${10+sw} Q-110 ${14+sw} -76 14Z`,grad(c,P,a,b,-6,16),P(a,-.45),.7);
 flip(40,6,58,1.4,P(a,-.3));flip(-30,6,50,0,P(a,-.3));
 const body=path(c,'M-84 6 Q-72 -26 -8 -31 Q48 -33 70 -10 Q74 8 60 17 Q20 29 -30 25 Q-70 21 -84 6Z',grad(c,P,a,b));
 const nx=60,ny=-16,hx=nx+neckLen*.8,hy=ny-neckLen*(nessie?.95:.55)+sw;
 const G=grad(c,P,a,b,hy-16,ny+16),neck=path(c,`M${nx-6} ${ny-6} Q${nx+neckLen*.3} ${ny-neckLen*.7} ${hx-2} ${hy-6.5} L${hx+6} ${hy+7} Q${nx+neckLen*.45} ${ny-neckLen*.3} ${nx+10} ${ny+14}Z`,G,P(a,-.45),.5);
 const head=path(c,`M${hx-6} ${hy-7} Q${hx+12} ${hy-15} ${hx+30} ${hy-4} Q${hx+34} ${hy+4} ${hx+28} ${hy+6} Q${hx+12} ${hy+10} ${hx+2} ${hy+7}`,G);
 if(!nessie)teeth(c,P,{x0:hx+7,y0:hy+2.9,x1:hx+32,y1:hy+2},{type:'fang',size:2.2,color:'#efe7cb'});faceLine(c,P,`M${hx+6} ${hy+3} L${hx+32} ${hy+2}`,P(a,-.5),1.3);
 if(!low){skin(c,body,P,a,r.seed,140);skin(c,neck,P,a,r.seed+1,40);if(nessie)for(let i=0;i<6;i++){const x=-50+i*20,t=x<0?(x+80)/80:x/70,back=x<0?(1-t)*(1-t)*4+2*(1-t)*t*-32+t*t*-34:(1-t)*(1-t)*-34+2*(1-t)*t*-32+t*t*-8;path(c,`M${x} ${back+3} l6 -13 l6 13`,P(a,-.2));}}
 flip(50,12,66,1.4+Math.PI,grad(c,P,a,a,12,70));flip(-22,12,56,Math.PI,grad(c,P,a,a,12,60));
 eye(c,hx+14,hy-6,P,2.2);
}
function helicoprion(c,r,p,P,low){
 shark(c,r,p,P,low);
 const a=r.colors.primary;const keepFlex=flex.map;flex.map=null;c.save();c.translate(62,14);
 c.strokeStyle=P('#efe6cc');c.lineWidth=2.5;c.beginPath();for(let t=0;t<9;t+=.12){const rr=2+t*1.6;c.lineTo(Math.cos(t+1.2)*rr,Math.sin(t+1.2)*rr*.8);}c.stroke();
 for(let t=1;t<9;t+=.55){const rr=2+t*1.6,x=Math.cos(t+1.2)*rr,y=Math.sin(t+1.2)*rr*.8;path(c,`M${x} ${y} l${Math.cos(t+1.2)*3} ${Math.sin(t+1.2)*3}`,null,P('#fff8e4'),1.6);}
 c.restore();flex.map=keepFlex;
}
function isonade(c,r,p,P,low){ // a mythical Japanese sea monster: shark-bodied, with a barbed tail
 shark(c,r,p,P,low);const sw=swing(p,10);
 for(let i=0;i<6;i++){const x=-120-i*10,t=(-98-x)/78,y=(1-t)*(1-t)*sw*.5+2*(1-t)*t*(-6+sw)+t*t*sw;path(c,`M${x} ${y} l-8 ${i%2?-10:10} l10 2Z`,P('#d9d0b8'));}
 path(c,`M-98 ${sw*.5} Q-145 ${-6+sw} -176 ${sw}`,null,P(r.colors.primary,-.2),5);
}
function sacabambaspis(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6);
 path(c,`M-50 ${sw*.5} L-86 ${-10+sw} L-82 ${sw} L-86 ${10+sw}Z`,P(a,-.1));
 const shield=path(c,'M-52 0 Q-50 -22 10 -24 Q46 -22 54 -6 Q56 10 44 18 Q10 26 -52 8Z',grad(c,P,a,b),P(a,-.45),1);
 if(!low){skin(c,shield,P,a,r.seed,70);for(let i=0;i<6;i++)path(c,`M${-44+i*12} -20 q-3 18 0 36`,null,P(a,-.3,.6),1.2);}
 ellipse(c,50,6,7,6,P('#2a2a2a'));ellipse(c,49,4,3,2,P('#5a2a2a'));
 for(const dy of [-10,-2])eye(c,46,dy,P,2.4);
}
function tully(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6);
 path(c,`M-70 ${sw} L-96 ${-14+sw} L-96 ${14+sw}Z`,P(a,.05,.9));
 const body=path(c,'M-74 0 Q-60 -14 0 -12 Q30 -10 40 -2 L40 4 Q20 12 0 12 Q-60 14 -74 0Z',grad(c,P,a,b,-12,12));
 if(!low){c.save();c.clip(body);for(let i=0;i<9;i++)path(c,`M${-66+i*12} -14 q-3 14 0 28`,null,P(a,-.3,.6),1.2);c.restore();}
 line(c,[[0,-12],[0,-34]],P(a,-.2),2.4);for(const dy of [-34])for(const dx of [-10,10]){line(c,[[0,dy],[dx,dy]],P(a,-.2),2);ellipse(c,dx,dy,4*eyeScale(),3.4*eyeScale(),P(ownEye(c,dx,dy,2.4,'#1d1d1d')));}
 path(c,`M40 0 Q70 ${-4+sw*.4} 96 ${sw*.4}`,null,P(a,-.1),3);
 path(c,`M96 ${sw*.4} l10 -6 M96 ${sw*.4} l10 6`,null,P(a,-.3),2.4);for(let i=0;i<4;i++)path(c,`M${102+i} ${-4+sw*.4} l2 1`,null,P('#efe7cb'),1);
}
function leedsichthys(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6);
 path(c,`M-150 0 L-196 ${-44+sw} L-178 0 L-196 ${44+sw}Z`,P(a,-.1));path(c,'M-20 -34 L0 -64 L24 -34Z',P(a,-.1));
 const body=path(c,'M-160 0 Q-120 -40 20 -40 Q110 -40 150 -10 L152 14 Q110 36 20 38 Q-120 38 -160 0Z',grad(c,P,a,b));
 path(c,'M120 -2 Q150 -14 160 2 Q150 18 120 10Z',P('#2a2a30'));if(!low)for(let i=0;i<10;i++)path(c,`M${124+i*3} -6 l0 14`,null,P('#d8d0bc',0,.6),.8);
 path(c,'M40 20 Q10 56 -10 50 L10 22Z',P(a,-.2));if(!low){skin(c,body,P,a,r.seed,200);fishScales(c,body,P,a);}eye(c,128,-16,P,3);
}
function charybdis(c,r,p,P,low){ // the whirlpool monster of Greek myth: a spinning maw ringed with teeth
 const a=r.colors.primary,b=r.colors.secondary,t=p.swim*.6;
 for(let k=0;k<5;k++){c.save();c.rotate(t*(1+k*.2));c.strokeStyle=P(b,k*.08,.7-k*.1);c.lineWidth=10-k*1.5;c.beginPath();for(let u=0;u<11;u+=.1){const rr=8+u*7.5+k*4;c.lineTo(Math.cos(u)*rr,Math.sin(u)*rr*.6);}c.stroke();c.restore();}
 ellipse(c,0,0,36,22,P('#120a12'));for(let i=0;i<20;i++){const q=i/20*TAU;path(c,`M${Math.cos(q)*34} ${Math.sin(q)*20} L${Math.cos(q)*24} ${Math.sin(q)*14} L${Math.cos(q+.12)*34} ${Math.sin(q+.12)*20}Z`,P('#efe6cc'));}
 for(const dx of [-50,50])eye(c,dx,-30,P,3.4);
}
function selkie(c,r,p,P,low){ mermaid(c,r,p,P,low);
 const a=r.colors.primary;path(c,'M20 -10 Q-6 -24 -60 -6 Q-30 14 18 8Z',P(a,-.1,.9));if(!low)for(let i=0;i<20;i++)ellipse(c,-50+i*3.6,-4+(i%3)*3,1.4,1.2,P(a,-.35));}
function insect(c,r,p,P,low){ // praying mantis, ant
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,mantis=id==='praying_mantis';
 // Sea skater (Halobates), 2026-11-13: the only insect that lives on the open ocean, skating on the surface film. A small
 // oval grey body with a silvery sheen, short front legs for holding food, and long middle and hind legs spread wide.
 if(id==='sea_skater'){const k=Math.sin(p.swim*1.6)*3;
  for(const far of [true,false]){const col=far?P(a,-.3):P(a,-.05),o=far?-3:0;
   path(c,`M${2+o} 6 Q30 ${12+k} 52 ${16+k} Q74 ${18+k} 96 ${20+k}`,null,col,1.8);path(c,`M${-8+o} 6 Q-36 ${12-k} -60 ${16-k} Q-80 ${18-k} -100 ${22-k}`,null,col,1.8);path(c,`M${12+o} 6 L${20+o} 14 L${26+o} 16`,null,col,1.6);}
  const body=path(c,'M-22 2 Q-20 -12 0 -13 Q20 -13 24 -2 Q22 10 0 11 Q-20 10 -22 2Z',grad(c,P,a,b,-13,11),P(a,-.45),.7);
  if(!low){c.save();c.clip(body);ellipse(c,0,-6,20,4,P('#dfe8ef',0,.35));c.restore();}
  ellipse(c,28,-2,7,6,grad(c,P,a,b,-8,4));path(c,'M30 -6 Q38 -18 46 -20 M28 -7 Q32 -20 38 -24',null,P(a,-.2),1.2);path(c,'M34 2 l6 6',null,P(a,-.3),1.4);
  eye(c,31,-3,P,1.8,{iris:'#2a2420'});helmet(c,26,-2,20,P);return;}
 for(let i=0;i<3;i++){const x=(mantis?-30:-16)+i*(mantis?18:14),k=Math.sin(p.swim+i)*5;path(c,`M${x} ${mantis&&i===2?-4:6} L${x-6+k} 26 L${x-12+k} 44`,null,P(a,-.2),2);}
 if(mantis){const ab=path(c,'M-80 4 Q-60 -14 -20 -6 L-10 6 Q-50 20 -80 4Z',grad(c,P,a,b));if(!low)for(let i=0;i<6;i++)path(c,`M${-74+i*10} -6 q-2 8 0 16`,null,P(a,-.3,.6),1);
  path(c,'M-24 -2 L34 -24 L38 -18 L-16 12Z',P(a,.05));path(c,'M30 -22 Q46 -10 40 10 L36 8 Q38 -8 26 -16Z',P(a,-.05));for(let i=0;i<4;i++)path(c,`M${39-i} ${-4+i*3} l4 1`,null,P('#2a3a20'),1);
  path(c,'M-60 -6 Q-20 -30 -8 -10',P(b,.15,.7));const hx=40,hy=-30;path(c,`M${hx-8} ${hy+6} L${hx+10} ${hy-4} L${hx+4} ${hy+10}Z`,P(a,.05));for(const dx of [-6,6]){const col=ownEye(c,hx+dx,hy,2.6,'');ellipse(c,hx+dx,hy,4*eyeScale(),5*eyeScale(),col?P(col):P(a,-.15));}path(c,`M${hx} ${hy-4} Q${hx+20} ${hy-30} ${hx+30} ${hy-34}`,null,P(a,-.2),1);helmet(c,hx,hy,26,P);}
 else{for(const [x,rx,ry] of [[-34,20,15],[-8,10,8],[16,14,12]])ellipse(c,x,0,rx,ry,grad(c,P,a,b,-ry,ry));ellipse(c,-34,-6,14,5,P('#ffffff',0,.18));
  path(c,'M20 -10 Q30 -34 44 -36 M14 -10 Q16 -36 28 -42',null,P(a,-.2),1.6);eye(c,22,-4,P,2.2);path(c,'M28 6 l8 3 M28 9 l7 5',null,P(a,-.3),1.6);helmet(c,16,0,22,P);}
}

// Ambulocetus natans, an early whale from about 49 million years ago (reconstruction from its fossils). About 3 m
// long: a crocodile-like body and long toothed snout with the eyes high on the head, short front legs ending in small
// hoofed toes, and big webbed hind feet that did most of the paddling. Whales had no tail fluke yet.
function ambulocetus(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=Math.sin(p.swim),k=s*12,G=(sh=0)=>grad(c,P,a,b,-30,34);
 // Limbs are rounded muscle segments: a thick upper part, a slimmer lower part, then the foot.
 const seg=(pts,w,col)=>line(c,pts,col,w);
 const hindLeg=(x,y,ang,near)=>{
  if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}const keepFlex=flex.map;flex.map=null;c.save();c.translate(x,y);c.rotate(ang);const sh=near?0:-.3,col=near?grad(c,P,a,a,-14,40):P(a,sh),dark=P(a,sh-.2);
  seg([[0,0],[9,20]],24,col);seg([[9,20],[-4,36]],12,col);
  if(near){seg([[-3,-2],[5,17]],5,P(a,.2,.35));seg([[6,22],[-5,34]],3,P(a,.15,.3));}
  // The broad webbed foot, four long toes fanned backwards: the paddle that did most of the swimming.
  const toes=[[-52,26],[-58,35],[-55,46],[-44,54]];
  c.fillStyle=P(a,sh+.12,.78);c.beginPath();c.moveTo(-4,32);for(const [tx,ty]of toes)c.lineTo(tx,ty);c.quadraticCurveTo(-20,48,-2,40);c.closePath();c.fill();
  c.strokeStyle=P(a,sh-.25,.6);c.lineWidth=.6;c.stroke();
  for(const [tx,ty]of toes){seg([[-4,36],[(tx-4)/2,(ty+36)/2+1],[tx,ty]],3.4,dark);ellipse(c,tx-1.2,ty+.2,2.4,1.7,P('#2f2922'));}
  if(near&&!low){c.save();c.clip(new Path2D('M-60 20 L0 20 L0 60 L-60 60Z'));for(let i=0;i<3;i++)line(c,[[-18-i*10,33+i*2.5],[-22-i*10,44+i*3]],P(a,.25,.35),.6);c.restore();}
  c.restore();flex.map=keepFlex;
 };
 const foreLeg=(x,y,ang,near)=>{
  if(flex.map){flex.map(x,y);x=flex.x;y=flex.y;}const keepFlex=flex.map;flex.map=null;c.save();c.translate(x,y);c.rotate(ang);const sh=near?0:-.3,col=near?grad(c,P,a,a,-10,38):P(a,sh);
  seg([[0,0],[-4,18]],17,col);seg([[-4,18],[2,33]],9,col);
  if(near){seg([[-3,-1],[-6,15]],4,P(a,.2,.35));seg([[-4,21],[0,31]],2.4,P(a,.15,.3));}
  // Five short toes, each with a small hoof, as in the hoofed relatives of early whales.
  for(let i=0;i<5;i++){const tx=-3+i*2.6;seg([[1,33],[tx+2,39+Math.abs(i-2)*.4]],2.4,P(a,sh-.15));ellipse(c,tx+2.4,40.4,1.6,1.2,P('#2f2922'));}
  c.restore();flex.map=keepFlex;
 };
 // Far side first, a shade darker.
 hindLeg(-56,10,-.45*s+.1,false);foreLeg(50,14,.35+.18*Math.sin(p.swim+1),false);
 // The long muscular tail, undulating, with no fluke yet; then the body with hip and shoulder humps and a long low skull.
 // One outline from tail tip to snout, so the tail grows out of the body with no seam.
 const body=path(c,`M-196 ${k-2.6} C-166 ${-10+k*.6} -118 -26 -74 -27 Q-62 -30 -56 -31 Q-30 -27 -2 -25 Q22 -24 42 -31 Q66 -30 82 -22 Q94 -27 108 -27 Q124 -26 136 -19 Q158 -12 178 -6 Q184 -2 182 2 Q176 7 160 8 L112 11 Q98 20 84 21 Q66 33 22 35 Q-30 36 -60 29 Q-70 25 -78 21 C-118 20 -166 ${10+k*.6} -196 ${k+2.6} Q-203 ${k} -196 ${k-2.6}Z`,G());
 if(!low){
  skin(c,body,P,a,r.seed,240);
  c.save();c.clip(body);ellipse(c,8,31,78,9,P(b,.12,.6));ellipse(c,-50,-24,30,6,P(a,.18,.35));ellipse(c,46,-26,28,5,P(a,.18,.35));c.restore();
  c.save();c.clip(body);ellipse(c,-120,-13+k*.3,70,5,P(a,.16,.3));c.restore();
  // Skin folds at the neck, shoulder and hip, and faint creases down the tail.
  for(let i=0;i<4;i++)path(c,`M${82+i*5} ${-20+i} q-3 15 1 28`,null,P(a,-.3,.42),.8);
  path(c,'M30 -26 q12 18 6 40',null,P(a,-.24,.35),1);path(c,'M-40 -26 q-12 20 -4 42',null,P(a,-.24,.35),1);
  for(let i=0;i<8;i++){const x=-96-i*12,y=k*.6*(i/8);path(c,`M${x} ${-18+i*1.6+y} q2 ${17-i*1.6} 0 ${34-i*3.2}`,null,P(a,-.22,.22),.6);}
 }
 // Jaws: a long mouth line with peg teeth, bigger canines near the front, interlocking from above and below.
 path(c,'M112 5 Q144 4 180 2',null,P('#2f2a22'),1.3);
 teeth(c,P,{x0:117,y0:4.5,x1:177,y1:2.3},{type:'fang',size:2.8,color:'#ece3c9'});
 teeth(c,P,{x0:120,y0:4.6,x1:174,y1:2.6,upper:false},{type:'fang',size:2.5,color:'#ece3c9'});
 // Eyes high on the head like a crocodile's, under a brow ridge; an ear opening; nostrils at the snout tip.
 path(c,'M104 -26 Q115 -33 126 -24 Q115 -27 104 -26Z',P(a,-.15));
 eye(c,115,-22,P,2.5);ellipse(c,96,-12,2.3,1.7,P('#2a251e',0,.8));ellipse(c,178,-3,1.7,1.1,P('#231f19'));
 if(!low)for(let i=0;i<6;i++)ellipse(c,146+i*4.5,-4-i*.8,.6,.5,P(a,-.3,.6));
 // Near side.
 hindLeg(-52,12,.45*s+.1,true);foreLeg(54,16,.35-.18*Math.sin(p.swim+1),true);
}
// Beluga (Delphinapterus leucas): white, a soft bulging melon on the forehead, a short beak, no dorsal fin (a low
// ridge instead), broad paddle flippers and a neck that can turn, unlike most whales.
function beluga(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),nod=Math.sin(p.swim*.5)*2.4;
 path(c,`M-126 -2 Q-146 ${-12+sw} -166 ${-27+sw} Q-172 ${-18+sw} -161 ${-6+sw} Q-157 ${sw} -161 ${6+sw} Q-172 ${18+sw} -166 ${27+sw} Q-146 ${12+sw} -126 4Z`,grad(c,P,a,b,-27,27),P(b,-.25),.7);
 path(c,'M48 16 Q36 42 18 46 Q26 32 34 16Z',P(b,-.18));
 const body=path(c,`M-132 0 Q-110 -22 -40 -33 Q30 -42 78 -30 Q90 -26 98 -29 Q118 ${-42+nod} 138 ${-30+nod} Q150 ${-18+nod} 149 ${-6+nod} L157 ${-1+nod} Q156 ${7+nod} 142 ${9+nod} Q122 ${16+nod} 98 18 Q60 34 0 34 Q-80 30 -132 4Z`,grad(c,P,a,b,-42,34),P(b,-.3),.8);
 if(!low){
  skin(c,body,P,a,r.seed,90);c.save();c.clip(body);
  ellipse(c,120,-28+nod,22,9,P('#ffffff',0,.35));ellipse(c,-10,-30,70,6,P('#ffffff',0,.25));ellipse(c,0,30,96,8,P('#9fb8c4',0,.18));
  // A low dorsal ridge of small bumps, neck creases and a few pale scars, as on real belugas.
  for(let i=0;i<14;i++)ellipse(c,-50+i*6,-36+Math.abs(i-7)*.35,2.6,1.6,P(b,-.12,.7));
  for(let i=0;i<4;i++)path(c,`M${88+i*5} ${-24+nod*.5} q-4 18 0 38`,null,P(b,-.2,.4),.8);
  for(const [x,y,l] of [[-30,-10,18],[20,4,14],[-70,6,12]])line(c,[[x,y],[x+l,y-3]],P('#ffffff',0,.45),.7);
  c.restore();
 }
 path(c,`M155 ${3+nod} Q144 ${12+nod} 128 ${8+nod}`,null,P(b,-.45),1.2);
 eye(c,122,-6+nod,P,2.1);ellipse(c,120,-27+nod,2.4,1,P(b,-.35,.7));
 path(c,'M60 18 Q50 46 26 50 Q26 40 34 30 Q40 20 44 16Z',grad(c,P,a,b,16,50),P(b,-.3),.7);
}
// Coral catshark (Atelomycterus marmoratus): a slender reef shark about 70 cm long, with two small dorsal fins set
// far back, a long low tail, marbled black and white spots, and cat-like eyes.
function catshark(c,r,p,P,low){
 // 2026-11-13: the pyjama shark (thick dark stripes from snout to tail) and the horn shark (a blunt pig-like head, ridges over
 // the eyes, a spine in front of each back fin, and small dark spots) share the catshark's body.
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),pyj=r.species==='pyjama_shark',horn=r.species==='horned_shark';
 path(c,`M-58 -7 Q-110 ${-14+sw*.6} -150 ${-12+sw} L-160 ${-7+sw} Q-152 ${-1+sw} -146 ${2+sw} Q-150 ${6+sw} -138 ${6+sw} Q-100 ${9+sw*.5} -58 8Z`,grad(c,P,a,b,-14,10),P(a,-.35),.7);
 path(c,'M-18 -12 Q-12 -32 4 -32 Q0 -22 8 -13Z',P(a,-.12));path(c,'M-60 -8 Q-56 -24 -44 -25 Q-46 -16 -40 -9Z',P(a,-.12));
 path(c,'M-26 9 Q-34 24 -44 24 L-38 9Z',P(a,-.2));path(c,'M-60 7 Q-66 18 -76 18 L-70 7Z',P(a,-.2));
 if(horn)for(const [x,y,h] of [[-20,-12,24],[-62,-8,20]])path(c,`M${x-1} ${y} L${x+1} ${y-h} L${x+3} ${y}Z`,P('#f0e8d4'),P(a,-.5,.6),.5);
 const body=path(c,horn?'M-64 -6 Q-30 -20 30 -22 Q76 -24 98 -12 Q108 -4 104 6 Q92 14 70 14 Q10 18 -64 8Z':'M-64 -6 Q-30 -16 30 -15 Q80 -14 100 -6 Q111 -2 109 3 Q97 10 72 12 Q10 18 -64 8Z',grad(c,P,a,b,-16,18),P(a,-.35),.7);
 if(!low){skin(c,body,P,a,r.seed,70);c.save();c.clip(body);
  if(pyj)for(let i=0;i<6;i++)path(c,`M-66 ${-11+i*4.2} Q20 ${-16+i*5} 108 ${-5+i*2.2}`,null,P('#1f1b18',0,.85),2.4);
  else if(horn){for(let i=0;i<46;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-62+(u-Math.floor(u))*164,-20+(v-Math.floor(v))*32,1.4,1.2,P('#1f1b18',0,.75));}}
  else{for(let i=0;i<16;i++){const x=-58+i*10.5,y=-8+(i%3)*3;path(c,`M${x} ${y} q5 -5 9 0 q-2 6 -9 3Z`,P('#1f1b18',0,.75));}
  for(let i=0;i<40;i++)ellipse(c,-60+((i*37)%100)/100*160,-12+((i*53)%100)/100*22,1.1,1,P('#f7f2e6',0,.85));}
  ellipse(c,20,10,80,4,P(b,.1,.6));c.restore();}
 path(c,'M48 6 Q36 26 18 28 L30 7Z',P(a,-.18),P(a,-.4),.6);
 for(let i=0;i<5;i++)path(c,`M${80-i*3.4} -3 q-2 5 0 10`,null,P(a,-.5),.9);
 path(c,'M104 6 Q96 10 86 9',null,P('#2a2420'),1.1);ellipse(c,106,2,1.2,.8,P('#2a2420'));
 if(horn)path(c,'M84 -12 Q92 -20 100 -12',null,P(a,-.3),3);
 // An elongated cat-like eye with a slit pupil.
 const col=ownEye(c,92,-5,1.8,'#c7b45a');ellipse(c,92,-5,4.6*eyeScale(),2.3*eyeScale(),P('#eae2c4'));ellipse(c,92,-5,3*eyeScale(),2*eyeScale(),P(col));ellipse(c,92.4,-5,2.4*eyeScale(),.55*eyeScale(),P('#0e1114'));ellipse(c,91,-5.8,.7,.45,P('#ffffff',0,.9));
}
// Titanoboa (Titanoboa cerrejonensis), about 60 million years ago: a boa some 13 m long from the swampy rivers of
// what is now Colombia (reconstruction). Saddle-shaped blotches like a living boa's, heat pits on the lip.
function titanoboa(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,N=30,top=[],bot=[],mid=[];
 const wv=waveBody(p,x=>{const i=(x+196)/12.2,t=i/N;return Math.sin(p.swim*.8-i*.33)*16*(1-t*.55);});
 for(let i=0;i<=N;i++){const t=i/N,x=-196+i*12.2,y=wv(x),w=2.6+19*Math.pow(Math.sin(Math.PI*Math.min(t*1.06,1)),.75)+(t>.9?3:0);mid.push([x,y,w]);top.push([x,y-w]);bot.unshift([x,y+w]);}
 const [hx,hy]=mid[N];
 const body=path(c,'M'+top.map(q=>q.join(' ')).join(' L')+` Q${hx+22} ${hy-12} ${hx+34} ${hy-3} Q${hx+38} ${hy+1} ${hx+33} ${hy+5} Q${hx+20} ${hy+11} `+bot.map(q=>q.join(' ')).join(' L')+'Z',grad(c,P,a,b,-24,24),P(a,-.45),.7);
 if(!low){skin(c,body,P,a,r.seed,200);c.save();c.clip(body);
  for(let i=1;i<N-1;i+=2){const [x,y,w]=mid[i];path(c,`M${x-8} ${y-w} Q${x-10} ${y-w*.2} ${x-4} ${y+w*.05} L${x+4} ${y+w*.05} Q${x+10} ${y-w*.2} ${x+8} ${y-w}Z`,P('#2e2a18',0,.8),P(a,.25,.5),.8);ellipse(c,x+7,y+w*.35,3,w*.16,P('#2e2a18',0,.55));}
  for(let i=0;i<N;i++){const [x,y,w]=mid[i];ellipse(c,x,y+w*.8,6,w*.25,P(b,.12,.7));for(let j=-2;j<=2;j++)path(c,`M${x+j*2.4} ${y-w*.9+j*.4} q2 1 0 2`,null,P(a,-.3,.35),.4);}
  c.restore();}
 ellipse(c,hx+24,hy-4,7,3.6,P(a,-.12));
 const col=ownEye(c,hx+24,hy-5,1.7,'#d6b44a');ellipse(c,hx+24,hy-5,3*eyeScale(),2.6*eyeScale(),P(col));ellipse(c,hx+24.2,hy-5,.6*eyeScale(),2.2*eyeScale(),P('#111'));ellipse(c,hx+23.2,hy-6,.6,.5,P('#ffffff',0,.85));
 path(c,`M${hx+34} ${hy+3} Q${hx+20} ${hy+5} ${hx+8} ${hy+3}`,null,P('#2a2414'),1);
 for(let i=0;i<5;i++)ellipse(c,hx+14+i*4,hy+5.4,.7,.5,P('#2a2414',0,.8));ellipse(c,hx+33,hy-1.5,.9,.6,P('#2a2414'));
 if(Math.sin(p.swim*1.3)>.55){const tl=8+Math.sin(p.swim*9)*2;crisp(c,(c)=>{path(c,`M${hx+36} ${hy+2} l${tl} 0 l3 -2 M${hx+36+tl} ${hy+2} l3 2`,null,P('#c23a4a'),1);});}
}
// Blue bell tunicate (Clavelina puertosecensis), a sea squirt: a few clear blue vases about 2 cm tall, joined at the
// base. Water goes in at the top siphon, through a basket that filters food, and out the side.
function seaSquirt(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,t=p.swim;
 const rock=path(c,'M-74 44 Q-66 22 -24 24 Q26 16 64 26 Q80 34 76 46 L-76 48Z',grad(c,P,'#6d6a60','#3f3d37',18,48));if(!low)skin(c,rock,P,'#6d6a60',r.seed,40);
 for(const [i,[x,tilt,sc]] of [[-40,-.16,.9],[-6,.04,1.12],[30,.2,1],[54,.34,.78]].entries()){
  c.save();c.translate(x,28);c.rotate(tilt);c.scale(sc,sc);
  const open=1+.18*Math.sin(t*1.3+i*1.9);
  const vase=new Path2D('M-11 0 Q-15 -26 -13 -50 Q-13 -60 0 -62 Q13 -60 13 -50 Q15 -26 11 0Z');
  const g=c.createLinearGradient(-14,0,14,0);g.addColorStop(0,P(a,.1,.62));g.addColorStop(.5,P(b,.1,.32));g.addColorStop(1,P(a,-.1,.66));
  c.fillStyle=g;c.fill(vase);c.strokeStyle=P(a,.35,.85);c.lineWidth=1.1;c.stroke(vase);
  if(!low){c.save();c.clip(vase);for(let j=0;j<9;j++)line(c,[[-11,-48+j*4.6],[11,-48+j*4.6]],P(b,.2,.45),.5);line(c,[[0,-58],[0,-8]],P('#ffffff',0,.6),1);ellipse(c,0,-6,5,3,P('#f2d36a',0,.8));ellipse(c,-6,-34,2.4,14,P('#ffffff',0,.22));c.restore();}
  c.strokeStyle=P(b,.25,.95);c.lineWidth=2;c.beginPath();c.ellipse(0,-61,8.5,2.4*open,0,0,TAU);c.stroke();
  c.strokeStyle=P(a,.4,.85);c.lineWidth=1.2;c.beginPath();c.ellipse(9,-40,2*open,3.2,.3,0,TAU);c.stroke();
  c.restore();
 }
}
// ---- 2026-11-08, second pass: the requests still waiting for a design. New families only. ----
// A long body along a centre line (snakes, the naga, hagfish, dragonfish, bobbit worm). Width is measured at right
// angles to the line, so S-bends keep an even thickness. Across the body, u = -1 is the back and +1 the belly.
function spineOf(line){
 const n=line.length,pt=line.map(([x,y,w],i)=>{const [x0,y0]=line[Math.max(0,i-1)],[x1,y1]=line[Math.min(n-1,i+1)],l=Math.hypot(x1-x0,y1-y0)||1;return{x,y,w,nx:-(y1-y0)/l,ny:(x1-x0)/l,th:Math.atan2(y1-y0,x1-x0)};});
 const at=(i,u)=>{const q=pt[i];return[q.x+q.nx*q.w*u,q.y+q.ny*q.w*u];};
 const smooth=(a,lead='M')=>{let d=lead+a[0].join(' ');for(let i=1;i<a.length-1;i++)d+=` Q${a[i].join(' ')} ${(a[i][0]+a[i+1][0])/2} ${(a[i][1]+a[i+1][1])/2}`;return d+' L'+a[a.length-1].join(' ');};
 const edge=(u,i0=0,i1=n-1)=>Array.from({length:i1-i0+1},(_,k)=>at(i0+k,u));
 return{pt,n,at,ribbon:(u0,u1,i0=0,i1=n-1)=>smooth(edge(u0,i0,i1))+smooth(edge(u1,i0,i1).reverse(),' L')+'Z',outline:()=>smooth(edge(-1))+smooth(edge(1).reverse(),' L')+'Z'};
}
// A slim S-curved line: a thin tail, a full body, and a narrower neck at the head end. lift raises part of the line.
function snakeLine(p,span,s,amp,f,N,lift=null){
 const line=[];for(let i=0;i<=N;i++){const t=i/N,w=s*Math.min(1,Math.pow(Math.min(1,t*2.4),.75))*(t>.9?1-(t-.9)*2.6:1)+.7;line.push([-span*.54+t*span,Math.sin(p.swim*.8-i*f)*amp*(1-t*.5)+(lift?lift(t):0),w]);}
 return spineOf(line);
}
// A rounded top and a pale underside that follow the bends.
// Lets requested looks (render/extras.js) follow a snakeLine body: how far each point has moved from where it is in the still picture.
function followSnake(p,span,amp,f,N){if(p.effort===undefined)return;const dx=span/N,xEnd=span*.46,y=(i,sw)=>Math.sin(sw*.8-i*f)*amp*(1-(i/N)*.5),turn=(y(N,p.swim)-y(N-1,p.swim)-y(N,0)+y(N-1,0))/dx,bend=(x)=>{const i=Math.max(0,Math.min(N,(x+span*.54)/dx));return y(i,p.swim)-y(i,0)+(x>xEnd?(x-xEnd)*turn:0);};flex.map=(x,yy)=>{flex.x=x;flex.y=yy+bend(x);};}
function roundLong(c,S,P,a,b){path(c,S.ribbon(.5,1.1),P(b,.08,.72));path(c,S.ribbon(-.82,-.42),P(a,.22,.3));path(c,S.ribbon(.15,.5),P(a,-.22,.22));}
const flick=(c,P,x,y,on)=>{if(on)crisp(c,(c)=>{path(c,`M${x} ${y} l9 .5 l3 -2.4 M${x+9} ${y+.5} l3 2.4`,null,P('#c23a4a'),1);});};

// Snakes. Corn snake (Pantherophis guttatus): orange with black-edged red saddles and a checkered belly. Eyelash viper
// (Bothriechis schlegelii): the golden form, with a broad head, heat pits and raised scales over the eyes. Eastern coral
// snake (Micrurus fulvius): red and black rings separated by yellow, with a black snout. Green anaconda (Eunectes
// murinus): heavy, olive, with paired black blotches, eyes high on the head and an orange stripe behind the eye; it lives
// in rivers and swamps, so it wears no helmet. The biggest reliable records are about 5-6 m.
const SNAKE={gaboon_viper:{span:252,s:18,amp:15,f:.55,N:26,head:'viper'},corn_snake:{span:372,s:9,amp:27,f:.4,N:36,head:'slim'},eyelash_viper:{span:262,s:13,amp:20,f:.5,N:30,head:'viper'},coral_snake:{span:336,s:7.5,amp:24,f:.44,N:54,head:'blunt'},green_anaconda:{span:360,s:21,amp:16,f:.3,N:36,head:'boa'}};
function snake(c,r,p,P,low){
 const id=r.species,k=SNAKE[id],a=r.colors.primary,b=r.colors.secondary,s=k.s,N=k.N,S=snakeLine(p,k.span,s,k.amp,k.f,N),end=S.pt[N],K='#17151a',n=end.w;
 const body=path(c,S.outline(),grad(c,P,a,a,-k.amp-s,k.amp+s),P(a,-.45),.7);
 c.save();c.clip(body);
 if(id==='coral_snake'){const seq='KKKYRRRRY';for(let i=0;i<N;i++){const q=seq[(N-1-i)%seq.length];if(q!=='R')path(c,S.ribbon(-1.4,1.4,i,i+1),P(q==='Y'?b:K));else if(!low&&i%2)for(let j=0;j<3;j++){const [x,y]=S.at(i,-.7+j*.6);ellipse(c,x,y,1.1,.9,P(K,0,.7));}}path(c,S.ribbon(-.75,-.4),P('#ffffff',0,.14));path(c,S.ribbon(.45,1.1),P(K,0,.16));}
 else roundLong(c,S,P,a,b==='#b23c24'?'#f4e6c8':b);
 if(id==='gaboon_viper')for(let i=2;i<N-1;i+=3)path(c,S.ribbon(-1.2,.2,i,i+2),P(b,0,.92),P('#2a2018',0,.8),1.2);
 if(id==='corn_snake'){for(let i=3;i<N-1;i+=3){const d=S.ribbon(-1.25,.28,i,i+1);path(c,d,P(b),P(K,0,.85),1.5);if(!low){const [x,y]=S.at(i,-.45);ellipse(c,x+2,y,3.4,1.8,P(b,.2,.5));}}if(!low)for(let i=1;i<N-1;i+=2)path(c,S.ribbon(.62,1.1,i,i+1),P(K,0,.5));for(let i=4;i<N-2;i+=6){const [x,y]=S.at(i,.42);ellipse(c,x,y,3,2,P(b,-.05,.75));}}
 if(id==='eyelash_viper'&&!low)for(let j=0;j<110;j++){const i=1+(j*7)%(N-2),[x,y]=S.at(i,-.9+((j*37)%100)/100*1.5);ellipse(c,x,y,j%3?.9:1.5,j%3?.7:1.1,j%4?P(a,-.38,.75):P('#b5482c',0,.7));}
 if(id==='green_anaconda'){for(let i=2;i<N-1;i+=2){const [x,y]=S.at(i,-.52+((i/2)%2)*.14),rx=8.5+(i%4),ry=6;ellipse(c,x,y,rx,ry,P(K,0,.86),S.pt[i].th);if(!low){const [x2,y2]=S.at(i+1,.28);ellipse(c,x2,y2,4.6,3.8,P(K,0,.8),S.pt[i].th);ellipse(c,x2,y2,2.3,1.8,P('#d99a3a',0,.9),S.pt[i].th);}}if(!low)for(let i=1;i<N;i+=2){const [x,y]=S.at(i,.82);ellipse(c,x,y,2.4,1.5,P(K,0,.45));}}
 if(!low){for(let i=2;i<N-1;i++)for(let u=-.72;u<.3;u+=.27){const [x,y]=S.at(i,u+(i%2)*.13);ellipse(c,x,y,1.8,1.05,P(id==='coral_snake'?'#ffffff':a,.3,.2),S.pt[i].th);}skin(c,body,P,a,r.seed,N*3);}
 c.restore();
 c.save();c.translate(end.x,end.y);c.rotate(end.th);
 const D={slim:`M-3 ${-n} Q${s*.7} ${-s*1.08} ${s*2} ${-s*.84} Q${s*3.1} ${-s*.42} ${s*3.4} ${s*.02} Q${s*3.1} ${s*.6} ${s*2} ${s*.82} Q${s*.7} ${s*.98} -3 ${n}Z`,
  viper:`M-3 ${-n} Q${s*.6} ${-s*1.5} ${s*1.7} ${-s*1.25} Q${s*2.7} ${-s*.85} ${s*3} ${-s*.12} Q${s*2.85} ${s*.55} ${s*1.9} ${s*.85} Q${s*.7} ${s*1.25} -3 ${n}Z`,
  blunt:`M-3 ${-n} Q${s*.9} ${-s*1.02} ${s*1.9} ${-s*.78} Q${s*2.6} ${-s*.4} ${s*2.7} ${s*.14} Q${s*2.45} ${s*.8} ${s*1.5} ${s*.92} Q${s*.5} ${s*.98} -3 ${n}Z`,
  boa:`M-3 ${-n} Q${s*.8} ${-s*.92} ${s*1.9} ${-s*.74} Q${s*2.75} ${-s*.42} ${s*3} 0 Q${s*2.8} ${s*.44} ${s*1.9} ${s*.64} Q${s*.8} ${s*.82} -3 ${n}Z`}[k.head];
 const head=path(c,D,id==='coral_snake'?P(K):grad(c,P,a,b==='#b23c24'?a:b,-s*1.3,s));
 c.save();c.clip(head);
 if(id==='corn_snake'){path(c,`M-3 ${-s*.2} L${s*1.2} ${-s*1.1} L${s*2.5} ${-s*.3} L${s*1.3} ${-s*.12}Z`,P(b),P(K,0,.8),1.2);path(c,`M${s*2.3} ${-s*.5} L${s*1.1} ${s*.45}`,null,P(b,0,.9),s*.26);}
 if(id==='coral_snake'){path(c,`M${s*.1} ${-s*1.4} L${s*.85} ${-s*1.4} L${s*.85} ${s*1.4} L${s*.1} ${s*1.4}Z`,P(b));}
 if(id==='green_anaconda'){path(c,`M${s*1.9} ${-s*.4} L${-s*.2} ${s*.12}`,null,P('#d9892f'),s*.2);path(c,`M${s*1.9} ${-s*.24} L${-s*.2} ${s*.32}`,null,P(K,0,.85),s*.1);path(c,`M${s*1.9} ${-s*.58} L${-s*.2} ${-s*.1}`,null,P(K,0,.85),s*.1);}
 if(id==='eyelash_viper'&&!low)for(let j=0;j<26;j++)ellipse(c,s*.2+((j*37)%100)/100*s*2.6,-s*1.1+((j*53)%100)/100*s*2,.9,.7,P(a,-.35,.6));
 if(!low)skin(c,head,P,a,r.seed+5,24);
 c.restore();
 path(c,D.replace('Z',''),null,id==='coral_snake'?P(K,.2):P(a,-.45),.7);
 const E={slim:[1.95,-.38,.24],viper:[1.8,-.62,.2],blunt:[1.5,-.3,.2],boa:[1.85,-.5,.125]}[k.head],lip=E[1]*s;
 if(k.head==='viper'){ellipse(c,s*2.32,-s*.28,s*.13,s*.09,P(K,0,.75));crisp(c,(c)=>{for(let i=0;i<5;i++){const x=s*(1.42+i*.2),h=s*(.26+(i===2?.14:.06*(2-Math.abs(i-2))));path(c,`M${x-1.4} ${lip-s*.3} L${x+.5} ${lip-s*.3-h} L${x+1.6} ${lip-s*.3}Z`,P(a,.22),P(a,-.45),.5);}});}
 eye(c,s*E[0],lip,P,s*E[2],{slit:k.head==='viper'||k.head==='boa',iris:id==='eyelash_viper'?'#c9a13a':id==='corn_snake'?'#c8562c':null});
 const tip={slim:3.4,viper:3,blunt:2.7,boa:3}[k.head];
 ellipse(c,s*(tip-.28),-s*.26,s*.09,s*.07,P(K,0,.8));
 faceLine(c,P,`M${s*(tip-.12)} ${s*.2} Q${s*(tip-1.1)} ${s*.5} ${s*.85} ${s*.42}`,P(id==='coral_snake'?'#f2d05c':K,0,.7));
 flick(c,P,s*tip,s*.15,Math.sin(p.swim*1.3)>.55);
 if(COMMUNITY_SPECIES[id].helmet)helmet(c,s*1.75,0,s*1.6+9,P);
 c.restore();
}
// A naga of Hindu and Buddhist art: a great water-serpent guarding the rivers, with a spread hood of five cobra heads
// and the jewel (mani) on the central head. Declared design length: there is no real animal to measure.
function naga(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,N=44,S=snakeLine(p,322,16,20,.3,N,(t)=>-Math.pow(Math.max(0,(t-.56)/.44),1.5)*64),e=S.pt[N],K='#10222a';
 const body=path(c,S.outline(),grad(c,P,a,a,-60,40),P(a,-.45),.8);
 c.save();c.clip(body);roundLong(c,S,P,a,b);
 if(!low){for(let i=2;i<N-1;i+=3){path(c,S.ribbon(-.95,-.2,i,i+1),P(b,-.12,.8));const [x,y]=S.at(i,-.58);ellipse(c,x,y,3.4,2.2,P(K,0,.55),S.pt[i].th);}
  for(let i=1;i<N;i++)path(c,S.ribbon(.68,1.1,i,i+1)+'',null,P(b,-.35,.6),.7);
  for(let i=2;i<N-1;i++)for(let u=-.8;u<.45;u+=.25){const [x,y]=S.at(i,u+(i%2)*.12);ellipse(c,x,y,2.1,1.25,P(a,.3,.22),S.pt[i].th);}skin(c,body,P,a,r.seed,120);}
 c.restore();
 c.save();c.translate(e.x,e.y);
 // The hood: spread ribs behind the five heads, with a gold spectacle mark.
 const hood=path(c,'M-16 20 Q-58 -4 -46 -50 Q-22 -88 26 -80 Q66 -62 62 -16 Q50 16 16 20Z',grad(c,P,a,a,-86,20),P(a,-.45),1);
 if(!low){c.save();c.clip(hood);for(let i=0;i<13;i++){const q=-3.05+i*.3;line(c,[[2,-18],[2+Math.cos(q)*100,-18+Math.sin(q)*100]],P(b,-.1,.32),1.2);}c.restore();}
 const heads=[[-2.45,1.45],[-1.72,1.6],[-.5,1.6],[.2,1.45],[-1.1,2.1]];
 const at=heads.map(([q,sc])=>{const R=q===-1.1?34:78;return{x:2+Math.cos(q)*R,y:-26+Math.sin(q)*R,sc,tilt:q*.34+.12};});
 for(const h of at){line(c,[[0,-6],[h.x-4,h.y+2]],P(a,-.05),11*h.sc);line(c,[[1,-8],[h.x-5,h.y]],P(b,.1,.55),2*h.sc);}
 for(const h of at){c.save();c.translate(h.x,h.y);c.rotate(h.tilt);c.scale(h.sc,h.sc);
  const hp=path(c,'M-9 -7.5 Q2 -11 13 -8 Q24 -5 28 .5 Q25 6.5 13 8 Q2 10 -9 7.5Z',grad(c,P,a,b,-11,10),P(a,-.45),.7);if(!low){skin(c,hp,P,a,r.seed+9,14);for(let i=0;i<5;i++)ellipse(c,-2+i*5,-5.5+Math.abs(i-2)*.4,2,1.2,P(a,.28,.3));}
  faceLine(c,P,'M27 2.4 Q17 5 6 4',P(K,0,.75),.8);ellipse(c,23.5,-2.2,.9,.65,P(K,0,.8));c.restore();}
 // Eyes last, and the central head's first, so close-ups and requested looks centre on it.
 for(const h of [...at].reverse()){c.save();c.translate(h.x,h.y);c.rotate(h.tilt);c.scale(h.sc,h.sc);eye(c,13,-3.4,P,2,{slit:true,iris:'#d9a93a'});c.restore();}
 const m=at[4];c.save();c.translate(m.x,m.y);c.rotate(m.tilt);c.scale(m.sc,m.sc);const g=c.createRadialGradient(1,-9,.5,1,-9,7);g.addColorStop(0,P('#fff6d4',0,.8));g.addColorStop(1,P(b,.2,0));ellipse(c,1,-9,7,7,g);ellipse(c,1,-8.6,3.1,2.5,P(b,.05));ellipse(c,1,-9.4,2,1.9,P('#e5533d',.05));ellipse(c,.4,-10,.6,.5,P('#ffffff',0,.9));flick(c,P,28,1.8,Math.sin(p.swim*1.3)>.55);c.restore();
 c.restore();
}
// Shortfin mako (Isurus oxyrinchus): the fastest shark. Metallic indigo above, sharply white below, a pointed snout, a
// big black eye, a crescent tail with a keel on its stalk, and long narrow teeth that show even with the mouth shut.
function mako(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=Math.sin(p.swim)*5;
 path(c,`M-104 -3 L${-152} ${-56+s} Q-132 -18 -124 0 Q-132 16 ${-150} ${46+s} L-104 4Z`,finFill(c,P,a,-104,0,-150,0));
 path(c,'M-64 -11 Q-62 -22 -52 -24 L-48 -12Z',P(a,-.05));path(c,'M-64 10 Q-62 19 -54 21 L-48 11Z',P(a,-.1));
 path(c,'M-20 -27 Q-14 -66 8 -68 Q4 -44 30 -29Z',finFill(c,P,a,5,-27,0,-66));
 path(c,'M-30 18 Q-42 34 -52 34 L-40 18Z',farPalette(P)(a,0));
 const body=path(c,'M-112 -3 Q-74 -16 -30 -27 Q30 -36 70 -24 Q98 -15 128 -2 Q120 3 106 8 Q80 20 42 26 Q-20 30 -84 11 L-112 3Z',grad(c,P,a,a,-30,20),P(a,-.45),.7);
 c.save();c.clip(body);path(c,'M-116 6 Q-40 12 18 10 Q70 8 128 -1 L130 40 L-116 40Z',P(b));
 if(!low){skin(c,body,P,a,r.seed,70);ellipse(c,20,-27,70,5,P('#b8c9ff',0,.35));line(c,[[-110,0],[-82,0]],P(a,-.4,.75),5);line(c,[[-110,-1],[-84,-1]],P(a,.15,.4),1);}
 c.restore();
 path(c,'M40 8 Q22 50 2 52 Q12 30 18 10Z',finFill(c,P,a,28,10,8,50),P(a,-.4),.6);
 if(!low)for(let i=0;i<5;i++)faceLine(c,P,`M${58-i*5} -6 q-3 9 0 18`,P(a,-.55,.9));
 teeth(c,P,{x0:80,y0:14.4,x1:113,y1:7.1,bend:-.7},{type:'needle',size:2.3,color:'#f1ecdd'});
 teeth(c,P,{x0:84,y0:15.2,x1:111,y1:8.8,bend:-.5,upper:false},{type:'needle',size:2,color:'#f1ecdd'});
 faceLine(c,P,'M73 15 Q95 13 117 6',P('#14202a'),1.3);
 ellipse(c,119,-4,1.3,.8,P('#14202a',0,.75));
 eye(c,91,-8,P,3,{iris:'#141a22'});
}
// Groupers, bass and snakeheads share a body plan: spiny or long dorsal fin, big mouth, rounded or squared tail.
// Giant grouper (Epinephelus lanceolatus): up to 2.7 m, heavy, mottled with pale blotches and a huge mouth. Largemouth
// bass (Micropterus salmoides): a dark broken stripe, and a jaw reaching past the eye. Northern snakehead (Channa argus):
// long, with a flat snake-like head, a long dorsal fin and dark saddle blotches.
function perch(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*6,G=id==='giant_grouper',B=['largemouth_bass','jack_dempsey_cichlid','sarcastic_fringehead','archerfish','mangrove_jack','flowerhorn_cichlid'].includes(id),H=id==='northern_snakehead',FH=id==='flowerhorn_cichlid',K='#1c1e18';
 const tx=H?-122:-82;
 const tail=path(c,`M${tx+4} -7 Q${tx-30} ${-34+sw} ${tx-38} ${sw} Q${tx-30} ${34+sw} ${tx+4} 8Z`,finFill(c,P,a,tx+4,0,tx-38,0),P(a,-.35),.6);
 if(!low)for(let i=0;i<9;i++)line(c,[[tx+2,-4+i],[tx-34,-30+i*7.5+sw]],P(a,-.3,.55),.7);
 const spiny=(x0,x1,y0,y1,h,n,col)=>{let d=`M${x0} ${y0}`;for(let i=0;i<n;i++){const u=(i+.5)/n,x=x0+(x1-x0)*u,y=y0+(y1-y0)*u,e=i/n,w=(x1-x0)/n/2;d+=` L${x-w*.2} ${y-h*(.75+.25*Math.sin(e*3.1))} Q${x+w*.5} ${y-h*.45} ${x+w} ${y-h*.45}`;}path(c,d+` L${x1} ${y1}Z`,P(a,-.05,.92),P(a,-.4),.7);if(!low)for(let i=0;i<n;i++){const u=(i+.5)/n,x=x0+(x1-x0)*u,y=y0+(y1-y0)*u;line(c,[[x,y],[x-1,y-h*.75]],P(col,0,.7),.9);}};
 if(H)spiny(-112,70,-16,-24,22,22,a);else{spiny(-28,44,-31,-34,G?26:24,10,a);path(c,'M-62 -22 Q-56 -50 -36 -46 L-26 -32Z',P(a,-.02,.92),P(a,-.4),.7);}
 path(c,H?'M-104 16 Q-60 40 -2 26Z':'M-58 22 Q-44 44 -26 30Z',P(a,-.1,.9),P(a,-.4),.6);
 const body=path(c,G?'M-82 -3 Q-62 -32 -12 -40 Q40 -46 74 -30 Q102 -18 110 6 Q104 22 86 28 Q40 42 -20 36 Q-62 30 -82 6Z':FH?'M-84 -3 Q-60 -24 -10 -32 Q30 -36 56 -34 Q66 -60 88 -54 Q108 -46 108 -18 Q112 -8 110 4 Q102 18 86 24 Q40 34 -20 28 Q-62 22 -84 5Z':B?'M-84 -3 Q-60 -24 -10 -32 Q40 -38 74 -26 Q100 -16 110 4 Q102 18 86 24 Q40 34 -20 28 Q-62 22 -84 5Z':'M-122 -2 Q-80 -19 -10 -25 Q60 -29 100 -22 Q122 -16 132 -2 Q128 8 112 14 Q60 26 -20 24 Q-90 19 -122 5Z',grad(c,P,a,b,-40,36),P(a,-.45),.8);
 c.save();c.clip(body);
 if(!low){skin(c,body,P,a,r.seed,110);for(let row=0;row<11;row++)for(let col=0;col<(H?36:26);col++){const x=(H?-122:-84)+col*7+(row%2)*3.5,y=-42+row*7.6;path(c,`M${x} ${y-3.4} q5.5 3.4 0 6.8`,null,P(a,.42,.28),.6);}}
 if(G)for(const [x,y,rx,ry,q] of [[-52,-10,16,10,.3],[-18,-22,18,10,-.2],[24,-20,14,9,.2],[-34,10,18,9,.1],[8,10,16,8,-.2],[48,4,12,8,.3]])ellipse(c,x,y,rx,ry,P(a,-.22,.42),q);
 if(G&&!low)for(let i=0;i<40;i++)ellipse(c,-74+((i*37)%100)/100*170,-34+((i*53)%100)/100*62,1.6,1.3,P(K,0,.55));
 if(id==='jack_dempsey_cichlid')for(let i=0;i<70;i++)ellipse(c,-78+((i*37)%100)/100*160,-30+((i*53)%100)/100*58,1.7,1.4,P('#5fe0d0',0,.85));
 if(id==='archerfish')for(const [x,w] of [[-58,12],[-30,14],[-2,14],[26,12]])path(c,`M${x} -46 Q${x+w*.5} -30 ${x-2} -14 L${x+w} -10 Q${x+w+4} -28 ${x+w} -46Z`,P(K,0,.72));
 if(id==='sarcastic_fringehead')for(const [x,y,rx,ry] of [[-50,-12,14,9],[-14,-20,16,9],[24,-14,12,8],[-30,10,14,7],[10,10,13,7]])ellipse(c,x,y,rx,ry,P(K,0,.3));
 // Mangrove jack (Lutjanus argentimaculatus): a copper-red snapper of mangroves and reefs, its scales edged darker, with a
 // faint blue line under the eye; to about 1.2 m, usually 40-80 cm.
// Flowerhorn cichlid: a bred cichlid, red to pink, with a row of black blotches along the side (its "flower line"),
 // pearly spots, and a big fatty hump on its forehead (the "kok").
 if(id==='flowerhorn_cichlid'){for(let i=0;i<7;i++)ellipse(c,-60+i*17,-2+Math.sin(i*1.3)*2,6-Math.abs(i-3)*.5,4.6,P('#1a1414',0,.82));if(!low)for(let i=0;i<40;i++)ellipse(c,-74+((i*37)%100)/100*150,-30+((i*53)%100)/100*52,1.3,1.1,P('#e8f4ff',0,.75));}
 if(id==='mangrove_jack'){if(!low)for(let i=0;i<9;i++)path(c,`M${-70+i*16} -30 Q${-64+i*16} 0 ${-70+i*16} 30`,null,P(a,-.2,.18),3);path(c,'M76 4 Q88 2 100 -4',null,P('#5aa8e0',0,.6),1.4);}
 if(id==='largemouth_bass')for(let i=0;i<11;i++)ellipse(c,-74+i*13.5,-2+Math.sin(i*1.7)*2.5,8,4.2+(i%2)*1.2,P(K,0,.5));
 if(H){for(let i=0;i<9;i++)ellipse(c,-100+i*24,-10+(i%2)*5,11,8,P(K,0,.68),.25);for(let i=0;i<8;i++)ellipse(c,-90+i*24,12,7,4,P(K,0,.5));}
 c.restore();
 // The flowerhorn's "kok", the fatty hump on its forehead, is part of its outline (FH above); a shine on it.
 if(FH&&!low)ellipse(c,84,-44,8,4.5,P('#ffffff',0,.2),-.3);
 const hx=H?100:G||B?70:70;
 path(c,H?`M${hx-22} -20 Q${hx-30} 2 ${hx-20} 22`:`M${hx-14} -28 Q${hx-26} 0 ${hx-14} 28`,null,P(a,-.45),1.2);
 path(c,H?`M${hx-34} 5 Q${hx-58} 28 ${hx-66} 18 L${hx-44} 2Z`:`M${hx-30} 2 Q${hx-56} 30 ${hx-64} 20 L${hx-42} 0Z`,P(a,.05,.72),P(a,-.35),.6);
 if(!low)for(let i=0;i<6;i++)line(c,[[hx-34,3],[hx-58+i*2.8,24-i*4]],P(a,-.3,.55),.5);
 path(c,H?`M${hx-40} 22 Q${hx-44} 38 ${hx-54} 34 L${hx-50} 22Z`:`M${hx-30} 26 Q${hx-36} 44 ${hx-46} 38 L${hx-42} 26Z`,P(a,-.08,.85));
 if(H)path(c,`M${hx+10} -7 L${hx-20} -3`,null,P(K,0,.5),2.6);
 // The mouth: a big gape, the lower jaw jutting a little. On the bass it reaches back past the eye.
 const my=H?4:G?12:9,mx=H?132:110,back=H?hx+6:B?hx-4:hx+2;
 faceLine(c,P,`M${mx-1} ${my-4} Q${(mx+back)/2+2} ${my+5} ${back} ${my+1}`,P(K,0,.8),1.4);
 path(c,`M${mx-2} ${my-3} Q${(mx+back)/2+2} ${my+7} ${back+2} ${my+4} Q${(mx+back)/2+2} ${my+13} ${mx-1} ${my+1}Z`,P(b,-.08,.9),P(K,0,.35),.5);
 if(id==='sarcastic_fringehead'){path(c,'M108 0 Q142 -24 150 4 Q142 32 108 16Z',P('#e8c23c',0,.95),P(K,0,.5),.8);path(c,'M112 4 Q136 -8 141 5 Q136 18 112 13Z',P('#cf3f4a'));}
 ellipse(c,mx-(H?9:7),H?-9:G?-12:-7,1.5,1.1,P(K,0,.75));
 eye(c,H?116:G?92:90,H?-10:G?-16:-11,P,G?3:B?3:2.4,{iris:G?'#b8a35e':B?'#c9a84a':'#a58c4a'});
}
// Coelacanth (Latimeria chalumnae): the living fossil. Fleshy, limb-like lobes at the base of four paired and two
// single fins, big rough scales, white blotches on steel blue, and a three-lobed tail with a small extra lobe at its tip.
function coelacanth(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*6;
 path(c,`M-96 -14 Q-118 ${-46+sw} -134 ${-40+sw} Q-126 ${-18+sw*.7} -118 ${-6+sw*.7} L-118 ${6+sw*.7} Q-126 ${18+sw*.7} -134 ${40+sw} Q-118 ${46+sw} -96 14Z`,finFill(c,P,a,-96,0,-134,0));
 path(c,`M-112 -5 Q-134 ${-5+sw} -152 ${sw} Q-134 ${5+sw} -112 5Z`,finFill(c,P,a,-112,0,-152,0),P(a,-.4),.6);
 if(!low)for(let i=0;i<12;i++)line(c,[[-104,-11+i*2],[-128,-34+i*6+sw]],P(a,-.3,.5),.6);
 const lobe=(x,y,ang,len,far)=>{c.save();c.translate(x,y);c.rotate(ang+Math.sin(p.swim+x*.05)*.14);const col=far?farPalette(P):P;path(c,`M0 ${-len*.2} Q${len*.34} ${-len*.3} ${len*.56} ${-len*.08} L${len*.56} ${len*.08} Q${len*.34} ${len*.3} 0 ${len*.2}Z`,col(a,.05));path(c,`M${len*.5} ${-len*.08} Q${len*.9} ${-len*.5} ${len*1.2} ${-len*.2} Q${len*1.26} 0 ${len*1.2} ${len*.2} Q${len*.9} ${len*.5} ${len*.5} ${len*.08}Z`,finFill(c,P,a,len*.5,0,len*1.2,0));if(!low)for(let i=0;i<7;i++)line(c,[[len*.52,0],[len*1.16,-len*.3+i*len*.1]],P(a,-.3,.5),.5);c.restore();};
 lobe(-56,28,2.35,26,true);lobe(-14,34,2.2,26,true);lobe(-56,-30,-2.3,26);
 path(c,'M-12 -36 L4 -68 Q14 -58 28 -36Z',P(a,.05,.9),P(a,-.4),.7);if(!low)for(let i=0;i<6;i++)line(c,[[-6+i*5,-36],[2+i*2,-62+i*2]],P(a,-.3,.55),.7);
 const body=path(c,'M-112 -13 Q-70 -32 -8 -38 Q48 -40 88 -26 Q110 -14 116 3 Q108 14 88 22 Q42 38 -20 36 Q-70 28 -112 13Z',grad(c,P,a,b,-40,40),P(a,-.45),.8);
 c.save();c.clip(body);
 if(!low){skin(c,body,P,a,r.seed,90);for(let row=0;row<9;row++)for(let col=0;col<22;col++){const x=-112+col*9.5+(row%2)*4.7,y=-38+row*9.4;path(c,`M${x} ${y-4.2} q7 4.2 0 8.4`,null,P(a,.4,.34),.7);ellipse(c,x+2.4,y,.9,.7,P(a,.5,.3));}}
 for(const [x,y,rx,ry,q] of [[-86,-8,8,5,.4],[-58,8,10,5,-.3],[-44,-16,12,6,.1],[-16,6,11,6,.5],[-4,-22,9,5,-.2],[20,-8,13,6,.2],[28,16,10,5,-.3],[46,-22,7,4,.2],[56,4,9,5,.3],[-68,-22,6,3.6,0]])ellipse(c,x,y,rx,ry,P('#e3e8e6',0,.72),q);
 c.restore();
 lobe(40,16,2.5,30);lobe(-14,32,2.5,24);lobe(-58,26,2.55,24);
 faceLine(c,P,'M64 -26 Q50 0 66 26',P(a,-.5),1.3);path(c,'M74 -28 Q68 -8 74 8',null,P(a,-.35,.6),.8);
 faceLine(c,P,'M115 6 Q98 16 76 13',P('#101c26',0,.75),1.2);ellipse(c,108,-6,1.4,1,P('#101c26',0,.8));
 eye(c,91,-8,P,3.4,{iris:'#c8d0c0'});
}
// Hagfish (Myxine glutinosa): soft and scaleless, no jaws (a slit with rasping plates), three pairs of barbels, a single
// nostril, eyes that are only pale spots under the skin, a row of slime pores, and a thread or two of its famous slime.
function hagfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,N=36,S=snakeLine(p,286,11.5,18,.36,N),e=S.pt[N];
 path(c,S.ribbon(-1,-1.55,0,11),P(a,.1,.65));path(c,S.ribbon(1,1.6,0,12),P(a,.1,.65));
 const body=path(c,S.outline(),grad(c,P,a,b,-30,30),P(a,-.4),.7);
 c.save();c.clip(body);roundLong(c,S,P,a,b);if(!low){for(let i=2;i<N-1;i++){const [x,y]=S.at(i,.52);ellipse(c,x,y,1.2,1,P('#fff3e6',0,.85));ellipse(c,x,y,.5,.4,P(a,-.35,.8));}skin(c,body,P,a,r.seed,60);}c.restore();
 if(!low)for(let i=0;i<3;i++){const [x,y]=S.at(10+i*9,1),t=Math.sin(p.swim*.6+i)*5;path(c,`M${x} ${y} q${5+t} 12 ${-2+t} 24 q${-6} 8 ${3} 14`,null,P('#dff2ee',0,.42),.8);}
 c.save();c.translate(e.x,e.y);c.rotate(e.th);const s=11.5,n=e.w;
 const hD=`M-3 ${-n} Q${s*.8} ${-s*1.02} ${s*1.8} ${-s*.76} Q${s*2.45} ${-s*.3} ${s*2.4} ${s*.2} Q${s*2.1} ${s*.72} ${s*1.3} ${s*.82} Q${s*.5} ${s*.94} -3 ${n}`,head=path(c,hD+'Z',grad(c,P,a,b,-s,s));if(!low)skin(c,head,P,a,r.seed+4,16);path(c,hD,null,P(a,-.4),.7);
 for(const [dy,l,bend] of [[-.2,11,-3],[.12,12,2],[.45,10,5]])for(const dx of [0,-.2])path(c,`M${s*(2.36+dx)} ${s*dy} q${l*.55} ${bend} ${l} ${bend+Math.sin(p.swim*1.2+dy*4)*1.5}`,null,P(a,dx?-.1:.12),1.5);
 ellipse(c,s*2.3,-s*.26,s*.11,s*.08,P('#3a2420',0,.75));
 faceLine(c,P,`M${s*2.2} ${s*.52} Q${s*1.7} ${s*.68} ${s*1.2} ${s*.6}`,P('#5a3a34',0,.7));
 c.save();c.globalAlpha*=.75;eye(c,s*1.55,-s*.34,P,1.5,{iris:'#d8c7ae'});c.restore();
 c.restore();
}
// Black dragonfish (Idiacanthus atlanticus): a long black deep-sea hunter. Fangs on a jutting lower jaw, a glowing lure
// on a chin barbel, a light behind the eye, and rows of photophores along the belly.
function dragonfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,N=42,S=snakeLine(p,284,9,20,.34,N),e=S.pt[N],L='#7fe7ff',glow=.75+.25*Math.sin(p.swim*1.7);
 path(c,S.ribbon(-1,-1.7,11,N-5),P(b,.12,.7));path(c,S.ribbon(1,1.7,3,17),P(b,.12,.7));
 path(c,S.ribbon(-1,-1.8,0,4),P(b,.2,.6));path(c,S.ribbon(1,1.8,0,4),P(b,.2,.6));
 const body=path(c,S.outline(),grad(c,P,a,b,-30,30),P('#3e3a52',0,.8),.7);
 c.save();c.clip(body);path(c,S.ribbon(-.8,-.45),P('#6a6588',0,.3));if(!low)for(let i=2;i<N-1;i+=2){const [x,y]=S.at(i,.3);ellipse(c,x,y,2.2,1.4,P('#8d88a8',0,.18),S.pt[i].th);}c.restore();
 crisp(c,(c)=>{for(let i=2;i<N-1;i++){const [x,y]=S.at(i,.72);const g=c.createRadialGradient(x,y,.2,x,y,3.6);g.addColorStop(0,P(L,.2,glow));g.addColorStop(1,P(L,0,0));ellipse(c,x,y,3.6,3.6,g);ellipse(c,x,y,1,1,P(L,.3,glow));}});
 c.save();c.translate(e.x,e.y);c.rotate(e.th);const s=9,n=e.w;
 const up=path(c,`M-3 ${-n} Q${s*.8} ${-s*1.2} ${s*2.4} ${-s*.95} Q${s*3.2} ${-s*.6} ${s*3.3} ${-s*.1} L${s*.7} ${s*.15} L-3 ${n*.5}Z`,grad(c,P,a,b,-s*1.2,0),P('#3e3a52',0,.8),.6);
 const low2=path(c,`M-3 ${n*.45} L${s*.7} ${s*.3} L${s*3.8} ${s*.75} Q${s*3.2} ${s*1.25} ${s*1.6} ${s*1.25} Q${s*.5} ${s*1.2} -3 ${n}Z`,grad(c,P,a,b,0,s*1.3),P('#3e3a52',0,.8),.6);
 ellipse(c,s*1.65,s*.02,s*1.8,s*.15,P('#30121c',0,.85));
 teeth(c,P,{x0:s*.8,y0:s*.06,x1:s*3.1,y1:-s*.1},{type:'needle',size:2.6,color:'#eef2ec'});
 teeth(c,P,{x0:s*1.4,y0:s*.32,x1:s*3.7,y1:s*.7,upper:false},{type:'fang',size:2.3,color:'#eef2ec'});
 ellipse(c,s*1.05,-s*.58,s*.34,s*.2,P('#e8506a',.1,.85+.15*Math.sin(p.swim*1.7)));
 const sway=Math.sin(p.swim*1.1)*5;path(c,`M${s*.9} ${s*1.2} Q${s*1.3} ${s*3.4} ${s*2.6+sway} ${s*4.2}`,null,P(b,.15),1.2);
 crisp(c,(c)=>{const x=s*2.6+sway,y=s*4.2,g=c.createRadialGradient(x,y,.3,x,y,8);g.addColorStop(0,P(L,.3,glow));g.addColorStop(1,P(L,0,0));ellipse(c,x,y,8,8,g);ellipse(c,x,y,2.2,2.6,P(L,.4));});
 eye(c,s*2.2,-s*.52,P,2.6,{iris:'#c8d6da'});
 c.restore();
}
// Leafy scorpionfish (Taenianotus triacanthus): 10 cm, flat as a leaf, with a tall sail fin that starts on the head. It
// sways from side to side like a drifting leaf, and every fish is a different mottled colour.
function scorpionfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*5,tilt=Math.sin(p.swim*.7)*.05;
 c.save();c.rotate(tilt);
 let sail='M58 -18';for(let i=0;i<13;i++){const x=48-i*9.6,top=-52-Math.sin((i+1)/14*Math.PI)*24;sail+=` L${x+1} ${top} Q${x-3} ${top+9} ${x-8} ${top+7}`;}
 const fin=path(c,sail+' L-60 -6 Q0 -30 58 -18Z',P(a,.02,.92),P(a,-.4),.7);
 if(!low){c.save();c.clip(fin);for(let i=0;i<13;i++){const x=48-i*9.6;line(c,[[x-1,-14],[x+1,-78]],P(a,-.3,.5),.8);}for(let i=0;i<34;i++)ellipse(c,-60+((i*37)%100)/100*118,-70+((i*53)%100)/100*48,3+(i%3),2+(i%2),i%2?P(b,.08,.7):P(a,-.3,.55));c.restore();}
 path(c,`M-58 -7 Q-92 ${-26+sw} -96 ${sw} Q-92 ${26+sw} -58 8Z`,finFill(c,P,a,-58,0,-96,0),P(a,-.35),.6);if(!low)for(let i=0;i<8;i++)line(c,[[-58,-5+i*1.4],[-90,-20+i*6+sw]],P(a,-.3,.5),.6);
 path(c,'M-34 22 Q-30 46 -14 46 Q-4 40 0 28Z',P(a,-.05,.9),P(a,-.35),.6);
 const body=path(c,'M-64 6 Q-50 -20 -8 -26 Q30 -30 54 -18 Q72 -8 75 6 Q64 18 46 22 Q0 34 -40 26 Q-60 20 -64 6Z',grad(c,P,a,b,-28,30),P(a,-.45),.8);
 c.save();c.clip(body);if(!low){skin(c,body,P,a,r.seed,80);for(let i=0;i<22;i++)ellipse(c,-60+((i*41)%100)/100*130,-24+((i*29)%100)/100*50,4+(i%4)*1.6,2.6+(i%3),i%3?P(b,.1,.62):P(a,-.32,.55),i*.6);}c.restore();
 path(c,'M26 6 Q6 30 -6 22 L10 4Z',P(a,.06,.82),P(a,-.35),.6);if(!low)for(let i=0;i<5;i++)line(c,[[22,6],[0+i*2,24-i*3.5]],P(a,-.3,.5),.5);
 if(!low)crisp(c,(c)=>{for(const [x,y,l,q] of [[48,-16,7,-1.2],[62,-12,6,-.9],[38,-22,6,-1.5],[62,12,6,1.3],[44,20,6,1.5],[6,28,6,1.7],[-24,26,5,1.8]]){path(c,`M${x} ${y} l${Math.cos(q)*l} ${Math.sin(q)*l} l${2} ${-1}`,P(b,.1,.9),P(a,-.3),.5);}});
 faceLine(c,P,'M74 4 Q62 12 50 6',P('#2c1c14',0,.75),1.2);path(c,'M74 4 Q66 -2 58 -2',null,P(a,-.3,.5),.8);
 eye(c,56,-8,P,2.7,{iris:'#a57a4e'});
 c.restore();
}
// Red-lipped batfish (Ogcocephalus darwini), from the Galapagos: a flattened, warty body, a pointed horn on the forehead,
// bright red lips, and pectoral fins it uses as legs to walk across the seabed.
function batfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*5,step=Math.sin(p.swim)*6,R='#d8322e';
 path(c,`M-58 2 Q-90 ${-16+sw} -100 ${-12+sw} Q-94 ${sw} -100 ${12+sw} Q-90 ${16+sw} -58 8Z`,finFill(c,P,a,-58,4,-100,sw),P(a,-.35),.6);
 const leg=(x,dx,far)=>{const col=far?farPalette(P):P;path(c,`M${x-7} 12 Q${x-9+dx*.4} 28 ${x-5+dx} 35 L${x+8+dx} 35 Q${x+7+dx*.4} 26 ${x+8} 12Z`,col(a,-.08));path(c,`M${x-6+dx} 33 Q${x-20+dx} 40 ${x-24+dx} 48 Q${x+2+dx} 54 ${x+26+dx} 47 Q${x+20+dx} 38 ${x+8+dx} 33Z`,finFill(c,P,a,x+dx,33,x+dx,52),P(a,-.4),.6);if(!low)for(let i=0;i<7;i++)line(c,[[x+1+dx,34],[x-20+i*7+dx,47+Math.abs(i-3)*-.4+3]],P(a,-.42,.55),.6);};
 leg(-20,step*.6,true);leg(26,-step*.6,true);
 path(c,'M80 -16 Q92 -27 106 -30 Q103 -18 92 -8Z',grad(c,P,a,a,-30,-8),P(a,-.45),.7);
 const body=path(c,'M-62 8 Q-46 -18 8 -24 Q60 -26 86 -14 Q102 -4 102 6 Q92 20 64 26 Q0 36 -48 22 Q-60 16 -62 8Z',grad(c,P,a,b,-26,30),P(a,-.45),.8);
 c.save();c.clip(body);ellipse(c,20,26,88,12,P(b,.12,.85));if(!low){skin(c,body,P,a,r.seed,90);for(let i=0;i<46;i++){const x=-58+((i*37)%100)/100*150,y=-22+((i*53)%100)/100*30;ellipse(c,x,y,1.8+(i%3)*.7,1.5+(i%3)*.6,P(a,.22,.8));ellipse(c,x-.5,y-.5,.8,.6,P(a,.45,.6));}}c.restore();
 leg(-10,-step*.6,false);leg(36,step*.6,false);
 path(c,'M84 10 Q92 3 104 7 Q108 12 100 19 Q90 22 84 15Z',P(R),P('#7c1a18'),.8);path(c,'M86 10 Q94 6 103 9',null,P('#ffffff',0,.45),1);faceLine(c,P,'M85 13 Q94 12 106 11',P('#5a1412'),1.1);
 ellipse(c,70,-8,1.2,.9,P('#2a1c14',0,.7));
 eye(c,68,-11,P,3,{iris:'#c9a85a'});
}
// Bobbit worm (Eunice aphroditois): an iridescent bristle worm up to about 3 m (usually near 1 m), hunting from a burrow.
// Hundreds of segments with rows of bristles, a pale collar ring, five sensory antennae, and snapping jaws.
function bobbit(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,N=52,S=snakeLine(p,366,11,20,.3,N),e=S.pt[N],K='#1c1216';
 if(!low)for(let i=1;i<N;i++){const [x,y]=S.at(i,-1.05),[x2,y2]=S.at(i,1.05),q=S.pt[i],q2=Math.sin(p.swim*2-i*.6)*1.8;line(c,[[x,y],[x-q.nx*5-q2,y-q.ny*5]],P(b,.1,.8),1);line(c,[[x2,y2],[x2+q.nx*5-q2,y2+q.ny*5]],P(b,.1,.8),1);}
 const body=path(c,S.outline(),grad(c,P,a,a,-34,34),P(a,-.45),.7);
 c.save();c.clip(body);
 for(let i=0;i<N;i+=2)path(c,S.ribbon(-1.3,1.3,i,i+1),P(a,.1,.5));
 path(c,S.ribbon(-.8,-.25),P('#9fd0ff',0,.2));path(c,S.ribbon(-.55,.1),P('#c79aff',0,.14));path(c,S.ribbon(.5,1.1),P(b,-.18,.55));
 for(let i=N-5;i<N-3;i++)path(c,S.ribbon(-1.3,1.3,i,i+1),P('#f3ece0',0,.9));
 if(!low){for(let i=1;i<N;i++){const [x,y]=S.at(i,-1.2),[x2,y2]=S.at(i,1.2);line(c,[[x,y],[x2,y2]],P(K,0,.4),.7);}skin(c,body,P,a,r.seed,70);}
 c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);const s=11,n=e.w;
 const opn=.5+.5*Math.sin(p.swim*.9);
 path(c,`M${s*1.2} ${-s*.2} L${s*3.2} ${-s*.6-opn*s*.5} L${s*2.1} ${-s*.05}Z`,P('#2a1a1e'),P('#000',0,.3),.5);path(c,`M${s*1.2} ${s*.3} L${s*3.2} ${s*.7+opn*s*.5} L${s*2.1} ${s*.25}Z`,P('#2a1a1e'),P('#000',0,.3),.5);
 for(let i=0;i<4;i++){const u=.25+i*.18;ellipse(c,s*(1.4+u*1.5),-s*(.25+u*.35)-opn*s*.3*u,.9,.7,P('#e8e0cc'));ellipse(c,s*(1.4+u*1.5),s*(.33+u*.35)+opn*s*.3*u,.9,.7,P('#e8e0cc'));}
 const hD=`M-3 ${-n} Q${s*.5} ${-s*1.05} ${s*1.4} ${-s*.72} Q${s*1.95} ${-s*.3} ${s*1.9} ${s*.1} Q${s*1.8} ${s*.62} ${s*1.2} ${s*.82} Q${s*.5} ${s*.95} -3 ${n}`,head=path(c,hD+'Z',grad(c,P,a,b,-s,s));if(!low)skin(c,head,P,a,r.seed+2,18);path(c,hD,null,P(a,-.45),.7);
 const ant=(x,y,l,ang,i)=>path(c,`M${x} ${y} q${Math.cos(ang)*l*.5} ${Math.sin(ang)*l*.5+Math.sin(p.swim*1.4+i)*3} ${Math.cos(ang)*l} ${Math.sin(ang)*l+Math.sin(p.swim*1.2+i)*3}`,null,P('#f0dcc0',0,.95),1.5);
 ant(s*.7,-s*.8,30,-.9,0);ant(s*1,-s*.72,34,-.6,1);ant(s*1.3,-s*.55,30,-.3,2);ant(s*1,s*.72,24,.75,3);ant(s*1.3,s*.55,22,.45,4);
 eye(c,s*.82,-s*.34,P,1.5,{iris:'#3a2228'});
 c.restore();
}
// Pistol shrimp (Alpheus randalli): one claw far bigger than the other. Snapping it shut fires a jet of water and a
// bubble hot enough to flash, which is what stuns its prey. The eyes sit under a hood on the front of the shell.
function pistol(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*4,snap=(p.swim%6.283)/6.283;
 for(let i=0;i<4;i++){const x=-62-i*6,y=2+i*2;path(c,`M-58 6 Q${x-16} ${y+4+sw} ${x-30} ${-14+i*10+sw}`,null,P(a,.05,.85),9-i);}
 if(!low)for(let i=0;i<5;i++){const x=-34+i*14,k=Math.sin(p.swim*2+i)*5;path(c,`M${x} 12 q${-3+k} 14 ${-7+k} 20`,null,P(a,-.12),3);}
 for(const [dy,l] of [[-8,74],[-4,94]])path(c,`M66 ${dy} Q${66+l*.5} ${dy-20} ${66+l} ${dy-8+sw}`,null,P(a,-.1,.9),1.2);
 const body=path(c,'M-66 8 Q-52 -16 -18 -24 Q30 -28 58 -16 Q74 -8 80 2 Q62 14 30 17 Q-28 24 -66 15Z',grad(c,P,a,b,-26,20),P(a,-.45),.7);
 c.save();c.clip(body);if(!low){skin(c,body,P,a,r.seed,60);for(let i=0;i<5;i++)path(c,`M${-46+i*15} -26 q-8 22 -2 42`,null,P(a,-.32,.65),1);path(c,'M34 -26 Q22 -2 34 20',null,P(a,-.42,.75),1.2);for(let i=0;i<7;i++)ellipse(c,-58+i*12,-14+(i%2)*2,2.4,8,P(b,.12,.5),.3);}c.restore();
 path(c,'M56 -14 Q78 -18 92 -6 L74 2Z',grad(c,P,a,a,-18,2),P(a,-.45),.6);
 eye(c,70,-9,P,2.2,{iris:'#2c2024'});
 // Small claw, then the big snapping claw: the palm, the movable finger, and the flash when it fires.
 path(c,'M46 10 Q70 20 84 14',null,P(a,-.1),4);path(c,'M84 11 Q98 10 104 15 Q96 19 84 18Z',P(a,.02),P(a,-.4),.6);
 path(c,'M36 12 Q52 34 78 34',null,P(a,-.08),9);
 const shut=snap>.82?0:(.82-snap)*.6;
 const claw=path(c,'M70 22 Q100 8 136 22 Q152 34 140 48 Q104 62 76 48 Q62 36 70 22Z',grad(c,P,a,b,12,56),P(a,-.45),.8);if(!low){skin(c,claw,P,a,r.seed+6,30);ellipse(c,104,28,20,7,P(b,.2,.4),.1);}
 c.save();c.translate(134,26);c.rotate(-shut);path(c,'M-16 -4 Q10 -18 34 -4 Q30 2 -10 4Z',grad(c,P,a,b,-16,4),P(a,-.45),.7);c.restore();
 if(snap>.82&&snap<.92&&!low)crisp(c,(c)=>{const q=(snap-.82)/.1,x=172+q*18;ellipse(c,x,26,6+q*8,6+q*8,P('#ffffff',0,.5*(1-q)));c.strokeStyle=P('#ffffff',0,.85*(1-q));c.lineWidth=1.2;c.beginPath();c.arc(x,26,4+q*14,0,TAU);c.stroke();});
}
// Flapjack octopus (Opisthoteuthis adorabilis), about 18 cm: squashed flat like a pancake, with two small fins, big
// eyes close together, and short arms joined by a web, which it drifts on over the deep seabed.
function flapjack(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*6,pulse=Math.sin(p.swim*.8)*2;
 let web=`M-78 ${10+pulse}`;for(let i=0;i<8;i++){const x=-78+(i+1)*19.5;web+=` Q${x-9.7} ${44+(i%2)*4+pulse} ${x} ${16+pulse*.5}`;}
 const skirt=path(c,web+' Q0 26 -78 10Z',P(a,.02,.88),P(a,-.35),.8);
 if(!low){c.save();c.clip(skirt);for(let i=0;i<8;i++){const x=-68+i*19.5;for(let j=0;j<5;j++)ellipse(c,x,20+j*5,1.8,1.3,P(b,.2,.8));}c.restore();}
 for(const s2 of [-1,1])path(c,`M${s2*18} -22 Q${s2*30} ${-46+f*s2*.3} ${s2*42} ${-42} Q${s2*38} ${-26} ${s2*30} -20Z`,P(a,.06,.95),P(a,-.35),.8);
 const body=path(c,'M-78 12 Q-74 -18 -24 -28 Q0 -32 24 -28 Q74 -18 78 12 Q60 26 0 26 Q-60 26 -78 12Z',grad(c,P,a,b,-32,28),P(a,-.4),.8);
 if(!low){skin(c,body,P,a,r.seed,60);c.save();c.clip(body);for(let i=0;i<32;i++)ellipse(c,-70+((i*37)%100)/100*140,-26+((i*53)%100)/100*46,1.6,1.3,P(a,-.22,.55));ellipse(c,0,-26,44,5,P('#ffffff',0,.18));c.restore();}
 for(const s2 of [-1,1]){ellipse(c,s2*16,-8,11,10,P(a,.05));eye(c,s2*16,-8,P,4.4,{iris:'#2a2a3a'});}
}
// Liopleurodon ferox: a pliosaur of the Jurassic seas. A short neck, a skull about a fifth of the body, big interlocking
// fangs at the front of the jaw, four long wing-like flippers and a short tail. Fossils suggest about 5-7 m.
// Kronosaurus queenslandicus: a pliosaur of the Early Cretaceous seas of Australia, about 10 m, with a huge, long, flat-topped
// skull (about a quarter of its length) on a very short neck, and big conical teeth.
function pliosaur(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*6,KR=r.species==='kronosaurus';
 const flip=(x,y,ang,far)=>{c.save();c.translate(x,y);c.rotate(ang+Math.sin(p.swim+x*.03)*.22);const f=far?farPalette(P):P,d='M0 -11 Q-34 -6 -92 12 Q-62 18 -28 16 Q-8 15 8 8Z',s=path(c,d,f(a,far?-.05:.02),P(a,-.45),.8);if(!low){c.save();c.clip(s);ellipse(c,-40,14,46,5,f(b,.05,.7));for(let i=0;i<6;i++)line(c,[[-10-i*11,-6+i*1.6],[-16-i*11,12+i*.8]],P(a,-.3,.5),.6);c.restore();}c.restore();};
 flip(-44,18,-.48,true);flip(46,22,-.42,true);
 path(c,`M-104 -8 Q-142 ${-8+sw} -174 ${sw} Q-142 ${10+sw} -104 12Z`,grad(c,P,a,b,-8,12),P(a,-.45),.7);
 const body=path(c,KR?'M-118 6 Q-104 -34 -30 -44 Q40 -48 78 -40 Q90 -38 100 -42 Q150 -48 192 -28 Q214 -16 218 -2 Q212 10 188 14 L104 18 Q92 34 50 38 Q-40 46 -92 32 Q-114 26 -118 6Z':'M-118 6 Q-104 -34 -30 -44 Q56 -48 96 -36 Q110 -30 124 -32 Q146 -32 164 -20 Q182 -12 186 -2 Q180 6 160 9 L122 12 Q110 32 60 38 Q-40 46 -92 32 Q-114 26 -118 6Z',grad(c,P,a,b,-46,42),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-120 22 Q-20 34 62 24 Q100 18 124 10 L190 8 L190 50 L-120 50Z',P(b,.05,.9));
 if(!low){skin(c,body,P,a,r.seed,200);for(let i=0;i<46;i++)ellipse(c,-100+((i*37)%100)/100*260,-38+((i*53)%100)/100*42,2+(i%3),1.4+(i%2)*.8,P(a,-.2,.4));for(let i=0;i<5;i++)path(c,`M${96+i*7} -32 q-4 22 -2 40`,null,P(a,-.3,.32),.8);}
 c.restore();
 flip(-40,22,-.62,false);flip(52,26,-.56,false);
 if(KR){faceLine(c,P,'M218 1 Q180 11 104 10',P('#14202a'),1.6);teeth(c,P,{x0:110,y0:9.6,x1:214,y1:2.2},{type:'fang',size:5.4,color:'#efe7cb'});teeth(c,P,{x0:116,y0:10.4,x1:208,y1:4.4,upper:false},{type:'fang',size:4.6,color:'#efe7cb'});
  path(c,'M118 -40 Q138 -48 158 -34 Q138 -38 118 -40Z',P(a,-.18));ellipse(c,204,-12,1.9,1.2,P('#14202a',0,.8));eye(c,134,-30,P,3.4,{iris:'#b89c52'});return;}
 faceLine(c,P,'M186 0 Q160 7 118 6',P('#14202a'),1.4);
 teeth(c,P,{x0:124,y0:5.8,x1:182,y1:1.2},{type:'fang',size:4,color:'#efe7cb'});
 teeth(c,P,{x0:128,y0:6.4,x1:178,y1:3,upper:false},{type:'fang',size:3.4,color:'#efe7cb'});
 path(c,'M122 -30 Q136 -36 150 -24 Q136 -28 122 -30Z',P(a,-.18));ellipse(c,172,-9,1.7,1.1,P('#14202a',0,.8));
 eye(c,136,-23,P,3.2,{iris:'#b89c52'});
}
// Pterodactylus antiquus: a small Late Jurassic pterosaur, wingspan about 1 m. A long narrow jaw with small teeth, a low
// soft crest, a coat of fine fibres, wings of skin stretched from one very long finger, and a very short tail.
function pterosaur(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim*1.3)*9,toothless=r.species!=='pterodactylus';
 const wing=(far)=>{const col=far?farPalette(P):P,sx=10,sy=-10,wx=26,wy=-58+f*.3,ex=-114,ey=-80+f,ax=-22,ay=12;
  c.save();c.translate(sx,sy);c.rotate(far?.3:0);c.translate(-sx,-sy);
  const m=path(c,`M${sx} ${sy} L${wx} ${wy} Q-44 ${wy-32+f*.6} ${ex} ${ey} Q-50 ${-36+f*.5} ${ax} ${ay} Q-4 8 ${sx} ${sy}Z`,col(a,far?-.04:.12,.84),P(a,-.45),.8);
  if(!low){c.save();c.clip(m);for(let i=1;i<12;i++){const u=i/12;line(c,[[wx+(ex-wx)*u,wy-14*Math.sin(u*3.1)+(ey-wy)*u],[ax+(ex-ax)*u*.94,ay+(ey-ay)*u*.86]],P(a,-.3,.2),.5);}ellipse(c,-34,-44+f*.5,48,12,P('#ffffff',0,.07),-.2);c.restore();}
  line(c,[[sx,sy],[wx,wy]],col(a,-.08),4.5);ellipse(c,wx,wy,2.6,2.6,col(a,-.05));path(c,`M${wx} ${wy} Q-44 ${wy-32+f*.6} ${ex} ${ey}`,null,col(a,-.16),2.6);path(c,`M${wx} ${wy} l5 -6 M${wx} ${wy} l7 -3 M${wx} ${wy} l7 1`,null,col(a,-.22),1.1);
  c.restore();};
 wing(true);
 path(c,'M-16 4 Q-44 2 -56 12',null,P(a,-.1),5);path(c,'M-12 8 Q-30 26 -48 28 l-6 6 M-48 28 l-8 1',null,P(a,-.15),3);
 const body=path(c,'M-24 6 Q-22 -16 8 -20 Q30 -20 36 -6 Q32 12 6 16 Q-18 16 -24 6Z',grad(c,P,a,b,-20,16),P(a,-.45),.7);
 const neck=path(c,'M26 -16 Q52 -34 72 -40 L78 -28 Q54 -18 34 2Z',grad(c,P,a,b,-40,2),P(a,-.45),.6);
 if(!low){skin(c,body,P,a,r.seed,40);for(const [sh,n2] of [[body,70],[neck,30]]){c.save();c.clip(sh);for(let i=0;i<n2;i++){const x=-26+((i*37)%100)/100*108,y=-44+((i*53)%100)/100*62;line(c,[[x,y],[x-3.5,y+2]],P(a,i%2?.3:-.28,.55),.7);}c.restore();}}
 wing(false);
 path(c,'M66 -46 Q78 -58 94 -50 Q88 -46 80 -44Z',P(b,.05,.9),P(a,-.4),.6);
 if(r.species==='pteranodon')path(c,'M70 -44 Q40 -70 14 -80 Q46 -80 82 -50Z',P(b,.02,.95),P(a,-.4),.7);
 if(r.species==='quetzalcoatlus')path(c,'M72 -46 Q84 -82 104 -86 Q100 -64 90 -47Z',P(b,.02,.95),P(a,-.4),.7);
 const head=path(c,'M64 -38 Q74 -50 92 -46 Q120 -40 142 -31 Q124 -28 94 -28 Q74 -26 64 -38Z',grad(c,P,a,b,-50,-26),P(a,-.45),.7);if(!low)skin(c,head,P,a,r.seed+3,14);
 faceLine(c,P,'M140 -31 Q116 -33 88 -33',P('#2a2018',0,.72),1);
 if(!toothless)teeth(c,P,{x0:102,y0:-32.4,x1:136,y1:-31},{type:'peg',size:1.3,color:'#f1eadb'});
 eye(c,84,-41,P,2.3,{iris:'#c98a2e'});
 helmet(c,99,-38,47,P);
}
// Hoofed animals with shaped legs (shoulder, knee, hock, hoof). Okapi: a chocolate coat, white-striped legs and rump, a
// pale face and big ears. Giraffe: a very long neck, patchwork coat, sloping back and furred ossicones. Bison: a huge
// shoulder hump, a heavy dark head, short horns and a beard. White-tailed doe: slim, with no antlers. Shetland pony: small, stocky, with a thick mane.
const UNGULATE={okapi:{L:58,H:25,neck:40,head:13,snout:21,leg:1.55,ears:'big',oss:true,mark:'okapi'},giraffe:{L:54,H:26,neck:118,head:11,snout:19,leg:2.05,slope:true,ears:'mid',oss:'tall',mark:'giraffe'},bison:{L:66,H:34,neck:10,head:21,snout:10,leg:.72,hump:true,horns:true,ears:'mid',mark:'bison',low:true},white_tailed_deer:{L:52,H:20,neck:32,head:11,snout:16,leg:1.75,ears:'big',mark:'deer'},shetland_pony:{L:52,H:26,neck:24,head:14,snout:18,leg:.92,ears:'mid',mark:'pony'},
 highland_cow:{L:62,H:31,neck:12,head:19,snout:16,leg:.78,horns:'wide',ears:'mid',mark:'highland',low:true},
 elk:{L:58,H:26,neck:36,head:13,snout:18,leg:1.6,ears:'mid',mark:'elk',antlers:true},
 unicorn:{L:54,H:25,neck:28,head:14,snout:19,leg:1.2,ears:'mid',mark:'pony',horn:true},
 twilight_sparkle:{L:50,H:25,neck:26,head:15,snout:16,leg:1.1,ears:'mid',mark:'pony',horn:true,wings:true,star:true},
 greater_kudu:{L:58,H:26,neck:34,head:12,snout:18,leg:1.55,ears:'big',horns:'spiral',mark:'kudu'},
 kirks_dik_dik:{L:30,H:14,neck:18,head:9,snout:13,leg:1.35,ears:'big',horns:'spike',mark:'deer'},
 // Southern pudu (Pudu puda): one of the two smallest deer (only the northern pudu is smaller), about 35-44 cm at the
 // shoulder: round-backed and short-legged, with small
 // round ears, short spike antlers on the male, and a thick reddish-brown coat.
 pudu:{L:32,H:17,neck:13,head:10,snout:10,leg:.95,ears:'mid',horns:'spike',mark:'deer'}};
function ungulate(c,r,p,P,low){
 const id=r.species,k=UNGULATE[id],a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*5,L=k.L,H=k.H,K='#241b16';
 const top=-H,chest=H*.72,legLen=H*k.leg*1.25,leg0=H*.45;
 const sx=L*.7,sy=k.hump?-H*1.05:-H*.8,ang=k.low?.15:-1.02+(k.neck>60?-.22:0),nx=sx+Math.cos(ang)*k.neck*(k.low?1.6:1.05),ny=sy+Math.sin(ang)*k.neck*(k.low?1.6:1.05)+(k.low?H*.3:0),hx=nx+k.head*.3,hy=ny-k.head*(k.low?.1:.25);
 // Tail.
 const tx=-L*.98,ty=-H*.55;
 if(k.mark==='pony'){for(let i=0;i<10;i++)path(c,`M${tx+6} ${ty} Q${tx-16} ${ty+12+i*2+sw} ${tx-20+i*1.5} ${ty+H*1.6+i*2+sw}`,null,k.star&&(i===4||i===5)?P(i===4?'#ee4d94':'#9a5ac8'):P(b,-.25+(i%3)*.08),2.8);}
 else if(id==='white_tailed_deer'){path(c,`M${tx+4} ${ty-2} Q${tx-16} ${ty-14+sw} ${tx-18} ${ty+4+sw} Q${tx-6} ${ty+8} ${tx+6} ${ty+6}Z`,P('#f7f3e8'),P(a,-.3),.6);path(c,`M${tx+3} ${ty-2} Q${tx-12} ${ty-13+sw} ${tx-16} ${ty-6+sw}`,null,P(a),3);}
 else{path(c,`M${tx+4} ${ty} Q${tx-16} ${ty+8+sw} ${tx-20} ${ty+H*.9+sw}`,null,P(a,-.15),2.6);ellipse(c,tx-20,ty+H*1.05+sw,3.2,7,P(id==='bison'?K:'#2a2420'));}
 // Legs: shaped, with knees or hocks; the far pair a shade darker and behind.
 const limb=(x,front,far,i)=>{const q=Math.sin(p.swim+i*1.7)*.2,kneeY=leg0+legLen*.52,footY=leg0+legLen,kx=x+(front?1.5:-5)+Math.sin(q)*5,fx=x+(front?3:-2)+Math.sin(q)*11,w=id==='bison'?10:k.leg>1.5?6:8;
  const col=far?P(a,-.3):grad(c,P,a,a,leg0,footY);
  const leg=path(c,`M${x-w*1.5} ${leg0-8} Q${x-w*1.3} ${kneeY-8} ${kx-w*.62} ${kneeY} Q${kx-w*.45} ${(kneeY+footY)/2} ${fx-w*.45} ${footY-3} L${fx+w*.45} ${footY-3} Q${kx+w*.45} ${(kneeY+footY)/2} ${kx+w*.62} ${kneeY} Q${x+w*1.3} ${kneeY-8} ${x+w*1.5} ${leg0-8}Z`,col);
  if(!low){c.save();c.clip(leg);if(k.mark==='okapi')for(let j=0;j<5;j++){const y=leg0+j*legLen*.17;path(c,`M${x-w*2} ${y} Q${x} ${y+6} ${x+w*2} ${y-2} L${x+w*2} ${y+.6} Q${x} ${y+8.6} ${x-w*2} ${y+2.6}Z`,P('#f4efe2',far?-.25:0,.95));}if(k.mark==='okapi')ellipse(c,fx,footY-w,w*.9,w*1.2,P('#f4efe2',far?-.25:0));if(k.mark==='bison')for(let j=0;j<14;j++)line(c,[[x-w+j*1.4,leg0],[x-w+j*1.4-2,leg0+10+j%3*3]],P(K,0,.5),1);c.restore();}
  path(c,`M${fx-w*.55} ${footY-3} L${fx+w*.62} ${footY-3} L${fx+w*.78} ${footY+3} L${fx-w*.7} ${footY+3}Z`,P(far?'#1a1512':'#2b2622'),P('#000',0,.3),.4);line(c,[[fx+w*.05,footY-2.5],[fx+w*.1,footY+3]],P('#000',0,.35),.6);};
 limb(-L*.56,false,true,0);limb(L*.52,true,true,1);limb(-L*.68,false,false,2);limb(L*.4,true,false,3);
 // Body: hip and shoulder masses with a waist; the giraffe's back slopes down to the tail, the bison's rises to a hump.
 const hipY=k.slope?-H*.55:top*.92,shY=k.slope?-H*1.5:k.hump?-H*1.7:-H*1.08,midY=k.slope?-H*.92:k.hump?-H*.92:top*.84;
 const body=path(c,`M${-L*1.02} ${-H*.05} C${-L*1.06} ${hipY*.9} ${-L*.8} ${hipY*1.12} ${-L*.5} ${hipY} C${-L*.2} ${midY} ${L*.1} ${midY} ${L*.3} ${(midY+shY)/2} C${L*.45} ${shY} ${L*.72} ${shY} ${L*.9} ${shY*.8} C${L*1.06} ${shY*.5} ${L*1.06} ${H*.05} ${L*.92} ${chest*.66} C${L*.72} ${chest} ${L*.5} ${chest} ${L*.25} ${chest*.86} C${-L*.1} ${chest*.74} ${-L*.45} ${chest*.86} ${-L*.72} ${chest*.74} C${-L*.96} ${chest*.6} ${-L*1.0} ${H*.2} ${-L*1.02} ${-H*.05}Z`,grad(c,P,a,b,-H*1.2,H),P(a,-.45),.7);
 c.save();c.clip(body);
 if(k.mark==='okapi'){for(let i=0;i<6;i++){const x=-L*1.02+i*L*.13,w=L*.04;path(c,`M${x} ${-H*1.3} Q${x+4} ${-H*.1} ${x-3} ${H} L${x+w} ${H} Q${x+w+4} ${-H*.1} ${x+w} ${-H*1.3}Z`,P('#f4efe2',0,.94));}ellipse(c,0,H*.85,L*.8,H*.2,P(a,-.2,.6));path(c,`M${L*.5} ${H*.9} Q${L*.7} ${H*.3} ${L*.92} ${H*.6} L${L*.9} ${H} Z`,P('#f4efe2',0,.5));}
 if(k.mark==='giraffe')for(let i=0;i<34;i++){const x=-L*1.05+(i%7)*L*.3+(Math.floor(i/7)%2)*L*.15,y=-H*1.55+Math.floor(i/7)*H*.48,q=i*2.3;const pts=Array.from({length:6},(_,j)=>{const t=j/6*TAU+q,R=(L*.11)*(.86+.16*Math.sin(j*2.3+i));return[x+Math.cos(t)*R,y+Math.sin(t)*R*.86];});path(c,'M'+pts.map(q=>q.join(' ')).join(' L')+'Z',P('#7e4a22',0,.95),P(b,.1,.4),.6);}
 if(k.mark==='bison'){path(c,`M${L*.02} ${-H*2.2} Q${-L*.08} ${-H*.3} ${L*.14} ${H*1.1} L${L*1.2} ${H*1.1} L${L*1.2} ${-H*2.2}Z`,P(K,.02,.88));if(!low)for(let i=0;i<140;i++){const x=L*.05+((i*37)%100)/100*L*1.05,y=-H*1.7+((i*53)%100)/100*H*2.6;line(c,[[x,y],[x-3,y+7]],P(i%2?a:b,i%3?-.1:.2,.65),1.2);}}
 if(k.mark==='deer'){ellipse(c,0,H*.95,L*.85,H*.42,P(b,.05,.85));if(!low)for(let i=0;i<70;i++){const x=-L+((i*37)%100)/100*L*1.95,y=-H*1.1+((i*53)%100)/100*H*1.4;line(c,[[x,y],[x-2.6,y+2.4]],P(a,i%2?.2:-.25,.55),.7);}}
 if(k.mark==='kudu')for(let i=0;i<9;i++){const x=-L*.9+i*L*.2;path(c,`M${x} ${-H*1.35} Q${x+3} ${-H*.4} ${x-2} ${H*.6}`,null,P('#f7f3e8',0,.9),2.2);}
 if(k.mark==='elk'){ellipse(c,-L*.85,-H*.25,L*.36,H*.9,P(b,.12,.92));ellipse(c,L*.75,-H*.3,L*.32,H*1.1,P(a,-.3,.75));}
 if(k.mark==='highland'&&!low)for(let i=0;i<150;i++){const x=-L*1.05+((i*37)%100)/100*L*2.1,y=-H*1.25+((i*53)%100)/100*H*2;path(c,`M${x} ${y} q-2 9 -5 15`,null,P(i%2?a:b,i%3?-.12:.15,.8),1.8);}
 // Twilight Sparkle (requested by name, owner 2026-11-10): a lavender unicorn pony with wings, a dark blue mane with a pink stripe, and her six-pointed star mark.
 if(k.star){c.save();c.translate(-L*.6,-H*.05);ellipse(c,0,0,H*.32,H*.32,P('#ee4d94',0,.0));for(let q=0;q<6;q++){const an=q/6*TAU;path(c,`M0 0 L${Math.cos(an-.25)*H*.12} ${Math.sin(an-.25)*H*.12} L${Math.cos(an)*H*.36} ${Math.sin(an)*H*.36} L${Math.cos(an+.25)*H*.12} ${Math.sin(an+.25)*H*.12}Z`,P('#ee4d94'));}ellipse(c,0,0,H*.08,H*.08,P('#ffffff'));c.restore();}
 if(k.mark==='pony'){ellipse(c,-L*.05,H*.8,L*.75,H*.3,P(b,.12,.45));if(!low)for(let i=0;i<70;i++){const x=-L+((i*37)%100)/100*L*1.95,y=-H*1.2+((i*53)%100)/100*H*1.8;line(c,[[x,y],[x-2.4,y+3.4]],P(a,i%2?.2:-.25,.5),.8);}}
 if(!low&&k.mark!=='okapi'&&k.mark!=='bison')skin(c,body,P,a,r.seed,70);if(!low&&k.mark==='okapi')skin(c,body,P,a,r.seed,30);
 c.restore();
 // Neck, then head. Bison carry the head low in front of the hump.
 const nA=[sx-L*.25,sy+H*.05],nB=[nx-k.head*.65,ny-k.head*.3],nC=[nx+k.head*.45,ny+k.head*.55],nD=[sx+L*.3,sy+H*1.25],nQ=[sx+L*.4,sy+H*.9],neck=path(c,`M${nA} Q${(nA[0]+nB[0])/2+6} ${(nA[1]+nB[1])/2-3} ${nB} L${nC} Q${nQ} ${nD}Z`,grad(c,P,a,k.mark==='giraffe'?b:a,ny,sy+H));
 c.save();c.clip(neck);if(k.mark==='giraffe')for(let i=0;i<20;i++){const u=i/19,x=sx-L*.1+(nx-sx+L*.1)*u+(i%2?5:-5),y=sy+(ny-sy)*u;const pts=Array.from({length:6},(_,j)=>{const t=j/6*TAU+i*.7,R=7*(.9+.14*Math.sin(j*2+i));return[x+Math.cos(t)*R,y+Math.sin(t)*R*.9];});path(c,'M'+pts.map(q=>q.join(' ')).join(' L')+'Z',P('#7e4a22',0,.95));}if(!low)skin(c,neck,P,a,r.seed+4,24);c.restore();
 if(k.neck>30)path(c,`M${nA} Q${(nA[0]+nB[0])/2+6} ${(nA[1]+nB[1])/2-3} ${nB} M${nC} Q${nQ} ${nD}`,null,P(a,-.45),.6);
 if(k.mark==='giraffe')for(let i=0;i<22;i++){const u=i/21,x=nA[0]+(nB[0]-nA[0])*u+6*(1-Math.abs(2*u-1)),y=nA[1]+(nB[1]-nA[1])*u-3*(1-Math.abs(2*u-1));line(c,[[x,y],[x-3.4,y-3.4]],P('#6a4a2c',-.1,.9),2.6);}
 if(k.mark==='pony')for(let i=0;i<16;i++){const u=i/15,x=sx-L*.2+(nx-sx+L*.2)*u,y=sy+(ny-sy)*u-4;path(c,`M${x} ${y} Q${x+2} ${y+12} ${x+7} ${y+22+(i%3)*3}`,null,P(b,-.2+(i%3)*.08),3.2);}
 if(k.mark==='bison')for(let i=0;i<14;i++)path(c,`M${hx+k.head*.3+i*1.4} ${hy+k.head*.5} q-2 ${10+i%3*4} -1 ${16+i%3*5}`,null,P(K,.05),2.6);
 const hd=k.head,sn=k.snout,earX=hx-hd*.72,earY=hy-hd*.72;
 const earShape=(dx,far)=>{const big=k.ears==='big',ex=earX+dx,ey=earY,l=hd*(big?1.2:.85),w=hd*(big?.55:.34);c.save();c.translate(ex,ey);c.rotate(big?-.75:-.5);path(c,`M${-w} 0 Q${-w} ${-l*.8} 0 ${-l} Q${w} ${-l*.8} ${w} 0Z`,P(a,far?-.25:-.05),P(a,-.45),.5);path(c,`M${-w*.55} -1 Q${-w*.55} ${-l*.7} 0 ${-l*.84} Q${w*.55} ${-l*.7} ${w*.55} -1Z`,P(id==='okapi'?'#d9b8a4':'#e8c4b0',far?-.2:0,.85));c.restore();};
 earShape(-hd*.1,true);
 if(k.oss)for(const dx of [hd*.05,hd*.45]){const h=k.oss==='tall'?hd*1.15:hd*.75;path(c,`M${hx+dx-2.4} ${hy-hd*.82} L${hx+dx-1.6} ${hy-hd*.82-h} L${hx+dx+1.6} ${hy-hd*.82-h} L${hx+dx+2.4} ${hy-hd*.82}Z`,P(a,.04),P(a,-.4),.5);ellipse(c,hx+dx,hy-hd*.82-h,2.8,2.2,P(k.oss==='tall'?'#2a2420':a,-.25));}
 if(k.horns==='wide')for(const s2 of [-1,1]){const x=hx-hd*.2+s2*hd*.4,y=hy-hd*.72;path(c,`M${x-3} ${y+2} Q${x+s2*hd*1.2} ${y-2} ${x+s2*hd*1.7} ${y-hd*1.05} Q${x+s2*hd*.95} ${y-hd*.4} ${x+3} ${y-4}Z`,P('#e8dcc0'),P('#6a5a44',0,.5),.6);ellipse(c,x+s2*hd*1.66,y-hd,1.8,1.8,P('#3a332a'));}
 if(k.horns==='spiral')for(const dx of [-hd*.25,hd*.2]){let d=`M${hx+dx} ${hy-hd*.75}`;for(let i=1;i<=14;i++){const u=i/14;d+=` L${hx+dx-hd*1.1*u+Math.sin(u*12)*hd*.22} ${hy-hd*.75-hd*2.6*u}`;}path(c,d,null,P('#3b3026'),2.4);}
 if(k.horns==='spike')for(const dx of [-hd*.2,hd*.2])path(c,`M${hx+dx-1.6} ${hy-hd*.8} L${hx+dx-2} ${hy-hd*1.9} L${hx+dx+1.6} ${hy-hd*.8}Z`,P('#3b342c'));
 if(k.antlers)for(const dx of [-hd*.25,hd*.2]){const x=hx+dx,y=hy-hd*.8,pt=(u)=>[x-(2*u*(1-u)*1.1+u*u*2.3)*hd,y-(2*u*(1-u)*1.5+u*u*2.3)*hd];path(c,`M${x} ${y} Q${x-hd*1.1} ${y-hd*1.5} ${x-hd*2.3} ${y-hd*2.3}`,null,P('#c2a67a'),3.4);for(const [u,l] of [[.2,1],[.42,1.1],[.64,.95],[.84,.7]]){const [bx,by]=pt(u);line(c,[[bx,by],[bx+hd*.3,by-hd*.9*l]],P('#d6c39c'),2.4);}}
 if(k.horn){const x=hx+hd*.4,y=hy-hd*.82;path(c,`M${x-3.2} ${y+3} L${x+hd*.55} ${y-hd*1.8} L${x+3.2} ${y+3}Z`,P('#f3d98a'),P('#b79a4f'),.6);for(let i=1;i<5;i++)line(c,[[x-3+i*.9,y-i*hd*.34],[x+3-i*.3,y-i*hd*.34-3]],P('#b79a4f',0,.8),.8);}
 if(k.horns===true)for(const dx of [-hd*.5,hd*.2])path(c,`M${hx+dx-3} ${hy-hd*.72} Q${hx+dx-7} ${hy-hd*1.5} ${hx+dx+5} ${hy-hd*1.7} Q${hx+dx+1} ${hy-hd*1.28} ${hx+dx+4} ${hy-hd*.72}Z`,P('#3b342c'),P('#000',0,.3),.5);
 const head=path(c,`M${hx-hd} ${hy-hd*.1} Q${hx-hd*.9} ${hy-hd} ${hx} ${hy-hd*.95} Q${hx+hd*.8} ${hy-hd*.82} ${hx+hd+sn*.86} ${hy+hd*.15} Q${hx+hd+sn*.98} ${hy+hd*.65} ${hx+hd+sn*.62} ${hy+hd*.82} Q${hx+hd*.4} ${hy+hd*.92} ${hx-hd*.55} ${hy+hd*.8} Q${hx-hd} ${hy+hd*.5} ${hx-hd} ${hy-hd*.1}Z`,grad(c,P,a,b,hy-hd,hy+hd),P(a,-.45),.7);
 c.save();c.clip(head);
 if(k.mark==='okapi'){path(c,`M${hx-hd*1.1} ${hy+hd*1.1} L${hx+hd*.1} ${hy-hd*.5} L${hx+hd+sn} ${hy+hd*.1} L${hx+hd+sn} ${hy+hd*1.1}Z`,P('#efe6d6',0,.95));ellipse(c,hx+hd+sn*.8,hy+hd*.3,hd*.45,hd*.5,P(K,0,.6));}
 if(k.mark==='giraffe'){for(let i=0;i<5;i++)ellipse(c,hx-hd*.4+i*hd*.32,hy-hd*.4+(i%2)*hd*.4,hd*.15,hd*.12,P('#7e4a22',0,.8));ellipse(c,hx+hd+sn*.6,hy+hd*.5,hd*.8,hd*.45,P('#f4e7c8',0,.7));}
 if(k.mark==='bison'){ellipse(c,hx-hd*.2,hy-hd*.5,hd*.95,hd*.7,P(K,.05,.88));if(!low)for(let i=0;i<40;i++){const x=hx-hd+((i*37)%100)/100*hd*1.5,y=hy-hd+((i*53)%100)/100*hd;line(c,[[x,y],[x-1.5,y+4]],P(a,i%2?-.1:.2,.6),.9);}ellipse(c,hx+hd+sn*.55,hy+hd*.45,hd*.5,hd*.4,P(K,0,.65));}
 if(k.mark==='deer'){ellipse(c,hx+hd*.4,hy-hd*.34,hd*.42,hd*.2,P('#f7f1e4',0,.85),.2);ellipse(c,hx+hd+sn*.72,hy+hd*.6,hd*.8,hd*.3,P('#f7f1e4',0,.95));ellipse(c,hx+hd+sn*.86,hy+hd*.32,hd*.34,hd*.26,P(K,0,.85));}
 if(k.mark==='pony'){path(c,`M${hx-hd*.2} ${hy-hd} Q${hx+hd*.4} ${hy-hd*.3} ${hx+hd*.2} ${hy+hd*.5} L${hx+hd*.5} ${hy+hd*.5} Q${hx+hd*.7} ${hy-hd*.3} ${hx+hd*.1} ${hy-hd}Z`,P('#f4efe2',0,.92));ellipse(c,hx+hd+sn*.62,hy+hd*.55,hd*.7,hd*.5,P(b,.1,.6));}
 if(k.mark==='highland')for(let i=0;i<14;i++)path(c,`M${hx-hd*.7+i*hd*.12} ${hy-hd} Q${hx-hd*.5+i*hd*.13} ${hy-hd*.5} ${hx-hd*.35+i*hd*.14} ${hy-hd*.02+(i%3)*2}`,null,P(b,-.12+(i%3)*.1),3);
 if(!low)skin(c,head,P,a,r.seed+6,24);
 c.restore();
 if(k.mark==='pony')for(let i=0;i<7;i++)path(c,`M${hx-hd*.3+i*2.2} ${hy-hd*.9} Q${hx+hd*.1+i*2.5} ${hy-hd*.5} ${hx+hd*.2+i*2.5} ${hy-hd*.1+(i%2)*3}`,null,P(b,-.2+(i%3)*.08),2.4);
 earShape(hd*.1,false);
 ellipse(c,hx+hd+sn*.74,hy+hd*.22,2,1.5,P('#1a1512',0,.85));
 faceLine(c,P,`M${hx+hd+sn*.88} ${hy+hd*.55} Q${hx+hd+sn*.55} ${hy+hd*.78} ${hx+hd+sn*.2} ${hy+hd*.62}`,P('#1a1512',0,.6));
 eye(c,hx+hd*.15,hy-hd*.26,P,id==='okapi'||id==='white_tailed_deer'?2.5:2.3,{iris:'#3a2618'});
 helmet(c,hx+sn*.36,hy+hd*.05,hd*1.45+sn*.62,P);
 if(k.wings){const f=Math.sin(p.swim)*6;path(c,`M${-L*.1} ${-H*.7} Q${-L*.3} ${-H*2.2-f} ${-L*.95} ${-H*1.9-f} Q${-L*.7} ${-H*1.5-f} ${-L*.85} ${-H*1.25-f*.6} Q${-L*.55} ${-H*1.1} ${-L*.62} ${-H*.8} Q${-L*.35} ${-H*.75} ${-L*.1} ${-H*.7}Z`,P(a,.05),P(a,-.35),.8);for(let q=0;q<3;q++)path(c,`M${-L*(.2+q*.15)} ${-H*.8} Q${-L*(.4+q*.15)} ${-H*(1.4+q*.1)-f*.6} ${-L*(.6+q*.12)} ${-H*(1.6+q*.08)-f*.8}`,null,P(a,-.2,.6),1);}
}
// Common wombat (Vombatus ursinus): a barrel of a burrower, with a broad bare nose, short strong legs and digging claws.
// Honey badger (Mellivora capensis): low and long, black below with a silver-white mantle from the crown to the tail.
const BURROWER={wombat:{L:62,H:30,head:21,ears:'small',claws:true},honey_badger:{L:66,H:20,head:15,ears:'tiny',claws:true,mantle:true}};
function burrower(c,r,p,P,low){
 const id=r.species,k=BURROWER[id],a=r.colors.primary,b=r.colors.secondary,L=k.L,H=k.H,hd=k.head,K='#1a1512',step=Math.sin(p.swim)*4;
 if(k.mantle)path(c,`M${-L*.98} ${-H*.5} Q${-L*1.2} ${-H*.8+step} ${-L*1.36} ${-H*.4+step}`,null,P(b,-.1),7);
 const foot=(x,far,i)=>{const q=Math.sin(p.swim+i*1.7)*5,y0=H*.5,y1=H*.5+H*.75;path(c,`M${x-11} ${y0-5} Q${x-11} ${y1-6} ${x-7+q} ${y1} L${x+9+q} ${y1} Q${x+11} ${y1-6} ${x+11} ${y0-5}Z`,far?P(id==='wombat'?a:a,-.3):grad(c,P,a,a,y0,y1));if(k.claws)for(let t=0;t<4;t++)path(c,`M${x-3+t*3.6+q} ${y1-1} q3 2 4 6`,null,P('#e0d6be',0,far?.6:.95),1.6);};
 foot(-L*.56,true,0);foot(L*.5,true,1);foot(-L*.66,false,2);foot(L*.38,false,3);
 const body=path(c,`M${-L*1.02} ${H*.15} C${-L*1.04} ${-H*.9} ${-L*.6} ${-H*1.12} ${-L*.1} ${-H*1.08} C${L*.4} ${-H*1.06} ${L*.86} ${-H*.86} ${L*.98} ${-H*.32} C${L*1.04} ${H*.28} ${L*.8} ${H*.68} ${L*.3} ${H*.68} C${-L*.2} ${H*.74} ${-L*.8} ${H*.78} ${-L*1.02} ${H*.15}Z`,grad(c,P,a,id==='wombat'?b:a,-H*1.1,H*.8),P(a,-.45),.7);
 c.save();c.clip(body);
 if(k.mantle){path(c,`M${-L*1.1} ${-H*1.3} L${L*1.2} ${-H*1.3} L${L*1.2} ${-H*.4} Q${L*.5} ${-H*.2} ${L*.05} ${-H*.02} Q${-L*.5} ${H*.05} ${-L*1.1} ${-H*.1}Z`,grad(c,P,b,b,-H*1.1,0));}
 if(!low){skin(c,body,P,a,r.seed,60);for(let i=0;i<130;i++){const x=-L+((i*37)%100)/100*L*2,y=-H*1.1+((i*53)%100)/100*H*1.8;line(c,[[x,y],[x-3.5,y+3]],k.mantle&&y<-H*.2?P(i%2?'#ffffff':'#8a8680',0,.42):P(a,i%2?.32:-.3,.5),.9);}}
 c.restore();
 const hx=L*.96,hy=-H*.42,sn=k.mantle?7:8;
 for(const dx of [-hd*.6,-hd*.1]){if(k.ears==='small'){ellipse(c,hx+dx,hy-hd*.82,hd*.25,hd*.28,P(a,-.2));ellipse(c,hx+dx,hy-hd*.8,hd*.13,hd*.16,P('#caa892',0,.7));}else ellipse(c,hx+dx,hy-hd*.62,hd*.14,hd*.12,P(K));}
 const head=path(c,`M${hx-hd} ${hy} Q${hx-hd} ${hy-hd} ${hx} ${hy-hd*.95} Q${hx+hd*.8} ${hy-hd*.9} ${hx+hd+sn*.7} ${hy+hd*.05} Q${hx+hd+sn*.9} ${hy+hd*.55} ${hx+hd*.8} ${hy+hd*.82} Q${hx-hd*.5} ${hy+hd} ${hx-hd} ${hy}Z`,grad(c,P,a,k.mantle?a:b,hy-hd,hy+hd),P(a,-.45),.7);
 c.save();c.clip(head);if(k.mantle)path(c,`M${hx-hd*1.1} ${hy-hd*1.1} L${hx+hd*1.25} ${hy-hd*1.1} L${hx+hd*.7} ${hy-hd*.5} Q${hx} ${hy-hd*.3} ${hx-hd*1.1} ${hy+hd*.05}Z`,grad(c,P,b,b,hy-hd,hy));if(!low){skin(c,head,P,a,r.seed+3,24);for(let i=0;i<34;i++){const x=hx-hd+((i*37)%100)/100*hd*1.8,y=hy-hd+((i*53)%100)/100*hd*1.5;line(c,[[x,y],[x-2,y+2.2]],P(k.mantle&&y<hy-hd*.3?'#ffffff':a,.2,.35),.7);}}c.restore();
 if(id==='wombat'){path(c,`M${hx+hd*.7} ${hy-hd*.1} Q${hx+hd+sn*.7} ${hy-hd*.2} ${hx+hd+sn*.82} ${hy+hd*.3} Q${hx+hd+sn*.5} ${hy+hd*.7} ${hx+hd*.7} ${hy+hd*.42}Z`,P(K,.08),P(K),.5);ellipse(c,hx+hd+sn*.5,hy+hd*.1,1.8,1.2,P('#000',0,.8));ellipse(c,hx+hd*.9,hy+hd*.02,3,1.6,P('#ffffff',0,.14));}
 else ellipse(c,hx+hd+sn*.6,hy+hd*.08,2.6,2,P(K));
 faceLine(c,P,`M${hx+hd+sn*.6} ${hy+hd*.52} Q${hx+hd*.9} ${hy+hd*.74} ${hx+hd*.45} ${hy+hd*.55}`,P(K,0,.65));
 eye(c,hx+hd*.34,hy-hd*.3,P,id==='wombat'?2.2:2.1,{iris:'#2c2018'});
 helmet(c,hx+sn*.42,hy,hd*1.5+sn*.55,P);
}
// Leopard gecko (Eublepharis macularius): a chunky desert lizard, stout enough to store fat in its thick carrot of a
// tail. Yellow with black spots, bumpy skin, true eyelids (rare in geckos), and a smiling mouth line.
function gecko(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*6,K='#20191a';
 const leg=(x,y,far,i)=>{const q=Math.sin(p.swim+i*1.7)*5,c0=far?P(a,-.28):P(a,-.04);path(c,`M${x} ${y} Q${x-4+q} ${y+14} ${x-10+q} ${y+22}`,null,c0,7);for(let t=0;t<5;t++)path(c,`M${x-10+q} ${y+22} q${-4+t*2.4} 3 ${-5+t*3.6} ${6+Math.abs(t-2)*.3}`,null,c0,2);};
 leg(-26,8,true,0);leg(34,10,true,1);
 if(r.species==='chameleon')path(c,'M60 -18 Q74 -52 98 -34 Q104 -22 96 -12Z',P(a,-.08),P(a,-.45),.7);
 const tail=path(c,`M-30 -10 Q-70 ${-20+sw*.5} -112 ${-4+sw} Q-126 ${2+sw} -112 ${8+sw} Q-70 ${24+sw*.5} -30 14Z`,grad(c,P,a,b,-20,24),P(a,-.45),.7);
 const body=path(c,'M-44 2 Q-40 -20 8 -22 Q42 -22 56 -14 L58 10 Q24 22 -30 18 Q-44 14 -44 2Z',grad(c,P,a,b,-22,22),P(a,-.45),.7);
 for(const sh of [tail,body]){c.save();c.clip(sh);ellipse(c,-20,18,100,8,P(b,.1,.85));if(!low){skin(c,sh,P,a,r.seed,60);for(let i=0;i<70;i++){const x=-120+((i*37)%100)/100*178,y=-24+((i*53)%100)/100*38;ellipse(c,x,y,1.5,1.3,P(a,.28,.65));}}if(r.species!=='chameleon'&&r.species!=='komodo_dragon')for(let i=0;i<38;i++){const x=-112+((i*41)%100)/100*170,y=-22+((i*29)%100)/100*30;ellipse(c,x,y,1.7+(i%3)*.8,1.5+(i%3)*.6,P(K,0,.86));}c.restore();}
 leg(-20,10,false,2);leg(40,12,false,3);
 const hx=68,hy=-6,head=path(c,`M${hx-16} ${hy-13} Q${hx+6} ${hy-19} ${hx+24} ${hy-8} Q${hx+34} ${hy-1} ${hx+32} ${hy+6} Q${hx+24} ${hy+14} ${hx+4} ${hy+15} Q${hx-16} ${hy+15} ${hx-18} ${hy+6}Z`,grad(c,P,a,b,hy-18,hy+15),P(a,-.45),.7);
 c.save();c.clip(head);if(!low){skin(c,head,P,a,r.seed+2,24);for(let i=0;i<20;i++)ellipse(c,hx-14+((i*37)%100)/100*44,hy-16+((i*53)%100)/100*24,1.1+(i%3)*.4,1,P(K,0,.72));}c.restore();
 // Bearded dragon (2026-11-13): the spiky 'beard' under its throat, a fringe of spikes along its sides and round its head.
 if(r.species==='bearded_dragon'){path(c,`M${hx-14} ${hy+10} L${hx-10} ${hy+22} L${hx-4} ${hy+14} L${hx+2} ${hy+24} L${hx+8} ${hy+15} L${hx+14} ${hy+22} L${hx+18} ${hy+12} Q${hx+4} ${hy+16} ${hx-14} ${hy+10}Z`,P(a,-.15),P(a,-.45),.6);for(let i=0;i<7;i++)path(c,`M${-10+i*8} -17 l3 -6 l3 6Z`,P(a,-.08),P(a,-.4),.4);for(let i=0;i<4;i++)path(c,`M${hx-14+i*6} ${hy-12+i*.6} l2 -5 l2 5Z`,P(a,-.08),P(a,-.4),.4);}
 faceLine(c,P,`M${hx+31} ${hy+4} Q${hx+16} ${hy+13} ${hx-6} ${hy+8}`,P(K,0,.7));ellipse(c,hx+27,hy-3.6,1.2,.8,P(K,0,.75));
 if(r.species==='komodo_dragon'){const fl=(Math.sin(p.swim*2.2)+1)*.5;if(fl>.55){const L2=10*fl;path(c,`M${hx+31} ${hy+5} L${hx+31+L2} ${hy+5.5} M${hx+31+L2} ${hy+5.5} l4 -2.5 M${hx+31+L2} ${hy+5.5} l4 2.5`,null,P('#e0b04a'),1.4);}if(!low){c.save();c.clip(body);for(let i=0;i<60;i++)ellipse(c,-40+((i*37)%100),-20+((i*53)%100)*.36,1.1,.9,P(a,.2,.5));c.restore();}}
 eye(c,hx+9,hy-6,P,3.3,{slit:true,iris:'#b8a06a'});
 path(c,`M${hx+1.5} ${hy-8} Q${hx+9} ${hy-13} ${hx+16.5} ${hy-8}`,null,P(a,-.2),1.8);
 helmet(c,hx+8,hy-1,34,P);
}
// Mosquito (Aedes aegypti): a humped thorax, a banded abdomen, narrow scaled wings, long legs ringed white, feathery
// antennae and a long piercing proboscis.
function mosquito(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,buzz=Math.sin(p.swim*9)*.2;
 for(const [wx,ang] of [[6,-2.75+buzz],[-4,-2.45-buzz]]){c.save();c.translate(wx,-18);c.rotate(ang);const w=path(c,'M0 -4 Q40 -14 96 -3 Q104 0 96 3 Q40 13 0 4Z',P('#dff0f4',0,.3),P('#e8f6fa',0,.75),.7);if(!low){c.save();c.clip(w);for(let i=0;i<6;i++)line(c,[[3,-3+i*1.2],[98,-5+i*2]],P('#ffffff',0,.35),.4);for(let i=0;i<7;i++)ellipse(c,12+i*12,3,2,1,P(a,0,.5));c.restore();}c.restore();}
 const leg=(x,y,dx,dy,fx,fy,far)=>{const col=far?-.2:0;line(c,[[x,y],[x+dx,y+dy],[x+dx+fx,y+dy+fy]],P(a,col),2.2);if(!low)for(let i=1;i<6;i++){const t=i/6;ellipse(c,x+dx+fx*t,y+dy+fy*t,1.4,1.4,P(b,col+.1));}};
 leg(6,4,-22,26,-30,28,true);leg(14,4,8,26,4,34,true);leg(20,4,26,20,28,34,true);
 const ab=path(c,'M-6 -10 Q-46 -10 -86 2 Q-92 8 -84 12 Q-44 12 -4 8Z',grad(c,P,a,b,-12,14),P(a,-.45),.6);
 c.save();c.clip(ab);for(let i=0;i<7;i++)path(c,`M${-12-i*11} -14 q-3 14 0 28 l3.5 0 q-3 -14 0 -28Z`,P(b,.12,.92));c.restore();
 const th=path(c,'M-10 -6 Q-10 -28 12 -30 Q30 -28 34 -8 Q30 8 10 10 Q-8 10 -10 -6Z',grad(c,P,a,b,-30,10),P(a,-.45),.7);
 c.save();c.clip(th);if(!low){skin(c,th,P,a,r.seed,30);for(let i=0;i<30;i++){const x=-8+((i*37)%100)/100*40,y=-28+((i*53)%100)/100*36;ellipse(c,x,y,.9,.7,P(b,.2,.7));}}path(c,'M8 -30 Q2 -14 8 8 Q12 -14 14 -30Z',P(b,.15,.85));path(c,'M-4 -24 Q0 -14 -2 -4',null,P(b,.15,.75),1.6);c.restore();
 leg(4,6,-26,24,-36,20,false);leg(14,6,6,28,0,38,false);leg(22,6,30,18,34,30,false);
 path(c,'M34 -8 L46 -12 L38 2Z',P(a,-.15));
 const head=path(c,'M36 -14 Q48 -20 56 -12 Q58 -4 50 0 Q40 2 36 -6Z',grad(c,P,a,b,-20,2),P(a,-.45),.6);
 for(const [dy,l] of [[-18,22],[-16,26]]){line(c,[[52,-14],[52+l*.5,dy-8],[52+l,dy-10]],P(a,-.1),1);if(!low)for(let i=1;i<7;i++){const x=52+i*l/7,y=-14+(dy-10+14)*(i/7);path(c,`M${x-2} ${y-3} L${x} ${y} L${x-2} ${y+3}`,null,P(b,0,.6),.45);}}
 path(c,'M56 -6 Q74 -3 92 8',null,P(a,-.2),1.6);ellipse(c,92,8,1.1,.9,P(a,-.1));
 eye(c,49,-10,P,2.8,{iris:'#7a2a2a'});
 helmet(c,58,-8,36,P);
}
// Atlantic puffin (Fratercula arctica): a stocky black-and-white auk with a pale face, a tall striped bill of blue, yellow
// and orange, and bright orange feet; it flies under water with its wings. Sandwich tern (Thalasseus sandvicensis):
// slender, pale, with a shaggy black crest and a long black bill tipped yellow, as if dipped in mustard; it plunge-dives.
Object.assign(AVIAN,{atlantic_puffin:{L:28,H:44,upright:true,beak:'none',beakCol:'#e0782a',flipper:true,water:true,belly:'#f6f3ec',cap:'#1d1f24',legs:'#ee6a2c',mask:'#eceae2',cheek:'#eceae2'},sandwich_tern:{L:44,H:22,beak:'none',tail:'point',water:true,wingtip:'#3f4650',cap:'#16181d'},philippine_hawk_eagle:{L:32,H:46,upright:true,beak:'hook',beakCol:'#3a3632',legs:'#e0b94e',cap:'#6b4e34'}});
AVIAN.bald_eagle={...AVIAN.philippine_hawk_eagle,cap:'#f6f3ec',beakCol:'#e9b23c'};
AVIAN.sulphur_crested_cockatoo={...AVIAN.parrot,beakCol:'#3a3a40',cheek:'#f6f4ee'};
AVIAN.wandering_albatross={L:50,H:22,beak:'none',tail:'point',water:true,wingtip:'#2a2c31',cap:'#f6f3ec'};
AVIAN.phoenix={...AVIAN.philippine_hawk_eagle,cap:'#f2b33c',beakCol:'#f2c94c',legs:'#e0b94e'};
function seabird(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,k=AVIAN[id];
 // The albatross's long narrow wings, dark above, folded along its side.
 if(id==='wandering_albatross'){path(c,`M${k.L*.35} ${-k.H*.32} Q${-k.L*.8} ${-k.H*.4} ${-k.L*2.1} ${-k.H*.08} Q${-k.L*.9} ${k.H*.05} ${k.L*.2} ${k.H*.1}Z`,P(k.wingtip,.05),P('#000',0,.3),.6);if(!low)path(c,`M${k.L*.2} ${-k.H*.12} Q${-k.L*.8} ${-k.H*.16} ${-k.L*1.9} ${-k.H*.06}`,null,P('#f6f3ec',0,.5),1.2);}
 if(id==='sandwich_tern')for(let i=0;i<4;i++)path(c,`M${k.L*.3} ${-k.H*.3} L${-k.L*(1.4+i*.14)} ${-k.H*.05+i*2.4} L${-k.L*.9} ${k.H*.15}Z`,P(i%2?a:'#3f4650',-.05+i*.06,.95));
 avian(c,r,p,P,low);
 const hx=k.upright?k.L*.05:k.L*.85,hy=k.upright?-k.H*.72:-k.H*.55,hr=k.upright?k.L*.55:k.H*.42,bx=hx+hr*.9,by=hy+hr*.05;
 if(id==='atlantic_puffin'){
  c.save();c.beginPath();c.ellipse(k.L*.2,k.H*.12,k.L*.48,k.H*.5,0,0,TAU);c.clip();ellipse(c,k.L*.2,k.H*.12,k.L*.48,k.H*.5,P(k.belly));if(!low)for(let row=0;row<8;row++)for(let col=0;col<6;col++){const x=-k.L*.3+col*k.L*.2+(row%2)*k.L*.1,y=-k.H*.34+row*k.H*.13;path(c,`M${x-3} ${y} q3 3.4 6 0`,null,P('#b9b6ac',0,.5),.7);}c.restore();
  ellipse(c,hx-hr*.5,hy+hr*.4,hr*.42,hr*.32,P('#b8b6b0',0,.5));
  const bill=path(c,`M${bx-3} ${by-hr*.7} Q${bx+hr*.95} ${by-hr*.62} ${bx+hr*1.2} ${by+hr*.28} Q${bx+hr*.6} ${by+hr*.68} ${bx-3} ${by+hr*.62}Z`,P('#e8742a'),P('#7c3c14'),.8);
  c.save();c.clip(bill);path(c,`M${bx-5} ${by-hr} L${bx+hr*.34} ${by-hr} L${bx+hr*.34} ${by+hr} L${bx-5} ${by+hr}Z`,P('#47657c'));path(c,`M${bx+hr*.32} ${by-hr} L${bx+hr*.46} ${by-hr} L${bx+hr*.46} ${by+hr} L${bx+hr*.32} ${by+hr}Z`,P('#f2c94c'));if(!low)for(let i=0;i<3;i++)path(c,`M${bx+hr*(.6+i*.18)} ${by-hr} q${-2} ${hr} 0 ${hr*2}`,null,P('#a8481c',0,.8),1.1);c.restore();
  faceLine(c,P,`M${bx-2} ${by+hr*.06} Q${bx+hr*.5} ${by+hr*.14} ${bx+hr*1.1} ${by+hr*.22}`,P('#5a2a0e',0,.75));
  path(c,`M${hx+hr*.2} ${hy-hr*.56} L${hx+hr*.42} ${hy-hr*.8} L${hx+hr*.6} ${hy-hr*.48}Z`,P('#47505a'));c.strokeStyle=P('#d8322e',0,.95);c.lineWidth=.9;c.beginPath();c.ellipse(hx+hr*.35,hy-hr*.2,5.3,4.5,0,0,TAU);c.stroke();
 }else{
  if(!low)for(let i=0;i<7;i++)path(c,`M${hx-hr*.7} ${hy-hr*.6+i*1.4} L${hx-hr*(1.9+((i*37)%5)*.14)} ${hy-hr*.82+i*1.8} L${hx-hr*.7} ${hy-hr*.4+i*1.4}Z`,P(k.cap));
  if(id==='wandering_albatross'){path(c,`M${bx-3} ${by-4} Q${bx+hr*1.2} ${by-4.5} ${bx+hr*2.1} ${by-1} Q${bx+hr*2.3} ${by+1.5} ${bx+hr*2.05} ${by+4} Q${bx+hr*1.2} ${by+3} ${bx-3} ${by+4.5}Z`,P('#f0b6b0'),P('#a0645c',0,.6),.5);path(c,`M${bx+hr*1.7} ${by-2.6} Q${bx+hr*2.3} ${by-1} ${bx+hr*2.05} ${by+4} L${bx+hr*1.85} ${by+1}Z`,P('#e8c46a'));faceLine(c,P,`M${bx-2} ${by+.8} L${bx+hr*1.9} ${by+1.2}`,P('#7a4a44',0,.7));}
  else{  path(c,`M${bx-3} ${by-3.5} L${bx+hr*1.9} ${by+2} L${bx-3} ${by+4.5}Z`,P('#1d1e22'),P('#000',0,.35),.5);path(c,`M${bx+hr*1.5} ${by+.5} L${bx+hr*1.9} ${by+2} L${bx+hr*1.5} ${by+3}Z`,P('#f2c94c'));}
  ellipse(c,hx,hy+hr*.55,hr*.72,hr*.4,P('#f4f2ec'));
 }
}
// Philippine hawk-eagle (Nisaetus philippensis): a forest eagle of the Philippines, with a long black crest of two or
// three feathers, a pale streaked breast, feathered legs and a barred tail.
function raptor(c,r,p,P,low){
 const k=AVIAN[r.species],hawk=r.species==='philippine_hawk_eagle',a=r.colors.primary,b=r.colors.secondary,hx=k.L*.05,hy=-k.H*.72,hr=k.L*.55,tailCol=hawk?a:'#f6f3ec';
 if(hawk)for(const [ang,l] of [[-2.2,30],[-2.0,34],[-1.8,27]]){const sw=Math.sin(p.swim+ang)*2;path(c,`M${hx-hr*.3} ${hy-hr*.6} Q${hx-hr*.3+Math.cos(ang)*l*.6} ${hy-hr*.6+Math.sin(ang)*l*.6} ${hx-hr*.3+Math.cos(ang)*l+sw} ${hy-hr*.6+Math.sin(ang)*l}`,null,P('#1a1714'),2.8);}
 const tail=path(c,`M${-k.L*.45} ${k.H*.3} Q${-k.L*1.4} ${k.H*.42} ${-k.L*1.95} ${k.H*.62} Q${-k.L*2} ${k.H*.86} ${-k.L*1.66} ${k.H*.9} Q${-k.L*1} ${k.H*.74} ${-k.L*.2} ${k.H*.5}Z`,grad(c,P,tailCol,tailCol,k.H*.3,k.H*.9),P(a,-.45),.7);
 if(!low&&!hawk){c.save();c.clip(tail);for(let i=0;i<7;i++)line(c,[[-k.L*.3,k.H*.42+i],[-k.L*2,k.H*.58+i*5]],P('#b9b3a4',0,.7),.8);c.restore();}
 if(!low&&hawk){c.save();c.clip(tail);for(let i=0;i<5;i++){const x=-k.L*.72-i*k.L*.27;line(c,[[x,k.H*.28+i*2],[x-3,k.H*1]],P('#241a12',0,.72),4.2);}c.restore();}
 avian(c,r,p,P,low);
 if(low||!hawk)return;
 for(let i=0;i<22;i++){const x=-k.L*.25+((i*37)%100)/100*k.L*.95,y=-k.H*.2+((i*53)%100)/100*k.H*.72;line(c,[[x,y],[x-.6,y+6]],P('#3e2c1c',0,.72),1.6);}
  
}
// Great whiskered catfish (fictional): a round, heavy, scaleless catfish with a wide flat head, a dark blue back over a
// pale sandy belly, a small quiet eye, and two long curling whiskers with two shorter pairs under the chin.
function whiskered(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*5,K='#172230';
 path(c,`M-58 -4 Q-96 ${-38+sw} -112 ${-30+sw} Q-102 ${-4+sw} -94 ${sw} Q-102 ${6+sw} -112 ${32+sw} Q-96 ${38+sw} -58 12Z`,finFill(c,P,a,-58,4,-112,sw),P(a,-.4),.7);
 if(!low)for(let i=0;i<9;i++)line(c,[[-60,-2+i*1.4],[-104,-26+i*6.4+sw]],P(a,-.3,.5),.6);
 path(c,'M-10 -50 Q-6 -84 12 -84 Q20 -72 26 -50Z',finFill(c,P,a,8,-50,8,-84),P(a,-.4),.7);if(!low)for(let i=0;i<5;i++)line(c,[[-4+i*6,-50],[6+i*2.4,-78]],P(a,-.3,.5),.6);
 path(c,'M-48 -36 Q-42 -52 -30 -46 L-26 -40Z',P(a,-.08));
 path(c,'M-44 30 Q-32 56 -8 52 L2 42Z',P(a,-.08,.9),P(a,-.4),.6);
 const body=path(c,'M-66 2 C-76 -50 20 -72 66 -39 Q100 -21 106 4 Q100 30 70 41 C30 64 -38 56 -58 27 Q-64 15 -66 2Z',grad(c,P,a,a,-62,54),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-70 6 Q-20 -4 34 2 Q74 4 110 -4 L110 70 L-70 70Z',P(b,.04,.38));path(c,'M-70 12 Q-20 3 34 9 Q74 11 110 3 L110 70 L-70 70Z',P(b,.04));
 if(!low){skin(c,body,P,a,r.seed,70);for(let i=0;i<46;i++){const x=-62+((i*37)%100)/100*150,y=-56+((i*53)%100)/100*54;ellipse(c,x,y,2.2+(i%3)*.8,1.6+(i%2)*.7,P(a,i%2?.2:-.2,.38));}ellipse(c,4,-54,60,5,P('#ffffff',0,.1));line(c,[[-58,3],[62,-2]],P(a,.25,.4),.9);}
 c.restore();
 path(c,'M28 8 Q8 36 -8 28 L12 6Z',finFill(c,P,a,24,10,0,30),P(a,-.4),.7);if(!low)for(let i=0;i<5;i++)line(c,[[24,10],[-2+i*4,28-i*3]],P(a,-.3,.5),.5);
 faceLine(c,P,'M48 -30 Q38 -4 50 26',P(a,-.5,.8),1.1);
 faceLine(c,P,'M105 7 Q86 18 62 16',P(K,0,.8),1.5);
 ellipse(c,98,-8,1.5,1.1,P(K,0,.8));
 const curl=(x,y,l,bend,w,ph)=>{const q=Math.sin(p.swim*.9+ph)*5;path(c,`M${x} ${y} C${x+l*.7} ${y+bend*.2+q} ${x+l*.82} ${y+bend+q} ${x+l*.36} ${y+bend*.96+q} C${x+l*.14} ${y+bend*.84+q} ${x+l*.24} ${y+bend*.6+q} ${x+l*.42} ${y+bend*.68+q}`,null,P(b,-.12),w);};
 curl(96,6,70,58,3.2,0);curl(82,18,-58,62,2.8,1.4);curl(96,17,26,28,2,2.4);curl(84,23,22,30,2,3.2);
 // Whiscash (requested by name, owner 2026-11-10): the blue whiskered catfish with a yellow W across its brow.
 if(r.species==='whiscash')path(c,'M50 -46 L58 -30 L64 -42 L70 -30 L78 -46',null,P(b,.1),3.6);
 eye(c,76,-13,P,2.5,{iris:'#a98c52'});
}
// Arthropleura: a Carboniferous millipede, the largest land arthropod known, up to about 2.6 m. A wide flat body of paired
// plates, each with a pale edge, and legs in their dozens.
function arthropleura(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,N=34,S=snakeLine(p,350,17,14,.34,N),e=S.pt[N];
 for(let i=2;i<N-1;i++){const [x,y]=S.at(i,.9),q=Math.sin(p.swim*1.4+i*.7)*3;line(c,[[x,y],[x-3+q,y+14],[x-8+q,y+22]],P(a,-.28),2);}
 const body=path(c,S.outline(),grad(c,P,a,b,-20,20),P(a,-.45),.8);
 c.save();c.clip(body);for(let i=1;i<N;i+=2)path(c,S.ribbon(-1.3,1.3,i,i+1),P(a,-.2,.55));if(!low){for(let i=1;i<N;i++){const [x,y]=S.at(i,-.62);ellipse(c,x,y,2.4,1.5,P(b,.2,.7),S.pt[i].th);}skin(c,body,P,a,r.seed,60);}c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);const s=15;
 const head=path(c,`M-3 ${-e.w} Q${s*.6} ${-s*1.1} ${s*1.5} ${-s*.6} Q${s*1.9} 0 ${s*1.5} ${s*.6} Q${s*.6} ${s*1.1} -3 ${e.w}Z`,grad(c,P,a,b,-s,s),P(a,-.45),.7);if(!low)skin(c,head,P,a,r.seed+4,14);
 for(const dy of [-.35,.25])path(c,`M${s*1.6} ${s*dy} q${s*.8} ${s*dy*.8-3} ${s*1.6} ${s*dy*2}`,null,P(a,-.1),1.8);
 eye(c,s*1.1,-s*.4,P,1.8,{iris:'#2c2018'});
 helmet(c,s*.9,0,s*1.7,P);
 c.restore();
}
// Anomalocaris canadensis: a Cambrian swimming predator. A row of soft side flaps along the body, a fan of tail blades, two
// spined grasping arms in front of the mouth, and big eyes held out on stalks.
function anomalocaris(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*6;
 for(const s2 of [-1,1])for(let k=0;k<3;k++)path(c,`M-92 ${s2*2} Q-122 ${s2*(14+k*10)+sw} -142 ${s2*(10+k*10)+sw} Q-124 ${s2*(4+k*6)} -92 ${s2*6}Z`,finFill(c,P,b,-92,0,-142,0),P(a,-.4),.6);
 for(let i=0;i<11;i++){const x=-84+i*15.5,q=Math.sin(p.swim*1.4-i*.7)*6,h=20+Math.sin(i/10*Math.PI)*14;path(c,`M${x} 12 Q${x-10} ${12+h+q} ${x-26} ${10+h+q} Q${x-18} 20 ${x-12} 12Z`,finFill(c,P,a,x,12,x-18,12+h),P(a,-.4),.6);}
 const body=path(c,'M-98 -4 Q-60 -26 10 -28 Q60 -28 84 -14 Q94 -2 84 12 Q60 26 10 26 Q-60 24 -98 6Z',grad(c,P,a,b,-28,26),P(a,-.45),.8);
 c.save();c.clip(body);for(let i=0;i<13;i++)path(c,`M${-90+i*14} -30 Q${-96+i*14} 0 ${-90+i*14} 30`,null,P(a,-.35,.6),1.2);if(!low)skin(c,body,P,a,r.seed,70);c.restore();
 const arm=(far)=>{const col=far?P(a,-.25):P(b,-.05),o=far?-5:0,w=Math.sin(p.swim*.9)*5;let px=88+o,py=8;const pts=[[px,py]];for(let i=1;i<=9;i++){const t=i/9,ang=.1+t*2.7;px+=Math.cos(ang)*9;py+=Math.sin(ang)*9+w*.06;pts.push([px,py]);}line(c,pts,col,6.5-(far?1:0));for(let i=1;i<pts.length;i++){const [x,y]=pts[i];line(c,[[x,y],[x+2.5,y+9]],P(a,-.3),1.5);}};
 arm(true);arm(false);
 ellipse(c,84,-4,16,13,grad(c,P,a,b,-16,10));
 line(c,[[88,-14],[100,-28]],P(a,-.1),3.2);eye(c,102,-31,P,4,{iris:'#3a2618'});
}
// A person, in a plain wetsuit and fins, with an air helmet on. Nobody in particular.
function diver(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,kick=Math.sin(p.swim)*9,HX=74,HY=-22;
 const leg=(y0,q,far)=>{const col=far?P(a,-.25):P(a,-.05);path(c,`M-22 ${y0} Q-58 ${y0+6+q*.4} -92 ${y0+6+q}`,null,col,14);path(c,`M-90 ${y0+q} L-132 ${y0-8+q*1.5} L-126 ${y0+15+q*1.5} L-90 ${y0+13+q}Z`,P('#1f2a33',far?-.15:0),P('#000',0,.3),.5);};
 leg(4,-kick,true);leg(10,kick,false);
 const arm=(y0,q,far)=>{path(c,`M46 ${y0} Q76 ${y0+10+q} 104 ${y0+6+q}`,null,far?P(a,-.25):P(a,-.02),10);ellipse(c,108,y0+6+q,6.5,5,P(b,far?-.2:0));};
 arm(-12,kick*.5,true);
 const body=path(c,'M-30 10 Q-34 -18 6 -22 Q44 -26 58 -18 Q68 -6 58 8 Q40 22 4 24 Q-26 24 -30 10Z',grad(c,P,a,a,-22,24),P(a,-.45),.8);
 if(!low){skin(c,body,P,a,r.seed,40);path(c,'M6 -20 L4 22',null,P(b,0,.35),1.2);}
 arm(-4,-kick*.5,false);
 path(c,`M${HX-14} ${HY-9} Q${HX-4} ${HY-24} ${HX+10} ${HY-17} Q${HX+6} ${HY-12} ${HX-13} ${HY-2}Z`,P('#3a2a20'));
 const head=path(c,`M${HX-14} ${HY} A14 15 0 1 1 ${HX+14} ${HY} A14 15 0 1 1 ${HX-14} ${HY}Z`,grad(c,P,b,b,HY-14,HY+14),P(b,-.4),.6);if(!low)skin(c,head,P,b,r.seed+2,12);
 eye(c,HX+7,HY-3,P,2.1,{iris:'#4a2e1c'});ellipse(c,HX+14,HY+2,1.8,2.4,P(b,-.14));faceLine(c,P,`M${HX+11} ${HY+8} Q${HX+6} ${HY+11} ${HX+1} ${HY+8}`,P('#7a4a3a',0,.8));
 helmet(c,HX+1,HY,29,P);
}
// Red kangaroo (Osphranter rufus): carried upright on huge folded hind legs with long feet, small forearms held in front,
// a thick tail as long as the body, a deer-like face and tall ears.
function macropod(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*6,hop=Math.sin(p.swim*1.2)*5;
 const tail=path(c,`M-22 34 Q-74 ${44+sw*.4} -112 ${30+sw} Q-126 ${24+sw} -112 ${18+sw} Q-70 ${22+sw*.4} -24 6Z`,grad(c,P,a,a,6,44),P(a,-.45),.7);if(!low)skin(c,tail,P,a,r.seed+9,30);
 const hind=(x,far)=>{const col=far?P(a,-.3):grad(c,P,a,b,14,70);path(c,`M${x-20} 14 Q${x-34} 46 ${x-10} 56 L${x-12} ${70+hop*.3} L${x+38} ${74+hop*.3} Q${x+42} ${66+hop*.3} ${x+30} ${64+hop*.3} L${x+8} ${62+hop*.3} Q${x+22} 40 ${x+14} 12Z`,col,P(a,-.45),.7);};
 hind(-8,true);
 const body=path(c,'M-30 22 Q-40 -14 -8 -38 Q14 -54 30 -58 Q44 -54 44 -36 Q44 -6 30 22 Q14 48 -14 44 Q-28 40 -30 22Z',grad(c,P,a,b,-50,44),P(a,-.45),.8);
 c.save();c.clip(body);ellipse(c,26,14,24,36,P(b,.14,.85));if(!low){skin(c,body,P,a,r.seed,70);for(let i=0;i<70;i++){const x=-32+((i*37)%100)/100*78,y=-56+((i*53)%100)/100*100;line(c,[[x,y],[x-2.5,y+4]],P(a,i%2?.25:-.25,.45),.8);}}c.restore();
 hind(4,false);
 const arm=(y,far)=>{path(c,`M30 ${y} Q50 ${y+10+sw*.3} 54 ${y+24+sw*.3}`,null,far?P(a,-.3):P(a,-.05),7);ellipse(c,55,y+26+sw*.3,4,3.4,far?P(a,-.32):P(a,-.08));};
 arm(-14,true);arm(-8,false);
 const hx=40,hy=-68;
 for(const dx of [-9,3]){c.save();c.translate(hx+dx,hy-9);c.rotate(-.18+dx*.012);path(c,'M-5 0 Q-7 -22 0 -30 Q7 -22 5 0Z',P(a,dx<0?-.22:-.05),P(a,-.45),.5);path(c,'M-2.6 -2 Q-3.4 -18 0 -24 Q3.4 -18 2.6 -2Z',P('#e8b9a8',0,.85));c.restore();}
 path(c,'M30 -46 Q34 -66 46 -68 L52 -56 Q46 -44 38 -34Z',grad(c,P,a,b,-68,-34));
 const head=path(c,`M${hx-13} ${hy+2} Q${hx-12} ${hy-13} ${hx+2} ${hy-12} Q${hx+16} ${hy-10} ${hx+34} ${hy+1} Q${hx+38} ${hy+7} ${hx+32} ${hy+11} Q${hx+14} ${hy+16} ${hx-4} ${hy+14} Q${hx-13} ${hy+10} ${hx-13} ${hy+2}Z`,grad(c,P,a,b,hy-12,hy+16),P(a,-.45),.7);if(!low)skin(c,head,P,a,r.seed+3,20);
 ellipse(c,hx+32,hy+3,3.2,2.6,P('#231a16'));faceLine(c,P,`M${hx+31} ${hy+10} Q${hx+22} ${hy+13} ${hx+13} ${hy+10}`,P('#2a1d18',0,.7));
 eye(c,hx+9,hy-3,P,2.7,{iris:'#3a2618'});
 helmet(c,hx+11,hy,36,P);
}
// ---- 2026-11-09, third pass: the animals people kept asking for that had no drawing of their own. ----
// Five gill slits as clean face lines, front slit first.
function gillSlits(c,P,a,x,step,y0,y1,n=5,bow=2.5){for(let i=0;i<n;i++)faceLine(c,P,`M${x-i*step} ${y0} q${-bow} ${(y1-y0)/2} 0 ${y1-y0}`,P(a,-.55,.85));}
// Soft mottling inside a body: pale and dark patches placed by a fixed pattern, so every frame matches.
function mottle(c,P,col,n,x0,w,y0,h,size,alpha){for(let i=0;i<n;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v);ellipse(c,x0+fu*w,y0+fv*h,size*(1+(i%4)*.35),size*(.6+(i%3)*.2),P(col,i%2?.2:-.25,alpha),i*.7);}}
// Megamouth shark (Megachasma pelagios): a rare filter feeder of deep open water, first seen in 1976; adults about 4.5-5.5 m.
// A huge rounded head with a short blunt snout, an enormous mouth reaching back past the eyes with a pale band along the
// upper lip, a soft, tapering body, two small dorsal fins and a long upper tail lobe; dark grey-brown above, pale below.
function megamouth(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),K='#141416';
 path(c,`M-98 -5 Q-128 ${-26+s} -160 ${-52+s} Q-150 ${-18+s*.6} -138 ${-2+s*.4} Q-140 ${14+s*.6} -146 ${24+s} Q-122 ${16+s*.5} -98 7Z`,finFill(c,P,a,-100,0,-156,0),P(a,-.4),.6);
 path(c,'M40 26 Q30 52 12 56 Q12 42 20 26Z',farPalette(P)(a,-.05));
 path(c,'M-4 -31 Q-14 -52 -30 -54 Q-36 -42 -32 -27Z',finFill(c,P,a,-14,-30,-28,-54),P(a,-.4),.6);
 path(c,'M-66 -17 Q-72 -28 -82 -29 Q-86 -22 -84 -13Z',finFill(c,P,a,-74,-16,-82,-29),P(a,-.4),.6);
 path(c,'M-60 15 Q-66 26 -76 26 Q-74 20 -74 13Z',P(a,-.12));
 const body=path(c,'M-102 -5 Q-70 -16 -30 -27 Q20 -40 70 -42 Q110 -42 126 -24 Q134 -10 131 4 Q126 22 102 33 Q60 43 0 37 Q-60 22 -102 6Z',grad(c,P,a,b,-42,42),P(a,-.45),.8);
 c.save();c.clip(body);
 if(!low){skin(c,body,P,a,r.seed,90);mottle(c,P,a,26,-96,200,-32,52,4,.16);ellipse(c,20,-36,80,4,P('#ffffff',0,.1));}
 // The wide mouth: a dark gape from the snout tip to behind the eye, under a pale upper lip.
 path(c,'M131 6 Q114 14 80 12 Q68 13 62 17 Q78 27 104 26 Q122 22 131 10Z',P('#2a1c22',0,.94));
 path(c,'M132 2 Q114 9 78 8 Q67 9 61 14 Q66 6 78 4 Q112 4 132 -3Z',P('#f2eee6',0,.95));
 path(c,'M128 12 Q112 18 84 18',null,P('#7a5a62',0,.5),1.2);
 c.restore();
 gillSlits(c,P,a,52,7,-20,24,5,3);
 path(c,'M46 26 Q36 58 14 64 Q18 46 26 26Z',finFill(c,P,a,36,26,18,62),P(a,-.4),.6);
 path(c,'M-36 20 Q-44 34 -56 34 Q-50 26 -48 18Z',finFill(c,P,a,-42,20,-52,34),P(a,-.4),.5);
 ellipse(c,124,-10,1.4,.9,P(K,0,.7));
 eye(c,102,-14,P,2.3,{iris:'#3a4a50'});
}
// Bluespine unicornfish (Naso unicornis): a reef surgeonfish about 50-70 cm long. An oval, flattened body, a bony horn that
// grows forward from the forehead above a small mouth, long low dorsal and anal fins, a tail with long trailing tips, and
// two blue blade-like plates on each side of the tail stalk; olive-grey to blue-grey.
function unicornfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*6,K='#1a1e22';
 path(c,`M-70 -6 Q-84 ${-20+sw} -98 ${-28+sw} L-126 ${-40+sw} L-102 ${-21+sw} Q-95 ${sw} -102 ${21+sw} L-126 ${40+sw} L-98 ${28+sw} Q-84 ${20+sw} -70 6Z`,finFill(c,P,a,-72,0,-112,0),P(a,-.4),.6);
 path(c,'M60 -27 Q16 -44 -40 -37 Q-62 -32 -68 -12 L-54 -20 Q0 -34 56 -25Z',P(a,-.1,.9),P(a,-.4),.6);
 path(c,'M40 26 Q0 40 -44 34 Q-62 29 -68 12 L-54 18 Q0 30 38 24Z',P(a,-.1,.9),P(a,-.4),.6);
 if(!low)for(let i=0;i<12;i++){line(c,[[52-i*9.6,-25],[46-i*10,-37+Math.abs(i-6)*.4]],P(a,-.3,.5),.6);line(c,[[34-i*7.4,25],[30-i*7.8,35-Math.abs(i-5)*.4]],P(a,-.3,.5),.6);}
 const body=path(c,'M-74 -5 Q-58 -27 -10 -33 Q40 -36 72 -24 Q90 -14 92 0 Q90 13 74 22 Q40 34 -10 32 Q-58 27 -74 5Z',grad(c,P,a,b,-36,33),P(a,-.45),.8);
 c.save();c.clip(body);
 if(!low){skin(c,body,P,a,r.seed,90);for(let i=0;i<15;i++)path(c,`M${-66+i*10} -36 Q${-62+i*10} 0 ${-66+i*10} 36`,null,P(a,-.18,.2),.8);}
 path(c,'M54 -24 Q45 0 54 23',null,P(a,-.45,.7),1);
 c.restore();
 // The horn: a bony rod growing forward from the forehead, in front of the eye and over the small mouth.
 path(c,'M64 -21 Q80 -27 100 -23 Q105 -21 101 -18 Q84 -16 74 -10 Q66 -12 64 -21Z',grad(c,P,a,b,-28,-10),P(a,-.45),.8);
 // Two blue blades on each side of the tail stalk.
 for(const x of [-66,-56]){path(c,`M${x-6} 1 Q${x} -4 ${x+6} 0 Q${x+1} 5 ${x-6} 1Z`,P('#3f86d6'),P('#163e7a'),.6);line(c,[[x+5,0],[x+10,-2]],P('#163e7a'),1.1);}
 path(c,'M44 6 Q24 -1 16 13 Q28 20 44 12Z',P(b,0,.7),P(a,-.4),.5);
 faceLine(c,P,'M90 3 Q93 6 90 9',P(K,0,.7));
 eye(c,66,-8,P,2.4,{iris:'#2e3a40'});
}
// Basking shark (Cetorhinus maximus): the second-largest fish, a plankton feeder that cruises with its mouth wide open.
// A pointed snout, five gill slits that nearly circle the head, a tall dorsal fin, a crescent tail with a keel on its
// stalk, and mottled grey-brown skin, paler below; the inside of the mouth is pale. Most adults are about 8 m.
function basking(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),K='#14181a';
 path(c,`M-96 -5 Q-122 ${-32+s} -142 ${-62+s} Q-128 ${-22+s*.5} -118 ${s*.3} Q-124 ${22+s*.5} -137 ${46+s} Q-112 ${24+s*.5} -96 6Z`,finFill(c,P,a,-98,0,-140,0),P(a,-.4),.6);
 path(c,'M34 22 Q18 60 -4 64 Q8 42 12 22Z',farPalette(P)(a,-.05));
 path(c,'M-42 16 Q-50 34 -62 34 L-54 15Z',farPalette(P)(a,0));
 path(c,'M28 -30 Q16 -62 -4 -78 Q-2 -50 -22 -28Z',finFill(c,P,a,6,-29,-4,-76),P(a,-.4),.6);
 path(c,'M-54 -15 Q-62 -29 -72 -30 Q-70 -22 -76 -13Z',finFill(c,P,a,-64,-14,-70,-30));
 path(c,'M-56 13 Q-62 25 -72 26 Q-70 19 -74 12Z',P(a,-.12));
 // The open mouth, behind the near cheek: pale lining, darker towards the throat, with the gill arches showing.
 const gape=path(c,'M94 -4 Q116 10 101 29 Q84 22 68 12 Q78 2 94 -4Z',P('#e9dfd0'));
 c.save();c.clip(gape);const g=c.createLinearGradient(66,0,108,0);g.addColorStop(0,P('#2a1c20',0,.95));g.addColorStop(.55,P('#7a5a58',0,.75));g.addColorStop(1,P('#e9dfd0',0,.1));c.fillStyle=g;c.fillRect(60,-10,60,46);
 if(!low)for(let i=0;i<4;i++)path(c,`M${76+i*6} -6 q7 15 -1 34`,null,P('#f1e9dc',0,.55),1.5);c.restore();
 const body=path(c,'M-102 -4 Q-70 -13 -30 -25 Q20 -34 66 -30 Q94 -27 108 -22 Q119 -21 125 -16 Q118 -10 106 -7 Q98 -6 94 -4 Q78 2 68 12 Q84 20 101 29 Q98 35 84 36 Q40 40 -10 31 Q-70 15 -102 5Z',grad(c,P,a,b,-34,38),P(a,-.45),.8);
 c.save();c.clip(body);
 if(!low){skin(c,body,P,a,r.seed,90);mottle(c,P,a,46,-96,190,-34,60,5,.3);for(let i=0;i<9;i++)path(c,`M${-84+i*20} ${-8+(i%3)*5} q9 -4 17 1`,null,P(a,.3,.3),1.6);ellipse(c,10,-30,74,5,P('#ffffff',0,.14));}
 c.restore();
 path(c,'M94 -4 Q116 10 101 29',null,P('#f1e9dc',0,.8),1.2);
 // Gill slits: long, from high on the head to under the throat.
 for(let i=0;i<5;i++){const x=58-i*8.5;path(c,`M${x} -25 Q${x-7} 2 ${x+1} 30`,null,P(K,0,.7),1.7);path(c,`M${x-1.4} -23 Q${x-8.4} 2 ${x-.4} 28`,null,P(a,.3,.5),.7);}
 path(c,'M44 24 Q30 66 4 72 Q18 46 22 23Z',finFill(c,P,a,32,24,10,68),P(a,-.4),.6);
 path(c,'M-34 24 Q-42 42 -56 42 Q-50 32 -48 21Z',finFill(c,P,a,-40,22,-52,42),P(a,-.4),.5);
 line(c,[[-104,0],[-84,1]],P(a,-.4,.7),4);
 ellipse(c,114,-13,1.3,.8,P(K,0,.75));
 eye(c,102,-14,P,1.8,{iris:'#2a2a26'});
}
// Carpet sharks that rest on the seabed. Nurse shark (Ginglymostoma cirratum): a broad flat head, two fleshy barbels by a
// small mouth, tiny eyes, two rounded dorsal fins set far back, and a long low tail; yellow-brown, adults about 2.3-3 m.
// Whitespotted bamboo shark (Chiloscyllium plagiosum): slim, brown with dark saddles and white spots, to about 95 cm.
function carpet(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),N=id==='nurse_shark',W=id==='wobbegong',Z=id==='zebra_shark',E=id==='epaulette_shark',k=N?1:W?.82:.66,K='#1d1814',Y=(v)=>+(v*k).toFixed(2);
 const tail=path(c,`M-90 ${Y(-7)} Q-126 ${Y(-17)+s*.5} -160 ${Y(-24)+s} L-165 ${Y(-12)+s} Q-158 ${Y(-8)+s} -154 ${Y(-2)+s} Q-150 ${Y(5)+s} -140 ${Y(6)+s*.8} Q-116 ${Y(11)+s*.4} -90 ${Y(7)}Z`,finFill(c,P,a,-92,0,-160,-10),P(a,-.4),.6);
 if(Z)path(c,`M-90 -6 Q-150 ${-12+s*.6} -214 ${-4+s} Q-206 ${6+s} -196 ${8+s} Q-150 ${10+s*.5} -90 7Z`,finFill(c,P,a,-92,0,-210,0),P(a,-.4),.6);
 if(!N&&!W&&!Z&&!E){c.save();c.clip(tail);for(let i=0;i<4;i++){const x=-108-i*16;path(c,`M${x} ${-26+s} L${x+8} ${-26+s} L${x+8} ${26+s} L${x} ${26+s}Z`,P(K,0,.42));}c.restore();}
 path(c,`M46 ${Y(16)} Q36 ${Y(48)+6} 12 ${Y(54)+8} Q10 ${Y(40)} 22 ${Y(16)}Z`,farPalette(P)(a,-.05));
 path(c,`M-18 ${Y(-19)} Q-28 ${Y(-46)-4} -46 ${Y(-50)-5} Q-56 ${Y(-36)} -52 ${Y(-17)}Z`,finFill(c,P,a,-34,Y(-18),-44,Y(-50)-5),P(a,-.4),.6);
 path(c,`M-66 ${Y(-13)} Q-74 ${Y(-34)-3} -88 ${Y(-37)-4} Q-96 ${Y(-26)} -92 ${Y(-10)}Z`,finFill(c,P,a,-78,Y(-12),-86,Y(-37)-4),P(a,-.4),.6);
 path(c,`M-86 ${Y(8)} Q-94 ${Y(22)+2} -106 ${Y(22)+2} Q-106 ${Y(14)} -102 ${Y(8)}Z`,P(a,-.12));
 const body=path(c,`M-96 ${Y(-6)} Q-60 ${Y(-14)} -20 ${Y(-20)} Q30 ${Y(-27)} 80 ${Y(-24)} Q112 ${Y(-22)} 128 ${Y(-14)} Q139 ${Y(-8)} 139 0 Q138 ${Y(8)} 126 ${Y(13)} Q100 ${Y(22)} 60 ${Y(24)} Q0 ${Y(26)} -50 ${Y(16)} Q-80 ${Y(10)} -96 ${Y(6)}Z`,grad(c,P,a,b,Y(-27),Y(26)),P(a,-.45),.8);
 c.save();c.clip(body);
 if(N){if(!low){skin(c,body,P,a,r.seed,90);mottle(c,P,a,30,-90,220,-24,44,4,.22);ellipse(c,20,-24,90,4,P('#ffffff',0,.16));}}
 else if(W){for(let i=0;i<7;i++){const x=-92+i*32,w=20+(i%2)*5;path(c,`M${x} -34 q-4 6 0 12 q-5 6 -1 12 q-3 6 2 10 L${x+w} 2 q5 -6 1 -12 q5 -6 0 -12 q4 -6 1 -10Z`,P(K,0,.5));}if(!low){skin(c,body,P,a,r.seed,70);for(let i=0;i<46;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-92+(u-Math.floor(u))*226,y=-24+(v-Math.floor(v))*30;ellipse(c,x,y,2.2,1.9,P('#efe6c8',0,.85));ellipse(c,x,y,1,.9,P(a,-.1));}}}
 else if(Z){for(const y of [-8,0,8])path(c,`M-90 ${y*.6} Q20 ${y-4} 130 ${y*.4}`,null,P(a,-.25,.5),1.4);if(!low){skin(c,body,P,a,r.seed,70);for(let i=0;i<70;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-92+(u-Math.floor(u))*228,-16+(v-Math.floor(v))*28,2+(i%3)*.5,1.7+(i%2)*.4,P('#2a2018',0,.85));}}}
 // Epaulette shark (Hemiscyllium ocellatum): slim, with a long tail, tan with sparse dark spots and a big black spot ringed
 // in white above each pectoral fin; it walks on its fins over reef flats at low tide. About 70 cm to 1 m.
 else if(E){for(let i=0;i<34;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-92+(u-Math.floor(u))*200,-16+(v-Math.floor(v))*28,1.6+(i%3)*.6,1.4+(i%2)*.5,P('#3a2a1e',0,.75));}
  ellipse(c,46,-5,9.5,8.5,P('#f6f0e2',0,.95));ellipse(c,46,-5,7,6.2,P('#141010'));if(!low)skin(c,body,P,a,r.seed,60);}
 else{for(let i=0;i<11;i++){const x=-88+i*20;path(c,`M${x} -22 Q${x+4} 0 ${x-1} 22 L${x+9} 22 Q${x+13} 0 ${x+9} -22Z`,P(K,0,.5));}
  if(!low){skin(c,body,P,a,r.seed,70);for(let i=0;i<64;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-92+(u-Math.floor(u))*222,-16+(v-Math.floor(v))*26,1.5,1.3,P('#f4f1e4',0,.9));}}}
 if(!low)path(c,`M100 ${Y(-3)} Q0 ${Y(-7)} -94 0`,null,P(a,.25,.35),.7);
 c.restore();
 path(c,`M-30 ${Y(18)} Q-42 ${Y(36)+3} -56 ${Y(36)+3} Q-52 ${Y(26)} -48 ${Y(16)}Z`,finFill(c,P,a,-38,Y(18),-52,Y(36)+3),P(a,-.4),.5);
 path(c,`M62 ${Y(15)} Q54 ${Y(50)+8} 26 ${Y(60)+10} Q20 ${Y(44)+4} 36 ${Y(17)}Z`,finFill(c,P,a,50,Y(16),30,Y(58)+10),P(a,-.4),.6);
 for(let i=0;i<5;i++){const x=86-i*(i>2?3.4:4.6);faceLine(c,P,`M${x} ${Y(-3)} q-2 ${Y(7)} 0 ${Y(13)}`,P(a,-.55,.85));}
 // The small mouth sits under the snout, ahead of the eyes, with a barbel hanging from each nostril.
 faceLine(c,P,`M110 ${Y(17.5)} Q118 ${Y(13.5)} 124 ${Y(13)}`,P(K,0,.72));
 for(const dx of [0,-4])path(c,`M${132+dx} ${Y(9.5)-dx*.35} q${2+dx*.2} ${N?5:4} ${-1.5} ${N?10:7.5}`,null,P(a,dx?-.32:-.14),N?2:1.5);
 // A wobbegong's face is hemmed with branching flaps of skin, which break up its outline on the reef.
 if(W)for(let i=0;i<8;i++){const x=132-i*7.4,y=Y(12)+i*.9,h=5+(i*5)%4;path(c,`M${x-3} ${y} Q${x-6} ${y+h*.7} ${x-2.4} ${y+h} Q${x} ${y+h*.55} ${x+1.6} ${y+h*.92} Q${x+5} ${y+h*.6} ${x+3} ${y}Z`,P(a,i%2?-.1:.04),P(a,-.45,.6),.4);}
 ellipse(c,104,Y(-10)+1,1.6,1,P(K,0,.6));
 eye(c,112,Y(-10),P,N?1.6:1.9,{iris:N?'#c2b27a':'#b9ad7c'});
}
// Greenland shark (Somniosus microcephalus): a slow sleeper shark of cold deep water and the longest-lived vertebrate
// known. A heavy cylinder of a body, a short rounded snout, small eyes, two small dorsal fins of equal size, no anal fin
// and a broad paddle of a tail; grey-brown, sometimes faintly banded or spotted. Adults are usually 2.4-4.8 m.
function sleeper(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),K='#16181a';
 path(c,`M-104 -9 Q-124 ${-28+s} -146 ${-42+s} Q-140 ${-16+s*.6} -134 ${-3+s*.5} Q-136 ${14+s*.6} -139 ${27+s} Q-120 ${21+s*.6} -104 9Z`,finFill(c,P,a,-106,0,-144,0),P(a,-.4),.6);
 path(c,'M40 20 Q32 42 14 46 Q12 34 20 21Z',farPalette(P)(a,-.05));
 path(c,'M4 -30 Q-6 -45 -20 -46 Q-26 -38 -24 -28Z',finFill(c,P,a,-10,-29,-18,-46),P(a,-.4),.6);
 path(c,'M-64 -20 Q-74 -34 -86 -34 Q-92 -27 -90 -17Z',finFill(c,P,a,-76,-19,-84,-34),P(a,-.4),.6);
 const body=path(c,'M-108 -8 Q-70 -19 -20 -27 Q30 -32 76 -29 Q106 -26 120 -16 Q127 -9 126 0 Q124 9 112 15 Q90 25 50 28 Q-10 31 -60 20 Q-90 13 -108 8Z',grad(c,P,a,b,-32,31),P(a,-.45),.8);
 c.save();c.clip(body);
 for(const [x,w] of [[-86,10],[-52,15],[-14,9],[22,16],[60,11]])path(c,`M${x} -40 Q${x+9} -4 ${x-3} 40 L${x+w-3} 40 Q${x+w+11} -2 ${x+w} -40Z`,P(a,-.2,.14));
 if(!low){skin(c,body,P,a,r.seed,110);mottle(c,P,a,40,-100,210,-29,56,3.6,.24);for(let i=0;i<30;i++){const u=Math.sin(i*91.7)*43758.5453,v=Math.sin(i*33.1)*12543.1234;ellipse(c,-98+(u-Math.floor(u))*200,-24+(v-Math.floor(v))*44,1.1,.9,P('#e9e6da',0,.4));}ellipse(c,10,-29,84,4,P('#ffffff',0,.12));path(c,'M96 -5 Q0 -9 -104 0',null,P(a,.25,.3),.7);}
 c.restore();
 path(c,'M-54 18 Q-62 30 -74 29 Q-70 22 -68 16Z',finFill(c,P,a,-58,17,-70,29),P(a,-.4),.5);
 path(c,'M54 20 Q46 46 26 50 Q24 36 34 21Z',finFill(c,P,a,44,21,30,48),P(a,-.4),.6);
 gillSlits(c,P,a,78,4.6,2,14);
 // American pocket shark (Mollisquama mississippiensis): a 14 cm deep-sea kitefin with a bulbous head, a pocket gland that
 // squirts glowing fluid just behind each pectoral fin, and pale-edged fins.
 if(r.species==='pocket_shark'){path(c,'M30 8 Q24 13 28 19',null,P(K,0,.85),2.4);path(c,'M31 8 Q25 13 29 19',null,P('#e8e2d4',0,.6),.8);for(const d of ['M4 -30 Q-6 -45 -20 -46','M-64 -20 Q-74 -34 -86 -34','M54 20 Q46 46 26 50'])path(c,d,null,P('#e8e2d4',0,.7),1.1);}
 faceLine(c,P,'M98 18 Q109 15 118 10',P(K,0,.72));if(r.species==='kitefin_shark')path(c,'M98 19 Q109 17 118 12',null,P(a,.15,.85),2.6);
 ellipse(c,121,-3,1.5,1,P(K,0,.7));ellipse(c,92,-11,1.3,.9,P(K,0,.5));
 eye(c,104,-11,P,2,{iris:'#9db4bc'});
}
// Requiem sharks. Bull shark (Carcharhinus leucas): stocky, with a short, bluntly rounded snout, small eyes, a broad
// triangular dorsal fin, grey above and white below; it swims far up rivers. To about 3.5 m. Blacktip shark (Carcharhinus
// limbatus): sleeker, with a long pointed snout, black tips on most fins and a pale band along the flank; about 1.5 m,
// to 2.8 m.
function requiem(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),B=id==='bull_shark',OW=id==='oceanic_whitetip_shark',BL=id==='blue_shark',BT=!B&&!OW&&!BL,K='#15191c',T=OW?P('#f4f2ea',0,.95):P('#15191c',0,.92);
 const tail=`M-90 -6 Q-112 ${-30+s*.6} -134 ${-62+s} L-138 ${-52+s} Q-129 ${-45+s} -127 ${-39+s} Q-116 ${-14+s*.5} -108 ${2+s*.3} Q-113 ${18+s*.6} -125 ${35+s} Q-104 ${20+s*.5} -90 6Z`;
 path(c,tail,finFill(c,P,a,-92,0,-134,0),P(a,-.4),.6);
 if(BT||OW)path(c,`M-125 ${35+s} Q-118 ${27+s*.8} -113 ${18+s*.6} Q-112 ${24+s*.7} -117 ${30+s*.9}Z`,T);
 path(c,B?'M30 22 Q14 54 -6 58 Q6 38 10 22Z':'M30 18 Q14 48 -6 52 Q6 34 10 18Z',farPalette(P)(a,-.05));
 path(c,B?'M36 -35 Q24 -66 2 -80 Q4 -52 -12 -36 L-6 -33Z':OW?'M34 -27 Q30 -62 8 -76 Q-8 -78 -10 -62 Q-6 -44 -16 -28 L-10 -25Z':'M30 -27 Q18 -58 -2 -72 Q0 -46 -16 -28 L-10 -25Z',finFill(c,P,a,10,B?-34:-26,2,B?-78:-70),P(a,-.4),.6);
 if(BT)path(c,'M-2 -72 Q7 -62 11 -51 Q3 -58 -1 -57Z',T);if(OW)path(c,'M8 -76 Q-8 -78 -10 -62 Q-1 -66 14 -64 Q12 -72 8 -76Z',T);
 path(c,B?'M-50 -19 Q-58 -35 -70 -37 Q-68 -27 -76 -17 L-70 -15Z':'M-52 -15 Q-60 -29 -70 -31 Q-68 -22 -76 -13 L-70 -11Z',finFill(c,P,a,-60,B?-18:-14,-68,B?-36:-30));
 if(BT||OW)path(c,'M-70 -31 Q-64 -28 -61 -23 Q-67 -26 -69 -25Z',T);
 path(c,B?'M-54 15 Q-62 29 -74 29 Q-70 21 -76 13Z':'M-56 12 Q-64 24 -74 24 Q-70 17 -76 10Z',P(a,-.12));
 const body=path(c,B?'M-96 -5 Q-60 -18 -20 -31 Q24 -40 62 -34 Q94 -29 107 -19 Q117 -10 115 1 Q112 11 99 15 Q84 22 50 30 Q0 36 -44 22 Q-76 12 -96 6Z':'M-96 -5 Q-60 -15 -20 -24 Q24 -31 60 -26 Q90 -20 108 -9 Q118 -4 118 0 Q112 6 98 10 Q84 17 50 24 Q0 29 -44 19 Q-76 11 -96 6Z',grad(c,P,a,a,B?-38:-30,B?30:24),P(a,-.45),.8);
 c.save();c.clip(body);
 path(c,B?'M-100 8 Q-40 15 20 13 Q70 10 118 -3 L120 50 L-100 50Z':'M-100 8 Q-40 13 20 11 Q70 8 120 -2 L122 50 L-100 50Z',P(b));
 // The blacktip's pale band: a wedge of the belly colour running back along the flank.
 if(BT)path(c,'M52 7 Q22 -9 -28 -5 Q-56 -1 -72 8 Q-20 13 52 10Z',P(b,0,.88));
 if(!low){skin(c,body,P,a,r.seed,80);ellipse(c,14,B?-35:-27,72,5,P('#ffffff',0,.16));path(c,'M90 -5 Q0 -9 -92 0',null,P(a,.25,.3),.7);}
 c.restore();
 path(c,B?'M-24 24 Q-34 41 -46 41 Q-42 31 -42 21Z':'M-24 19 Q-34 34 -46 34 Q-42 26 -42 17Z',finFill(c,P,a,-30,B?23:18,-44,B?40:33),P(a,-.4),.5);
 if(BT||OW)path(c,'M-46 34 Q-40 32 -37 28 Q-42 30 -44 29Z',T);
 path(c,B?'M48 20 Q36 60 12 68 Q18 44 24 20Z':OW?'M46 15 Q42 56 18 72 Q4 76 4 64 Q16 40 22 15Z':BL?'M46 15 Q30 66 -14 90 Q6 52 22 15Z':'M46 15 Q34 52 10 60 Q16 38 22 15Z',finFill(c,P,a,36,B?20:15,16,B?64:56),P(a,-.4),.6);
 if(BT)path(c,'M10 60 Q22 53 28 42 Q18 49 12 50Z',T);if(OW)path(c,'M18 72 Q4 76 4 64 Q14 64 26 58 Q24 68 18 72Z',T);
 gillSlits(c,P,a,B?66:64,4.6,B?-9:-7,B?11:9);
 faceLine(c,P,B?'M80 16 Q93 13.5 105 8':'M82 12.5 Q96 9.5 108 4',P(K,0,.78),1.2);
 ellipse(c,B?110:112,B?-4:-1,1.3,.8,P(K,0,.75));
 eye(c,B?94:94,B?-10:-7,P,B?1.7:2,{iris:'#3a3d38'});
}
// Vampire squid (Vampyroteuthis infernalis): neither squid nor octopus, about 30 cm long, drifting in the dark a
// kilometre down. Eight arms joined by a cloak of skin and lined with soft spines, two ear-like fins, the biggest eyes
// for its size of any animal (blue in the light of a submarine), and lights at the tips of its arms and behind its fins.
function vampireSquid(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,fan=armFan(p),f=Math.sin(p.swim)*7,K='#12070b',N=6;
 path(c,`M-36 -26 Q-42 ${-56+f} -58 ${-56+f} Q-70 -42 -58 -24Z`,farPalette(P)(a,.04),P(a,-.45),.6);
 const tips=[];for(let i=0;i<N;i++){const q=(-1.04+i*(2.08/(N-1)))*fan,R=92-Math.abs(i-2.5)*3;tips.push([+(8+Math.cos(q)*R).toFixed(2),+(Math.sin(q)*R).toFixed(2)]);}
 let web=`M6 -17 L${tips[0][0]} ${tips[0][1]}`;
 for(let i=1;i<N;i++){const mx=(tips[i-1][0]+tips[i][0])/2,my=(tips[i-1][1]+tips[i][1])/2;web+=` Q${(8+(mx-8)*.74).toFixed(2)} ${(my*.74).toFixed(2)} ${tips[i][0]} ${tips[i][1]}`;}
 const g=c.createRadialGradient(8,0,6,8,0,94);g.addColorStop(0,P(K,0,.96));g.addColorStop(.6,P(b,-.05,.96));g.addColorStop(1,P(a,.08,.94));
 const cloak=path(c,web+' L6 17Z',g,P(a,-.45),.8);
 for(let i=0;i<N;i++){const [tx,ty]=tips[i],y0=-13+i*5.2;
  path(c,`M10 ${y0-2.6} L${tx} ${ty} L10 ${y0+2.6}Z`,P(a,i%2?.1:.18,.95));
  if(!low){const dx=tx-10,dy=ty-y0,l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;let d='';for(let j=2;j<12;j++){const t=j/12.5,x=10+dx*t,y=y0+dy*t,h=3.2*(1-t*.6);d+=`M${(x+nx*h).toFixed(1)} ${(y+ny*h).toFixed(1)} L${(x-nx*h).toFixed(1)} ${(y-ny*h).toFixed(1)}`;}
   path(c,d,null,P('#e9c9c2',0,.6),.6);for(let j=7;j<12;j++){const t=j/12.5;ellipse(c,10+dx*t,y0+dy*t,1,.8,P('#f3dcd4',0,.75));}}
  ellipse(c,tx,ty,1.5,1.5,P('#a9dcff',0,.9));}
 const mantle=path(c,'M14 -18 Q-8 -31 -40 -30 Q-76 -27 -90 -8 Q-95 4 -86 14 Q-68 29 -36 28 Q-8 27 14 18Z',grad(c,P,a,b,-31,29),P(a,-.45),.8);
 if(!low){skin(c,mantle,P,a,r.seed,60);c.save();c.clip(mantle);ellipse(c,-40,-27,40,4,P('#ffffff',0,.14));c.restore();}
 path(c,`M-44 -8 Q-56 ${-38+f} -76 ${-36+f} Q-86 -16 -64 0Z`,finFill(c,P,a,-52,-4,-78,-30+f),P(a,-.45),.7);
 ellipse(c,-78,5,3,3,P('#a9dcff',0,.3));ellipse(c,-78,5,1.6,1.6,P('#d6efff',0,.9));
 eye(c,-2,-5,P,6,{iris:'#3f8fd6'});
}
// Australian box jellyfish (Chironex fleckeri), the sea wasp: a pale blue, nearly see-through bell the shape of a
// rounded cube, up to about 30 cm across, with a fleshy arm at each of its four corners carrying up to 15 ribbon-like
// tentacles that can stretch to 3 m. A cluster of eyes sits in a notch low on each side.
function boxJelly(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=p.swim;
 const strand=(x0,y0,lean,len,i,col,w)=>{const q1=Math.sin(sw*.7+i*1.3)*7,q2=Math.sin(sw*.5+i*.9)*12;path(c,`M${x0} ${y0} C${x0+lean*8+q1} ${y0+len*.35} ${x0+lean*14-q1} ${y0+len*.7} ${x0+lean*18+q2} ${y0+len}`,null,col,w);};
 // The two far corners first, darker, then the bell, then the two near corners.
 for(const sx of [-1,1]){path(c,`M${sx*14} 2 Q${sx*17} 12 ${sx*19} 20`,null,P(a,-.2,.6),5);for(let i=0;i<5;i++)strand(sx*19+(i-2)*1.6,20,sx*.5+(i-2)*.16,78+(i*17)%26,i+sx*3,P(b,-.2,.4),.8);}
 const bell=new Path2D('M-31 4 Q-35 -40 -25 -52 Q0 -61 25 -52 Q35 -40 31 4 Q16 9 0 6 Q-16 9 -31 4Z');
 glassBody(c,P,flex.map?flexedPath('M-31 4 Q-35 -40 -25 -52 Q0 -61 25 -52 Q35 -40 31 4 Q16 9 0 6 Q-16 9 -31 4Z'):bell,a);
 if(!low){for(const x of [-13,13])path(c,`M${x} -55 Q${x*1.25} -24 ${x*1.1} 5`,null,P(b,.2,.45),.9);
  path(c,'M-12 -44 Q0 -52 12 -44 Q10 -34 0 -30 Q-10 -34 -12 -44Z',P(b,.25,.5));path(c,'M-3 -31 Q0 -14 3 -31',null,P(b,.2,.55),2.4);
  for(const x of [-22,0,22]){ellipse(c,x,-5,2.6,2.2,P(b,.3,.5));ellipse(c,x,-5,1.2,1.1,P('#1a2430',0,.85));}
  path(c,'M-26 -48 Q-12 -57 6 -55',null,P('#ffffff',0,.5),1.4);}
 for(const sx of [-1,1]){path(c,`M${sx*28} 3 Q${sx*33} 14 ${sx*37} 26`,null,P(a,.12,.85),6.5);path(c,`M${sx*27} 4 Q${sx*31} 14 ${sx*35} 25`,null,P('#ffffff',0,.3),1.2);
  for(let i=0;i<7;i++)strand(sx*37+(i-3)*1.8,26,sx*.55+(i-3)*.2,84+(i*23)%34,i+sx*5,P(b,.12,.72),1);}
}
// Harp seal (Pagophilus groenlandicus), of the Arctic pack ice. Adults are silver-grey with a black face and a black
// harp or wishbone-shaped band across the back and down each flank, 1.7-2 m long. Pups are born with a fluffy white
// coat that lasts two to three weeks, at about 85 cm.
function harpSeal(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,pup=r.species==='harp_seal_pup',sw=swing(p,5),K='#1b1d20';
 path(c,`M-76 2 Q-102 ${-15+sw} -118 ${-9+sw} Q-110 ${2+sw} -100 ${6+sw} Q-110 ${13+sw} -116 ${24+sw} Q-96 ${23+sw} -74 13Z`,grad(c,P,a,b,-14,24),P(a,-.4),.6);
 if(!low)for(let i=0;i<4;i++)line(c,[[-84,5+i*1.5],[-112,-6+i*8+sw]],P(a,-.35,.45),.6);
 path(c,'M22 26 Q12 48 -6 50 Q-2 38 4 26Z',farPalette(P)(a,-.05));
 const body=path(c,pup?'M-84 4 Q-72 -30 -20 -38 Q30 -42 60 -30 Q76 -29 90 -17 Q101 -8 100 5 Q96 17 80 21 Q50 38 0 38 Q-58 34 -84 10Z':'M-84 4 Q-70 -22 -20 -32 Q30 -38 60 -27 Q78 -24 91 -14 Q101 -6 100 5 Q96 16 80 20 Q50 34 0 34 Q-56 30 -84 10Z',grad(c,P,a,b,-38,36),P(a,-.45),.8);
 c.save();c.clip(body);
 if(pup){if(!low){for(let i=0;i<150;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,x=-84+(u-Math.floor(u))*184,y=-40+(v-Math.floor(v))*78;line(c,[[x,y],[x-3.4,y+2.2]],P(i%2?'#ffffff':'#cfcbbd',0,i%2?.7:.4),.8);}ellipse(c,0,32,84,8,P('#d8d3c2',0,.35));}ellipse(c,93,3,9,7,P('#8d8a80',0,.5));}
 else{
  // The harp: from the shoulders, down along the flank, and up again towards the hips.
  path(c,'M44 -40 Q34 2 -6 11 Q-44 15 -66 -22',null,P(K,0,.9),10);
  path(c,'M70 -40 Q58 -22 64 -2 Q70 14 86 30 L110 30 L110 -40Z',P(K,0,.93));
  if(!low){skin(c,body,P,a,r.seed,110);for(let i=0;i<14;i++){const u=Math.sin(i*51.3)*43758.5453,v=Math.sin(i*17.9)*12543.1234;ellipse(c,-74+(u-Math.floor(u))*120,-22+(v-Math.floor(v))*46,1.6,1.2,P(K,0,.45));}ellipse(c,-6,-30,60,4,P('#ffffff',0,.3));}}
 c.restore();
 if(pup&&!low){let d='';for(let i=0;i<26;i++){const t=i/25,x=-78+t*150,y=-4-Math.sin(t*3.14)*36+(t>.8?(t-.8)*46:0);d+=`M${x.toFixed(1)} ${y.toFixed(1)} l-3.2 -2.6`;}path(c,d,null,P('#ffffff',0,.75),.9);}
 path(c,pup?'M36 30 Q28 52 8 56 Q10 44 18 28Z':'M36 26 Q28 50 6 54 Q10 40 18 24Z',grad(c,P,pup?a:K,pup?b:K,24,56),P(pup?a:K,-.4),.6);
 if(!low)for(let i=0;i<3;i++)line(c,[[30-i*4,32],[18-i*4,50]],P(pup?a:'#3a3d42',-.2,.5),.6);
 ellipse(c,98,2,3,2.3,P('#0d0f11'));faceLine(c,P,'M97 5 Q93 10 86 9',P(pup?'#3a342c':'#5a5d60',0,.8));
 crisp(c,(c)=>{for(let i=0;i<5;i++)path(c,`M91 6 Q104 ${4+i*3.4} 114 ${1+i*5}`,null,P('#e9ebe6',0,.8),.5);});
 eye(c,79,-8,P,pup?3.4:2.8,{iris:pup?'#17110c':'#3a2a1c'});
}
// Gulper eel or pelican eel (Eurypharynx pelecanoides): about 75 cm of velvet-black eel, most of it tail, behind a
// mouth far bigger than its body: thin jaws hinged far back, joined by a pouch like a pelican's. The eyes are tiny and
// sit near the tip of the snout, and the whip of a tail ends in a small pink light.
function gulper(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#07060a',N=30;
 const wv=waveBody(p,(x)=>{const t=Math.max(0,(66-x)/236);return Math.sin(p.swim-t*5.4)*(2+t*15);});
 const top=[],bot=[],fin=[],fin2=[];
 for(let i=0;i<=N;i++){const t=i/N,x=-170+t*236,y=wv(x),w=.7+10.3*Math.pow(t,1.35);top.push([x,+(y-w).toFixed(2)]);bot.unshift([x,+(y+w).toFixed(2)]);if(i>3){fin.push([x,+(y-w-3.4*Math.min(1,(i-3)/5)).toFixed(2)]);fin2.push([x,+(y+w+2.8*Math.min(1,(i-3)/5)).toFixed(2)]);}}
 const P2=(a)=>a.map((q)=>q.join(' ')).join(' L');
 path(c,'M'+P2(top.slice(4))+' L'+P2([...fin].reverse())+'Z',P(b,.1,.6));
 path(c,'M'+P2([...bot].reverse().slice(4))+' L'+P2([...fin2].reverse())+'Z',P(b,.05,.5));
 const body=path(c,'M'+P2(top)+' L'+P2(bot)+'Z',grad(c,P,a,b,-16,16),P(a,-.5),.6);
 if(!low){c.save();c.clip(body);path(c,'M'+P2(top.map(([x,y])=>[x,y+2.2])),null,P('#e6e1ee',0,.5),.6);c.restore();}
 const [tx,ty]=[top[0][0],(top[0][1]+bot[N][1])/2];
 const glow=c.createRadialGradient(tx,ty,0,tx,ty,9);glow.addColorStop(0,P('#ff9dc0',0,.8));glow.addColorStop(1,P('#ff9dc0',0,0));ellipse(c,tx,ty,9,9,glow);ellipse(c,tx-1,ty,2.4,2,P('#ffc4d8'));
 // The pouch hangs between the long thin jaws; its rim is the edge of the open mouth.
 const pouch=path(c,'M60 6 Q62 58 104 62 Q126 60 131 54 Q127 24 139 -4 Q100 4 60 6Z',grad(c,P,b,a,0,62),P(a,-.5),.7);
 c.save();c.clip(pouch);const g=c.createLinearGradient(100,0,138,0);g.addColorStop(0,P(K,0,0));g.addColorStop(1,P('#3a1626',0,.85));c.fillStyle=g;c.fillRect(96,-8,46,76);
 if(!low)for(let i=0;i<8;i++)path(c,`M62 6 Q${82+i*6} ${44-i*4} ${129-i*.4} ${56-i*8}`,null,P('#8d86a0',0,.28),.6);c.restore();
 path(c,'M139 -4 Q126 24 131 54',null,P('#9a93ac',0,.75),1.1);
 path(c,'M60 8 Q86 48 131 54',null,P(a,-.4),2.2);
 const head=path(c,'M54 -10 Q80 -15 110 -12 Q132 -9 140 -4 Q112 3 60 8 Q52 0 54 -10Z',grad(c,P,a,b,-15,8),P(a,-.5),.6);
 if(!low)skin(c,head,P,a,r.seed,20);
 path(c,'M52 2 Q46 10 40 10 Q44 4 46 -1Z',P(b,.1,.8));
 eye(c,129,-8,P,1.2,{iris:'#8fb6c9'});
}
// Bigfin squid (Magnapinna): seen alive only a handful of times, thousands of metres down. A small body with two huge
// fins, and ten arms that all look alike: each is held straight out, then bends like an elbow and trails a thread many
// times the length of the body. The largest filmed were judged about 6-8 m, almost all of it arm.
function bigfin(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*5,sw=p.swim;
 const arms=[[-58,-29],[-46,-22],[-34,-27],[-22,-20],[-10,-25],[10,-25],[22,-20],[34,-27],[46,-22],[58,-29]];
 for(let i=0;i<arms.length;i++){const [ex,ey]=arms[i],far=i%2,q=Math.sin(sw*.6+i*1.1)*3,col=far?P(b,-.22,.8):P(b,.02,.95);
  path(c,`M${ex*.1} -37 Q${ex*.6} ${ey-7} ${ex} ${ey}`,null,col,far?2.6:3.2);
  path(c,`M${ex} ${ey} C${ex+q} ${ey+50} ${ex-q} ${ey+104} ${ex+q*1.4} ${136-(i%3)*9}`,null,col,far?1:1.25);
  ellipse(c,ex,ey,far?1.8:2.1,far?1.8:2.1,col);}
 for(const sx of [-1,1])path(c,`M${sx*5} -106 Q${sx*40} ${-112+f*sx*.2} ${sx*44} ${-84+f*.5} Q${sx*40} -60 ${sx*6} -58Z`,finFill(c,P,a,sx*6,-84,sx*44,-84),P(a,-.4),.7);
 if(!low)for(const sx of [-1,1])for(let i=0;i<6;i++)path(c,`M${sx*7} ${-98+i*7} Q${sx*24} ${-100+i*7+f*.2} ${sx*(40-Math.abs(i-2.5)*2)} ${-96+i*6.4+f*.4}`,null,P(a,-.25,.35),.6);
 const body=path(c,'M0 -113 Q9 -98 10 -72 Q11 -52 8 -44 Q10 -38 7 -33 Q0 -30 -7 -33 Q-10 -38 -8 -44 Q-11 -52 -10 -72 Q-9 -98 0 -113Z',grad(c,P,a,b,-112,-30),P(a,-.45),.7);
 if(!low){skin(c,body,P,a,r.seed,30);path(c,'M-3 -104 Q-5 -76 -3 -50',null,P('#ffffff',0,.3),1.4);}
 eye(c,-6.4,-40,P,2.1,{iris:'#26303a'});eye(c,6.4,-40,P,2.1,{iris:'#26303a'});
}
// Bowhead whale (Balaena mysticetus): an Arctic whale that can live for two centuries. A huge bowed head, about a
// third of its length, with a strongly arched mouth; no dorsal fin; black with a white chin marked by a row of dark
// spots, and often a pale band before the flukes. Adults are 15-18 m.
function bowhead(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),W='#efece2',RW=r.species==='right_whale';
 path(c,`M-126 -3 Q-150 ${-21+sw} -172 ${-31+sw} Q-167 ${-12+sw} -158 ${sw} Q-167 ${12+sw} -174 ${29+sw} Q-148 ${22+sw} -126 7Z`,finFill(c,P,a,-128,0,-172,0),P(a,-.45),.7);
 path(c,'M36 32 Q28 60 8 66 Q4 54 12 42 Q18 34 22 30Z',farPalette(P)(a,-.05));
 const body=path(c,'M-134 -4 Q-90 -22 -40 -37 Q10 -47 48 -42 Q62 -39 72 -43 Q86 -51 100 -45 Q124 -35 138 -12 Q144 -2 140 8 Q130 27 100 37 Q50 49 -10 41 Q-80 27 -134 6Z',grad(c,P,a,b,-48,46),P(a,-.5),.8);
 c.save();c.clip(body);
 // The white chin and its necklace of dark spots, and the pale band on the tail stock.
 if(!RW)path(c,'M146 -4 Q138 -16 128 -22 Q116 -14 120 2 Q114 18 122 34 Q136 28 146 10Z',P(W,0,.95));
 if(!RW){for(const [x,y,rx,ry] of [[124,-17,2.8,2],[119,-8,3.4,2.4],[120,3,3,2.4],[117,13,3.4,2.2],[121,25,2.8,2],[128,-10,1.6,1.2],[126,8,1.5,1.2]])ellipse(c,x,y,rx,ry,P(a,-.1,.92),.5);
 path(c,'M-106 -30 Q-100 0 -108 30 L-122 30 Q-116 0 -122 -30Z',P('#aeb4b6',0,.4));}
 else{ellipse(c,20,34,44,10,P(W,0,.6));}
 if(!low){skin(c,body,P,a,r.seed,90);ellipse(c,-10,-42,80,5,P('#ffffff',0,.14));for(const [x,y,l] of [[-40,-12,16],[10,6,12],[-76,2,10],[40,-22,9]])line(c,[[x,y],[x+l,y-2.5]],P('#d5d9d8',0,.35),.7);}
 c.restore();
 // The bowed mouth: from the tip of the snout it climbs high, then sweeps down to a corner below the eye.
 faceLine(c,P,'M141 -5 Q130 -29 108 -30 Q84 -28 73 5',P('#0b0d0f',0,.85),1.5);
 faceLine(c,P,'M139 -2 Q129 -25 108 -26 Q87 -24 76 5',P('#5a6064',0,.5),.7);
 ellipse(c,88,-48,3.4,1.3,P(a,-.5,.8),-.1);
 // Each right whale has its own pattern of pale, rough callosities on the head.
 if(RW)for(const [x,y,rx,ry,q] of [[128,-27,9,4,.5],[112,-37,7,3.5,.1],[96,-44,6,3,-.1],[140,-10,4,3,.8],[136,14,6,3.5,-.5],[124,26,5,3,-.3],[70,-14,5,3,.2]]){ellipse(c,x,y,rx,ry,P('#e6e0cc'),q);if(!low)for(let i=0;i<4;i++)ellipse(c,x-rx*.6+i*rx*.4,y+((i*7)%3)-1,.8,.7,P('#a89f86'));}
 path(c,'M50 32 Q44 64 20 72 Q12 60 22 44 Q28 34 34 29Z',finFill(c,P,a,40,32,20,70),P(a,-.45),.7);
 eye(c,66,-2,P,1.9,{iris:'#2b2119'});
}
// ---- 2026-11-09, third pass, second batch. ----
// Spotted eagle ray (Aetobatus narinari), seen from above like the manta: long pointed wings about twice as wide as the
// body is long, a head that juts out in front with a flat duck-bill snout, a whip of a tail up to three times the
// body, and a dark back scattered with white spots and rings.
function eagleRay(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*14,q=Math.sin(p.swim*.7)*6;
 path(c,`M-38 -2.4 Q-110 ${q*.3-1} -214 ${q} Q-110 ${q*.3+1.6} -38 3Z`,P(a,-.3));
 for(const s2 of [-1,1])path(c,`M-34 ${s2*5} Q-50 ${s2*10} -58 ${s2*17} Q-46 ${s2*19} -32 ${s2*13}Z`,P(a,-.12),P(a,-.4),.5);
 const body=path(c,`M48 -15 Q32 ${-52-f*.4} -6 ${-120-f} Q-8 ${-66-f*.5} -42 -13 Q-48 0 -42 13 Q-8 ${66+f*.5} -6 ${120+f} Q32 ${52+f*.4} 48 15Z`,grad(c,P,a,a,-118,118),P(a,-.45),.8);
 const head=path(c,'M38 -16 Q58 -19 70 -12 Q86 -8 89 0 Q86 8 70 12 Q58 19 38 16Z',grad(c,P,a,a,-18,18));
 if(!low){skin(c,body,P,a,r.seed,90);c.save();c.clip(body);
  for(let i=0;i<60;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,fu=u-Math.floor(u),fv=v-Math.floor(v),x=-40+fu*82,y=(fv*2-1)*(110-Math.abs(x+4)*1.2),s=1.7+(i%4)*.55;ellipse(c,x,y,s,s*.9,P(b,0,.92));if(i%3===0)ellipse(c,x,y,s*.45,s*.4,P(a,-.1));}
  path(c,'M44 0 Q0 -3 -40 0',null,P(a,.22,.3),1.4);c.restore();
  c.save();c.clip(head);for(const [x,y] of [[50,-8],[60,6],[68,-3],[48,7],[77,3],[58,-2]])ellipse(c,x,y,1.5,1.4,P(b,0,.9));c.restore();}
 path(c,'M38 -16 Q58 -19 70 -12 Q86 -8 89 0 Q86 8 70 12 Q58 19 38 16',null,P(a,-.45),.8);
 path(c,'M-42 -3 Q-52 -9 -60 -1 Q-52 1 -44 3Z',P(a,-.25));
 for(const s2 of [-1,1])ellipse(c,57,s2*16.5,4,2.8,P(a,-.12));
 eye(c,57,-17.5,P,1.6,{iris:'#c9b46a'});eye(c,57,17.5,P,1.6,{iris:'#c9b46a'});
}
// Ribbon eel (Rhinomuraena quaesita): a thin moray of Indo-Pacific reefs, about a metre long. The adult male is electric
// blue with a yellow dorsal fin, snout and jaw; the nostrils flare into leaf-like fans, three small tentacles hang
// from the tip of the chin, and it waits with its mouth open.
function ribbonEel(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=6.2,N=40,S=snakeLine(p,296,s,24,.42,N),e=S.pt[N];
 path(c,S.ribbon(-2.5,-.8,3,N-1),P(b,0,.95),P(b,-.35,.6),.5);
 path(c,S.ribbon(.8,1.55,6,N-2),P(b,.1,.6));
 if(!low)for(let i=4;i<N-1;i++){const [x0,y0]=S.at(i,-1),[x1,y1]=S.at(i,-2.35);line(c,[[x0,y0],[x1,y1]],P(b,-.3,.35),.5);}
 const body=path(c,S.outline(),grad(c,P,a,a,-30,30),P(a,-.45),.7);
 c.save();c.clip(body);path(c,S.ribbon(-.85,-.4),P('#ffffff',0,.28));path(c,S.ribbon(.35,1.1),P(a,-.3,.5));if(!low)skin(c,body,P,a,r.seed,60);c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);
 // The lower jaw and the open mouth first, then the upper head over them.
 path(c,`M-3 ${s*.2} L${s*1.5} ${s*.3} Q${s*3.2} ${s*1.05} ${s*4.3} ${s*1.5} Q${s*2.9} ${s*1.62} ${s*1.4} ${s*1.25} Q${s*.4} ${s*1.1} -3 ${e.w}Z`,P(b,-.02),P(b,-.4),.6);
 path(c,`M${s*1.4} ${s*.2} Q${s*3.2} ${s*.3} ${s*4.5} ${s*.05} L${s*4.2} ${s*1.38} Q${s*3} ${s*.9} ${s*1.4} ${s*.2}Z`,P('#2a1220',0,.9));
 for(let i=0;i<3;i++)path(c,`M${s*(4.2-i*.24)} ${s*1.5} q${s*.26} ${s*.26} ${s*.1} ${s*.62}`,null,P(b,-.12),1);
 const head=path(c,`M-3 ${-e.w} Q${s*1.2} ${-s*1.25} ${s*2.6} ${-s*.95} Q${s*4} ${-s*.6} ${s*4.75} ${-s*.22} Q${s*3.6} ${s*.14} ${s*1.5} ${s*.24} L-3 ${s*.32}Z`,grad(c,P,a,a,-s*1.3,s*.3),P(a,-.45),.6);
 path(c,`M${s*3.3} ${-s*.8} Q${s*4.1} ${-s*.58} ${s*4.75} ${-s*.22} Q${s*4} ${-s*.02} ${s*3.1} ${s*.06}Z`,P(b));
 if(!low)skin(c,head,P,a,r.seed+4,10);
 for(const [dx,dy,rot] of [[4.5,-.42,-.45],[4.2,-.66,-1.05]]){c.save();c.translate(s*dx,s*dy);c.rotate(rot);path(c,`M0 0 Q${s*.45} ${-s*.6} ${s*1.1} ${-s*.34} Q${s*1.3} 0 ${s*1.05} ${s*.3} Q${s*.5} ${s*.38} 0 0Z`,P(b,.06),P(b,-.4),.5);c.restore();}
 eye(c,s*2.7,-s*.5,P,s*.2,{iris:'#f0d23c'});
 c.restore();
 followSnake(p,296,24,.42,N);
}
// Spotted garden eel (Heteroconger hassi): about 40 cm long and no thicker than a finger. It lives tail-down in a
// burrow in the sand and rises out of it to pick plankton from the current: white, with many small black spots, three
// large black patches, big eyes and an upturned mouth. It never leaves its burrow.
function gardenEel(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#15171a',N=28,sway=Math.sin(p.swim)*9,sway2=Math.sin(p.swim*.6+1)*5,w=5.4;
 const sand=path(c,'M-44 97 Q-30 86 -10 85 Q10 86 24 97 Q-10 103 -44 97Z',grad(c,P,'#d8c8a0','#b9a67c',85,102));
 if(!low){c.save();c.clip(sand);for(let i=0;i<26;i++)ellipse(c,-40+((i*37)%100)/100*62,87+((i*53)%100)/100*13,.9,.6,P('#8f7d58',0,.6));c.restore();}
 ellipse(c,-10,90,8,2.6,P('#5b4c33',0,.8));
 const ln=[];for(let i=0;i<=N;i++){const t=i/N;ln.push([-10+Math.sin(t*2.6)*8*t+Math.pow(t,3)*30+sway*t*t+sway2*t*t*t,90-t*176+Math.pow(t,4)*16,w*(t>.93?1-(t-.93)*1.6:1)]);}
 const S=spineOf(ln),e=S.pt[N];
 const body=path(c,S.outline(),grad(c,P,a,a,-90,90),P(a,-.5),.7);
 c.save();c.clip(body);path(c,S.ribbon(.3,1.2),P(b,-.12,.55));
 for(const i of [3,12,21])path(c,S.ribbon(-1.3,i===21?.5:1.3,i,i+2),P(K,0,.9));
 if(!low)for(let j=0;j<120;j++){const i=1+(j*7)%(N-1),u=-.85+((j*37)%100)/100*1.7,[x,y]=S.at(i,u);ellipse(c,x,y+((j*13)%7)-3,.9,.8,P(K,0,.85));}
 c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);
 const head=path(c,`M-4 ${-e.w} Q4 ${-w*1.3} 12 ${-w*1.1} Q19 ${-w*.5} 18 ${w*.2} Q16 ${w*1.1} 8 ${w*1.2} Q2 ${w*1.2} -4 ${e.w}Z`,grad(c,P,a,a,-w*1.3,w*1.2),P(a,-.5),.7);
 if(!low){c.save();c.clip(head);for(let j=0;j<16;j++)ellipse(c,-2+((j*37)%100)/100*18,-w+((j*53)%100)/100*w*2,.8,.7,P(K,0,.8));c.restore();}
 faceLine(c,P,`M18 ${-w*.1} Q13 ${w*.5} 7 ${w*.2}`,P(K,0,.75),.9);
 eye(c,10,-w*.45,P,1.9,{iris:'#d9c27a'});
 c.restore();
}
// Japanese spider crab (Macrocheira kaempferi): the widest arthropod alive, up to 3.7 m from claw to claw, though its
// pear-shaped shell is only about 40 cm across. Orange, mottled and banded with white, knobbly, and carried high on
// very long thin legs.
function spiderCrab(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#4a1f12';
 for(const sx of [-1,1])for(let i=3;i>=0;i--){
  const q=Math.sin(p.swim+i*1.3+(sx>0?1.6:0))*3,x0=sx*13,y0=-8+i*3,kx=sx*(30+i*17),ky=-40-i*8+q*.4,jx=sx*(42+i*21)+q*.5,jy=12+i*2,fx=sx*(49+i*25)+q,fy=64-i*2,col=P(a,i%2?-.12:.04);
  line(c,[[x0,y0],[kx,ky]],col,4.2);line(c,[[kx,ky],[jx,jy]],col,3.2);line(c,[[jx,jy],[fx,fy]],P(a,-.18),2.2);
  for(const [x,y,s2] of [[kx,ky,3],[jx,jy,2.4]])ellipse(c,x,y,s2,s2,P(b,-.02));
  if(!low)for(const t of [.35,.68]){ellipse(c,x0+(kx-x0)*t,y0+(ky-y0)*t,2.5,1.9,P(b,0,.8),sx*.9);ellipse(c,kx+(jx-kx)*t,ky+(jy-ky)*t,1.9,1.5,P(b,0,.8),sx*.3);}
 }
 // The claw arms hang in front of the body.
 for(const sx of [-1,1]){const q=Math.sin(p.swim*.8+(sx>0?2:0))*2.5,ex=sx*24,ey=30,hx=sx*13+q,hy=58;
  line(c,[[sx*9,10],[ex,ey]],P(a,-.02),4.6);line(c,[[ex,ey],[hx,hy]],P(a,.05),3.6);ellipse(c,ex,ey,2.8,2.8,P(b,-.02));
  path(c,`M${hx-sx*2} ${hy-2} Q${hx-sx*5} ${hy+10} ${hx-sx*1} ${hy+15} L${hx} ${hy+6} L${hx+sx*4} ${hy+14} Q${hx+sx*5} ${hy+4} ${hx+sx*2} ${hy-2}Z`,P(b,.02),P(K,0,.5),.6);}
 const body=path(c,'M0 -30 Q14 -29 21 -14 Q25 2 15 14 Q0 21 -15 14 Q-25 2 -21 -14 Q-14 -29 0 -30Z',grad(c,P,a,b,-30,22),P(a,-.5),.8);
 c.save();c.clip(body);
 if(!low){skin(c,body,P,a,r.seed,50);for(let i=0;i<22;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-20+(u-Math.floor(u))*40,-27+(v-Math.floor(v))*40,1.6+(i%3)*.8,1.2+(i%2)*.6,P(b,0,.75),i);}
  for(const [x,y] of [[-9,-16],[9,-16],[0,-6],[-11,0],[11,0],[0,7]])ellipse(c,x,y,2.2,1.8,P(a,-.3,.55));}
 c.restore();
 for(const sx of [-1,1]){path(c,`M${sx*3} -29 l${sx*2} -9 l${sx*2.4} 8Z`,P(a,-.1),P(a,-.5),.5);line(c,[[sx*8,-27],[sx*10,-34]],P(a,-.2),1.6);}
 path(c,'M-6 13 Q0 17 6 13',null,P(K,0,.6),1);
 eye(c,-10,-35,P,1.5,{iris:'#2a1a14'});eye(c,10,-35,P,1.5,{iris:'#2a1a14'});
}
// Argentine horned frog (Ceratophrys ornata), sold as the "Pacman frog": nearly as wide as it is long, with a mouth
// about half the size of its body, a soft pointed flap of skin like a horn over each eye, short legs, and bright green
// skin with dark blotches and a cream belly. Females reach about 16 cm.
// Woodhouse's toad (Anaxyrus woodhousii): a North American toad, olive-brown and warty with a pale stripe down its back,
// a big swelling of skin (the parotoid gland) behind each eye, and no horns. About 8-12 cm.
function hornedFrog(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#3a2418',kick=Math.sin(p.swim)*4,toad=r.species==='woodhouses_toad';
 const hind=(far)=>{const col=far?P(a,-.3):grad(c,P,a,b,4,44),o=far?8:0;
  path(c,`M${-34+o} 6 Q${-62+o} ${8+kick*.4} ${-58+o} ${28+kick*.6} Q${-52+o} ${38+kick*.4} ${-34+o} 35 L${-10+o} ${41+kick*.3} Q${-2+o} ${40+kick*.3} ${-4+o} ${35+kick*.3} L${-26+o} 28 Q${-16+o} 20 ${-22+o} 8Z`,col,P(a,-.5),.7);
  if(!far&&!low)for(const [x,y] of [[-48,18],[-40,30]])ellipse(c,x,y+kick*.4,4.5,3,P(K,0,.5),.5);};
 hind(true);
 path(c,`M22 16 Q30 ${30-kick*.4} 28 ${40-kick*.4} L38 ${42-kick*.4}`,null,P(a,-.3),7);
 const body=path(c,'M-52 14 Q-54 -16 -30 -31 Q0 -42 28 -36 Q48 -30 56 -12 Q60 -2 56 6 Q50 20 34 26 Q0 36 -34 30 Q-50 26 -52 14Z',grad(c,P,a,b,-40,34),P(a,-.5),.8);
 c.save();c.clip(body);
 path(c,'M60 8 Q30 14 0 12 Q-30 12 -56 22 L-56 44 L60 44Z',P(b,.05,.92));
 if(toad){path(c,'M-50 -14 Q0 -40 52 -26',null,P('#efe2b8',0,.8),3);for(let i=0;i<30;i++){const x=-46+((i*37)%100)*.96,y=-30+((i*53)%100)*.4;ellipse(c,x,y,2.6,2.1,P(a,-.28,.85));ellipse(c,x-.6,y-.6,1,.8,P('#c8742e',0,.7));}}
 else for(const [x,y,rx,ry,q] of [[-30,-10,13,9,.3],[-4,-24,12,7,-.1],[-10,-2,9,6,.2],[18,-14,10,7,-.3],[-42,6,7,6,0],[10,2,7,4.5,.1],[38,-22,6,4.5,.3]]){ellipse(c,x,y,rx,ry,P(K,0,.85),q);ellipse(c,x,y,rx-1.8,ry-1.6,P('#7a3b24',0,.9),q);}
 if(!low){skin(c,body,P,a,r.seed,70);for(let i=0;i<34;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-50+(u-Math.floor(u))*104,-36+(v-Math.floor(v))*44,1.3,1,P(a,.3,.5));}ellipse(c,0,-36,40,4,P('#ffffff',0,.16));}
 c.restore();
 hind(false);
 path(c,`M30 18 Q38 ${30+kick*.4} 36 ${40+kick*.4}`,null,P(a,-.08),8);
 for(let i=0;i<3;i++)line(c,[[36,40+kick*.4],[42+i*3,44+kick*.4-i*1.5]],P(a,-.15),2.2);
 // The mouth runs from the snout to well behind the eye.
 faceLine(c,P,'M58 -1 Q34 12 4 6',P(K,0,.8),1.3);
 if(toad)ellipse(c,12,-28,11,5,P(a,.08),-.25);else path(c,'M22 -32 Q28 -47 34 -33Z',grad(c,P,a,b,-47,-32),P(a,-.5),.6);
 ellipse(c,53,-13,1.2,.9,P(K,0,.7));
 eye(c,29,-25,P,3.3,{iris:'#c9a23c'});
}
// Channel catfish (Ictalurus punctatus), the common catfish of North American rivers. Smooth skin with no scales,
// olive-grey above and pale below with scattered dark spots, a deeply forked tail with a small fleshy fin before it,
// and eight barbels: two on the snout, a long one at each corner of the mouth and four under the chin. Usually 40-60 cm.
function catfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),K='#1c211c',red=r.species==='red_tail_catfish',iri=r.species==='iridescent_shark';
 const tail=path(c,`M-92 -6 Q-116 ${-30+s} -137 ${-42+s} Q-125 ${-15+s*.6} -116 ${s*.4} Q-125 ${15+s*.6} -137 ${42+s} Q-116 ${30+s} -92 7Z`,red?P('#d9402a'):finFill(c,P,a,-94,0,-136,0),P(a,-.4),.6);
 if(!low)for(let i=0;i<9;i++)line(c,[[-94,-4+i],[-132,-36+i*9+s]],P(a,-.3,.45),.6);
 path(c,'M40 20 Q32 38 14 40 Q18 30 22 20Z',farPalette(P)(a,-.05));
 path(c,'M22 -25 Q22 -52 10 -58 Q-2 -46 -8 -24Z',finFill(c,P,a,8,-25,8,-56),P(a,-.4),.6);
 if(!low)for(let i=0;i<5;i++)line(c,[[18-i*5,-26],[12-i*2.6,-52+i*3]],P(a,-.3,.5),.6);
 path(c,'M-60 -15 Q-70 -27 -80 -23 Q-80 -15 -74 -11Z',P(a,-.08),P(a,-.4),.5);
 path(c,'M-34 19 Q-50 40 -74 33 Q-84 22 -86 10Z',finFill(c,P,a,-56,16,-62,36),P(a,-.4),.6);
 if(!low)for(let i=0;i<8;i++)line(c,[[-40-i*5.6,18-i*.8],[-48-i*4.6,34-i*.6]],P(a,-.3,.45),.5);
 const body=path(c,'M-96 -5 Q-60 -15 -20 -24 Q24 -30 62 -25 Q94 -20 108 -10 Q116 -4 115 2 Q112 10 100 14 Q80 22 46 26 Q0 28 -44 18 Q-76 11 -96 6Z',grad(c,P,a,b,-30,28),P(a,-.45),.8);
 c.save();c.clip(body);
 path(c,red?'M-100 3 Q-40 -2 20 -3 Q70 -2 118 -4 L120 40 L-100 40Z':'M-100 8 Q-40 10 20 9 Q70 8 118 0 L120 40 L-100 40Z',P(b,.03,red?.95:.85));
 if(!low){skin(c,body,P,a,r.seed,70);if(iri){const g=c.createLinearGradient(-90,0,110,0);for(const [o,col] of [[0,'#ff9ad0'],[.3,'#9adcff'],[.6,'#a8ffc8'],[1,'#e0b0ff']])g.addColorStop(o,P(col,0,.22));c.fillStyle=g;c.fillRect(-100,-14,220,14);}
 else if(!red)for(let i=0;i<26;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-88+(u-Math.floor(u))*150,-18+(v-Math.floor(v))*22,1.5,1.3,P(K,0,.6));}ellipse(c,14,-26,70,4,P('#ffffff',0,.16));path(c,'M90 -5 Q0 -8 -94 0',null,P(a,.25,.35),.7);}
 c.restore();
 path(c,'M-6 24 Q-14 38 -26 36 Q-22 28 -20 22Z',finFill(c,P,a,-12,24,-24,36),P(a,-.4),.5);
 path(c,'M56 18 Q46 40 26 40 Q32 28 38 18Z',finFill(c,P,a,46,18,30,40),P(a,-.4),.6);
 faceLine(c,P,'M70 -18 Q62 0 70 16',P(a,-.5,.7));
 faceLine(c,P,'M92 11 Q104 9 113 4',P(K,0,.78),1.2);
 // Barbels: two on the snout, a long one from each corner of the mouth, four under the chin.
 const q=Math.sin(p.swim*.9)*3;
 if(iri){for(const dy of [0,3])path(c,`M${96} ${10+dy} q-6 ${6+q*.3} -14 ${8+dy}`,null,P(K,.05,.85),1.3);eye(c,96,-6,P,2.6,{iris:'#c8c8b0'});return;}
 path(c,`M92 11 Q78 ${24+q} 56 ${30+q}`,null,farPalette(P)(K,.1,.8),1.3);
 for(let i=0;i<4;i++)path(c,`M${106-i*4} ${9+i*1.2} Q${104-i*5} ${22+q*.5+i} ${96-i*6} ${27+q*.6+i*1.5}`,null,P(b,-.18),1.1);
 path(c,`M94 10 Q84 ${28+q} 60 ${38+q}`,null,P(K,.05,.9),1.6);
 for(const dx of [0,-4])path(c,`M${108+dx} ${-9-dx*.4} Q${112+dx} ${-17-q*.4} ${108+dx} ${-22-q*.5}`,null,P(K,.05,.85),1.1);
 eye(c,96,-8,P,2,{iris:'#b8a868'});
}
// ---- 2026-11-10: redrawn because they were among the most popular and the weakest. ----
// Moray eel (giant moray, Gymnothorax javanicus): one heavy muscular band with a fin along its whole back, leopard blotches, a tall head,
// a mouth that gapes to breathe and shows its fangs, tube nostrils, and a dark gill spot behind the jaw.
function moray(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=18,N=34,S=snakeLine(p,245,s,14,.3,N),e=S.pt[N],n=e.w,K='#141a10';
 path(c,S.ribbon(-1.5,-.9,2,N-2),P(a,-.06,.92),P(a,-.42),.5);
 path(c,S.ribbon(.9,1.28,2,Math.floor(N/2)),P(a,-.1,.85));
 const body=path(c,S.outline(),grad(c,P,a,b,-34,34),P(a,-.45),.7);
 c.save();c.clip(body);roundLong(c,S,P,a,b);
 for(let j=0;j<90;j++){const i=2+(j*7)%(N-2),u=-.86+((j*37)%100)/100*1.5,[x,y]=S.at(i,u),k=.6+i/N*.8;ellipse(c,x,y,3.2*k+(j%3),2.1*k+(j%2)*.7,P(K,0,.62),S.pt[i].th+j);}
 if(!low)skin(c,body,P,a,r.seed,70);
 c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);
 path(c,`M-3 ${s*.2} L${s*1.1} ${s*.3} Q${s*2} ${s*.72} ${s*3} ${s*.84} Q${s*3.25} ${s*.9} ${s*3.08} ${s*1.05} Q${s*2} ${s*1.22} ${s*1.1} ${s*1.06} Q${s*.4} ${s*1.02} -3 ${n}Z`,grad(c,P,a,b,0,s*1.2),P(a,-.45),.6);
 path(c,`M${s*1.15} ${s*.22} Q${s*2} ${s*.12} ${s*2.92} ${s*.02} L${s*3} ${s*.84} Q${s*2} ${s*.74} ${s*1.1} ${s*.3}Z`,P('#3a1f22'));
 teeth(c,P,{x0:s*1.45,y0:s*.2,x1:s*2.9,y1:s*.05},{type:'fang',size:2,color:'#efe7c9'});
 teeth(c,P,{x0:s*1.55,y0:s*.46,x1:s*2.95,y1:s*.82,upper:false},{type:'fang',size:1.9,color:'#efe7c9'});
 const head=path(c,`M-3 ${-n} Q${s*.9} ${-s*1.26} ${s*2} ${-s*1.04} Q${s*3} ${-s*.74} ${s*3.35} ${-s*.22} Q${s*3.25} ${s*.04} ${s*2.92} ${s*.04} Q${s*2} ${s*.2} ${s*1.2} ${s*.28} L-3 ${s*.32}Z`,grad(c,P,a,b,-s*1.2,s*.3),P(a,-.45),.6);
 if(!low){c.save();c.clip(head);for(let j=0;j<20;j++)ellipse(c,((j*37)%100)/100*s*3,-s*1.1+((j*53)%100)/100*s*1.3,2.2,1.5,P(K,0,.55),j);c.restore();skin(c,head,P,a,r.seed+4,16);}
 ellipse(c,s*.5,s*.1,3,2.2,P(K,0,.85));
 path(c,`M${s*3.15} ${-s*.32} L${s*3.5} ${-s*.62}`,null,P(a,-.2),2);
 eye(c,s*2.3,-s*.52,P,2.2,{iris:'#c9b45a'});
 c.restore();
 followSnake(p,245,14,.3,N);
}
// Giant squid (Architeuthis dux), redrawn: a long narrow mantle ending in small paired fins, eight thick tapering arms lined with suckers, two
// far longer feeding tentacles with clubbed ends, and an eye the size of a dinner plate.
function giantSquid(c,r,p,P,low,k=1){
 const a=r.colors.primary,b=r.colors.secondary,fan=armFan(p);
 const tent=(side)=>{const pts=Array.from({length:17},(_,j)=>{const t=j/16;return[42+t*214*k,side*(6+Math.sin(t*3.1)*28*(k<1?.8:1))*fan+Math.sin(p.swim*.7+t*4+side)*8*t,t>.8?1.3+Math.sin((t-.8)/.2*Math.PI)*4.6:1.7];}),S=spineOf(pts);path(c,S.outline(),P(a,side>0?.04:-.14),P(a,-.4),.4);if(!low)for(let j=14;j<16;j++){const [x,y]=S.at(j,0);ellipse(c,x,y,1.4,1.1,P(b,.1,.9));}};
 tent(-1);
 for(let i=0;i<8;i++){const y0=(i-3.5)*3.6,reach=(118+((i*5)%3)*17)*k,pts=Array.from({length:10},(_,j)=>{const t=j/9;return[40+t*reach,y0+(i-3.5)*15*fan*t+Math.sin(p.swim*.7+i*.9+t*3)*9*t,6.4*(1-t)+.7];}),S=spineOf(pts);path(c,S.outline(),grad(c,P,a,b,-60,60),P(a,-.4),.5);if(!low)for(let j=1;j<9;j++){const [x,y]=S.at(j,.5);ellipse(c,x,y,1.5-j*.1,1.1-j*.07,P(b,.14,.9));}}
 tent(1);
 ellipse(c,50,0,17,16,grad(c,P,a,b,-16,16));
 path(c,'M-138 0 L-84 -36 Q-62 -32 -50 -20 L-50 20 Q-62 32 -84 36Z',finFill(c,P,a,-60,0,-132,0),P(a,-.4),.6);
 const mantle=path(c,'M-142 0 Q-100 -24 -40 -28 Q10 -29 42 -18 Q47 0 42 18 Q6 30 -44 28 Q-100 24 -142 0Z',grad(c,P,a,b,-28,28),P(a,-.45),.8);
 c.save();c.clip(mantle);if(!low){skin(c,mantle,P,a,r.seed,70);for(let i=0;i<90;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-138+(u-Math.floor(u))*182,-28+(v-Math.floor(v))*56,.9+(i%3)*.5,.7+(i%2)*.3,P(a,-.42,.5));}ellipse(c,-40,-26,70,4,P('#ffffff',0,.16));}c.restore();
 path(c,'M36 14 L54 18 L38 22Z',P(a,-.22));
 eye(c,52,-3,P,5.6,{iris:'#c9a25a'});
}
// Crabs, redrawn 15 Nov 2026 from the front, as they really go (sideways) and as everyone pictures a crab: a shell wider than it is
// high with a toothed edge, eyes on short stalks, two heavy claws held up at the sides with dark-tipped pincers, and four jointed
// walking legs a side that splay out and down to pointed tips, stepping in turn. Seen from above, the legs had stuck straight up
// and down like a spider's. The snow crab has a rounder shell and far longer, thinner legs.
// Caribbean king crab (Maguimithrax spinosissimus): the largest crab of the Caribbean reef, a round shell covered in spines and
// knobs, long stout legs and heavy claws, red-brown to maroon; its shell grows to about 18 cm across.
function crab(c,res,p,P,low){
 const id=res.species,a=res.colors.primary,b=res.colors.secondary,snow=id==='snow_crab',king=id==='caribbean_king_crab',yeti=id==='yeti_crab',pom=id==='pom_pom_crab',hermit=id==='hermit_crab',ls=snow?1.55:king?1.3:1,K='#2a1410',far=farPalette(P);
 // A hermit crab lives in a borrowed sea-snail shell, which rises behind it.
 if(hermit){const sh=path(c,'M-46 -6 C-58 -50 -16 -76 22 -64 C54 -54 60 -16 42 -2 Q0 8 -46 -6Z',grad(c,P,b,a,-70,0),P(a,-.45),.8);if(!low){c.save();c.clip(sh);for(let i=0;i<5;i++)path(c,`M${-40+i*16} -6 Q${-30+i*12} ${-46+i*4} ${-2+i*6} ${-66+i*6}`,null,P(a,-.35,.6),1.6);c.restore();}}
 // Walking legs: out and up to the knee, then down to a dark pointed tip. The back pair furthest out; each lifts in turn.
 const leg=(side,i)=>{const lift=Math.max(0,Math.sin(p.swim*2+i*1.57+(side>0?0:Math.PI)))*6,x0=side*(30+i*4),y0=4+i*3,x1=side*(58+i*10)*ls,y1=-16+i*5-(snow?6:0),x2=side*(66+i*13)*ls,y2=(36+i*3)*(snow?1.25:1)-lift,col=i%2?far(a,-.1):P(a,-.06),th=king?1.25:1;
  line(c,[[x0,y0],[x1,y1]],col,(snow?4.2:6.4)*th);line(c,[[x1,y1],[x2,y2]],col,(snow?3:4.6)*th);ellipse(c,x1,y1,(snow?2.4:3.4)*th,(snow?2.4:3.4)*th,P(a,-.25));
  const ux=x2-x1,uy=y2-y1,l=Math.hypot(ux,uy);line(c,[[x2-ux/l*6,y2-uy/l*6],[x2+ux/l*3,y2+uy/l*3]],P(K,0,.85),2);};
 for(let i=3;i>=0;i--)for(const side of [-1,1])leg(side,i);
 // The claws: an arm from under the shell, bent up at the elbow, and a big pincer held up at each side.
 for(const side of [-1,1]){const sx=side,o=Math.sin(p.swim+side)*.08;
  line(c,[[sx*26,8],[sx*52,16]],P(a,-.08),snow?6:9);line(c,[[sx*52,16],[sx*62,-4]],P(a,-.02),snow?6:9);
  const cx=sx*64,cy=-14,k=snow?.78:1;
  // The palm, swollen, then the fixed finger on the inside and the moving finger on the outside, curving in to meet it.
  path(c,`M${cx-sx*13*k} ${cy+10*k} Q${cx-sx*16*k} ${cy-12*k} ${cx-sx*5*k} ${cy-19*k} Q${cx+sx*9*k} ${cy-21*k} ${cx+sx*14*k} ${cy-8*k} Q${cx+sx*16*k} ${cy+8*k} ${cx+sx*4*k} ${cy+14*k} Q${cx-sx*6*k} ${cy+17*k} ${cx-sx*13*k} ${cy+10*k}Z`,grad(c,P,a,b,cy-20,cy+16),P(a,-.5),.8);
  path(c,`M${cx-sx*1*k} ${cy-18*k} Q${cx-sx*2*k} ${cy-28*k} ${cx-sx*8*k} ${cy-33*k} Q${cx-sx*7*k} ${cy-24*k} ${cx-sx*9*k} ${cy-16*k}Z`,P(a,-.04),P(a,-.5),.7);
  c.save();c.translate(cx+sx*11*k,cy-12*k);c.rotate(sx*(o-.05));path(c,`M${-sx*7*k} ${-6*k} Q${-sx*2*k} ${-20*k} ${-sx*14*k} ${-24*k} Q${sx*2*k} ${-22*k} ${sx*3*k} ${-6*k}Z`,P(a,.02),P(a,-.5),.7);path(c,`M${-sx*14*k} ${-24*k} L${-sx*9*k} ${-23*k} L${-sx*10.5*k} ${-20*k}Z`,P(K,0,.9));c.restore();
  path(c,`M${cx-sx*8*k} ${cy-33*k} L${cx-sx*6.2*k} ${cy-27*k} L${cx-sx*8.6*k} ${cy-27*k}Z`,P(K,0,.9));
  if(!low)for(let t=0;t<4;t++)ellipse(c,cx-sx*(4-t*2.6)*k,cy-6*k+t*1.5,1,1,P(b,.2,.7));}
 // Yeti crab (2026-11-13): white, with long silky hairs on its claws and arms, where it farms the bacteria it eats.
 if(yeti&&!low)for(const side of [-1,1])for(let i=0;i<40;i++){const t=i/40,x=side*(t<.5?26+t/.5*26:52+(t-.5)/.5*16),y=t<.5?8+t/.5*8:16-(t-.5)/.5*36;line(c,[[x,y],[x+side*(6+Math.sin(i*2.3)*3),y+8+Math.cos(i*1.7)*3]],P('#b8a88a',0,.9),1.6);}
 // Pom pom crab (2026-11-13): it carries a small sea anemone in each claw, waved like pom-poms to keep enemies away.
 if(pom)for(const side of [-1,1]){const px=side*56,py=-48,w=Math.sin(p.swim*2+side)*2;for(let j=0;j<16;j++){const q=j/16*TAU;line(c,[[px,py],[px+Math.cos(q)*(9+w),py+Math.sin(q)*(9+w)]],P('#f2a0c0',0,.9),2.4);}ellipse(c,px,py,4,4,P('#f6c4d8'));}
 // Eye stalks, behind the shell's front edge.
 for(const side of [-1,1])line(c,[[side*10,-26],[side*17,-42]],P(a,-.2),3);
 const shell=path(c,snow||king?'M-46 2 Q-50 -24 -28 -34 Q0 -42 28 -34 Q50 -24 46 2 Q40 16 0 18 Q-40 16 -46 2Z':'M-50 2 Q-52 -22 -30 -32 Q0 -40 30 -32 Q52 -22 50 2 Q44 14 0 16 Q-44 14 -50 2Z',grad(c,P,a,b,-40,18),P(a,-.5),.9);
 c.save();c.clip(shell);path(c,'M-60 6 Q0 -6 60 6 L60 30 L-60 30Z',P(b,.06,.45));
 path(c,'M-24 -30 Q-12 -10 -14 8 M24 -30 Q12 -10 14 8',null,P(a,-.4,.45),1.4);
 if(pom&&!low){let d='';for(let row=-4;row<=2;row++)for(let col=-6;col<=5;col++){const x=col*9+(row%2)*4.5,y=row*8;d+=`M${x-4} ${y-3} L${x} ${y-5} L${x+4} ${y-3} L${x+4} ${y+3} L${x} ${y+5} L${x-4} ${y+3}Z `;}path(c,d,null,P('#6a3a22',0,.7),1.2);}
 if(!low){skin(c,shell,P,a,res.seed,40);for(let i=0;i<24;i++)ellipse(c,Math.cos(i*2.4)*(8+i*1.6),-12+Math.sin(i*2.4)*(6+i*.5),1.1,1,P(b,.2,.6));}c.restore();
 // The toothed front edge either side of the eyes.
 for(const side of [-1,1])for(let i=0;i<5;i++){const x=side*(20+i*6.4),y=-33+i*i*1.1;path(c,`M${x-side*3} ${y+1} L${x+side*1.5} ${y-4.5} L${x+side*3.5} ${y+2}Z`,P(a,-.1),P(a,-.5),.5);}
 if(king){for(let i=0;i<20;i++){const q=Math.PI+i/19*Math.PI,x=Math.cos(q)*47,y=-8+Math.sin(q)*28,nx=Math.cos(q),ny=Math.sin(q);path(c,`M${x-ny*3} ${y+nx*3} L${x+nx*7} ${y+ny*7} L${x+ny*3} ${y-nx*3}Z`,P(a,-.12),P(a,-.5),.5);}
  c.save();c.clip(shell);for(let i=0;i<22;i++){const q=i*2.39996,rr=4+Math.sqrt(i)*7.6,x=Math.cos(q)*rr*1.3,y=-10+Math.sin(q)*rr*.7;ellipse(c,x,y,2.6,2.2,P(a,-.22,.8));ellipse(c,x-.7,y-.7,1.1,1,P(b,.15,.75));}c.restore();}
 // Mouthparts under the front edge.
 if(!low)path(c,'M-6 8 L6 8 M-5 11 L5 11',null,P(a,-.45,.6),1);
 for(const side of [-1,1])eye(c,side*17.5,-44,P,yeti?1.8:2.2,{iris:yeti?'#d8d0c0':'#241812'});
 if(COMMUNITY_SPECIES[id].helmet)helmet(c,0,-12,82,P);
}
// Sea bunny (Jorunna parva), redrawn 15 Nov 2026: a plump oval slug about three times as long as it is high, not a dome. It is fuzzy all
// over (tiny rod-like bumps), freckled with black, with two dark 'ears' (rhinophores, ringed with folds) at the front, a fluffy pale
// tuft of gills at the back like a tail, and the edge of its foot showing underneath.
function seaBunny(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim);
 path(c,'M-68 10 Q-60 22 0 24 Q60 22 70 10 Q60 16 0 17 Q-60 16 -68 10Z',P(a,-.18));
 // The gill tuft: short branching plumes in a round bunch.
 for(let i=0;i<9;i++){const q=-2.4+i*.3+sw*.04,x0=-44+i*1.6,y0=-30,L=15+(i%3)*3,x1=x0+Math.cos(q)*L,y1=y0+Math.sin(q)*L;line(c,[[x0,y0],[x1,y1]],P(a,-.06,.95),3.2);if(!low)for(const t of [.45,.7,.9])line(c,[[x0+(x1-x0)*t,y0+(y1-y0)*t],[x0+(x1-x0)*t+Math.cos(q+1)*3.4,y0+(y1-y0)*t+Math.sin(q+1)*3.4]],P(a,-.06,.85),1);}
 // The rhinophores: dark, upright, ringed with fine folds.
 for(const [x,lean] of [[34,-4],[48,3]]){path(c,`M${x-5} -33 Q${x-8+lean} -50 ${x-4+lean} -60 Q${x+lean} -67 ${x+4+lean} -60 Q${x+8+lean} -50 ${x+5} -33Z`,P(b),P(b,-.3),.6);if(!low)for(let i=0;i<6;i++)line(c,[[x-3.5+lean*.8,-41-i*3.2],[x+3.5+lean*.8,-41-i*3.2]],P(a,0,.3),.6);}
 const body=path(c,'M-66 10 Q-76 -8 -60 -24 Q-36 -40 4 -40 Q44 -40 62 -24 Q76 -8 66 10 Q0 24 -66 10Z',grad(c,P,a,a,-40,22),P(a,-.3),.8);
 c.save();c.clip(body);ellipse(c,0,24,72,12,P('#c9c3b2',0,.3));
 if(!low)for(let i=0;i<320;i++){const x=-72+(i*37)%144,y=-40+(i*53)%60;line(c,[[x,y],[x+1.1,y-2.6]],P(i%3?'#ffffff':'#d9d4c4',0,.75),.8);}
 for(let i=0;i<28;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234,s2=.8+(i%4)*.6;ellipse(c,-60+(u-Math.floor(u))*120,-34+(v-Math.floor(v))*38,s2,s2*.9,P(b));}
 c.restore();
 // The fuzz along the whole top edge.
 if(!low)for(let i=0;i<62;i++){const q=Math.PI*1.04+i/61*Math.PI*.92,x=Math.cos(q)*66,y=-12+Math.sin(q)*28;line(c,[[x,y],[x+Math.cos(q)*7,y+Math.sin(q)*7]],P('#ffffff',0,.85),1);}
 ellipse(c,52,-10,2.6*eyeScale(),1.8*eyeScale(),P(ownEye(c,52,-10,1.4,'#1d1d1d')));ellipse(c,38,-10,2.6*eyeScale(),1.8*eyeScale(),P(ownEye(c,38,-10,1.4,'#1d1d1d')));
}
// Crab-eating frog (Fejervarya cancrivora): one of the few frogs that lives in salty water. Olive and blotched, with a pale belly, eyes high on the head and long, powerful, webbed hind legs held straight out behind while it swims.
function seaFrog(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#2c3018',kick=Math.sin(p.swim)*7;
 const hind=(o,far)=>{const col=far?P(a,-.3):grad(c,P,a,b,-6,24),q=far?-kick:kick;
  path(c,`M-32 ${2+o} Q-58 ${-8+o+q*.3} -74 ${6+o+q*.4} Q-58 ${14+o+q*.3} -30 ${16+o}Z`,col,P(a,-.45),.6);
  path(c,`M-72 ${4+o+q*.4} Q-96 ${8+o+q*.7} -118 ${10+o+q}`,null,far?P(a,-.32):P(a,-.1),6.5);
  path(c,`M-114 ${8+o+q} L-146 ${-2+o+q*1.2} L-140 ${8+o+q*1.2} L-150 ${16+o+q*1.2} L-138 ${18+o+q*1.2} L-142 ${28+o+q*1.2} L-112 ${15+o+q}Z`,finFill(c,P,a,-114,10+o+q,-146,10+o+q),P(a,-.45),.6);};
 hind(-5,true);
 const body=path(c,'M-40 8 Q-38 -18 -6 -26 Q22 -32 44 -24 Q58 -32 68 -24 Q86 -18 90 -4 Q88 8 72 12 Q50 22 10 24 Q-30 26 -40 8Z',grad(c,P,a,b,-30,26),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-44 14 Q10 12 92 2 L92 40 L-44 40Z',P(b,.08,.9));for(const [x,y,rx,ry,q] of [[-22,-10,9,6,.2],[4,-18,10,5,-.1],[26,-12,7,5,.3],[-2,-2,7,4,0],[54,-18,6,3.6,.2]])ellipse(c,x,y,rx,ry,P(K,0,.55),q);if(!low)skin(c,body,P,a,r.seed,60);c.restore();
 hind(4,false);
 path(c,`M24 14 Q34 ${26+kick*.3} 46 ${28+kick*.3}`,null,P(a,-.12),5.5);for(let i=0;i<3;i++)line(c,[[46,28+kick*.3],[53+i,27+i*4+kick*.3]],P(a,-.2),1.8);
 ellipse(c,64,-27,8.5,7.5,grad(c,P,a,b,-35,-20));
 faceLine(c,P,'M89 2 Q68 12 44 5',P(K,0,.72));
 ellipse(c,84,-9,1.2,.9,P(K,0,.7));
 eye(c,65,-28,P,3,{iris:'#c9a23c',bar:true});
}
// Banded sea krait (Laticauda colubrina): a slim snake of tropical reefs, blue-grey with even black rings, a yellow lip and a flattened tail like an oar.
function seaKrait(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=9,N=48,S=snakeLine(p,272,s,24,.34,N),e=S.pt[N],K='#15181f',n=e.w;
 const t0=S.pt[0];path(c,`M${t0.x+10} ${t0.y-3} Q${t0.x-16} ${t0.y-14} ${t0.x-26} ${t0.y} Q${t0.x-16} ${t0.y+14} ${t0.x+10} ${t0.y+3}Z`,P(K,0,.95));
 const body=path(c,S.outline(),grad(c,P,a,b,-30,30),P(a,-.45),.6);
 c.save();c.clip(body);roundLong(c,S,P,a,b);for(let i=1;i<N-1;i+=4)path(c,S.ribbon(-1.5,1.5,i,i+2),P(K,0,.95));if(!low)skin(c,body,P,a,r.seed,70);c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);
 const head=path(c,`M-3 ${-n} Q${s*.8} ${-s*1.15} ${s*2} ${-s*.9} Q${s*3} ${-s*.5} ${s*3.1} 0 Q${s*2.9} ${s*.6} ${s*2} ${s*.82} Q${s*.8} ${s} -3 ${n}Z`,P(K));
 c.save();c.clip(head);path(c,`M0 ${s*.32} L${s*3.3} ${s*.1} L${s*3.3} ${s*1.1} L0 ${s*1.1}Z`,P('#e6cf6a',0,.95));c.restore();
 faceLine(c,P,`M${s*3} ${s*.14} Q${s*1.8} ${s*.46} ${s*.8} ${s*.36}`,P(K,0,.85));
 eye(c,s*2.05,-s*.34,P,1.7,{iris:'#6a7686'});flick(c,P,s*3.1,s*.15,Math.sin(p.swim*1.3)>.55);
 c.restore();
 followSnake(p,272,24,.34,N);
}
// The Cat-fish (fictional), redrawn 2026-11-10: a tabby cat's front half, paddling, on the scaled tail of a fish.
function catFish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,8),kick=Math.sin(p.swim)*6,hd=25,hx=60,hy=-22,K='#2a2018';
 path(c,`M-92 ${2+sw} Q-126 ${-30+sw} -146 ${-30+sw} Q-132 ${-4+sw} -146 ${26+sw} Q-126 ${24+sw} -92 ${10+sw}Z`,finFill(c,P,b,-94,6+sw,-146,6+sw),P(b,-.35),.7);
 path(c,`M-6 26 Q2 ${40+kick*.5} 14 ${44+kick}`,null,P(a,-.28),9);
 const tail=path(c,`M-96 ${2+sw} Q-56 ${-14+sw*.5} -10 -22 Q10 -26 22 -24 L24 28 Q6 32 -14 30 Q-58 ${24+sw*.5} -96 ${10+sw}Z`,grad(c,P,b,b,-24,30),P(b,-.4),.7);
 if(!low){c.save();c.clip(tail);let d='';for(let row=0;row<9;row++)for(let x=-96+(row%2)*5;x<24;x+=10)d+=`M${x} ${-24+row*7} q6 3.5 0 7`;path(c,d,null,P(b,.4,.5),.6);c.restore();}
 const fur=path(c,'M6 -24 Q24 -32 42 -30 Q58 -28 64 -14 Q66 8 52 22 Q34 34 14 30 L19 22 L7 16 L18 8 L6 0 L18 -8 L6 -15Z',grad(c,P,a,a,-32,34),P(a,-.45),.7);
 if(!low){skin(c,fur,P,a,r.seed,40);c.save();c.clip(fur);for(let i=0;i<4;i++)path(c,`M${20+i*10} -34 q-2 16 3 26`,null,P(a,-.38,.7),3);ellipse(c,44,26,22,10,P('#f4ecdc',0,.85));c.restore();}
 path(c,`M50 18 Q64 ${30-kick*.5} 80 ${30-kick}`,null,P(a,-.06),10);ellipse(c,82,30-kick,6,4.6,P('#f4ecdc'));
 for(const dx of [-.5,.08]){const ex=hx+hd*dx;path(c,`M${ex-8} ${hy-hd*.7} L${ex-1} ${hy-hd*1.42} L${ex+9} ${hy-hd*.78}Z`,P(a,-.06),P(a,-.42),.6);path(c,`M${ex-4} ${hy-hd*.76} L${ex-.5} ${hy-hd*1.2} L${ex+5} ${hy-hd*.82}Z`,P('#e8b9a8',0,.85));}
 const head=path(c,`M${hx-hd} ${hy} Q${hx-hd} ${hy-hd*.98} ${hx} ${hy-hd*.95} Q${hx+hd*.7} ${hy-hd*.9} ${hx+hd*.98} ${hy-hd*.22} Q${hx+hd*1.26} ${hy-hd*.08} ${hx+hd*1.3} ${hy+hd*.2} Q${hx+hd*1.25} ${hy+hd*.62} ${hx+hd*.85} ${hy+hd*.72} Q${hx+hd*.2} ${hy+hd*1.02} ${hx-hd*.55} ${hy+hd*.78} Q${hx-hd} ${hy+hd*.45} ${hx-hd} ${hy}Z`,grad(c,P,a,a,hy-hd,hy+hd),P(a,-.45),.7);
 c.save();c.clip(head);ellipse(c,hx+hd*.92,hy+hd*.36,hd*.46,hd*.33,P('#f4ecdc',0,.92));ellipse(c,hx+hd*.62,hy+hd*.66,hd*.5,hd*.22,P('#f4ecdc',0,.92));for(let i=0;i<3;i++)path(c,`M${hx-hd*.25+i*hd*.25} ${hy-hd} l1 ${hd*.4}`,null,P(a,-.38,.8),2);if(!low)skin(c,head,P,a,r.seed+3,24);c.restore();
 const nx=hx+hd*1.22;path(c,`M${nx-hd*.16} ${hy-hd*.05} L${nx+hd*.08} ${hy-hd*.05} Q${nx+hd*.09} ${hy+hd*.08} ${nx-hd*.02} ${hy+hd*.12} Q${nx-hd*.14} ${hy+hd*.08} ${nx-hd*.16} ${hy-hd*.05}Z`,P('#d08a84'));
 faceLine(c,P,`M${nx-hd*.03} ${hy+hd*.13} L${nx-hd*.05} ${hy+hd*.34} Q${nx-hd*.3} ${hy+hd*.55} ${nx-hd*.62} ${hy+hd*.38}`,P(K,0,.72));
 if(!low)crisp(c,(c)=>{for(let i=0;i<3;i++)line(c,[[nx-4,hy+hd*.2+i*2],[nx+18,hy+i*6-2]],P('#f0ece1',0,.7),.6);});
 eye(c,hx+hd*.6,hy-hd*.28,P,2.4,{iris:'#a8b45a',slit:true});
}
// Hippocamp and kelpie, redrawn 2026-11-10. The hippocamp of Greek art has a horse's head, neck and forelegs and the long body of a fish; the kelpie of Scottish folklore is a shape-shifting water horse, drawn here dark, with a mane of river weed.
function hippocamp(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,8),kick=Math.sin(p.swim)*7,kelpie=id==='kelpie',K='#1c2a26',wave=Math.sin(p.swim*.8);
 path(c,`M-156 ${-16+sw*1.3} Q-182 ${-44+sw*1.3} -178 ${-66+sw*1.3} Q-160 ${-48+sw*1.3} -150 ${-30+sw*1.3} Q-164 ${-26+sw*1.3} -186 ${-22+sw*1.3} Q-172 ${-8+sw*1.3} -150 ${-6+sw*1.3}Z`,finFill(c,P,a,-154,-18+sw*1.3,-182,-40+sw*1.3),P(a,-.4),.7);
 const leg=(x,o,far)=>{const col=far?P(a,-.3):P(a,-.02),q=far?-kick:kick;path(c,`M${x} ${14+o} Q${x+14} ${38+o+q*.4} ${x+30} ${40+o+q*.6}`,null,col,10);path(c,`M${x+30} ${40+o+q*.6} L${x+42} ${32+o+q}`,null,col,7);path(c,`M${x+38} ${28+o+q} L${x+50} ${30+o+q} L${x+46} ${40+o+q} L${x+38} ${38+o+q}Z`,P(K,far?-.1:.1));if(!far)path(c,`M${x+26} ${36+o+q*.6} Q${x+18} ${52+o+q*.6} ${x+6} ${50+o+q*.5} Q${x+14} ${44+o} ${x+18} ${36+o+q*.4}Z`,finFill(c,P,b,x+22,40+o,x+8,50+o),P(a,-.4),.5);};
 leg(70,-5,true);
 const body=path(c,`M-160 ${-20+sw*1.3} Q-132 ${-6+sw*.7} -90 -8 Q-36 -8 18 -8 Q58 -8 76 -18 Q92 -36 100 -60 L134 -52 Q130 -12 108 16 Q78 46 20 46 Q-50 48 -100 30 Q-142 ${22+sw*.7} -168 ${-12+sw*1.3}Z`,grad(c,P,a,b,-30,48),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-170 40 Q-60 34 30 38 Q90 32 134 -30 L140 60 L-170 60Z',P(b,.05,.65));
 if(!low){skin(c,body,P,a,r.seed,110);let d='';for(let row=0;row<8;row++)for(let x=-164+(row%2)*5;x<36;x+=10)d+=`M${x} ${-14+row*8} q6 4 0 8`;path(c,d,null,P(a,.32,.42),.7);}
 c.restore();
 leg(62,5,false);
 const skull=path(c,'M100 -66 Q108 -88 126 -88 Q146 -84 168 -58 Q175 -48 168 -41 Q158 -36 146 -43 Q132 -52 122 -49 Q106 -48 100 -66Z',grad(c,P,a,b,-88,-38),P(a,-.45),.7);
 if(!low)skin(c,skull,P,a,r.seed+4,22);
 path(c,'M108 -84 L104 -104 L120 -88Z',P(a,-.08),P(a,-.45),.6);
 const mane=kelpie?P(b,-.12):P(b,.04),n=kelpie?12:9;
 {const front=[],rear=[];for(let i=0;i<n;i++){const t=i/(n-1),x0=112-t*38,y0=-90+t*82,l=(kelpie?46:32)*(.65+.35*Math.sin(i*1.9+wave*.8));front.push([x0,y0]);rear.unshift([+(x0-l).toFixed(1),+(y0+10+wave*5).toFixed(1)]);}let d='M'+front.map(q=>q.join(' ')).join(' L');rear.forEach((q,k)=>{const mx=k?(rear[k-1][0]+q[0])/2+4:q[0],my=k?(rear[k-1][1]+q[1])/2:q[1];d+=` Q${mx} ${my} ${q[0]} ${q[1]}`;});path(c,d+'Z',mane,P(b,kelpie?-.4:-.28),.6);if(!low)for(let i=1;i<n-1;i+=1){const [x0,y0]=front[i],[x1,y1]=rear[n-1-i];path(c,`M${x0} ${y0} Q${(x0+x1)/2} ${(y0+y1)/2-3} ${x1+3} ${y1-1}`,null,P(b,kelpie?-.32:-.2,.6),.8);}}
 ellipse(c,163,-51,1.8,1.3,P(K,0,.75));faceLine(c,P,'M171 -45 Q160 -42 150 -46',P(K,0,.72));
 eye(c,130,-70,P,2.6,{iris:kelpie?'#c9b23c':'#3a2a1c'});
}
// The Hydra of Greek myth, with nine serpent heads on one heavy body, and Scylla, the sea monster of the Odyssey, with six. Redrawn 2026-11-10.
function hydra(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),KG=id==='king_ghidorah',n=id==='scylla'?6:KG?3:9,K='#16201c';
 // King Ghidorah (requested by name, owner 2026-11-10): three horned heads on long necks, two tails and great golden wings.
 if(KG){const f=Math.sin(p.swim*.9)*16;for(const k of [0,1]){const o=k*18;path(c,`M${-10+o} 4 L${-30+o} ${-90-f} L${-70+o} ${-120-f} Q${-80+o} ${-90-f} ${-110+o} ${-86-f*.7} Q${-96+o} ${-56-f*.4} ${-118+o} ${-40-f*.3} Q${-80+o} ${-30} ${-50+o} 14Z`,P(b,k?-.2:0,.9),P(a,-.35),1);for(const [tx,ty] of [[-70,-120],[-110,-86],[-118,-40]])line(c,[[-30+o,-90-f],[tx+o,ty-(ty<-100?f:f*.6)]],P(a,-.2,.8),1.6);}path(c,`M-56 30 Q-120 ${46+sw} -190 ${66+sw*1.6} Q-122 ${58+sw} -54 44Z`,grad(c,P,a,b,30,60),P(a,-.45),.7);}
 path(c,`M-50 18 Q-112 ${6+sw} -176 ${24+sw*1.4} Q-118 ${34+sw} -52 48Z`,grad(c,P,a,b,6,48),P(a,-.45),.7);
 for(const x of [-34,28]){const k=Math.sin(p.swim+x)*8;path(c,`M${x-14} 42 Q${x-30} ${62+k} ${x-58} ${70+k} Q${x-30} ${74+k} ${x+14} 52Z`,finFill(c,P,a,x,48,x-54,70+k),P(a,-.45),.6);}
 const heads=Array.from({length:n},(_,i)=>{const t=n>1?i/(n-1):.5,q=-2.5+t*2.2,R=118+((i*3)%n)*(58/n);return{i,x:20+Math.cos(q)*R,y:24+Math.sin(q)*R*.95,sway:Math.sin(p.swim*.8+i*1.3)*7,far:i%2};}).sort((u,v)=>v.far-u.far);
 for(const h of heads){const x0=-30+h.i*(90/(n-1)),pts=Array.from({length:9},(_,j)=>{const t=j/8,cx=(x0+h.x)/2-10,cy=10+(h.y-10)*.25;return[(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*(h.x+h.sway),(1-t)*(1-t)*26+2*(1-t)*t*cy+t*t*h.y,11-t*5];}),S=spineOf(pts);
  path(c,S.outline(),grad(c,P,a,b,h.y-8,30),P(a,-.45),.6);
  if(!low)for(let j=1;j<8;j++)line(c,[S.at(j,-.85),S.at(j,.85)],P(a,-.3,.3),.6);
  rigidAt(c,h.x+h.sway,h.y,()=>{const s=h.far?.92:1;c.scale(s,s);
   path(c,'M4 3 L30 5 Q26 11 10 10 Q2 9 -6 6Z',P(a,-.12),P(a,-.45),.5);
   path(c,'M6 2 L33 -1 L30 5 L6 7Z',P('#3a1a20'));
   teeth(c,P,{x0:9,y0:2,x1:32,y1:-.6},{type:'fang',size:1.5,color:'#efe7cb'});
   const sk=path(c,'M-9 -7 Q3 -13 16 -10 L33 -4 Q37 0 33 2 L10 3 Q0 5 -9 7Z',grad(c,P,a,b,-13,7),P(a,-.45),.6);if(!low)skin(c,sk,P,a,r.seed+h.i,10);
   path(c,'M3 -11 L-5 -20 L10 -13Z',P(b,-.12),P(a,-.45),.4);
   if(KG)for(const [hx,hy,tx,ty] of [[0,-10,-14,-30],[6,-11,-4,-34]])path(c,`M${hx} ${hy} Q${tx+8} ${(hy+ty)/2} ${tx} ${ty} Q${tx+4} ${(hy+ty)/2+4} ${hx+5} ${hy+1}Z`,P(b,.15),P(a,-.45),.4);
   ellipse(c,30,-3,1.1,.7,P(K,0,.8));
   eye(c,12,-5.5,P,1.9,{iris:'#d9a93a',slit:true});});}
 const body=path(c,'M-74 26 Q-70 -6 -18 -8 Q44 -10 72 16 Q78 44 34 56 Q-30 66 -66 46 Q-76 38 -74 26Z',grad(c,P,a,b,-10,60),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-80 42 Q0 34 80 30 L80 70 L-80 70Z',P(b,.05,.55));if(!low){skin(c,body,P,a,r.seed,90);let d='';for(let row=0;row<8;row++)for(let x=-74+(row%2)*5;x<76;x+=10)d+=`M${x} ${-6+row*8} q5 5 10 0`;path(c,d,null,P(a,-.36,.4),.6);}c.restore();
}
// American lobster (Homarus americanus), redrawn 2026-11-10, side-on: a smooth shell ending in a spiked rostrum, a jointed tail ending in a fan, four pairs of walking legs, long antennae swept back, and two unequal claws, one a heavy crusher and one a slimmer cutter.
function lobster(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,4),K='#1a2018',q=Math.sin(p.swim*.8)*4;
 for(const k of [0,1])path(c,`M70 ${-14+k*3} Q124 ${-72+k*14+sw} ${30-k*20} ${-92+k*20+sw}`,null,P(b,.1,.85),1.3);
 const claw=(far)=>{const o=far?-16:0,x=far?6:0,col=far?P(a,-.28):grad(c,P,a,b,o-8,o+44),big=far?1.05:1.3,Z=(v)=>+(x+112+(v-112)*big).toFixed(1),Y=(v)=>+(o+18+(v-18)*big).toFixed(1);
  path(c,`M56 ${6+o*.4} Q84 ${14+o} 104 ${18+o+q*.3}`,null,far?P(a,-.3):P(a,-.04),far?7:9);
  const cl=path(c,`M${Z(98)} ${Y(10)} Q${Z(128)} ${Y(-6)} ${Z(160)} ${Y(4)} Q${Z(150)} ${Y(13)} ${Z(130)} ${Y(16)} Q${Z(148)} ${Y(20)} ${Z(156)} ${Y(32)} Q${Z(128)} ${Y(44)} ${Z(100)} ${Y(30)}Z`,col,P(a,-.5),.8);
  if(!low&&!far){skin(c,cl,P,a,r.seed+2,24);for(let i=0;i<6;i++)ellipse(c,Z(128+i*4),Y(17.4-i*.3),1.5,1.1,P('#e8dcc2'));}};
 claw(true);
 for(let i=0;i<4;i++){const x=-6+i*15,k=Math.sin(p.swim+i)*3;line(c,[[x,12],[x-6,28+k*.4],[x-14+k,42]],P(a,-.16),3.6);}
 for(const dy of [-1,1])path(c,`M-132 ${sw+dy*4} L${-160} ${dy*26+sw} Q-150 ${dy*8+sw} -130 ${sw}Z`,finFill(c,P,a,-132,sw,-158,dy*20+sw),P(a,-.45),.6);path(c,`M-132 ${sw-3} L-166 ${sw-5} L-166 ${sw+5} L-132 ${sw+3}Z`,finFill(c,P,a,-132,sw,-164,sw),P(a,-.45),.6);
 const tail=path(c,`M-130 ${-4+sw*.7} Q-90 -24 -24 -24 L-24 16 Q-90 14 -130 ${6+sw*.7}Z`,grad(c,P,a,b,-24,14),P(a,-.45),.7);
 c.save();c.clip(tail);for(let i=0;i<7;i++)path(c,`M${-120+i*15} -28 q-5 22 0 44`,null,P(a,-.45,.7),1.7);if(!low)skin(c,tail,P,a,r.seed,40);c.restore();
 for(let i=0;i<5;i++){const x=-108+i*17,k=Math.sin(p.swim*1.2+i)*2;path(c,`M${x} 13 q-2 8 -7 ${11+k}`,null,P(b,-.05),3);}
 const shell=path(c,'M-28 -26 Q20 -36 54 -26 Q66 -20 74 -18 L92 -14 L72 -8 Q72 8 58 14 Q18 24 -28 18Z',grad(c,P,a,b,-34,22),P(a,-.45),.8);
 c.save();c.clip(shell);path(c,'M-4 -40 Q-14 -2 -2 26',null,P(a,-.45,.7),1.7);path(c,'M16 -40 Q6 0 20 26',null,P(a,-.4,.5),1.2);if(!low){skin(c,shell,P,a,r.seed+1,50);for(let i=0;i<24;i++){const u=Math.sin(i*12.9)*43758.5,v=Math.sin(i*78.2)*12543.1;ellipse(c,-26+(u-Math.floor(u))*96,-30+(v-Math.floor(v))*46,1.2,1,P(a,.22,.6));}}c.restore();
 claw(false);
 line(c,[[66,-16],[72,-22]],P(a,-.12),3);
 eye(c,73,-23,P,2.4,{iris:'#141a14'});
}
// Spotted ratfish (Hydrolagus colliei), a chimaera or "ghost shark": a cousin of sharks with a rabbit-like snout, buck-toothed plates in place of teeth, an enormous reflective eye, a tall spined first dorsal fin, wing-like pectoral fins and a long tapering tail; silvery brown with white spots.
function ratfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),K='#1c2024',f=Math.sin(p.swim)*6;
 path(c,`M-54 -6 Q-90 ${-10+sw*.6} -124 ${-2+sw} Q-92 ${8+sw*.6} -54 10Z`,grad(c,P,a,b,-10,10),P(a,-.45),.5);
 path(c,`M-46 -11 Q-84 ${-20+sw*.5} -112 ${-7+sw} Q-82 ${-10+sw*.5} -46 -5Z`,P(a,-.1,.75));
 path(c,`M38 12 Q18 ${54+f} -18 ${54+f} Q-2 ${32+f*.5} 6 12Z`,farPalette(P)(a,-.05));
 path(c,'M18 -26 L12 -66 Q0 -58 -8 -28Z',finFill(c,P,a,6,-26,4,-62),P(a,-.45),.6);line(c,[[18,-26],[12,-68]],P('#e8e0cc'),1.6);
 const body=path(c,'M-62 -6 Q-30 -28 22 -30 Q60 -30 82 -20 Q100 -16 106 -6 Q110 6 96 9 Q86 12 76 18 Q40 30 -14 22 Q-44 16 -62 8Z',grad(c,P,a,b,-30,26),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-66 12 Q0 14 112 2 L112 40 L-66 40Z',P(b,.05,.75));for(let i=0;i<40;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-58+(u-Math.floor(u))*150,-28+(v-Math.floor(v))*34,1.9,1.6,P('#ffffff',0,.85));}if(!low){skin(c,body,P,a,r.seed,60);path(c,'M84 -6 Q20 -14 -56 2',null,P(a,-.4,.55),.9);}c.restore();
 path(c,`M52 14 Q30 ${58-f} -8 ${62-f} Q10 ${38-f*.5} 20 14Z`,finFill(c,P,a,40,16,4,60-f),P(a,-.45),.6);
 path(c,'M103 8 L108 15 L102 15 L99 9Z M96 9 L100 16 L95 16 L92 10Z',P('#f0e6c8'),P(K,0,.5),.4);
 faceLine(c,P,'M106 7 Q96 12 84 8',P(K,0,.72));
 ellipse(c,102,-11,1.2,.8,P(K,0,.7));
 eye(c,80,-11,P,5.2,{iris:'#7fc4c8'});
}
// Peacock mantis shrimp (Odontodactylus scyllarus), redrawn 2026-11-10: a long jointed body, green with bright bands, a blue-and-red tail fan, the clubbed striking limbs folded under the head and red at the elbow, and banded eyes that move on stalks.
function mantisShrimp(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,4),K='#16261c',q=Math.sin(p.swim*.8)*3;
 for(const dy of [-1,1])path(c,`M-124 ${sw+dy*3} L-150 ${dy*22+sw} Q-140 ${dy*7+sw} -122 ${sw}Z`,P('#2d8fd0',0,.95),P('#163f5e'),.7);
 path(c,`M-124 ${sw-3} L-156 ${sw-5} L-152 ${sw} L-156 ${sw+5} L-124 ${sw+3}Z`,P('#e85c3a',0,.95),P('#7a2a18'),.7);
 for(let i=0;i<6;i++){const x=-100+i*19,k=Math.sin(p.swim*1.3+i)*2.5;path(c,`M${x} 8 q-3 15 -9 ${17+k} q7 3 12 -14`,P("#e8a43a",0,.9),P(a,-.45),.4);}
 for(let i=0;i<3;i++){const x=28+i*11,k=Math.sin(p.swim+i)*2;line(c,[[x,14],[x-3,24+k],[x-8,30+k]],P(b,.05),2.2);}
 const tail=path(c,`M-126 ${-3+sw*.7} Q-86 -22 -18 -24 L-18 16 Q-86 14 -126 ${6+sw*.7}Z`,grad(c,P,a,a,-24,16),P(a,-.5),.7);
 c.save();c.clip(tail);for(let i=0;i<7;i++){const x=-118+i*16;path(c,`M${x} -28 q-5 22 0 46`,null,P(K,0,.55),1.5);ellipse(c,x+7,-13,4.4,3,P(i%2?b:'#f0d04a',0,.85));}if(!low)skin(c,tail,P,a,r.seed,40);c.restore();
 const shell=path(c,'M-22 -25 Q18 -32 48 -24 Q62 -20 68 -13 L70 8 Q46 18 -22 18Z',grad(c,P,a,a,-30,20),P(a,-.5),.8);
 c.save();c.clip(shell);ellipse(c,20,14,50,10,P('#e8a43a',0,.5));if(!low){skin(c,shell,P,a,r.seed+1,40);for(let i=0;i<16;i++){const u=Math.sin(i*12.9)*43758.5,v=Math.sin(i*78.2)*12543.1;ellipse(c,-20+(u-Math.floor(u))*86,-26+(v-Math.floor(v))*30,1.5,1.2,P('#d8f06a',0,.7));}}c.restore();
 path(c,`M56 10 Q72 ${34+q} 54 ${40+q}`,null,P(b),8);
 path(c,`M54 ${40+q} Q66 ${50+q} 86 ${42+q}`,null,P(b,.08),6);
 ellipse(c,90,41+q,8,6.5,P('#f06a4a'),-.2);if(!low)ellipse(c,88,38.5+q,3,1.8,P('#ffffff',0,.5),-.2);
 for(const dy of [-1,1])path(c,`M66 ${-12+dy*2} Q90 ${-24+dy*5} 112 ${-14+dy*7} Q92 ${-14+dy*3} 66 ${-8+dy}Z`,P('#e8a43a',.05,.9),P(a,-.45),.4);
 for(const k of [0,1])path(c,`M68 ${-10+k*3} Q130 ${-46+k*12+sw} 150 ${-22+k*14+sw}`,null,P(b,.12,.8),1);
 line(c,[[66,-18],[80,-32]],P(a,-.1),3.4);
 for(const [x,y,far] of [[84,-36,0],[73,-38,1]]){ellipse(c,x,y,6.4,5,P(far?'#3a9aa0':'#4cc3c9'));path(c,`M${x-6} ${y} L${x+6} ${y}`,null,P('#123038',0,.8),1.5);if(far)ellipse(c,x+1,y,1.8*eyeScale(),1.8*eyeScale(),P(lookIris()||'#1c2a33'));}
 ellipse(c,85,-36,2.1*eyeScale(),2.1*eyeScale(),P(ownEye(c,85,-36,2,'#1c2a33')));
}
// ---- 2026-11-10, more animals people asked for. ----
// Giant phantom jellyfish (Stygiomedusa gigantea): a deep-red bell about a metre across with no stinging tentacles, and four broad ribbon arms that can pass ten metres (drawn shortened here).
function phantomJelly(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=p.swim;
 for(const i of [0,3,1,2]){const x0=-36+i*24,S=spineOf(Array.from({length:18},(_,j)=>{const t=j/17;return[x0+Math.sin(t*5+sw*.6+i*1.4)*(6+20*t)+(i-1.5)*14*t,2+t*150,(i%2?12:15)*(.3+.7*Math.sin(Math.PI*Math.min(1,t*.95+.12)))];}));
  path(c,S.outline(),grad(c,P,a,b,0,150),P(a,-.4,.7),.6);if(!low){for(let j=2;j<16;j+=2)line(c,[S.at(j,-.8),S.at(j,.8)],P(a,-.3,.35),.6);line(c,S.pt.map((q)=>[q.x,q.y]),P(b,.2,.4),1);}}
 const d='M-62 0 C-64 -60 64 -60 62 0 Q46 7 31 2 Q16 8 0 3 Q-16 8 -31 2 Q-46 7 -62 0Z',bell=path(c,d,P(a),P(a,-.4),.8);
 c.save();c.clip(bell);const g=c.createRadialGradient(0,-34,4,0,-24,70);g.addColorStop(0,P(b,.1,.8));g.addColorStop(1,P(a,-.2,.2));c.fillStyle=g;c.fillRect(-70,-70,140,80);for(let i=0;i<13;i++){const x=-54+i*9;path(c,`M${x*.25} -46 Q${x*.8} -22 ${x} 6`,null,P(a,-.35,.4),.8);}ellipse(c,-20,-40,20,5,P('#ffffff',0,.18),-.4);c.restore();
}
// Velvet belly lanternshark (Etmopterus spinax): a small deep-sea shark, dark brown, with a black belly dotted with tiny lights, a spine before each dorsal fin, no anal fin, and big reflective eyes. About 45 cm.
function lanternShark(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),K='#101318';
 path(c,`M-82 -2 Q-98 ${-16+s} -114 ${-22+s} Q-104 ${-6+s*.6} -102 ${s*.4} L-108 ${10+s*.7} Q-96 ${10+s*.5} -82 5Z`,finFill(c,P,a,-84,0,-112,-10+s),P(a,-.4),.6);
 for(const [x,h] of [[6,20],[-44,26]]){path(c,`M${x+10} -15 Q${x} ${-15-h} ${x-12} ${-15-h} Q${x-18} ${-15-h*.5} ${x-16} -11Z`,finFill(c,P,a,x,-14,x-8,-15-h),P(a,-.4),.5);line(c,[[x+11,-15],[x+3,-13-h*.92]],P('#e8e0cc'),1.3);}
 const body=path(c,'M-86 -3 Q-50 -12 -10 -17 Q30 -20 60 -16 Q84 -12 94 -2 Q95 3 87 7 Q60 14 20 15 Q-40 13 -86 5Z',grad(c,P,a,a,-20,15),P(a,-.45),.7);
 c.save();c.clip(body);path(c,'M-90 5 Q-20 3 40 5 Q70 5 96 1 L96 30 L-90 30Z',P(K,0,.96));if(!low){skin(c,body,P,a,r.seed,40);for(let i=0;i<40;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-82+(u-Math.floor(u))*164,5+(v-Math.floor(v))*9,1.4,1.3,P(b,.2,.95));}}c.restore();
 path(c,'M36 11 Q26 28 12 30 Q18 22 20 12Z',finFill(c,P,a,28,12,16,29),P(a,-.4),.5);
 gillSlits(c,P,a,50,3,-5,6);faceLine(c,P,'M70 11 Q78 10 85 7',P('#0a0c10',0,.8));
 if(r.species==='cookiecutter_shark'){c.save();c.clip(body);path(c,'M38 -24 L50 -24 L54 20 L42 20Z',P('#0c0a08',0,.9));c.restore();path(c,'M68 12 Q78 16 86 9',null,P(a,.15),3);teeth(c,P,{x0:70,y0:12.5,x1:85,y1:9,upper:false},{type:'triangle',size:2.2,color:'#efe6cf'});}
 eye(c,70,-5,P,3.2,{iris:'#7fd6c0'});
}
// Blanket octopus (Tremoctopus violaceus): the females reach about 2 m, and carry a long see-through veil of purple, blue and pink between their upper arms, which they unfurl to look bigger.
function blanketOctopus(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,w=Math.sin(p.swim*.7)*8,fan=armFan(p);
 for(let i=0;i<6;i++){const y0=(i-2.5)*3.6,S=spineOf(Array.from({length:9},(_,j)=>{const t=j/8;return[12+t*58,y0+(i-2.5)*9*fan*t+Math.sin(p.swim+i+t*3)*5*t,4.2*(1-t)+.6];}));path(c,S.outline(),P(b,i%2?-.1:.05),P(a,-.3,.6),.4);}
 const d=`M22 -18 Q86 ${-74+w} 142 ${-68+w*.6} Q152 ${-48+w} 166 ${-44-w*.4} Q154 ${-22} 172 ${-8+w} Q156 ${10} 170 ${30-w} Q152 ${40} 146 ${66-w*.6} Q88 ${74-w} 22 18Z`,veil=path(c,d,P(a,.1,.62),P(b,.2,.75),.9);
 c.save();c.clip(veil);for(let i=0;i<9;i++){const q=-.86+i*.215,col=['#7a3fd0','#3f7fe0','#e070c0'][i%3];path(c,`M20 ${Math.sin(q)*14} L${20+Math.cos(q)*180} ${Math.sin(q)*180} L${20+Math.cos(q+.1)*180} ${Math.sin(q+.1)*180}Z`,P(col,0,.34));}for(let k=0;k<7;k++)path(c,`M${44+k*20} -90 Q${58+k*20} 0 ${44+k*20} 90`,null,P('#ffffff',0,.12),1);c.restore();
 for(const s of [-1,1])path(c,`M18 ${s*14} Q86 ${s*72-w*s*.1+w} 144 ${s*66+w*.6}`,null,P(a,-.05),3.2);
 ellipse(c,8,0,14,16,grad(c,P,a,b,-16,16));
 const mantle=path(c,'M-4 -16 Q-40 -40 -74 -20 Q-90 -2 -74 16 Q-42 36 -4 16Z',grad(c,P,a,b,-36,32),P(a,-.45),.7);
 if(!low){skin(c,mantle,P,a,r.seed,60);c.save();c.clip(mantle);for(let i=0;i<20;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-80+(u-Math.floor(u))*74,-30+(v-Math.floor(v))*56,1.6,1.3,P(b,.15,.75));}c.restore();}
 eye(c,10,-8,P,3.6,{iris:'#c9a25a',bar:true});
}
// Long-finned pilot whale (Globicephala melas): a big dolphin, almost black, with a round bulging melon, hardly any beak, a low swept-back dorsal fin set forward on the body, long pointed flippers, and a pale anchor-shaped patch under the throat.
function pilotWhale(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5);
 path(c,`M-106 -3 Q-128 ${-17+sw} -146 ${-18+sw} Q-136 ${-6+sw} -130 ${sw} Q-136 ${8+sw} -146 ${18+sw} Q-126 ${15+sw} -106 5Z`,finFill(c,P,a,-108,0,-144,0),P(a,-.45),.7);
 path(c,'M26 -28 Q12 -62 -14 -58 Q-6 -46 -14 -26Z',finFill(c,P,a,6,-28,-8,-56),P(a,-.45),.7);
 path(c,'M36 18 Q18 46 -32 56 Q-8 34 16 16Z',farPalette(P)(a,-.02));
 const body=path(c,r.species==='false_killer_whale'?'M-112 -3 Q-66 -18 -10 -25 Q40 -29 80 -25 Q108 -22 122 -12 Q130 -4 126 4 Q116 10 92 12 Q54 24 0 24 Q-66 22 -112 6Z':'M-112 -3 Q-66 -20 -10 -29 Q40 -34 72 -30 Q88 -38 108 -34 Q126 -26 128 -8 Q127 2 118 7 Q106 12 92 13 Q54 28 0 28 Q-66 24 -112 6Z',grad(c,P,a,b,-36,28),P(a,-.5),.8);
 c.save();c.clip(body);if(r.species!=='false_killer_whale')path(c,'M60 22 Q78 10 96 12 Q84 20 76 30 L56 30Z',P(b,0,.85));path(c,'M40 -36 Q30 -14 0 -8 Q-26 -14 -30 -36Z',P(b,-.1,.22));if(!low){skin(c,body,P,a,r.seed,70);ellipse(c,92,-32,28,5,P('#ffffff',0,.2));}c.restore();
 path(c,'M56 16 Q40 44 -20 62 Q-2 40 28 15Z',finFill(c,P,a,44,18,0,56),P(a,-.45),.7);
 faceLine(c,P,'M121 5 Q106 10 92 6',P('#04070a',0,.85));
 eye(c,92,-8,P,1.9,{iris:'#2b2119'});
}
// Dugong (Dugong dugon): the only sea cow in the Indo-Pacific. Smooth and grey-brown, with a whale-like forked tail (a manatee's is a round paddle), a snout bent sharply downward to graze seagrass, and small flippers.
function dugong(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),K='#26302f';
 path(c,`M-104 -3 Q-126 ${-18+sw} -146 ${-24+sw} Q-138 ${-8+sw} -132 ${sw} Q-138 ${8+sw} -146 ${24+sw} Q-126 ${18+sw} -104 6Z`,finFill(c,P,a,-106,0,-144,0),P(a,-.45),.7);
 const body=path(c,'M-110 -4 Q-60 -26 0 -32 Q50 -36 78 -26 Q92 -28 102 -20 Q116 -8 114 8 Q112 20 100 22 Q92 24 86 18 Q60 32 0 32 Q-66 28 -110 6Z',grad(c,P,a,b,-36,32),P(a,-.45),.8);
 if(!low){skin(c,body,P,a,r.seed,90);c.save();c.clip(body);ellipse(c,0,-32,70,5,P('#ffffff',0,.16));for(let i=0;i<30;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;line(c,[[-100+(u-Math.floor(u))*190,-26+(v-Math.floor(v))*50],[-97+(u-Math.floor(u))*190,-25+(v-Math.floor(v))*50]],P(a,-.3,.5),.7);}c.restore();}
 path(c,'M44 16 Q34 40 12 46 Q16 32 24 16Z',finFill(c,P,a,36,18,16,44),P(a,-.45),.6);
 ellipse(c,106,14,11,9,P(b,-.06),.3);
 if(!low)for(let i=0;i<10;i++)ellipse(c,100+(i%4)*4,10+Math.floor(i/4)*3.4,.6,.5,P(K,0,.7));
 faceLine(c,P,'M112 18 Q104 25 94 20',P(K,0,.72));
 ellipse(c,107,3,2,1.3,P(K,0,.8));
 eye(c,88,-8,P,1.8,{iris:'#2b2119'});
}
// Emperor penguin (Aptenodytes forsteri) as it really swims: flat out like a torpedo, flying with stiff narrow flippers,
// feet and short tail trailing as a rudder. Slate back, black head, golden ear patches fading to a pale yellow chest,
// white belly, and a black bill with an orange-pink plate along the lower half.
function penguinSwim(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#15171b',f=Math.sin(p.swim*1.6);
 const rot=(px,py,ang,pts)=>pts.map(([x,y])=>{const cs=Math.cos(ang),sn=Math.sin(ang);return[px+x*cs-y*sn,py+x*sn+y*cs];});
 const wing=(px,py,ang)=>{const q=rot(px,py,ang,[[6,-4],[-10,1],[-30,8],[-44,14],[-46,17],[-41,17],[-24,11],[-8,6],[7,3]]);return'M'+q.map(([x,y])=>x.toFixed(2)+' '+y.toFixed(2)).join(' L')+'Z';};
 path(c,wing(16,-2,.18+f*.38),P(K,.1,.85));
 path(c,'M-60 6 Q-74 12 -82 13 Q-80 9 -74 6 Q-80 3 -84 1 Q-74 0 -60 2Z',P('#3a3336'),P('#1c1719',0,.6),.5);
 path(c,'M-64 -3 Q-80 -3 -88 0 Q-80 4 -64 5Z',P(K,.1));
 const body=path(c,'M-70 1 Q-60 -11 -30 -19 Q8 -26 40 -20 Q55 -17 62 -9 Q66 -3 62 3 Q52 13 22 20 Q-18 25 -46 15 Q-62 9 -70 1Z',grad(c,P,a,a,-26,22),P(K,0,.55),.7);
 c.save();c.clip(body);
 path(c,'M-74 6 Q-46 4 -10 5 Q24 6 44 3 Q56 1 66 -1 L70 40 L-80 40Z',grad(c,P,b,b,0,24));
 if(!low){const g=c.createLinearGradient(46,0,20,14);g.addColorStop(0,P('#f2c94a',0,.85));g.addColorStop(1,P('#f6ecb8',0,0));c.fillStyle=g;c.fill(path(c,'M60 -1 Q44 6 18 10 Q30 2 48 -2Z'));}
 path(c,'M30 -26 Q56 -22 66 -8 Q64 -1 54 0 Q42 -2 32 -8Z',P(K));
 path(c,'M46 -8 Q54 -6 54 0 Q50 6 40 7 Q35 4 38 -1 Q40 -6 46 -8Z',P('#f0b23a',.05));
 if(!low){path(c,'M46 -8 Q54 -6 54 0 Q50 6 40 7',null,P('#ffe28a',0,.6),.6);ellipse(c,0,-22,46,4,P('#ffffff',0,.14));skin(c,body,P,a,r.seed,40);}
 const under=c.createLinearGradient(0,12,0,24);under.addColorStop(0,P('#04202e',0,0));under.addColorStop(1,P('#04202e',0,.18));c.fillStyle=under;c.fillRect(-80,12,150,14);
 c.restore();
 path(c,'M60 -9 Q72 -8.5 84 -4.6 Q73 -2.4 61 -2Z',P(K),P(K,.2),.4);
 path(c,'M63 -3.4 Q72 -3.6 81 -4.2',null,P('#f08a5d'),1.5);
 eye(c,52,-12,P,1.5,{iris:'#3a2a20'});
 const nw=wing(18,3,.32-f*.55);path(c,nw,finFill(c,P,a,14,0,-26,12),P(K,0,.5),.6);if(!low){const q=rot(18,3,.32-f*.55,[[-10,1],[-30,8],[-44,14]]);path(c,'M'+q.map(([x,y])=>x.toFixed(2)+' '+y.toFixed(2)).join(' L'),null,P(b,0,.75),1.1);}
}
// Black swallower (Chiasmodon niger), 2026-11-10: a deep-sea fish about 25 cm long that can swallow prey twice its own
// length. A slim black body, a long jaw of needle teeth, and a stomach stretched into a pale, see-through balloon with
// the outline of its last meal showing inside.
function swallower(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),K='#0b0d10';
 path(c,`M-78 -2 Q-92 ${-14+s} -100 ${-16+s} Q-96 ${s} -100 ${16+s} Q-92 ${14+s} -78 3Z`,finFill(c,P,a,-80,0,-98,0),P(a,-.4),.5);
 path(c,'M-60 -9 Q-40 -20 -10 -12 L-14 -6Z M-58 8 Q-36 18 -6 12 L-10 6Z',P(a,-.15,.9));
 const belly=path(c,'M-34 6 Q-36 50 2 58 Q42 62 52 30 Q56 12 40 6Z',P(b,.05,.55),P(b,-.2,.85),1);
 if(!low){c.save();c.clip(belly);path(c,'M-22 34 Q-2 24 26 32 Q34 36 42 30 L44 42 Q34 38 26 42 Q-2 50 -22 34Z',P(a,-.2,.3));ellipse(c,8,22,30,6,P('#ffffff',0,.22));c.restore();}
 const body=path(c,'M-82 -1 Q-50 -12 -6 -12 Q36 -14 60 -8 Q74 -5 78 0 Q72 4 60 6 Q34 9 -6 9 Q-50 9 -82 3Z',grad(c,P,a,a,-14,10),P(a,-.45),.6);
 if(!low)skin(c,body,P,a,r.seed,40);
 path(c,'M56 -4 L90 -1 L86 3 L56 4Z',P(a,-.05));path(c,'M58 4 L92 6 L88 9 L58 8Z',P(a,-.15));
 if(!low){teeth(c,P,{x0:60,y0:-.6,x1:88,y1:1.3},{type:'needle',size:1.5,color:'#e6e2d2'});teeth(c,P,{x0:60,y0:4.6,x1:88,y1:6.4,upper:false},{type:'needle',size:1.3,color:'#e6e2d2'});}
 eye(c,58,-6,P,2,{iris:'#3a4a52'});
}
// Livyatan melvillei, 2026-11-10: a sperm whale of about 13 to 17.5 m that hunted other whales 9 to 10 million years
// ago (reconstruction from its skull). Shorter and deeper in the head than a living sperm whale, with huge teeth in both
// jaws, up to 36 cm long, the biggest bite of any known four-legged animal's descendants.
function livyatan(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),K='#1c1716';
 path(c,`M-118 -2 Q-138 ${-22+sw} -160 ${-26+sw} Q-150 ${-6+sw} -146 ${sw} Q-150 ${8+sw} -160 ${26+sw} Q-138 ${22+sw} -118 6Z`,finFill(c,P,a,-120,0,-158,0),P(a,-.45),.7);
 path(c,'M-36 -30 Q-46 -46 -62 -46 Q-56 -36 -58 -28Z',P(a,-.12),P(a,-.45),.6);
 const body=path(c,'M-124 0 Q-80 -32 -10 -40 Q60 -46 98 -40 Q122 -36 126 -16 Q128 2 122 10 L118 22 Q100 34 60 36 Q0 40 -60 26 Q-104 16 -124 6Z',grad(c,P,a,b,-46,38),P(a,-.45),.8);
 c.save();c.clip(body);
 path(c,'M60 6 Q90 8 124 6 L124 40 L60 40Z',P(K,0,.92));
 if(!low){skin(c,body,P,a,r.seed,90);for(let i=0;i<9;i++)path(c,`M${-80+i*16} -32 q-5 20 2 46`,null,P(a,-.3,.32),1.3);ellipse(c,40,-38,60,5,P('#ffffff',0,.16));for(let i=0;i<6;i++)path(c,`M${-50+i*22} ${-20+(i%3)*8} l14 ${-3+(i%2)*6}`,null,P(b,.2,.5),1);}
 c.restore();
 teeth(c,P,{x0:66,y0:6.5,x1:121,y1:6.5},{type:'fang',size:4.2,color:'#efe7cf'});
 teeth(c,P,{x0:68,y0:9,x1:118,y1:11,upper:false},{type:'fang',size:3.8,color:'#e6dcc2'});
 path(c,'M30 16 Q14 44 -14 50 Q0 30 14 14Z',finFill(c,P,a,24,16,-6,46),P(a,-.45),.6);
 faceLine(c,P,'M123 -26 q4 -3 3 -8',P(a,-.5));
 eye(c,62,-6,P,2.2,{iris:'#2b2119'});
}
// Butterflyfish (Chaetodontidae), 2026-11-10: the threadfin butterflyfish (Chaetodon auriga) as the type: a flat round
// disc of a body, a small pointed snout for picking food from coral, a black bar hiding the eye, fine diagonal lines on
// the flank, a yellow rear half and a dark spot on the back fin that looks like an eye.
function butterflyfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),K='#16181c';
 path(c,`M-38 -4 Q-56 ${-18+s} -62 ${-16+s} Q-58 ${s} -62 ${16+s} Q-56 ${18+s} -38 4Z`,P(b,.02),P(b,-.3),.6);
 path(c,'M-36 -20 Q-26 -52 8 -46 Q28 -40 30 -30 L14 -32 Q-10 -30 -36 -18Z',P(b,0,.95),P(b,-.3),.6);
 path(c,'M-36 18 Q-26 44 4 42 L18 26Z',P(b,-.02,.95),P(b,-.3),.6);
 if(!low)path(c,'M-36 -20 Q-30 -40 -14 -44',null,P('#ffffff',0,.6),.8);
 const body=path(c,'M-40 0 Q-38 -36 2 -38 Q32 -38 44 -10 L58 -3 Q60 0 58 3 L44 8 Q32 34 2 36 Q-38 36 -40 0Z',grad(c,P,a,a,-38,36),P(a,-.4),.7);
 c.save();c.clip(body);
 const g=c.createLinearGradient(-40,0,20,0);g.addColorStop(0,P(b,0,.95));g.addColorStop(1,P(b,0,0));c.fillStyle=g;c.fillRect(-44,-40,64,80);
 if(!low)for(let i=0;i<9;i++)path(c,`M${-30+i*9} -36 l18 ${30+(i%2)*4}`,null,P(a,-.4,.45),1.1);
 path(c,'M26 -40 L38 -40 L42 40 L30 40Z',P(K,0,.92));c.restore();
 ellipse(c,-24,-30,5,4.5,P(K));ellipse(c,-24,-30,6.6,6,null);c.strokeStyle=P('#ffffff',0,.7);c.lineWidth=.9;c.beginPath();c.ellipse(-24,-30,6.4,5.8,0,0,TAU);c.stroke();
 path(c,'M6 12 Q-4 24 -12 26 Q-4 16 -2 12Z',P(b,-.05,.9));
 faceLine(c,P,'M57 1 L52 1.5',P(K,0,.8));
 eye(c,35,-5,P,2.2,{iris:'#2b2119'});
}
// Timingila, 2026-11-10: the vast fish of Hindu and Sanskrit stories whose name means "swallower of the timi", itself
// a giant fish. Drawn as an enormous, ornate fish with gleaming plate-like scales, trailing fins and a cavern of a mouth.
function timingila(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,7),K='#120e0c';
 path(c,`M-150 -4 Q-190 ${-50+s} -226 ${-62+s} Q-206 ${-20+s} -210 ${s} Q-206 ${20+s} -226 ${62+s} Q-190 ${50+s} -150 6Z`,finFill(c,P,b,-152,0,-222,0),P(b,-.35),.8);
 if(!low)for(let i=0;i<7;i++)path(c,`M-154 ${-3+i} Q-190 ${-46+i*15+s} -218 ${-54+i*18+s}`,null,P(b,.2,.45),1);
 path(c,`M-60 -50 Q-30 ${-104+s*.4} 30 -96 Q70 -86 70 -52Z`,finFill(c,P,b,0,-50,0,-100),P(b,-.35),.8);
 path(c,`M-40 46 Q-20 ${88+s*.4} 30 84 L40 44Z`,finFill(c,P,b,0,46,0,84),P(b,-.35),.8);
 const body=path(c,'M-160 0 Q-120 -60 0 -66 Q110 -68 150 -30 Q168 -10 166 4 Q162 30 140 44 Q90 66 0 64 Q-110 60 -160 6Z',grad(c,P,a,b,-68,66),P(a,-.45),1);
 c.save();c.clip(body);
 if(!low){let d='';for(let row=0;row<10;row++)for(let x=-150+(row%2)*9;x<150;x+=18){const y=-60+row*13;d+=`M${x} ${y} q9 9 18 0`;}path(c,d,null,P(b,.25,.55),1.2);skin(c,body,P,a,r.seed,160);ellipse(c,0,-60,130,8,P('#ffffff',0,.18));}
 path(c,'M150 -6 Q120 2 104 22 Q120 30 166 18Z',P(K));
 c.restore();
 path(c,'M168 -2 Q130 -4 104 22 Q132 12 166 14Z',P('#3a1a1c'));
 teeth(c,P,{x0:112,y0:12,x1:164,y1:-1},{type:'triangle',size:3,color:'#efe7cf'});teeth(c,P,{x0:112,y0:22,x1:162,y1:16,upper:false},{type:'triangle',size:2.6,color:'#efe7cf'});
 for(const s2 of [-1,1])path(c,`M150 ${s2>0?18:-10} Q176 ${s2>0?34:-24} 186 ${s2>0?52+s:-36+s}`,null,P(b,.1),2.4);
 path(c,'M60 30 Q40 64 10 72 Q24 50 30 30Z',finFill(c,P,b,50,30,16,70),P(b,-.35),.7);
 eye(c,116,-24,P,4.2,{iris:'#e0a83a'});
}
// Round goby (Neogobius melanostomus) as the type, 2026-11-10: a small bottom fish with a blunt head, big eyes set high,
// two back fins, a rounded tail, and pelvic fins joined into a sucker for clinging to rocks. Mottled for camouflage.
function goby(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),K='#1a1814';
 path(c,`M-48 -4 Q-66 ${-14+s} -70 ${s} Q-66 ${14+s} -48 4Z`,finFill(c,P,a,-50,0,-68,0),P(a,-.4),.5);
 path(c,'M2 -14 Q8 -32 22 -30 L26 -14Z',P(a,.05,.85),P(a,-.35),.5);path(c,'M-38 -10 Q-26 -28 -2 -24 L-2 -12Z',P(a,.05,.85),P(a,-.35),.5);
 path(c,'M-36 9 Q-20 20 -2 16 L-2 9Z',P(a,-.05,.85));
 const body=path(c,'M-50 -2 Q-30 -14 4 -15 Q30 -17 44 -10 Q54 -4 52 4 Q48 12 34 13 Q0 15 -50 4Z',grad(c,P,a,b,-17,14),P(a,-.4),.6);
 if(!low){c.save();c.clip(body);for(let i=0;i<22;i++)ellipse(c,-44+((i*37)%100)*.9,-12+((i*53)%100)*.22,3+(i%3),2+(i%2),P(a,-.32,.55));skin(c,body,P,a,r.seed,30);c.restore();}
 oval(c,18,13,8,3.5,P(b,-.05,.9),P(a,-.3,.6),.5);
 path(c,'M28 8 Q12 22 6 18 Q14 10 20 7Z',P(a,-.08,.85));
 faceLine(c,P,'M51 4 Q46 7 40 6',P(K,0,.75));
 eye(c,40,-9,P,2.6,{iris:'#c9a25a'});
}
// Pyrosome, or sea pickle, 2026-11-10: a hollow tube made of thousands of tiny animals living together, open at one
// end, covered in soft bumps, which glows blue-green when touched. Usually a hand long; some reach metres.
function pyrosome(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sq=Math.sin(p.swim)*1.5,K='#3a1f2a';
 const tube=path(c,`M-80 ${-14-sq} Q-84 0 -80 ${14+sq} Q-20 ${20+sq} 60 ${17+sq} Q78 14 80 0 Q78 -14 60 ${-17-sq} Q-20 ${-20-sq} -80 ${-14-sq}Z`,P(a,0,.72),P(a,.15,.85),1);
 c.save();c.clip(tube);
 const g=c.createLinearGradient(0,-20,0,20);g.addColorStop(0,P('#ffffff',0,.28));g.addColorStop(.45,P(a,0,0));g.addColorStop(1,P(K,0,.3));c.fillStyle=g;c.fillRect(-90,-24,180,48);
 if(!low)for(let row=0;row<5;row++)for(let i=0;i<14;i++){const x=-74+i*10.5+(row%2)*5,y=-15+row*7.5;ellipse(c,x,y,3,2.4,P(a,.22,.6));ellipse(c,x+.6,y+.6,1.1,.9,P(b,.1,.85));}
 c.restore();
 crisp(c,(c)=>{const pulse=.5+.5*Math.sin(p.swim*1.3);for(let i=0;i<10;i++){const x=-68+i*14,y=((i*7)%5-2)*5;const gg=c.createRadialGradient(x,y,0,x,y,7);gg.addColorStop(0,P(b,.3,.55*pulse));gg.addColorStop(1,P(b,0,0));c.fillStyle=gg;c.beginPath();c.arc(x,y,7,0,TAU);c.fill();}});
 oval(c,-81,0,4,14+sq,P(K,0,.65),P(a,.1,.8),1);
}
// Phoenix, 2026-11-10: the fire bird of Greek and Egyptian stories, reborn from its own ashes. A proud upright bird with
// a crest and a long tail of flame-shaped plumes that flicker.
function phoenix(c,r,p,P,low){
 const k=AVIAN[r.species],a=r.colors.primary,b=r.colors.secondary,hx=k.L*.05,hy=-k.H*.72,hr=k.L*.55,t=p.swim;
 for(let i=0;i<5;i++){const f=Math.sin(t*1.6+i)*4,l=k.L*(1.7+i*.18),dy=k.H*(.28+i*.12);
  const tip=[-k.L*.3-l,k.H*.4+dy+f];
  path(c,`M${-k.L*.3} ${k.H*.32} Q${-k.L*.3-l*.5} ${k.H*.25+dy*.6+f} ${tip[0]} ${tip[1]} Q${-k.L*.3-l*.55} ${k.H*.5+dy*.7+f} ${-k.L*.2} ${k.H*.52}Z`,grad(c,P,b,a,k.H*.2,k.H*.4+dy),P(a,-.3,.6),.6);
  if(!low)ellipse(c,tip[0]+6,tip[1]-1,4,3,P('#fff1a8',0,.75));}
 avian(c,r,p,P,low);
 for(let i=0;i<4;i++){const f=Math.sin(t*2+i)*2;path(c,`M${hx-hr*.2+i*3} ${hy-hr*.75} Q${hx-hr*.6+i*2} ${hy-hr*1.5-i*2+f} ${hx-hr*(.9-i*.12)} ${hy-hr*(1.7+i*.05)+f}`,null,P(i%2?b:a,.1),2.6);}
}
// Telescopefish (Gigantura chuni), 2026-11-10: a small silvery deep-sea fish whose big tube-shaped eyes point straight
// ahead like binoculars, with a wide mouth and a tail whose lower lobe trails out long. About 15 cm.
function telescope(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),K='#101418';
 path(c,`M-52 -2 Q-66 ${-10+s} -70 ${-12+s} Q-68 ${-2+s} -66 ${2+s} Q-96 ${14+s*1.4} -140 ${30+s*1.8} Q-96 ${22+s} -50 5Z`,finFill(c,P,a,-52,0,-120,20),P(a,-.35),.5);
 path(c,'M-24 -9 Q-30 -20 -40 -20 L-40 -6Z',P(a,0,.8));path(c,'M14 8 Q4 24 -10 24 Q-2 14 0 8Z',P(a,.05,.8));
 const body=path(c,'M-56 -2 Q-30 -12 10 -13 Q40 -14 56 -8 Q64 -3 62 4 Q56 10 40 11 Q0 12 -56 4Z',grad(c,P,a,b,-14,12),P(a,-.4),.6);
 if(!low){c.save();c.clip(body);ellipse(c,0,-10,50,3,P('#ffffff',0,.35));path(c,'M-54 0 Q0 -2 58 -2',null,P(b,.2,.5),.8);c.restore();}
 const tube=path(c,'M40 -10 L58 -15 Q66 -16 66 -9 Q66 -3 58 -3 L40 -2Z',grad(c,P,a,b,-16,-2),P(a,-.45),.6);
 oval(c,66,-9,3.6,6,P('#d8e2e4',0,.85),P(a,-.4),.5);
 faceLine(c,P,'M62 4 Q52 7 40 6',P(K,0,.75));
 eye(c,66,-9,P,2.2,{iris:'#1e3a40'});
}
// Lookdown (Selene vomer), 2026-11-10: a jack so flat and tall it looks cut from foil, with a steep, almost straight
// forehead, a mouth low on the face, and long trailing filaments on the front of the back and belly fins. To about 48 cm.
function lookdown(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),K='#141619';
 path(c,`M-38 -3 Q-54 ${-20+s} -62 ${-26+s} Q-54 ${s} -62 ${26+s} Q-54 ${20+s} -38 3Z`,finFill(c,P,a,-40,0,-60,0),P(a,-.35),.5);
 const fl=Math.sin(p.swim*.8)*4;
 // The threads grow from just inside the back and belly, so they never come loose.
 path(c,`M4 -36 Q-14 ${-70+fl} -36 ${-88+fl}`,null,P(a,.15,.9),2.2);path(c,`M2 32 Q-12 ${66-fl} -32 ${80-fl}`,null,P(a,.15,.9),2.2);
 path(c,'M2 -39 Q-20 -36 -38 -6 L-30 -6 Q-14 -30 4 -36Z',P(a,.05,.75));path(c,'M0 37 Q-20 34 -38 6 L-30 6 Q-14 28 2 34Z',P(a,.05,.75));
 const dt=r.species==='diamond_trevally';
 const body=path(c,dt?'M-40 0 Q-30 -30 4 -38 Q34 -40 50 -12 Q54 0 50 6 Q40 22 4 34 Q-30 28 -40 0Z':'M-40 0 Q-30 -30 4 -40 Q26 -46 38 -34 Q44 -12 46 4 Q44 14 36 20 Q20 34 0 38 Q-30 30 -40 0Z',grad(c,P,a,b,-44,38),P(a,-.35),.6);
 if(!low){c.save();c.clip(body);const g=c.createLinearGradient(-40,-40,40,40);g.addColorStop(0,P('#ffffff',0,.35));g.addColorStop(.5,P('#c8e8f0',0,.12));g.addColorStop(1,P('#ffffff',0,.3));c.fillStyle=g;c.fillRect(-44,-48,92,90);path(c,'M-38 2 Q0 -4 44 6',null,P(a,-.2,.4),.8);c.restore();}
 path(c,'M20 10 Q8 20 0 22 Q8 14 12 8Z',P(a,.1,.8));
 faceLine(c,P,dt?'M52 4 Q48 8 42 8':'M45 9 Q41 13 36 13',P(K,0,.75));
 eye(c,dt?36:30,-6,P,2.6,{iris:'#3a3a32'});
}
// Sea butterfly (a pteropod, Limacina helicina), 2026-11-10: a snail the size of a lentil that swims by flapping two
// wing-like flaps of its foot, carrying a thin, see-through coiled shell.
function pteropod(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,fl=Math.sin(p.swim*1.6)*16;
 path(c,`M2 -4 Q-6 ${-44-fl} 24 ${-58-fl} Q34 ${-30-fl*.5} 14 -2Z`,P(b,.1,.6),P(b,-.15,.85),1);
 path(c,`M2 4 Q-6 ${44+fl} 24 ${58+fl} Q34 ${30+fl*.5} 14 2Z`,P(b,.05,.55),P(b,-.15,.85),1);
 oval(c,12,0,12,8,P(b,0,.7),P(b,-.15,.85),1);
 const shell=path(c,'M-46 0 Q-48 -34 -14 -38 Q20 -36 22 -6 Q20 22 -12 26 Q-44 26 -46 0Z',P(a,.05,.6),P(a,-.3,.85),1);
 c.save();c.clip(shell);
 c.strokeStyle=P(a,-.25,.75);c.lineWidth=1.6;c.beginPath();for(let q=0;q<TAU*2.6;q+=.12){const rr=2+q*3.6,x=-14+Math.cos(q+1)*rr,y=-4+Math.sin(q+1)*rr*.9;q?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
 ellipse(c,-14,-4,16,12,P(b,.1,.45));ellipse(c,-24,-24,14,5,P('#ffffff',0,.4));c.restore();
 eye(c,18,-2,P,1.4,{iris:'#1d2a30'});
}
// Sulphur-crested cockatoo, 2026-11-10: white all over with a tall yellow crest it raises and lowers, a pale yellow wash
// under the wings, and a heavy dark grey hooked beak.
function cockatoo(c,r,p,P,low){
 const k=AVIAN[r.species],b=r.colors.secondary,hx=k.L*.05,hy=-k.H*.72,hr=k.L*.55,up=(Math.sin(p.swim*.5)+1)*.5;
 for(let i=0;i<6;i++){const ang=-2.05+i*.16-up*.25,l=hr*(1.3+.25*Math.sin(i*1.7));path(c,`M${hx-hr*.05+i*1.2} ${hy-hr*.6} Q${hx-hr*.05+Math.cos(ang)*l*.6} ${hy-hr*.6+Math.sin(ang)*l*.7} ${hx-hr*.05+Math.cos(ang)*l} ${hy-hr*.6+Math.sin(ang)*l}`,null,P(b,i%2?.05:-.05),3.2);}
 avian(c,r,p,P,low);
}
// Longhorn cowfish (Lactoria cornuta), 2026-11-10: a boxfish whose body is a rigid box of fused hexagonal plates, with
// two horns sticking forward over the eyes and two back under the tail, a small pursed mouth, and a long rounded tail fin.
// It sculls along with its small fins while the box stays still.
function cowfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim*2)*4,K='#1c1810';
 path(c,`M-32 -5 Q-70 ${-14+f} -92 ${-10+f} Q-96 ${f} -92 ${10+f} Q-70 ${14+f} -32 5Z`,finFill(c,P,a,-42,0,-90,0),P(a,-.35),.5);
 for(const [x,y,dx,dy] of [[-32,-10,-26,-8],[-30,10,-26,8]])path(c,`M${x} ${y} L${x+dx} ${y+dy} L${x+3} ${y+(y<0?5:-5)}Z`,P(b,.05),P(a,-.4),.5);
 path(c,`M-8 -24 Q-4 ${-34-f} 8 ${-36-f} L10 -24Z`,P(a,.1,.6));path(c,`M-6 22 Q-2 ${32+f} 8 ${34+f} L10 22Z`,P(a,.1,.6));
 const body=path(c,'M-36 -14 Q-36 -26 -20 -28 L22 -28 Q38 -26 44 -12 L46 6 Q42 22 24 26 L-20 26 Q-36 24 -36 12Z',grad(c,P,a,b,-28,26),P(a,-.45),.8);
 c.save();c.clip(body);let d='';for(let row=0;row<6;row++)for(let i=0;i<9;i++){const x=-34+i*10+(row%2)*5,y=-26+row*10;d+=`M${x} ${y-5} l4.3 2.5 l0 5 l-4.3 2.5 l-4.3 -2.5 l0 -5Z`;}path(c,d,null,P(a,-.3,.55),.8);
 if(!low)for(let i=0;i<20;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-30+(u-Math.floor(u))*70,-22+(v-Math.floor(v))*44,1.5,1.4,P('#4ab0d0',0,.75));}
 ellipse(c,4,-26,36,4,P('#ffffff',0,.25));c.restore();
 for(const y of [-20,-8])path(c,`M30 ${y} L58 ${y-10} L34 ${y+5}Z`,P(b,.1),P(a,-.4),.6);
 path(c,'M44 4 Q52 6 52 9 Q48 12 44 10Z',P(a,-.05),P(a,-.45),.6);ellipse(c,51,8,1.4,1.2,P(K,0,.8));
 path(c,'M14 8 Q8 16 2 18 Q6 12 8 8Z',P(a,.1,.8));
 eye(c,30,-12,P,3,{iris:'#3a4a2a'});
}
// Nematode (a roundworm), 2026-11-10: a smooth, unsegmented worm tapering at both ends, see-through enough to show the
// gut running its length, thrashing in a tight S as it swims. Most are under a millimetre; drawn here hugely magnified.
function nematode(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=7,N=36,span=280,S=snakeLine(p,span,s,22,.5,N),e=S.pt[N];
 const body=path(c,S.outline(),P(a,0,.82),P(a,-.35,.8),.8);
 c.save();c.clip(body);path(c,S.ribbon(-.15,.25),P(b,-.05,.75));path(c,S.ribbon(-.9,-.55),P('#ffffff',0,.35));c.restore();
 if(!low)for(let i=6;i<N-4;i+=4){const [x0,y0]=S.at(i,-1),[x1,y1]=S.at(i,1);line(c,[[x0,y0],[x1,y1]],P(a,-.2,.25),.5);}
 ellipse(c,e.x,e.y,2.2,2.2,P(b,-.25,.9));
 followSnake(p,span,22,.5,N);
}
// Reaper Leviathan (requested by name, owner 2026-11-10): a long, armoured serpent of a predator, pale with darker
// bands down its back, ridged fins along its sides, glowing eyes, and four mandibles spread round its mouth.
function reaperLeviathan(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=30,N=34,span=380,S=snakeLine(p,span,s,20,.32,N),e=S.pt[N],K='#141418';
 for(let i=8;i<N-4;i+=8){const [x,y]=S.at(i,.95),q=S.pt[i],f=Math.sin(p.swim+i*.4)*3;path(c,`M${x} ${y} L${x-q.nx*-14-Math.cos(q.th)*16+f} ${y+q.ny*14-Math.sin(q.th)*16+12} L${x-Math.cos(q.th)*10} ${y-Math.sin(q.th)*10}Z`,P(b,0,.9),P(b,-.4,.6),.5);}
 const body=path(c,S.outline(),grad(c,P,a,a,-26,26),P(a,-.5),.8);
 c.save();c.clip(body);path(c,S.ribbon(.3,1.05),P(a,.15,.6));for(let i=3;i<N-1;i+=2)path(c,S.ribbon(-1.05,-.15,i,i+1),P(a,-.45,.75));if(!low){for(let i=2;i<N;i++)line(c,[S.at(i,-1),S.at(i,1)],P(a,-.35,.35),.7);skin(c,body,P,a,r.seed,80);}c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);
 const open=.12+.08*Math.sin(p.swim*.7);
 for(const [sy,ang] of [[-1,-.55-open],[1,.55+open],[-1,-.18-open*.5],[1,.18+open*.5]]){c.save();c.translate(40,sy*9);c.rotate(ang);path(c,`M0 ${-sy*5} Q28 ${-sy*7} 54 ${sy*3} Q34 ${sy*8} 0 ${sy*6}Z`,grad(c,P,a,b,-9,9),P(a,-.5),.8);path(c,`M48 ${sy*1} l10 ${sy*5} l-11 ${sy*2}Z`,P('#e8e0cc'));c.restore();}
 ellipse(c,46,0,6,10,P('#2a1218'));
 const head=path(c,`M-10 ${-e.w} Q24 ${-e.w-12} 46 -12 Q56 0 46 12 Q24 ${e.w+8} -10 ${e.w}Z`,grad(c,P,a,a,-e.w-12,e.w),P(a,-.5),.8);
 if(!low){c.save();c.clip(head);for(let i=0;i<4;i++)path(c,`M${-2+i*8} ${-e.w-6} q2 ${e.w} 0 ${e.w*2+8}`,null,P(a,-.4,.4),1);c.restore();}
 crisp(c,(c)=>{for(const dy of [-10,-3]){const g=c.createRadialGradient(32,dy,0,32,dy,4);g.addColorStop(0,P('#fff1b0',0,.95));g.addColorStop(1,P('#ffb03a',0,0));c.fillStyle=g;c.beginPath();c.arc(32,dy,4,0,TAU);c.fill();}});
 eye(c,32,-10,P,2,{iris:'#f2c44a',slit:true});
 c.restore();
 followSnake(p,span,20,.32,N);
}
// Gargantuan Leviathan (requested by name, owner 2026-11-10): the vast eel of the deep with a fan of spines down its
// back, rows of glowing blue spots, a cluster of small eyes and a crown of tentacles round its mouth.
function gargantuanLeviathan(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=34,N=40,span=420,S=snakeLine(p,span,s,24,.28,N),e=S.pt[N];
 for(let i=4;i<N-1;i+=2){const [x,y]=S.at(i,-.95),q=S.pt[i],h=10+q.w*.5;path(c,`M${x-Math.cos(q.th)*5} ${y-Math.sin(q.th)*5} L${x-q.nx*h-Math.cos(q.th)*6} ${y-q.ny*h-Math.sin(q.th)*6} L${x+Math.cos(q.th)*5} ${y+Math.sin(q.th)*5}Z`,P(a,-.2),P(a,-.5,.6),.5);}
 const body=path(c,S.outline(),grad(c,P,a,b,-30,30),P(a,-.5),.8);
 c.save();c.clip(body);path(c,S.ribbon(.35,1.1),P(b,.05,.55));if(!low)skin(c,body,P,a,r.seed,100);c.restore();
 crisp(c,(c)=>{for(let i=3;i<N-2;i+=2)for(const u of [-.35,.4]){const [x,y]=S.at(i,u),g=c.createRadialGradient(x,y,0,x,y,4);g.addColorStop(0,P('#bff4ff',0,.9));g.addColorStop(1,P('#3ab8ff',0,0));c.fillStyle=g;c.beginPath();c.arc(x,y,4,0,TAU);c.fill();}});
 c.save();c.translate(e.x,e.y);c.rotate(e.th);
 for(let i=0;i<7;i++){const ang=-.9+i*.3,w=Math.sin(p.swim*1.2+i)*6,len=34+(i%3)*8;path(c,`M14 ${Math.sin(ang)*e.w*.6} Q${14+len*.6} ${Math.sin(ang)*e.w*.9+w} ${14+len} ${Math.sin(ang)*(e.w+12)+w*1.4}`,null,P(b,i%2?.05:-.1),3.4);}
 const head=path(c,`M-8 ${-e.w} Q10 ${-e.w-6} 20 -6 Q24 0 20 6 Q10 ${e.w+6} -8 ${e.w}Z`,grad(c,P,a,a,-e.w-6,e.w),P(a,-.5),.8);
 ellipse(c,21,0,4,8,P('#1a1018'));
 for(const [dx,dy] of [[6,-10],[10,-7],[3,-6]])eye(c,dx,dy,P,1.3,{iris:'#7fdcff'});
 c.restore();
 followSnake(p,span,24,.28,N);
}
// Tulkun (requested by name, owner 2026-11-10): the great whale-like people of the ocean, with a heavy armoured crest
// sweeping back over the head, deep-set wise eyes, broad fins, and markings in pale curving lines.
function tulkun(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),K='#141b20';
 path(c,`M-130 -2 Q-156 ${-30+sw} -182 ${-38+sw} Q-170 ${-12+sw} -164 ${sw} Q-170 ${14+sw} -182 ${40+sw} Q-156 ${32+sw} -130 8Z`,finFill(c,P,a,-132,2,-180,2),P(a,-.45),.8);
 path(c,'M36 22 Q14 60 -30 78 Q-16 48 6 20Z',farPalette(P)(a,-.05));
 const body=path(c,'M-136 0 Q-90 -40 -10 -48 Q60 -52 104 -38 Q132 -26 140 -6 Q142 10 128 20 Q96 38 40 42 Q-50 44 -136 8Z',grad(c,P,a,b,-52,44),P(a,-.5),.9);
 c.save();c.clip(body);path(c,'M-140 10 Q-40 22 60 24 Q110 22 146 6 L146 60 L-140 60Z',P(b,.05,.75));
 if(!low){for(let i=0;i<6;i++)path(c,`M${-100+i*30} ${-30+(i%2)*4} q14 10 4 26 q-10 14 6 24`,null,P(b,.25,.55),1.6);for(let i=0;i<14;i++)path(c,`M${60-i*4} 24 q-6 6 -14 8`,null,P(a,-.3,.4),1);skin(c,body,P,a,r.seed,120);ellipse(c,-10,-44,90,6,P('#ffffff',0,.15));}
 c.restore();
 const crest=path(c,'M40 -44 Q70 -64 108 -52 Q134 -42 142 -14 Q130 -24 112 -28 Q84 -34 60 -26 Q42 -30 24 -40Z',grad(c,P,a,a,-64,-20),P(a,-.55),.9);
 path(c,'M24 -40 Q6 -58 -26 -56 Q-4 -46 10 -36Z',grad(c,P,a,a,-58,-36),P(a,-.55),.8);
 if(!low){c.save();c.clip(crest);for(let i=0;i<6;i++)path(c,`M${44+i*16} -62 q4 14 0 30`,null,P(a,-.35,.55),1.3);ellipse(c,90,-56,30,4,P('#ffffff',0,.2));c.restore();}
 path(c,'M100 -36 Q126 -40 138 -18 Q118 -24 100 -26Z',P(a,-.15),P(a,-.5),.7);
 path(c,'M58 26 Q38 66 -6 86 Q8 54 30 24Z',finFill(c,P,a,46,26,6,80),P(a,-.45),.7);
 faceLine(c,P,'M140 2 Q118 12 92 10',P(K,0,.7),1.3);
 eye(c,108,-14,P,3,{iris:'#c8a050'});path(c,'M98 -22 Q108 -27 118 -21',null,P(a,-.55),1.8);
}
// Requested characters, drawn as themselves (owner 2026-11-10: "people should get what they request").
// Kyogre: a vast deep-blue whale-like creature with huge white-clawed fins, glowing red lines studded with yellow down
// its sides and belly, a broad white underside and small yellow eyes ringed in red.
function kyogre(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),K='#0c1a30',RED='#e8322e';
 path(c,`M-110 -2 Q-138 ${-26+sw} -160 ${-30+sw} Q-150 ${-8+sw} -144 ${sw} Q-150 ${10+sw} -160 ${32+sw} Q-138 ${26+sw} -110 8Z`,finFill(c,P,a,-112,2,-158,2),P(a,-.5),.8);
 const fin=(x,y,far,f)=>{path(c,`M${x} ${y} Q${x-20} ${y+30+f} ${x-56} ${y+52+f} L${x-46} ${y+40+f} L${x-60} ${y+44+f} L${x-48} ${y+30+f} L${x-60} ${y+30+f} Q${x-30} ${y+14} ${x-8} ${y-6}Z`,far?P(a,-.3):grad(c,P,a,a,y,y+50),P(a,-.5),.8);if(!far)for(const [dx,dy] of [[-56,52],[-60,44],[-60,30]])path(c,`M${x+dx} ${y+dy+f} l-8 2 l6 -6Z`,P('#f4f4f4'));};
 const f=Math.sin(p.swim)*8;fin(30,10,true,-f);
 const body=path(c,'M-116 0 Q-80 -40 -10 -46 Q60 -50 96 -30 Q120 -18 124 0 Q122 18 104 26 Q60 44 -10 42 Q-80 38 -116 6Z',grad(c,P,a,a,-50,44),P(a,-.55),.9);
 c.save();c.clip(body);path(c,'M-120 12 Q-40 22 40 22 Q90 22 128 6 L128 60 L-120 60Z',P(b,.05));
 crisp(c,(c)=>{for(const y of [-20,-4]){path(c,`M-90 ${y+6} Q-30 ${y-6} 40 ${y-2} Q80 ${y} 100 ${y-12}`,null,P(RED,.1),3.2);for(let i=0;i<7;i++){const x=-80+i*26;ellipse(c,x,y-2+Math.sin(i)*2,2.6,2.6,P('#f8d24a'));}}path(c,'M-60 30 Q0 22 60 30',null,P(RED,.1),3);});
 if(!low)skin(c,body,P,a,r.seed,90);c.restore();
 fin(40,14,false,f);
 path(c,'M124 2 Q100 12 76 8',null,P(K),2.4);
 ellipse(c,92,-14,7,5,P(RED));eye(c,92,-14,P,2.2,{iris:'#f8d24a'});
}
// Pikachu: a small round yellow mouse with long black-tipped ears, red cheeks, brown stripes on its back and a tail like a
// lightning bolt, in an air helmet like every land animal here.
function pikachu(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,k=Math.sin(p.swim)*6,K='#1a1410';
 path(c,`M-28 -2 L-48 ${-22+k*.3} L-40 ${-26+k*.3} L-60 ${-46+k*.5} L-44 ${-46+k*.5} L-58 ${-70+k*.6} L-30 ${-44+k*.4} L-40 ${-42+k*.4} L-22 ${-20}Z`,P(a,0),P('#8a6a10',0,.7),.8);
 path(c,'M-30 -6 L-40 -16 L-34 -20 L-26 -10Z',P('#7a4a20'));
 for(const [x,ph] of [[-12,0],[16,1.6]]){const q=Math.sin(p.swim+ph)*5;path(c,`M${x} 18 Q${x-2+q} 30 ${x+4+q} 34`,null,P(a,-.1),7);}
 const body=path(c,'M-32 6 Q-34 -26 -2 -28 Q30 -28 32 4 Q32 26 0 28 Q-32 28 -32 6Z',grad(c,P,a,a,-30,28),P('#8a6a10',0,.6),.8);
 c.save();c.clip(body);for(const x of [-24,-14])path(c,`M${x} -32 Q${x+4} -20 ${x} -10`,null,P('#7a4a20'),4);c.restore();
 path(c,'M12 14 Q22 22 18 30',null,P(a,-.08),6);
 const hx=28,hy=-24;
 for(const [ex,ang] of [[-6,-.5],[8,-.15]]){c.save();c.translate(hx+ex,hy-14);c.rotate(ang);path(c,'M-5 0 Q-6 -24 0 -40 Q6 -24 5 0Z',P(a,-.04),P('#8a6a10',0,.6),.7);path(c,'M-3 -28 Q0 -36 0 -40 Q1 -34 3 -28Z',P(K));c.restore();}
 ellipse(c,hx,hy,22,19,grad(c,P,a,a,hy-19,hy+19));
 ellipse(c,hx+14,hy+6,5.4,5,P('#e8322e'));
 ellipse(c,hx+19,hy-3,1.4,1,P(K));path(c,`M${hx+12} ${hy+4} q3 3 6 0 q3 3 5 -1`,null,P(K,0,.8),.9);
 eye(c,hx+8,hy-5,P,2.6,{iris:'#1a1410'});
 helmet(c,hx,hy-4,32,P);
}
// SpongeBob: a bright yellow square sea sponge full of holes, big blue eyes with lashes, two buck teeth in a wide smile,
// a white shirt with a red tie, brown square trousers and thin legs in tall socks.
function spongebob(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,k=Math.sin(p.swim)*4,K='#2a1e10';
 for(const [x,ph] of [[-12,0],[12,1.4]]){const q=Math.sin(p.swim+ph)*4;path(c,`M${x} 44 L${x+q} 62`,null,P('#f2d860'),3);path(c,`M${x+q} 56 L${x+q} 64`,null,P('#ffffff'),5);ellipse(c,x+q+3,66,7,3.4,P('#1a1a1a'));}
 const sponge=path(c,'M-32 -46 Q-34 -50 -28 -50 L28 -52 Q34 -52 32 -46 L34 22 L-34 22Z',grad(c,P,a,a,-52,22),P('#b8a020',0,.8),1);
 if(!low){c.save();c.clip(sponge);for(let i=0;i<12;i++){const x=-26+((i*37)%100)/100*52,y=-44+((i*53)%100)/100*58;ellipse(c,x,y,2.6+(i%3),2.2+(i%2),P('#b8a020',0,.6));}c.restore();}
 path(c,'M-34 22 L34 22 L34 30 L-34 30Z',P('#ffffff'),P('#a0a0a0',0,.6),.6);
 path(c,'M-34 30 L34 30 L34 44 L-34 44Z',P('#8a5a2a'),P('#4a2a10',0,.6),.6);for(const x of [-24,-8,8,24])path(c,`M${x-4} 34 L${x+4} 34`,null,P('#1a1a1a'),2);
 path(c,'M-3 22 L3 22 L5 26 L0 40 L-5 26Z',P('#d8322e'));
 for(const [x,ang] of [[-34,1],[34,-1]]){path(c,`M${x} 0 Q${x+ang*-12+k} 14 ${x+ang*-6+k} 30`,null,P('#f2d860'),3);ellipse(c,x+ang*-6+k,30,4,4,P('#f2d860'));}
 for(const x of [-10,10]){oval(c,x,-24,10,11,P('#ffffff'),P('#8a8a8a',0,.6),.6);ellipse(c,x+1,-23,4.8,5,P('#4ab0e0'));ellipse(c,x+1,-23,2.4,2.6,P('#111111'));for(let q=0;q<3;q++)line(c,[[x-4+q*4,-34],[x-5+q*5,-40]],P('#111111'),1.2);}
 oval(c,0,-12,4,4,P(a,.05),P('#b8a020',0,.8),.6);
 path(c,'M-18 -2 Q0 12 18 -2',null,P(K),1.6);ellipse(c,-16,-4,4,3,P('#e8a8a0',0,.7));ellipse(c,16,-4,4,3,P('#e8a8a0',0,.7));
 path(c,'M-6 2 L-1 2 L-1 9 L-6 8Z M1 2 L6 2 L6 8 L1 9Z',P('#ffffff'),P('#8a8a8a',0,.6),.5);
 note(c,'eye',0,-24,6);
}
// Patrick Star: a plump pink sea star with a pointed head, green shorts with purple flowers, small eyes and a wide grin.
function patrick(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,k=Math.sin(p.swim)*6,K='#2a1018';
 const star=path(c,`M0 -60 Q8 -34 14 -24 Q38 -24 ${58+k} ${-18} Q36 -4 26 8 Q30 30 ${30} 52 L12 50 Q4 34 0 30 Q-4 34 -12 50 L-30 52 Q-30 30 -26 8 Q-36 -4 ${-58-k} -18 Q-38 -24 -14 -24 Q-8 -34 0 -60Z`,grad(c,P,a,a,-60,52),P(a,-.45),.9);
 c.save();c.clip(star);path(c,'M-40 10 Q0 4 40 10 L40 34 L-40 34Z',P('#6abf3a'));if(!low)for(const [x,y] of [[-18,18],[4,22],[20,14],[-6,28]])for(let q=0;q<5;q++){const an=q/5*TAU;ellipse(c,x+Math.cos(an)*2.6,y+Math.sin(an)*2.6,2,1.6,P('#9a5ac8'),an);}c.restore();
 for(const x of [-7,7]){oval(c,x,-26,4.6,6,P('#ffffff'),P('#8a8a8a',0,.5),.5);ellipse(c,x+.6,-25,2,2.4,P('#111111'));}
 path(c,'M-8 -36 Q-6 -38 -3 -36 M3 -36 Q6 -38 8 -36',null,P(K),1.2);
 path(c,'M-12 -14 Q0 -4 12 -14',null,P(K),1.6);path(c,'M-10 -13 Q0 -6 10 -13 Q0 -10 -10 -13Z',P('#b8384a'));
 note(c,'eye',0,-26,4);
}
// Mahoraga: a towering pale, heavily muscled figure swimming like a diver, the eight-handled wheel turning above its
// head, small wings folded over its eyes, and a long blade growing from its right arm.
function mahoraga(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,kick=Math.sin(p.swim)*9,HX=74,HY=-24,K='#1a1a1e',spin=p.swim*.35;
 const leg=(y0,q,far)=>{const col=far?P(a,-.25):P(a,-.04);path(c,`M-22 ${y0} Q-58 ${y0+6+q*.4} -96 ${y0+6+q}`,null,col,16);path(c,`M-96 ${y0+q} Q-110 ${y0+q} -116 ${y0+10+q}`,null,col,12);};
 leg(4,-kick,true);leg(12,kick,false);
 path(c,`M46 -14 Q74 ${-6+kick*.5} 100 ${-10+kick*.5}`,null,P(a,-.25),13);
 const body=path(c,'M-32 12 Q-38 -22 6 -28 Q48 -32 62 -20 Q72 -6 60 10 Q40 26 4 28 Q-28 28 -32 12Z',grad(c,P,a,a,-30,28),P(a,-.45),.8);
 if(!low){c.save();c.clip(body);for(const x of [10,24,38])path(c,`M${x} -24 q4 10 0 22`,null,P(a,-.22,.5),1.4);path(c,'M-20 -10 Q0 -16 20 -12',null,P(a,-.22,.5),1.2);c.restore();skin(c,body,P,a,r.seed,40);}
 const ay=-2+kick*-.4;path(c,`M46 -4 Q74 ${ay+8} 98 ${ay+4}`,null,P(a,-.02),14);
 path(c,`M96 ${ay-2} L176 ${ay-12} L182 ${ay-4} L98 ${ay+12}Z`,grad(c,P,'#e8ecf0','#8a9098',ay-12,ay+12),P('#5a6068'),.8);
 const head=path(c,`M${HX-15} ${HY} A15 16 0 1 1 ${HX+15} ${HY} A15 16 0 1 1 ${HX-15} ${HY}Z`,grad(c,P,a,a,HY-16,HY+16),P(a,-.45),.7);if(!low)skin(c,head,P,a,r.seed+2,12);
 for(const [dy,s2] of [[-6,-1],[0,1]])path(c,`M${HX-2} ${HY+dy} Q${HX+12} ${HY+dy-8*s2*-1-6} ${HX+24} ${HY+dy-2} Q${HX+12} ${HY+dy+2} ${HX} ${HY+dy+4}Z`,P(b,.12),P(b,-.35),.6);
 faceLine(c,P,`M${HX+10} ${HY+9} Q${HX+5} ${HY+11} ${HX} ${HY+9}`,P(K,0,.7));
 const wy=HY-40;c.strokeStyle=P('#d8b04a');c.lineWidth=3.4;c.beginPath();c.arc(HX,wy,14,0,TAU);c.stroke();
 for(let q=0;q<8;q++){const an=spin+q/8*TAU,x0=HX+Math.cos(an)*4,y0=wy+Math.sin(an)*4,x1=HX+Math.cos(an)*21,y1=wy+Math.sin(an)*21;line(c,[[x0,y0],[x1,y1]],P('#d8b04a'),2.6);ellipse(c,x1,y1,2.6,2.6,P('#e8c45a'));}
 ellipse(c,HX,wy,4.4,4.4,P('#b8902a'));line(c,[[HX,HY-16],[HX,wy+14]],P('#d8b04a',0,.5),1.2);
 note(c,'eye',HX+8,HY-3,3);
}
// Shuckle: a little yellow creature living in a heavy red shell dotted with yellow holes, its head and short legs poking out.
function shuckle(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,k=Math.sin(p.swim)*3,K='#2a1a10';
 for(const x of [-14,0,14])ellipse(c,x,31+Math.sin(p.swim+x)*1.5,5,4.4,P(b,-.05));
 const shell=path(c,'M-40 28 Q-46 -10 -20 -36 Q4 -48 26 -34 Q44 -14 40 28Z',grad(c,P,a,a,-44,28),P(a,-.5),.9);
 c.save();c.clip(shell);for(let i=0;i<14;i++){const x=-34+((i*37)%100)/100*68,y=-36+((i*53)%100)/100*58;ellipse(c,x,y,4.4,3.6,P(b,.1));ellipse(c,x,y,2.4,1.8,P(b,-.3));}c.restore();
 ellipse(c,0,28,40,6,P(b,-.05));
 // The head pokes out low at the front on a short neck.
 const hx=52+k*.5,hy=16;ellipse(c,hx-12,hy+4,14,8,P(b,-.05));oval(c,hx,hy,12,11,grad(c,P,b,b,hy-11,hy+11),P(b,-.4),.7);
 ellipse(c,hx+5,hy+5,2,1.4,P('#e8322e',0,.8));
 eye(c,hx+3,hy-3,P,2.2,{iris:'#1a1410'});
}
// Greninja: a slender blue frog ninja crouched to spring, with a long pink tongue wrapped round its neck like a scarf,
// white spots on its chest, cream-yellow eyes and webbed feet.
function greninja(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,k=Math.sin(p.swim)*6,K='#121a2a';
 for(const [x,ph] of [[-20,0],[10,1.5]]){const q=Math.sin(p.swim+ph)*6;path(c,`M${x} 10 Q${x-18+q} 24 ${x-36+q} 22`,null,P(a,-.1),9);path(c,`M${x-36+q} 22 l-8 -4 l2 6 l-6 2 l10 2Z`,P(a,-.05));}
 const body=path(c,'M-40 0 Q-38 -18 0 -20 Q34 -20 44 -6 Q46 8 30 14 Q0 20 -36 10Z',grad(c,P,a,a,-20,14),P(a,-.5),.8);
 c.save();c.clip(body);path(c,'M-10 4 Q20 0 46 4 L46 20 L-10 20Z',P('#ece8d8'));for(const [x,y] of [[6,8],[14,10],[22,8]])ellipse(c,x,y,1.6,1.4,P('#ffffff'));c.restore();
 path(c,`M30 14 Q42 ${26+k} 52 ${30+k}`,null,P(a,-.05),6);
 const hx=50,hy=-14;
 const head=path(c,`M${hx-14} ${hy} Q${hx-10} ${hy-16} ${hx+6} ${hy-14} Q${hx+20} ${hy-8} ${hx+18} ${hy+4} Q${hx+8} ${hy+10} ${hx-10} ${hy+8}Z`,grad(c,P,a,a,hy-16,hy+10),P(a,-.5),.8);
 path(c,`M${hx-6} ${hy+6} Q${hx-30} ${hy+12+k} ${hx-62} ${hy+4+k*1.4} Q${hx-56} ${hy+14+k} ${hx-24} ${hy+16} Q${hx-6} ${hy+14} ${hx+6} ${hy+8}Z`,P(b,.05),P(b,-.35),.7);
 path(c,`M${hx-6} ${hy-14} L${hx-20} ${hy-28} L${hx} ${hy-16}Z`,P(a,-.2));
 ellipse(c,hx+6,hy-6,6,4.4,P('#1a2440'));eye(c,hx+7,hy-6,P,2.4,{iris:'#f2e08a'});
}
// Ceadeus: the colossal elder dragon of the deep from the old sea stories, like a whale crowned with two vast curling
// horns and trailing a long golden beard.
function ceadeus(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),K='#1a1a20',bd=Math.sin(p.swim*.8)*6;
 path(c,`M-130 -2 Q-156 ${-30+sw} -184 ${-36+sw} Q-172 ${-10+sw} -166 ${sw} Q-172 ${12+sw} -184 ${36+sw} Q-156 ${30+sw} -130 8Z`,finFill(c,P,a,-132,2,-182,2),P(a,-.45),.8);
 for(let i=0;i<9;i++)path(c,`M${80+i*4} 26 Q${70+i*3+bd} 60 ${60+i*2+bd*1.4} ${92+(i%3)*8}`,null,P(b,i%2?.1:-.08),3.4);
 const body=path(c,'M-136 0 Q-80 -44 0 -50 Q80 -54 118 -30 Q138 -14 136 6 Q130 24 100 30 Q40 44 -40 40 Q-100 34 -136 8Z',grad(c,P,a,a,-54,44),P(a,-.5),.9);
 if(!low){c.save();c.clip(body);for(let i=0;i<8;i++)path(c,`M${-90+i*24} -40 q8 26 0 60`,null,P(a,-.3,.4),1.6);skin(c,body,P,a,r.seed,110);c.restore();}
 for(const [ox,far] of [[0,1],[10,0]])path(c,`M${86+ox} -40 Q${70+ox} -90 ${110+ox} -110 Q${150+ox} -118 ${150+ox} -84 Q${142+ox} -98 ${124+ox} -94 Q${100+ox} -86 ${104+ox} -40Z`,far?P('#c8b88a',-.25):grad(c,P,'#e8dcb8','#a8946a',-110,-40),P('#6a5a3a',0,.7),.8);
 faceLine(c,P,'M136 6 Q116 16 94 14',P(K,0,.7),1.4);
 eye(c,106,-14,P,3,{iris:'#e0a83a'});
}
// The ice worm from the frozen seas: a long pale armoured worm, segment after segment, with a round mouth of hooked teeth.
function iceWorm(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=26,N=30,span=360,S=snakeLine(p,span,s,22,.36,N),e=S.pt[N];
 const body=path(c,S.outline(),grad(c,P,a,b,-28,28),P(a,-.5),.8);
 c.save();c.clip(body);for(let i=1;i<N;i++){path(c,S.ribbon(-1.05,1.05,i,i+1),null,P(a,-.35,.6),1.6);}path(c,S.ribbon(-.85,-.4),P('#ffffff',0,.3));if(!low)skin(c,body,P,a,r.seed,80);c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);oval(c,4,0,8,e.w+4,P(a,.1),P(a,-.5),.8);ellipse(c,6,0,4,e.w,P('#2a1218'));for(let q=0;q<10;q++){const an=q/10*TAU;path(c,`M${6+Math.cos(an)*3} ${Math.sin(an)*e.w*.9} l2 ${-Math.sin(an)*3} l1 ${Math.sin(an)*1}Z`,P('#e8e0cc'));}c.restore();
 note(c,'eye',e.x,e.y,4);
 followSnake(p,span,22,.36,N);
}
// Brown kiwi (Apteryx): New Zealand's flightless bird, as round as a ball with no tail, shaggy brown feathers like hair, stout legs, whiskers by the face, and a long thin bill with the nostrils at its very tip.
function kiwi(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,k=Math.sin(p.swim)*3,K='#1f1712';
 for(const [x,ph,far] of [[-6,1,1],[10,0,0]]){const q=ph?-k:k;path(c,`M${x} 26 L${x-3+q*.4} 48`,null,far?P('#a89a78',-.2):P('#b8a988'),far?5:6);path(c,`M${x-3+q*.4} 48 l15 3 M${x-3+q*.4} 48 l10 7 M${x-3+q*.4} 48 l-7 4`,null,far?P('#a89a78',-.2):P('#b8a988'),2.6);}
 const body=path(c,'M-46 2 Q-46 -36 -6 -40 Q30 -40 38 -14 Q42 -24 50 -24 Q58 -16 52 -6 Q48 6 40 16 Q24 34 -8 34 Q-44 32 -46 2Z',grad(c,P,a,b,-40,34),P(a,-.45),.7);
 if(!low){c.save();c.clip(body);for(let i=0;i<190;i++){const x=-48+((i*61)%100)/100*102,y=-40+((i*17)%100)/100*76;line(c,[[x,y],[x-5,y+4]],P(a,i%2?.3:-.3,.55),.9);}c.restore();}
 path(c,'M50 -18 Q84 -14 112 3',null,P('#d9c9a0'),3.6);path(c,'M50 -18 Q84 -14 112 3',null,P('#a8986e',0,.5),1);
 ellipse(c,110,1.5,1,.7,P(K,0,.8));
 if(!low)crisp(c,(c)=>{for(let i=0;i<4;i++)line(c,[[52,-14+i],[68+i*2,-6+i*5]],P('#2a2018',0,.7),.5);});
 eye(c,44,-18,P,1.5,{iris:'#14100c'});
 helmet(c,50,-16,30,P);
}
// Barreleye (Macropinna microstoma): a little deep-sea fish about 15 cm long with a clear dome of a forehead. Inside it, two glowing green barrel-shaped eyes look upward; the two dark marks above the mouth, which look like eyes, are its nostrils.
function barreleye(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),K='#12161a';
 path(c,`M-46 -6 Q-60 ${-22+s} -68 ${-18+s} Q-62 ${s} -68 ${18+s} Q-60 ${22+s} -46 6Z`,finFill(c,P,a,-48,0,-66,0),P(a,-.4),.5);
 path(c,'M-12 -16 Q-20 -38 -30 -38 L-32 -12Z',P(a,-.1,.85));path(c,'M-6 14 Q-12 34 -24 34 L-26 12Z',P(a,-.1,.85));
 const body=path(c,'M-50 -5 Q-20 -22 16 -24 Q38 -24 44 -14 Q50 -2 46 8 Q36 20 12 22 Q-20 20 -50 5Z',grad(c,P,a,b,-24,22),P(a,-.45),.7);
 if(!low){c.save();c.clip(body);let d='';for(let row=0;row<7;row++)for(let x=-46+(row%2)*4;x<46;x+=8)d+=`M${x} ${-22+row*7} q5 3.5 0 7`;path(c,d,null,P(b,.1,.55),.7);c.restore();}
 path(c,'M46 12 Q58 12 60 6 L46 4Z',P(a,-.15));faceLine(c,P,'M60 6 L50 7',P(K,0,.8));
 for(const y of [-3,3])ellipse(c,54,y-2,2,1.5,P(K,0,.9));
 const dome=path(c,'M10 -22 Q16 -52 46 -46 Q66 -38 60 0 L46 2 Q50 -14 40 -18 Q24 -22 10 -22Z',P('#d8f4f0',0,.28),P('#d8f4f0',0,.7),1);
 c.save();c.clip(dome);ellipse(c,36,-42,22,6,P('#ffffff',0,.22));c.restore();
 for(const [x,col] of [[30,.18],[40,0]]){path(c,`M${x-5} -16 L${x-4} -34 Q${x} -40 ${x+4} -34 L${x+5} -16Z`,P('#5fe08a',col),P('#2a8a4a'),.6);ellipse(c,x,-34,3.6,2.4,P('#9ff0b8'));}
 eye(c,40,-34,P,1.6,{iris:'#1a4a2a'});
}
// Tripod fish (Bathypterois grallator): it stands on the deep seabed on the tips of its tail and two long fin rays, like a three-legged stool, facing the current with its other fins held forward to feel for food.
function tripodFish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,K='#0e1014',q=Math.sin(p.swim*.5)*2;
 for(const [x0,y0,x1,y1,far] of [[-82,-22,-100,68,0],[8,-12,-6,68,1],[14,-12,30,68,0]])path(c,`M${x0} ${y0} Q${(x0+x1)/2+6} ${(y0+y1)/2} ${x1} ${y1}`,null,far?P(b,-.05):P(b,.28),far?1.9:2.5);
 for(const k of [0,1,2])path(c,`M40 ${-24+k*2} Q80 ${-48+k*7+q} 118 ${-34+k*11+q}`,null,P(b,.22),1.5);
 path(c,'M-10 -36 Q-20 -60 -32 -60 L-34 -34Z',P(a,-.1,.85));
 path(c,'M-80 -22 Q-96 -38 -104 -34 Q-96 -22 -104 -12 Q-92 -12 -80 -16Z',finFill(c,P,a,-82,-20,-102,-22),P(a,-.45),.5);
 const body=path(c,'M-86 -22 Q-40 -38 10 -38 Q42 -36 58 -26 Q62 -18 54 -12 Q30 -6 -8 -6 Q-56 -8 -86 -16Z',grad(c,P,a,b,-38,-6),P(a,-.45),.7);
 if(!low){skin(c,body,P,a,r.seed,50);c.save();c.clip(body);let d='';for(let row=0;row<5;row++)for(let x=-84+(row%2)*5;x<60;x+=10)d+=`M${x} ${-38+row*7} q6 3.5 0 7`;path(c,d,null,P(a,.3,.4),.7);c.restore();}
 faceLine(c,P,'M60 -19 Q50 -14 40 -16',P(K,0,.8));
 eye(c,46,-26,P,1.5,{iris:'#8a9a8a'});
}
// Sea urchin: a round shell covered in long moveable spines. Drawn as a long-spined urchin (Diadema): nearly black, with an orange ring round the top and fine blue lines between the spines.
function urchin(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*2,n=low?26:54;
 for(let i=0;i<n;i++){const q=Math.PI*1.05+i/(n-1)*Math.PI*.9+(i%2)*.03,l=52+((i*7)%19),x0=Math.cos(q)*26,y0=2+Math.sin(q)*24;line(c,[[x0,y0],[x0+Math.cos(q)*l+Math.sin(i+p.swim*.6)*2.4,y0+Math.sin(q)*l]],i%3?P(a,.08):P(b,0),1.7);}
 for(const q of [.3,.9,1.6,2.2,2.8]){line(c,[[Math.cos(q)*26,4+Math.sin(q)*20],[Math.cos(q)*40+sw,12+Math.sin(q)*26]],P(a,-.1),1.5);}
 const shell=path(c,'M-32 6 Q-32 -30 0 -32 Q32 -30 32 6 Q30 28 0 28 Q-30 28 -32 6Z',grad(c,P,a,a,-32,28),P(a,-.5),.8);
 c.save();c.clip(shell);ellipse(c,0,-26,14,7,P(b,.05,.85));ellipse(c,0,-26,7,3.6,P(a,-.2));if(!low)for(let i=0;i<8;i++)path(c,`M${-24+i*7} -26 Q${-28+i*8} 0 ${-22+i*6.4} 24`,null,P('#4aa0ff',0,.5),.8);c.restore();
}
// Spanish shawl (Flabellinopsis iodinea), redrawn 2026-11-10: a bright purple slug that crawls and swims by flexing, with clusters of orange finger-like cerata along its back and two red sensory horns.
function nudibranch(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=p.swim;
 path(c,'M-74 13 Q-20 30 54 20 Q72 16 76 8 Q72 28 40 30 Q-30 34 -74 13Z',P(a,-.1));
 for(let i=0;i<4;i++)for(let j=0;j<6;j++){const x=-50+i*26+j*3.5-8,h=16+(j*5)%10,q=Math.sin(sw+i+j)*3;path(c,`M${x} 6 Q${x-3+q*.5} ${6-h*.6} ${x+q} ${6-h}`,null,P(b,j%2?.08:-.05),4);ellipse(c,x+q,6-h,2.1,2.1,P(b,.3));}
 const body=path(c,'M-76 13 Q-60 0 -20 -3 Q30 -5 60 2 Q78 8 76 16 Q40 30 -30 24 Q-62 22 -76 13Z',grad(c,P,a,a,-4,28),P(a,-.45),.7);
 if(!low){skin(c,body,P,a,r.seed,30);ellipse(c,0,1,50,3,P('#ffffff',0,.2));}
 for(const [dx,h] of [[0,26],[9,22]]){path(c,`M${60+dx} 9 Q${58+dx} ${2-h*.5} ${64+dx} ${2-h}`,null,P('#d64c3b'),3.4);ellipse(c,64+dx,2-h,2.2,2.6,P('#e8705c'));}
 path(c,'M74 12 Q90 6 96 12',null,P('#d64c3b'),2.4);path(c,'M74 16 Q90 18 96 24',null,P('#d64c3b'),2.4);
}
// Sea cucumber: a soft leathery tube with rows of fleshy warts, a ring of branching feeding tentacles at the front, and rows of tube feet along the underside.
function seaCucumber(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 for(let i=0;i<7;i++){const q=(i-3)*.32+Math.sin(p.swim+i)*.06,x1=82+Math.cos(q)*24,y1=-2+Math.sin(q)*30;line(c,[[76,-2],[x1,y1]],P(b,.1),2.2);const mx=76+(x1-76)*.6,my=-2+(y1+2)*.6;for(const s of [-1,1])line(c,[[mx,my],[x1+3,y1+s*7]],P(b,.1),1.1);}
 if(!low)for(let i=0;i<19;i++){const x=-54+i*6,k=Math.sin(p.swim*.6+i)*1.5;line(c,[[x,15],[x-1+k,31]],P(b,-.05),2.2);}
 const body=path(c,'M-82 2 Q-78 -28 -16 -29 Q50 -30 78 -8 Q84 0 78 8 Q50 28 -16 26 Q-76 28 -82 2Z',grad(c,P,a,b,-30,28),P(a,-.45),.8);
 c.save();c.clip(body);ellipse(c,-4,24,86,8,P(b,.05,.5));if(!low){skin(c,body,P,a,r.seed,80);for(let row=0;row<4;row++)for(let i=0;i<14;i++){const x=-74+i*11.5+(row%2)*5.5,y=-22+row*10;ellipse(c,x,y+1.2,3.4,2.5,P(a,-.32,.55));ellipse(c,x,y,3,2.2,P(a,.14));}}c.restore();
}
// Bobtail squid (Euprymna): a small round reef squid about 5 cm long with two rounded fins like ears, short arms, and big eyes; it hides in the sand by day and glows from light-making bacteria at night.
function bobtail(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*6,fan=armFan(p);
 for(let i=0;i<8;i++){const y0=(i-3.5)*3,S=spineOf(Array.from({length:8},(_,j)=>{const t=j/7;return[26+t*42,y0+(i-3.5)*7*fan*t+Math.sin(p.swim+i+t*2)*3*t,3.2*(1-t)+.6];}));path(c,S.outline(),P(a,i%2?.06:-.1),P(a,-.45),.4);}
 for(const s of [-1,1])path(c,`M-24 ${s*18} Q-34 ${s*(46)+f*s*.5} -56 ${s*40+f*s*.5} Q-58 ${s*22} -40 ${s*12}Z`,finFill(c,P,a,-30,s*18,-52,s*40),P(a,-.45),.6);
 const body=path(c,'M-54 0 Q-52 -30 -14 -32 Q18 -32 30 -14 L32 14 Q18 32 -14 32 Q-52 30 -54 0Z',grad(c,P,a,b,-32,32),P(a,-.45),.7);
 if(!low){skin(c,body,P,a,r.seed,40);c.save();c.clip(body);for(let i=0;i<46;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-52+(u-Math.floor(u))*84,-30+(v-Math.floor(v))*60,1.2,1.1,P(i%3?a:'#9fe0ff',i%3?-.38:0,.8));}c.restore();}
 ellipse(c,26,-3,12,12,P(a,-.1));
 eye(c,27,-4,P,5.4,{iris:'#c9d07a',bar:true});
}
// Strawberry squid (Histioteuthis heteropsis): deep red, studded with lights like the seeds on a strawberry, and cock-eyed: a huge yellow left eye looking up for shadows, and a small right eye looking down for glows.
function strawberrySquid(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,fan=armFan(p),f=Math.sin(p.swim)*5;
 for(let i=0;i<8;i++){const y0=(i-3.5)*4,S=spineOf(Array.from({length:9},(_,j)=>{const t=j/8;return[34+t*80,y0+(i-3.5)*10*fan*t+Math.sin(p.swim+i+t*3)*5*t,4*(1-t)+.7];}));path(c,S.outline(),P(a,i%2?.06:-.12),P(a,-.45),.4);}
 path(c,`M-108 0 L-70 ${-34+f*.3} Q-54 -24 -46 -10 L-46 10 Q-54 24 -70 ${34-f*.3}Z`,finFill(c,P,a,-52,0,-106,0),P(a,-.45),.6);
 const body=path(c,'M-112 0 Q-82 -24 -36 -26 Q14 -26 38 -14 L38 14 Q14 26 -36 26 Q-82 24 -112 0Z',grad(c,P,a,b,-26,26),P(a,-.45),.7);
 c.save();c.clip(body);for(let row=0;row<7;row++)for(let i=0;i<20;i++){const x=-108+i*8+(row%2)*4,y=-24+row*8;ellipse(c,x,y,1.8,1.4,P('#ffe8c0',0,.9));ellipse(c,x+.3,y,.8,.6,P('#7a1016'));}if(!low){ellipse(c,-40,-23,50,4,P('#ffffff',0,.16));}c.restore();
 ellipse(c,42,0,13,13,P(a,-.04));
 eye(c,44,-5,P,6.4,{iris:'#e6c23a'});eye(c,34,7,P,2,{iris:'#5a8fc0'});
}
// ---- 2026-11-13: animals people were waiting for (reader-review/design-wanted.json) ----
// Bichir (Polypterus), 2026-11-13: an old African river fish (the Senegal bichir is about 30-35 cm) with a long, round
// body armoured in diamond-shaped scales, a row of little flag fins along its back, each on its own spine, fleshy fan
// pectoral fins it uses like small arms, a rounded tail, tube nostrils at the tip of the snout and small golden eyes.
function bichir(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4);
 path(c,`M-96 -4 Q-118 ${-18+s} -128 ${-6+s} Q-134 ${s} -128 ${6+s} Q-118 ${18+s} -96 6Z`,P(a,-.12),P(a,-.45),.7);
 path(c,'M-80 8 Q-88 22 -100 18 L-94 6Z',P(a,-.15),P(a,-.45),.5);
 path(c,'M58 8 Q48 26 34 26 Q40 16 48 8Z',farPalette(P)(a,0));
 const body=path(c,'M-100 -2 Q-90 -13 -40 -15 Q20 -17 62 -14 Q88 -12 98 -5 Q104 0 98 5 Q86 13 60 13 Q20 15 -40 13 Q-90 12 -100 3Z',grad(c,P,a,b,-16,15),P(a,-.45),.7);
 if(!low){
  c.save();c.clip(body);
  // Diamond (ganoid) scales in crossing diagonal rows.
  let d='';for(let x=-104;x<100;x+=7)d+=`M${x} -16 l10 32 M${x+10} -16 l-10 32 `;
  path(c,d,null,P(a,-.38,.35),.6);
  path(c,'M-100 6 Q0 18 100 4 L100 20 L-100 20Z',P(b,.05,.7));
  // Dark blotches along the back, as on most bichirs.
  for(let i=0;i<9;i++)ellipse(c,-80+i*19,-9+(i%2)*3,5,3.4,P(a,-.4,.45),.2);
  c.restore();
  skin(c,body,P,a,r.seed,60);
 }
 // The row of little flag fins along the back, each with its spine in front.
 const n=11;
 for(let i=0;i<n;i++){const x=-84+i*14,wv=Math.sin(p.swim*1.4+i*.7)*1.5,h=9+Math.sin(i/(n-1)*Math.PI)*3;
  path(c,`M${x} -13 L${x+1} ${-14-h+wv} Q${x+7} ${-12-h*.75+wv} ${x+10} -13Z`,P(a,-.06,.95),P(a,-.45),.5);
  line(c,[[x,-13],[x+1,-16-h+wv]],P(a,-.5),1);}
 // The near pectoral fin: a fleshy base like a little arm, ending in a fan.
 const f=Math.sin(p.swim*1.3)*4;
 path(c,`M64 4 Q58 12 52 16 Q44 ${26+f} 38 ${30+f} Q30 ${28+f} 34 ${20+f} Q42 12 56 2Z`,grad(c,P,a,a,0,30),P(a,-.45),.6);
 if(!low)for(let i=0;i<4;i++)line(c,[[52,14],[30+i*4,26+f+i*.5]],P(a,-.4,.5),.6);
 path(c,'M96 -4 l5 -5',null,P(a,-.3),1.6);
 faceLine(c,P,'M100 2 Q92 5 82 5',P(a,-.55),1.1);
 path(c,'M62 -12 Q56 0 62 12',null,P(a,-.45,.6),1);
 eye(c,84,-5,P,1.8,{iris:'#c9a53c'});
}
// Phronima (Phronima sedentaria), 2026-11-13: a see-through deep-sea amphipod 2-4 cm long that hollows out a salp and
// lives in the empty barrel, pushing it through the water like a pram. Its head is almost all eye, it has big claws on its
// fifth legs and faint red pigment; the barrel is clear jelly ringed with muscle bands, open at both ends.
function phronima(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim*1.6);
 const barrel='M-64 -40 Q0 -50 64 -40 Q72 0 64 40 Q0 50 -64 40 Q-72 0 -64 -40Z';
 path(c,barrel,P(b,.05,.14));
 if(!low)for(let i=0;i<6;i++){const x=-50+i*20,e=Math.abs(i-2.5)*.8;path(c,`M${x} ${-44+e} Q${x+5} 0 ${x} ${44-e}`,null,P(b,.2,.3),1.4);}
 // Tail end and swimming legs beating out of the back of the barrel.
 for(let i=0;i<3;i++)path(c,`M-30 ${4+i*4} Q-52 ${2+i*6+f*4} -74 ${-2+i*8+f*6}`,null,P(a,.05,.75),1.6);
 path(c,`M-74 ${-2+f*6} l-8 -3 M-74 ${6+f*6} l-9 1 M-74 ${14+f*6} l-8 4`,null,P(a,.1,.6),1.2);
 for(let i=0;i<4;i++){const x=-22+i*12;path(c,`M${x} 14 Q${x-4} 28 ${x-8+(i%2)*4} 38`,null,P(a,.08,.7),1.4);}
 const body=path(c,'M-36 4 Q-34 -10 -12 -12 Q14 -14 30 -10 Q40 -6 40 4 Q38 14 26 16 Q0 18 -20 16 Q-36 14 -36 4Z',P(a,.12,.55),P(a,-.25,.7),.8);
 if(!low){c.save();c.clip(body);for(let i=0;i<7;i++)path(c,`M${-28+i*9} -14 q-3 15 0 30`,null,P(a,-.25,.5),.9);for(let i=0;i<10;i++)ellipse(c,-30+i*7,(i%3-1)*5,1.6,1.4,P('#c43a3a',0,.75));c.restore();}
 // The big claws on the fifth legs, reaching forward.
 for(const [y,k] of [[2,1],[10,-1]]){path(c,`M24 ${y} Q44 ${y-14*k} 56 ${y-10*k}`,null,P(a,.05,.8),2.2);path(c,`M56 ${y-10*k} l8 ${-6*k} M56 ${y-10*k} l9 ${2*k}`,null,P(a,-.1,.85),1.8);}
 // The head: two glassy eye lobes with red retinas.
 path(c,'M28 -10 Q34 -34 48 -36 Q60 -34 56 -18 Q50 -6 40 -4Z',P('#f2eadd',0,.35),P(a,-.1,.7),1);
 path(c,'M36 -6 Q44 -20 58 -18 Q64 -10 58 -2 Q48 4 40 2Z',P('#f2eadd',0,.3),P(a,-.1,.7),1);
 ellipse(c,53,-9,3.6,2.6,P('#c8263a',0,.85));
 eye(c,47,-24,P,2.6,{iris:'#c8263a'});
 // The near wall of the barrel, with its open ends.
 const wall=path(c,barrel);
 c.save();c.clip(wall);const g=c.createLinearGradient(0,-48,0,48);g.addColorStop(0,P(b,.4,.22));g.addColorStop(.5,P(b,.3,.04));g.addColorStop(1,P(b,.2,.16));c.fillStyle=g;c.fill(wall);c.restore();
 c.strokeStyle=P(b,.35,.75);c.lineWidth=1.2;c.stroke(wall);
 oval(c,66,0,6,38,null,P(b,.4,.6),1);oval(c,-66,0,6,38,null,P(b,.3,.45),1);
 if(!low)path(c,'M-40 -38 Q0 -44 40 -38',null,P('#ffffff',0,.5),1.6);
}
// Comb jelly (ctenophore), 2026-11-13: not a true jellyfish. The sea gooseberry (Pleurobrachia) as the type: a clear,
// egg-shaped body with eight rows of tiny beating paddles (combs) running from top to bottom. The combs scatter light, so
// rainbows run down the rows as they beat. Two long tentacles with fine side branches trail from pouches in the sides.
const COMB=['#ff5a6a','#ffb347','#fff36a','#7dff8a','#5ae0ff','#7a8cff','#d07aff'];
function combJelly(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,ph=p.swim*2;
 // Tentacles first, behind the body.
 for(const s of [-1,1]){const sw=Math.sin(p.swim*.8+s)*10,pts=[];
  for(let j=0;j<=10;j++){const t=j/10;pts.push([s*(18+t*40)+Math.sin(t*5+p.swim)*6*t,6+t*96+sw*t]);}
  line(c,pts,P(b,.1,.75),1.2);
  if(!low)for(let j=2;j<10;j++){const [x,y]=pts[j];line(c,[[x,y],[x+s*7,y+5]],P(b,.2,.55),.6);}}
 const body=path(c,'M0 -58 Q34 -56 38 -12 Q38 32 0 50 Q-38 32 -38 -12 Q-34 -56 0 -58Z');
 glassBody(c,P,body,a);
 // Eight comb rows: the far four faint, the near four bright, each lit by a rainbow moving down it.
 const row=(k,far)=>{const n=14;for(let i=0;i<n;i++){const t=(i+.5)/n,y=-54+t*100,w=Math.sin(Math.PI*t),x=k*36*w*(.98-.06*t);
  const lit=Math.max(0,Math.sin(t*9-ph+k*2))**2,col=COMB[(i+Math.floor(ph*1.5))%COMB.length];
  ellipse(c,x,y,1.6,2.6,P(col,.1,far?.12+lit*.25:.3+lit*.65),k*.6);}};
 for(const k of [-.55,.55,-.2,.2])row(k,true);
 for(const k of [-.95,-.4,.4,.95])row(k,false);
 // The balance organ at the top, the mouth at the bottom, and the tentacle pouches.
 ellipse(c,0,-55,3,2.4,P(b,.3,.8));
 path(c,'M-8 46 Q0 54 8 46',null,P(a,-.2,.6),1);
 for(const s of [-1,1])ellipse(c,s*16,2,4,10,P(b,.05,.35),s*.2);
}
// Zekrom, 2026-11-13: the Deep Black Pokémon, drawn as itself (owner, 2026-11-10). A black dragon about 2.9 m tall with
// red eyes, a long crest swept back from its head, hand-like wings with finger spikes, grey claws, and a thick tail that
// ends in a drum-shaped generator glowing blue.
function zekrom(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*6,sw=swing(p,5),K='#0d0e12',G='#59606e';
 const wing=(far)=>{const lift=far?-10:0,dx=far?-14:0,col=far?P(a,-.3):grad(c,P,a,a,-112,-10);
  path(c,`M${24+dx} -24 Q${10+dx} ${-70+f+lift} ${-10+dx} ${-104+f+lift} L${-2+dx} ${-86+f+lift} L${-26+dx} ${-112+f+lift} L${-18+dx} ${-84+f+lift} L${-46+dx} ${-104+f+lift} L${-32+dx} ${-74+f+lift} L${-62+dx} ${-84+f+lift} L${-40+dx} ${-52+f*.6+lift} Q${-20+dx} -40 ${-6+dx} -18Z`,col,P(K,0,.8),1);
  if(!far&&!low){for(const [x,y] of [[-10,-104],[-26,-112],[-46,-104],[-62,-84]])line(c,[[x,y+f],[x+3,y+f+10]],P(G,.1,.85),1.6);
   path(c,`M14 -30 Q0 ${-62+f} -18 ${-84+f} M6 -26 Q-14 ${-52+f} -36 ${-72+f}`,null,P(a,.25,.5),1.1);}};
 wing(true);
 // The tail and its generator.
 const gx=-142,gy=sw-2;
 if(!low){const g=c.createRadialGradient(gx,gy,8,gx,gy,46);g.addColorStop(0,P(b,.3,.5));g.addColorStop(1,P(b,.3,0));ellipse(c,gx,gy,46,46,g);}
 path(c,`M-36 -16 Q-84 ${-24+sw} -128 ${-14+sw} L-128 ${10+sw} Q-84 ${14+sw} -32 10Z`,grad(c,P,a,a,-24,14),P(K,0,.8),1);
 path(c,`M-40 -12 Q-84 ${-20+sw} -124 ${-11+sw}`,null,P(a,.2,.35),2.4);
 ellipse(c,gx,gy,25,31,P(a,-.1));ellipse(c,gx,gy,19,24,P(G,-.1));ellipse(c,gx,gy,13,17,P(b,.1,.95));ellipse(c,gx-1,gy,6,10,P('#e6fbff',0,.92));
 // Far leg.
 path(c,'M-24 8 Q-40 26 -60 30 L-66 24 Q-48 18 -36 2Z',P(a,-.3));
 const body=path(c,'M-40 -6 Q-30 -34 10 -36 Q50 -38 70 -26 Q80 -14 70 0 Q50 18 10 20 Q-30 22 -40 -6Z',grad(c,P,a,a,-38,22),P(K,0,.8),1);
 c.save();c.clip(body);path(c,'M20 -22 Q50 -28 72 -18 Q74 -4 62 8 Q40 12 24 6Z',P(G,-.05,.9));if(!low)for(let i=0;i<4;i++)path(c,`M${30+i*9} -20 q-3 12 0 24`,null,P(G,-.3,.6),.9);c.restore();
 if(!low)skin(c,body,P,a,r.seed,60);
 // Near leg, clawed foot trailing back.
 path(c,'M-10 6 Q-22 30 -46 38 L-52 30 Q-34 24 -24 0Z',P(a,-.06),P(K,0,.8),.8);
 path(c,'M-52 30 l-9 1 l6 -6Z M-50 36 l-9 4 l6 -8Z',P(G,.2));
 // Neck, head and the long crest.
 path(c,'M56 -26 Q76 -42 96 -44 L100 -30 Q80 -24 66 -12Z',P(a,-.02),P(K,0,.8),.8);
 path(c,'M94 -48 Q70 -70 36 -80 Q62 -60 72 -46 Q82 -40 94 -40Z',P(a,.04),P(K,0,.8),.8);
 const head=path(c,'M90 -48 Q110 -60 128 -52 L152 -42 Q154 -35 147 -32 L120 -28 Q100 -26 90 -36Z',grad(c,P,a,a,-60,-26),P(K,0,.8),.8);
 path(c,'M120 -46 L152 -42 Q154 -35 147 -32 L120 -30Z',P(G,0));
 faceLine(c,P,'M148 -34 L120 -32',P(K),1.2);
 if(!low)skin(c,head,P,a,r.seed+2,16);
 eye(c,112,-45,P,2.4,{iris:'#e8322e'});
 // Arm reaching forward with grey claws.
 path(c,'M44 -6 Q62 6 84 4 L86 12 Q62 16 40 6Z',P(a,-.02),P(K,0,.8),.8);
 path(c,'M84 4 l10 -3 M86 8 l10 2 M84 12 l8 6',null,P(G,.3),2.2);
 wing(false);
}
// ---- 2026-11-13, second batch of waiting animals ----
// Umibozu, 2026-11-13: a sea spirit from Japanese folklore, a huge, smooth, dark bald head and shoulders that rises out of
// calm water, with round pale glowing eyes and no other face. Drawn as a giant dark shape trailing away into mist.
function umibozu(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=Math.sin(p.swim*.6)*3;
 for(let i=0;i<5;i++){const x=-70+i*35;path(c,`M${x} 40 Q${x-10+s} 80 ${x+6} ${110+(i%2)*12} Q${x+16} 80 ${x+20} 40Z`,P(a,.05,.35-i*.03));}
 const body=path(c,'M-96 50 Q-100 -10 -66 -40 Q-40 -96 0 -98 Q40 -96 66 -40 Q100 -10 96 50 Q48 64 0 62 Q-48 64 -96 50Z',grad(c,P,a,a,-100,60),P(a,-.3,.8),1);
 if(!low){c.save();c.clip(body);ellipse(c,-30,-70,40,16,P('#ffffff',0,.08),-.4);c.restore();}
 for(const x of [-26,26]){const g=c.createRadialGradient(x,-46,2,x,-46,26);g.addColorStop(0,P(b,.2,.55));g.addColorStop(1,P(b,.2,0));ellipse(c,x,-46,26,26,g);}
 eye(c,26,-46,P,7,{iris:b});eye(c,-26,-46,P,7,{iris:b});
}
// Angel shark (Squatina), 2026-11-13: a flat shark that lies buried in sand to ambush fish. A broad, flattened body with
// wide wing-like pectoral fins (it looks half ray), eyes on top of the head, a wide mouth at the very front with fringed
// barbels, two small back fins far behind, and a tail whose lower lobe is the longer. Sandy, freckled dark and pale.
function angelShark(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),f=Math.sin(p.swim*1.1)*3;
 path(c,`M60 2 Q40 ${20+f} 6 ${26+f} Q20 10 30 0Z`,farPalette(P)(a,0));
 path(c,`M-104 -2 L-128 ${-14+s} L-122 ${s} L-136 ${18+s} L-104 4Z`,P(a,-.06),P(a,-.4),.6);
 for(const x of [-60,-86])path(c,`M${x} -6 Q${x+4} -20 ${x+12} -20 L${x+16} -6Z`,P(a,-.04),P(a,-.4),.5);
 const body=path(c,'M-108 0 Q-90 -8 -40 -10 Q10 -12 46 -14 Q72 -16 86 -8 Q92 -2 88 4 Q70 10 40 10 Q0 10 -40 8 Q-90 6 -108 2Z',grad(c,P,a,b,-14,10),P(a,-.45),.7);
 const wing=path(c,`M66 -2 Q54 ${18+f} 10 ${30+f} Q-14 ${34+f} -6 ${22+f} Q14 8 34 4Z`,grad(c,P,a,b,0,32),P(a,-.45),.7);
 path(c,`M2 ${10+f*.5} Q-8 22 -24 26 Q-12 14 -4 8Z`,P(a,-.06),P(a,-.4),.5);
 if(!low){
  for(const [shape,n] of [[body,60],[wing,30]]){c.save();c.clip(shape);for(let i=0;i<n;i++){const u=Math.sin((i+n)*12.9898)*43758.5453,v=Math.sin((i+n)*78.233)*12543.1234;ellipse(c,-108+(u-Math.floor(u))*200,-14+(v-Math.floor(v))*48,1.3,1.1,i%3?P(a,-.45,.6):P(b,.25,.8));}c.restore();}
  skin(c,body,P,a,r.seed,50);
 }
 path(c,'M88 2 Q82 6 74 6',null,P(a,-.55),1.1);
 for(let i=0;i<3;i++)line(c,[[86-i*3,4],[88-i*3,9]],P(a,-.3,.8),.8);
 ellipse(c,66,-14,2.4,1.4,P(a,-.5,.8));
 eye(c,74,-11,P,2,{iris:'#6a7a5a'});
}
// Red handfish (Thymichthys politus), 2026-11-13: one of the rarest fish in the world, living only on a few small reefs in
// south-east Tasmania. About 10 cm long, it walks on the sea floor on pectoral fins shaped like hands. A plump red body
// covered in tiny warts, a lure on its head, a high first dorsal fin like a crest running into a long second dorsal, small
// feet (pelvic fins), an upturned mouth and a rounded tail.
function handfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,3),wk=Math.sin(p.swim*1.5);
 path(c,`M14 14 Q20 ${30+wk*3} 10 ${40+wk*3} l-6 1 l2 -4 l-5 0 l3 -4 l-4 -2 Q4 26 6 14Z`,farPalette(P)(a,0));
 path(c,`M-50 -4 Q-74 ${-20+s} -82 ${s} Q-74 ${20+s} -50 6Z`,P(a,-.04),P(a,-.4),.6);
 path(c,'M-46 -14 Q-20 -30 14 -30 L20 -24 Q-10 -20 -40 -8Z',P(a,.02,.95),P(a,-.4),.6);
 const body=path(c,'M-52 0 Q-46 -24 -6 -26 Q30 -30 44 -16 Q54 -4 48 10 Q34 26 0 24 Q-40 22 -52 6Z',grad(c,P,a,b,-28,24),P(a,-.45),.8);
 if(!low){c.save();c.clip(body);for(let i=0;i<70;i++){const u=Math.sin(i*12.9898)*43758.5453,v=Math.sin(i*78.233)*12543.1234;ellipse(c,-50+(u-Math.floor(u))*100,-28+(v-Math.floor(v))*52,1,1,P(a,.25,.55));}c.restore();skin(c,body,P,a,r.seed,40);}
 path(c,'M16 -20 Q22 -44 32 -46 Q38 -38 38 -16Z',P(a,-.05),P(a,-.45),.6);
 line(c,[[40,-14],[46,-36]],P(a,-.2),1.4);ellipse(c,46,-37,2.2,2,P(b,.1));
 path(c,`M18 10 Q26 ${28+wk*3} 18 ${40+wk*3} l-6 2 l2 -4 l-6 1 l3 -4 l-5 -2 Q8 26 10 10Z`,P(a,-.08),P(a,-.45),.6);
 path(c,`M-6 20 Q-4 ${30-wk*2} -12 ${34-wk*2} l-5 -1 Q-10 26 -14 20Z`,P(a,-.12),P(a,-.45),.5);
 path(c,'M46 4 Q50 0 48 -4',null,P(a,-.55),1.4);
 eye(c,38,-10,P,2.4,{iris:'#3a2a20'});
}
// ---- 2026-11-13, third batch of waiting animals ----
// Basilosaurus (reconstruction), 2026-11-13: an early whale from about 40-34 million years ago, up to 18-20 m long and
// slim as an eel, with a small head, a long jaw of big front teeth and saw-edged cheek teeth, small front flippers, tiny
// hind legs still on its body, and probably a small tail fluke.
function basilosaurus(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,6);
 path(c,`M-176 ${-2+s} Q-196 ${-16+s} -206 ${-18+s} Q-198 ${s} -206 ${18+s} Q-196 ${16+s} -176 ${4+s}Z`,P(a,-.1),P(a,-.45),.7);
 path(c,'M96 10 Q86 28 70 32 Q76 20 82 10Z',farPalette(P)(a,0));
 const body=path(c,'M-180 -1 Q-120 -14 -20 -18 Q60 -22 110 -20 Q134 -18 142 -12 L188 -6 Q192 -2 188 2 L142 6 Q130 12 110 14 Q40 18 -40 16 Q-130 12 -180 4Z',grad(c,P,a,b,-22,18),P(a,-.45),.8);
 if(!low){c.save();c.clip(body);path(c,'M-180 6 Q0 20 190 2 L190 30 L-180 30Z',P(b,0,.55));for(let i=0;i<14;i++)path(c,`M${-150+i*20} -16 q-3 10 0 30`,null,P(a,-.3,.25),1);c.restore();skin(c,body,P,a,r.seed,140);}
 // Tiny hind legs, still on the body.
 path(c,'M-80 10 l-6 11 l3 1 l8 -10Z',P(a,-.12),P(a,-.45),.5);
 path(c,`M104 12 Q94 ${32+s*.3} 74 ${38+s*.3} Q86 24 92 10Z`,grad(c,P,a,a,10,38),P(a,-.45),.6);
 teeth(c,P,{x0:146,y0:-1,x1:186,y1:-3},{type:'fang',size:3.4,color:'#efe7cf'});
 teeth(c,P,{x0:146,y0:2,x1:184,y1:1,upper:false},{type:'triangle',size:2.6,color:'#e6dcc2'});
 faceLine(c,P,'M144 1 L188 -1',P('#1f2a2c'),1.2);
 ellipse(c,182,-8,1.4,.8,P(a,-.6,.8));
 eye(c,138,-10,P,2.2,{iris:'#3a2c20'});
}
// Reefback Leviathan, 2026-11-13: the gentle giant of Subnautica, drawn as itself (owner, 2026-11-10). A huge, slow,
// whale-like grazer, blue and violet, with four broad paddle fins, a rounded head with two long feelers hanging below its
// mouth, pale bands over its head, and a living reef of corals and sea fans growing on its back.
function reefback(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim*.8)*6,s=swing(p,4),q=Math.sin(p.swim*.6);
 path(c,`M64 18 Q56 ${50+f} 26 ${62+f} Q38 36 44 18Z`,farPalette(P)(a,0));
 path(c,`M-36 18 Q-46 ${48-f} -74 ${56-f} Q-60 34 -54 16Z`,farPalette(P)(a,0));
 path(c,`M-120 -4 Q-150 ${-26+s} -170 ${-22+s} Q-156 ${s} -170 ${24+s} Q-150 ${26+s} -120 8Z`,P(a,-.08),P(a,-.45),.8);
 // The two feelers hanging below the mouth.
 for(const dx of [0,12])path(c,`M${124+dx} 14 Q${128+dx+q*4} 44 ${114+dx+q*6} 74 Q${110+dx+q*6} 80 ${116+dx+q*6} 84`,null,P(a,-.12),4);
 const body=path(c,'M-124 0 Q-110 -40 -30 -46 Q50 -50 100 -34 Q132 -20 136 0 Q132 24 100 34 Q40 50 -30 46 Q-110 40 -124 6Z',grad(c,P,a,b,-50,48),P(a,-.45),.9);
 if(!low){c.save();c.clip(body);path(c,'M-124 18 Q0 40 136 10 L136 60 L-124 60Z',P(b,.05,.6));for(let i=0;i<5;i++)path(c,`M${88+i*9} -36 Q${80+i*9} 0 ${90+i*9} 30`,null,P(b,.2,.4),3);skin(c,body,P,a,r.seed,120);c.restore();}
 // The reef on its back: branching corals, sea fans, tube sponges and swaying weed.
 // Spaced so neighbours never touch as they sway, which would close off pockets of water between them.
 const reef=[[-76,'weed'],[-52,'branch'],[-26,'fan'],[0,'tube'],[26,'branch'],[50,'fan'],[72,'weed']];
 // The exact top edge of the body at x, from its two upper curves, so the reef sits into the back rather than on a guess.
 const seg=(x,x0,cx,x1,y0,cy,y1)=>{let lo=0,hi=1;for(let i=0;i<24;i++){const t=(lo+hi)/2,xt=(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*x1;if(xt<x)lo=t;else hi=t;}const t=(lo+hi)/2;return (1-t)*(1-t)*y0+2*(1-t)*t*cy+t*t*y1;};
 const topAt=(x)=>x<-30?seg(x,-124,-110,-30,0,-40,-46):seg(x,-30,50,100,-46,-50,-34);
 // A rocky base along the back that the reef grows from, so nothing between the pieces is closed off.
 {let d=`M-88 ${topAt(-88)+8}`;for(let x=-86;x<=78;x+=6)d+=` L${x} ${topAt(x)-3-Math.abs(Math.sin(x*.37))*4}`;for(let x=78;x>=-88;x-=8)d+=` L${x} ${topAt(x)+8}`;path(c,d+'Z',P('#6a7486'),P('#4a5262'),.6);}
 for(const [x,kind] of reef){const y=topAt(x)-2,w=Math.sin(p.swim*.9+x*.1)*3;
  if(kind==='weed'){for(let i=0;i<2;i++)path(c,`M${x+i*6} ${y} Q${x+i*6+w} ${y-14} ${x+i*6-2+w*1.6} ${y-26-i*4}`,null,P('#4fae6a',0,.95),2.2);}
  if(kind==='branch'){const col=P(x%3?'#f08aa8':'#f2a04a',0,.95);line(c,[[x,y],[x+1,y-16]],col,3);line(c,[[x+1,y-10],[x+8,y-20]],col,2.4);line(c,[[x+1,y-12],[x-6,y-22]],col,2.4);line(c,[[x+8,y-20],[x+10,y-26]],col,2);}
  if(kind==='fan'){path(c,`M${x} ${y} Q${x-9} ${y-20} ${x-3+w*.5} ${y-28} Q${x+7} ${y-26} ${x+8} ${y-14} Q${x+6} ${y-4} ${x} ${y}Z`,P('#9a6ad8',0,.85),P('#6a3aa8',0,.7),.6);if(!low)for(let i=0;i<4;i++)line(c,[[x,y],[x-5+i*4,y-22]],P('#6a3aa8',0,.6),.6);}
  if(kind==='tube'){for(let i=0;i<3;i++){const h=12+i*5;path(c,`M${x+i*4-2} ${y} L${x+i*4-2} ${y-h} L${x+i*4+2} ${y-h} L${x+i*4+2} ${y}Z`,P('#f2d04a',0,.95),P('#a08a20',0,.6),.5);ellipse(c,x+i*4,y-h,1.6,.8,P('#7a6a10'));}}}
 // Near paddles.
 path(c,`M74 20 Q66 ${54+f} 34 ${66+f} Q22 ${64+f} 30 ${52+f} Q46 36 52 20Z`,grad(c,P,a,a,20,66),P(a,-.45),.8);
 path(c,`M-28 20 Q-38 ${50-f} -66 ${60-f} Q-76 ${56-f} -66 ${46-f} Q-54 34 -48 18Z`,grad(c,P,a,a,18,60),P(a,-.45),.8);
 faceLine(c,P,'M134 8 Q124 14 112 12',P(a,-.55),1.4);
 eye(c,112,-8,P,2.6,{iris:'#e0c070'});
}
const REQUESTED={basilosaurus,reefback,umibozu,squatina:angelShark,handfish,bichir,phronima,ctenophore:combJelly,zekrom,sea_eater:seaEater,rayquaza,phytoplankton,bahamut,aspidochelone,monkfish,megamouth,unicornfish,penguin:penguinSwim,kyogre,pikachu,spongebob,patrick,mahoraga,shuckle,greninja,ceadeus,ice_worm:iceWorm,reaper:reaperLeviathan,gargantuan:gargantuanLeviathan,tulkun,cowfish,nematode,pteropod,cockatoo,telescope,lookdown,swallower,livyatan,butterfly:butterflyfish,timingila,goby,pyrosome,phoenix,macropod,whiskered,snake,naga,mako,perch,coelacanth,hagfish,dragonfish,scorpionfish,batfish,bobbit,pistol,flapjack,pliosaur,pterosaur,ungulate,burrower,gecko,mosquito,seabird,raptor,arthropleura,anomalocaris,diver,basking,carpet,sleeper,requiem,vampire:vampireSquid,box_jelly:boxJelly,harp:harpSeal,gulper,bigfin,bowhead,hippocamp,bobtail,strawberry:strawberrySquid,phantom_jelly:phantomJelly,lantern:lanternShark,blanket:blanketOctopus,pilot:pilotWhale,dugong,kiwi,barreleye,tripod:tripodFish,urchin,eagle_ray:eagleRay,ribbon:ribbonEel,garden_eel:gardenEel,spider_crab:spiderCrab,frog:hornedFrog,catfish};
export function drawCommunityCreature(c,res,p,t,P,low=false){
 const kind=motionOf(res.species),map=bodyMap(res.species,p),rise=bobHeight(res.species,p);
 setFlex(map);bodyCarriesTail=!!map&&(kind.k==='fish'||kind.k==='fluke');
 if(rise){c.save();c.translate(0,rise);}
 try{drawFamily(c,res,p,t,P,low);}finally{setFollow(flex.map);setFlex(null);bodyCarriesTail=false;if(rise)c.restore();}
}
function drawFamily(c,res,p,t,P,low){
 const own=EXACT_DRAW[res.species];if(own){own(c,res,p,P,low);return;}
 if(res.species==='giant_turtle'||res.species==='archelon'){leatherback(c,res,p,P,low);return;}
 const family=COMMUNITY_SPECIES[res.species]?.family;
 if(REQUESTED[family]){REQUESTED[family](c,res,p,P,low);return;}
 const render={axolotl,humboldt,stonefish,narwhal,placoderm,crocodile,clownfish,goblin,blue_dragon:blueDragon,sauropod,maw,seal,sea_angel:wingSlug,electric:longFish,lamprey:longFish,frilled:longFish,hammerhead,puffer:smallFish,blob:smallFish,flying:smallFish,trigger:smallFish,cory:smallFish,mosasaur,colossal,kraken:cephalopod,fossil,cat_mermaid:whimsical,chipmunk:whimsical,duck:whimsical,water_spirit:livingOcean,skeleton,fish,shark,cetacean,cephalopod,eel,land,seahorse,crab:benthic,horseshoe:benthic,cucumber:benthic,slug:benthic,angler,billfish:swordfish,tiny_jelly:tinyJelly,kaiju:monster,hydra:monster,bloop:monster,mermaid,theropod,mammal,otter,manta,shrimp,nautilus,man_o_war:manOWar,serpent,platypus,iguana,bird,angel,cthulhu,ichthyosaur,hallucigenia,pet_rock:petRock,land_turtle:landTurtle,beast,avian,pinniped,sirenian,oarfish,crustacean,isopod,sea_pig:seaPig,siphonophore,loosejaw,mata_mata:mataMata,snail,anemone,sponge,tardigrade,dumbo,blue_ringed:blueRinged,leafy:leafySeadragon,plesio,helicoprion,isonade,sacabambaspis,tully,leedsichthys,charybdis,selkie,insect,ambulocetus,titanoboa,sea_squirt:seaSquirt}[family];
 if(!render)throw new Error('No community renderer for '+res.species);
 render(c,res,p,P,low);
}

// ---- Exact species (owner, 15 Nov 2026: "make sure we are getting the exact species of animal right"). ----
// Each one is drawn as its own animal, so nobody who names it is given a general stand-in. They keep the family of the
// nearest drawn animal (zone, swimming, blinking), and EXACT_DRAW below gives each its own picture.
const hash01=(i,s=0)=>{const u=Math.sin(i*(12.9898+s*.7317)+s*78.233)*43758.5453;return u-Math.floor(u);};
// Scattered marks inside a clip, the same every frame.
function scatter(c,shape,n,x0,x1,y0,y1,fn,seed=0){c.save();c.clip(shape);for(let i=0;i<n;i++)fn(x0+hash01(i,seed)*(x1-x0),y0+hash01(i,seed+7)*(y1-y0),i);c.restore();}
// The same, spread evenly: one mark in each cell of a grid, placed at random within it.
function scatterEven(c,shape,cols,rows,x0,x1,y0,y1,fn,seed=0){c.save();c.clip(shape);const w=(x1-x0)/cols,h=(y1-y0)/rows;let i=0;for(let r=0;r<rows;r++)for(let q=0;q<cols;q++,i++)fn(x0+(q+.15+hash01(i,seed)*.7)*w,y0+(r+.15+hash01(i,seed+7)*.7)*h,i);c.restore();}
// Sand tiger shark (Carcharias taurus), also called the grey nurse or ragged-tooth shark: bulky and humpbacked, a pointed
// conical snout, a long mouth that never closes over its ragged, needle-thin teeth, two big back fins of nearly the same
// size set well back, a long upper tail lobe, pale bronze-grey with scattered reddish-brown spots on its rear half.
function sandTiger(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),edge=P(a,-.42,.6);
 const fin=(x0,y0,x1,y1)=>finFill(c,P,a,x0,y0,x1,y1);
 path(c,`M-82 -2 Q-118 ${-22+s*.6} -164 ${-46+s} Q-170 ${-44+s} -166 ${-38+s} Q-150 ${-28+s*.8} -136 ${-16+s*.6} Q-128 -8 -122 -2 Q-128 ${8+s*.4} -140 ${20+s} Q-114 ${14+s*.5} -84 6Z`,fin(-86,0,-160,-40),edge,.7);
 path(c,'M34 14 Q24 40 6 46 Q14 30 18 14Z',farPalette(P)(a,-.06));
 path(c,'M10 -27 Q6 -58 -6 -66 Q-10 -46 -20 -26Z',fin(-4,-26,-6,-64),edge,.7);
 path(c,'M-36 -22 Q-40 -50 -52 -58 Q-56 -40 -64 -18Z',fin(-48,-22,-52,-56),edge,.7);
 const body=path(c,'M-90 0 Q-56 -22 -10 -29 Q40 -34 78 -22 Q100 -14 110 -4 Q118 2 116 5 Q104 11 88 15 Q46 26 -4 25 Q-52 22 -90 7Z',grad(c,P,a,b,-32,26),P(a,-.42),.8);
 c.save();c.clip(body);path(c,'M-96 9 Q-30 17 30 15 Q80 12 118 4 L120 40 L-96 40Z',P(b,0,.9));
 if(!low){skin(c,body,P,a,r.seed,80);ellipse(c,10,-28,70,4,P('#ffffff',0,.14));}c.restore();
 if(!low)scatter(c,body,30,-86,36,-26,14,(x,y,i)=>ellipse(c,x,y,1.5+(i%3)*.6,1.1+(i%2)*.5,P('#7a4630',0,.62)),3);
 path(c,'M-30 19 Q-38 33 -50 35 Q-46 25 -48 17Z',fin(-36,20,-48,34),edge,.5);
 path(c,'M-62 15 Q-68 27 -80 28 Q-76 20 -80 11Z',fin(-66,15,-78,27),edge,.5);
 path(c,'M44 14 Q32 42 10 48 Q18 30 24 14Z',fin(34,15,14,46),edge,.6);
 gillSlits(c,P,a,62,4,-6,10);
 // The long mouth, and its teeth: thin, curved and pointing every way, showing even when it's shut.
 path(c,'M108 8 Q92 15 70 15 Q92 11 106 5Z',P('#2a1a16',0,.85));
 if(!low)for(let i=0;i<9;i++){const x=72+i*4.2,y=14.6-i*1.05,l=3.6+(i%3)*1.2,t=(i%2?-.35:.3);path(c,`M${x} ${y-1} q${t*3} ${l*.6} ${t*5+1} ${l}`,null,P('#f3ead6',0,.95),.9);}
 faceLine(c,P,'M108 8 Q92 15 70 15',P('#2a1a16',0,.75),1);
 ellipse(c,111,-1,1.3,.8,P('#2a1a16',0,.7));
 eye(c,90,-8,P,1.7,{iris:'#c9a845'});
}
// Two requiem sharks that go to the same swim: the sandbar shark (Carcharhinus plumbeus), plain bronze-grey with a very tall
// first back fin standing right over its pectorals and a short rounded snout; and the whitetip reef shark (Triaenodon
// obesus), slim, with a short broad blunt snout, its first back fin set well back, the white tips on that fin and the
// upper tail lobe, and a few dark spots on its grey sides.
function reefRequiem(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),WT=id==='whitetip_reef_shark',W=P('#f6f4ee',0,.96),edge=P(a,-.42,.6);
 path(c,`M-90 -5 Q-112 ${-30+s*.6} -134 ${-60+s} L-138 ${-50+s} Q-128 ${-42+s} -126 ${-36+s} Q-116 ${-14+s*.5} -108 ${2+s*.3} Q-113 ${18+s*.6} -124 ${34+s} Q-104 ${20+s*.5} -90 6Z`,finFill(c,P,a,-92,0,-134,0),edge,.6);
 if(WT)path(c,`M-134 ${-60+s} L-138 ${-50+s} Q-133 ${-46+s} -129 ${-44+s} Q-130 ${-52+s} -134 ${-60+s}Z`,W);
 path(c,'M30 16 Q14 46 -6 50 Q6 32 10 16Z',farPalette(P)(a,-.05));
 const d1=WT?'M2 -21 Q-6 -54 -22 -62 Q-22 -42 -34 -20Z':'M46 -26 Q38 -84 10 -94 Q12 -56 -6 -30 L2 -27Z';
 path(c,d1,finFill(c,P,a,WT?-10:20,-24,WT?-18:12,WT?-60:-90),edge,.6);
 if(WT)path(c,'M-22 -62 Q-12 -58 -8 -50 Q-15 -51 -21 -50Z',W);
 path(c,WT?'M-54 -14 Q-60 -36 -72 -40 Q-70 -26 -78 -12Z':'M-52 -15 Q-60 -27 -68 -29 Q-67 -21 -74 -13Z',finFill(c,P,a,-60,-14,-68,-36),edge,.5);
 path(c,WT?'M-56 12 Q-64 26 -76 26 Q-72 18 -78 10Z':'M-56 12 Q-64 24 -74 24 Q-70 17 -76 10Z',P(a,-.12));
 const body=path(c,WT?'M-96 -4 Q-58 -14 -18 -20 Q30 -25 72 -20 Q98 -15 110 -7 Q116 -1 113 5 Q102 11 84 15 Q30 22 -40 16 Q-76 10 -96 5Z':'M-96 -5 Q-60 -16 -20 -26 Q24 -33 62 -27 Q92 -21 108 -10 Q117 -4 116 1 Q110 7 96 11 Q82 18 50 25 Q0 30 -44 19 Q-76 11 -96 6Z',grad(c,P,a,a,-30,24),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-100 8 Q-40 13 20 11 Q70 8 120 -1 L122 50 L-100 50Z',P(b));
 if(!low){skin(c,body,P,a,r.seed,80);path(c,'M90 -5 Q0 -9 -92 0',null,P(a,.25,.3),.7);
  if(WT)for(let i=0;i<16;i++)ellipse(c,-80+hash01(i,4)*150,-18+hash01(i,9)*20,1.4+(i%3)*.4,1,P('#2a2e30',0,.55));
  else path(c,'M2 -27 Q-18 -24 -50 -16',null,P(a,-.35,.5),1);}
 c.restore();
 path(c,'M-24 19 Q-34 33 -46 33 Q-42 25 -42 17Z',finFill(c,P,a,-30,18,-44,32),edge,.5);
 path(c,WT?'M44 13 Q34 46 12 52 Q18 32 24 13Z':'M48 15 Q38 58 12 66 Q18 40 24 15Z',finFill(c,P,a,36,15,16,56),edge,.6);
 gillSlits(c,P,a,WT?62:64,4.4,-7,9);
 faceLine(c,P,WT?'M84 12 Q96 10 106 6':'M82 12.5 Q96 9.5 108 4',P('#15191c',0,.78),1.2);
 // The whitetip's nostrils open under flaps like little tubes at the front of its blunt snout.
 if(WT){path(c,'M108 -3 q3 1 4 4',null,P(a,-.4,.8),1.4);eye(c,94,-6,P,2,{iris:'#3a4038'});path(c,'M90 -10 Q95 -12 99 -9',null,P(a,-.4,.7),.9);}
 else{ellipse(c,111,-1,1.3,.8,P('#15191c',0,.75));eye(c,94,-7,P,2,{iris:'#3a3d38'});}
}
// Jeff the Land Shark (Marvel): a small, friendly blue-grey shark who trots about on four stubby legs, with big dark eyes.
function jeffLandShark(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),step=Math.sin(p.swim*1.4)*6,edge=P(a,-.45,.65);
 const leg=(x,o,far)=>{const col=far?farPalette(P)(a,-.1):P(a,-.06);path(c,`M${x-7} 18 Q${x-8+o*.3} 34 ${x-6+o} 40 Q${x+2+o} 44 ${x+8+o} 40 Q${x+8+o*.3} 30 ${x+7} 16Z`,col,edge,.7);ellipse(c,x+1+o,41,8,3.6,far?farPalette(P)(a,-.25):P(a,-.2));};
 leg(-38,-step,true);leg(30,step,true);
 path(c,`M-60 -2 Q-82 ${-18+s} -98 ${-34+s} Q-92 ${-12+s} -86 ${-2+s*.5} Q-92 ${10+s} -98 ${24+s} Q-80 ${12+s} -60 8Z`,finFill(c,P,a,-62,2,-96,-28),edge,.7);
 path(c,'M-2 -26 Q-6 -52 -18 -58 Q-16 -40 -26 -24Z',finFill(c,P,a,-10,-26,-16,-56),edge,.7);
 const body=path(c,'M-64 2 Q-48 -24 -4 -30 Q40 -34 66 -22 Q82 -14 84 2 Q82 18 62 24 Q20 30 -24 26 Q-52 20 -64 8Z',grad(c,P,a,b,-32,28),P(a,-.45),.9);
 c.save();c.clip(body);path(c,'M-70 10 Q0 22 90 6 L90 40 L-70 40Z',P(b,0,.95));if(!low)skin(c,body,P,a,r.seed,40);c.restore();
 leg(-24,step,false);leg(44,-step,false);
 path(c,'M30 10 Q22 26 8 28 Q14 18 14 10Z',finFill(c,P,a,24,12,10,26),edge,.6);
 gillSlits(c,P,a,52,3.4,-6,6,3,2);
 // A happy grin with a row of little teeth.
 path(c,'M80 8 Q70 16 56 14',null,P('#2a2226',0,.85),1.4);
 if(!low)teeth(c,P,{x0:58,y0:14.4,x1:78,y1:9.4,bend:.6},{type:'triangle',size:2.2,color:'#f6f1e4',gum:false});
 eye(c,64,-8,P,6.2,{iris:'#141a20'});
}
// Thresher relatives drawn on the thresher's body, and the three other hammerheads on the hammerhead's, are in shark() and
// hammerhead() above (bigeye and pelagic threshers; scalloped hammerhead, bonnethead and winghead).

// Cownose ray (Rhinoptera bonasus), seen from above: plain brown above and white below, long pointed wings, a short tail
// with a little fin at its root, and a head notched across the front into two lobes, like a cow's nose.
function cownoseRay(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*14,q=Math.sin(p.swim*.7)*5;
 path(c,`M-38 -2.2 Q-90 ${q*.3-1} -142 ${q} Q-90 ${q*.3+1.4} -38 2.6Z`,P(a,-.3));
 path(c,'M-40 0 L-52 -1.6 L-46 0 L-52 1.6Z',P(a,-.2));
 for(const s2 of [-1,1])path(c,`M-34 ${s2*5} Q-48 ${s2*10} -56 ${s2*16} Q-44 ${s2*18} -32 ${s2*12}Z`,P(a,-.12),P(a,-.4),.5);
 const body=path(c,`M44 -16 Q30 ${-50-f*.4} -4 ${-112-f} Q-10 ${-62-f*.5} -42 -13 Q-48 0 -42 13 Q-10 ${62+f*.5} -4 ${112+f} Q30 ${50+f*.4} 44 16Z`,grad(c,P,a,a,-110,110),P(a,-.45),.8);
 if(!low){skin(c,body,P,a,r.seed,70);c.save();c.clip(body);path(c,'M44 0 Q0 -3 -40 0',null,P(a,.2,.3),1.4);for(const s2 of [-1,1])path(c,`M30 ${s2*14} Q8 ${s2*48} -6 ${s2*96}`,null,P(a,.18,.18),2);c.restore();}
 const head=path(c,'M36 -17 Q52 -21 64 -18 Q74 -14 76 -8 Q71 -4 70 0 Q71 4 76 8 Q74 14 64 18 Q52 21 36 17Z',grad(c,P,a,a,-20,20),P(a,-.45),.8);
 if(!low){c.save();c.clip(head);skin(c,head,P,a,r.seed+2,14);c.restore();}
 path(c,'M70 0 Q60 -1 52 0',null,P(a,-.4,.7),.8);
 for(const s2 of [-1,1])ellipse(c,56,s2*17,3.6,2.6,P(a,-.12));
 eye(c,56,-18,P,1.5,{iris:'#c9b46a'});eye(c,56,18,P,1.5,{iris:'#c9b46a'});
}
// Common torpedo ray (Torpedo torpedo), an electric ray, from above: an almost round soft disc with a straight front,
// brown with up to five blue eyespots ringed in black, two small back fins on a thick tail and a broad round tail fin.
function torpedoRay(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,w=Math.sin(p.swim)*3,q=Math.sin(p.swim*.8)*4;
 path(c,`M-36 -9 Q-70 ${-8+q*.3} -98 ${-6+q} L-98 ${6+q} Q-70 ${8+q*.3} -36 9Z`,grad(c,P,a,a,-9,9),P(a,-.45),.7);
 path(c,`M-96 ${-7+q} Q-118 ${-20+q} -126 ${-14+q} Q-122 ${q} -126 ${14+q} Q-118 ${20+q} -96 ${7+q}Z`,P(a,-.1),P(a,-.45),.7);
 for(const [x,l] of [[-50,12],[-72,10]])path(c,`M${x} ${-1.6+q*(-x-36)/62} l${-l} .6 l${l*.2} 1.6Z`,P(a,-.3));
 for(const s2 of [-1,1])path(c,`M-30 ${s2*14} Q-46 ${s2*26} -54 ${s2*20} Q-50 ${s2*10} -36 ${s2*8}Z`,P(a,-.12),P(a,-.45),.5);
 const body=path(c,`M50 -6 Q52 -30 30 ${-50-w} Q4 ${-62-w} -22 ${-50-w} Q-44 -34 -42 0 Q-44 34 -22 ${50+w} Q4 ${62+w} 30 ${50+w} Q52 30 50 6Z`,grad(c,P,a,a,-60,60),P(a,-.45),.8);
 if(!low){skin(c,body,P,a,r.seed,60);c.save();c.clip(body);path(c,'M46 0 Q4 -3 -40 0',null,P(a,.2,.28),1.4);
  // The electric organs show as a faint kidney shape on each side of the head.
  for(const s2 of [-1,1])ellipse(c,26,s2*22,12,8,P(a,.1,.18),s2*.3);c.restore();}
 for(const [x,y] of [[10,-24],[10,24],[-14,-12],[-14,12],[-2,0]]){ellipse(c,x,y,6.4,6.4,P('#14161a',0,.9));ellipse(c,x,y,4.6,4.6,P('#3b7fd0',0,.95));ellipse(c,x,y,1.8,1.8,P('#14161a',0,.85));}
 for(const s2 of [-1,1]){ellipse(c,34,s2*9,2.2,1.4,P(a,-.45,.8));eye(c,40,s2*8,P,1.4,{iris:'#c8b070'});}
}
// Bluespotted ribbontail ray (Taeniura lymma), from above: an oval disc the colour of olive sand with vivid blue spots,
// and a broad tail as long as the disc, with a blue stripe down each side and a fold of fin underneath like a ribbon.
function ribbontailRay(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,w=Math.sin(p.swim)*4,BL='#2f86e0';
 const tl=[];for(let i=0;i<=14;i++){const k=i/14;tl.push([-38-k*96,Math.sin(p.swim*.8-k*3)*(1+k*7),(1-k)*7+.6]);}
 let up='',dn='';tl.forEach(([x,y,h],i)=>{up+=`${i?'L':'M'}${x} ${y-h}`;});for(let i=14;i>=0;i--){const [x,y,h]=tl[i];dn+=`L${x} ${y+h+(i>3&&i<13?2.6:0)}`;}
 path(c,up+dn+'Z',P(a,-.18),P(a,-.45),.6);
 for(const s2 of [-1,1]){let d='';tl.slice(0,12).forEach(([x,y,h],i)=>{d+=`${i?'L':'M'}${x} ${y+s2*h*.45}`;});path(c,d,null,P(BL,0,.9),1.6);}
 { const [x,y]=tl[5];path(c,`M${x+6} ${y-.6} L${x-8} ${y-2.6}`,null,P('#e6dcc0',0,.9),1.2);}
 for(const s2 of [-1,1])path(c,`M-30 ${s2*10} Q-42 ${s2*20} -50 ${s2*16} Q-46 ${s2*8} -34 ${s2*6}Z`,P(a,-.12),P(a,-.45),.5);
 const body=path(c,`M58 0 Q56 -24 32 ${-40-w} Q4 ${-50-w} -22 ${-40-w} Q-42 -24 -42 0 Q-42 24 -22 ${40+w} Q4 ${50+w} 32 ${40+w} Q56 24 58 0Z`,grad(c,P,a,a,-50,50),P(a,-.45),.8);
 if(!low){skin(c,body,P,a,r.seed,40);c.save();c.clip(body);path(c,'M52 0 Q4 -3 -40 0',null,P(a,.22,.28),1.4);c.restore();}
 scatterEven(c,body,low?4:7,low?4:6,-38,54,-44,44,(x,y,i)=>{const rr=1.6+(i%4)*.9;ellipse(c,x,y,rr,rr,P(BL,0,.95));if(!low&&rr>2.5)ellipse(c,x-.5,y-.5,rr*.4,rr*.4,P('#9fd0ff',0,.8));},11);
 for(const s2 of [-1,1]){ellipse(c,26,s2*12,2.6,1.6,P(a,-.45,.8));ellipse(c,34,s2*9,3,2.2,P(a,.14,.85));eye(c,34,s2*9,P,1.7,{iris:'#d8b850'});}
}
// Emperor angelfish (Pomacanthus imperator), the adult: a deep oval body of royal blue crossed by many narrow yellow
// stripes running back and a little up, a black mask through the eye edged in pale blue, a dark band behind the gill
// cover, a pale face, a yellow-orange rounded tail and a spine on the gill cover.
function emperorAngelfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),K='#10141e',BL='#8ec8f0';
 path(c,`M-40 -6 Q-58 ${-20+s} -66 ${-14+s} Q-70 ${s} -66 ${14+s} Q-58 ${20+s} -40 6Z`,P(b,.02),P(b,-.35),.6);
 const body=path(c,'M-44 0 Q-48 -30 -26 -40 Q-2 -48 22 -40 Q40 -30 48 -12 L56 -4 Q58 0 56 4 L48 10 Q40 30 22 40 Q-2 48 -26 40 Q-48 30 -44 0Z',grad(c,P,a,a,-46,46),P(a,-.4),.7);
 c.save();c.clip(body);
 for(let i=0;i<15;i++){const y=-44+i*6.4;path(c,`M-50 ${y+10} Q-10 ${y+2} 24 ${y-6} Q36 ${y-9} 46 ${y-8}`,null,P(b,0,.92),2.1);}
 path(c,'M22 -48 L34 -48 L30 48 L18 48Z',P('#1a2440',0,.92));path(c,'M22 -48 L22 48',null,P(BL,0,.8),1.2);path(c,'M34 -48 L30 48',null,P(BL,0,.8),1.2);
 path(c,'M34 -48 L60 -48 L60 48 L30 48Z',P('#dfe6ea',0,.95));
 path(c,'M36 -14 Q44 -18 58 -8 L58 -1 Q46 -4 36 0Z',P(K,0,.92));path(c,'M36 -14 Q44 -18 58 -8',null,P(BL,0,.85),1);path(c,'M36 0 Q46 -4 58 -1',null,P(BL,0,.85),1);
 path(c,'M18 18 Q26 26 22 34 Q14 30 14 22Z',P('#f0a030',0,.9));
 if(!low)skin(c,body,P,a,r.seed,40);c.restore();
 path(c,'M28 12 L22 20',null,P(BL,0,.9),1.4);
 path(c,`M2 10 Q-6 ${22+s*.3} -16 24 Q-8 16 -4 10Z`,P(b,-.05,.85));
 faceLine(c,P,'M57 1 L51 2',P(K,0,.8));
 eye(c,44,-7,P,2.4,{iris:'#2b2119'});
}
// Copperband butterflyfish (Chelmon rostratus): a flat white disc of a fish with five copper-orange bands edged in black,
// the first through the eye, a long thin tubular snout for picking food from cracks, and a black eyespot ringed in white
// at the back of its dorsal fin.
function copperband(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,5),K='#14120f';
 path(c,`M-36 -6 Q-52 ${-18+s} -60 ${-16+s} Q-56 ${s} -60 ${16+s} Q-52 ${18+s} -36 6Z`,P(a,-.02),P(a,-.3),.6);
 path(c,`M-50 ${-15+s} Q-55 ${s} -50 ${15+s}`,null,P(K,0,.8),2.2);
 const body=path(c,'M-38 0 Q-40 -34 -6 -40 Q20 -42 34 -20 Q42 -10 46 -4 L76 -2 Q78 0 76 2 L46 5 Q40 14 32 22 Q16 40 -8 38 Q-40 34 -38 0Z',grad(c,P,a,a,-40,40),P(a,-.35),.7);
 c.save();c.clip(body);
 for(const x of [32,14,-4,-22]){path(c,`M${x-4} -44 L${x+4} -44 L${x+2} 44 L${x-6} 44Z`,P(b,0,.95));path(c,`M${x-4} -44 L${x-6} 44 M${x+4} -44 L${x+2} 44`,null,P(K,0,.6),.8);}
 path(c,'M-40 -44 L-34 -44 L-34 44 L-40 44Z',P(b,-.1,.9));
 if(!low)skin(c,body,P,a,r.seed,30);c.restore();
 ellipse(c,-28,-26,5,4.4,P(K));c.strokeStyle=P('#ffffff',0,.85);c.lineWidth=1;c.beginPath();c.ellipse(-28,-26,6.2,5.6,0,0,TAU);c.stroke();
 path(c,'M72 -2 L78 -1 L78 1 L72 2',null,P(K,0,.6),.6);
 eye(c,32,-7,P,2.2,{iris:'#2b2119'});
}
// Stoplight parrotfish (Sparisoma viride), the full-grown male: a stout green fish whose big scales are edged in pink and
// orange, a yellow spot high on the gill cover, a crescent tail edged in pink, and its front teeth fused into a pale beak
// for scraping algae from coral.
function parrotfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,6),K='#122019';
 path(c,`M-52 -4 Q-78 ${-30+s} -92 ${-34+s} Q-80 ${s} -92 ${34+s} Q-78 ${30+s} -52 4Z`,grad(c,P,a,a,-34,34),P(a,-.4),.6);
 path(c,`M-90 ${-32+s} Q-78 ${s} -90 ${32+s}`,null,P(b,0,.9),3);
 path(c,`M40 -24 Q0 ${-44+s*.3} -48 -18 L-44 -10 Q0 -32 36 -22Z`,P(a,-.1,.95),P(b,0,.7),1);
 path(c,`M14 24 Q-14 ${40+s*.3} -44 18 L-40 12 Q-10 28 12 20Z`,P(a,-.1,.95),P(b,0,.7),1);
 const body=path(c,'M-56 0 Q-48 -30 0 -34 Q40 -34 62 -18 Q74 -8 74 2 Q72 14 60 20 Q36 32 0 32 Q-46 30 -56 4Z',grad(c,P,a,a,-34,32),P(a,-.4),.8);
 c.save();c.clip(body);
 if(!low)for(let row=0;row<6;row++)for(let col=0;col<9;col++){const x=-48+col*12+(row%2)*6,y=-28+row*10;path(c,`M${x} ${y-5} q7 5 0 10`,null,P(b,0,.75),1.3);ellipse(c,x-2,y,2.6,3.2,P(a,.12,.35));}
 path(c,'M34 -12 Q46 -10 54 -2',null,P('#f0a050',0,.8),1.6);path(c,'M36 4 Q48 6 62 2',null,P('#f0a050',0,.7),1.4);
 if(!low)skin(c,body,P,a,r.seed,30);c.restore();
 ellipse(c,40,-20,4,3,P('#f2d23c',0,.95));
 path(c,`M18 4 Q6 ${16+s*.3} -6 16 Q4 8 8 4Z`,P(a,-.15,.9),P(b,0,.7),.8);
 path(c,'M66 -4 Q76 -3 77 2 Q76 8 68 9 Q71 2 66 -4Z',P('#f2ecd8'),P('#a49a80'),.6);path(c,'M68 2 L76 2',null,P('#a49a80',0,.8),.6);
 eye(c,58,-8,P,2.6,{iris:'#e8a030'});
}
// American flagfish (Jordanella floridae): a small, deep-bodied killifish of Florida's fresh waters, olive-green with rows
// of red dots that run into stripes along its sides like the stripes of a flag, and a dark spot in the middle of each side.
function flagfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,6),K='#1a1f14';
 path(c,`M-42 -4 Q-60 ${-20+s} -66 ${-16+s} Q-62 ${s} -66 ${16+s} Q-60 ${20+s} -42 4Z`,P(a,-.08),P(a,-.4),.6);
 path(c,`M14 -30 Q-10 ${-50+s*.3} -38 -22 L-34 -14 Q-6 -34 14 -26Z`,P(a,-.12,.95),P(b,0,.6),.8);
 path(c,`M8 26 Q-14 ${42+s*.3} -36 18 L-32 12 Q-10 28 8 22Z`,P(a,-.12,.95),P(b,0,.6),.8);
 const body=path(c,'M-46 0 Q-40 -30 0 -32 Q32 -32 46 -16 Q54 -6 54 2 Q52 12 44 18 Q28 30 0 30 Q-40 28 -46 4Z',grad(c,P,a,a,-32,30),P(a,-.4),.7);
 c.save();c.clip(body);
 for(let row=0;row<7;row++){const y=-22+row*7;for(let i=0;i<12;i++)ellipse(c,-40+i*7.5,y+Math.sin(i*.5)*1,2.6,1.6,P(b,0,.85));}
 if(!low)fishScales(c,body,P,a);
 ellipse(c,0,-2,5,4.4,P(K,0,.8));if(!low)skin(c,body,P,a,r.seed,30);c.restore();
 faceLine(c,P,'M53 0 L47 2',P(K,0,.8));
 eye(c,40,-8,P,3,{iris:'#c8a040'});
}
// Wels catfish (Silurus glanis), Europe's biggest freshwater fish: a long body that flattens sideways towards the tail, a
// huge broad head and wide mouth, two long whiskers from the upper jaw and four short ones below, a tiny back fin, a very
// long fin underneath running almost to the small rounded tail, and mottled olive-black above with a pale belly.
function welsCatfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,6),K='#141611';
 path(c,`M-104 -2 Q-124 ${-16+s} -132 ${-8+s} Q-134 ${s} -132 ${8+s} Q-124 ${16+s} -104 4Z`,P(a,-.1),P(a,-.45),.6);
 path(c,`M14 20 Q-40 ${34+s*.2} -100 10 L-98 4 Q-40 22 14 14Z`,P(a,-.06,.95),P(a,-.45),.6);
 const body=path(c,'M-108 0 Q-70 -16 0 -22 Q50 -26 84 -22 Q108 -16 116 -4 Q118 6 108 12 Q84 20 40 22 Q-30 22 -108 6Z',grad(c,P,a,b,-26,22),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M-110 8 Q-20 18 60 18 Q100 16 120 8 L120 40 L-110 40Z',P(b,-.02,.9));
 if(!low)for(let i=0;i<40;i++){const x=-100+hash01(i,2)*200,y=-20+hash01(i,5)*26;ellipse(c,x,y,3+hash01(i,8)*5,2+hash01(i,9)*3,P(i%3?K:b,i%3?0:.1,i%3?.35:.25),hash01(i,3)*3);}
 if(!low)skin(c,body,P,a,r.seed,60);c.restore();
 path(c,'M40 -24 Q36 -36 28 -38 Q28 -30 24 -24Z',P(a,-.1));
 path(c,`M52 8 Q40 ${22+s*.3} 26 26 Q34 16 36 8Z`,P(a,-.12),P(a,-.45),.6);
 faceLine(c,P,'M116 2 Q104 10 86 9',P(K,0,.85),1.4);
 const wv=Math.sin(p.swim*.9)*5;
 for(const [dy,far] of [[0,true],[2,false]])path(c,`M${112-dy} ${-2+dy} Q${96} ${-24+wv} ${60} ${-14+wv+dy*2} Q${30} ${-6+wv*1.4} ${10} ${10+wv*1.6}`,null,P(far?'#2a2a22':'#3a382e',0,.9),far?1.6:2);
 for(let i=0;i<4;i++)path(c,`M${100-i*4} 12 Q${96-i*5} ${22+i} ${88-i*6} ${28+i*2}`,null,P('#3a382e',0,.8),1);
 eye(c,96,-8,P,1.6,{iris:'#c8b060'});
}
// Two pufferfish: the dogface puffer (Arothron nigropunctatus), grey-brown to yellowish with scattered black spots and a
// dark, dog-like muzzle; and the pea puffer (Carinotetraodon travancoricus), the smallest pufferfish, a little yellow fish
// of Indian rivers with dark green-brown blotches and green-gold eyes.
function smallPuffer(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,4),pea=r.species==='pea_puffer',sea=r.species==='pelagic_puffer',K='#16140f';
 path(c,`M-46 -3 Q-62 ${-16+s} -70 ${-14+s} Q-66 ${s} -70 ${14+s} Q-62 ${16+s} -46 3Z`,P(a,-.1),P(a,-.4),.6);
 {const d=sea?8:0;path(c,`M-18 ${-30+d} Q-34 ${-44+d+s*.3} -42 ${-36+d} Q-34 ${-24+d} -24 ${-20+d}Z`,P(a,-.1));path(c,`M-18 ${30-d} Q-34 ${44-d+s*.3} -42 ${36-d} Q-34 ${24-d} -24 ${20-d}Z`,P(a,-.1));}
 const body=path(c,sea?'M-50 0 Q-44 -22 -6 -26 Q34 -28 54 -14 Q62 -4 62 2 Q60 12 50 18 Q30 30 -6 30 Q-44 26 -50 0Z':'M-50 0 Q-48 -32 -6 -38 Q34 -40 52 -18 Q62 -4 62 2 Q60 14 50 22 Q30 38 -6 38 Q-48 32 -50 0Z',grad(c,P,a,b,-40,38),P(a,-.4),.8);
 c.save();c.clip(body);path(c,sea?'M-56 2 Q0 8 66 -2 L66 44 L-56 44Z':'M-56 14 Q0 26 66 10 L66 44 L-56 44Z',P(b,.06,.92));
 if(sea){if(!low)for(let i=0;i<30;i++)path(c,`M${-44+(i%10)*10} ${10+Math.floor(i/10)*7} l1.4 -2.4`,null,P(a,-.1,.5),.7);}
 else if(pea){for(let i=0;i<9;i++)ellipse(c,-40+hash01(i,4)*84,-28+hash01(i,6)*32,6+hash01(i,1)*6,4+hash01(i,3)*4,P('#5a5a26',0,.7),hash01(i,2)*3);}
 else{for(let i=0;i<46;i++){const x=-44+hash01(i,3)*100,y=-34+hash01(i,7)*66;ellipse(c,x,y,1.4+(i%3)*.5,1.3+(i%3)*.4,P(K,0,.85));}
  const m=c.createRadialGradient(60,4,1,58,4,16);m.addColorStop(0,P('#2a2420',0,.9));m.addColorStop(1,P('#2a2420',0,0));c.fillStyle=m;c.fillRect(40,-14,30,34);}
 if(!low)skin(c,body,P,a,r.seed,40);c.restore();
 path(c,`M14 6 Q4 ${18+s*.3} -6 18 Q2 10 6 6Z`,P(a,-.12,.9));
 ellipse(c,62,3,2.6,3,P(pea?'#6a5a2a':'#2a2420'));
 eye(c,40,-12,P,pea?4.2:3.6,{iris:pea?'#7ab84a':'#3a3226'});
}
// Yellow boxfish (Ostracion cubicus), the young one: a body boxed in fused bony plates, bright yellow with black spots,
// little fins whirring like propellers, a small rounded tail and a puckered mouth at the front of its square face.
function yellowBoxfish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,3),fl=Math.sin(p.swim*3)*4,K='#15130e';
 path(c,`M-38 -4 Q-56 ${-14+s} -62 ${-12+s} Q-60 ${s} -62 ${12+s} Q-56 ${14+s} -38 4Z`,P(a,-.06),P(a,-.4),.6);
 path(c,`M-26 -26 Q-34 ${-38+fl} -40 -30 Q-34 -24 -28 -22Z`,P(a,-.06,.85));path(c,`M-26 26 Q-34 ${38-fl} -40 30 Q-34 24 -28 22Z`,P(a,-.06,.85));
 const body=path(c,'M-42 -6 Q-42 -28 -24 -30 L34 -30 Q48 -28 50 -14 L52 -2 Q54 4 52 8 L50 16 Q48 30 34 30 L-24 30 Q-42 28 -42 6Z',grad(c,P,a,b,-32,32),P(a,-.4),.8);
 c.save();c.clip(body);
 if(!low)for(let row=0;row<5;row++)for(let col=0;col<8;col++){const x=-36+col*11+(row%2)*5.5,y=-24+row*12;path(c,`M${x} ${y-6} L${x+5.5} ${y-3} L${x+5.5} ${y+3} L${x} ${y+6} L${x-5.5} ${y+3} L${x-5.5} ${y-3}Z`,null,P(a,-.2,.35),.6);}
 for(let row=0;row<5;row++)for(let col=0;col<8;col++)ellipse(c,-36+col*11+(row%2)*5.5,-24+row*12,2.3,2.3,P(K,0,.88));
 if(!low)skin(c,body,P,a,r.seed,30);c.restore();
 path(c,`M14 4 Q8 ${14+fl} 0 14 Q6 8 8 4Z`,P(a,-.1,.9));
 ellipse(c,55,3,3.4,2.8,P('#e8a060'));ellipse(c,56,3,1.4,1.2,P('#5a2a20'));
 eye(c,36,-14,P,3.6,{iris:'#2a3a20'});
}
// Three jellyfish. The crystal jelly (Aequorea victoria) is a clear, flat, glassy bell with a hundred fine canals running
// out from the middle, each ending in a point of green light at the rim (the glow that gave science its green fluorescent
// protein), and a fringe of many thin tentacles. The blue blubber (Catostylus mosaicus) is a firm, rounded blue bell with a
// mosaic of tiny grains and no rim tentacles, only eight thick frilled arms beneath. The Pacific sea nettle (Chrysaora
// fuscescens) is a golden-brown bell with darker stripes radiating from the top, long dark red tentacles and four long,
// pale, frilly mouth-arms.
function exactJelly(c,r,p,P,low){
 const id=r.species,a=r.colors.primary,b=r.colors.secondary,sw=p.swim;
 if(id==='crystal_jelly'){
  crisp(c,(c)=>{for(let i=0;i<54;i++){const x=-50+i*1.9;path(c,`M${x} 0 Q${x+Math.sin(sw+i*.4)*5} 20 ${x+Math.sin(sw*.8+i*.3)*9} ${34+(i%5)*5}`,null,P('#e8f4f6',0,.45),.5);}});
  const g=c.createRadialGradient(0,-12,2,0,-8,52);g.addColorStop(0,P(a,.1,.3));g.addColorStop(.75,P(a,0,.12));g.addColorStop(1,P('#ffffff',0,.4));
  const bell=path(c,'M-52 1 C-52 -26 52 -26 52 1 Q0 7 -52 1Z',g,P('#eaf8fa',0,.75),.9);
  if(!low){c.save();c.clip(bell);for(let i=0;i<36;i++){const t=i/35,x=-50+t*100;path(c,`M0 -18 Q${x*.5} -16 ${x} 1`,null,P('#d8f0f4',0,.35),.5);}c.restore();}
  for(let i=0;i<36;i++){const x=-50+i*(100/35);ellipse(c,x,1.5,1.2,1,P(b,.1,.95));}
  ellipse(c,0,-8,10,5,P('#f4fbfc',0,.35));
  return;}
 if(id==='blue_blubber_jellyfish'){
  for(let i=0;i<8;i++){const x=-24+i*7,ph=sw+i*.7,len=34+(i%3)*5;const d=`M${x} -2 Q${x+Math.sin(ph)*6} ${len*.5} ${x+Math.sin(ph*.8)*8} ${len}`;path(c,d,null,P(b,-.05,.9),7);if(!low)for(let k=1;k<6;k++)ellipse(c,x+Math.sin(ph)*k*1.2,k*len/6,4.2,1.6,P(b,.15,.75),.4);}
  const g=c.createRadialGradient(-8,-26,2,0,-14,50);g.addColorStop(0,P(a,.3,.95));g.addColorStop(.7,P(a,0,.9));g.addColorStop(1,P(a,-.25,.9));
  const bell=path(c,'M-44 0 C-46 -52 46 -52 44 0 Q0 8 -44 0Z',g,P(a,-.35,.8),1);
  if(!low)scatterEven(c,bell,12,6,-44,44,-46,2,(x,y,i)=>ellipse(c,x,y,1,1,P(i%2?'#ffffff':a,i%2?0:-.25,.4)),5);
  path(c,'M-44 0 Q0 8 44 0',null,P(b,.1,.8),2);
  return;}
 // Pacific sea nettle.
 for(let i=0;i<14;i++){const x=-38+i*5.8,ph=sw+i*.5;path(c,`M${x} 0 Q${x+Math.sin(ph)*10} 30 ${x+Math.sin(ph*.7)*16} ${62+(i%4)*7}`,null,P('#7a2a22',0,.75),1);}
 for(let i=0;i<4;i++){const x=-12+i*8,ph=sw+i;const d=`M${x} 0 Q${x+Math.sin(ph)*8} 30 ${x-4+Math.sin(ph*.8)*12} 60 Q${x+Math.sin(ph)*6} 70 ${x+2} 78`;path(c,d,null,P(b,.05,.85),5);if(!low)path(c,d,null,P('#fff8ea',0,.5),1.4);}
 const g=c.createRadialGradient(0,-30,2,0,-16,50);g.addColorStop(0,P(a,.15,.95));g.addColorStop(.8,P(a,0,.92));g.addColorStop(1,P(b,0,.9));
 const bell=path(c,'M-44 1 C-45 -46 45 -46 44 1 Q38 5 32 2 Q26 6 20 3 Q13 7 6 4 Q0 7 -6 4 Q-13 7 -20 3 Q-26 6 -32 2 Q-38 5 -44 1Z',g,P(a,-.35,.8),1);
 c.save();c.clip(bell);for(let i=0;i<16;i++){const q=Math.PI*(i/15);path(c,`M0 -34 L${-Math.cos(q)*52} ${-34+Math.sin(q)*40}`,null,P('#6a2e16',0,.5),2.4);}c.restore();
}
// Blue button (Porpita porpita): not a true jellyfish but a colony, drifting at the surface. A flat golden-brown float
// ringed like a coin sits in the middle, and bright blue tentacles with knobbed tips spread all around it.
function blueButton(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=p.swim;
 for(let i=0;i<22;i++){const q=i/22*TAU,wv=Math.sin(sw+i)*.08,dx=Math.cos(q+wv),dy=Math.sin(q+wv)*.45,L=46+(i%3)*6;
  const x1=dx*L,y1=dy*L+Math.abs(dx)*6;line(c,[[dx*14,dy*14],[x1,y1]],P(a,0,.9),2.6);
  if(!low)for(let k=0;k<4;k++){const t=.45+k*.15;ellipse(c,dx*L*t,(dy*L+Math.abs(dx)*6)*t,1.5,1.2,P(a,.25,.9));}
  ellipse(c,x1,y1,2.4,2,P(a,.3,.95));}
 const g=c.createRadialGradient(-4,-4,1,0,0,22);g.addColorStop(0,P(b,.25));g.addColorStop(1,P(b,-.15));
 const disc=path(c,'M-22 0 Q-22 -11 0 -11 Q22 -11 22 0 Q22 11 0 11 Q-22 11 -22 0Z',g,P(b,-.35),.8);
 if(!low){c.save();c.clip(disc);for(let k=1;k<4;k++){c.strokeStyle=P(b,-.25,.6);c.lineWidth=.7;c.beginPath();c.ellipse(0,0,k*5.5,k*2.7,0,0,TAU);c.stroke();}for(let i=0;i<12;i++){const q=i/12*TAU;line(c,[[0,0],[Math.cos(q)*22,Math.sin(q)*11]],P(b,-.2,.4),.5);}c.restore();}
 ellipse(c,0,-1,5,2.4,P(b,.4,.8));
}
// Coconut octopus (Amphioctopus marginatus): a small brown octopus veined with dark branching lines, with pale suckers and
// white-edged arms, famous for carrying coconut-shell halves across the sea floor and hiding inside them.
function coconutOctopus(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=p.swim,K='#2a1a10';
 // The coconut half it carries, held against its arms.
 const shell=path(c,'M-40 34 Q-40 70 0 72 Q40 70 40 34 Q0 40 -40 34Z',grad(c,P,'#6a4426','#3a2414',34,72),P('#2a180c'),1);
 if(!low){c.save();c.clip(shell);for(let i=0;i<20;i++)line(c,[[-40+i*4.4,36],[-36+i*4,72]],P('#8a5a32',0,.4),.7);c.restore();}
 path(c,'M-40 34 Q0 40 40 34',null,P('#c8a878',0,.8),1.6);
 for(let i=0;i<8;i++){const x=-24+i*7,ph=sw+i*.7,ex=x+(i-3.5)*12+Math.sin(ph)*6,ey=i===0||i===7?18+Math.sin(ph)*8:54+Math.sin(ph)*6;
  const d=`M${x} 8 Q${x+(i-3.5)*4} ${ey*.6} ${ex} ${ey} q${(i-3.5)*2} 4 ${(i<4?-1:1)*6} -2`;path(c,d,null,P(a,i%2?-.12:.04),7.5-Math.abs(i-3.5)*.4);
  if(!low){path(c,d,null,P('#f0e6d4',0,.35),1);for(let k=1;k<5;k++)ellipse(c,x+(ex-x)*k/5,8+(ey-8)*k/5+2,1.1,.9,P(b,.1,.8));}}
 const mantle=path(c,'M-26 10 Q-34 -12 -20 -32 Q0 -48 20 -32 Q34 -12 26 10 Q0 18 -26 10Z',grad(c,P,a,b,-46,16),P(a,-.45),.9);
 if(!low){c.save();c.clip(mantle);for(let i=0;i<9;i++){const x=-24+i*6;path(c,`M${x} 14 Q${x+3} -6 ${x-2} -20 M${x-1} -2 l-4 -6 M${x+1} -10 l4 -5`,null,P(K,0,.55),1.1);}skin(c,mantle,P,a,r.seed,40);c.restore();}
 for(const x of [-12,12]){ellipse(c,x,-2,6,5,P(a,.08));eye(c,x,-3,P,3,{iris:'#d8c070',bar:true});}
}
// Flamboyant cuttlefish (Metasepia pfefferi): a small cuttlefish that walks on the sea floor on its arms and the flaps
// beneath its mantle, dark brown with flashing white and purple patches, a bright yellow rim to its fin, and pink tips
// to its arms.
function flamboyantCuttle(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=p.swim,PU='#a24ab8',PK='#f07ab0';
 for(const i of [0,7,1,6,2,5,3,4]){const y0=(i-3.5)*3,ph=sw*1.3+i*.8,ex=74-Math.abs(i-3.5)*3,ey=(i-3.5)*5+Math.sin(ph)*3+8;
  path(c,`M30 ${y0} Q54 ${y0+(ey-y0)*.4+Math.sin(ph)*2} ${ex} ${ey}`,null,P(a,i<2||i>5?-.2:.05),4.4-Math.abs(i-3.5)*.3);ellipse(c,ex,ey,2.2,1.8,P(PK,0,.95));}
 path(c,'M-46 14 Q-30 34 -10 30 L-4 16Z',P(a,-.2));path(c,'M-16 16 Q0 36 16 30 L18 14Z',P(a,-.1));
 const mantle=path(c,'M-60 0 Q-58 -24 -20 -26 Q14 -28 34 -14 Q40 -4 36 6 Q20 18 -20 18 Q-56 18 -60 0Z',grad(c,P,a,a,-28,20),P(a,-.45),.8);
 c.save();c.clip(mantle);
 for(const [x,y,w,col] of [[-36,-14,14,PU],[-8,-18,12,'#f2ece4'],[14,-12,10,PU],[-22,4,12,'#f2ece4'],[4,6,10,PU]])ellipse(c,x,y,w,w*.5,P(col,0,.75),.3);
 if(!low){for(let i=0;i<14;i++)ellipse(c,-54+i*6.5,-22+(i%3)*3,1.6,2.4,P(a,.25,.7));skin(c,mantle,P,a,r.seed,40);}c.restore();
 path(c,'M-60 0 Q-58 -24 -20 -26 Q14 -28 34 -14',null,P(b,0,.95),2.6);path(c,'M-60 2 Q-56 16 -20 18 Q20 18 36 6',null,P(b,0,.9),2.2);
 ellipse(c,28,-8,7,6,P(a,.05));eye(c,28,-9,P,3.4,{iris:'#e8d060',bar:true});
}
// Harlequin shrimp (Hymenocera picta): a cream shrimp with large pink-purple spots edged in blue, huge flattened claws like
// petals, and leaf-shaped feelers on its head. It eats starfish.
function harlequinShrimp(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,3),BL='#3a6ad0';
 for(let i=0;i<4;i++){const x=-44+i*14;path(c,`M${x} 10 q-3 12 2 ${20+Math.sin(p.swim+i)*3}`,null,P(a,-.1),2.4);}
 path(c,`M-70 ${2+sw} L-90 ${-10+sw} L-86 ${4+sw} L-92 ${18+sw}Z`,P(a,-.04,.95),P(a,-.3),.6);
 const body=path(c,'M-72 2 Q-70 -22 -30 -26 Q20 -30 44 -14 L50 2 Q20 16 -30 14 Q-64 14 -72 2Z',grad(c,P,a,a,-28,16),P(a,-.3),.8);
 c.save();c.clip(body);for(const [x,y,rr] of [[-56,-8,7],[-34,-14,9],[-12,-16,9],[10,-14,8],[30,-8,6],[-40,6,5],[-18,4,6],[4,4,5]]){ellipse(c,x,y,rr+1.4,rr*.8+1.2,P(BL,0,.85));ellipse(c,x,y,rr,rr*.8,P(b,0,.95));}
 if(!low)for(let i=0;i<6;i++)path(c,`M${-58+i*14} -26 q-4 18 0 38`,null,P(a,-.2,.4),.7);c.restore();
 // The big flat claws, spread like petals, and the leaf-shaped feelers.
 for(const [dy,far] of [[-8,true],[8,false]]){const o=Math.sin(p.swim*.8+(far?1:0))*4;
  path(c,`M40 ${dy} Q56 ${dy-20+o} 76 ${dy-26+o} Q92 ${dy-24+o} 92 ${dy-12+o} Q86 ${dy+2+o} 70 ${dy+4+o} Q54 ${dy+6} 40 ${dy+2}Z`,P(a,far?-.15:0,.95),P(a,-.35),.7);
  ellipse(c,74,dy-12+o,6,4,P(b,far?-.15:0,.9));ellipse(c,74,dy-12+o,7.4,5.2,null);}
 for(const dy of [-6,2])path(c,`M46 ${dy-10} Q56 ${dy-34} 70 ${dy-38} Q66 ${dy-24} 50 ${dy-12}Z`,P(a,-.05,.9),P(b,0,.7),.7);
 eye(c,44,-14,P,2.6,{iris:'#2a1a20'});
}
// Pygmy seahorse (Hippocampus bargibanti): smaller than a fingernail, living its whole life on one sea fan, whose colour
// it shares: pink to purple, its fleshy body covered in round red-pink bumps like the fan's polyps, with a short snout.
function pygmySeahorse(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary;
 {const pts=Array.from({length:30},(_,j)=>{const t=j/29;if(t<.3){const u=t/.3;return[2-4*u,30+30*u,9-u*1.6];}const u=(t-.3)/.7,q=Math.PI-u*TAU*1.35,R=14*(1-u*.75);return[12+Math.cos(q)*R,60+Math.sin(q)*R,7.4*(1-u)+1.6];}),T=spineOf(pts);
  const tail=path(c,T.outline(),grad(c,P,a,a,28,80),P(a,-.3),.8);if(!low)for(let j=2;j<28;j+=3){const [x,y]=T.at(j,0);ellipse(c,x,y,2.2,2,P(b,.05,.95));}}
 const body=path(c,'M-12 -44 Q-6 -56 6 -52 Q16 -48 18 -38 Q30 -34 36 -28 Q38 -22 32 -22 Q22 -24 16 -24 Q14 -16 20 -4 Q30 14 22 28 Q12 40 -2 40 Q-18 36 -22 16 Q-26 -6 -22 -26 Q-20 -40 -12 -44Z',grad(c,P,a,a,-56,40),P(a,-.3),1);
 for(const [x,y,rr] of [[-8,-50,3.4],[6,-50,3],[-18,-30,3.2],[-20,-6,3.6],[-18,18,3.4],[20,0,3.2],[18,18,3],[4,-10,2.6],[0,12,2.8],[-6,30,3],[12,32,2.6],[24,-30,2.4]]){ellipse(c,x,y,rr+.6,rr+.5,P(a,-.2,.8));ellipse(c,x,y,rr,rr*.95,P(b,.05,.95));ellipse(c,x-rr*.3,y-rr*.3,rr*.3,rr*.3,P('#ffffff',0,.35));}
 path(c,`M-20 -2 Q${-36-Math.sin(p.swim)*5} 8 -19 16Z`,P(a,.2,.5));
 eye(c,10,-38,P,2.8,{iris:'#2a1820'});
}
// Decorator crab (Camposcia retusa): a small spider crab that dresses itself, sticking bits of sponge, seaweed and
// coral onto the hooked bristles of its pear-shaped shell and its long spindly legs, so it disappears against the reef.
function decoratorCrab(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim)*3;
 const deco=(x,y,k)=>{if(k%3===0){for(let j=0;j<3;j++)path(c,`M${x} ${y} q${-3+j*3} -6 ${-2+j*2+sw*.3} -12`,null,P('#4fa86a',0,.95),2);}else if(k%3===1)ellipse(c,x,y,4.4,3.4,P('#e8823a',0,.95));else{ellipse(c,x,y,3.6,3.6,P('#c85aa0',0,.9));ellipse(c,x,y,1.4,1.4,P('#7a2a60'));}};
 for(const [s2,far] of [[-1,true],[1,false]])for(let i=0;i<4;i++){const bx=-14+i*10,kx=bx+s2*(26+i*4),ky=-10-i*2+(far?-4:0),fx=kx+s2*(14+i*2),fy=48+(far?-6:0)+(i%2?sw:-sw);
  path(c,`M${bx} 10 L${kx} ${ky} L${fx} ${fy}`,null,P(a,far?-.3:-.08),2.6);if(i%2===0)deco(kx,ky,i+(far?1:0));}
 const shell=path(c,'M-30 6 Q-34 -24 -10 -40 Q8 -48 22 -36 Q34 -20 30 6 Q0 18 -30 6Z',grad(c,P,a,b,-46,12),P(a,-.45),.9);
 if(!low)skin(c,shell,P,a,r.seed,30);
 for(const [x,y,k] of [[-18,-28,0],[-2,-38,1],[14,-30,2],[-22,-8,1],[0,-14,0],[20,-10,1],[-8,2,2],[12,2,0]])deco(x,y,k);
 for(const s2 of [-1,1])path(c,`M${10*s2} -40 L${12*s2} -50`,null,P(a,-.2),2);
 path(c,'M18 4 Q32 2 40 12 Q34 18 24 12Z',P(a,-.05),P(a,-.4),.6);
 eye(c,-6,-46,P,1.8,{iris:'#2a1a10'});eye(c,8,-46,P,1.8,{iris:'#2a1a10'});
}
// Tamatoa, the giant coconut crab of Disney's Moana (2016), who lives in the Realm of Monsters: a huge crab with long
// legs, a big claw, eyes on stalks, a long face, and his back shell encrusted all over with gold treasure he has collected.
function tamatoa(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=Math.sin(p.swim*.8)*3,G='#e8b838';
 for(const [s2,far] of [[-1,true],[1,false]])for(let i=0;i<4;i++){const bx=-30+i*16,kx=bx+s2*(36+i*6),ky=-6-i*3+(far?-6:0),fx=kx+s2*(22+i*3),fy=70+(far?-8:0)+(i%2?sw:-sw);
  path(c,`M${bx} 20 L${kx} ${ky} L${fx} ${fy}`,null,P(a,far?-.32:-.08),6);if(!low)for(const [x,y] of [[kx,ky],[(kx+fx)/2,(ky+fy)/2]])ellipse(c,x,y,2,2,P('#7ad8f0',0,.8));}
 // The shell he wears: a great dome of gold, coins and jewels.
 const dome=path(c,'M-70 6 Q-74 -60 -10 -76 Q50 -80 70 -36 Q78 -10 66 8 Q0 18 -70 6Z',grad(c,P,G,'#a07418',-80,12),P('#6a4a10'),1.2);
 if(!low){c.save();c.clip(dome);for(let i=0;i<46;i++){const x=-70+hash01(i,3)*140,y=-78+hash01(i,8)*86;ellipse(c,x,y,4.6,3.4,P(i%5===0?'#e84a6a':i%7===0?'#4ac8e8':i%2?'#f8d860':'#d8a030',0,.95),hash01(i,1)*3);ellipse(c,x-1,y-1,1.4,1,P('#ffffff',0,.6));}c.restore();}
 const body=path(c,'M-56 4 Q-60 30 -20 36 Q30 40 56 26 Q64 14 56 4 Q0 14 -56 4Z',grad(c,P,a,b,0,38),P(a,-.45),1);
 if(!low)for(let i=0;i<9;i++)ellipse(c,-46+i*11,20+(i%2)*4,2.2,1.6,P('#7ad8f0',0,.75));
 // His long face at the front, and the big claw.
 path(c,'M50 6 Q70 -6 90 2 Q100 12 92 26 Q80 36 60 30Z',grad(c,P,a,'#c84a8a',-6,34),P(a,-.45),1);
 path(c,`M64 30 Q90 ${44+sw} 112 ${36+sw} Q124 ${26+sw} 116 ${14+sw} Q108 ${22+sw} 96 ${24+sw} Q104 ${12+sw} 98 ${4+sw} Q84 ${18+sw} 72 22Z`,grad(c,P,a,b,4,46),P(a,-.45),1);
 for(const [x,h] of [[72,-24],[84,-28]]){line(c,[[x,0],[x+2,h]],P(a,-.1),3);eye(c,x+2,h-3,P,3.6,{iris:'#e8d040'});}
 path(c,'M80 22 Q90 24 96 18',null,P('#2a1430',0,.8),1.4);
}
// Two true seals on the harbour seal's swim. The grey seal (Halichoerus grypus) has a long, straight "Roman" nose with no
// dip at the forehead, nostrils set apart like a W, and dark blotches on a grey coat. The bearded seal (Erignathus
// barbatus) is big with a small head, plain grey-brown, often rusty on the face, with square front flippers and a thick
// moustache of long pale whiskers that curl at the tips.
function exactSeal(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,5),spread=Math.sin(p.swim)*3.5,far=farPalette(P),grey=r.species==='grey_seal';
 hindFlipper(c,P,a,low,-68,-5,spread,sw,far(a,-.05));hindFlipper(c,P,a,low,-68,2,-spread,sw,grad(c,P,a,a,-12,14));
 path(c,'M48 14 Q50 27 42 32 Q37 34 36 30 Q38 22 40 14Z',far(a,-.08));
 const body=path(c,grey?'M-84 5 C-62 -22 -20 -36 14 -35 C44 -34 62 -31 76 -26 C92 -21 104 -15 112 -8 C116 -4 116 2 110 6 C100 10 88 10 80 12 C60 23 20 30 -10 28 C-40 26 -64 16 -84 5Z'
  :'M-86 5 C-64 -30 -20 -42 20 -40 C50 -38 66 -30 76 -24 C86 -24 94 -20 98 -14 C102 -10 104 -6 104 -2 C104 4 100 7 94 8 C88 9 84 10 78 14 C58 28 20 34 -12 32 C-44 30 -68 18 -86 5Z',grad(c,P,a,b,-40,32),P(a,-.42),.7);
 c.save();c.clip(body);
 if(grey){for(let i=0;i<26;i++){const x=-76+hash01(i,3)*150,y=-32+hash01(i,6)*46;if(x>96)continue;ellipse(c,x,y,3+hash01(i,1)*6,2+hash01(i,2)*3,P(a,-.4,.5),hash01(i,4)*3);}}
 else{const m=c.createRadialGradient(96,-6,1,92,-6,16);m.addColorStop(0,P('#a8643a',0,.32));m.addColorStop(1,P('#a8643a',0));c.fillStyle=m;c.fillRect(74,-26,34,36);}
 if(!low)skin(c,body,P,a,r.seed,160);c.restore();
 if(grey){for(const dy of [-6,-2])ellipse(c,113,dy,1.8,1.3,P('#26353b'),.4);faceLine(c,P,'M113 3 Q108 6 102 5',P('#1d2a2e',0,.8),.9);eye(c,84,-17,P,3.8,{iris:'#2a1d14'});
  crisp(c,(c)=>{for(let i=0;i<6;i++)path(c,`M106 ${-1+i*.8} Q118 ${-6+i*4} 126 ${-8+i*5.5}`,null,P('#d7dedb',0,.8),.6);});}
 else{ellipse(c,102,-4,2.2,1.6,P('#26353b'));faceLine(c,P,'M102 4 Q98 7 92 6',P('#1d2a2e',0,.8),.9);eye(c,82,-14,P,3.6,{iris:'#2a1d14'});
  crisp(c,(c)=>{for(let i=0;i<16;i++){const q=-.35+i*.1,L=15+(i%4)*2.5,x0=97+(i%3),y0=-1+i*.45,x1=x0+Math.cos(q)*L,y1=y0+Math.sin(q)*L;path(c,`M${x0} ${y0} Q${x0+Math.cos(q-.25)*L*.6} ${y0+Math.sin(q-.25)*L*.6} ${x1} ${y1} q1.6 1.4 -.4 2.6`,null,P('#efe9dc',0,.85),.6);}});}
 // The near fore-flipper; the bearded seal's ends square, its middle claws as long as the rest.
 path(c,grey?'M63 14 Q64 26 55 32 Q49 36 47 32 Q49 24 50 16 Q56 12 63 14Z':'M64 16 Q66 28 60 36 L48 36 Q48 26 50 18 Q57 13 64 16Z',grad(c,P,a,a,8,36));
 if(!low)for(let i=0;i<5;i++)line(c,grey?[[48.6+i*1.5,32.6-i*.9],[47.6+i*1.5,35-i*.9]]:[[49+i*2.6,36],[49+i*2.6,38.6]],P('#1d2224',0,.8),.7);
}
// North American river otter (Lontra canadensis): long, slim and supple, belly-down as it swims, with a thick tail that
// tapers to a point and is nearly half its length, short legs with webbed feet, a broad flat head with small round ears,
// a pale throat, and dark brown fur that shines when wet.
function riverOtter(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,7),K='#1e1510',kick=Math.sin(p.swim)*6;
 const tl=path(c,`M-56 -14 Q-96 ${-12+sw*.6} -132 ${-3+sw} Q-140 ${1+sw} -132 ${3+sw} Q-96 ${12+sw*.6} -54 12Z`,grad(c,P,a,a,-14,14),P(a,-.45),.6);
 if(!low){c.save();c.clip(tl);path(c,`M-60 6 Q-96 ${8+sw*.6} -132 ${2+sw}`,null,P(a,-.25,.5),2);c.restore();}
 const foot=(x,o,far)=>{path(c,`M${x} 14 Q${x-10} ${24+o} ${x-24} ${27+o} L${x-30} ${23+o} L${x-28} ${29+o} L${x-32} ${33+o} Q${x-14} ${36+o} ${x+6} 22Z`,far?P(a,-.42):P(a,-.28),P(a,-.5),.6);};
 foot(-34,-kick,true);foot(56,kick,true);
 const body=path(c,'M-64 0 Q-56 -22 -10 -24 Q40 -26 70 -20 Q86 -26 102 -22 Q116 -16 118 -6 Q117 4 104 8 Q88 11 76 10 Q44 24 -10 22 Q-50 20 -64 6Z',grad(c,P,a,a,-26,24),P(a,-.45),.8);
 c.save();c.clip(body);path(c,'M60 6 Q84 16 120 4 L120 30 L60 30Z',P(b,.05,.85));path(c,'M-70 14 Q-10 26 60 14 L60 40 L-70 40Z',P(a,-.12,.4));
 if(!low){skin(c,body,P,a,r.seed,90);for(let i=0;i<120;i++){const x=-60+hash01(i,1)*170,y=-24+hash01(i,4)*44;line(c,[[x,y],[x-4,y+1.4]],P(a,i%2?.22:-.22,.32),.7);}}
 c.restore();
 foot(-20,kick,false);foot(70,-kick,false);
 ellipse(c,84,-22,3.6,2.8,P(a,-.22));ellipse(c,84,-21.5,1.8,1.3,P(a,-.45));
 path(c,'M114 -10 Q120 -9 120 -5 Q117 -2 112 -4Z',P(K));
 faceLine(c,P,'M113 -1 Q110 3 104 4',P(K,0,.72));
 if(!low)crisp(c,(c)=>{for(let i=0;i<5;i++)path(c,`M${108-i*.8} ${-3+i*1.2} Q${120} ${-4+i*3.6} ${132-i*2} ${-4+i*6}`,null,P('#f2ead8',0,.75),.55);});
 eye(c,100,-13,P,2.3,{iris:'#1c130d'});
}
// River dolphins. The Amazon river dolphin or boto (Inia geoffrensis) is a big, chunky dolphin that turns pink with age,
// with a long thin beak bristled with hairs, a round bulging melon, small eyes, a long low ridge instead of a tall back
// fin, and broad paddle flippers. The Ganges river dolphin (Platanista gangetica) is grey-brown, nearly blind, with eyes
// no bigger than pinholes, a very long thin beak with its teeth showing along it, a low triangular hump and broad flippers.
function riverDolphin(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=swing(p,6),am=r.species==='amazon_river_dolphin';
 path(c,`M-102 -2 Q-122 ${-14+sw} -140 ${-26+sw} Q-136 ${-6+sw} -126 ${sw} Q-136 ${6+sw} -140 ${26+sw} Q-122 ${14+sw} -102 4Z`,finFill(c,P,a,-104,0,-136,0),P(a,-.42),.7);
 path(c,'M40 14 Q30 40 10 46 Q4 42 10 34 Q20 22 24 14Z',farPalette(P)(a,-.06));
 path(c,am?'M-30 -26 Q-10 -34 14 -30 Q-6 -26 -30 -22Z':'M-14 -26 Q-6 -36 4 -38 Q6 -30 12 -28Z',P(a,-.08),P(a,-.42),.6);
 const body=path(c,am?'M-104 0 Q-70 -16 -20 -26 Q30 -34 64 -30 Q84 -42 98 -36 Q108 -30 106 -18 Q110 -12 120 -8 L150 -4 Q154 -1 150 2 L118 4 Q104 8 90 12 Q50 28 -20 22 Q-76 14 -104 6Z'
  :'M-104 0 Q-70 -14 -20 -22 Q30 -30 62 -24 Q80 -30 92 -24 Q100 -18 104 -10 L160 -6 Q166 -4 162 -1 L104 2 Q96 8 84 12 Q50 26 -20 22 Q-76 14 -104 6Z',grad(c,P,a,b,-40,24),P(a,-.42),.8);
 c.save();c.clip(body);path(c,'M-110 8 Q-20 22 60 18 Q100 14 170 0 L170 40 L-110 40Z',P(b,.05,.9));if(!low)skin(c,body,P,a,r.seed,90);c.restore();
 if(!am&&!low)for(let i=0;i<16;i++){const x=106+i*3.4;path(c,`M${x} ${-4.6+i*.1} l.6 -2.2 M${x+1.4} ${.6} l.6 2`,null,P('#f2ecd8',0,.9),.7);}
 if(am&&!low)for(let i=0;i<10;i++)line(c,[[114+i*3.4,-6.4+i*.15],[115+i*3.4,-9+i*.15]],P(a,-.3,.6),.5);
 faceLine(c,P,am?'M150 1 Q130 4 106 6':'M162 -2 Q130 0 100 4',P(a,-.55,.8),.9);
 path(c,am?'M44 16 Q38 44 18 54 Q10 52 14 42 Q22 28 26 16Z':'M44 16 Q36 42 14 50 Q6 48 10 38 Q20 26 26 16Z',grad(c,P,a,a,14,50),P(a,-.42),.6);
 if(am)eye(c,96,-10,P,1.6,{iris:'#2a1d14'});else line(c,[[92,-10],[94,-10]],P('#1c1410',0,.8),.8);
}
// Galápagos giant tortoise (Chelonoidis niger): the biggest tortoise, up to 1.5 m long, with a great domed shell of large
// plates, each ringed with growth lines, a long neck it stretches out, and stout, scaly, elephant-like legs.
function galapagosTortoise(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,step=Math.sin(p.swim)*4,K='#1e1c18';
 const leg=(x,o,far)=>{path(c,`M${x-9} 0 Q${x-12} 24 ${x-10+o} 34 L${x+10+o} 34 Q${x+12} 22 ${x+9} 0Z`,far?P(b,-.3):grad(c,P,b,b,0,34),P(b,-.45),.7);if(!low)for(let i=0;i<4;i++)ellipse(c,x-6+i*4+o,32,1.6,1.2,P('#d8d0c0',0,.8));};
 leg(-34,-step,true);leg(26,step,true);
 path(c,`M36 -6 Q54 -18 66 -26 Q74 -32 82 -30 Q92 -26 92 -18 Q90 -12 82 -12 Q70 -10 56 2 Q46 8 36 8Z`,grad(c,P,b,b,-32,8),P(b,-.45),.8);
 if(!low)for(let i=0;i<5;i++)path(c,`M${44+i*6} ${-4-i*4} q3 4 1 8`,null,P(b,-.35,.5),.7);
 const shell=path(c,'M-60 8 Q-64 -30 -30 -48 Q0 -60 30 -48 Q58 -32 54 8 Q0 18 -60 8Z',grad(c,P,a,a,-60,12),P(a,-.5),1);
 c.save();c.clip(shell);
 const plates=[[-38,-30],[-14,-42],[12,-40],[34,-26],[-44,-6],[-20,-18],[6,-20],[30,-6],[-24,2],[4,2]];
 for(const [x,y] of plates){for(let k=0;k<4;k++){c.strokeStyle=P(a,k?-.2+k*.08:-.5,k?.4:.7);c.lineWidth=k?.7:1.3;c.beginPath();c.ellipse(x,y,14-k*3.4,11-k*2.6,0,0,TAU);c.stroke();}}
 if(!low)skin(c,shell,P,a,r.seed,40);c.restore();
 path(c,'M-60 8 Q0 18 54 8',null,P(a,-.5),2);
 leg(-24,step,false);leg(36,-step,false);
 faceLine(c,P,'M92 -18 Q88 -16 84 -16',P(K,0,.8));
 eye(c,82,-24,P,2,{iris:'#2a2018'});
 helmet(c,80,-22,22,P);
}
// Grumpy Bear, one of the Care Bears: a blue teddy bear with a pale muzzle and tummy, round ears, a heart-shaped nose, a
// grumpy frown and, on his tummy, his symbol: a rain cloud with falling hearts.
function grumpyBear(c,r,p,P,low){
 beast(c,{...r,species:'grumpy_bear'},p,P,low);
 const k=BEAST.grumpy_bear,L=k.L,H=k.H*1.32,hd=k.head,hx=L*.95+hd*.35,hy=-H*.55;
 // His tummy badge.
 const bx=L*.15,by=H*.32;
 ellipse(c,bx,by,15,11,P('#e6eef8',0,.95));
 for(const [dx,dy,rr] of [[-6,-2,5],[0,-5,6],[6,-2,5],[0,1,5.5]])ellipse(c,bx+dx,by+dy,rr,rr*.8,P('#5a6a8a'));
 for(const [dx,dy] of [[-6,6],[0,8],[6,6]])path(c,`M${bx+dx} ${by+dy+3} l-2 -2 q-1 -2 1 -2 q1 0 1 1 q0 -1 1 -1 q2 0 1 2Z`,P('#5ab0e8'));
 // His heart-shaped nose.
 {const nx=hx+hd*.92,ny=hy+hd*.12;path(c,`M${nx} ${ny+3} L${nx-3.4} ${ny-.6} Q${nx-4} ${ny-3.6} ${nx-1.6} ${ny-3.4} Q${nx} ${ny-3.2} ${nx} ${ny-1.6} Q${nx} ${ny-3.2} ${nx+1.6} ${ny-3.4} Q${nx+4} ${ny-3.6} ${nx+3.4} ${ny-.6}Z`,P('#e86a9a'));}
 // The grumpy brow over his eye.
 path(c,`M${hx+hd*.15} ${hy-hd*.42} L${hx+hd*.62} ${hy-hd*.3}`,null,P('#24324e'),1.6);
}
// The Ghost Leviathan of Subnautica: a vast, see-through, eel-like leviathan that glows from within, with a broad head
// fringed by a ruff of thin fins, a trailing tail fin and long ribbon fins down its body, all in pale cyan light.
function ghostLeviathan(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,N=36,sw=p.swim*.8,pts=[];
 for(let i=0;i<=N;i++){const t=i/N,w=6+30*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.05)),.7)*(t>.9?1-(t-.9)*3:1);pts.push([-210+t*390,Math.sin(sw-i*.28)*14*(1-t*.7),w]);}
 const S=spineOf(pts),e=S.pt[N];
 // Ribbon fins in pairs down its body, drifting behind it.
 for(const i of [10,16,22]){for(const u of [-1,1]){const [x,y]=S.at(i,u*.9),fl=Math.sin(sw*1.2+i)*10;path(c,`M${x} ${y} Q${x-30} ${y+u*30+fl} ${x-74} ${y+u*24+fl*1.4} Q${x-40} ${y+u*14} ${x-10} ${y}Z`,P(b,0,.28),P(a,.2,.6),.8);}}
 path(c,`M${pts[0][0]+6} ${pts[0][1]} Q-240 ${-30+Math.sin(sw)*10} -262 ${-10+Math.sin(sw)*14} Q-244 ${Math.sin(sw)*8} -262 ${16+Math.sin(sw)*14} Q-238 ${30+Math.sin(sw)*10} ${pts[0][0]+6} ${pts[0][1]+4}Z`,P(b,0,.3),P(a,.2,.65),.8);
 const body=path(c,S.outline(),P(a,0,.32),P(b,.1,.75),1.2);
 c.save();c.clip(body);path(c,S.ribbon(-.25,.25),P(b,.2,.55));for(let i=3;i<N;i+=2){const [x0,y0]=S.at(i,-.8),[x1,y1]=S.at(i,.8);line(c,[[x0,y0],[x1,y1]],P(b,0,.35),1);}c.restore();
 c.save();c.translate(e.x,e.y);c.rotate(e.th);
 for(let i=0;i<9;i++){const q=-1.3+i*.32,fl=Math.sin(sw*1.5+i)*4;path(c,`M6 ${Math.sin(q)*14} Q${-14+fl} ${Math.sin(q)*44} ${-30+fl} ${Math.sin(q)*58}`,null,P(b,0,.6),2.2);}
 const head=path(c,'M-4 -26 Q30 -34 58 -16 Q70 -6 70 2 Q68 12 56 18 Q30 30 -4 24Z',P(a,.1,.4),P(b,.15,.85),1.2);
 c.save();c.clip(head);ellipse(c,24,0,20,12,P(b,.2,.55));c.restore();
 path(c,'M66 4 Q50 12 30 10',null,P(b,.2,.8),1);
 eye(c,46,-8,P,3,{iris:'#9ff0ff'});
 c.restore();
 followSnake(p,390,14,.28,N);
}
// Gummy shark (Mustelus antarcticus): a slender houndshark of southern Australia, grey-bronze above with small white spots,
// pale below, with flat pavement teeth for crushing crabs. Drawn on the brown smoothhound's body, its close relative.
function gummyShark(c,r,p,P,low){
 shark(c,{...r,species:'brown_smoothhound_shark'},p,P,low);
 if(low)return;
 const body=path(c,'M-88 0 Q-23 -38 51 -22 Q86 -14 104 -2 Q82 14 48 24 Q-20 27 -88 5Z');
 scatterEven(c,body,12,3,-80,90,-24,6,(x,y)=>ellipse(c,x,y,1.3,1.1,P('#f4f1e8',0,.85)),4);
}
// Ornate eagle ray (Aetomylaeus vespertilio): drawn like the spotted eagle ray from above, but olive-brown with a net of fine
// dark lines and pale rings over the back, and a very long tail.
function ornateEagleRay(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,f=Math.sin(p.swim)*14;
 eagleRay(c,{...r,colors:{primary:a,secondary:a}},p,P,low);
 if(low)return;
 const body=path(c,`M48 -15 Q32 ${-52-f*.4} -6 ${-120-f} Q-8 ${-66-f*.5} -42 -13 Q-48 0 -42 13 Q-8 ${66+f*.5} -6 ${120+f} Q32 ${52+f*.4} 48 15Z`);
 c.save();c.clip(body);
 for(let i=0;i<12;i++){const y=-110+i*20;path(c,`M-46 ${y} Q-10 ${y+8} 48 ${y*.3}`,null,P('#2a2216',0,.5),1);}
 for(let i=0;i<10;i++){const x=-40+i*9;path(c,`M${x} -120 Q${x+6} 0 ${x} 120`,null,P('#2a2216',0,.4),.9);}
 scatterEven(c,body,4,8,-40,44,-110,110,(x,y)=>{c.strokeStyle=P(b,.3,.7);c.lineWidth=1.1;c.beginPath();c.ellipse(x,y,3,2.4,0,0,TAU);c.stroke();},6);
 c.restore();
}
// Green-and-black poison dart frog (Dendrobates auratus): a small rainforest frog, bright mint green splashed with black,
// its colours warning that its skin is poisonous.
function poisonDartFrog(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,k=Math.sin(p.swim*1.3)*6,K='#141a16';
 const leg=(x,y,o,far)=>{path(c,`M${x} ${y} Q${x-18} ${y-8+o} ${x-30} ${y+8+o} Q${x-16} ${y+14+o} ${x-6} ${y+10}`,null,far?P(a,-.35):P(a,-.05),far?6:7);for(let i=0;i<3;i++)ellipse(c,x-30+i*3,y+10+o+i*2,2,1.6,P(a,far?-.35:0));};
 leg(-22,6,-k,true);
 path(c,`M14 12 Q10 26 2 30 L8 31 Q16 28 20 14Z`,P(a,-.35));
 const body=path(c,'M-30 6 Q-30 -16 -4 -20 Q22 -24 34 -10 Q42 -2 38 8 Q30 18 4 18 Q-24 18 -30 6Z',grad(c,P,a,a,-24,18),P(K,0,.6),.8);
 c.save();c.clip(body);for(const [x,y,w,h,q] of [[-18,-8,10,6,.3],[2,-14,12,5,-.2],[14,2,9,6,.5],[-8,8,12,5,0],[26,-8,6,4,.2],[-24,10,6,4,.4]])ellipse(c,x,y,w,h,P(K,0,.9),q);if(!low)skin(c,body,P,a,r.seed,30);c.restore();
 leg(-18,10,k,false);
 path(c,`M20 12 Q18 28 10 32 L16 33 Q24 30 26 14Z`,P(a,-.05),P(K,0,.5),.6);
 faceLine(c,P,'M38 6 Q30 10 22 8',P(K,0,.8),1);
 eye(c,26,-12,P,3.4,{iris:'#141414'});
 helmet(c,20,-4,30,P);
}
// Goonch catfish (Bagarius yarrelli): a giant catfish of Himalayan rivers, sandy brown mottled with dark saddles, a flat head
// with small eyes, sharp teeth and whiskers, and fins drawn out into long threads. Drawn on the wels catfish's body.
function goonchCatfish(c,r,p,P,low){
 welsCatfish(c,r,p,P,low);
 if(low)return;
 const body=path(c,'M-108 0 Q-70 -16 0 -22 Q50 -26 84 -22 Q108 -16 116 -4 Q118 6 108 12 Q84 20 40 22 Q-30 22 -108 6Z');
 c.save();c.clip(body);for(const x of [-80,-40,0,40,76])path(c,`M${x-8} -26 Q${x} -8 ${x+8} -26Z`,P('#2a2016',0,.55));c.restore();
 path(c,'M28 -24 Q20 -44 4 -50',null,P(r.colors.primary,-.2,.8),1);
}
// Brown long-eared bat (Plecotus auritus) is drawn on the fruit bat's body (avian, with longEars). Clown knifefish (Chitala
// ornata): a humpbacked, silvery-grey fish shaped like a knife blade, with a tiny back fin, one long fin all along its belly
// running into the tail, and a row of black eyespots ringed in white above that fin.
function clownKnifefish(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,w=Math.sin(p.swim*1.4)*4,K='#14161a';
 let fin='M50 16';for(let i=0;i<=10;i++){const x=50-i*16,y=18+(i/10)*6+Math.sin(p.swim*1.4-i*.7)*4;fin+=` L${x} ${y+10}`;}fin+=' L-110 4 Z';
 path(c,fin,P(a,-.06,.85),P(a,-.4),.6);
 const body=path(c,'M-112 2 Q-60 -20 0 -34 Q36 -40 60 -26 Q78 -16 80 -4 Q78 8 62 14 Q20 24 -40 18 Q-90 12 -112 6Z',grad(c,P,a,b,-40,24),P(a,-.42),.8);
 c.save();c.clip(body);if(!low)fishScales(c,body,P,a);
 for(let i=0;i<6;i++){const x=-90+i*16,y=10-i*.6;ellipse(c,x,y,5.4,4.4,P('#f6f4ee',0,.85));ellipse(c,x,y,3.8,3,P(K,0,.9));}
 if(!low)skin(c,body,P,a,r.seed,40);c.restore();
 path(c,'M-10 -32 Q-14 -42 -22 -42 Q-20 -36 -24 -30Z',P(a,-.1));
 path(c,`M44 6 Q36 ${18+w} 26 20 Q32 12 34 6Z`,P(a,-.12));
 faceLine(c,P,'M80 0 Q72 4 64 4',P(K,0,.8));
 eye(c,64,-10,P,2.6,{iris:'#c8b060'});
}
// Giant trevally (Caranx ignobilis), the ulua of Hawaii: a big, deep, powerful jack with a steep blunt forehead, silver-grey
// to dark, a sickle of a tail, and a row of hard keeled scales (scutes) along the narrow tail stock.
function giantTrevally(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,6),K='#141a1c';
 path(c,`M-62 -3 Q-84 ${-30+s} -100 ${-44+s} Q-90 ${-14+s} -84 ${s} Q-90 ${14+s} -100 ${44+s} Q-84 ${30+s} -62 3Z`,finFill(c,P,a,-64,0,-98,0),P(a,-.4),.6);
 path(c,`M10 -38 Q-20 ${-50+s*.3} -52 -12 L-46 -8 Q-16 -36 8 -34Z`,P(a,-.1));path(c,`M4 34 Q-22 ${46+s*.3} -50 12 L-44 8 Q-16 32 4 30Z`,P(a,-.1));
 const body=path(c,'M-66 0 Q-40 -30 0 -40 Q30 -50 50 -40 Q66 -24 70 -6 Q72 4 66 12 Q50 34 0 38 Q-40 32 -66 4Z',grad(c,P,a,b,-48,38),P(a,-.42),.8);
 c.save();c.clip(body);if(!low){fishScales(c,body,P,a);skin(c,body,P,a,r.seed,40);}c.restore();
 for(let i=0;i<8;i++)path(c,`M${-62+i*5} -1 l2.5 -2 l2.5 2 l-2.5 2Z`,P(a,.25,.9),P(a,-.4,.6),.4);
 path(c,`M30 2 Q16 ${16+s*.3} 2 14 Q14 6 18 2Z`,P(b,-.1,.9));
 faceLine(c,P,'M70 2 Q62 8 52 8',P(K,0,.8),1.1);
 eye(c,54,-12,P,3.2,{iris:'#c8c0a0'});
}
// Arapaima (Arapaima gigas), the pirarucu of the Amazon: one of the biggest freshwater fish, long and torpedo-shaped with a
// flat bony head, olive-grey at the front turning red towards the tail, and its back and belly fins set far back by the
// rounded tail. It comes up to gulp air.
function arapaima(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,s=swing(p,6),RED='#c0402e';
 path(c,`M-104 -6 Q-128 ${-18+s} -136 ${s} Q-128 ${18+s} -104 6Z`,P(RED,-.1,.95),P(a,-.4),.6);
 path(c,`M-50 -16 Q-80 ${-26+s*.4} -104 -8 L-98 -2 Q-74 -14 -52 -12Z`,P(RED,-.15,.9));path(c,`M-50 16 Q-80 ${26+s*.4} -104 8 L-98 2 Q-74 14 -52 12Z`,P(RED,-.15,.9));
 const body=path(c,'M-106 0 Q-70 -18 0 -22 Q60 -24 96 -14 Q112 -8 114 0 Q112 8 96 12 Q60 22 0 22 Q-70 18 -106 4Z',grad(c,P,a,b,-24,22),P(a,-.42),.8);
 c.save();c.clip(body);
 const g=c.createLinearGradient(0,0,-110,0);g.addColorStop(0,P(RED,0,0));g.addColorStop(1,P(RED,0,.75));c.fillStyle=g;c.fillRect(-110,-24,110,48);
 if(!low)for(let row=0;row<4;row++)for(let col=0;col<12;col++){const x=-100+col*14+(row%2)*7,y=-16+row*9;path(c,`M${x} ${y-5} q8 5 0 10`,null,P(col<6?RED:b,col<6?.2:.1,.6),1.1);}
 if(!low)skin(c,body,P,a,r.seed,50);c.restore();
 path(c,'M66 -14 Q80 -16 92 -12',null,P(a,-.4,.6),.8);
 path(c,`M60 8 Q50 ${20+s*.3} 38 20 Q48 12 50 8Z`,P(a,-.12));
 faceLine(c,P,'M114 2 Q104 4 96 2',P('#1a1c18',0,.8),1);
 eye(c,96,-6,P,2.2,{iris:'#c8b060'});
}
// Chromodoris willani: a sea slug of the western Pacific, pale blue-white with fine black lines down its back, and white
// gills and horn-like rhinophores. Drawn on the nudibranch's crawling body.
function chromodorisWillani(c,r,p,P,low){
 const a=r.colors.primary,b=r.colors.secondary,sw=p.swim,K='#16181c';
 path(c,'M-74 13 Q-20 30 54 20 Q72 16 76 8 Q72 28 40 30 Q-30 34 -74 13Z',P(a,-.08,.85));
 const body=path(c,'M-76 13 Q-60 0 -20 -3 Q30 -5 60 2 Q78 8 76 16 Q40 30 -30 24 Q-62 22 -76 13Z',grad(c,P,a,a,-4,28),P(a,-.45),.7);
 c.save();c.clip(body);for(const y of [3,9,15])path(c,`M-70 ${y+6} Q0 ${y-4} 72 ${y+2}`,null,P(K,0,.85),1.1);path(c,'M-76 13 Q-60 0 -20 -3 Q30 -5 60 2 Q78 8 76 16',null,P(b,.2,.9),2.6);if(!low)skin(c,body,P,a,r.seed,20);c.restore();
 for(let i=0;i<7;i++){const q=-1.1+i*.36,x=-54+Math.cos(q)*4,h=14+Math.abs(i-3)*-1.5,f=Math.sin(sw+i)*2;path(c,`M${x} 2 Q${x-6+f} ${-h*.6} ${x-10+f+i*1.6} ${-h}`,null,P(b,.15,.95),2.4);}
 for(const dx of [0,8]){path(c,`M${60+dx} 6 Q${58+dx} -6 ${63+dx} -18`,null,P(b,.15),3.2);if(!low)for(let j=0;j<4;j++)line(c,[[60+dx,-8-j*2.6],[66+dx,-9-j*2.6]],P(b,-.2,.6),.6);}
}
const EXACT_DRAW={sand_tiger_shark:sandTiger,sandbar_shark:reefRequiem,whitetip_reef_shark:reefRequiem,jeff_the_land_shark:jeffLandShark,cownose_ray:cownoseRay,torpedo_ray:torpedoRay,ribbontail_ray:ribbontailRay,
 emperor_angelfish:emperorAngelfish,copperband_butterflyfish:copperband,parrotfish,american_flagfish:flagfish,wels_catfish:welsCatfish,dogface_puffer:smallPuffer,pea_puffer:smallPuffer,yellow_boxfish:yellowBoxfish,
 crystal_jelly:exactJelly,blue_blubber_jellyfish:exactJelly,sea_nettle:exactJelly,blue_button:blueButton,coconut_octopus:coconutOctopus,flamboyant_cuttlefish:flamboyantCuttle,
 harlequin_shrimp:harlequinShrimp,pygmy_seahorse:pygmySeahorse,decorator_crab:decoratorCrab,tamatoa,
 bearded_seal:exactSeal,grey_seal:exactSeal,river_otter:riverOtter,amazon_river_dolphin:riverDolphin,ganges_river_dolphin:riverDolphin,galapagos_tortoise:galapagosTortoise,
 grumpy_bear:grumpyBear,ghost_leviathan:ghostLeviathan,
 gummy_shark:gummyShark,ornate_eagle_ray:ornateEagleRay,poison_dart_frog:poisonDartFrog,goonch_catfish:goonchCatfish,clown_knifefish:clownKnifefish,giant_trevally:giantTrevally,
 arapaima,chromodoris_willani:chromodorisWillani,pelagic_puffer:smallPuffer};
