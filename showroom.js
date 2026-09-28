/* Global Trade Motors: 3D car showroom (needs three.js r128, GLTFLoader, car-model.js, main.js) */
/* ===== 3D car showroom ===== */
(function(){
  const stage=$("carStage"), canvas=$("car3d"), loadingEl=$("carLoading");
  if(!stage) return;
  if(!window.THREE || !THREE.GLTFLoader){ loadingEl.textContent="3D view unavailable"; return; }
  let renderer;
  try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); }catch(_){ loadingEl.textContent="3D view unavailable"; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(26,1,.1,100);
  const target=new THREE.Vector3(0,.55,0);

  (function(){ // studio soft boxes baked into reflections
    const env=new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(20,32,16),new THREE.MeshBasicMaterial({color:0x0a1a2c,side:THREE.BackSide})));
    const box=(w,h,x,y,z,col,s)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(s),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m);};
    box(10,3.5,0,9,0,0xffffff,2.6);
    box(1.4,8,-9,3,3,0xffffff,2.0);
    box(1.4,8,9,3,-3,0xffffff,1.8);
    box(8,2.5,2,2,-10,0xe0a774,1.4);
    box(8,2.5,-2,1.5,10,0x7fb2e0,1.0);
    const f=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshBasicMaterial({color:0x14304c}));
    f.rotation.x=-Math.PI/2; f.position.y=-2; env.add(f);
    scene.environment=new THREE.PMREMGenerator(renderer).fromScene(env,.02).texture;
  })();
  scene.add(new THREE.HemisphereLight(0xdbe7f5,0x0b1a2a,.3));
  const key=new THREE.DirectionalLight(0xffffff,1.2);
  key.position.set(2.5,7,3.5); key.castShadow=true;
  key.shadow.mapSize.set(2048,2048); key.shadow.radius=5; key.shadow.bias=-.0004;
  Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:20});
  scene.add(key);

  // floor
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.55}));
  floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  const tex=(stops)=>{const c=document.createElement("canvas");c.width=c.height=256;const x=c.getContext("2d"),g=x.createRadialGradient(128,128,4,128,128,128);stops.forEach(s=>g.addColorStop(s[0],s[1]));x.fillStyle=g;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);};
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({map:tex([[0,"rgba(111,159,204,.32)"],[.45,"rgba(196,131,79,.10)"],[1,"rgba(0,0,0,0)"]]),transparent:true,depthWrite:false}));
  halo.rotation.x=-Math.PI/2; halo.position.y=.002; scene.add(halo);
  const ring=new THREE.Mesh(new THREE.RingGeometry(3.05,3.08,160),new THREE.MeshBasicMaterial({color:0xC4834F,transparent:true,opacity:.5}));
  ring.rotation.x=-Math.PI/2; ring.position.y=.003; scene.add(ring);

  // materials by part name in the model
  const M={
    paint:new THREE.MeshPhysicalMaterial({color:0x8E1B24,metalness:.55,roughness:.3,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:1.1}),
    black:new THREE.MeshPhysicalMaterial({color:0x0b0d10,metalness:.3,roughness:.35,clearcoat:.6,envMapIntensity:.8}),
    carbon:new THREE.MeshPhysicalMaterial({color:0x1a1d22,metalness:.6,roughness:.4,clearcoat:1,clearcoatRoughness:.1}),
    chrome:new THREE.MeshStandardMaterial({color:0xd7dde3,metalness:1,roughness:.12,envMapIntensity:1.3}),
    alu:new THREE.MeshStandardMaterial({color:0xb9c0c7,metalness:1,roughness:.3}),
    tire:new THREE.MeshStandardMaterial({color:0x111214,metalness:0,roughness:.85}),
    wheel:new THREE.MeshStandardMaterial({color:0x33383f,metalness:.9,roughness:.32,envMapIntensity:1.1}),
    glass:new THREE.MeshPhysicalMaterial({color:0x0a0f15,metalness:0,roughness:.02,transparent:true,opacity:.72,clearcoat:1,envMapIntensity:1.6}),
    lens:new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:0,transparent:true,opacity:.18,envMapIntensity:1.5,depthWrite:false}),
    led:new THREE.MeshBasicMaterial({color:0xf2f7ff}),
    tail:new THREE.MeshStandardMaterial({color:0x7a0a0a,emissive:0xff1a10,emissiveIntensity:1.4,roughness:.3})
  };
  Object.values(M).forEach(m=>{m.color.convertSRGBToLinear(); if(m.emissive) m.emissive.convertSRGBToLinear();});
  const pick=n=>{
    n=(n||"").toLowerCase();
    if(/^paint|gövde|car_paint/.test(n)) return M.paint;
    if(/glass_003/.test(n)) return M.lens;
    if(/glass/.test(n)) return M.glass;
    if(/tyyre|rubber/.test(n)) return M.tire;
    if(/steel/.test(n)) return M.chrome;
    if(/alumin|aliminyum/.test(n)) return M.alu;
    if(/karbon/.test(n)) return M.carbon;
    if(/led_light/.test(n)) return M.tail;
    if(/light_000|ışık/.test(n)) return M.led;
    return M.black;
  };

  const car=new THREE.Group(); scene.add(car);
  if(!window.GT_CAR_GLB){ loadingEl.textContent="3D view unavailable"; return; }
  const CAR_B64=window.GT_CAR_GLB;
  const carBuf=Uint8Array.from(atob(CAR_B64),ch=>ch.charCodeAt(0)).buffer;
  new THREE.GLTFLoader().parse(carBuf,"",g=>{
    const root=g.scene; root.updateMatrixWorld(true);
    const mirror=new THREE.Group(); mirror.scale.x=-1;
    const halves=[];
    root.traverse(o=>{
      if(!o.isMesh) return;
      const wheel=/teker/i.test(o.name+" "+(o.parent&&o.parent.name));
      const choose=m=>{const p=pick(m.name);return wheel&&p===M.chrome?M.wheel:p;};
      o.material=Array.isArray(o.material)?o.material.map(choose):choose(o.material);
      o.castShadow=true;
      const b=new THREE.Box3().setFromObject(o);
      if(b.min.x>-.02 || b.max.x<.02) halves.push(o);
    });
    halves.forEach(o=>{const c=o.clone();c.matrixAutoUpdate=false;c.matrix.copy(o.matrixWorld);mirror.add(c);});
    root.add(mirror);
    const holder=new THREE.Group(); holder.add(root);
    const box=new THREE.Box3().setFromObject(holder), size=box.getSize(new THREE.Vector3());
    const s=4.5/Math.max(size.x,size.z);
    holder.scale.setScalar(s);
    const b2=new THREE.Box3().setFromObject(holder), c2=b2.getCenter(new THREE.Vector3());
    holder.position.set(-c2.x,-b2.min.y,-c2.z);
    car.add(holder);
    const contact=new THREE.Mesh(new THREE.PlaneGeometry(2.6,5.2),new THREE.MeshBasicMaterial({map:tex([[0,"rgba(0,0,0,.8)"],[.6,"rgba(0,0,0,.35)"],[1,"rgba(0,0,0,0)"]]),transparent:true,depthWrite:false}));
    contact.rotation.x=-Math.PI/2; contact.position.y=.004; car.add(contact);
    loadingEl.hidden=true;
  },()=>{loadingEl.textContent="3D view unavailable";});

  document.querySelectorAll(".paint button").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".paint button").forEach(o=>o.setAttribute("aria-pressed",o===b));
    M.paint.color.set(b.dataset.c).convertSRGBToLinear();
  }));

  let yaw=.85, pitch=.2, drag=false, lx=0, ly=0, vel=0;
  stage.addEventListener("pointerdown",e=>{if(e.target.closest("button"))return;drag=true;lx=e.clientX;ly=e.clientY;});
  addEventListener("pointerup",()=>drag=false);
  addEventListener("pointermove",e=>{
    if(!drag) return;
    const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
    yaw-=dx*.008; vel=-dx*.0006; pitch=Math.min(Math.max(pitch+dy*.004,.04),.6);
  });
  let dist=11.5, fixedDist=0, frozen=false;
  function size(){
    const r=stage.getBoundingClientRect();
    renderer.setSize(r.width,r.height,false);
    cam.aspect=r.width/r.height; dist=cam.aspect<1.05?14:11.5; cam.updateProjectionMatrix();
  }
  size(); addEventListener("resize",size);
  let visible=true;
  new IntersectionObserver(([en])=>{visible=en.isIntersecting;}).observe(stage);
  function tick(){
    requestAnimationFrame(tick);
    if(!visible) return;
    if(!drag && !frozen){ if(!reduce) yaw+=.0025+vel; vel*=.94; }
    const d=fixedDist||dist;
    cam.position.set(Math.sin(yaw)*Math.cos(pitch)*d, target.y+Math.sin(pitch)*d, Math.cos(yaw)*Math.cos(pitch)*d);
    cam.lookAt(target);
    renderer.render(scene,cam);
  }
  tick();
  window.GT_SHOWROOM={set(o){if(o.yaw!=null)yaw=o.yaw;if(o.pitch!=null)pitch=o.pitch;if(o.dist!=null)fixedDist=o.dist;if(o.ty!=null)target.y=o.ty;if(o.tx!=null)target.x=o.tx;if(o.tz!=null)target.z=o.tz;if(o.paint)M.paint.color.set(o.paint).convertSRGBToLinear();if(o.fov)cam.fov=o.fov,cam.updateProjectionMatrix();frozen=true;},ready(){return loadingEl.hidden;}};
})();

