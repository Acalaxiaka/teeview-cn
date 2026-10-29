// TEEView-CN v1.0.2 — 探头成像平面真实横切 + 超声扇区渲染
// 坐标系（患者仰卧）：+X 左，+Y 头，+Z 前
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const DEG=Math.PI/180;

const S={depth:45,flex:0,turn:0,omni:0,labels:true,half:true,probe:true,mitral:true,planeVis:true,
 path:'none',mode:'learn',snap:null,camDist:14,camAz:0.95,camEl:0.32};

function depthLabel(d){return d<22?'上段食管 UE':d<70?'中段食管 ME':'经胃 TG';}
function depthY(d){return 4.2-d*0.048;}

const PRESETS=[
 {id:'ME4C',name:'ME 四腔',en:'ME 4-Chamber',depth:48,flex:8,turn:0,omni:0,segs:['A2','P2'],
  tip:'中段食管 0°：LA/LV/RA/RV 同屏。评估二尖瓣对合、室间隔、三尖瓣。',intra:'体外循环前基线；成形后对合评估。'},
 {id:'ME2C',name:'ME 两腔',en:'ME 2-Chamber',depth:48,flex:5,turn:0,omni:90,segs:['A1','A2','A3','P1','P2','P3'],
  tip:'约 90°：仅 LA/LV，前后壁与 A1–P3 节段。',intra:'明确二尖瓣病变节段。'},
 {id:'MELAX',name:'ME 左心长轴',en:'ME LAX',depth:48,flex:5,turn:5,omni:120,segs:['A2','P2'],
  tip:'约 120°：LVOT、AV、升主近段、二尖瓣。',intra:'SAM / LVOT / AV 启闭。'},
 {id:'MEMC',name:'ME 二尖瓣交界',en:'ME Mitral Commissural',depth:48,flex:5,turn:0,omni:60,segs:['P1','A2','P3'],
  tip:'约 60°：P1–A2–P3「笑脸」。',intra:'交界区反流定位。'},
 {id:'MEAVSAX',name:'ME 主动脉短轴',en:'ME AV SAX',depth:40,flex:-8,turn:0,omni:40,segs:[],
  tip:'约 30–45°：三个主动脉窦短轴。',intra:'AVR 前瓣叶与冠脉开口。'},
 {id:'MEAVLAX',name:'ME 主动脉长轴',en:'ME AV LAX',depth:42,flex:0,turn:5,omni:135,segs:['A2','P2'],
  tip:'约 120–135°：AV 长轴与 LVOT。',intra:'环径与升主测量。'},
 {id:'MERVIO',name:'ME RV 流入流出',en:'ME RV In-Out',depth:45,flex:0,turn:-12,omni:60,segs:[],
  tip:'约 60°：TV、RVOT 区域。',intra:'三尖瓣成形。'},
 {id:'MEBIC',name:'ME 双腔静脉',en:'ME Bicaval',depth:52,flex:12,turn:25,omni:100,segs:[],
  tip:'约 90–110°：SVC/IVC、IAS。',intra:'房缺与腔静脉插管。'},
 {id:'MELAA',name:'ME 左心耳',en:'ME LAA',depth:38,flex:12,turn:-45,omni:70,segs:[],
  tip:'多平面扫 LAA 排除血栓。',intra:'转流前排除 LAA 血栓。'},
 {id:'MEASC',name:'ME 升主短轴',en:'ME Asc Ao SAX',depth:36,flex:-12,turn:0,omni:0,segs:[],
  tip:'升主动脉短轴。',intra:'插管前斑块/夹层。'},
 {id:'MEASCL',name:'ME 升主长轴',en:'ME Asc Ao LAX',depth:36,flex:-8,turn:5,omni:100,segs:[],
  tip:'升主动脉长轴。',intra:'夹层累及范围。'},
 {id:'TGSAX',name:'TG 中段短轴',en:'TG Mid SAX',depth:84,flex:55,turn:0,omni:0,segs:[],
  tip:'经胃前屈：LV 乳头肌短轴。',intra:'室壁运动金标准。'},
 {id:'TGBASE',name:'TG 基底短轴',en:'TG Basal SAX',depth:78,flex:48,turn:0,omni:0,segs:['A1','A2','A3','P1','P2','P3'],
  tip:'二尖瓣水平短轴。',intra:'瓣叶启闭对称性。'},
 {id:'TG2C',name:'TG 两腔',en:'TG 2-Chamber',depth:84,flex:45,turn:0,omni:90,segs:['A1','A2','A3','P3','P2','P1'],
  tip:'经胃 90°：下壁与前壁。',intra:'下壁缺血。'},
 {id:'TGLAX',name:'TG 长轴',en:'TG LAX',depth:84,flex:45,turn:10,omni:120,segs:['A2','P2'],
  tip:'经胃长轴 LVOT/AV。',intra:'跨瓣压差。'},
 {id:'DTG5C',name:'深TG 五腔',en:'Deep TG 5C',depth:95,flex:62,turn:0,omni:0,segs:[],
  tip:'深经胃平行 LVOT。',intra:'AS 连续多普勒。'},
 {id:'UEARCH',name:'UE 主动脉弓长轴',en:'UE Aortic Arch LAX',depth:12,flex:0,turn:-30,omni:0,segs:[],
  tip:'上段食管主动脉弓长轴。',intra:'弓部分支斑块。'},
 {id:'UEARCHS',name:'UE 主动脉弓短轴',en:'UE Aortic Arch SAX',depth:12,flex:0,turn:-20,omni:90,segs:[],
  tip:'弓短轴，常可及肺动脉。',intra:'漂浮导管位置。'},
 {id:'MEDTG',name:'ME 五腔偏转',en:'ME 5-Chamber',depth:45,flex:18,turn:0,omni:0,segs:['A2','P2'],
  tip:'ME 四腔轻度前屈显 LVOT。',intra:'快速扫 LVOT。'},
 {id:'METV',name:'ME 聚焦三尖瓣',en:'ME TV focused',depth:52,flex:5,turn:18,omni:0,segs:[],
  tip:'右转聚焦三尖瓣。',intra:'反流与成形决策。'},
];

// ---------- 3D 场景 ----------
function makeRen(wrap,clear){
  let r=null;
  for(const o of [{antialias:true,powerPreference:'high-performance'},{antialias:false},{antialias:false,failIfMajorPerformanceCaveat:false}]){
    try{r=new THREE.WebGLRenderer(Object.assign({alpha:false},o)); if(r.getContext())break;}catch(e){r=null;}
  }
  if(!r){const d=document.createElement('div');d.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;text-align:center;padding:12px';d.textContent='WebGL 不可用';wrap.appendChild(d);
    return {domElement:document.createElement('canvas'),setPixelRatio(){},setClearColor(){},setSize(){},render(){},getContext:()=>null};}
  r.setPixelRatio(Math.min(devicePixelRatio||1,2)); r.setClearColor(clear,1); wrap.appendChild(r.domElement); return r;
}
const wrap3=document.getElementById('v3d'), wrapX=document.getElementById('vx');
const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x0c1018,0.032);
const cam=new THREE.PerspectiveCamera(42,1,0.1,80);
const ren=makeRen(wrap3,0x0c1018);
scene.add(new THREE.HemisphereLight(0x9bb8d0,0x1a1010,0.9));
const key=new THREE.DirectionalLight(0xfff0e0,0.75); key.position.set(4,8,6); scene.add(key);
scene.add(new THREE.DirectionalLight(0x6688aa,0.35).translateX(-5));

const matChamber=(hex,op=0.5)=>new THREE.MeshPhongMaterial({color:hex,transparent:true,opacity:op,shininess:28,side:THREE.DoubleSide,depthWrite:false});
const matValve=(hex)=>new THREE.MeshPhongMaterial({color:hex,emissive:hex,emissiveIntensity:0.2,shininess:60,side:THREE.DoubleSide,transparent:true,opacity:0.9});

function ellMesh(r,mat,pos,rot){const g=new THREE.SphereGeometry(1,28,20);g.scale(r[0],r[1],r[2]);const m=new THREE.Mesh(g,mat);if(pos)m.position.copy(pos);if(rot)m.rotation.set(...rot);return m;}
function coneMesh(r0,r1,h,mat,pos,dir){const g=new THREE.CylinderGeometry(r1,r0,h,24);const m=new THREE.Mesh(g,mat);if(pos)m.position.copy(pos);if(dir)m.quaternion.setFromUnitVectors(V(0,1,0),dir.clone().normalize());return m;}

const heart=new THREE.Group(); scene.add(heart);
const COL={LV:0xc45a5a,RV:0x5a8ac4,LA:0xc48a5a,RA:0x5ac4a0,Ao:0xd0a070,LAA:0xe0a060,PA:0x7090c0,IAS:0xe0e080};
// 腔室中心（与 SDF 共用）
const C={
  LV:V(1.15,-0.55,0.35), RV:V(-0.85,-0.35,1.15), LA:V(0.85,1.85,-1.55), RA:V(-1.75,1.05,-0.35),
  LAA:V(2.15,2.25,0.15), Ao:V(-0.05,2.35,0.55), LVOT:V(0.35,0.95,0.55), AV:V(-0.05,1.55,0.55),
  MV:V(0.85,1.15,-0.55), IAS:V(-0.3,1.4,-0.95), Eso:V(0.15,1.0,-3.35)
};
const R={LV:[2.05,2.55,1.85],RV:[1.65,2.15,1.45],LA:[1.55,1.15,1.3],RA:[1.35,1.45,1.25],LAA:[0.5,0.85,0.42]};

const LV=ellMesh(R.LV,matChamber(COL.LV),C.LV); LV.name='LV';
const RV=ellMesh(R.RV,matChamber(COL.RV,0.45),C.RV); RV.name='RV';
const LA=ellMesh(R.LA,matChamber(COL.LA),C.LA); LA.name='LA';
const RA=ellMesh(R.RA,matChamber(COL.RA,0.45),C.RA); RA.name='RA';
const LAA=ellMesh(R.LAA,matChamber(COL.LAA,0.65),C.LAA,[0.3,0.4,0.5]); LAA.name='LAA';
const Ao=coneMesh(1.0,0.82,3.0,matChamber(COL.Ao,0.45),C.Ao,V(0.05,1,0.05)); Ao.name='Ao';
const LVOT=coneMesh(0.82,0.68,1.35,matChamber(0xb07070,0.4),C.LVOT,V(-0.15,0.85,0.3)); LVOT.name='LVOT';
const PA=coneMesh(0.82,0.68,1.9,matChamber(COL.PA,0.4),V(0.55,3.15,1.45),V(0.3,0.7,0.4)); PA.name='PA';
const IAS=new THREE.Mesh(new THREE.CircleGeometry(1.1,24),matChamber(COL.IAS,0.55));
IAS.position.copy(C.IAS); IAS.rotation.y=Math.PI*0.35; IAS.name='IAS';
[LV,RV,LA,RA,LAA,Ao,LVOT,PA,IAS].forEach(m=>heart.add(m));

const mitralGroup=new THREE.Group(); mitralGroup.name='mitral';
const SEG_COL={A1:0xff6b6b,A2:0xff9f43,A3:0xffd93d,P1:0x6bcb77,P2:0x4d96ff,P3:0x9b59b6};
const SEG_ANG={A1:[200,260],A2:[260,310],A3:[310,360],P3:[0,50],P2:[50,110],P1:[110,160]};
const segMeshes={};
Object.keys(SEG_ANG).forEach(k=>{
  const [a0,a1]=SEG_ANG[k]; const sh=new THREE.Shape(); sh.moveTo(0,0);
  for(let i=0;i<=10;i++){const t=a0+(a1-a0)*i/10;sh.lineTo(Math.cos(t*DEG)*1.05,Math.sin(t*DEG)*1.05);}
  const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),matValve(SEG_COL[k])); m.name=k; segMeshes[k]=m; mitralGroup.add(m);
});
mitralGroup.position.copy(C.MV); mitralGroup.rotation.set(-Math.PI*0.42,0.15,0.1); heart.add(mitralGroup);
const avGroup=new THREE.Group();
['L','R','N'].forEach((n,i)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(0.52,16,i*2.094,2.0),matValve(0xe8d0a0));m.position.copy(C.AV);m.rotation.x=-Math.PI*0.15;avGroup.add(m);});
heart.add(avGroup);

const peShell=ellMesh([3.5,3.7,3.1],new THREE.MeshPhongMaterial({color:0x40a0e0,transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false}),V(0.3,0.2,0));
peShell.visible=false; heart.add(peShell);
const mrJet=new THREE.Mesh(new THREE.ConeGeometry(0.32,2.0,12),new THREE.MeshBasicMaterial({color:0x40ff90,transparent:true,opacity:0.55}));
mrJet.position.set(0.75,0.45,-0.15); mrJet.rotation.x=Math.PI; mrJet.visible=false; heart.add(mrJet);
const asRing=new THREE.Mesh(new THREE.TorusGeometry(0.52,0.11,8,24),new THREE.MeshBasicMaterial({color:0xff5050}));
asRing.position.copy(C.AV); asRing.rotation.x=Math.PI/2; asRing.visible=false; heart.add(asRing);
const wmaPatch=new THREE.Mesh(new THREE.SphereGeometry(0.85,16,12,0,Math.PI),new THREE.MeshBasicMaterial({color:0xff3030,transparent:true,opacity:0.45}));
wmaPatch.position.set(2.35,-0.35,0.55); wmaPatch.visible=false; heart.add(wmaPatch);

const eso=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,7.5,16),new THREE.MeshPhongMaterial({color:0x5a3040,transparent:true,opacity:0.32,side:THREE.DoubleSide}));
eso.position.copy(C.Eso); heart.add(eso);

// 探头 + 成像平面指示
const probeG=new THREE.Group();
const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,5.2,12),new THREE.MeshPhongMaterial({color:0xd0d8e0}));
shaft.position.y=1.9; probeG.add(shaft);
const tipMesh=new THREE.Mesh(new THREE.SphereGeometry(0.26,12,10),new THREE.MeshPhongMaterial({color:0x4aa0ff,emissive:0x2266aa,emissiveIntensity:0.45}));
tipMesh.position.y=-0.9; probeG.add(tipMesh);
const fan=new THREE.Mesh(new THREE.CircleGeometry(4.2,48,-0.85,1.7),new THREE.MeshBasicMaterial({color:0x4aa0ff,transparent:true,opacity:0.16,side:THREE.DoubleSide,depthWrite:false}));
fan.position.y=-0.9; probeG.add(fan);
const planeDisk=new THREE.Mesh(new THREE.PlaneGeometry(7.5,7.5),new THREE.MeshBasicMaterial({color:0x7ec8ff,transparent:true,opacity:0.10,side:THREE.DoubleSide,depthWrite:false}));
planeDisk.position.y=-0.9; probeG.add(planeDisk);
scene.add(probeG);

const labels=[];
function addLabel(text,pos){
  const div=document.createElement('div'); div.textContent=text;
  div.style.cssText='position:absolute;font-size:10px;font-weight:600;color:#ffe84d;text-shadow:0 0 3px #000;pointer-events:none;white-space:nowrap;transform:translate(4px,-50%);display:none';
  wrap3.appendChild(div); labels.push({el:div,pos});
}
[['LV',C.LV],['RV',C.RV],['LA',C.LA],['RA',C.RA],['LAA',C.LAA],['AV',C.AV],['MV',C.MV],['IAS',C.IAS],['LVOT',C.LVOT],['食管',C.Eso]].forEach(([t,p])=>addLabel(t,p));

function addFS(wrap){
  const b=document.createElement('button'); b.className='fsb'; b.textContent='⛶';
  const z=document.createElement('button'); z.className='fsb zr'; z.textContent='⊕';
  wrap.appendChild(z); wrap.appendChild(b);
  b.onclick=e=>{e.stopPropagation();wrap.classList.toggle('full');onResize();};
  z.onclick=e=>{e.stopPropagation();wrap.classList.toggle('zm');};
}
addFS(wrap3); addFS(wrapX);

// ---------- 探头位姿：成像平面 = tip + look × lateral ----------
function probePose(){
  const y=depthY(S.depth);
  const base=V(0.15,y,-3.35);
  const flexR=S.flex*DEG, turnR=S.turn*DEG, omniR=S.omni*DEG;
  const q=new THREE.Quaternion();
  q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0),turnR));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-flexR));
  probeG.position.copy(base);
  probeG.quaternion.copy(q);
  probeG.updateMatrixWorld(true);

  const tip=V(); tipMesh.getWorldPosition(tip);
  // 默认朝心：食管后 → 心腔中心；经胃时 tip 更低仍瞄心
  const heartC=V(0.5,0.7,0.15);
  let look=heartC.clone().sub(tip);
  if(look.lengthSq()<1e-6) look=V(0,0,1); else look.normalize();
  // 管轴（头侧）作初始 up，再绕 look 旋 omni → 多平面角
  let up=V(0,1,0).applyQuaternion(q).normalize();
  // 使 up 垂直 look
  up.addScaledVector(look,-up.dot(look));
  if(up.lengthSq()<1e-6) up=V(1,0,0); else up.normalize();
  up.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(look,omniR)).normalize();
  const lateral=new THREE.Vector3().crossVectors(look,up).normalize(); // 扇区左右
  // 重建正交 up
  up.crossVectors(lateral,look).normalize();
  const planeN=lateral.clone(); // 成像平面法线 = lateral? 
  // 扇区在 look-up 平面内扫过；平面法线 = look × up = lateral
  // 可视化：扇面贴在成像平面上
  fan.rotation.set(0,0,0);
  fan.quaternion.setFromUnitVectors(V(0,0,1), planeN.clone().negate()); // CircleGeometry 默认在 XY，法线 Z
  // tip local: fan parent is probeG; easier set world matrix on helpers
  // 改用独立 plane helper 跟随
  planeDisk.quaternion.copy(fan.quaternion);

  return {tip, look, up, lateral, planeN:lateral.clone(), q};
}

// 独立世界平面指示（不被 probe 局部旋转搞乱）
const planeHelper=new THREE.Mesh(
  new THREE.CircleGeometry(4.5,48,-0.9,1.8),
  new THREE.MeshBasicMaterial({color:0x5eb0ff,transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false})
);
scene.add(planeHelper);
fan.visible=false; planeDisk.visible=false;

function syncPlaneVis(pose){
  planeHelper.visible=S.planeVis;
  if(!S.planeVis) return;
  planeHelper.position.copy(pose.tip).addScaledVector(pose.look,2.2);
  // 扇区几何默认在 XY 平面，法线 +Z；转到 planeN
  planeHelper.quaternion.setFromUnitVectors(V(0,0,1), pose.planeN);
}

// ---------- SDF 心脏（与 3D 腔室同坐标）→ 扇区取样 ----------
function ellSDF(p,c,r){
  const x=(p.x-c.x)/r[0], y=(p.y-c.y)/r[1], z=(p.z-c.z)/r[2];
  return Math.hypot(x,y,z)-1;
}
function smin(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-h*h*k*0.25;}
function bloodSDF(p){
  let d=ellSDF(p,C.LV,[R.LV[0]*0.72,R.LV[1]*0.72,R.LV[2]*0.72]);
  d=smin(d,ellSDF(p,C.RV,[R.RV[0]*0.70,R.RV[1]*0.70,R.RV[2]*0.70]),0.35);
  d=smin(d,ellSDF(p,C.LA,[R.LA[0]*0.70,R.LA[1]*0.70,R.LA[2]*0.70]),0.3);
  d=smin(d,ellSDF(p,C.RA,[R.RA[0]*0.70,R.RA[1]*0.70,R.RA[2]*0.70]),0.3);
  d=smin(d,ellSDF(p,C.LAA,[R.LAA[0]*0.75,R.LAA[1]*0.75,R.LAA[2]*0.75]),0.2);
  // LVOT / Ao 管腔
  const ao=ellSDF(p,C.Ao,[0.55,1.4,0.55]);
  const lvot=ellSDF(p,C.LVOT,[0.45,0.7,0.45]);
  d=smin(d,Math.min(ao,lvot),0.25);
  return d;
}
function epicardiumSDF(p){
  let d=ellSDF(p,C.LV,R.LV);
  d=smin(d,ellSDF(p,C.RV,R.RV),0.45);
  d=smin(d,ellSDF(p,C.LA,R.LA),0.4);
  d=smin(d,ellSDF(p,C.RA,R.RA),0.4);
  d=smin(d,ellSDF(p,C.LAA,R.LAA),0.25);
  d=smin(d,ellSDF(p,C.Ao,[0.95,1.7,0.95]),0.35);
  return d;
}
function valveHit(p){
  const mx=p.x-C.MV.x, my=p.y-C.MV.y, mz=p.z-C.MV.z;
  const mvPlane=Math.abs(my*0.6+mz*0.8);
  const mvRad=Math.hypot(mx, my*0.3+mz*0.2);
  if(mvPlane<0.12 && mvRad<1.15) return 0.95;
  const ax=p.x-C.AV.x, ay=p.y-C.AV.y, az=p.z-C.AV.z;
  if(Math.abs(ay)<0.15 && Math.hypot(ax,az)<0.7) return 1.0;
  const ix=p.x-C.IAS.x, iy=p.y-C.IAS.y, iz=p.z-C.IAS.z;
  if(Math.abs(ix*0.7+iz*0.7)<0.08 && Math.hypot(iy,ix*0.3)<1.1) return 0.75;
  return 0;
}
function pathHit(p){
  if(S.path==='mr'){
    const jx=p.x-0.8, jy=p.y-1.4, jz=p.z+1.0;
    if(jy> -0.2 && jy<1.2 && Math.hypot(jx,jz)<(0.15+0.35*Math.max(0,jy))) return 0.85;
  }
  if(S.path==='as'){
    const ax=p.x-C.AV.x, ay=p.y-C.AV.y, az=p.z-C.AV.z;
    const rr=Math.hypot(ax,az);
    if(Math.abs(ay)<0.12 && rr>0.25 && rr<0.55) return 1.0;
  }
  if(S.path==='wma'){
    const wx=p.x-2.2, wy=p.y+0.4, wz=p.z-0.5;
    if(Math.hypot(wx,wy,wz)<0.9) return -0.35;
  }
  if(S.path==='pe'){
    const epi=epicardiumSDF(p);
    if(epi>0.05 && epi<0.45) return 0.15;
  }
  return null;
}

/** 取样一点 → 回声强度 0..1（血池暗、心肌亮、瓣更亮） */
function sampleEcho(p){
  const ph=pathHit(p);
  const blood=bloodSDF(p);
  const epi=epicardiumSDF(p);
  const wall=Math.max(epi, -blood); // 壁：在心外膜内且不在血池
  // 心肌薄壳：epi<=0 且 blood>= -0.05 的边界带
  const myoBand=Math.abs(blood)<0.18 && epi<0.05;
  const inBlood=blood<0;
  const inBody=epi<0.08;
  let v=0.02;
  if(inBlood) v=0.06+Math.random()*0.04;
  else if(myoBand || (inBody && blood>0 && blood<0.35)) v=0.55+Math.random()*0.25;
  else if(inBody) v=0.22+Math.random()*0.12;
  else if(epi<0.8) v=0.04+Math.random()*0.03; // 近场软组织淡影
  const vh=valveHit(p); if(vh) v=Math.max(v,vh);
  if(ph!=null){ if(ph<0) v=Math.max(0.05,v+ph); else v=Math.max(v,ph); }
  return Math.min(1,v);
}

// ---------- 扇区 Canvas 渲染（取代空洞 WebGL 切面）----------
const echoC=document.createElement('canvas');
echoC.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0;image-rendering:auto';
wrapX.insertBefore(echoC, wrapX.firstChild);
const ectx=echoC.getContext('2d');
// 隐藏旧 WebGL 切面画布（若存在）
[...wrapX.querySelectorAll('canvas')].forEach(c=>{ if(c!==echoC && !c.classList.contains('keep')) {/* keep echo only for slice */} });
// remove previous sector/noise overlays if any from hot reload — not present on fresh load

const EW=220, EH=200; // 内部取样分辨率
echoC.width=EW; echoC.height=EH;
let echoDirty=true, lastEchoKey='';

function echoKey(){return [S.depth|0,S.flex|0,S.turn|0,S.omni|0,S.path,S.snap&&S.snap.id].join(',');}

function renderEcho(pose){
  const img=ectx.createImageData(EW,EH);
  const data=img.data;
  const cx=EW*0.5, cy=EH*0.08;
  const maxR=Math.min(EW,EH)*0.92;
  const halfFan=0.85; // rad ~49°
  const maxDepth=9.5; // world units
  // 预填黑底
  for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=0;data[i+3]=255;}

  const tip=pose.tip, look=pose.look, up=pose.up;
  // 逐像素：仅扇区内取样
  for(let py=0;py<EH;py++){
    for(let px=0;px<EW;px++){
      const dx=px-cx, dy=py-cy;
      const r=Math.hypot(dx,dy);
      if(r<2 || r>maxR) continue;
      const ang=Math.atan2(dx,dy); // 0 = 向下（远离探头尖）
      if(ang<-halfFan || ang>halfFan) continue;
      const depth=(r/maxR)*maxDepth;
      // 扇区坐标：沿 look 为中线，up 为扇面内「上」（头侧在图上侧需翻转）
      // 屏幕：尖端在上，深度向下 → 世界 = tip + look*d*cos(ang) + (-up?)* ...
      // ang 以 look 为 0，向 lateral 偏
      const ca=Math.cos(ang), sa=Math.sin(ang);
      const wx=tip.x + look.x*depth*ca + pose.lateral.x*depth*sa;
      const wy=tip.y + look.y*depth*ca + pose.lateral.y*depth*sa;
      const wz=tip.z + look.z*depth*ca + pose.lateral.z*depth*sa;
      let inten=sampleEcho({x:wx,y:wy,z:wz});
      // 深度增益 + 斑点
      inten*=(0.55+0.45*Math.min(1,depth/3));
      inten=Math.max(0,Math.min(1, inten*(0.85+0.3*Math.random())));
      const g=(inten*255)|0;
      const o=(py*EW+px)*4;
      // 超声感：略偏蓝青的灰
      data[o]=g*0.85; data[o+1]=g*0.92; data[o+2]=Math.min(255,g*1.05); data[o+3]=255;
    }
  }
  // 扇区边界线
  ectx.putImageData(img,0,0);
  ectx.strokeStyle='rgba(100,160,220,0.35)'; ectx.lineWidth=1;
  ectx.beginPath(); ectx.moveTo(cx,cy);
  ectx.arc(cx,cy,maxR, Math.PI/2-halfFan, Math.PI/2+halfFan);
  ectx.closePath(); ectx.stroke();
  // 深度刻度
  ectx.fillStyle='rgba(180,200,220,0.45)'; ectx.font='10px sans-serif';
  for(let d=2;d<=8;d+=2){
    const rr=(d/maxDepth)*maxR;
    ectx.beginPath(); ectx.arc(cx,cy,rr, Math.PI/2-halfFan, Math.PI/2+halfFan); ectx.strokeStyle='rgba(80,100,120,0.25)'; ectx.stroke();
  }
}

// ---------- UI ----------
function setHalf(h){[LV,RV,LA,RA,Ao,LVOT,PA,IAS,LAA].forEach(m=>{m.material.opacity=h?0.48:0.9;m.material.depthWrite=!h;});}
function applyPathology(){
  mrJet.visible=(S.path==='mr'); asRing.visible=(S.path==='as');
  wmaPatch.visible=(S.path==='wma'); peShell.visible=(S.path==='pe');
  echoDirty=true;
}
function highlightSegs(list){
  const set=new Set(list||[]);
  document.querySelectorAll('#segMap .s').forEach(el=>el.classList.toggle('on',set.has(el.dataset.seg)));
  Object.keys(segMeshes).forEach(k=>{
    const m=segMeshes[k];
    m.material.opacity=set.size?(set.has(k)?0.95:0.12):(S.mitral?0.55:0.15);
    m.material.emissiveIntensity=set.has(k)?0.5:0.12;
  });
}

const $depth=document.getElementById('depth'),$flex=document.getElementById('flex'),$turn=document.getElementById('turn'),$omni=document.getElementById('omni');
function syncSliders(){
  $depth.value=S.depth;$flex.value=S.flex;$turn.value=S.turn;$omni.value=S.omni;
  document.getElementById('depthV').textContent=depthLabel(S.depth);
  document.getElementById('flexV').textContent=(S.flex>0?'前屈 ':'后屈 ')+Math.abs(S.flex)+'°';
  document.getElementById('turnV').textContent=(S.turn>0?'右转 ':'左转 ')+Math.abs(S.turn)+'°';
  document.getElementById('omniV').textContent=S.omni+'°';
  document.getElementById('readout').innerHTML=depthLabel(S.depth)+'<br>'+S.omni+'°';
  document.getElementById('vxBadge').textContent=(S.snap?S.snap.name+' · ':'')+S.omni+'° · '+depthLabel(S.depth);
  echoDirty=true;
}
['depth','flex','turn','omni'].forEach(id=>{
  document.getElementById(id).addEventListener('input',e=>{S[id]=+e.target.value;S.snap=null;document.querySelectorAll('#presets button').forEach(b=>b.classList.remove('on'));syncSliders();});
});
document.getElementById('tgL').onclick=function(){S.labels=!S.labels;this.classList.toggle('on',S.labels);};
document.getElementById('tgH').onclick=function(){S.half=!S.half;this.classList.toggle('on',S.half);setHalf(S.half);};
document.getElementById('tgP').onclick=function(){S.probe=!S.probe;this.classList.toggle('on',S.probe);probeG.visible=S.probe;};
document.getElementById('tgM').onclick=function(){S.mitral=!S.mitral;this.classList.toggle('on',S.mitral);mitralGroup.visible=S.mitral;highlightSegs(S.snap?S.snap.segs:[]);};
document.getElementById('tgPl').onclick=function(){S.planeVis=!S.planeVis;this.classList.toggle('on',S.planeVis);};
document.getElementById('tgPl').classList.add('on');

document.querySelectorAll('#paths .tg').forEach(b=>{
  b.onclick=()=>{document.querySelectorAll('#paths .tg').forEach(x=>x.classList.remove('on'));b.classList.add('on');S.path=b.dataset.p;applyPathology();};
});

function applyPreset(p){
  S.depth=p.depth;S.flex=p.flex;S.turn=p.turn;S.omni=p.omni;S.snap=p;
  syncSliders();highlightSegs(p.segs);echoDirty=true;
  document.getElementById('tip').innerHTML='<b style="color:#7ec8ff">'+p.name+'</b>（'+p.en+'）<br>'+p.tip+(p.intra?'<br><span style="color:#e0a050">术中：'+p.intra+'</span>':'');
  document.querySelectorAll('#presets button').forEach(b=>b.classList.toggle('on',b.dataset.id===p.id));
}
function buildPresets(){
  const box=document.getElementById('presets');box.innerHTML='';
  PRESETS.forEach(p=>{const b=document.createElement('button');b.dataset.id=p.id;b.innerHTML=p.name+'<small>'+p.omni+'° · '+depthLabel(p.depth).split(' ')[0]+'</small>';b.onclick=()=>applyPreset(p);box.appendChild(b);});
}
buildPresets();

let quiz=null;
function startQuiz(){
  const panel=document.getElementById('quizPanel');panel.classList.add('on');
  const type=Math.random()<0.55?'id':'drive';
  const ans=PRESETS[(Math.random()*PRESETS.length)|0]; quiz={type,ans};
  const q=document.getElementById('quizQ'),btns=document.getElementById('quizBtns');btns.innerHTML='';
  if(type==='id'){
    applyPreset(ans); q.innerHTML='<b>测验：</b>当前是哪个标准切面？';
    const opts=[ans]; while(opts.length<4){const x=PRESETS[(Math.random()*PRESETS.length)|0];if(!opts.find(o=>o.id===x.id))opts.push(x);}
    opts.sort(()=>Math.random()-0.5).forEach(o=>{const b=document.createElement('button');b.textContent=o.name;b.onclick=()=>{if(o.id===ans.id){b.classList.add('ok');q.innerHTML='<b>正确！</b> '+ans.name;setTimeout(startQuiz,1100);}else{b.classList.add('bad');q.innerHTML='<b>不对。</b>答案是 '+ans.name;}};btns.appendChild(b);});
  }else{
    q.innerHTML='<b>测验：</b>请调到「'+ans.name+'」。完成后点检查。';
    const b=document.createElement('button');b.textContent='检查';
    b.onclick=()=>{const ok=Math.abs(S.omni-ans.omni)<=15&&Math.abs(S.depth-ans.depth)<=18&&Math.abs(S.flex-ans.flex)<=25;
      if(ok){b.classList.add('ok');q.innerHTML='<b>到位！</b>';applyPreset(ans);setTimeout(startQuiz,1200);}else{b.classList.add('bad');q.innerHTML='<b>还差一些。</b>目标约 '+ans.omni+'°、'+depthLabel(ans.depth);}};
    btns.appendChild(b);
  }
}
document.querySelectorAll('.tabs button').forEach(b=>{
  b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));b.classList.add('on');S.mode=b.dataset.mode;
    if(S.mode==='quiz')startQuiz();else{document.getElementById('quizPanel').classList.remove('on');quiz=null;}};
});

let drag=false,lx=0,ly=0;
wrap3.addEventListener('pointerdown',e=>{if(e.button)return;drag=true;lx=e.clientX;ly=e.clientY;wrap3.setPointerCapture(e.pointerId);});
wrap3.addEventListener('pointermove',e=>{if(!drag)return;S.camAz-=(e.clientX-lx)*0.008;S.camEl=Math.max(-1.2,Math.min(1.2,S.camEl+(e.clientY-ly)*0.006));lx=e.clientX;ly=e.clientY;});
wrap3.addEventListener('pointerup',()=>drag=false);
wrap3.addEventListener('wheel',e=>{e.preventDefault();S.camDist=Math.max(6,Math.min(28,S.camDist+e.deltaY*0.01));},{passive:false});
let pinch=null;
wrap3.addEventListener('touchstart',e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),dist:S.camDist};}},{passive:true});
wrap3.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch){const a=e.touches[0],b=e.touches[1];S.camDist=Math.max(6,Math.min(28,pinch.dist*(pinch.d/Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY))));}},{passive:true});
wrap3.addEventListener('touchend',()=>pinch=null);
const toTop=document.getElementById('toTop');
window.addEventListener('scroll',()=>toTop.classList.toggle('show',scrollY>200),{passive:true});
toTop.onclick=()=>scrollTo({top:0,behavior:'smooth'});

function sizeWrap(wrap,camera,renderer){const w=wrap.clientWidth,h=wrap.clientHeight;if(w<2||h<2)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
function onResize(){sizeWrap(wrap3,cam,ren);echoDirty=true;}
window.addEventListener('resize',onResize);
new ResizeObserver(onResize).observe(wrap3);
new ResizeObserver(onResize).observe(wrapX);

function updateLabels(){
  labels.forEach(({el,pos})=>{
    if(!S.labels){el.style.display='none';return;}
    const v=pos.clone().project(cam);
    if(v.z>1){el.style.display='none';return;}
    const x=(v.x*0.5+0.5)*wrap3.clientWidth,y=(-v.y*0.5+0.5)*wrap3.clientHeight;
    if(x<0||y<0||x>wrap3.clientWidth||y>wrap3.clientHeight){el.style.display='none';return;}
    el.style.display='block';el.style.left=x+'px';el.style.top=y+'px';
  });
}

let nFrame=0;
function frame(now){
  requestAnimationFrame(frame);
  const pose=probePose();
  syncPlaneVis(pose);
  cam.position.set(Math.cos(S.camEl)*Math.sin(S.camAz)*S.camDist, Math.sin(S.camEl)*S.camDist+0.8, Math.cos(S.camEl)*Math.cos(S.camAz)*S.camDist);
  cam.lookAt(0.3,0.8,0);
  if(S.path==='wma'){wmaPatch.material.opacity=0.3+0.25*Math.sin(now*0.006);}
  ren.render(scene,cam);
  updateLabels();
  const k=echoKey();
  if(echoDirty || k!==lastEchoKey || (nFrame%2)===0){
    renderEcho(pose); lastEchoKey=k; echoDirty=false;
  }
  nFrame++;
}
setHalf(true); applyPathology(); highlightSegs([]); syncSliders(); onResize();
applyPreset(PRESETS[0]);
requestAnimationFrame(frame);
window.TEE={S,PRESETS,applyPreset,sampleEcho,probePose};
