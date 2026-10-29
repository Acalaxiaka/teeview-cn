// TEEView-CN v1.0.3 — 体表淡出 + 蓝色引导箭头 + 解剖/超声形态滑条 + 轻量剑突下 TTE
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const DEG=Math.PI/180;

const S={depth:45,flex:0,turn:0,omni:0,labels:true,half:true,probe:true,mitral:true,planeVis:true,body:true,
 path:'none',mode:'learn',snap:null,camDist:15,camAz:0.95,camEl:0.28,
 bodyFade:1, morph:1, modality:'TEE', guide:null, anim:null};

function depthLabel(d,mod){
  if(mod==='TTE') return d<40?'剑突下近':'剑突下';
  return d<22?'上段食管 UE':d<70?'中段食管 ME':'经胃 TG';
}
function depthY(d){return 4.2-d*0.048;}

const PRESETS=[
 {id:'ME4C',name:'ME 四腔',en:'ME 4-Chamber',mod:'TEE',depth:48,flex:8,turn:0,omni:0,segs:['A2','P2'],
  tip:'中段食管 0°：LA/LV/RA/RV。',intra:'体外循环前基线。'},
 {id:'ME2C',name:'ME 两腔',en:'ME 2-Chamber',mod:'TEE',depth:48,flex:5,turn:0,omni:90,segs:['A1','A2','A3','P1','P2','P3'],
  tip:'约 90°：LA/LV 与 A1–P3。',intra:'明确二尖瓣节段。'},
 {id:'MELAX',name:'ME 左心长轴',en:'ME LAX',mod:'TEE',depth:48,flex:5,turn:5,omni:120,segs:['A2','P2'],
  tip:'约 120°：LVOT、AV。',intra:'SAM / LVOT。'},
 {id:'MEMC',name:'ME 二尖瓣交界',en:'ME Mitral Commissural',mod:'TEE',depth:48,flex:5,turn:0,omni:60,segs:['P1','A2','P3'],
  tip:'约 60°：P1–A2–P3。',intra:'交界区反流。'},
 {id:'MEAVSAX',name:'ME 主动脉短轴',en:'ME AV SAX',mod:'TEE',depth:40,flex:-8,turn:0,omni:40,segs:[],
  tip:'约 30–45°：三个窦。',intra:'AVR / 冠脉开口。'},
 {id:'MEAVLAX',name:'ME 主动脉长轴',en:'ME AV LAX',mod:'TEE',depth:42,flex:0,turn:5,omni:135,segs:['A2','P2'],
  tip:'AV 长轴与 LVOT。',intra:'环径测量。'},
 {id:'MERVIO',name:'ME RV 流入流出',en:'ME RV In-Out',mod:'TEE',depth:45,flex:0,turn:-12,omni:60,segs:[],
  tip:'TV、RVOT。',intra:'三尖瓣成形。'},
 {id:'MEBIC',name:'ME 双腔静脉',en:'ME Bicaval',mod:'TEE',depth:52,flex:12,turn:25,omni:100,segs:[],
  tip:'SVC/IVC、IAS。',intra:'房缺与插管。'},
 {id:'MELAA',name:'ME 左心耳',en:'ME LAA',mod:'TEE',depth:38,flex:12,turn:-45,omni:70,segs:[],
  tip:'扫 LAA 排除血栓。',intra:'转流前。'},
 {id:'TGSAX',name:'TG 中段短轴',en:'TG Mid SAX',mod:'TEE',depth:84,flex:55,turn:0,omni:0,segs:[],
  tip:'经胃 LV 短轴。',intra:'室壁运动。'},
 {id:'TGBASE',name:'TG 基底短轴',en:'TG Basal SAX',mod:'TEE',depth:78,flex:48,turn:0,omni:0,segs:['A1','A2','A3','P1','P2','P3'],
  tip:'二尖瓣水平短轴。',intra:'启闭对称。'},
 {id:'TG2C',name:'TG 两腔',en:'TG 2-Chamber',mod:'TEE',depth:84,flex:45,turn:0,omni:90,segs:['A1','A2','A3','P3','P2','P1'],
  tip:'经胃 90° 下壁/前壁。',intra:'下壁缺血。'},
 {id:'TGLAX',name:'TG 长轴',en:'TG LAX',mod:'TEE',depth:84,flex:45,turn:10,omni:120,segs:['A2','P2'],
  tip:'经胃长轴 LVOT/AV。',intra:'跨瓣压差。'},
 {id:'DTG5C',name:'深TG 五腔',en:'Deep TG 5C',mod:'TEE',depth:95,flex:62,turn:0,omni:0,segs:[],
  tip:'深经胃平行 LVOT。',intra:'AS 多普勒。'},
 {id:'UEARCH',name:'UE 主动脉弓长轴',en:'UE Aortic Arch LAX',mod:'TEE',depth:12,flex:0,turn:-30,omni:0,segs:[],
  tip:'上段食管弓长轴。',intra:'弓部斑块。'},
 {id:'UEARCHS',name:'UE 主动脉弓短轴',en:'UE Aortic Arch SAX',mod:'TEE',depth:12,flex:0,turn:-20,omni:90,segs:[],
  tip:'弓短轴。',intra:'漂浮导管。'},
 {id:'MEDTG',name:'ME 五腔偏转',en:'ME 5-Chamber',mod:'TEE',depth:45,flex:18,turn:0,omni:0,segs:['A2','P2'],
  tip:'ME 四腔前屈显 LVOT。',intra:'快速扫。'},
 {id:'METV',name:'ME 聚焦三尖瓣',en:'ME TV focused',mod:'TEE',depth:52,flex:5,turn:18,omni:0,segs:[],
  tip:'右转聚焦三尖瓣。',intra:'反流评估。'},
 // 轻量 TTE 剑突下（教学示意）
 {id:'SC4C',name:'剑突下四腔',en:'Subcostal 4C',mod:'TTE',depth:55,flex:25,turn:0,omni:0,segs:['A2','P2'],
  tip:'剑突下探头朝头侧偏左：四腔概览（TTE 示意）。',intra:'心包积液筛查常用。'},
 {id:'SCIVC',name:'剑突下 IVC',en:'Subcostal IVC',mod:'TTE',depth:50,flex:15,turn:30,omni:0,segs:[],
  tip:'剑突下右偏：下腔静脉长轴入右房（TTE 示意）。',intra:'容量与 CVP 估测。'},
];

function makeRen(wrap,clear){
  let r=null;
  for(const o of [{antialias:true,powerPreference:'high-performance'},{antialias:false},{antialias:false,failIfMajorPerformanceCaveat:false}]){
    try{r=new THREE.WebGLRenderer(Object.assign({alpha:false},o)); if(r.getContext())break;}catch(e){r=null;}
  }
  if(!r){const d=document.createElement('div');d.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;padding:12px;text-align:center';d.textContent='WebGL 不可用';wrap.appendChild(d);
    return {domElement:document.createElement('canvas'),setPixelRatio(){},setClearColor(){},setSize(){},render(){},getContext:()=>null};}
  r.setPixelRatio(Math.min(devicePixelRatio||1,2)); r.setClearColor(clear,1); wrap.appendChild(r.domElement); return r;
}
const wrap3=document.getElementById('v3d'), wrapX=document.getElementById('vx');
const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x0c1018,0.028);
const cam=new THREE.PerspectiveCamera(42,1,0.1,90);
const ren=makeRen(wrap3,0x0c1018);
scene.add(new THREE.HemisphereLight(0x9bb8d0,0x1a1010,0.95));
const key=new THREE.DirectionalLight(0xfff0e0,0.8); key.position.set(4,8,6); scene.add(key);
const fill=new THREE.DirectionalLight(0x6688aa,0.35); fill.position.set(-5,2,-2); scene.add(fill);

const matChamber=(hex,op=0.5)=>new THREE.MeshPhongMaterial({color:hex,transparent:true,opacity:op,shininess:28,side:THREE.DoubleSide,depthWrite:false});
const matValve=(hex)=>new THREE.MeshPhongMaterial({color:hex,emissive:hex,emissiveIntensity:0.2,shininess:60,side:THREE.DoubleSide,transparent:true,opacity:0.9});
function ellMesh(r,mat,pos,rot){const g=new THREE.SphereGeometry(1,28,20);g.scale(r[0],r[1],r[2]);const m=new THREE.Mesh(g,mat);if(pos)m.position.copy(pos);if(rot)m.rotation.set(...rot);return m;}
function coneMesh(r0,r1,h,mat,pos,dir){const g=new THREE.CylinderGeometry(r1,r0,h,24);const m=new THREE.Mesh(g,mat);if(pos)m.position.copy(pos);if(dir)m.quaternion.setFromUnitVectors(V(0,1,0),dir.clone().normalize());return m;}

const heart=new THREE.Group(); scene.add(heart);
const COL={LV:0xc45a5a,RV:0x5a8ac4,LA:0xc48a5a,RA:0x5ac4a0,Ao:0xd0a070,LAA:0xe0a060,PA:0x7090c0,IAS:0xe0e080,IVC:0x60b0a0};
const C={
  LV:V(1.15,-0.55,0.35), RV:V(-0.85,-0.35,1.15), LA:V(0.85,1.85,-1.55), RA:V(-1.75,1.05,-0.35),
  LAA:V(2.15,2.25,0.15), Ao:V(-0.05,2.35,0.55), LVOT:V(0.35,0.95,0.55), AV:V(-0.05,1.55,0.55),
  MV:V(0.85,1.15,-0.55), IAS:V(-0.3,1.4,-0.95), Eso:V(0.15,1.0,-3.35), IVC:V(-1.9,-1.8,-0.8)
};
const R={LV:[2.05,2.55,1.85],RV:[1.65,2.15,1.45],LA:[1.55,1.15,1.3],RA:[1.35,1.45,1.25],LAA:[0.5,0.85,0.42]};

const LV=ellMesh(R.LV,matChamber(COL.LV),C.LV);
const RV=ellMesh(R.RV,matChamber(COL.RV,0.45),C.RV);
const LA=ellMesh(R.LA,matChamber(COL.LA),C.LA);
const RA=ellMesh(R.RA,matChamber(COL.RA,0.45),C.RA);
const LAA=ellMesh(R.LAA,matChamber(COL.LAA,0.65),C.LAA,[0.3,0.4,0.5]);
const Ao=coneMesh(1.0,0.82,3.0,matChamber(COL.Ao,0.45),C.Ao,V(0.05,1,0.05));
const LVOT=coneMesh(0.82,0.68,1.35,matChamber(0xb07070,0.4),C.LVOT,V(-0.15,0.85,0.3));
const PA=coneMesh(0.82,0.68,1.9,matChamber(COL.PA,0.4),V(0.55,3.15,1.45),V(0.3,0.7,0.4));
const IVCmesh=coneMesh(0.55,0.48,3.2,matChamber(COL.IVC,0.5),C.IVC,V(0.05,-1,0.1)); IVCmesh.name='IVC';
const IAS=new THREE.Mesh(new THREE.CircleGeometry(1.1,24),matChamber(COL.IAS,0.55));
IAS.position.copy(C.IAS); IAS.rotation.y=Math.PI*0.35;
[LV,RV,LA,RA,LAA,Ao,LVOT,PA,IVCmesh,IAS].forEach(m=>heart.add(m));

const mitralGroup=new THREE.Group();
const SEG_COL={A1:0xff6b6b,A2:0xff9f43,A3:0xffd93d,P1:0x6bcb77,P2:0x4d96ff,P3:0x9b59b6};
const SEG_ANG={A1:[200,260],A2:[260,310],A3:[310,360],P3:[0,50],P2:[50,110],P1:[110,160]};
const segMeshes={};
Object.keys(SEG_ANG).forEach(k=>{
  const [a0,a1]=SEG_ANG[k]; const sh=new THREE.Shape(); sh.moveTo(0,0);
  for(let i=0;i<=10;i++){const t=a0+(a1-a0)*i/10;sh.lineTo(Math.cos(t*DEG)*1.05,Math.sin(t*DEG)*1.05);}
  const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),matValve(SEG_COL[k])); segMeshes[k]=m; mitralGroup.add(m);
});
mitralGroup.position.copy(C.MV); mitralGroup.rotation.set(-Math.PI*0.42,0.15,0.1); heart.add(mitralGroup);
const avGroup=new THREE.Group();
['L','R','N'].forEach((_,i)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(0.52,16,i*2.094,2.0),matValve(0xe8d0a0));m.position.copy(C.AV);m.rotation.x=-Math.PI*0.15;avGroup.add(m);});
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

// ---------- 体表：皮肤 + 肋骨（可淡出）----------
const bodyG=new THREE.Group(); scene.add(bodyG);
const skinMat=new THREE.MeshPhongMaterial({color:0xc4a088,transparent:true,opacity:0.55,shininess:10,side:THREE.DoubleSide,depthWrite:false});
const skin=ellMesh([4.8,6.2,4.2],skinMat,V(0.2,0.4,0.6)); bodyG.add(skin);
const ribMat=new THREE.MeshPhongMaterial({color:0xe8e0d0,transparent:true,opacity:0.7,shininess:40});
for(let i=0;i<7;i++){
  const tor=new THREE.Mesh(new THREE.TorusGeometry(3.4+i*0.08,0.07,6,40,Math.PI*1.15),ribMat.clone());
  tor.position.set(0.1,2.2-i*0.72,0.9); tor.rotation.y=Math.PI*0.5; tor.rotation.z=0.12; bodyG.add(tor);
}
const sternum=new THREE.Mesh(new THREE.BoxGeometry(0.35,4.8,0.2),ribMat.clone());
sternum.position.set(0.05,0.6,3.55); bodyG.add(sternum);

function setBodyFade(t){ // 1=体表实，0=全透明（只留心）
  S.bodyFade=t;
  bodyG.visible=S.body && t>0.02;
  const opSkin=0.55*t, opRib=0.7*t;
  skin.material.opacity=opSkin;
  bodyG.children.forEach((c,i)=>{ if(i===0)return; if(c.material) c.material.opacity=opRib; });
  document.getElementById('bodyFadeV').textContent=t>0.85?'体表':t<0.15?'解剖':Math.round((1-t)*100)+'%透明';
}

// ---------- 探头 ----------
const probeG=new THREE.Group();
const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,5.2,12),new THREE.MeshPhongMaterial({color:0xd0d8e0}));
shaft.position.y=1.9; probeG.add(shaft);
const tipMesh=new THREE.Mesh(new THREE.SphereGeometry(0.26,12,10),new THREE.MeshPhongMaterial({color:0x4aa0ff,emissive:0x2266aa,emissiveIntensity:0.45}));
tipMesh.position.y=-0.9; probeG.add(tipMesh);
const tteHead=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.35,1.4),new THREE.MeshPhongMaterial({color:0xb0c0d0}));
tteHead.position.set(0,-0.9,0.4); tteHead.visible=false; probeG.add(tteHead);
scene.add(probeG);

const planeHelper=new THREE.Mesh(
  new THREE.CircleGeometry(4.5,48,-0.9,1.8),
  new THREE.MeshBasicMaterial({color:0x5eb0ff,transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false})
);
scene.add(planeHelper);

// ---------- 蓝色引导箭头 ----------
const guideG=new THREE.Group(); scene.add(guideG);
function makeArrow(color=0x3aa0ff){
  const g=new THREE.Group();
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,1.2,8),new THREE.MeshBasicMaterial({color}));
  stem.position.y=0.6; g.add(stem);
  const head=new THREE.Mesh(new THREE.ConeGeometry(0.18,0.4,10),new THREE.MeshBasicMaterial({color}));
  head.position.y=1.35; g.add(head);
  return g;
}
const arrows={adv:makeArrow(0x4fc3ff), flex:makeArrow(0x5eb0ff), turn:makeArrow(0x7ec8ff), omni:makeArrow(0x90d0ff)};
Object.values(arrows).forEach(a=>{a.visible=false; guideG.add(a);});

const labels=[];
function addLabel(text,pos){
  const div=document.createElement('div'); div.textContent=text;
  div.style.cssText='position:absolute;font-size:10px;font-weight:600;color:#ffe84d;text-shadow:0 0 3px #000;pointer-events:none;white-space:nowrap;transform:translate(4px,-50%);display:none';
  wrap3.appendChild(div); labels.push({el:div,pos});
}
[['LV',C.LV],['RV',C.RV],['LA',C.LA],['RA',C.RA],['LAA',C.LAA],['AV',C.AV],['MV',C.MV],['IAS',C.IAS],['IVC',C.IVC],['食管',C.Eso]].forEach(([t,p])=>addLabel(t,p));

function addFS(wrap){
  const b=document.createElement('button'); b.className='fsb'; b.textContent='⛶';
  const z=document.createElement('button'); z.className='fsb zr'; z.textContent='⊕';
  wrap.appendChild(z); wrap.appendChild(b);
  b.onclick=e=>{e.stopPropagation();wrap.classList.toggle('full');onResize();};
  z.onclick=e=>{e.stopPropagation();wrap.classList.toggle('zm');};
}
addFS(wrap3); addFS(wrapX);

function probePose(){
  const mod=S.modality;
  let tip, look, up, lateral, base, q;
  if(mod==='TTE'){
    // 剑突下：探头在膈下前腹壁，朝头侧偏后扫心
    base=V(0.1,-4.2+S.depth*0.01, 3.2-S.depth*0.01);
    q=new THREE.Quaternion();
    q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0), S.turn*DEG));
    q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0), (-55-S.flex)*DEG)); // 朝头侧
    probeG.position.copy(base); probeG.quaternion.copy(q); probeG.updateMatrixWorld(true);
    tip=V(); tipMesh.getWorldPosition(tip);
    const heartC=S.snap&&S.snap.id==='SCIVC'?C.IVC.clone().lerp(C.RA,0.4):V(0.3,0.5,0.2);
    look=heartC.sub(tip); if(look.lengthSq()<1e-6) look=V(0,1,-0.3); else look.normalize();
    up=V(0,0,-1).applyQuaternion(q); up.addScaledVector(look,-up.dot(look)); if(up.lengthSq()<1e-6) up=V(1,0,0); else up.normalize();
    up.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(look,S.omni*DEG)).normalize();
    lateral=new THREE.Vector3().crossVectors(look,up).normalize();
    up.crossVectors(lateral,look).normalize();
    tipMesh.visible=false; tteHead.visible=true; shaft.visible=true;
  }else{
    const y=depthY(S.depth);
    base=V(0.15,y,-3.35);
    q=new THREE.Quaternion();
    q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0),S.turn*DEG));
    q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0),-S.flex*DEG));
    probeG.position.copy(base); probeG.quaternion.copy(q); probeG.updateMatrixWorld(true);
    tip=V(); tipMesh.getWorldPosition(tip);
    const heartC=V(0.5,0.7,0.15);
    look=heartC.clone().sub(tip); if(look.lengthSq()<1e-6) look=V(0,0,1); else look.normalize();
    up=V(0,1,0).applyQuaternion(q).normalize();
    up.addScaledVector(look,-up.dot(look)); if(up.lengthSq()<1e-6) up=V(1,0,0); else up.normalize();
    up.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(look,S.omni*DEG)).normalize();
    lateral=new THREE.Vector3().crossVectors(look,up).normalize();
    up.crossVectors(lateral,look).normalize();
    tipMesh.visible=true; tteHead.visible=false; shaft.visible=true;
  }
  return {tip,look,up,lateral,planeN:lateral.clone(),q,base};
}
function syncPlaneVis(pose){
  planeHelper.visible=S.planeVis;
  if(!S.planeVis) return;
  planeHelper.position.copy(pose.tip).addScaledVector(pose.look,2.2);
  planeHelper.quaternion.setFromUnitVectors(V(0,0,1), pose.planeN);
}

function updateGuideArrows(pose){
  const g=S.guide; if(!g){Object.values(arrows).forEach(a=>a.visible=false); return;}
  const tip=pose.tip;
  // 进退：沿食管/探头长轴
  const needAdv=Math.abs(g.dDepth)>3;
  arrows.adv.visible=needAdv;
  if(needAdv){
    arrows.adv.position.copy(tip).add(V(0.8,0,-0.5));
    const dir=V(0, g.dDepth>0?-1:1, 0); // depth↑ = tip更低（进胃）
    arrows.adv.quaternion.setFromUnitVectors(V(0,1,0), dir);
  }
  const needFlex=Math.abs(g.dFlex)>4;
  arrows.flex.visible=needFlex;
  if(needFlex){
    arrows.flex.position.copy(tip).add(V(-0.6,0.3,0.8));
    arrows.flex.quaternion.setFromUnitVectors(V(0,1,0), V(0,0,g.dFlex>0?1:-1));
  }
  const needTurn=Math.abs(g.dTurn)>5;
  arrows.turn.visible=needTurn;
  if(needTurn){
    arrows.turn.position.copy(tip).add(V(0,0.8,-0.3));
    arrows.turn.quaternion.setFromUnitVectors(V(0,1,0), V(g.dTurn>0?1:-1,0,0));
  }
  const needOmni=Math.abs(g.dOmni)>8;
  arrows.omni.visible=needOmni;
  if(needOmni){
    arrows.omni.position.copy(tip).addScaledVector(pose.look,1.5).add(V(0,0.5,0));
    arrows.omni.quaternion.setFromUnitVectors(V(0,1,0), pose.lateral.clone().multiplyScalar(g.dOmni>0?1:-1));
  }
}

// ---------- SDF + 形态采样 ----------
function ellSDF(p,c,r){const x=(p.x-c.x)/r[0],y=(p.y-c.y)/r[1],z=(p.z-c.z)/r[2];return Math.hypot(x,y,z)-1;}
function smin(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*0.25;}
function bloodSDF(p){
  let d=ellSDF(p,C.LV,[R.LV[0]*0.72,R.LV[1]*0.72,R.LV[2]*0.72]);
  d=smin(d,ellSDF(p,C.RV,[R.RV[0]*0.7,R.RV[1]*0.7,R.RV[2]*0.7]),0.35);
  d=smin(d,ellSDF(p,C.LA,[R.LA[0]*0.7,R.LA[1]*0.7,R.LA[2]*0.7]),0.3);
  d=smin(d,ellSDF(p,C.RA,[R.RA[0]*0.7,R.RA[1]*0.7,R.RA[2]*0.7]),0.3);
  d=smin(d,ellSDF(p,C.LAA,[R.LAA[0]*0.75,R.LAA[1]*0.75,R.LAA[2]*0.75]),0.2);
  d=smin(d,ellSDF(p,C.IVC,[0.4,1.4,0.4]),0.25);
  d=smin(d,Math.min(ellSDF(p,C.Ao,[0.55,1.4,0.55]),ellSDF(p,C.LVOT,[0.45,0.7,0.45])),0.25);
  return d;
}
function epicardiumSDF(p){
  let d=ellSDF(p,C.LV,R.LV);
  d=smin(d,ellSDF(p,C.RV,R.RV),0.45);
  d=smin(d,ellSDF(p,C.LA,R.LA),0.4);
  d=smin(d,ellSDF(p,C.RA,R.RA),0.4);
  d=smin(d,ellSDF(p,C.LAA,R.LAA),0.25);
  d=smin(d,ellSDF(p,C.Ao,[0.95,1.7,0.95]),0.35);
  d=smin(d,ellSDF(p,C.IVC,[0.6,1.7,0.6]),0.3);
  return d;
}
function chamberId(p){
  const scores=[
    ['LV',ellSDF(p,C.LV,[R.LV[0]*0.85,R.LV[1]*0.85,R.LV[2]*0.85])],
    ['RV',ellSDF(p,C.RV,[R.RV[0]*0.85,R.RV[1]*0.85,R.RV[2]*0.85])],
    ['LA',ellSDF(p,C.LA,[R.LA[0]*0.85,R.LA[1]*0.85,R.LA[2]*0.85])],
    ['RA',ellSDF(p,C.RA,[R.RA[0]*0.85,R.RA[1]*0.85,R.RA[2]*0.85])],
    ['IVC',ellSDF(p,C.IVC,[0.5,1.5,0.5])],
  ];
  scores.sort((a,b)=>a[1]-b[1]);
  return scores[0][1]<0.15?scores[0][0]:null;
}
function valveHit(p){
  const mx=p.x-C.MV.x,my=p.y-C.MV.y,mz=p.z-C.MV.z;
  if(Math.abs(my*0.6+mz*0.8)<0.12 && Math.hypot(mx,my*0.3+mz*0.2)<1.15) return 0.95;
  const ax=p.x-C.AV.x,ay=p.y-C.AV.y,az=p.z-C.AV.z;
  if(Math.abs(ay)<0.15 && Math.hypot(ax,az)<0.7) return 1;
  const ix=p.x-C.IAS.x,iy=p.y-C.IAS.y,iz=p.z-C.IAS.z;
  if(Math.abs(ix*0.7+iz*0.7)<0.08 && Math.hypot(iy,ix*0.3)<1.1) return 0.75;
  return 0;
}
function pathHit(p){
  if(S.path==='mr'){const jx=p.x-0.8,jy=p.y-1.4,jz=p.z+1; if(jy>-0.2&&jy<1.2&&Math.hypot(jx,jz)<0.15+0.35*Math.max(0,jy)) return 0.85;}
  if(S.path==='as'){const ax=p.x-C.AV.x,ay=p.y-C.AV.y,az=p.z-C.AV.z,rr=Math.hypot(ax,az); if(Math.abs(ay)<0.12&&rr>0.25&&rr<0.55) return 1;}
  if(S.path==='wma'){if(Math.hypot(p.x-2.2,p.y+0.4,p.z-0.5)<0.9) return -0.35;}
  if(S.path==='pe'){const epi=epicardiumSDF(p); if(epi>0.05&&epi<0.45) return 0.15;}
  return null;
}
const CH_RGB={LV:[200,90,90],RV:[90,140,200],LA:[200,150,90],RA:[90,190,160],IVC:[80,170,160],MYO:[180,120,120],VAL:[240,220,180],BLOOD:[20,25,35]};

function samplePoint(p, morph){
  // morph 0=解剖彩切 1=超声灰阶；返回 [r,g,b] 0-255
  const blood=bloodSDF(p), epi=epicardiumSDF(p);
  const myoBand=Math.abs(blood)<0.18 && epi<0.05;
  const inBlood=blood<0, inBody=epi<0.08;
  const vh=valveHit(p); const ph=pathHit(p);
  const cid=chamberId(p);

  // 解剖色
  let ar=15,ag=18,ab=22;
  if(vh){ar=CH_RGB.VAL[0];ag=CH_RGB.VAL[1];ab=CH_RGB.VAL[2];}
  else if(inBlood && cid && CH_RGB[cid]){const c=CH_RGB[cid]; ar=c[0]*0.35;ag=c[1]*0.35;ab=c[2]*0.35;}
  else if(myoBand || (inBody && blood>0 && blood<0.35)){ar=CH_RGB.MYO[0];ag=CH_RGB.MYO[1];ab=CH_RGB.MYO[2];}
  else if(inBody){ar=60;ag=50;ab=55;}
  else if(epi<0.8){ar=25;ag=28;ab=32;}

  // 超声灰
  let inten=0.02;
  if(inBlood) inten=0.06+Math.random()*0.04;
  else if(myoBand || (inBody && blood>0 && blood<0.35)) inten=0.55+Math.random()*0.25;
  else if(inBody) inten=0.22+Math.random()*0.12;
  else if(epi<0.8) inten=0.04+Math.random()*0.03;
  if(vh) inten=Math.max(inten,vh);
  if(ph!=null){ if(ph<0) inten=Math.max(0.05,inten+ph); else inten=Math.max(inten,ph); }
  const g=Math.min(255,inten*255);
  const er=g*0.85, eg=g*0.92, eb=Math.min(255,g*1.05);

  const t=morph;
  return [ar*(1-t)+er*t, ag*(1-t)+eg*t, ab*(1-t)+eb*t];
}

const echoC=document.createElement('canvas');
echoC.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:0';
wrapX.insertBefore(echoC, wrapX.firstChild);
const ectx=echoC.getContext('2d');
const EW=200, EH=180; echoC.width=EW; echoC.height=EH;
let echoDirty=true, lastEchoKey='';
const vxLabs=document.getElementById('vxLabs');
const lab2d={}; ['LA','LV','RA','RV','IVC','AV','MV'].forEach(n=>{
  const s=document.createElement('span'); s.textContent=n; s.style.display='none'; vxLabs.appendChild(s); lab2d[n]=s;
});

function echoKey(){return [S.depth|0,S.flex|0,S.turn|0,S.omni|0,S.path,(S.morph*20)|0,S.modality,S.snap&&S.snap.id].join(',');}

function renderEcho(pose){
  const img=ectx.createImageData(EW,EH); const data=img.data;
  const cx=EW*0.5, cy=EH*0.08, maxR=Math.min(EW,EH)*0.92, halfFan=0.85, maxDepth=9.5;
  for(let i=0;i<data.length;i+=4){data[i]=data[i+1]=data[i+2]=0;data[i+3]=255;}
  const tip=pose.tip, look=pose.look, lat=pose.lateral;
  const hitAcc={LA:[],LV:[],RA:[],RV:[],IVC:[],AV:[],MV:[]};
  const morph=S.morph;
  for(let py=0;py<EH;py++){
    for(let px=0;px<EW;px++){
      const dx=px-cx, dy=py-cy, r=Math.hypot(dx,dy);
      if(r<2||r>maxR) continue;
      const ang=Math.atan2(dx,dy); if(ang<-halfFan||ang>halfFan) continue;
      const depth=(r/maxR)*maxDepth;
      const ca=Math.cos(ang), sa=Math.sin(ang);
      const wx=tip.x+look.x*depth*ca+lat.x*depth*sa;
      const wy=tip.y+look.y*depth*ca+lat.y*depth*sa;
      const wz=tip.z+look.z*depth*ca+lat.z*depth*sa;
      const p={x:wx,y:wy,z:wz};
      let [rr,gg,bb]=samplePoint(p, morph);
      const gain=0.55+0.45*Math.min(1,depth/3);
      rr*=gain; gg*=gain; bb*=gain;
      const o=(py*EW+px)*4; data[o]=rr; data[o+1]=gg; data[o+2]=bb; data[o+3]=255;
      // 标签锚点：腔室中心附近像素
      const cid=chamberId(p);
      if(cid && hitAcc[cid] && bloodSDF(p)< -0.05) hitAcc[cid].push([px,py]);
      if(valveHit(p)>0.9){ if(Math.abs(wy-C.AV.y)<0.4) hitAcc.AV.push([px,py]); else hitAcc.MV.push([px,py]); }
    }
  }
  ectx.putImageData(img,0,0);
  ectx.strokeStyle='rgba(100,160,220,0.35)'; ectx.beginPath(); ectx.moveTo(cx,cy);
  ectx.arc(cx,cy,maxR,Math.PI/2-halfFan,Math.PI/2+halfFan); ectx.closePath(); ectx.stroke();

  // 2D 结构标注（形态滑条过程中位置固定于结构，不随灰阶变化）
  const scaleX=wrapX.clientWidth/EW, scaleY=wrapX.clientHeight/EH;
  Object.keys(lab2d).forEach(n=>{
    const pts=hitAcc[n]; const el=lab2d[n];
    if(!S.labels || !pts || pts.length<8){el.style.display='none'; return;}
    let sx=0,sy=0; pts.forEach(([x,y])=>{sx+=x;sy+=y;});
    sx/=pts.length; sy/=pts.length;
    el.style.display='block'; el.style.left=(sx*scaleX)+'px'; el.style.top=(sy*scaleY)+'px';
  });
}

function setHalf(h){[LV,RV,LA,RA,Ao,LVOT,PA,IVCmesh,IAS,LAA].forEach(m=>{m.material.opacity=h?0.48:0.9;m.material.depthWrite=!h;});}
function applyPathology(){
  mrJet.visible=S.path==='mr'; asRing.visible=S.path==='as';
  wmaPatch.visible=S.path==='wma'; peShell.visible=S.path==='pe'; echoDirty=true;
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
const $body=document.getElementById('bodyFade'),$morph=document.getElementById('morph');
function syncSliders(){
  $depth.value=S.depth;$flex.value=S.flex;$turn.value=S.turn;$omni.value=S.omni;
  $body.value=(S.bodyFade*100)|0; $morph.value=(S.morph*100)|0;
  document.getElementById('depthV').textContent=depthLabel(S.depth,S.modality);
  document.getElementById('flexV').textContent=(S.flex>0?'前屈 ':'后屈 ')+Math.abs(S.flex)+'°';
  document.getElementById('turnV').textContent=(S.turn>0?'右转 ':'左转 ')+Math.abs(S.turn)+'°';
  document.getElementById('omniV').textContent=S.omni+'°';
  document.getElementById('morphV').textContent=S.morph>0.85?'超声':S.morph<0.15?'解剖':Math.round(S.morph*100)+'%';
  setBodyFade(S.bodyFade);
  document.getElementById('readout').innerHTML=(S.modality==='TTE'?'TTE ':'')+depthLabel(S.depth,S.modality)+'<br>'+S.omni+'°';
  document.getElementById('vxBadge').textContent=(S.snap?S.snap.name+' · ':'')+S.omni+'° · '+depthLabel(S.depth,S.modality);
  echoDirty=true;
}
['depth','flex','turn','omni'].forEach(id=>{
  document.getElementById(id).addEventListener('input',e=>{
    S[id]=+e.target.value; S.snap=null; S.guide=null;
    document.getElementById('guide').classList.remove('on');
    document.querySelectorAll('#presets button').forEach(b=>b.classList.remove('on'));
    syncSliders();
  });
});
$body.addEventListener('input',e=>{S.bodyFade=+e.target.value/100; setBodyFade(S.bodyFade);});
$morph.addEventListener('input',e=>{S.morph=+e.target.value/100; document.getElementById('morphV').textContent=S.morph>0.85?'超声':S.morph<0.15?'解剖':Math.round(S.morph*100)+'%'; echoDirty=true;});

document.getElementById('tgL').onclick=function(){S.labels=!S.labels;this.classList.toggle('on',S.labels);echoDirty=true;};
document.getElementById('tgH').onclick=function(){S.half=!S.half;this.classList.toggle('on',S.half);setHalf(S.half);};
document.getElementById('tgP').onclick=function(){S.probe=!S.probe;this.classList.toggle('on',S.probe);probeG.visible=S.probe;};
document.getElementById('tgM').onclick=function(){S.mitral=!S.mitral;this.classList.toggle('on',S.mitral);mitralGroup.visible=S.mitral;highlightSegs(S.snap?S.snap.segs:[]);};
document.getElementById('tgPl').onclick=function(){S.planeVis=!S.planeVis;this.classList.toggle('on',S.planeVis);};
document.getElementById('tgBody').onclick=function(){
  S.body=!S.body; this.classList.toggle('on',S.body);
  if(S.body && S.bodyFade<0.05){S.bodyFade=1; $body.value=100;}
  setBodyFade(S.body?S.bodyFade:0);
};
document.querySelectorAll('#paths .tg').forEach(b=>{
  b.onclick=()=>{document.querySelectorAll('#paths .tg').forEach(x=>x.classList.remove('on'));b.classList.add('on');S.path=b.dataset.p;applyPathology();};
});

function buildGuideSteps(from, to){
  const steps=[];
  const dD=to.depth-from.depth, dF=to.flex-from.flex, dT=to.turn-from.turn, dO=to.omni-from.omni;
  if(to.mod!==from.mod) steps.push(to.mod==='TTE'?'切换为剑突下 TTE 探头位置':'切换回食管 TEE 探头');
  if(Math.abs(dD)>3) steps.push(dD>0?'进镜 / 加深（向远端）':'退镜 / 变浅（向近端）');
  if(Math.abs(dF)>4) steps.push(dF>0?'前屈探头尖':'后屈探头尖');
  if(Math.abs(dT)>5) steps.push(dT>0?'探头右转':'探头左转');
  if(Math.abs(dO)>8) steps.push('多平面旋至约 '+to.omni+'°（现 '+Math.round(from.omni)+'°）');
  if(!steps.length) steps.push('已接近目标切面');
  return {steps, dDepth:dD, dFlex:dF, dTurn:dT, dOmni:dO};
}

function applyPreset(p, animate=true){
  const from={depth:S.depth,flex:S.flex,turn:S.turn,omni:S.omni,mod:S.modality};
  const guide=buildGuideSteps(from, {depth:p.depth,flex:p.flex,turn:p.turn,omni:p.omni,mod:p.mod||'TEE'});
  S.guide=guide; S.snap=p; S.modality=p.mod||'TEE';
  document.getElementById('guide').classList.add('on');
  document.getElementById('guideSteps').innerHTML=guide.steps.map((s,i)=>(i+1)+'. '+s).join('<br>');
  document.getElementById('tip').innerHTML='<b style="color:#7ec8ff">'+p.name+'</b>（'+p.en+'）'+(p.mod==='TTE'?' <span style="color:#8d8">TTE</span>':'')+'<br>'+p.tip+(p.intra?'<br><span style="color:#e0a050">术中：'+p.intra+'</span>':'');
  document.querySelectorAll('#presets button').forEach(b=>b.classList.toggle('on',b.dataset.id===p.id));
  highlightSegs(p.segs);

  if(animate){
    const t0=performance.now(), dur=900;
    const a0={depth:S.depth,flex:S.flex,turn:S.turn,omni:S.omni,body:S.bodyFade};
    S.anim={t0,dur,a0,p, fadeBody:true};
  }else{
    S.depth=p.depth;S.flex=p.flex;S.turn=p.turn;S.omni=p.omni; syncSliders();
  }
}
function tickAnim(now){
  const a=S.anim; if(!a) return;
  const u=Math.min(1,(now-a.t0)/a.dur); const e=1-Math.pow(1-u,3);
  S.depth=a.a0.depth+(a.p.depth-a.a0.depth)*e;
  S.flex=a.a0.flex+(a.p.flex-a.a0.flex)*e;
  S.turn=a.a0.turn+(a.p.turn-a.a0.turn)*e;
  S.omni=a.a0.omni+(a.p.omni-a.a0.omni)*e;
  if(a.fadeBody){ S.bodyFade=Math.max(0, a.a0.body*(1-e*0.85)); setBodyFade(S.bodyFade); $body.value=(S.bodyFade*100)|0; }
  syncSliders();
  if(u>=1){ S.anim=null; S.guide=buildGuideSteps({depth:S.depth,flex:S.flex,turn:S.turn,omni:S.omni,mod:S.modality},{depth:a.p.depth,flex:a.p.flex,turn:a.p.turn,omni:a.p.omni,mod:a.p.mod||'TEE'}); }
}

function buildPresets(){
  const box=document.getElementById('presets'); box.innerHTML='';
  PRESETS.forEach(p=>{
    const b=document.createElement('button'); b.dataset.id=p.id; if(p.mod==='TTE') b.classList.add('tte');
    const tag=p.mod==='TTE'?'TTE':depthLabel(p.depth,'TEE').split(' ')[0];
    b.innerHTML=p.name+'<small>'+(p.mod==='TTE'?tag:p.omni+'° · '+tag)+'</small>';
    b.onclick=()=>applyPreset(p,true); box.appendChild(b);
  });
}
buildPresets();

let quiz=null;
function startQuiz(){
  const panel=document.getElementById('quizPanel'); panel.classList.add('on');
  const pool=PRESETS.filter(p=>p.mod==='TEE');
  const ans=pool[(Math.random()*pool.length)|0]; quiz={ans};
  const q=document.getElementById('quizQ'), btns=document.getElementById('quizBtns'); btns.innerHTML='';
  applyPreset(ans,true); q.innerHTML='<b>测验：</b>当前是哪个标准切面？';
  const opts=[ans]; while(opts.length<4){const x=pool[(Math.random()*pool.length)|0]; if(!opts.find(o=>o.id===x.id))opts.push(x);}
  opts.sort(()=>Math.random()-0.5).forEach(o=>{
    const b=document.createElement('button'); b.textContent=o.name;
    b.onclick=()=>{if(o.id===ans.id){b.classList.add('ok');q.innerHTML='<b>正确！</b> '+ans.name;setTimeout(startQuiz,1100);}else{b.classList.add('bad');q.innerHTML='<b>不对。</b>答案是 '+ans.name;}};
    btns.appendChild(b);
  });
}
document.querySelectorAll('.tabs button').forEach(b=>{
  b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));b.classList.add('on');S.mode=b.dataset.mode;
    if(S.mode==='quiz')startQuiz();else{document.getElementById('quizPanel').classList.remove('on');quiz=null;}};
});

let drag=false,lx=0,ly=0;
wrap3.addEventListener('pointerdown',e=>{if(e.button)return;drag=true;lx=e.clientX;ly=e.clientY;wrap3.setPointerCapture(e.pointerId);});
wrap3.addEventListener('pointermove',e=>{if(!drag)return;S.camAz-=(e.clientX-lx)*0.008;S.camEl=Math.max(-1.2,Math.min(1.2,S.camEl+(e.clientY-ly)*0.006));lx=e.clientX;ly=e.clientY;});
wrap3.addEventListener('pointerup',()=>drag=false);
wrap3.addEventListener('wheel',e=>{e.preventDefault();S.camDist=Math.max(6,Math.min(30,S.camDist+e.deltaY*0.01));},{passive:false});
let pinch=null;
wrap3.addEventListener('touchstart',e=>{if(e.touches.length===2){const a=e.touches[0],b=e.touches[1];pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),dist:S.camDist};}},{passive:true});
wrap3.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch){const a=e.touches[0],b=e.touches[1];S.camDist=Math.max(6,Math.min(30,pinch.dist*(pinch.d/Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY))));}},{passive:true});
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
  tickAnim(now);
  const pose=probePose();
  syncPlaneVis(pose);
  updateGuideArrows(pose);
  cam.position.set(Math.cos(S.camEl)*Math.sin(S.camAz)*S.camDist, Math.sin(S.camEl)*S.camDist+0.8, Math.cos(S.camEl)*Math.cos(S.camAz)*S.camDist);
  cam.lookAt(0.3,0.8,0);
  if(S.path==='wma') wmaPatch.material.opacity=0.3+0.25*Math.sin(now*0.006);
  ren.render(scene,cam);
  updateLabels();
  const k=echoKey();
  if(echoDirty || k!==lastEchoKey || (nFrame%2)===0){ renderEcho(pose); lastEchoKey=k; echoDirty=false; }
  nFrame++;
}
setHalf(true); applyPathology(); highlightSegs([]); setBodyFade(1); syncSliders(); onResize();
applyPreset(PRESETS[0], false);
requestAnimationFrame(frame);
window.TEE={S,PRESETS,applyPreset,setBodyFade};
