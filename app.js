// TEEView-CN v1.0.0 — 经食管超声心动图标准切面教学模拟
// 坐标系（患者仰卧）：+X 患者左侧，+Y 头侧，+Z 前方
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const DEG=Math.PI/180;

// ---------- 探头状态 ----------
const S={depth:45,flex:0,turn:0,omni:0,labels:true,half:true,probe:true,mitral:true,planeVis:false,
 path:'none',mode:'learn',snap:null,camDist:14,camAz:0.9,camEl:0.35};

function depthLabel(d){
  if(d<22)return '上段食管 UE';
  if(d<70)return '中段食管 ME';
  return '经胃 TG';
}
function depthY(d){
  // d:0 UE高位 → 100 TG
  // 食管大致 y: 4.2 (UE) → 1.8 (ME) → -0.6 (TG 贲门附近)
  return 4.2 - d*0.048;
}

// ---------- ASE/SCA 常用 TEE 切面（约 20 个）----------
// depth 0-100, flex°, turn°, omni°, segs, tip, intraop
const PRESETS=[
 {id:'ME4C',name:'ME 四腔',en:'ME 4-Chamber',depth:48,flex:5,turn:0,omni:0,segs:['A2','P2'],
  tip:'中段食管 0°，显示 LA/LV/RA/RV。评估二尖瓣对合、室间隔、三尖瓣。',
  intra:'体外循环前基线；二尖瓣成形后对合评估常用。'},
 {id:'ME2C',name:'ME 两腔',en:'ME 2-Chamber',depth:48,flex:0,turn:0,omni:90,segs:['A1','A2','A3','P1','P2','P3'],
  tip:'约 90°，LA/LV，前后乳头肌与 A1–A3 / P1–P3 节段映射。',
  intra:'二尖瓣成形：明确病变节段（A1–P3）。'},
 {id:'MELAX',name:'ME 左心长轴',en:'ME LAX',depth:48,flex:0,turn:5,omni:120,segs:['A2','P2'],
  tip:'约 120–140°，LVOT、AV、升主近段、二尖瓣。',
  intra:'评估 SAM、LVOT 梗阻、AV 启闭。'},
 {id:'MEMC',name:'ME 二尖瓣交界',en:'ME Mitral Commissural',depth:48,flex:0,turn:0,omni:60,segs:['P1','A2','P3'],
  tip:'约 60°，P1–A2–P3「笑脸」观，定位交界区反流。',
  intra:'成形夹闭 / 交界缝合定位。'},
 {id:'MEAVSAX',name:'ME 主动脉短轴',en:'ME AV SAX',depth:42,flex:-5,turn:0,omni:35,segs:[],
  tip:'约 25–45°，三个主动脉窦（L/R/N）与左右冠开口平面。',
  intra:'AVR 前瓣叶/钙化；冠脉开口确认。'},
 {id:'MEAVLAX',name:'ME 主动脉长轴',en:'ME AV LAX',depth:42,flex:0,turn:5,omni:135,segs:['A2','P2'],
  tip:'约 120–135°，AV 启闭、主动脉根、LVOT 直径。',
  intra:'AVR / 根部手术测量环径与升主。'},
 {id:'MERVIO',name:'ME RV 流入流出',en:'ME RV In-Out',depth:45,flex:0,turn:-10,omni:60,segs:[],
  tip:'约 60–70°，TV、RVOT、肺动脉瓣区域。',
  intra:'三尖瓣成形、肺动脉瓣评估。'},
 {id:'MEBIC',name:'ME 双腔静脉',en:'ME Bicaval',depth:50,flex:10,turn:20,omni:100,segs:[],
  tip:'约 90–110°，SVC/IVC、IAS、卵圆窝。',
  intra:'房间隔缺损、腔静脉插管位置。'},
 {id:'MELAA',name:'ME 左心耳',en:'ME LAA',depth:40,flex:10,turn:-40,omni:60,segs:[],
  tip:'多平面扫左心耳，排除血栓（尤其房颤）。',
  intra:'体外循环前 / 电复律前排除 LAA 血栓。'},
 {id:'MEASC',name:'ME 升主短轴',en:'ME Asc Ao SAX',depth:38,flex:-10,turn:0,omni:0,segs:[],
  tip:'升主动脉短轴，配合长轴评估夹层/钙化。',
  intra:'升主插管前排除斑块与夹层。'},
 {id:'MEASCL',name:'ME 升主长轴',en:'ME Asc Ao LAX',depth:38,flex:-5,turn:5,omni:100,segs:[],
  tip:'升主动脉长轴，测量直径与内膜。',
  intra:'夹层累及范围、插管安全性。'},
 {id:'TGSAX',name:'TG 中段短轴',en:'TG Mid SAX',depth:82,flex:50,turn:0,omni:0,segs:[],
  tip:'经胃前屈，LV 乳头肌短轴，室壁运动十六节段。',
  intra:'停机后室壁运动、容量评估金标准。'},
 {id:'TGBASE',name:'TG 基底短轴',en:'TG Basal SAX',depth:78,flex:45,turn:0,omni:0,segs:['A1','A2','A3','P1','P2','P3'],
  tip:'稍退探头，二尖瓣水平短轴。',
  intra:'二尖瓣启闭对称性。'},
 {id:'TG2C',name:'TG 两腔',en:'TG 2-Chamber',depth:82,flex:40,turn:0,omni:90,segs:['A1','A2','A3','P3','P2','P1'],
  tip:'经胃 90°，下壁与前壁长轴。',
  intra:'下壁缺血、二尖瓣瓣下装置。'},
 {id:'TGLAX',name:'TG 长轴',en:'TG LAX',depth:82,flex:40,turn:10,omni:120,segs:['A2','P2'],
  tip:'经胃长轴，LVOT / AV。',
  intra:'跨 AV 血流、LVOT 梯度。'},
 {id:'DTG5C',name:'深TG 五腔',en:'Deep TG 5C',depth:95,flex:60,turn:0,omni:0,segs:[],
  tip:'深经胃，尽量平行 LVOT 血流。',
  intra:'连续多普勒测跨瓣压差（AS）。'},
 {id:'UEARCH',name:'UE 主动脉弓长轴',en:'UE Aortic Arch LAX',depth:12,flex:0,turn:-30,omni:0,segs:[],
  tip:'上段食管，主动脉弓长轴。',
  intra:'弓部分支、插管相关斑块。'},
 {id:'UEARCHS',name:'UE 主动脉弓短轴',en:'UE Aortic Arch SAX',depth:12,flex:0,turn:-20,omni:90,segs:[],
  tip:'弓短轴，常可及肺动脉。',
  intra:'肺动脉导管位置。'},
 {id:'MEDTG',name:'ME 五腔偏转',en:'ME 5-Chamber',depth:45,flex:15,turn:0,omni:0,segs:['A2','P2'],
  tip:'ME 四腔基础上轻度前屈显露 LVOT/AV。',
  intra:'快速扫 LVOT 与二尖瓣。'},
 {id:'METV',name:'ME 聚焦三尖瓣',en:'ME TV focused',depth:52,flex:5,turn:15,omni:0,segs:[],
  tip:'右转并略调角，聚焦三尖瓣对合。',
  intra:'三尖瓣反流程度与成形决策。'},
];

// ---------- 场景 ----------

function makeRen(wrap,clear){
  let r=null, last=null;
  const opts=[{antialias:true,powerPreference:'high-performance'},{antialias:false},{antialias:false,failIfMajorPerformanceCaveat:false}];
  for(const o of opts){
    try{ r=new THREE.WebGLRenderer(Object.assign({alpha:false},o)); if(r.getContext()) break; }catch(e){last=e;r=null;}
  }
  if(!r){ const d=document.createElement('div'); d.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:12px;padding:12px;text-align:center'; d.textContent='WebGL 不可用，切面 3D 无法显示'; wrap.appendChild(d);
    r={domElement:document.createElement('canvas'),setPixelRatio(){},setClearColor(){},setSize(){},render(){},getContext:()=>null}; }
  r.setPixelRatio&&r.setPixelRatio(Math.min(devicePixelRatio||1,2));
  r.setClearColor&&r.setClearColor(clear,1);
  if(r.domElement&&r.domElement.tagName==='CANVAS') wrap.appendChild(r.domElement);
  return r;
}

const wrap3=document.getElementById('v3d'), wrapX=document.getElementById('vx');
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0c1018,0.035);
const cam=new THREE.PerspectiveCamera(42,1,0.1,80);
const ren=makeRen(wrap3,0x0c1018);
const sceneX=new THREE.Scene();
const camX=new THREE.PerspectiveCamera(55,1,0.05,40);
const renX=makeRen(wrapX,0x050508);

const hemi=new THREE.HemisphereLight(0x9bb8d0,0x1a1010,0.85); scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff0e0,0.7); key.position.set(4,8,6); scene.add(key);
const fill=new THREE.DirectionalLight(0x6688aa,0.35); fill.position.set(-5,2,-3); scene.add(fill);

const hemiX=new THREE.HemisphereLight(0xffffff,0x222222,1.0); sceneX.add(hemiX);
const keyX=new THREE.DirectionalLight(0xffffff,0.55); keyX.position.set(2,4,3); sceneX.add(keyX);

// ---------- 材质 ----------
const matChamber=(hex,op=0.55)=>new THREE.MeshPhongMaterial({color:hex,transparent:true,opacity:op,shininess:30,side:THREE.DoubleSide,depthWrite:false});
const matSolid=(hex)=>new THREE.MeshPhongMaterial({color:hex,shininess:40,side:THREE.DoubleSide});
const matValve=(hex)=>new THREE.MeshPhongMaterial({color:hex,emissive:hex,emissiveIntensity:0.15,shininess:60,side:THREE.DoubleSide});
const matEcho=new THREE.MeshLambertMaterial({color:0xb0b8c0,side:THREE.DoubleSide});

// ---------- 心脏几何（简化示意）----------
const heart=new THREE.Group(); scene.add(heart);
const heartX=new THREE.Group(); sceneX.add(heartX);

function ellMesh(r,mat,pos,rot){
  const g=new THREE.SphereGeometry(1,28,20);
  g.scale(r[0],r[1],r[2]);
  const m=new THREE.Mesh(g,mat);
  if(pos)m.position.copy(pos);
  if(rot)m.rotation.set(rot[0],rot[1],rot[2]);
  return m;
}
function coneMesh(r0,r1,h,mat,pos,dir){
  const g=new THREE.CylinderGeometry(r1,r0,h,24,1,false);
  const m=new THREE.Mesh(g,mat);
  if(pos)m.position.copy(pos);
  if(dir){m.quaternion.setFromUnitVectors(V(0,1,0),dir.clone().normalize());}
  return m;
}

const COL={LV:0xc45a5a,RV:0x5a8ac4,LA:0xc48a5a,RA:0x5ac4a0,Ao:0xd0a070,LAA:0xe0a060,PA:0x7090c0,IAS:0xe0e080};

const LV=ellMesh([2.1,2.6,1.9],matChamber(COL.LV,0.5),V(1.2,-0.6,0.3)); LV.name='LV';
const RV=ellMesh([1.7,2.2,1.5],matChamber(COL.RV,0.45),V(-0.9,-0.4,1.2)); RV.name='RV';
const LA=ellMesh([1.6,1.2,1.35],matChamber(COL.LA,0.5),V(0.9,1.9,-1.6)); LA.name='LA';
const RA=ellMesh([1.4,1.5,1.3],matChamber(COL.RA,0.45),V(-1.8,1.0,-0.4)); RA.name='RA';
const LAA=ellMesh([0.55,0.9,0.45],matChamber(COL.LAA,0.65),V(2.2,2.3,0.2),[0.3,0.4,0.5]); LAA.name='LAA';
const Ao=coneMesh(1.05,0.85,3.2,matChamber(COL.Ao,0.45),V(-0.1,2.4,0.5),V(0.05,1,0.05)); Ao.name='Ao';
const LVOT=coneMesh(0.85,0.7,1.4,matChamber(0xb07070,0.4),V(0.3,0.9,0.55),V(-0.15,0.85,0.3)); LVOT.name='LVOT';
const PA=coneMesh(0.85,0.7,2.0,matChamber(COL.PA,0.4),V(0.6,3.2,1.5),V(0.3,0.7,0.4)); PA.name='PA';
// 房间隔
const IAS=new THREE.Mesh(new THREE.CircleGeometry(1.15,24),matChamber(COL.IAS,0.55));
IAS.position.set(-0.35,1.4,-0.9); IAS.rotation.y=Math.PI*0.35; IAS.name='IAS';

[LV,RV,LA,RA,LAA,Ao,LVOT,PA,IAS].forEach(m=>{heart.add(m); heartX.add(m.clone());});

// 二尖瓣六节段（环上扇形补丁）
const mitralGroup=new THREE.Group(); mitralGroup.name='mitral';
const mitralGroupX=new THREE.Group();
const SEG_COL={A1:0xff6b6b,A2:0xff9f43,A3:0xffd93d,P1:0x6bcb77,P2:0x4d96ff,P3:0x9b59b6};
const SEG_ANG={A1:[200,260],A2:[260,310],A3:[310,360],P3:[0,50],P2:[50,110],P1:[110,160]};
const segMeshes={}, segMeshesX={};
function makeSeg(name,a0,a1){
  const shape=new THREE.Shape();
  shape.moveTo(0,0);
  const n=10; for(let i=0;i<=n;i++){const t=a0+(a1-a0)*i/n; const r=1.05; shape.lineTo(Math.cos(t*DEG)*r,Math.sin(t*DEG)*r);}
  shape.lineTo(0,0);
  const g=new THREE.ShapeGeometry(shape);
  const mat=matValve(SEG_COL[name]); mat.transparent=true; mat.opacity=0.85;
  const m=new THREE.Mesh(g,mat); m.name=name;
  return m;
}
Object.keys(SEG_ANG).forEach(k=>{
  const [a0,a1]=SEG_ANG[k];
  const m=makeSeg(k,a0,a1); segMeshes[k]=m; mitralGroup.add(m);
  const mx=makeSeg(k,a0,a1); segMeshesX[k]=mx; mitralGroupX.add(mx);
});
mitralGroup.position.set(0.85,1.15,-0.55);
mitralGroup.rotation.set(-Math.PI*0.42,0.15,0.1);
mitralGroupX.position.copy(mitralGroup.position);
mitralGroupX.rotation.copy(mitralGroup.rotation);
heart.add(mitralGroup); heartX.add(mitralGroupX);

// 主动脉瓣三叶示意
const avGroup=new THREE.Group();
['L','R','N'].forEach((n,i)=>{
  const g=new THREE.CircleGeometry(0.55,16,i*2.094,2.0);
  const m=new THREE.Mesh(g,matValve(0xe8d0a0));
  m.position.set(-0.1,1.55,0.55); m.rotation.x=-Math.PI*0.15; avGroup.add(m);
});
heart.add(avGroup); heartX.add(avGroup.clone());

// 心包积液壳（病理）
const peShell=ellMesh([3.6,3.8,3.2],new THREE.MeshPhongMaterial({color:0x40a0e0,transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false}),V(0.3,0.2,0));
peShell.visible=false; heart.add(peShell);
const peShellX=peShell.clone(); peShellX.visible=false; heartX.add(peShellX);

// MR 反流喷射示意
const mrJet=new THREE.Mesh(new THREE.ConeGeometry(0.35,2.2,12),new THREE.MeshBasicMaterial({color:0x40ff90,transparent:true,opacity:0.55}));
mrJet.position.set(0.7,0.4,-0.2); mrJet.rotation.x=Math.PI; mrJet.visible=false; heart.add(mrJet);
const mrJetX=mrJet.clone(); mrJetX.visible=false; heartX.add(mrJetX);

// AS 狭窄环示意
const asRing=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.12,8,24),new THREE.MeshBasicMaterial({color:0xff5050}));
asRing.position.set(-0.1,1.55,0.55); asRing.rotation.x=Math.PI/2; asRing.visible=false; heart.add(asRing);
const asRingX=asRing.clone(); asRingX.visible=false; heartX.add(asRingX);

// 室壁运动异常：LV 前壁变暗闪烁
const wmaPatch=new THREE.Mesh(new THREE.SphereGeometry(0.9,16,12,0,Math.PI),new THREE.MeshBasicMaterial({color:0xff3030,transparent:true,opacity:0.45}));
wmaPatch.position.set(2.4,-0.4,0.5); wmaPatch.visible=false; heart.add(wmaPatch);
const wmaPatchX=wmaPatch.clone(); wmaPatchX.visible=false; heartX.add(wmaPatchX);

// ---------- 食管 + 探头 ----------
const eso=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,7.5,16),new THREE.MeshPhongMaterial({color:0x5a3040,transparent:true,opacity:0.35,side:THREE.DoubleSide}));
eso.position.set(0.15,1.0,-3.35); heart.add(eso);

const probeG=new THREE.Group();
const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,5.5,12),new THREE.MeshPhongMaterial({color:0xd0d8e0,metalness:0.3}));
shaft.position.y=2.0; probeG.add(shaft);
const tip=new THREE.Mesh(new THREE.SphereGeometry(0.28,12,10),new THREE.MeshPhongMaterial({color:0x4aa0ff,emissive:0x2266aa,emissiveIntensity:0.4}));
tip.position.y=-0.85; probeG.add(tip);
// 扫描扇面指示
const fanGeo=new THREE.CircleGeometry(3.2,32, -0.7, 1.4);
const fanMat=new THREE.MeshBasicMaterial({color:0x4aa0ff,transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false});
const fan=new THREE.Mesh(fanGeo,fanMat); fan.position.y=-0.85; probeG.add(fan);
const planeLine=new THREE.Mesh(new THREE.PlaneGeometry(0.02,6.0),new THREE.MeshBasicMaterial({color:0x7ec8ff,transparent:true,opacity:0.5,side:THREE.DoubleSide}));
planeLine.position.set(0,-0.85,0); probeG.add(planeLine);

scene.add(probeG);
const probeGX=probeG.clone(); sceneX.add(probeGX);

// 标签
const labels=[];
function addLabel(text,pos,parent){
  const div=document.createElement('div'); div.className='lbl'; div.textContent=text;
  div.style.cssText='position:absolute;font-size:10px;font-weight:600;color:#ffe84d;text-shadow:0 0 3px #000;pointer-events:none;white-space:nowrap;transform:translate(4px,-50%);display:none';
  wrap3.appendChild(div);
  labels.push({el:div,pos,parent:parent||heart});
}
addLabel('LV',V(1.2,-0.6,0.3));
addLabel('RV',V(-0.9,-0.4,1.2));
addLabel('LA',V(0.9,1.9,-1.6));
addLabel('RA',V(-1.8,1.0,-0.4));
addLabel('LAA',V(2.2,2.3,0.2));
addLabel('AV',V(-0.1,1.55,0.55));
addLabel('MV',V(0.85,1.15,-0.55));
addLabel('IAS',V(-0.35,1.4,-0.9));
addLabel('LVOT',V(0.3,0.9,0.55));
addLabel('食管',V(0.15,1.0,-3.35));

// 全屏按钮
function addFS(wrap){
  const b=document.createElement('button'); b.className='fsb'; b.textContent='⛶'; b.title='全屏';
  const z=document.createElement('button'); z.className='fsb zr'; z.textContent='⊕'; z.title='缩放手势';
  wrap.appendChild(z); wrap.appendChild(b);
  b.onclick=e=>{e.stopPropagation(); wrap.classList.toggle('full'); onResize();};
  z.onclick=e=>{e.stopPropagation(); wrap.classList.toggle('zm');};
}
addFS(wrap3); addFS(wrapX);

// ---------- 探头位姿 ----------
function probePose(){
  const y=depthY(S.depth);
  const base=V(0.15, y, -3.35);
  const flexR=S.flex*DEG, turnR=S.turn*DEG, omniR=S.omni*DEG;
  // 探头：管轴沿 Y；前屈绕 X（尖端朝前/患者腹侧）；左右转绕 Y；omni 绕管轴转扫描平面
  const q=new THREE.Quaternion();
  q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0,1,0), turnR));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1,0,0), -flexR));
  probeG.position.copy(base);
  probeG.quaternion.copy(q);
  fan.rotation.set(Math.PI/2, 0, omniR);
  planeLine.rotation.set(0, omniR, 0);
  probeGX.position.copy(base);
  probeGX.quaternion.copy(q);
  probeGX.children.forEach((c,i)=>{
    if(i===2) c.rotation.set(Math.PI/2,0,omniR);
    if(i===3) c.rotation.set(0,omniR,0);
  });
  const tipW=V(); tip.getWorldPosition(tipW);
  // 默认扫描朝向心脏中心（食管在后 → 朝前上方的心腔）
  const heartC=V(0.4, 0.9, 0.1);
  let look=heartC.clone().sub(tipW).normalize();
  const shaftAxis=V(0,1,0).applyQuaternion(q).normalize(); // 管轴（头侧）
  // omniplane：绕「朝心方向」旋转 up，模拟多平面角
  let up=shaftAxis.clone();
  // 使 look 与管轴正交分量保留，再绕 look 旋 omni
  const qOmni=new THREE.Quaternion().setFromAxisAngle(look, omniR);
  up.applyQuaternion(qOmni).normalize();
  // 平面法线
  const planeN=new THREE.Vector3().crossVectors(look, up).normalize();
  // 轻微前屈时 look 已朝心；后屈/经胃时 tip 更低，仍瞄向 heartC
  return {tip:tipW, look, up, planeN, forward:look.clone()};
}

function applyPathology(){
  const p=S.path;
  mrJet.visible=mrJetX.visible=(p==='mr');
  asRing.visible=asRingX.visible=(p==='as');
  wmaPatch.visible=wmaPatchX.visible=(p==='wma');
  peShell.visible=peShellX.visible=(p==='pe');
}

function highlightSegs(list){
  const set=new Set(list||[]);
  document.querySelectorAll('#segMap .s').forEach(el=>{
    el.classList.toggle('on', set.has(el.dataset.seg));
  });
  Object.keys(segMeshes).forEach(k=>{
    const on=set.has(k) || (S.mitral && set.size===0);
    const m=segMeshes[k], mx=segMeshesX[k];
    m.material.opacity=set.has(k)?0.95:(S.mitral?0.35:0.12);
    m.material.emissiveIntensity=set.has(k)?0.45:0.1;
    mx.material.opacity=m.material.opacity;
    mx.material.emissiveIntensity=m.material.emissiveIntensity;
    if(set.size && !set.has(k)){ m.material.opacity=0.12; mx.material.opacity=0.12; }
  });
}

function setHalf(h){
  heart.traverse(o=>{
    if(o.isMesh && o.material && o.material.transparent!==undefined && o!==peShell && o!==mrJet){
      if(o.parent===mitralGroup||o.parent===avGroup) return;
      if(o.material.opacity!==undefined && o.material.color){
        // chambers
      }
    }
  });
  [LV,RV,LA,RA,Ao,LVOT,PA,IAS,LAA].forEach(m=>{ m.material.opacity=h?0.48:0.92; m.material.depthWrite=!h; });
}

// ---------- 超声切面渲染（扇区遮罩 + 灰度）----------
const echoMatCache=[];
function toEchoMaterials(root){
  root.traverse(o=>{
    if(!o.isMesh) return;
    const c=o.material.color?o.material.color.clone():new THREE.Color(0x888888);
    const g=Math.min(1,0.25+0.55*(0.3*c.r+0.55*c.g+0.15*c.b));
    const gray=new THREE.Color(g*0.95,g,g*1.05);
    o.material=new THREE.MeshLambertMaterial({color:gray,transparent:false,opacity:1,side:THREE.DoubleSide});
  });
}
toEchoMaterials(heartX);

// 扇区 overlay canvas
const sector=document.createElement('canvas');
sector.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;mix-blend-mode:multiply;opacity:0.85';
sector.style.opacity='0.75';
wrapX.appendChild(sector);
const sctx=sector.getContext('2d');
const noise=document.createElement('canvas');
noise.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;mix-blend-mode:soft-light;opacity:0.28';
wrapX.appendChild(noise);
const nctx=noise.getContext('2d');

function drawSectorMask(){
  const w=wrapX.clientWidth,h=wrapX.clientHeight; if(w<2||h<2)return;
  if(sector.width!==w||sector.height!==h){sector.width=w;sector.height=h;noise.width=w;noise.height=h;}
  sctx.clearRect(0,0,w,h);
  sctx.fillStyle='#000'; sctx.fillRect(0,0,w,h);
  sctx.globalCompositeOperation='destination-out';
  sctx.beginPath();
  const cx=w*0.5, cy=h*0.12, R=Math.min(w,h)*0.95;
  sctx.moveTo(cx,cy);
  sctx.arc(cx,cy,R, Math.PI*0.18, Math.PI*0.82);
  sctx.closePath(); sctx.fill();
  sctx.globalCompositeOperation='source-over';
  // 轻微扫描线
  sctx.strokeStyle='rgba(120,160,200,0.08)';
  for(let a=0.2;a<0.8;a+=0.05){
    sctx.beginPath(); sctx.moveTo(cx,cy);
    sctx.lineTo(cx+Math.cos(a*Math.PI)*R, cy+Math.sin(a*Math.PI)*R); sctx.stroke();
  }
  // speckle noise
  const img=nctx.createImageData(w,h);
  for(let i=0;i<img.data.length;i+=4){
    const v=(Math.random()*255)|0;
    img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=40;
  }
  nctx.putImageData(img,0,0);
}

// ---------- UI ----------
const $depth=document.getElementById('depth'),$flex=document.getElementById('flex'),$turn=document.getElementById('turn'),$omni=document.getElementById('omni');
function syncSliders(){
  $depth.value=S.depth; $flex.value=S.flex; $turn.value=S.turn; $omni.value=S.omni;
  document.getElementById('depthV').textContent=depthLabel(S.depth);
  document.getElementById('flexV').textContent=(S.flex>0?'前屈 ':'后屈 ')+Math.abs(S.flex)+'°';
  document.getElementById('turnV').textContent=(S.turn>0?'右转 ':'左转 ')+Math.abs(S.turn)+'°';
  document.getElementById('omniV').textContent=S.omni+'°';
  const rd=document.getElementById('readout');
  rd.innerHTML=depthLabel(S.depth)+'<br>'+S.omni+'°';
  document.getElementById('vxBadge').textContent=(S.snap?S.snap.name+' · ':'')+S.omni+'° · '+depthLabel(S.depth);
}
['depth','flex','turn','omni'].forEach(id=>{
  document.getElementById(id).addEventListener('input',e=>{
    S[id]=+e.target.value; S.snap=null;
    document.querySelectorAll('#presets button').forEach(b=>b.classList.remove('on'));
    syncSliders();
  });
});

document.getElementById('tgL').onclick=function(){S.labels=!S.labels; this.classList.toggle('on',S.labels);};
document.getElementById('tgH').onclick=function(){S.half=!S.half; this.classList.toggle('on',S.half); setHalf(S.half);};
document.getElementById('tgP').onclick=function(){S.probe=!S.probe; this.classList.toggle('on',S.probe); probeG.visible=S.probe;};
document.getElementById('tgM').onclick=function(){S.mitral=!S.mitral; this.classList.toggle('on',S.mitral); mitralGroup.visible=S.mitral; highlightSegs(S.snap?S.snap.segs:[]);};
document.getElementById('tgPl').onclick=function(){S.planeVis=!S.planeVis; this.classList.toggle('on',S.planeVis); fan.visible=S.planeVis; planeLine.visible=S.planeVis;};
fan.visible=true; planeLine.visible=true; S.planeVis=true;
document.getElementById('tgPl').classList.add('on');

document.querySelectorAll('#paths .tg').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('#paths .tg').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); S.path=b.dataset.p; applyPathology();
  };
});

function applyPreset(p){
  S.depth=p.depth; S.flex=p.flex; S.turn=p.turn; S.omni=p.omni; S.snap=p;
  syncSliders(); highlightSegs(p.segs);
  document.getElementById('tip').innerHTML='<b style="color:#7ec8ff">'+p.name+'</b>（'+p.en+'）<br>'+p.tip+
    (p.intra?'<br><span style="color:#e0a050">术中：'+p.intra+'</span>':'');
  document.querySelectorAll('#presets button').forEach(b=>b.classList.toggle('on',b.dataset.id===p.id));
}

function buildPresets(){
  const box=document.getElementById('presets'); box.innerHTML='';
  PRESETS.forEach(p=>{
    const b=document.createElement('button'); b.dataset.id=p.id;
    b.innerHTML=p.name+'<small>'+p.omni+'° · '+depthLabel(p.depth).split(' ')[0]+'</small>';
    b.onclick=()=>applyPreset(p);
    box.appendChild(b);
  });
}
buildPresets();

// ---------- 测验 ----------
let quiz=null;
function startQuiz(){
  const panel=document.getElementById('quizPanel'); panel.classList.add('on');
  const type=Math.random()<0.55?'id':'drive';
  const ans=PRESETS[(Math.random()*PRESETS.length)|0];
  quiz={type,ans};
  const q=document.getElementById('quizQ'), btns=document.getElementById('quizBtns'); btns.innerHTML='';
  if(type==='id'){
    // 随机设到该切面，让用户辨认
    applyPreset(ans);
    q.innerHTML='<b>测验：</b>当前是哪个标准切面？';
    const opts=[ans];
    while(opts.length<4){const x=PRESETS[(Math.random()*PRESETS.length)|0]; if(!opts.find(o=>o.id===x.id))opts.push(x);}
    opts.sort(()=>Math.random()-0.5);
    opts.forEach(o=>{
      const b=document.createElement('button'); b.textContent=o.name;
      b.onclick=()=>{
        if(o.id===ans.id){b.classList.add('ok'); q.innerHTML='<b>正确！</b> '+ans.name+' — '+ans.tip; setTimeout(startQuiz,1200);}
        else {b.classList.add('bad'); q.innerHTML='<b>不对。</b>答案是 '+ans.name;};
      };
      btns.appendChild(b);
    });
  } else {
    q.innerHTML='<b>测验：</b>请把探头调到「'+ans.name+'」（'+ans.en+'）。调好多平面与深度后点「检查」。';
    const b=document.createElement('button'); b.textContent='检查';
    b.onclick=()=>{
      const ok=Math.abs(S.omni-ans.omni)<=15 && Math.abs(S.depth-ans.depth)<=18 && Math.abs(S.flex-ans.flex)<=25;
      if(ok){b.classList.add('ok'); q.innerHTML='<b>到位！</b> '+ans.tip; applyPreset(ans); setTimeout(startQuiz,1400);}
      else {b.classList.add('bad'); q.innerHTML='<b>还差一些。</b>目标约 '+ans.omni+'°、'+depthLabel(ans.depth)+'。再试试。'; setTimeout(()=>b.classList.remove('bad'),800);}
    };
    btns.appendChild(b);
    const skip=document.createElement('button'); skip.textContent='看答案';
    skip.onclick=()=>{applyPreset(ans); startQuiz();};
    btns.appendChild(skip);
  }
}
document.querySelectorAll('.tabs button').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); S.mode=b.dataset.mode;
    if(S.mode==='quiz') startQuiz();
    else {document.getElementById('quizPanel').classList.remove('on'); quiz=null;}
  };
});

// ---------- 交互：旋转 3D ----------
let drag=false,lx=0,ly=0;
wrap3.addEventListener('pointerdown',e=>{if(e.button!==0)return; drag=true; lx=e.clientX; ly=e.clientY; wrap3.setPointerCapture(e.pointerId);});
wrap3.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
  S.camAz-=dx*0.008; S.camEl=Math.max(-1.2,Math.min(1.2,S.camEl+dy*0.006));
});
wrap3.addEventListener('pointerup',()=>drag=false);
wrap3.addEventListener('wheel',e=>{e.preventDefault(); S.camDist=Math.max(6,Math.min(28,S.camDist+e.deltaY*0.01));},{passive:false});
let pinch=null;
wrap3.addEventListener('touchstart',e=>{
  if(e.touches.length===2){const a=e.touches[0],b=e.touches[1]; pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),dist:S.camDist};}
},{passive:true});
wrap3.addEventListener('touchmove',e=>{
  if(e.touches.length===2&&pinch){const a=e.touches[0],b=e.touches[1]; const d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
    S.camDist=Math.max(6,Math.min(28,pinch.dist*(pinch.d/d)));}
},{passive:true});
wrap3.addEventListener('touchend',()=>pinch=null);

// 回顶部
const toTop=document.getElementById('toTop');
window.addEventListener('scroll',()=>toTop.classList.toggle('show',scrollY>200),{passive:true});
toTop.onclick=()=>scrollTo({top:0,behavior:'smooth'});

// ---------- 尺寸 ----------
function sizeWrap(wrap,cam,ren){
  const w=wrap.clientWidth,h=wrap.clientHeight; if(w<2||h<2)return;
  cam.aspect=w/h; cam.updateProjectionMatrix();
  ren.setSize(w,h,false);
}
function onResize(){ sizeWrap(wrap3,cam,ren); sizeWrap(wrapX,camX,renX); drawSectorMask(); }
window.addEventListener('resize',onResize);
new ResizeObserver(onResize).observe(wrap3);
new ResizeObserver(onResize).observe(wrapX);

// ---------- 标签投影 ----------
function updateLabels(){
  labels.forEach(({el,pos})=>{
    if(!S.labels){el.style.display='none';return;}
    const v=pos.clone().project(cam);
    if(v.z>1){el.style.display='none';return;}
    const x=(v.x*0.5+0.5)*wrap3.clientWidth, y=(-v.y*0.5+0.5)*wrap3.clientHeight;
    if(x<0||y<0||x>wrap3.clientWidth||y>wrap3.clientHeight){el.style.display='none';return;}
    el.style.display='block'; el.style.left=x+'px'; el.style.top=y+'px';
  });
}

// ---------- 主循环 ----------
let t0=performance.now(), nFrame=0;
function frame(now){
  requestAnimationFrame(frame);
  const pose=probePose();
  // 3D 相机轨道
  cam.position.set(
    Math.cos(S.camEl)*Math.sin(S.camAz)*S.camDist,
    Math.sin(S.camEl)*S.camDist+0.8,
    Math.cos(S.camEl)*Math.cos(S.camAz)*S.camDist
  );
  cam.lookAt(0.3,0.8,0);

  // 超声相机：置于探头尖端，朝心脏看；近裁剪贴近探头
  camX.position.copy(pose.tip).addScaledVector(pose.look, 0.05);
  const tgt=pose.tip.clone().addScaledVector(pose.look, 8);
  camX.up.copy(pose.up);
  camX.lookAt(tgt);
  camX.fov=70; camX.near=0.08; camX.far=18; camX.updateProjectionMatrix();

  // WMA 闪烁
  if(S.path==='wma'){ const a=0.3+0.25*Math.sin(now*0.006); wmaPatch.material.opacity=a; wmaPatchX.material.opacity=a; }

  ren.render(scene,cam);
  renX.render(sceneX,camX);
  updateLabels();
  if((nFrame++%30)===0) drawSectorMask();
}
setHalf(true); applyPathology(); highlightSegs([]); syncSliders(); onResize();
applyPreset(PRESETS[0]);
requestAnimationFrame(frame);

// 导出供调试
window.TEE={S,PRESETS,applyPreset};
