// ============================================================
// CẤU HÌNH TOÀN CỤC - Chỉnh sửa các giá trị này để tùy biến website
// ============================================================
const CONFIG = {
    name: "Mai Anh",
    username: "@love_for_you",
    message: "",
    showMessageBox: false,
    heartParticleCount: 16000,
    starCount: 1000,
    heartColor: "#ff69c9",
    rotationSpeed: 0.0015,
    enableMusic: true
};

// ============================================================
// PHÁT HIỆN THIẾT BỊ & TỰ ĐỘNG GIẢM CHẤT LƯỢNG
// ============================================================
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
const isLowEnd = isMobile && (navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : true);

// Tỷ lệ hạt thưa nhẹ, thanh thoát, tinh tế & mượt mà
const PARTICLE_SCALE = isLowEnd ? 0.35 : (isMobile ? 0.42 : 0.50);
const HEART_COUNT = Math.floor(CONFIG.heartParticleCount * PARTICLE_SCALE);
const STAR_COUNT = Math.floor(CONFIG.starCount * (isMobile ? 0.8 : 1.0));
const RING_TEXT_COUNT_MULTIPLIER = isLowEnd ? 0.6 : 1.0;
const MAX_PIXEL_RATIO = isLowEnd ? 1.3 : (isMobile ? 1.5 : 2.0);
const USE_BLOOM = !isLowEnd; // Tắt bloom trên thiết bị rất yếu để đỡ giật

// ============================================================
// KHỞI TẠO SCENE, CAMERA, RENDERER
// ============================================================
const canvas = document.getElementById('heart-canvas');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000005, 0.045); // Sương mù nhẹ tạo chiều sâu

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// Vị trí camera: đưa hướng nhìn trái tim lên cao hơn
camera.position.set(0, 1.25, 9.5);
camera.lookAt(0, 1.25, 0);

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: !isLowEnd,
    alpha: false,
    powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000005, 1);

// ============================================================
// HẬU KỲ - BLOOM (PHÁT SÁNG)
// ============================================================
let composer, bloomPass;
if (USE_BLOOM && typeof THREE.EffectComposer !== 'undefined') {
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        isMobile ? 0.75 : 0.95, // strength - độ mạnh phát sáng
        0.55,                    // radius
        0.18                     // threshold - ngưỡng sáng để bắt đầu bloom
    );
    composer.addPass(bloomPass);
}

// ============================================================
// HÀM TOÁN HỌC TẠO HÌNH TRÁI TIM 3D
// Dùng công thức tham số hóa trái tim (2D) rồi đùn thành khối 3D
// ============================================================
function heartShape2D(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: x, y: y };
}

function samplePointInHeart() {
    let x, y, z;
    const t = Math.random() * Math.PI * 2;
    const base = heartShape2D(t);
    const fillFactor = Math.sqrt(Math.random());

    x = base.x * fillFactor;
    y = base.y * fillFactor;

    const radialRatio = fillFactor;
    const depthAtCenter = 6.2;
    const zSpread = depthAtCenter * Math.sqrt(Math.max(0, 1 - radialRatio * radialRatio * 0.85));
    z = (Math.random() * 2 - 1) * zSpread;

    return { x, y, z, edgeFactor: fillFactor };
}

// ============================================================
// TẠO NHÓM HẠT TRÁI TIM (PARTICLE HEART)
// ============================================================
const HEART_SCALE = 0.19;
const HEART_Y_OFFSET = 1.05; // Đưa vị trí trái tim và góc nhìn vừa vặn cân đối

const heartGeometry = new THREE.BufferGeometry();
const heartPositions = new Float32Array(HEART_COUNT * 3);
const heartColors = new Float32Array(HEART_COUNT * 3);
const heartSizes = new Float32Array(HEART_COUNT);
const heartBasePositions = new Float32Array(HEART_COUNT * 3);
const heartRandomPhase = new Float32Array(HEART_COUNT);
const heartEdgeFactors = new Float32Array(HEART_COUNT);

// Bảng màu hồng đậm đà, tươi thắm & rực rỡ
const heartPalette = [
    new THREE.Color(0xff3385), // hồng nồng thắm
    new THREE.Color(0xff4d94), // hồng tươi rực rỡ
    new THREE.Color(0xff66b2), // hồng phấn tươi
    new THREE.Color(0xff80bf), // hồng ngọc
    new THREE.Color(0xff1a75), // hồng đậm quyến rũ
];

for (let i = 0; i < HEART_COUNT; i++) {
    const p = samplePointInHeart();

    const px = p.x * HEART_SCALE;
    const py = p.y * HEART_SCALE + HEART_Y_OFFSET;
    const pz = p.z * HEART_SCALE;

    heartPositions[i * 3] = px;
    heartPositions[i * 3 + 1] = py;
    heartPositions[i * 3 + 2] = pz;

    heartBasePositions[i * 3] = px;
    heartBasePositions[i * 3 + 1] = py;
    heartBasePositions[i * 3 + 2] = pz;

    heartRandomPhase[i] = Math.random() * Math.PI * 2;
    heartEdgeFactors[i] = p.edgeFactor;

    // Chọn màu: viền ngoài màu hồng tươi rực rỡ, bên trong đậm đà rõ nét
    let color;
    if (p.edgeFactor > 0.78) {
        // Viền ngoài - màu hồng tươi ngọt ngào & rõ nét
        color = Math.random() > 0.4 ? new THREE.Color(0xff1a75) : new THREE.Color(0xff3385);
        color.multiplyScalar(1.5);
        heartSizes[i] = (0.12 + Math.random() * 0.14) * 1.5;
    } else if (p.edgeFactor > 0.45) {
        const pick = Math.random();
        color = pick < 0.4 ? heartPalette[0].clone() : (pick < 0.75 ? heartPalette[1].clone() : heartPalette[4].clone());
        color.multiplyScalar(1.25);
        heartSizes[i] = (0.08 + Math.random() * 0.09) * 1.1;
    } else {
        // Tâm bên trong - hồng đậm nét, không mờ nhạt
        const pick = Math.random();
        color = pick < 0.15 ? heartPalette[3].clone() : (pick < 0.55 ? heartPalette[0].clone() : heartPalette[1].clone());
        color.multiplyScalar(1.0);
        heartSizes[i] = (0.07 + Math.random() * 0.08) * 1.0;
    }

    heartColors[i * 3] = color.r;
    heartColors[i * 3 + 1] = color.g;
    heartColors[i * 3 + 2] = color.b;
}

heartGeometry.setAttribute('position', new THREE.BufferAttribute(heartPositions, 3));
heartGeometry.setAttribute('color', new THREE.BufferAttribute(heartColors, 3));
heartGeometry.setAttribute('size', new THREE.BufferAttribute(heartSizes, 1));

// Shader tùy chỉnh: độ hiển thị alpha & lõi phát sáng rực rỡ, rõ nét
const heartParticleVertexShader = `
    attribute float size;
    varying vec3 vColor;
    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const heartParticleFragmentShader = `
    varying vec3 vColor;
    void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        float alpha = smoothstep(0.5, 0.02, dist) * 0.85;
        float core = smoothstep(0.25, 0.0, dist) * 0.45;
        vec3 finalColor = vColor + vec3(core);
        gl_FragColor = vec4(finalColor, alpha);
    }
`;

const heartParticleMaterial = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: heartParticleVertexShader,
    fragmentShader: heartParticleFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
});

const heartParticles = new THREE.Points(heartGeometry, heartParticleMaterial);

// Nhóm chứa trái tim 3D
const heartGroup = new THREE.Group();
heartGroup.add(heartParticles);

// ============================================================
// CHỮ "MAI ANH" TRONG CHÍNH GIỮA TÂM TRÁI TIM 3D
// ============================================================
function createCenterNameSprite(nameText) {
    const canvasEl = document.createElement('canvas');
    const ctx = canvasEl.getContext('2d');
    const scale = 2;
    const fontSize = 68;
    ctx.font = `bold ${fontSize * scale}px "Segoe UI", Roboto, sans-serif`;
    const metrics = ctx.measureText(nameText);
    const padding = 26 * scale;
    canvasEl.width = metrics.width + padding * 2;
    canvasEl.height = fontSize * scale + padding * 2;

    ctx.font = `bold ${fontSize * scale}px "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Đổ bóng phát sáng màu hồng nhẹ tinh tế phía sau chữ
    ctx.shadowColor = '#ff85c2';
    ctx.shadowBlur = 24 * scale;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nameText, canvasEl.width / 2, canvasEl.height / 2);

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8 * scale;
    ctx.fillText(nameText, canvasEl.width / 2, canvasEl.height / 2);

    const texture = new THREE.CanvasTexture(canvasEl);
    texture.needsUpdate = true;
    return { texture, aspect: canvasEl.width / canvasEl.height };
}

const centerNameData = createCenterNameSprite(CONFIG.name || "Mai Anh");
const centerNameMaterial = new THREE.SpriteMaterial({
    map: centerNameData.texture,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const centerNameSprite = new THREE.Sprite(centerNameMaterial);
const centerNameHeight = 0.66;
centerNameSprite.scale.set(centerNameHeight * centerNameData.aspect, centerNameHeight, 1);
centerNameSprite.position.set(0, HEART_Y_OFFSET, 0.1); // Nằm ở tâm trái tim
heartGroup.add(centerNameSprite);

// Nhóm cha chứa TOÀN BỘ khung cảnh tương tác được (trái tim + vòng chữ + dòng hạt)
// Dùng để nghiêng theo chuột / xoay theo kéo thả áp dụng cho cả cảnh, không chỉ riêng trái tim
const worldGroup = new THREE.Group();
worldGroup.add(heartGroup);
scene.add(worldGroup);

// ============================================================
// VÒNG XOÁY CHỮ PHÍA DƯỚI (TEXT RING / DISC)
// Tạo bằng sprite chữ vẽ lên canvas 2D rồi dùng làm texture
// ============================================================
const ringWords = [
    "Anh yêu em", "Love", "Mãi bên nhau", "Nhớ em", "Thương em",
    "Em là duy nhất", "My love", "Forever", "Yêu em rất nhiều",
    "Bên em", "Hạnh phúc", "Trái tim", "Nụ cười", "Cảm ơn em",
    CONFIG.name
];
const ringEmojis = ["❤️", "💗", "💕", "🌸", "✨", "🥰", "😘"];

// Hàm tạo texture chữ từ canvas 2D
function createTextSprite(text, color, fontSize = 64) {
    const canvasEl = document.createElement('canvas');
    const ctx = canvasEl.getContext('2d');
    const scaleFactor = 2; // Tăng độ nét
    ctx.font = `600 ${fontSize * scaleFactor}px "Segoe UI", Arial, sans-serif`;
    const metrics = ctx.measureText(text);
    const padding = 20 * scaleFactor;
    canvasEl.width = metrics.width + padding * 2;
    canvasEl.height = fontSize * scaleFactor + padding * 2;

    ctx.font = `600 ${fontSize * scaleFactor}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow phía sau chữ
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 * scaleFactor;
    ctx.fillStyle = color;
    ctx.fillText(text, canvasEl.width / 2, canvasEl.height / 2);
    // Vẽ lại để chữ đậm nét hơn phía trên glow
    ctx.shadowBlur = 6 * scaleFactor;
    ctx.fillText(text, canvasEl.width / 2, canvasEl.height / 2);

    const texture = new THREE.CanvasTexture(canvasEl);
    texture.needsUpdate = true;
    return { texture, aspect: canvasEl.width / canvasEl.height };
}

const textColors = ["#ffffff", "#ffd6ee", "#ffe0f0", "#ffb8e0"];

// Số vòng đồng tâm và số item mỗi vòng
const RING_LAYERS = [
    { radius: 2.0, count: Math.floor(10 * RING_TEXT_COUNT_MULTIPLIER), scale: 0.75, opacity: 1.0, speed: 1.0, yJitter: 0.15 },
    { radius: 2.7, count: Math.floor(13 * RING_TEXT_COUNT_MULTIPLIER), scale: 0.55, opacity: 0.75, speed: -0.7, yJitter: 0.25 },
    { radius: 3.4, count: Math.floor(15 * RING_TEXT_COUNT_MULTIPLIER), scale: 0.42, opacity: 0.5, speed: 0.5, yJitter: 0.35 },
];

const ringGroup = new THREE.Group();
ringGroup.position.y = -1.1; // Vị trí đĩa chữ bên dưới trái tim
const ringSprites = []; // Lưu để animate

let wordPool = [...ringWords, ...ringEmojis, ...ringEmojis]; // Nhân đôi emoji để rải đều hơn

RING_LAYERS.forEach((layer, layerIndex) => {
    const layerGroup = new THREE.Group();
    layerGroup.userData.speed = layer.speed * CONFIG.rotationSpeed * 60;
    layerGroup.userData.baseY = 0;

    for (let i = 0; i < layer.count; i++) {
        const word = wordPool[Math.floor(Math.random() * wordPool.length)];
        const color = textColors[Math.floor(Math.random() * textColors.length)];
        const isEmoji = ringEmojis.includes(word);
        const { texture, aspect } = createTextSprite(word, color, isEmoji ? 80 : 56);

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: layer.opacity,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
        const sprite = new THREE.Sprite(material);

        const baseHeight = 0.42 * layer.scale;
        sprite.scale.set(baseHeight * aspect, baseHeight, 1);

        const angle = (i / layer.count) * Math.PI * 2 + Math.random() * 0.2;
        const radius = layer.radius + (Math.random() - 0.5) * 0.3;
        const yPos = (Math.random() - 0.5) * layer.yJitter;

        sprite.position.set(
            Math.cos(angle) * radius,
            yPos,
            Math.sin(angle) * radius
        );

        sprite.userData.angle = angle;
        sprite.userData.radius = radius;
        sprite.userData.baseY = yPos;
        sprite.userData.bobPhase = Math.random() * Math.PI * 2;
        sprite.userData.layerIndex = layerIndex;
        sprite.userData.baseOpacity = layer.opacity;

        layerGroup.add(sprite);
        ringSprites.push(sprite);
    }
    ringGroup.add(layerGroup);
});

worldGroup.add(ringGroup);
ringGroup.scale.set(0.001, 0.001, 0.001); // Bắt đầu ẩn để chạy hiệu ứng xuất hiện

// ============================================================
// DÒNG HẠT VÀ CHỮ BAY LÊN (ĐÃ BỎ THEO YÊU CẦU NGUỜI DÙNG)
// ============================================================
const STREAM_COUNT = 0;
const streamGeometry = new THREE.BufferGeometry();
const streamParticles = new THREE.Points(streamGeometry, new THREE.PointsMaterial({ visible: false }));

function updateStreamParticles(delta, elapsed) {
    // Đã xóa dải hạt bay xuống
}

// ============================================================
// NỀN VŨ TRỤ - CÁC NGÔI SAO Ở NHIỀU ĐỘ SÂU
// ============================================================
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(STAR_COUNT * 3);
const starColors = new Float32Array(STAR_COUNT * 3);
const starSizes = new Float32Array(STAR_COUNT);
const starTwinklePhase = new Float32Array(STAR_COUNT);
const starTwinkleSpeed = new Float32Array(STAR_COUNT);
const starDepth = new Float32Array(STAR_COUNT); // Dùng cho parallax

const starPalette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xffe0f0),
    new THREE.Color(0xe8d5ff),
];

for (let i = 0; i < STAR_COUNT; i++) {
    // Phân bố hình cầu lớn bao quanh camera để tạo chiều sâu
    const radius = 15 + Math.random() * 45;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta) * 0.6; // Hơi dẹt theo Y để sao không quá xa phía trên/dưới
    const z = radius * Math.cos(phi) - 10;

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    starDepth[i] = radius;

    const color = starPalette[Math.floor(Math.random() * starPalette.length)];
    starColors[i * 3] = color.r;
    starColors[i * 3 + 1] = color.g;
    starColors[i * 3 + 2] = color.b;

    starSizes[i] = (0.35 + Math.random() * 0.55);
    starTwinklePhase[i] = Math.random() * Math.PI * 2;
    starTwinkleSpeed[i] = 0.3 + Math.random() * 0.8;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uOpacity: { value: 1.0 }
    },
    vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (120.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        uniform float uOpacity;
        void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            float alpha = smoothstep(0.5, 0.0, dist);
            gl_FragColor = vec4(vColor, alpha * uOpacity);
        }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Cập nhật nhấp nháy sao (chỉ dao động độ sáng tổng thể nhẹ để tiết kiệm hiệu năng,
// kết hợp thêm dao động size cho một phần nhỏ sao để không quá đồng bộ)
function updateStars(elapsed) {
    starMaterial.uniforms.uOpacity.value = 0.85 + Math.sin(elapsed * 0.5) * 0.15;
}

// ============================================================
// SAO BĂNG (ĐÃ XÓA HOÀN TOÀN THEO YÊU CẦU NGUỜI DÙNG)
// ============================================================
const meteorGroup = new THREE.Group();
scene.add(meteorGroup);

const activeMeteors = [];
const TARGET_METEOR_COUNT = 0;

function createMeteor() {}

function updateMeteors(delta) {}

// ============================================================
// TƯƠNG TÁC NGƯỜI DÙNG: CHUỘT (DESKTOP) & CẢM ỨNG (MOBILE)
// ============================================================
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

let isDragging = false;
let lastPointerX = 0;
let lastPointerY = 0;
let dragRotationY = 0;
let dragRotationX = 0;
let targetDragRotationY = 0;
let targetDragRotationX = 0;

let mouseNormX = 0; // -1 đến 1
let mouseNormY = 0;

let lastInteractionTime = Date.now();
const AUTO_ROTATE_DELAY = 3000; // Sau 3s không tương tác thì tự xoay

// Giới hạn góc xoay để không lật ngược trái tim
const MAX_DRAG_ROTATION_Y = Math.PI * 0.35;
const MAX_DRAG_ROTATION_X = 0.35;
const MAX_TILT = 0.12;

function onPointerMove(clientX, clientY) {
    mouseNormX = (clientX / window.innerWidth) * 2 - 1;
    mouseNormY = (clientY / window.innerHeight) * 2 - 1;

    targetRotationY = mouseNormX * MAX_TILT;
    targetRotationX = mouseNormY * MAX_TILT * 0.6;

    lastInteractionTime = Date.now();

    if (isDragging) {
        const deltaX = clientX - lastPointerX;
        const deltaY = clientY - lastPointerY;

        targetDragRotationY += deltaX * 0.005;
        targetDragRotationX += deltaY * 0.003;

        targetDragRotationY = Math.max(-MAX_DRAG_ROTATION_Y, Math.min(MAX_DRAG_ROTATION_Y, targetDragRotationY));
        targetDragRotationX = Math.max(-MAX_DRAG_ROTATION_X, Math.min(MAX_DRAG_ROTATION_X, targetDragRotationX));

        lastPointerX = clientX;
        lastPointerY = clientY;
    }
}

// Chuột (desktop)
window.addEventListener('mousemove', (e) => {
    onPointerMove(e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    canvas.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

canvas.style.cursor = 'grab';

// Cảm ứng (mobile) - vuốt trái phải để xoay nhẹ
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        lastPointerX = touchStartX;
        lastPointerY = touchStartY;
        lastInteractionTime = Date.now();
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });

window.addEventListener('touchend', () => {
    isDragging = false;
});

// ============================================================
// HIỆU ỨNG XUẤT HIỆN BAN ĐẦU (INTRO ANIMATION)
// ============================================================
let introStartTime = null;
const INTRO_DURATION_STARS = 0.6;
const INTRO_DURATION_HEART_START = 0.5;
const INTRO_DURATION_HEART_END = 2.6;
const INTRO_DURATION_RING_START = 2.2;
const INTRO_DURATION_RING_END = 3.4;
const INTRO_DURATION_MESSAGE_START = 3.2;
const INTRO_DURATION_MESSAGE_END = 3.9;
const INTRO_TOTAL_DURATION = 4.0;

let introComplete = false;

// Vị trí ngẫu nhiên ban đầu (hạt bay từ nhiều hướng vào) cho hiệu ứng intro
const heartIntroOffsets = new Float32Array(HEART_COUNT * 3);
for (let i = 0; i < HEART_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 12;
    const heightRand = (Math.random() - 0.5) * 14;
    heartIntroOffsets[i * 3] = Math.cos(angle) * dist;
    heartIntroOffsets[i * 3 + 1] = heightRand;
    heartIntroOffsets[i * 3 + 2] = Math.sin(angle) * dist;
}

stars.material.uniforms.uOpacity.value = 0;
heartParticles.material.opacity = 1;
heartGroup.scale.set(1, 1, 1);

function updateIntro(elapsed) {
    if (introComplete) return;

    // Giai đoạn 1: Sao xuất hiện trước
    const starProgress = Math.min(1, Math.max(0, elapsed / INTRO_DURATION_STARS));
    starMaterial.uniforms.uOpacity.value = starProgress * 0.85;

    // Giai đoạn 2: Hạt trái tim bay từ nhiều hướng tụ về hình trái tim
    if (elapsed > INTRO_DURATION_HEART_START) {
        const heartT = Math.min(1, (elapsed - INTRO_DURATION_HEART_START) / (INTRO_DURATION_HEART_END - INTRO_DURATION_HEART_START));
        const easedT = 1 - Math.pow(1 - heartT, 3); // ease-out cubic

        const posAttr = heartGeometry.attributes.position;
        for (let i = 0; i < HEART_COUNT; i++) {
            const bx = heartBasePositions[i * 3];
            const by = heartBasePositions[i * 3 + 1];
            const bz = heartBasePositions[i * 3 + 2];

            const ox = heartIntroOffsets[i * 3];
            const oy = heartIntroOffsets[i * 3 + 1];
            const oz = heartIntroOffsets[i * 3 + 2];

            posAttr.array[i * 3] = bx + ox * (1 - easedT);
            posAttr.array[i * 3 + 1] = by + oy * (1 - easedT);
            posAttr.array[i * 3 + 2] = bz + oz * (1 - easedT);
        }
        posAttr.needsUpdate = true;
    }

    // Giai đoạn 3: Vòng chữ xuất hiện bằng fade + scale
    if (elapsed > INTRO_DURATION_RING_START) {
        const ringT = Math.min(1, (elapsed - INTRO_DURATION_RING_START) / (INTRO_DURATION_RING_END - INTRO_DURATION_RING_START));
        const easedRingT = 1 - Math.pow(1 - ringT, 2);
        ringGroup.scale.set(easedRingT, easedRingT, easedRingT);
        ringSprites.forEach(s => {
            s.material.opacity = s.userData.baseOpacity * easedRingT;
        });
    }

    // Giai đoạn 4: Bong bóng tin nhắn trượt lên
    if (elapsed > INTRO_DURATION_MESSAGE_START && CONFIG.showMessageBox) {
        messageBoxEl.classList.add('visible');
    }

    if (elapsed >= INTRO_TOTAL_DURATION) {
        introComplete = true;
    }
}

// ============================================================
// GẮN CẤU HÌNH VÀO GIAO DIỆN (UI)
// ============================================================
const messageBoxEl = document.getElementById('message-box');
const usernameEl = document.getElementById('sender-username');
const chatMessageEl = document.getElementById('chat-message');

if (usernameEl) usernameEl.textContent = CONFIG.username;
if (chatMessageEl) chatMessageEl.textContent = CONFIG.message;

if (!CONFIG.showMessageBox && messageBoxEl) {
    messageBoxEl.style.display = 'none';
}

// ============================================================
// XỬ LÝ RESIZE MÀN HÌNH
// ============================================================
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

    if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    // Điều chỉnh camera vừa vặn hoàn hảo & đưa góc nhìn về 60° chuẩn ban đầu
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 0.65) {
        // Điện thoại di động (Màn hình dọc) - Góc quan sát 60°
        camera.position.y = 1.0;
        camera.position.z = 13.0;
        camera.fov = 60;
        camera.lookAt(0, 1.0, 0);
    } else if (aspect < 0.85) {
        // Máy tính bảng
        camera.position.y = 1.05;
        camera.position.z = 11.0;
        camera.fov = 60;
        camera.lookAt(0, 1.05, 0);
    } else {
        // Máy tính để bàn
        camera.position.y = 1.1;
        camera.position.z = 10.0;
        camera.fov = 60;
        camera.lookAt(0, 1.1, 0);
    }
    camera.updateProjectionMatrix();
}
window.addEventListener('resize', onWindowResize);
onWindowResize(); // Gọi ngay để thiết lập đúng cho lần đầu

// ============================================================
// TẠM DỪNG KHI TAB KHÔNG HOẠT ĐỘNG (TIẾT KIỆM HIỆU NĂNG)
// ============================================================
let isTabActive = true;
document.addEventListener('visibilitychange', () => {
    isTabActive = document.visibilityState === 'visible';
});

// ============================================================
// VÒNG LẶP ANIMATION CHÍNH
// ============================================================
const clock = new THREE.Clock();
let heartBeatPhase = 0;
let heartSpinAccum = 0; // Góc xoay Y tích lũy riêng của trái tim (chuyển động nội tại liên tục)
let idleSpinAccum = 0;  // Góc xoay Y tích lũy của toàn cảnh khi không có tương tác

function animate() {
    requestAnimationFrame(animate);

    if (!isTabActive) return; // Dừng cập nhật khi tab ẩn

    const delta = Math.min(clock.getDelta(), 0.1); // Giới hạn delta tránh nhảy khi tab quay lại
    const elapsed = clock.getElapsedTime();

    if (introStartTime === null) introStartTime = elapsed;
    let introElapsed = elapsed - introStartTime;

    // Lặp lại hiệu ứng tạo hình trái tim cứ sau 15 giây
    const LOOP_INTERVAL = 15.0;
    if (introElapsed >= LOOP_INTERVAL) {
        introStartTime = elapsed;
        introElapsed = 0;
        introComplete = false;
        // Tạo lại vị trí hạt tản ra không gian rồi quy tụ về hình trái tim 3D
        for (let i = 0; i < HEART_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 7 + Math.random() * 11;
            const heightRand = (Math.random() - 0.5) * 12;
            heartIntroOffsets[i * 3] = Math.cos(angle) * dist;
            heartIntroOffsets[i * 3 + 1] = heightRand;
            heartIntroOffsets[i * 3 + 2] = Math.sin(angle) * dist;
        }
    }
    updateIntro(introElapsed);

    // ---- Xoay & đập trái tim (chuyển động NỘI TẠI của riêng trái tim, luôn chạy đều) ----
    heartSpinAccum += CONFIG.rotationSpeed * 60 * delta; // Xoay chậm liên tục quanh trục Y
    const baseTiltX = Math.sin(elapsed * 0.35) * 0.05; // Nghiêng nhẹ theo trục X (dao động sin chậm)
    heartGroup.rotation.y = heartSpinAccum;
    heartGroup.rotation.x = baseTiltX;

    // ---- Tương tác chuột/cảm ứng: áp dụng cho TOÀN BỘ khung cảnh (trái tim + vòng chữ + dòng hạt) ----
    // currentRotationX/Y lerp mượt theo vị trí chuột (giá trị đã bị giới hạn bởi MAX_TILT)
    currentRotationX += (targetRotationX - currentRotationX) * 0.05;
    currentRotationY += (targetRotationY - currentRotationY) * 0.05;
    // dragRotationX/Y lerp mượt theo thao tác kéo thả (giá trị đã bị giới hạn bởi MAX_DRAG_ROTATION)
    dragRotationX += (targetDragRotationX - dragRotationX) * 0.08;
    dragRotationY += (targetDragRotationY - dragRotationY) * 0.08;

    // Tự động xoay chậm toàn cảnh khi người dùng không tương tác (tích lũy đều, dừng lại khi có tương tác)
    const timeSinceInteraction = Date.now() - lastInteractionTime;
    if (timeSinceInteraction > AUTO_ROTATE_DELAY) {
        idleSpinAccum += 0.045 * delta;
    }

    // Gán trực tiếp (không +=) vì currentRotationX/Y và dragRotationX/Y đã là giá trị bị chặn biên,
    // tránh lỗi cộng dồn khiến cảnh xoay nhanh dần không kiểm soát khi chuột đứng yên lệch tâm
    worldGroup.rotation.x = currentRotationX * 0.6 + dragRotationX * 0.3;
    worldGroup.rotation.y = currentRotationY * 0.3 + dragRotationY * 0.15 + idleSpinAccum;

    // Nhịp đập trái tim: scale từ 1 lên ~1.035 rồi về 1, chu kỳ 1.6-2s
    const beatCycle = 1.8; // giây
    heartBeatPhase = (elapsed % beatCycle) / beatCycle;
    // Dùng hàm mượt kiểu "nhịp tim" - nhanh lúc phồng, chậm lúc xẹp
    const beatValue = Math.pow(Math.sin(heartBeatPhase * Math.PI), 2);
    const beatScale = 1 + beatValue * 0.035;
    heartGroup.scale.set(beatScale, beatScale, beatScale);

    // ---- Rung nhẹ từng hạt + hạt viền tách ra rồi bay lại ----
    if (introComplete) {
        const posAttr = heartGeometry.attributes.position;
        for (let i = 0; i < HEART_COUNT; i++) {
            const idx = i * 3;
            const phase = heartRandomPhase[i];
            const edge = heartEdgeFactors[i];

            // Rung nhẹ toàn bộ hạt
            const jitterAmount = 0.008;
            const jx = Math.sin(elapsed * 2.2 + phase) * jitterAmount;
            const jy = Math.cos(elapsed * 1.8 + phase * 1.3) * jitterAmount;
            const jz = Math.sin(elapsed * 2.0 + phase * 0.7) * jitterAmount;

            // Một số hạt viền thỉnh thoảng tách ra xa hơn rồi quay lại (chu kỳ dài, chỉ áp dụng cho hạt viền)
            let separation = 0;
            if (edge > 0.85) {
                const sepCycle = 4.5;
                const sepPhase = (elapsed * 0.3 + phase * 2.0) % sepCycle;
                const sepT = sepPhase / sepCycle;
                // Đường cong: tách ra giữa chu kỳ rồi quay lại
                separation = Math.sin(sepT * Math.PI) * 0.15 * Math.max(0, Math.sin(phase) * 0.5 + 0.5);
            }

            const baseX = heartBasePositions[idx];
            const baseY = heartBasePositions[idx + 1];
            const baseZ = heartBasePositions[idx + 2];

            // Hướng tách ra: theo hướng từ tâm trái tim ra ngoài
            const dirX = baseX - 0;
            const dirY = baseY - HEART_Y_OFFSET;
            const dirLen = Math.sqrt(dirX * dirX + dirY * dirY) || 1;

            posAttr.array[idx] = baseX + jx + (dirX / dirLen) * separation;
            posAttr.array[idx + 1] = baseY + jy + (dirY / dirLen) * separation;
            posAttr.array[idx + 2] = baseZ + jz;
        }
        posAttr.needsUpdate = true;
    }

    // ---- Vòng chữ: xoay các lớp với tốc độ khác nhau ----
    ringGroup.children.forEach((layerGroup) => {
        layerGroup.rotation.y += layerGroup.userData.speed * delta;
    });

    // Hiệu ứng bồng bềnh nhẹ cho từng chữ + luôn hướng về camera (billboard - Sprite tự làm điều này)
    ringSprites.forEach((sprite) => {
        const bobAmount = Math.sin(elapsed * 0.8 + sprite.userData.bobPhase) * 0.06;
        sprite.position.y = sprite.userData.baseY + bobAmount;
    });

    // ---- Dòng hạt bay lên ----
    updateStreamParticles(delta, elapsed);

    // ---- Sao & sao băng ----
    updateStars(elapsed);
    updateMeteors(delta);

    // ---- Parallax nhẹ cho nền sao theo chuyển động chuột ----
    stars.rotation.y = currentRotationY * 0.5;
    stars.rotation.x = currentRotationX * 0.3;

    // ---- Render ----
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

animate();

// ============================================================
// GIỚI HẠN ZOOM (KHÔNG CHO PHÓNG TO/THU NHỎ QUÁ MỨC)
// Ngăn chặn cử chỉ pinch-zoom mặc định của trình duyệt trên canvas
// ============================================================
canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());

// ============================================================
// BẮT LỖI TỔNG QUÁT - GHI LOG GỌN GÀNG, KHÔNG LÀM SẬP TRANG
// ============================================================
window.addEventListener('error', (e) => {
    console.warn('Đã bắt một lỗi runtime, website vẫn tiếp tục chạy:', e.message);
});

// ============================================================
// XỬ LÝ PHÁT NHẠC TINHYEU.MP3
// ============================================================
const bgAudio = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');

if (bgAudio) {
    bgAudio.volume = 1.0;

    const tryPlayAudio = () => {
        if (bgAudio.paused) {
            bgAudio.play().then(() => {
                if (musicBtn) musicBtn.textContent = '🔊';
            }).catch(() => {});
        }
    };

    // Thử phát ngay khi load
    tryPlayAudio();

    // Bắt sự kiện nhấp / chạm thực sự từ người dùng để vượt qua rào cản Autoplay Policy của trình duyệt
    ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
        window.addEventListener(evt, tryPlayAudio, { capture: true, passive: true });
    });
}

if (musicBtn && bgAudio) {
    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (bgAudio.paused) {
            bgAudio.play().then(() => {
                musicBtn.textContent = '🔊';
            }).catch(err => {
                console.error("Lỗi khi phát nhạc:", err);
            });
        } else {
            bgAudio.pause();
            musicBtn.textContent = '🎵';
        }
    });
}
