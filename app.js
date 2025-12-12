// import * as CANNON from "cannon-es";

// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  30, // 视野角度
  window.innerWidth / window.innerHeight, // 纵横比
  0.1, // 近剪裁面
  500 // 远剪裁面
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById("scene-container").appendChild(renderer.domElement);

// 添加光源
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// const spotLight = new THREE.SpotLight(0xffffff, 60);
// spotLight.angle = Math.PI/2; // 光照锥角（影响照射范围）
// spotLight.penumbra = 0.5; // 边缘柔化程度(0-1)
// scene.add(spotLight);

// 设置相机位置
camera.position.set(0, 20, 40);

// 添加轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 展馆尺寸参数
const hallWidth = 10; // 展馆宽度
const hallDepth = 15; // 展馆深度
const hallHeight = 15; // 展馆高度
const wallThickness = 0.5; // 墙壁厚度

// 创建材质
const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0x191338 }), // 墙壁材质
  floor: new THREE.MeshStandardMaterial({ color: 0x8191338 }), // 地面材质
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf0f0f0 }), // 天花板材质
  pedestal: new THREE.MeshStandardMaterial({ color: 0xaa5a9c }), // 圆台材质
};

// 创建圆形地面
const floorGeometry = new THREE.CircleGeometry(15, 100);
floorGeometry.scale(1, 1, 1); // 缩放为圆形
const floor = new THREE.Mesh(floorGeometry, materials.floor);
floor.rotation.x = -Math.PI / 2; // 旋转为水平面
floor.receiveShadow = true;
scene.add(floor);

// 创建两面墙壁
const leftWall = createWall(
  wallThickness,
  hallHeight,
  hallWidth,
  [-hallDepth / 2, hallHeight / 2, 0],
  Math.PI / 2
);
const rightWall = createWall(
  wallThickness,
  hallHeight,
  hallWidth,
  [hallDepth / 2, hallHeight / 2, 0],
  -Math.PI / 2
);

// 新尺寸
const newWallHeight = 10; // 新高度（Y轴）
const newWallDepth = 3; // 新长度（Z轴）
// 新位置参数
const newLeftWallPos = { x: -13.5, y: newWallHeight / 2, z: 3 };
const newRightWallPos = { x: 13.5, y: newWallHeight / 2, z: 1 };

// 更新左墙
leftWall.geometry.dispose(); // 释放旧几何体的内存
leftWall.geometry = new THREE.BoxGeometry(
  wallThickness,
  newWallHeight,
  newWallDepth
);
leftWall.position.y = newWallHeight / 2; // 确保底部贴地
leftWall.position.set(newLeftWallPos.x, newLeftWallPos.y, newLeftWallPos.z);

// 更新右墙
rightWall.geometry.dispose();
rightWall.geometry = new THREE.BoxGeometry(
  wallThickness,
  newWallHeight,
  newWallDepth
);
rightWall.position.y = newWallHeight / 2;
rightWall.position.set(newRightWallPos.x, newRightWallPos.y, newRightWallPos.z);

//弧形墙璧
function createDoubleArcWall(
  innerRadius,
  outerRadius,
  height,
  arcAngle,
  segments
) {
  // 参数说明：
  // innerRadius - 内半径
  // outerRadius - 外半径
  // height - 墙面高度
  // arcAngle - 弧形角度（弧度制）
  // segments - 分段数（提高曲面质量）

  // 创建自定义路径（圆弧路径）
  class ArcPath extends THREE.Curve {
    constructor(radius, angle) {
      super();
      this.radius = radius;
      this.angle = angle;
    }

    getPoint(t) {
      // t范围0-1对应0到arcAngle
      const theta = this.angle * t;
      return new THREE.Vector3(
        Math.cos(theta) * this.radius,
        0,
        Math.sin(theta) * this.radius
      );
    }
  }

  // 创建内外两条路径
  const innerPath = new ArcPath(innerRadius, arcAngle);
  const outerPath = new ArcPath(outerRadius, arcAngle);

  // 计算实际厚度
  const thickness = outerRadius - innerRadius;

  // 创建管状几何体
  const innerGeometry = new THREE.TubeGeometry(
    innerPath,
    segments, // 管状体分段数
    0.05, // 半径（这里设为固定小值）
    8, // 径向分段
    false // 是否闭合
  );

  const outerGeometry = new THREE.TubeGeometry(
    outerPath,
    segments,
    0.05,
    8,
    false
  );

  // 合并几何体
  const geometry = new THREE.BufferGeometry();

  // 创建侧面顶点数据
  const innerVertices = innerGeometry.attributes.position.array;
  const outerVertices = outerGeometry.attributes.position.array;

  const positions = [];
  const normals = [];

  // 构造侧面（两侧弯曲）
  for (let i = 0; i < segments; i++) {
    // 当前分段的内外4个顶点
    const innerBase1 = new THREE.Vector3(
      innerVertices[i * 24],
      innerVertices[i * 24 + 1],
      innerVertices[i * 24 + 2]
    );
    const innerBase2 = new THREE.Vector3(
      innerVertices[(i + 1) * 24],
      innerVertices[(i + 1) * 24 + 1],
      innerVertices[(i + 1) * 24 + 2]
    );

    const outerBase1 = new THREE.Vector3(
      outerVertices[i * 24],
      outerVertices[i * 24 + 1],
      outerVertices[i * 24 + 2]
    );
    const outerBase2 = new THREE.Vector3(
      outerVertices[(i + 1) * 24],
      outerVertices[(i + 1) * 24 + 1],
      outerVertices[(i + 1) * 24 + 2]
    );

    // 顶部的四个顶点
    const innerTop1 = innerBase1.clone().setY(height);
    const innerTop2 = innerBase2.clone().setY(height);
    const outerTop1 = outerBase1.clone().setY(height);
    const outerTop2 = outerBase2.clone().setY(height);

    // 构建两个三角形组成侧面四边形
    // 内侧弯曲面
    positions.push(
      innerBase1.x,
      innerBase1.y,
      innerBase1.z,
      innerBase2.x,
      innerBase2.y,
      innerBase2.z,
      innerTop1.x,
      innerTop1.y,
      innerTop1.z,

      innerBase2.x,
      innerBase2.y,
      innerBase2.z,
      innerTop2.x,
      innerTop2.y,
      innerTop2.z,
      innerTop1.x,
      innerTop1.y,
      innerTop1.z
    );

    // 外侧弯曲面
    positions.push(
      outerBase1.x,
      outerBase1.y,
      outerBase1.z,
      outerTop1.x,
      outerTop1.y,
      outerTop1.z,
      outerBase2.x,
      outerBase2.y,
      outerBase2.z,

      outerBase2.x,
      outerBase2.y,
      outerBase2.z,
      outerTop1.x,
      outerTop1.y,
      outerTop1.z,
      outerTop2.x,
      outerTop2.y,
      outerTop2.z
    );

    // 顶部和底部面
    positions.push(
      innerTop1.x,
      innerTop1.y,
      innerTop1.z,
      innerTop2.x,
      innerTop2.y,
      innerTop2.z,
      outerTop1.x,
      outerTop1.y,
      outerTop1.z,

      innerTop2.x,
      innerTop2.y,
      innerTop2.z,
      outerTop2.x,
      outerTop2.y,
      outerTop2.z,
      outerTop1.x,
      outerTop1.y,
      outerTop1.z,

      innerBase1.x,
      innerBase1.y,
      innerBase1.z,
      outerBase1.x,
      outerBase1.y,
      outerBase1.z,
      innerBase2.x,
      innerBase2.y,
      innerBase2.z,

      innerBase2.x,
      innerBase2.y,
      innerBase2.z,
      outerBase1.x,
      outerBase1.y,
      outerBase1.z,
      outerBase2.x,
      outerBase2.y,
      outerBase2.z
    );
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  // 计算法线
  geometry.computeVertexNormals();

  // 创建UV映射（用于纹理贴图）
  const uv = [];
  for (let i = 0; i < positions.length / 3; i++) {
    uv.push((i % segments) / segments, Math.floor(i / segments) / 6);
  }
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));

  // 创建网格
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x6aaff2,
      side: THREE.DoubleSide,
    })
  );

  return mesh;
}
// 电视屏幕
// const video = document.createElement("video");
// video.src =
//   "https://res.cloudinary.com/dbl12pode/video/upload/v1748955414/video_b5zkj9.mp4";
// video.loop = true;
// video.muted = true;
// video.autoplay = true;
// video.crossOrigin = "anonymous";
// video.playsInline = true;

// const videoTexture = new THREE.VideoTexture(video);
// videoTexture.minFilter = THREE.LinearFilter;
// videoTexture.magFilter = THREE.LinearFilter;
// videoTexture.format = THREE.RGBAFormat;

// const tvGeometry = new THREE.PlaneGeometry(15, 10);
// const tvMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
// const tvMesh = new THREE.Mesh(tvGeometry, tvMaterial);
// tvMesh.position.set(0, 15, -2.599);
// scene.add(tvMesh);

// const frameGeometry = new THREE.BoxGeometry(4.1, 2.35, 0.1);
// const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
// const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
// frameMesh.position.set(0, 2, -2.65);
// scene.add(frameMesh);

// video.addEventListener("canplay", () => video.play());

// 使用示例
const doubleArcWall = createDoubleArcWall(
  15, // 内半径10米
  15.2, // 外半径10.2米（厚度0.2米）
  10, // 高度10米
  Math.PI * 1.2, // 180度弧形
  36 // 分段数
);
scene.add(doubleArcWall);

// 如果需要让它朝向不同方向，可以修改旋转
doubleArcWall.rotation.y = Math.PI * 1.05; // PI是180度
scene.add(doubleArcWall);

// 创建椭圆天花板
const ceilingGeometry = new THREE.CircleGeometry(hallDepth / 2, 64);
ceilingGeometry.scale(1, hallWidth / hallDepth, 1);
const ceiling = new THREE.Mesh(ceilingGeometry, materials.ceiling);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = hallHeight;
ceiling.receiveShadow = true;
scene.add(ceiling);

// 创建圆台
const pedestalHeight = 0.5;
const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(5, 5, pedestalHeight, 32), //顶端半径，底端半径，高度，镜像分段数
  materials.pedestal
);
pedestal.position.set(0, pedestalHeight / 2, 0);
pedestal.receiveShadow = true;
pedestal.position.set(6, 0, -5);
scene.add(pedestal);

// 辅助函数：创建墙壁
function createWall(width, height, depth, position, rotationY) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    materials.wall
  );
  wall.position.set(-13, 0, 2);
  if (rotationY !== undefined) wall.rotation.y = rotationY;
  wall.receiveShadow = true;
  scene.add(wall);
  return wall;
}

// 加载4幅画作
const paintings = [
  {
    url: "assets/images/1.webp",
    position: [
      -hallDepth / 2 + wallThickness / 2 + 4,
      hallHeight / 2 + 1,
      -hallWidth / 4 - 11,
    ],
    rotation: [0, Math.PI, 0],
  },
  {
    url: "assets/images/2.webp",
    position: [
      -hallDepth / 2 + wallThickness / 2 - 2,
      hallHeight / 2 - 2,
      hallWidth / 4 - 13,
    ],
    rotation: [0, Math.PI, 0],
  },
  {
    url: "assets/images/3.webp",
    position: [
      hallDepth / 2 - wallThickness / 2 + 2,
      hallHeight / 2 + 1,
      hallWidth / 4 - 13,
    ],
    rotation: [0, Math.PI, 0],
  },
  {
    url: "assets/images/4.webp",
    position: [
      0 + 3,
      hallHeight / 2 - 2,
      -hallWidth / 2 + wallThickness / 2 - 8,
    ],
    rotation: [0, Math.PI, 0],
  },
];

const pictureSize = { width: 4, height: 3 }; // 画作初始尺寸
const pictureMeshes = [];
const paintingGroups = []; // 存储所有画作组

// 更新画作加载部分
paintings.forEach((paint, index) => {
  // 1. 加载画作纹理（添加错误处理）
  const texture = new THREE.TextureLoader().load(
    paint.url,
    undefined,
    undefined,
    (error) => {
      console.error(`加载画作${index + 1}出错:`, error);
      // 可以设置一个默认纹理作为后备
      const defaultColor = new THREE.Color(0x888888);
      pictureMat.color = defaultColor;
    }
  );

  const pictureMat = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });

  // 2. 创建画框参数
  const frameWidth = pictureSize.width;
  const frameHeight = pictureSize.height;
  const frameDepth = 0.08; // 画框厚度
  const frameBevel = 0.1; // 画框斜面宽度

  // 3. 创建画框几何体
  const frameGeometry = new THREE.BoxGeometry(
    frameWidth + frameBevel * 2,
    frameHeight + frameBevel * 2,
    frameDepth
  );

  // 4. 创建画框材质
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xf7d967, // 金色画框
    roughness: 0,
    metalness: 1,
  });

  // 5. 创建画作几何体
  const pictureGeometry = new THREE.PlaneGeometry(
    frameWidth - frameBevel * 0.5,
    frameHeight - frameBevel * 0.5
  );

  // 6. 创建组合对象
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  const picture = new THREE.Mesh(pictureGeometry, pictureMat);

  // 调整位置关系
  frame.position.z = frameDepth / 2;
  picture.position.z = -frameDepth * 0.2;

  // 创建组并添加
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

// Load environment map for realistic glass
const envMapLoader = new THREE.CubeTextureLoader();
const envMap = envMapLoader.load([
  "./assets/images/px.webp",
  "./assets/images/nx.webp",
  "./assets/images/py.webp",
  "./assets/images/ny.webp",
  "./assets/images/pz.webp",
  "./assets/images/nz.webp",
]);
envMap.mapping = THREE.CubeReflectionMapping;
scene.environment = envMap;
scene.background = envMap;
// const axesHelper = new THREE.AxesHelper(20);
// scene.add(axesHelper);
// 加载GLB模型
let model, mixer, modelAnimations;
const loader = new THREE.GLTFLoader();
let modelScale = 1;
let animationPlayed = false;
let isOpen = false; // 跟踪门的开关状态

loader.load(
  "assets/models/102.glb",
  (gltf) => {
    model = gltf.scene;
    model.scale.set(modelScale, modelScale, modelScale);
    model.rotation.y = Math.PI / -2; // 沿y轴旋转90度

    model.position.set(6, 4, -5); // 默认放在圆台上

    // 存储动画数据
    modelAnimations = gltf.animations;

    scene.add(model);
  },
  undefined,
  (error) => {
    console.error("加载模型出错:", error);
  }
);
let characterMixer;

loader.load(
  "https://res.cloudinary.com/dbl12pode/image/upload/v1749052239/01_wc00sy.glb",
  (gltf) => {
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
    if (gltf.animations.length)
      characterMixer.clipAction(gltf.animations[0]).play();

    // const charFolder = gui.addFolder("Character");
    // charFolder.add(character.position, "x", -5, 5, 0.1).name("Pos X");
    // charFolder.add(character.position, "y", 0, 5, 0.1).name("Pos Y");
    // charFolder.add(character.position, "z", -5, 5, 0.1).name("Pos Z");
    // charFolder
    //   .add(character.rotation, "y", -Math.PI, Math.PI, 0.1)
    //   .name("Rotation Y");
    // charFolder.open();
  }
);

// === Stage ===
// === Texture loader Loader ===
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const skidNorTextsure = textureLoader.load(
  "https://res.cloudinary.com/diu6hubef/image/upload/v1748581388/Project%20Virtual%20Design%20and%20Animation/anti_skid_tiles_nor_gl_4k_isk6xd.jpg"
);
const skidArmTexture = textureLoader.load(
  "https://res.cloudinary.com/diu6hubef/image/upload/v1748581389/Project%20Virtual%20Design%20and%20Animation/anti_skid_tiles_arm_4k_d4nbqt.jpg"
);
const skidColorTexture = textureLoader.load(
  "https://res.cloudinary.com/diu6hubef/image/upload/v1748581391/Project%20Virtual%20Design%20and%20Animation/anti_skid_tiles_diff_4k_ks18gy.jpg"
);
const tableColorTextsure = textureLoader.load(
  "https://res.cloudinary.com/diu6hubef/image/upload/v1748581383/Project%20Virtual%20Design%20and%20Animation/table_col_qyxezi.jpg"
);
const tableRoughnessTexture = textureLoader.load(
  "https://res.cloudinary.com/diu6hubef/image/upload/v1748581384/Project%20Virtual%20Design%20and%20Animation/table_rou_ejxnka.jpg"
);

const stage = new THREE.Mesh(
  new THREE.CylinderGeometry(2, 2, 0.3, 64),
  new THREE.MeshPhysicalMaterial({
    color: "0xFFC0CB",
    metalness: 0.2,
    roughness: 0.4,
    clearcoat: 0.5,
    sheen: 0.3,
  })
);
stage.receiveShadow = true;
stage.position.y = 0;
stage.material.map = skidColorTexture;
stage.material.normalMap = skidNorTextsure; // Use the normal map texture here
stage.material.roughnessMap = skidArmTexture; // Optional: add roughness map if desired
stage.material.needsUpdate = true;
stage.scale.set(2, 2, 2);
stage.position.set(-6, 0, -5);
scene.add(stage);
const modelPaths = [
  "https://res.cloudinary.com/dbl12pode/image/upload/v1748954396/%E6%A1%8C%E5%AD%90%E7%BB%84%E5%90%88_e9bxo0.glb",
  "https://res.cloudinary.com/dbl12pode/image/upload/v1748958592/blender_cn_ure2lu.glb",
  //   "https://res.cloudinary.com/dr573kjgr/image/upload/v1748866220/Refrigerator_z9fuhc.glb",
  "https://res.cloudinary.com/dbl12pode/image/upload/v1749049079/blender_cn_1_klzfgy.glb",
];
const modelTransforms = {
  "https://res.cloudinary.com/dbl12pode/image/upload/v1748954396/%E6%A1%8C%E5%AD%90%E7%BB%84%E5%90%88_e9bxo0.glb":
    {
      position: [-6, 0, -4.6],
      //   position: [-1, 0, 0.9],
      rotation: [0, 0.9, 0],
      //   scale: [1, 1, 1],
      scale: [2, 2, 2],
    },
  "https://res.cloudinary.com/dbl12pode/image/upload/v1748958592/blender_cn_ure2lu.glb":
    {
      //   position: [-0.9, 0.6, -0.4],
      position: [-5.9, 0.6, -5.9],
      rotation: [0, 0.4, 0],
      //   scale: [0.29, 0.29, 0.29],
      scale: [0.58, 0.58, 0.58],
    },
  //   "https://res.cloudinary.com/dr573kjgr/image/upload/v1748866220/Refrigerator_z9fuhc.glb":
  //     {
  //       position: [1.1, 0.8, -0.4],
  //       rotation: [0, -1.2, 0],
  //       scale: [0.29, 0.29, 0.29],
  //     },
  "https://res.cloudinary.com/dbl12pode/image/upload/v1749049079/blender_cn_1_klzfgy.glb":
    {
      position: [-6.2, 0, -5.9],
      //   position: [-1.2, 0, -0.4],
      rotation: [0, 1, 0],
      //   scale: [1.31, 1.31, 1.31],
      scale: [2.62, 2.62, 2.62],
    },
};
const decorativeModels = [];

function loadModel(path, index) {
  loader.load(path, (gltf) => {
    const model = gltf.scene;
    model.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        // Assign textures based on model path
        if (path.includes("table")) {
          obj.material.map = tableColorTextsure;
          obj.material.roughnessMap = tableRoughnessTexture;
          if (obj.material.map) {
            obj.material.map.wrapS = obj.material.map.wrapT =
              THREE.ClampToEdgeWrapping;
            obj.material.map.repeat.set(0, 0);
            obj.material.map.offset.set(0, 0);
          }
          if (obj.material.roughnessMap) {
            obj.material.roughnessMap.wrapS = obj.material.roughnessMap.wrapT =
              THREE.ClampToEdgeWrapping;
            obj.material.roughnessMap.repeat.set(0, 0);
            obj.material.roughnessMap.offset.set(0, 0);
          }
        } else if (path.includes("big_speaker")) {
          // Example: assign a different texture for the speaker
          if (obj.material.map) {
            obj.material.map.wrapS = obj.material.map.wrapT =
              THREE.ClampToEdgeWrapping;
            obj.material.map.repeat.set(1, 1);
            obj.material.map.offset.set(0, 0);
          }
          if (obj.material.roughnessMap) {
            obj.material.roughnessMap.wrapS = obj.material.roughnessMap.wrapT =
              THREE.ClampToEdgeWrapping;
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

    // createModelGUI(model, index);
    // if (++loadedModels === modelPaths.length) setupModelsGUI();
  });
}
modelPaths.forEach(loadModel);
// const stageFolder = gui.addFolder("Stage");
// stageFolder.add(stage.position, "y", 0, 1, 0.1).name("Height");
// stageFolder
//   .addColor({ color: "#333333" }, "color")
//   .name("Color")
//   .onChange((val) => stage.material.color.set(val));
// stageFolder.open();

// 存储所有动画action
let animationActions = [];
let isAnimating = false; // 标记是否正在播放动画

// OPEN按钮事件
document.getElementById("open-btn").addEventListener("click", () => {
  const btn = document.getElementById("open-btn");

  // 如果正在播放动画，禁止点击
  if (isAnimating) {
    console.log("动画正在播放中，请等待...");
    return;
  }

  if (!model || !modelAnimations || modelAnimations.length === 0) {
    console.warn("动画无法播放:", {
      modelLoaded: !!model,
      hasAnimations: !!modelAnimations && modelAnimations.length > 0,
    });
    return;
  }

  // 如果还没有创建混合器，先创建
  if (!mixer) {
    mixer = new THREE.AnimationMixer(model);
    // 创建所有动画action并保存
    modelAnimations.forEach((anim) => {
      const action = mixer.clipAction(anim);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      animationActions.push(action);
    });
  }

  // 禁用按钮，开始动画
  isAnimating = true;
  btn.disabled = true;
  btn.style.opacity = "0.5";
  btn.style.cursor = "not-allowed";

  if (!isOpen) {
    // 当前是关闭状态，执行打开动画（正序：抽屉先开，物体后飞出）
    console.log("执行打开动画");

    // 计算最长动画时长
    let maxDuration = 0;
    animationActions.forEach((action, index) => {
      action.paused = false;
      action.timeScale = 1; // 正向播放
      action.reset();
      action.play();
      const duration = action.getClip().duration;
      maxDuration = Math.max(maxDuration, duration);
      console.log(`播放动画 ${index}: 时长 ${duration}s`);
    });

    btn.textContent = "CLOSE";
    isOpen = true;

    // 动画播放完成后重新启用按钮
    setTimeout(() => {
      isAnimating = false;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
      console.log("打开动画完成");
    }, maxDuration * 1000 + 100); // 加100ms缓冲
  } else {
    // 当前是打开状态，执行关闭动画（倒序：物体先回去，抽屉后关闭）
    console.log("执行关闭动画（倒放）");
    // 创建倒序数组，不修改原数组
    const reversedActions = [...animationActions].reverse();

    let maxDuration = 0;
    reversedActions.forEach((action, index) => {
      action.timeScale = -1; // 倒放
      action.time = action.getClip().duration; // 从动画结束位置开始
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
      console.log(
        `倒放动画 ${index}: 从 ${action.time}s 开始, timeScale=${action.timeScale},时长：${duration}s`
      );
    });

    btn.textContent = "OPEN";
    isOpen = false;

    // 动画播放完成后重新启用按钮
    setTimeout(() => {
      isAnimating = false;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
      console.log("关闭动画完成");
    }, maxDuration * 1000 + 100); // 加100ms缓冲
  }
});
// document.getElementById("open-btn").addEventListener("dblclick", () => {
//   if (
//     model &&
//     modelAnimations &&
//     modelAnimations.length > 0 &&
//     !animationPlayed
//   ) {
//     // 创建动画混合器
//     mixer = new THREE.AnimationMixer(model);

//     // 获取并播放所有动画
//     modelAnimations.forEach((anim) => {
//       const action = mixer.clipAction(anim);
//       action.setLoop(THREE.LoopOnce, 1);
//       action.clampWhenFinished = true;
//       action.timeScale = -1
//       action.reset().play();
//       console.log(`播放动画: ${anim.name}, 时长: ${anim.duration}s`);
//     });

//     animationPlayed = true;
//   } else {
//     console.warn("动画无法播放:", {
//       modelLoaded: !!model,
//       hasAnimations: !!modelAnimations && modelAnimations.length > 0,
//       alreadyPlayed: animationPlayed,
//     });
//   }
// });
let snow = null;
function createSnow() {
  const snowParticleCount = 2000;
  const snowParticleSize = 0.1;
  const snowAreaSize = 50;

  const particlesGeometry = new THREE.BufferGeometry();
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: snowParticleSize,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: false,
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

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  particlesGeometry.setAttribute(
    "rotation",
    new THREE.BufferAttribute(rotations, 1)
  );
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
    },
  };
}
snow = createSnow();

// 动画循环
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

// 1. 修改各部分颜色
window.changeColor = {
  wall: (color) => {
    materials.wall.color.set(color);
  },
  floor: (color) => {
    materials.floor.color.set(color);
  },
  ceiling: (color) => {
    materials.ceiling.color.set(color);
  },
  pedestal: (color) => {
    materials.pedestal.color.set(color);
  },
};

// 2. 修改画作尺寸
window.setPaintingSize = (width, height) => {
  pictureSize.width = width;
  pictureSize.height = height;

  pictureMeshes.forEach((picture) => {
    picture.geometry.dispose();
    picture.geometry = new THREE.PlaneGeometry(width, height);
  });
};

// 3. 修改模型大小
window.setModelScale = (scale) => {
  modelScale = scale;
  if (model) model.scale.set(scale, scale, scale);
};

// 窗口大小调整
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
// function animate() {
//   requestAnimationFrame(animate);

//   // 更新动画混合器
//   if (mixer) mixer.update(0.01);

//   controls.update();
//   renderer.render(scene, camera);
// }

// 添加画作dat.GUI控制代码
function setupPaintingControls() {
  const gui = new dat.GUI({ width: 350 });
  gui.domElement.id = "gui"; // 给GUI设置ID方便样式调整

  // 为每幅画创建控制面板
  paintingGroups.forEach((group, index) => {
    const folder = gui.addFolder(`画作 ${index + 1}`);

    // 存储当前画作的位置和旋转
    const controller = {
      x: group.position.x,
      y: group.position.y,
      z: group.position.z,
      rotation: group.rotation.y * (180 / Math.PI), // 转为角度
      reset: function () {
        group.position.set(...paintings[index].position);
        group.rotation.set(...paintings[index].rotation);
        controller.x = group.position.x;
        controller.y = group.position.y;
        controller.z = group.position.z;
        controller.rotation = group.rotation.y * (180 / Math.PI);
        folder.updateDisplay();
      },
    };

    // 添加位置控制滑块
    folder
      .add(controller, "x", -15, 15, 0.1)
      .name("X 位置")
      .onChange((val) => {
        group.position.x = val;
        // 防止画作穿透墙壁
        if (index < 2) {
          // 左侧两幅画
          const maxX = -hallDepth / 2 + wallThickness / 2;
          if (val > maxX) group.position.x = maxX;
        } else if (index === 2) {
          // 右侧画作
          const minX = hallDepth / 2 - wallThickness / 2;
          if (val < minX) group.position.x = minX;
        }
      });

    folder
      .add(controller, "y", 0, hallHeight, 0.1)
      .name("Y 高度")
      .onChange((val) => {
        group.position.y = val;
      });

    folder
      .add(controller, "z", -hallWidth / 2, hallWidth / 2, 0.1)
      .name("Z 位置")
      .onChange((val) => {
        group.position.z = val;
      });

    // 添加旋转控制
    folder
      .add(controller, "rotation", -180, 180, 1)
      .name("旋转角度")
      .onChange((val) => {
        group.rotation.y = val * (Math.PI / 180);
      });

    // 重置按钮
    folder.add(controller, "reset").name("重置位置");

    folder.open(); // 默认展开
  });

  // 全局控制
  const globalControls = {
    resetAll: function () {
      paintingGroups.forEach((group, index) => {
        group.position.set(...paintings[index].position);
        group.rotation.set(...paintings[index].rotation);
      });
    },
  };

  gui.add(globalControls, "resetAll").name("重置所有画作");
}

// 添加相机dat.GUI控制代码
function setupCameraControls() {
  // 创建专属GUI文件夹
  const cameraGUI = new dat.GUI({ width: 300 });
  cameraGUI.domElement.id = "camera-gui"; // 给GUI分配ID方便样式控制

  // 存储相机初始目标点
  const cameraTarget = new THREE.Vector3();
  controls.target.copy(cameraTarget);

  // 控制参数对象
  const cameraParams = {
    positionX: camera.position.x,
    positionY: camera.position.y,
    positionZ: camera.position.z,
    targetX: controls.target.x,
    targetY: controls.target.y,
    targetZ: controls.target.z,
    fov: camera.fov,
    zoom: camera.zoom,
    reset: function () {
      // 重置为初始位置
      camera.position.set(12, 8, 12);
      controls.target.set(0, 1, 0);
      camera.fov = 30;
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      controls.update();
      updateCameraParams();
    },
  };

  // 更新参数的函数
  function updateCameraParams() {
    cameraParams.positionX = camera.position.x;
    cameraParams.positionY = camera.position.y;
    cameraParams.positionZ = camera.position.z;
    cameraParams.targetX = controls.target.x;
    cameraParams.targetY = controls.target.y;
    cameraParams.targetZ = controls.target.z;
    cameraParams.fov = camera.fov;
    cameraParams.zoom = camera.zoom;
  }

  // 位置控制器
  const posFolder = cameraGUI.addFolder("相机位置");
  posFolder
    .add(cameraParams, "positionX", -50, 50)
    .name("X轴")
    .onChange(updateCameraPosition);
  posFolder
    .add(cameraParams, "positionY", 0, 50)
    .name("Y轴")
    .onChange(updateCameraPosition);
  posFolder
    .add(cameraParams, "positionZ", -50, 50)
    .name("Z轴")
    .onChange(updateCameraPosition);
  posFolder.open();

  // 目标点控制器
  const targetFolder = cameraGUI.addFolder("观察目标");
  targetFolder
    .add(cameraParams, "targetX", -20, 20)
    .name("X轴")
    .onChange(updateCameraTarget);
  targetFolder
    .add(cameraParams, "targetY", 0, 20)
    .name("Y轴")
    .onChange(updateCameraTarget);
  targetFolder
    .add(cameraParams, "targetZ", -20, 20)
    .name("Z轴")
    .onChange(updateCameraTarget);
  targetFolder.open();

  // 镜头参数
  const lensFolder = cameraGUI.addFolder("镜头参数");
  lensFolder
    .add(cameraParams, "fov", 10, 120)
    .name("视野角度")
    .onChange(updateCameraFOV);
  lensFolder
    .add(cameraParams, "zoom", 0.1, 3)
    .name("缩放级别")
    .onChange(updateCameraZoom);
  lensFolder.open();

  // 添加重置按钮
  cameraGUI.add(cameraParams, "reset").name("重置相机");

  // 更新函数
  function updateCameraPosition() {
    camera.position.set(
      cameraParams.positionX,
      cameraParams.positionY,
      cameraParams.positionZ
    );
    controls.update(); // 必须更新控制器
  }

  function updateCameraTarget() {
    controls.target.set(
      cameraParams.targetX,
      cameraParams.targetY,
      cameraParams.targetZ
    );
    controls.update();
  }

  function updateCameraFOV() {
    camera.fov = cameraParams.fov;
    camera.updateProjectionMatrix();
  }

  function updateCameraZoom() {
    camera.zoom = cameraParams.zoom;
    camera.updateProjectionMatrix();
  }

  // 初始更新
  updateCameraParams();
}

// ========== AR功能实现 ==========
let xrSession = null;
let xrRefSpace = null;

// 初始化WebXR
async function initXR() {
  if (!navigator.xr) {
    console.error("WebXR not supported");
    alert("您的浏览器不支持WebXR，请使用最新版Chrome或Edge");
    return false;
  }

  try {
    // 检查是否支持AR
    const supported = await navigator.xr.isSessionSupported("immersive-ar");
    if (!supported) {
      console.error("AR not supported");
      alert("您的设备不支持AR功能");
      return false;
    }
    return true;
  } catch (error) {
    console.error("XR支持检查失败:", error);
    alert("无法检查AR支持状态");
    return false;
  }
}

// 进入AR模式
async function enterAR() {
  if (xrSession) return;

  try {
    // 创建AR会话
    xrSession = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["local"], // 基本AR功能
      optionalFeatures: ["hit-test"], // 可选特征
    });

    // 设置XR渲染器
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local");

    // 隐藏原有UI
    document.querySelector(".button-container").style.display = "none";
    document.getElementById("camera-gui").style.display = "none";
    document.getElementById("gui").style.display = "none";

    // 重新调整场景适应AR
    adjustSceneForAR();

    // 设置会话事件
    xrSession.addEventListener("end", onXRSessionEnded);

    // 创建参考空间
    xrRefSpace = await xrSession.requestReferenceSpace("local");

    // 启动XR渲染循环
    renderer.setAnimationLoop(onXRFrame);

    console.log("AR会话已启动");
  } catch (error) {
    console.error("AR会话启动失败:", error);
    alert(`无法启动AR: ${error.message}`);
  }
}

// 退出AR模式
async function exitAR() {
  if (!xrSession) return;

  try {
    // 结束会话
    await xrSession.end();
  } catch (error) {
    console.error("AR会话结束失败:", error);
  }
}

// AR会话结束处理
function onXRSessionEnded() {
  xrSession = null;
  xrRefSpace = null;

  // 恢复原有UI
  document.querySelector(".button-container").style.display = "flex";
  document.getElementById("camera-gui").style.display = "block";
  document.getElementById("gui").style.display = "block";

  // 恢复原有渲染
  renderer.setAnimationLoop(animate);
  console.log("AR会话已结束");
}

// 调整场景适应AR
function adjustSceneForAR() {
  // 隐藏或调整不适合AR的元素
  floor.visible = false;
  ceiling.visible = false;

  // 调整模型位置和大小
  if (model) {
    model.position.set(0, 0, -3);
    model.scale.set(0.5, 0.5, 0.5);
  }
}

// AR帧渲染
function onXRFrame(time, frame) {
  if (!xrSession || !frame) return;

  // 获取XR设备位姿
  const pose = frame.getViewerPose(xrRefSpace);
  if (!pose) return;

  // 更新相机位置
  for (let i = 0; i < pose.views.length; i++) {
    const view = pose.views[i];
    const viewport = renderer.xr.getViewport(view);

    camera = renderer.xr.getCamera(view);
    camera.matrix.fromArray(view.transform.matrix);
    camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);

    // 确保场景中的动画继续运行
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    renderer.render(scene, camera);
  }
}
// === Audio ===
const audioElement = new Audio("./assets/preview.mp3");
audioElement.volume = 1.0;
audioElement.loop = true

function toggleAudio() {
  if (audioElement.paused) {
    audioElement.play();
  } else {
    audioElement.pause();
  }
}
document.getElementById("ar-btn").addEventListener("click", toggleAudio);

// AR按钮事件处理
// document.getElementById("ar-btn").addEventListener("click",  function () {
//   if (xrSession) {
//     await exitAR();
//     this.textContent = "AR";
//   } else {
//     const isReady = await initXR();
//     if (isReady) {
//       await enterAR();
//       this.textContent = "退出AR";
//     }
//   }
// });

// 在初始化代码末尾添加
// setupPaintingControls(); // 画作控制GUI
// setupCameraControls(); // 相机控制GUI
animate(); // 动画循环
