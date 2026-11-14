// The environment pass: water, light rays, far dunes and the sand floor.
// A real pinhole camera, so the floor here lines up exactly with creatures projected in scene.js.
import { ZONE_LOOKS } from './zone-look.js';

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;      // canvas size in px
uniform float uT;       // seconds
uniform vec3 uCam;      // camera X, height above sand, Z
uniform float uF;       // focal length in px
uniform float uHor;     // horizon in px from the top
uniform vec3 uSand, uHaze, uDeep, uBright;   // the zone's floor and water colours
uniform float uRay, uCaus, uFloor, uRough, uLine;   // light shafts, rippling light, floor on/off, rocky floor, waterline overhead
out vec4 outC;


float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vn(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return s; }

// Tileable caustic pattern, after the well known iterative water-turbulence form.
float caustic(vec2 uv, float t){
  const float TAU=6.28318;
  vec2 p=mod(uv*TAU,TAU)-250.; vec2 i=p; float c=1.; const float inten=.005;
  for(int n=0;n<4;n++){
    float tt=t*(1.-(3.5/float(n+1)));
    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
    c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));
  }
  c/=4.; c=1.17-pow(c,1.4);
  return pow(abs(c),8.);
}

float sandHeight(vec2 p, float fade){
  float dune=fbm(p*.0026)*26.+fbm(p*.03)*16.*uRough;
  vec2 w=p+vec2(fbm(p*.006)*90., fbm(p*.006+7.)*90.);
  float ripple=sin((w.x*.22+w.y*.62)*.42)*.75+sin((w.x*.31-w.y*.2+w.y)*.61)*.28;
  float grain=(vn(p*.9)-.5)*.22;
  return dune+(ripple*(1.-uRough)+grain)*fade;
}

float rays(vec2 uv, float t, float camX){
  // A fan of soft shafts from a sun above the frame.
  vec2 s=vec2(.5,-.55);
  vec2 d=uv-s; float a=atan(d.x,d.y);
  float o=camX*.00016;
  float r=0.;
  r+=vn(vec2((a+o)*11.+t*.035,t*.03))*.60;
  r+=vn(vec2((a+o)*27.-t*.05,t*.05+4.))*.40;
  r+=vn(vec2((a+o)*63.+t*.08,t*.07+9.))*.16;
  r=smoothstep(.42,.98,r);
  return r;
}

void main(){
  vec2 frag=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  vec2 uv=frag/uRes;
  float aspect=uRes.x/uRes.y;
  vec2 ruv=vec2((uv.x-.5)*min(aspect/.5625,1.6)+.5,uv.y);
  float elev=(uHor-frag.y)/uF;            // >0 looks up, <0 looks at the floor

  // Water column
  float up=uFloor>.5?clamp(elev*1.25,0.,1.):1.;
  vec3 water=mix(uHaze,uDeep,smoothstep(.02,.40,up));
  float sunGlow=exp(-pow(length(vec2((uv.x-.5)*1.15*min(aspect/.5625,1.6),uv.y+.14)),2.)*3.6);
  water=mix(water,uBright,sunGlow*.92);
  water+=vec3(.75,.95,.92)*pow(sunGlow,4.)*.16*uRay;

  float ray=rays(ruv,uT,uCam.x);
  // Shafts weaken with depth and are gone before they reach the far dunes.
  float rayFade=(1.-smoothstep(.0,uFloor>.5?uHor/uRes.y*.98:1.1,uv.y));
  rayFade=rayFade*rayFade*.72+.012;
  vec3 col=water+vec3(.46,.80,.76)*ray*rayFade*.46*uRay;
  if(uFloor<.5) col*=mix(1.,.14,smoothstep(.22,1.,uv.y));

  // Far dunes, dissolving into haze
  float ax=(frag.x-uRes.x*.5)/uF;
  if(uFloor>.5) for(int i=0;i<3;i++){
    float fi=float(i);
    float par=.00055-fi*.00016;
    float n=fbm(vec2((ax*(1.+fi*.45))*1.4+uCam.x*par+fi*11.,fi*3.1));
    float top=.012+.085*(1.-fi*.26)*n*n*2.1;
    float ridge=smoothstep(top+.0035,top-.0035,elev);
    vec3 rc=mix(uHaze*1.02,uHaze*1.1,.20+fi*.22);
    col=mix(col,rc,ridge*(.44+fi*.2));
  }
  // Water and floor dissolve into one haze colour, so there is never a hard horizon.
  vec3 hazeC=uHaze*1.04;
  if(uFloor>.5) col=mix(col,hazeC,smoothstep(.075,.0,elev));

  // Sand floor (floor-casting from the pinhole camera)
  if(uFloor>.5&&frag.y>uHor){
    float dz=uF*uCam.y/(frag.y-uHor);
    vec2 w=vec2(uCam.x+(frag.x-uRes.x*.5)*dz/uF,uCam.z+dz);
    float fade=(1.-smoothstep(260.,1000.,dz))*smoothstep(60.,240.,dz);
    float e=max(.7,dz*.003);
    float h0=sandHeight(w,fade);
    float hx=sandHeight(w+vec2(e,0.),fade);
    float hz=sandHeight(w+vec2(0.,e),fade);
    vec3 n=normalize(vec3(h0-hx,e,h0-hz));
    vec3 L=normalize(vec3(-.25,.92,.30));
    float diff=clamp(dot(n,L),0.,1.);
    vec3 s=uSand*mix(.48,1.10,pow(diff,1.9));
    s*=1.-uRough*.28*smoothstep(.35,.7,fbm(w*.018+5.));
    float speck=vn(w*2.3);
    s*=1.-.05*fade*smoothstep(.65,.95,speck);
    s=mix(s,s*vec3(.93,.90,.82),fbm(w*.011+3.)*.55);
    // Water absorbs red first; distant sand goes blue-green.
    s*=vec3(.84,.97,.98);

    float cFade=exp(-dz*.00085);
    float c1=caustic(w*.0042,uT*.32);
    float c2=caustic(w*.0098+.3,uT*.42+3.);
    vec3 caus=vec3(.88,1.,.93)*(c1*.85+c2*.35)*cFade;
    s+=caus*.80*(.45+.55*diff)*uCaus;
    // Broad drifting pools of light rather than shaft columns.
    float pool=fbm(w*.0021+vec2(uT*.012,-uT*.008));
    s*=.86+.42*smoothstep(.28,.72,pool);

    float fog=max(1.-exp(-pow(dz*.00112,1.28)),smoothstep(1000.,2500.,dz));
    col=mix(s,hazeC,fog);
  }

  // The water's surface overhead, in the shallows only.
  if(uLine>.01){
    float band=smoothstep(.17,.0,uv.y)*uLine;
    float a=uv.x*17.+uT*.45+sin(uv.x*7.+uT*.3)*1.7+sin(uv.y*38.+uT*.2)*1.1, ripple=pow(abs(sin(a)),30.);
    col=mix(col,vec3(.93,1.,.98),band*.5);
    col+=vec3(.9,1.,.96)*ripple*band*.12;
  }

  // Grade: gentle vignette, then deterministic dither to fight banding in H.264.
  float vig=length((uv-vec2(.5,.47))*vec2(.92,1.05));
  col*=1.-smoothstep(.40,.95,vig)*.36;
  col=pow(max(col,0.),vec3(.96));
  float d=h21(frag*.733+fract(uT*.73)*91.)-.5;
  col+=d*(2.2/255.);
  outC=vec4(col,1.);
}`;

// How the water's graphics context is made. The live page makes it before the renderer has loaded, to see that the phone can draw the
// ocean at all, and hands it on (site2/js/ocean-page.js keeps a copy of these settings; test/site2.test.mjs checks they agree).
export const WATER_GL = { preserveDrawingBuffer: true, antialias: false, alpha: false, powerPreference: 'high-performance' };

export class Water {
  // canvas: one that already holds the water's context (WATER_GL), or none for one made here.
  constructor(canvas = document.createElement('canvas')) {
    this.canvas = canvas;
    const gl = this.canvas.getContext('webgl2', WATER_GL);
    if (!gl) throw new Error('This browser has no WebGL2, which the ocean needs to draw water and light.');
    this.gl = gl;
    // Phones take the graphics context away under memory pressure or when the app is backgrounded. Without
    // preventDefault it never comes back and the water stays blank for the rest of the visit.
    this.canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
    this.canvas.addEventListener('webglcontextrestored', () => this._setup());
    this._setup();
  }
  _setup() {
    const { gl } = this;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    for (const n of ['uRes', 'uT', 'uCam', 'uF', 'uHor', 'uSand', 'uHaze', 'uDeep', 'uBright', 'uRay', 'uCaus', 'uFloor', 'uRough', 'uLine']) this.u[n] = gl.getUniformLocation(prog, n);
  }
  render(w, h, t, cam, f, hor, look = ZONE_LOOKS.open) {
    const { gl, u, canvas } = this;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uT, t);
    // The sand pattern repeats far apart, which keeps shader numbers precise anywhere in a very wide world.
    gl.uniform3f(u.uCam, cam.x % 40960, cam.h, cam.z);
    gl.uniform1f(u.uF, f);
    gl.uniform1f(u.uHor, hor);
    gl.uniform3fv(u.uSand, look.water.floorColor); gl.uniform3fv(u.uHaze, look.water.haze); gl.uniform3fv(u.uDeep, look.water.deep); gl.uniform3fv(u.uBright, look.water.bright);
    gl.uniform1f(u.uRay, look.ray); gl.uniform1f(u.uCaus, look.caustic); gl.uniform1f(u.uFloor, look.floorOn); gl.uniform1f(u.uRough, look.rough); gl.uniform1f(u.uLine, look.waterline);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return canvas;
  }
}
