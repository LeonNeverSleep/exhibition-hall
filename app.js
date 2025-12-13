const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById("scene-container").appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

camera.position.set(0, 20, 40);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const hallWidth = 10, hallDepth = 15, hallHeight = 15, wallThickness = 0.5;
const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0x191338 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x8191338 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }),
  pedestal: new THREE.MeshStandardMaterial({ color: 0xaa5a9c })
};

const floorGeometry = new THREE.CircleGeometry(15, 100);
const floor = new THREE.Mesh(floorGeometry, materials.floor);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

function createWall(width, height, depth, position, rotationY) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials.wall);
  wall.position.set(-13, 0, 2);
  if (rotationY !== undefined) wall.rotation.y = rotationY;
  wall.receiveShadow = true;
  scene.add(wall);
  return wall;
}

const leftWall = createWall(wallThickness, hallHeight, hallWidth, [-hallDepth / 2, hallHeight / 2, 0], Math.PI / 2);
const rightWall = createWall(wallThickness, hallHeight, hallWidth, [hallDepth / 2, hallHeight / 2, 0], -Math.PI / 2);

const newWallHeight = 10, newWallDepth = 3;
const newLeftWallPos = { x: -13.5, y: newWallHeight / 2, z: 3 };
const newRightWallPos = { x: 13.5, y: newWallHeight / 2, z: 1 };

leftWall.geometry.dispose();
leftWall.geometry = new THREE.BoxGeometry(wallThickness, newWallHeight, newWallDepth);
leftWall.position.set(newLeftWallPos.x, newWallHeight / 2, newLeftWallPos.z);

rightWall.geometry.dispose();
rightWall.geometry = new THREE.BoxGeometry(wallThickness, newWallHeight, newWallDepth);
rightWall.position.set(newRightWallPos.x, newWallHeight / 2, newRightWallPos.z);

function createDoubleArcWall(innerRadius, outerRadius, height, arcAngle, segments) {
  class ArcPath extends THREE.Curve {
    constructor(radius, angle) {
      super();
      this.radius = radius;
      this.angle = angle;
    }
    getPoint(t) {
      const theta = this.angle * t;
      return new THREE.Vector3(Math.cos(theta) * this.radius, 0, Math.sin(theta) * this.radius);
    }
  }

  const innerPath = new ArcPath(innerRadius, arcAngle);
  const outerPath = new ArcPath(outerRadius, arcAngle);
  const innerGeometry = new THREE.TubeGeometry(innerPath, segments, 0.05, 8, false);
  const outerGeometry = new THREE.TubeGeometry(outerPath, segments, 0.05, 8, false);
  const geometry = new THREE.BufferGeometry();
  const innerVertices = innerGeometry.attributes.position.array;
  const outerVertices = outerGeometry.attributes.position.array;
  const positions = [], normals = [];

  for (let i = 0; i < segments; i++) {
    const innerBase1 = new THREE.Vector3(innerVertices[i * 24], innerVertices[i * 24 + 1], innerVertices[i * 24 + 2]);
    const innerBase2 = new THREE.Vector3(innerVertices[(i + 1) * 24], innerVertices[(i + 1) * 24 + 1], innerVertices[(i + 1) * 24 + 2]);
    const outerBase1 = new THREE.Vector3(outerVertices[i * 24], outerVertices[i * 24 + 1], outerVertices[i * 24 + 2]);
    const outerBase2 = new THREE.Vector3(outerVertices[(i + 1) * 24], outerVertices[(i + 1) * 24 + 1], outerVertices[(i + 1) * 24 + 2]);
    const innerTop1 = innerBase1.clone().setY(height);
    const innerTop2 = innerBase2.clone().setY(height);
    const outerTop1 = outerBase1.clone().setY(height);
    const outerTop2 = outerBase2.clone().setY(height);

    positions.push(
      innerBase1.x, innerBase1.y, innerBase1.z, innerBase2.x, innerBase2.y, innerBase2.z, innerTop1.x, innerTop1.y, innerTop1.z,
      innerBase2.x, innerBase2.y, innerBase2.z, innerTop2.x, innerTop2.y, innerTop2.z, innerTop1.x, innerTop1.y, innerTop1.z,
      outerBase1.x, outerBase1.y, outerBase1.z, outerTop1.x, outerTop1.y, outerTop1.z, outerBase2.x, outerBase2.y, outerBase2.z,
      outerBase2.x, outerBase2.y, outerBase2.z, outerTop1.x, outerTop1.y, outerTop1.z, outerTop2.x, outerTop2.y, outerTop2.z,
      innerTop1.x, innerTop1.y, innerTop1.z, innerTop2.x, innerTop2.y, innerTop2.z, outerTop1.x, outerTop1.y, outerTop1.z,
      innerTop2.x, innerTop2.y, innerTop2.z, outerTop2.x, outerTop2.y, outerTop2.z, outerTop1.x, outerTop1.y, outerTop1.z,
      innerBase1.x, innerBase1.y, innerBase1.z, outerBase1.x, outerBase1.y, outerBase1.z, innerBase2.x, innerBase2.y, innerBase2.z,
      innerBase2.x, innerBase2.y, innerBase2.z, outerBase1.x, outerBase1.y, outerBase1.z, outerBase2.x, outerBase2.y, outerBase2.z
    );
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const uv = [];
  for (let i = 0; i < positions.length / 3; i++) {
    uv.push((i % segments) / segments, Math.floor(i / segments) / 6);
  }
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x6aaff2, side: THREE.DoubleSide }));
  return mesh;
}

const doubleArcWall = createDoubleArcWall(15, 15.2, 10, Math.PI * 1.2, 36);
doubleArcWall.rotation.y = Math.PI * 1.05;
scene.add(doubleArcWall);

const ceilingGeometry = new THREE.CircleGeometry(hallDepth / 2, 64);
ceilingGeometry.scale(1, hallWidth / hallDepth, 1);
const ceiling = new THREE.Mesh(ceilingGeometry, materials.ceiling);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = hallHeight;
ceiling.receiveShadow = true;
scene.add(ceiling);

const pedestalHeight = 0.5;
const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, pedestalHeight, 32), materials.pedestal);
pedestal.position.set(6, 0, -5);
pedestal.receiveShadow = true;
scene.add(pedestal);

const paintings = [
  { url: "assets/images/1.webp", position: [-hallDepth / 2 + wallThickness / 2 + 4, hallHeight / 2 + 1, -hallWidth / 4 - 11], rotation: [0, Math.PI, 0] },
  { url: "assets/images/2.webp", position: [-hallDepth / 2 + wallThickness / 2 - 2, hallHeight / 2 - 2, hallWidth / 4 - 13], rotation: [0, Math.PI, 0] },
  { url: "assets/images/3.webp", position: [hallDepth / 2 - wallThickness / 2 + 2, hallHeight / 2 + 1, hallWidth / 4 - 13], rotation: [0, Math.PI, 0] },
  { url: "assets/images/4.webp", position: [3, hallHeight / 2 - 2, -hallWidth / 2 + wallThickness / 2 - 8], rotation: [0, Math.PI, 0] }
];

const pictureSize = { width: 4, height: 3 };
const pictureMeshes = [], paintingGroups = [];

paintings.forEach((paint, index) => {
  const texture = new THREE.TextureLoader().load(paint.url, undefined, undefined, (error) => {
    console.error(`加载画作${index + 1}出错:`, error);
  });
  const pictureMat = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
  const frameWidth = pictureSize.width, frameHeight = pictureSize.height, frameDepth = 0.08, frameBevel = 0.1;
  const frameGeometry = new THREE.BoxGeometry(frameWidth + frameBevel * 2, frameHeight + frameBevel * 2, frameDepth);
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xf7d967, roughness: 0, metalness: 1 });
  const pictureGeometry = new THREE.PlaneGeometry(frameWidth - frameBevel * 0.5, frameHeight - frameBevel * 0.5);
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  const picture = new THREE.Mesh(pictureGeometry, pictureMat);
  frame.position.z = frameDepth / 2;
  picture.position.z = -frameDepth * 0.2;
  const painting = new THREE.Group();
  painting.name = `painting_${index}`;
  painting.add(frame);
  painting.add(picture);
  painting.position.set(...paint.position);
  painting.rotation.set(...paint.rotation);
  painting.castShadow = true;
  painting.receiveShadow = true;
  painting.scale.set(0.7, 0.7, 0.7);
  scene.add(painting);
  paintingGroups.push(painting);
  pictureMeshes.push(picture);
});

const envMapLoader = new THREE.CubeTextureLoader();
const envMap = envMapLoader.load([
  "./assets/images/px.webp", "./assets/images/nx.webp", "./assets/images/py.webp",
  "./assets/images/ny.webp", "./assets/images/pz.webp", "./assets/images/nz.webp"
]);
envMap.mapping = THREE.CubeReflectionMapping;
scene.environment = envMap;
scene.background = envMap;

let model, mixer, modelAnimations, modelScale = 1, animationPlayed = false, isOpen = false;
const loader = new THREE.GLTFLoader();

loader.load("assets/models/102.glb", (gltf) => {
  model = gltf.scene;
  model.scale.set(modelScale, modelScale, modelScale);
  model.rotation.y = Math.PI / -2;
  model.position.set(6, 4, -5);
  modelAnimations = gltf.animations;
  scene.add(model);
}, undefined, (error) => console.error("加载模型出错:", error));

let characterMixer;
loader.load("https://res.cloudinary.com/dbl12pode/image/upload/v1749052239/01_wc00sy.glb", (gltf) => {
  const character = gltf.scene;
  character.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  character.position.set(-0.5, 0.2, 2.0);
  character.scale.set(0.02, 0.02, 0.02);
  scene.add(character);
  characterMixer = new THREE.AnimationMixer(character);
  if (gltf.animations.length) characterMixer.clipAction(gltf.animations[0]).play();
});

const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const skidNorTextsure = textureLoader.load("https://res.cloudinary.com/diu6hubef/image/upload/v1748581388/Project%20Virtual%20Design%20and%20Animation/anti_skid_tiles_nor_gl_4k_isk6xd.jpg");
const skidArmTexture = textureLoader.load("https://res.cloudinary.com/diu6hubef/image/upload/v1748581389/Project%20Virtual%20Design%20and%20Animation/anti_skid_tiles_arm_4k_d4nbqt.jpg");
const skidColorTexture = textureLoader.load("https://res.cloudinary.com/diu6hubef/image/upload/v1748581391/Project%20Virtual%20Design%20and%20Animation/anti_skid_tiles_diff_4k_ks18gy.jpg");
const tableColorTextsure = textureLoader.load("https://res.cloudinary.com/diu6hubef/image/upload/v1748581383/Project%20Virtual%20Design%20and%20Animation/table_col_qyxezi.jpg");
const tableRoughnessTexture = textureLoader.load("https://res.cloudinary.com/diu6hubef/image/upload/v1748581384/Project%20Virtual%20Design%20and%20Animation/table_rou_ejxnka.jpg");

const stage = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.3, 64), new THREE.MeshPhysicalMaterial({
  color: "0xFFC0CB", metalness: 0.2, roughness: 0.4, clearcoat: 0.5, sheen: 0.3
}));
stage.receiveShadow = true;
stage.position.y = 0;
stage.material.map = skidColorTexture;
stage.material.normalMap = skidNorTextsure;
stage.material.roughnessMap = skidArmTexture;
stage.material.needsUpdate = true;
stage.scale.set(2, 2, 2);
stage.position.set(-6, 0, -5);
scene.add(stage);

const modelPaths = [
  "https://res.cloudinary.com/dbl12pode/image/upload/v1748954396/%E6%A1%8C%E5%AD%90%E7%BB%84%E5%90%88_e9bxo0.glb",
  "https://res.cloudinary.com/dbl12pode/image/upload/v1748958592/blender_cn_ure2lu.glb",
  "https://res.cloudinary.com/dbl12pode/image/upload/v1749049079/blender_cn_1_klzfgy.glb"
];

const modelTransforms = {
  [modelPaths[0]]: { position: [-6, 0, -4.6], rotation: [0, 0.9, 0], scale: [2, 2, 2] },
  [modelPaths[1]]: { position: [-5.9, 0.6, -5.9], rotation: [0, 0.4, 0], scale: [0.58, 0.58, 0.58] },
  [modelPaths[2]]: { position: [-6.2, 0, -5.9], rotation: [0, 1, 0], scale: [2.62, 2.62, 2.62] }
};

const decorativeModels = [], mixers = [];

function loadModel(path, index) {
  loader.load(path, (gltf) => {
    const model = gltf.scene;
    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        if (path.includes("table")) {
          obj.material.map = tableColorTextsure;
          obj.material.roughnessMap = tableRoughnessTexture;
          if (obj.material.map) {
            obj.material.map.wrapS = obj.material.map.wrapT = THREE.ClampToEdgeWrapping;
            obj.material.map.repeat.set(0, 0);
            obj.material.map.offset.set(0, 0);
          }
          if (obj.material.roughnessMap) {
            obj.material.roughnessMap.wrapS = obj.material.roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
            obj.material.roughnessMap.repeat.set(0, 0);
            obj.material.roughnessMap.offset.set(0, 0);
          }
        } else if (path.includes("big_speaker")) {
          if (obj.material.map) {
            obj.material.map.wrapS = obj.material.map.wrapT = THREE.ClampToEdgeWrapping;
            obj.material.map.repeat.set(1, 1);
            obj.material.map.offset.set(0, 0);
          }
          if (obj.material.roughnessMap) {
            obj.material.roughnessMap.wrapS = obj.material.roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
            obj.material.roughnessMap.repeat.set(1, 1);
            obj.material.roughnessMap.offset.set(0, 0);
          }
        }
        obj.material.needsUpdate = true;
      }
    });

    const transform = modelTransforms[path];
    if (transform) {
      model.position.set(...transform.position);
      model.rotation.set(...transform.rotation);
      model.scale.set(...transform.scale);
    } else {
      const angle = (index / modelPaths.length) * Math.PI * 2;
      const radius = 4;
      model.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    scene.add(model);
    decorativeModels.push(model);
    const mixer = new THREE.AnimationMixer(model);
    if (gltf.animations.length) {
      const action = mixer.clipAction(gltf.animations[0]);
      model.userData = { mixer, action, played: false };
      mixers.push(mixer);
    }
  });
}

modelPaths.forEach(loadModel);

let animationActions = [], isAnimating = false;

document.getElementById("open-btn").addEventListener("click", () => {
  const btn = document.getElementById("open-btn");
  if (isAnimating) {
    console.log("动画正在播放中，请等待...");
    return;
  }
  if (!model || !modelAnimations || modelAnimations.length === 0) {
    console.warn("动画无法播放:", { modelLoaded: !!model, hasAnimations: !!modelAnimations && modelAnimations.length > 0 });
    return;
  }
  if (!mixer) {
    mixer = new THREE.AnimationMixer(model);
    modelAnimations.forEach((anim) => {
      const action = mixer.clipAction(anim);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      animationActions.push(action);
    });
  }

  isAnimating = true;
  btn.disabled = true;
  btn.style.opacity = "0.5";
  btn.style.cursor = "not-allowed";

  if (!isOpen) {
    console.log("执行打开动画");
    let maxDuration = 0;
    animationActions.forEach((action, index) => {
      action.paused = false;
      action.timeScale = 1;
      action.reset();
      action.play();
      const duration = action.getClip().duration;
      maxDuration = Math.max(maxDuration, duration);
      console.log(`播放动画 ${index}: 时长 ${duration}s`);
    });
    btn.textContent = "CLOSE";
    isOpen = true;
    setTimeout(() => {
      isAnimating = false;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
      console.log("打开动画完成");
    }, maxDuration * 1000 + 100);
  } else {
    console.log("执行关闭动画（倒放）");
    const reversedActions = [...animationActions].reverse();
    let maxDuration = 0;
    reversedActions.forEach((action, index) => {
      action.timeScale = -1;
      action.time = action.getClip().duration;
      const duration = action.getClip().duration;
      if (index >= 6) {
        console.log(`动画 ${index} 时长小于1s，等待1460ms后播放`);
        setTimeout(() => {
          action.paused = false;
          action.play();
        }, 1460);
        maxDuration = Math.max(maxDuration, duration + 1.46);
      } else {
        action.paused = false;
        action.play();
        maxDuration = Math.max(maxDuration, duration);
      }
      console.log(`倒放动画 ${index}: 从 ${action.time}s 开始, timeScale=${action.timeScale},时长：${duration}s`);
    });
    btn.textContent = "OPEN";
    isOpen = false;
    setTimeout(() => {
      isAnimating = false;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
      console.log("关闭动画完成");
    }, maxDuration * 1000 + 100);
  }
});

let snow = null;
function createSnow() {
  const snowParticleCount = 2000, snowParticleSize = 0.1, snowAreaSize = 50;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff, size: snowParticleSize, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, sizeAttenuation: true, depthWrite: false
  });

  const positions = new Float32Array(snowParticleCount * 3);
  const sizes = new Float32Array(snowParticleCount);
  const rotations = new Float32Array(snowParticleCount);
  const speeds = new Float32Array(snowParticleCount);

  for (let i = 0; i < snowParticleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * snowAreaSize;
    positions[i * 3 + 1] = Math.random() * snowAreaSize;
    positions[i * 3 + 2] = (Math.random() - 0.5) * snowAreaSize;
    sizes[i] = snowParticleSize * (0.5 + Math.random() * 0.5);
    rotations[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.5 + Math.random() * 0.5;
  }

  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  particlesGeometry.setAttribute("rotation", new THREE.BufferAttribute(rotations, 1));
  particlesGeometry.setAttribute("speed", new THREE.BufferAttribute(speeds, 1));

  const snowParticles = new THREE.Points(particlesGeometry, particlesMaterial);
  snowParticles.frustumCulled = false;
  scene.add(snowParticles);

  return {
    object: snowParticles,
    update: function (delta) {
      const positions = snowParticles.geometry.attributes.position.array;
      const rotations = snowParticles.geometry.attributes.rotation.array;
      for (let i = 0; i < snowParticleCount; i++) {
        positions[i * 3 + 1] -= speeds[i] * delta * 30;
        rotations[i] += 0.001 * delta * 30;
        if (positions[i * 3 + 1] < -5) {
          positions[i * 3] = (Math.random() - 0.5) * snowAreaSize;
          positions[i * 3 + 1] = snowAreaSize;
          positions[i * 3 + 2] = (Math.random() - 0.5) * snowAreaSize;
        }
      }
      snowParticles.geometry.attributes.position.needsUpdate = true;
      snowParticles.geometry.attributes.rotation.needsUpdate = true;
    }
  };
}

snow = createSnow();

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (characterMixer) characterMixer.update(delta);
  if (snow) snow.update(delta);
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const audioElement = new Audio("./assets/preview.mp3");
audioElement.volume = 1.0;
audioElement.loop = true;
function toggleAudio() {
  if (audioElement.paused) {
    audioElement.play();
  } else {
    audioElement.pause();
  }
}
document.getElementById("ar-btn").addEventListener("click", toggleAudio);
