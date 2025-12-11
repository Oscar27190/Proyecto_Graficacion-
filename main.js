// Variables globales
let scene, camera, renderer, controls;
let vehicle, ground;
let lights = [];
let gravityActive = false;
let clock = new THREE.Clock();
let stats;
let textures;

// Variables para controles WASD
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// 1. GENERADOR DE TEXTURAS PROCEDURALES
class TextureGenerator {
    constructor() {
        this.textures = {};
        this.generateAllTextures();
    }
    
    generateAllTextures() {
        this.textures.car = this.generateCarTexture();
        this.textures.ground = this.generateGroundTexture();
        this.textures.wheel = this.generateWheelTexture();
        this.textures.metal = this.generateMetalTexture();
        console.log("✅ Texturas procedurales generadas");
    }
    
    generateCarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Rojo metálico con gradiente
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, '#ff3333');
        gradient.addColorStop(0.5, '#cc0000');
        gradient.addColorStop(1, '#ff3333');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Brillos metálicos
        for(let i = 0; i < 80; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15 + 0.05})`;
            ctx.beginPath();
            ctx.arc(
                Math.random() * 512, 
                Math.random() * 512, 
                Math.random() * 15 + 3, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 1;
        return texture;
    }
    
    generateGroundTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base de tierra
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(0, 0, 512, 512);
        
        // Variaciones de tierra
        for(let i = 0; i < 2000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 15 + 3;
            
            const tones = ['#6d4c41', '#795548', '#8d6e63'];
            ctx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Hierba
        ctx.fillStyle = '#388e3c';
        for(let i = 0; i < 3000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const width = Math.random() * 2 + 1;
            const height = Math.random() * 12 + 4;
            
            ctx.fillRect(x, y, width, height);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(15, 15);
        return texture;
    }
    
    generateWheelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Base negra para caucho
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 256, 256);
        
        // Patrón de banda de rodadura
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // Líneas diagonales
        for(let i = -256; i < 512; i += 25) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 256, 256);
            ctx.stroke();
        }
        
        // Líneas horizontales
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        for(let y = 0; y < 256; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(256, y);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    
    generateMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Gradiente metálico
        const gradient = ctx.createLinearGradient(0, 0, 256, 0);
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(0.5, '#999999');
        gradient.addColorStop(1, '#666666');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        // Rayas metálicas
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for(let x = 0; x < 256; x += 8) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 256);
            ctx.stroke();
        }
        
        return new THREE.CanvasTexture(canvas);
    }
}

// ============================================
// 2. INICIALIZACIÓN PRINCIPAL
// ============================================

function init() {
    console.log("🚀 Iniciando proyecto de gráficación...");
    
    // 1. Generar texturas
    console.log("🎨 Generando texturas procedurales...");
    const textureGen = new TextureGenerator();
    textures = textureGen.textures;
    
    // 2. Crear escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 150);
    
    // 3. Crear cámara
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 8, 15);
    
    // 4. Crear renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    // 5. CONFIGURAR ORBITCONTROLS (CONTROLES DE RATÓN)
    console.log("🖱️ Configurando OrbitControls...");
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        
        // Configuración de controles
        controls.enableDamping = true; // Suavizado de movimiento
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = true;
        controls.minDistance = 3;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI / 2; // No pasar por debajo del suelo
        
        // Zoom con rueda
        controls.enableZoom = true;
        controls.zoomSpeed = 1.0;
        
        // Rotación con click izquierdo
        controls.enableRotate = true;
        controls.rotateSpeed = 0.8;
        
        // Pan con click derecho
        controls.enablePan = true;
        controls.panSpeed = 0.8;
        
        // Límites
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        
        console.log("✅ OrbitControls configurados correctamente");
        
        // Eventos de debug (opcional)
        controls.addEventListener('change', function() {
            console.log("Cámara posición:", camera.position);
        });
        
    } else {
        console.error("❌ OrbitControls no está disponible");
        alert("Error: OrbitControls no se cargó. Recarga la página.");
    }
    
    // 6. Crear elementos de la escena
    createLights();
    createGround();
    createVehicle();
    createEnvironment();
    
    // 7. Configurar controles de teclado
    setupKeyboardControls();
    
    // 8. Configurar redimensionamiento
    window.addEventListener('resize', onWindowResize);
    
    // 9. Iniciar animación
    animate();
    
    console.log("✅ Proyecto iniciado correctamente");
    console.log("🖱️ Usa el ratón para mover la cámara:");
    console.log("   • Click izquierdo + arrastrar: Rotar");
    console.log("   • Rueda: Zoom in/out");
    console.log("   • Click derecho + arrastrar: Mover (pan)");
}

// ============================================
// 3. CREACIÓN DE LA ESCENA
// ============================================

function createLights() {
    // Luz ambiental (global)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Luz direccional (sol)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
    sunLight.position.set(15, 25, 10);
    sunLight.castShadow = true;
    
    // Configurar sombras
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    
    scene.add(sunLight);
    
    // Luz del vehículo (puntual)
    const carLight = new THREE.PointLight(0xffaa00, 0.7, 30);
    carLight.castShadow = true;
    scene.add(carLight);
    lights.push(carLight);
    
    console.log("💡 Sistema de luces creado con sombras");
}

function createGround() {
    const geometry = new THREE.PlaneGeometry(200, 200, 32, 32);
    const material = new THREE.MeshLambertMaterial({ 
        map: textures.ground,
        color: 0x4a7c42
    });
    
    ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid helper (opcional, para referencia)
    const gridHelper = new THREE.GridHelper(200, 50, 0x000000, 0x333333);
    gridHelper.position.y = -1.95;
    scene.add(gridHelper);
    
    console.log("🌿 Terreno creado con textura procedural");
}

function createVehicle() {
    const vehicleGroup = new THREE.Group();
    
    // CHASIS (cuerpo principal)
    const chassisGeo = new THREE.BoxGeometry(3, 1, 1.5);
    const chassisMat = new THREE.MeshPhongMaterial({ 
        map: textures.car,
        shininess: 120,
        specular: 0x333333
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    vehicleGroup.add(chassis);
    
    // CABINA (vidrio)
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.8, 1.6);
    const cabinMat = new THREE.MeshPhongMaterial({ 
        color: 0x0a0a2a,
        transparent: true,
        opacity: 0.6,
        shininess: 200,
        specular: 0x555555,
        emissive: 0x000033
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = 0.9;
    cabin.position.z = 0.1;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    vehicleGroup.add(cabin);
    
    // RUEDAS
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({ 
        map: textures.wheel,
        color: 0x111111
    });
    
    // Posiciones de las 4 ruedas
    const wheelPositions = [
        { x: -1.2, y: -0.5, z: 0.8 },   // Delantera izquierda
        { x: 1.2, y: -0.5, z: 0.8 },    // Delantera derecha
        { x: -1.2, y: -0.5, z: -0.8 },  // Trasera izquierda
        { x: 1.2, y: -0.5, z: -0.8 }    // Trasera derecha
    ];
    
    vehicleGroup.wheels = [];
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.castShadow = true;
        vehicleGroup.add(wheel);
        vehicleGroup.wheels.push(wheel);
    });
    
    // FAROS DELANTEROS
    const headlightGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const headlightMat = new THREE.MeshPhongMaterial({ 
        color: 0xffffaa,
        emissive: 0xffff44,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    
    const headlight1 = new THREE.Mesh(headlightGeo, headlightMat);
    headlight1.position.set(-1.4, 0.2, 0.5);
    vehicleGroup.add(headlight1);
    
    const headlight2 = new THREE.Mesh(headlightGeo, headlightMat);
    headlight2.position.set(-1.4, 0.2, -0.5);
    vehicleGroup.add(headlight2);
    
    // LUCES TRASERAS
    const taillightGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const taillightMat = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        emissive: 0xff3333,
        emissiveIntensity: 0.3
    });
    
    const taillight1 = new THREE.Mesh(taillightGeo, taillightMat);
    taillight1.position.set(1.4, 0.2, 0.5);
    vehicleGroup.add(taillight1);
    
    const taillight2 = new THREE.Mesh(taillightGeo, taillightMat);
    taillight2.position.set(1.4, 0.2, -0.5);
    vehicleGroup.add(taillight2);
    
    // DETALLES METÁLICOS
    const detailMat = new THREE.MeshPhongMaterial({ 
        map: textures.metal,
        shininess: 80
    });
    
    // Parachoques delantero
    const bumperGeo = new THREE.BoxGeometry(3.2, 0.2, 1.7);
    const frontBumper = new THREE.Mesh(bumperGeo, detailMat);
    frontBumper.position.set(0, -0.4, 0);
    frontBumper.castShadow = true;
    vehicleGroup.add(frontBumper);
    
    // Alerón trasero
    const spoilerGeo = new THREE.BoxGeometry(0.5, 0.1, 1.2);
    const spoiler = new THREE.Mesh(spoilerGeo, detailMat);
    spoiler.position.set(0, 1.1, -0.8);
    spoiler.castShadow = true;
    vehicleGroup.add(spoiler);
    
    // Escape
    const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
    const exhaust = new THREE.Mesh(exhaustGeo, detailMat);
    exhaust.position.set(1.5, 0, -0.6);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.castShadow = true;
    vehicleGroup.add(exhaust);
    
    // Configurar vehículo
    vehicleGroup.position.y = 2;
    vehicleGroup.castShadow = true;
    vehicleGroup.receiveShadow = true;
    
    // Propiedades físicas
    vehicleGroup.velocity = new THREE.Vector3(0, 0, 0);
    vehicleGroup.rotationSpeed = 0;
    
    scene.add(vehicleGroup);
    vehicle = vehicleGroup;
    
    console.log("🚗 Vehículo 3D creado con texturas y sombras");
}

function createEnvironment() {
    // Material para obstáculos
    const obstacleMat = new THREE.MeshPhongMaterial({ 
        color: 0x8B4513,
        shininess: 30
    });
    
    // Obstáculo 1 - Caja grande
    const box = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), obstacleMat);
    box.position.set(12, 1.5, 8);
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    
    // Obstáculo 2 - Tubo
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 10), obstacleMat);
    pipe.position.set(-8, 2, -10);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    scene.add(pipe);
    
    // Obstáculo 3 - Cono
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), obstacleMat);
    cone.position.set(15, 1.5, -12);
    cone.castShadow = true;
    scene.add(cone);
    
    // Crear árboles
    for(let i = 0; i < 12; i++) {
        const tree = createTree();
        tree.position.set(
            Math.random() * 80 - 40, // -40 a 40
            0,
            Math.random() * 80 - 40
        );
        scene.add(tree);
    }
    
    console.log("🌳 Ambiente creado con obstáculos y árboles");
}

function createTree() {
    const treeGroup = new THREE.Group();
    
    // Tronco
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Copa del árbol (3 esferas para forma más natural)
    const crownMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
    
    const crown1 = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), crownMat);
    crown1.position.y = 3;
    crown1.castShadow = true;
    treeGroup.add(crown1);
    
    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), crownMat);
    crown2.position.y = 4;
    crown2.position.x = 0.5;
    crown2.position.z = 0.5;
    crown2.castShadow = true;
    treeGroup.add(crown2);
    
    const crown3 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), crownMat);
    crown3.position.y = 4.5;
    crown3.position.x = -0.3;
    crown3.position.z = -0.4;
    crown3.castShadow = true;
    treeGroup.add(crown3);
    
    return treeGroup;
}
// 4. CONTROLES DE TECLADO (WASD)

function setupKeyboardControls() {
    console.log("🎮 Configurando controles de teclado...");
    
    // Event listeners para WASD
    document.addEventListener('keydown', function(event) {
        const key = event.key.toLowerCase();
        
        // WASD
        if (keys.hasOwnProperty(key)) {
            keys[key] = true;
            updateVehicleMovement();
            event.preventDefault(); // Prevenir scroll con WASD
        }
        
        // Teclas especiales
        switch(key) {
            case ' ':
                event.preventDefault();
                toggleGravity();
                break;
            case 'r':
                resetVehicle();
                break;
            case 'g':
                // Toggle grid helper
                const grid = scene.getObjectByProperty('type', 'GridHelper');
                if (grid) grid.visible = !grid.visible;
                break;
        }
    });
    
    document.addEventListener('keyup', function(event) {
        const key = event.key.toLowerCase();
        if (keys.hasOwnProperty(key)) {
            keys[key] = false;
            updateVehicleMovement();
        }
    });
    
    // Enfocar la página automáticamente
    window.addEventListener('click', function() {
        document.body.focus();
    });
    
    // Asegurar que la página pueda recibir eventos de teclado
    document.body.setAttribute('tabindex', '0');
    document.body.style.outline = 'none'; // Quitar outline del focus
    
    console.log("✅ Controles de teclado configurados");
}

function updateVehicleMovement() {
    if (!vehicle) return;
    
    const SPEED = 8;
    const TURN_SPEED = 3;
    
    // Resetear movimiento
    vehicle.velocity.x = 0;
    vehicle.velocity.z = 0;
    vehicle.rotationSpeed = 0;
    
    // Movimiento adelante/atrás
    if (keys.w) {
        vehicle.velocity.z = -SPEED;
    }
    if (keys.s) {
        vehicle.velocity.z = SPEED;
    }
    
    // Rotación izquierda/derecha
    if (keys.a) {
        vehicle.rotationSpeed = TURN_SPEED;
    }
    if (keys.d) {
        vehicle.rotationSpeed = -TURN_SPEED;
    }
    
    // Movimiento diagonal (combinaciones)
    if (keys.w && keys.a) {
        vehicle.velocity.x = -SPEED * 0.7;
        vehicle.velocity.z = -SPEED * 0.7;
    }
    if (keys.w && keys.d) {
        vehicle.velocity.x = SPEED * 0.7;
        vehicle.velocity.z = -SPEED * 0.7;
    }
    if (keys.s && keys.a) {
        vehicle.velocity.x = -SPEED * 0.7;
        vehicle.velocity.z = SPEED * 0.7;
    }
    if (keys.s && keys.d) {
        vehicle.velocity.x = SPEED * 0.7;
        vehicle.velocity.z = SPEED * 0.7;
    }
}

function toggleGravity() {
    gravityActive = !gravityActive;
    const status = gravityActive ? 'ACTIVADA' : 'DESACTIVADA';
    console.log(`⚖️ Gravedad ${status}`);
    
    // Mostrar notificación visual
    showNotification(`Gravedad ${status}`);
}

function resetVehicle() {
    if (!vehicle) return;
    
    vehicle.position.set(0, 2, 0);
    vehicle.rotation.y = 0;
    vehicle.velocity.set(0, 0, 0);
    gravityActive = false;
    
    // Resetear rotación de ruedas
    if (vehicle.wheels) {
        vehicle.wheels.forEach(wheel => {
            wheel.rotation.x = 0;
        });
    }
    
    console.log("🔄 Vehículo reiniciado");
    showNotification("Vehículo reiniciado");
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 1000;
        font-family: Arial;
        font-size: 16px;
        border: 2px solid #4CAF50;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 1500);
}

// 5. FÍSICAS Y ANIMACIÓN

function updatePhysics(deltaTime) {
    if (!vehicle) return;
    
    const GRAVITY = 9.8;
    const GROUND_LEVEL = -1.5;
    const BOUNCE_FACTOR = 0.6;
    const FRICTION = 0.93;
    
    // Aplicar gravedad si está activa
    if (gravityActive && vehicle.position.y > GROUND_LEVEL) {
        vehicle.velocity.y -= GRAVITY * deltaTime;
    }
    
    // Actualizar posición
    vehicle.position.x += vehicle.velocity.x * deltaTime;
    vehicle.position.y += vehicle.velocity.y * deltaTime;
    vehicle.position.z += vehicle.velocity.z * deltaTime;
    
    // Rotar ruedas según la velocidad
    const speed = Math.sqrt(
        vehicle.velocity.x * vehicle.velocity.x + 
        vehicle.velocity.z * vehicle.velocity.z
    );
    
    if (speed > 0.1 && vehicle.wheels) {
        const rotationAmount = speed * deltaTime * 4;
        vehicle.wheels.forEach(wheel => {
            wheel.rotation.x += rotationAmount;
        });
    }
    
    // Colisión con el suelo
    if (vehicle.position.y <= GROUND_LEVEL) {
        vehicle.position.y = GROUND_LEVEL;
        
        // Rebotar ligeramente
        if (Math.abs(vehicle.velocity.y) > 1.5) {
            vehicle.velocity.y = -vehicle.velocity.y * BOUNCE_FACTOR;
        } else {
            vehicle.velocity.y = 0;
        }
    }
    
    // Fricción con el suelo (solo cuando está tocando el suelo)
    if (vehicle.position.y <= GROUND_LEVEL + 0.1) {
        vehicle.velocity.x *= FRICTION;
        vehicle.velocity.z *= FRICTION;
        
        // Detener movimiento muy lento
        if (Math.abs(vehicle.velocity.x) < 0.05) vehicle.velocity.x = 0;
        if (Math.abs(vehicle.velocity.z) < 0.05) vehicle.velocity.z = 0;
    }
    
    // Rotación del vehículo basada en movimiento
    if (vehicle.rotationSpeed !== 0) {
        vehicle.rotation.y += vehicle.rotationSpeed * deltaTime;
    }
    
    // Reducir rotación gradualmente cuando no hay input
    if (vehicle.rotationSpeed !== 0 && Math.abs(vehicle.velocity.x) < 0.1 && Math.abs(vehicle.velocity.z) < 0.1) {
        vehicle.rotationSpeed *= 0.9;
        if (Math.abs(vehicle.rotationSpeed) < 0.01) vehicle.rotationSpeed = 0;
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Calcular delta time (tiempo entre frames)
    const deltaTime = Math.min(clock.getDelta(), 0.1); // Limitar a 0.1s máximo
    
    // ACTUALIZAR ORBITCONTROLS (IMPORTANTE)
    if (controls) {
        controls.update(); // Esto hace que los controles de ratón funcionen
    }
    
    // Actualizar física
    updatePhysics(deltaTime);
    
    // Mover luz puntual con el vehículo
    if (lights.length > 0 && vehicle) {
        lights[0].position.copy(vehicle.position);
        lights[0].position.y += 3;
    }
    
    // Renderizar escena
    renderer.render(scene, camera);
}

// 6. MANEJO DE VENTANA

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 7. INICIALIZACIÓN GLOBAL

// Hacer la función init disponible globalmente
window.init = init;

// Manejar errores
window.addEventListener('error', function(e) {
    console.error('Error en la aplicación:', e.error);
    alert('Error: ' + e.message + '\nRevisa la consola para más detalles.');
});

console.log("✅ main.js completamente cargado y listo");
console.log("Instrucciones:");
console.log("1. Haz click en la pantalla para enfocar");
console.log("2. Usa WASD para mover el vehículo");
console.log("3. Usa el ratón para mover la cámara");
console.log("4. ESPACIO para activar gravedad");
console.log("5. R para reiniciar posición");
