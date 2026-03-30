/**
 * NFEC Digital Twin v2.0 — Industrial-Grade Robotic Simulator
 * 1-to-1 Mirror of Physical Robotic Architecture.
 */

// ─── CONFIG ────────────────────────────────────────────────
const WAYPOINTS = {
    brew_coffee:    { x: 3.5, z: -3.5 },
    dim_lights:     { x: -3.5, z: 3.5 },
    activate_focus: { x: -3.5, z: -3.5 },
    return_home:    { x: 0.0, z: 0.0 },
};

const ARRIVAL_THRESHOLD = 0.2;
const ROBOT_MAX_SPEED = 0.045;
const ACCEL = 0.002;
const TURN_SPEED = 0.08;

// ─── STATE ─────────────────────────────────────────────────
let scene, camera, renderer, clock;
let robot, robotGroup, lidarBeam, lidarRotator;
let armUpper, armFore; // Manipulator joints
let armState = "stowed"; 
let obstacles = []; // Physical collision hazards
let trailParticles = [];
let currentTarget = null;
let targetPos = null;
let currentSpeed = 0;
let pollTimer = 0;
let frameCount = 0;

// ─── INIT ──────────────────────────────────────────────────
function initSimulation() {
    console.log("GCS Simulation initializing...");
    const container = document.getElementById('sim-canvas');
    if (!container || container.clientWidth === 0) {
        console.warn("Container not ready, retrying...");
        setTimeout(initSimulation, 100);
        return;
    }

    try {
        clock = new THREE.Clock();
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x11141a);
        scene.fog = new THREE.FogExp2(0x11141a, 0.02);

        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(9, 11, 9);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0x404080, 0.8);
        scene.add(ambient);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
        scene.add(hemiLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(5, 12, 2);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.set(2048, 2048);
        mainLight.shadow.bias = -0.0005;
        scene.add(mainLight);

        const accentBlue = new THREE.PointLight(0x00f2ff, 1.0, 20);
        accentBlue.position.set(-4, 4, -4);
        scene.add(accentBlue);

        buildHighFidelityRoom();
        buildDetailedRobot();

        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

        animate();
    } catch (e) {
        console.error("Simulation boot failure:", e);
    }
}

function buildHighFidelityRoom() {
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.8, metalness: 0.2 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(12, 24, 0x1d212b, 0x141821);
    grid.position.y = 0.01;
    scene.add(grid);

    const wallHeight = 0.8;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1e26, transparent: true, opacity: 0.4 });
    [[-6, 0, 0, 12], [6, 0, 0, 12], [0, -6, 12, 0], [0, 6, 12, 0]].forEach(([x, z, w, d]) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w || 0.1, wallHeight, d || 0.1), wallMat);
        wall.position.set(x, wallHeight / 2, z);
        scene.add(wall);
        const strip = new THREE.Mesh(
            new THREE.BoxGeometry(w || 0.02, 0.02, d || 0.02),
            new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.2 })
        );
        strip.position.set(x, 0.02, z);
        scene.add(strip);
    });

    addIndustrialLandmark(3.5, -3.5, 0xff1111, 'COFFEE_UNIT_01');
    addIndustrialLandmark(-3.5, 3.5, 0xffdd00, 'LIGHT_CMD_CENTER');
    addIndustrialLandmark(-3.5, -3.5, 0x1a7aff, 'MAIN_STUDY_DESK');

    buildObstacles();
}

function buildObstacles() {
    const hazardSpecs = [
        { x: 1.8, z: -1.2, size: 0.6 }, // Near coffee path
        { x: -1.2, z: -1.8, size: 0.7 }  // Near desk path
    ];

    hazardSpecs.forEach(spec => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(spec.size, spec.size, spec.size),
            new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.8 })
        );
        mesh.position.set(spec.x, spec.size/2, spec.z);
        mesh.castShadow = true; scene.add(mesh);
        obstacles.push({ mesh, radius: spec.size * 0.7 });
    });
}

function addIndustrialLandmark(x, z, color, labelText) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.4 }));
    base.position.y = 0.3; base.castShadow = true; group.add(base);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    panel.position.set(0, 0.3, 0.31); group.add(panel);
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.02), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
    core.position.set(0, 0.3, 0.36); group.add(core);

    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 36px "Inter", sans-serif';
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.textAlign = 'center';
    ctx.fillText(labelText, 256, 60);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
    sprite.scale.set(2, 0.5, 1);
    sprite.position.y = 1.2;
    group.add(sprite);

    group.position.set(x, 0, z);
    scene.add(group);
}

function buildDetailedRobot() {
    robotGroup = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.1, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
    const highlightMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, emissive: 0x00f2ff, emissiveIntensity: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.12; base.castShadow = true; robotGroup.add(base);

    const ringGeo = new THREE.TorusGeometry(0.32, 0.01, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.08; robotGroup.add(ring);

    const batt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.4), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    batt.position.y = 0.19; robotGroup.add(batt);

    lidarRotator = new THREE.Group();
    const towerGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    lidarRotator.add(tower);
    const laserSrc = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    laserSrc.position.set(0.1, 0, 0); lidarRotator.add(laserSrc);
    const beamGeo = new THREE.PlaneGeometry(3, 0.02);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    lidarBeam = new THREE.Mesh(beamGeo, beamMat);
    lidarBeam.position.set(1.6, 0, 0); lidarRotator.add(lidarBeam);
    lidarRotator.position.y = 0.28; robotGroup.add(lidarRotator);

    const camRig = new THREE.Group();
    const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), baseMat);
    camRig.add(camBody);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), new THREE.MeshBasicMaterial({ color: 0x00f2ff }));
    lens.position.set(0.06, 0, 0); camRig.add(lens);
    camRig.position.set(0.25, 0.2, 0); robotGroup.add(camRig);

    // --- ROBOTIC MANIPULATOR (MORPHOLOGICAL UPGRADE) ---
    const armGroup = new THREE.Group();
    armGroup.position.set(-0.25, 0.25, 0); // Mounted opposite to camera
    robotGroup.add(armGroup);

    // Segment 1: Shoulder
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), baseMat);
    armGroup.add(shoulder);

    // Segment 2: Upper Arm
    armUpper = new THREE.Group();
    armUpper.position.y = 0.06;
    armGroup.add(armUpper);
    const uArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 12), highlightMat);
    uArmMesh.position.y = 0.09;
    armUpper.add(uArmMesh);

    // Segment 3: Forearm
    armFore = new THREE.Group();
    armFore.position.y = 0.18;
    armUpper.add(armFore);
    const fArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12), highlightMat);
    fArmMesh.rotation.z = Math.PI / 2;
    fArmMesh.position.x = 0.075;
    armFore.add(fArmMesh);

    // Tool: Gripper
    const gripper = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.06), baseMat);
    gripper.position.x = 0.15;
    armFore.add(gripper);

    const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [[0, 0.32], [0, -0.32]].forEach(([wx, wz]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.x = Math.PI / 2; w.position.set(wx, 0.08, wz); robotGroup.add(w);
    });

    robotGroup.position.set(0, 0, 0);
    scene.add(robotGroup);
    robot = robotGroup;
}

function spawnTrailParticle(x, z) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.4 }));
    p.position.set(x, 0.02, z); p.userData.life = 1.0; scene.add(p); trailParticles.push(p);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    frameCount++;

    if (lidarRotator) lidarRotator.rotation.y += 0.2;

    if (currentTarget && targetPos) {
        navigateRobot();
        if (frameCount % 4 === 0) spawnTrailParticle(robot.position.x, robot.position.z);
        armState = "retracting"; 
    } else if (currentTarget) {
        armState = "deploying";
    } else {
        armState = "stowed";
    }

    // --- ARM ARTICULATION KINEMATICS ---
    if (armUpper && armFore) {
        if (armState === "deploying" || armState === "working") {
            armUpper.rotation.z += ((-Math.PI / 4) - armUpper.rotation.z) * 0.05;
            armFore.rotation.z += ((-Math.PI / 2) - armFore.rotation.z) * 0.05;
        } else {
            armUpper.rotation.z += (0 - armUpper.rotation.z) * 0.05;
            armFore.rotation.z += (0 - armFore.rotation.z) * 0.05;
        }
    }

    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.userData.life -= delta * 0.5;
        p.material.opacity = p.userData.life * 0.4;
        p.scale.setScalar(p.userData.life);
        if (p.userData.life <= 0) {
            scene.remove(p);
            trailParticles.splice(i, 1);
        }
    }

    pollTimer++;
    if (pollTimer >= 60) {
        pollTimer = 0;
        if (!currentTarget) pollForCommand();
        pollTelemetry();
    }

    renderer.render(scene, camera);
}

async function pollForCommand() {
    try {
        const res = await fetch('/robot/next_command');
        const data = await res.json();
        if (data.command && WAYPOINTS[data.command]) {
            currentTarget = data.command;
            targetPos = WAYPOINTS[data.command];
        }
    } catch (e) {}
}

async function reportStatus(x, z, statusText) {
    try {
        await fetch('/robot/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                x: Math.round(x*100)/100, z: Math.round(z*100)/100,
                status: statusText, battery: 92,
                lidar: "SCANNING"
            })
        });
    } catch (e) {}
}

function navigateRobot() {
    const dx = targetPos.x - robot.position.x;
    const dz = targetPos.z - robot.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < ARRIVAL_THRESHOLD) {
        currentSpeed = 0;
        currentTarget = null;
        reportStatus(robot.position.x, robot.position.z, 'Completed Task');
        return;
    }

    const targetAngle = Math.atan2(dx, dz);
    let avoidanceX = 0;
    let avoidanceZ = 0;
    let collisionRisk = false;

    // --- REACTIVE OBSTACLE AVOIDANCE LAYER ---
    obstacles.forEach(obs => {
        const ox = obs.mesh.position.x - robot.position.x;
        const oz = obs.mesh.position.z - robot.position.z;
        const distToObs = Math.sqrt(ox * ox + oz * oz);
        const safeZone = obs.radius + 0.8;

        if (distToObs < safeZone) {
            // Steering force: Push away from obstacle
            const strength = (safeZone - distToObs) / safeZone;
            avoidanceX -= ox * strength * 2;
            avoidanceZ -= oz * strength * 2;
            collisionRisk = true;
        }
    });

    const finalDx = dx + avoidanceX;
    const finalDz = dz + avoidanceZ;
    const finalAngle = Math.atan2(finalDx, finalDz);

    let angleDiff = finalAngle - robot.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    robot.rotation.y += angleDiff * TURN_SPEED;
    currentSpeed = Math.min(ROBOT_MAX_SPEED, currentSpeed + ACCEL);
    
    // RESTORED MOVEMENT: Physical translation with hard boundaries
    if (Math.abs(angleDiff) < 0.6) {
        let nextX = robot.position.x + Math.sin(robot.rotation.y) * currentSpeed;
        let nextZ = robot.position.z + Math.cos(robot.rotation.y) * currentSpeed;
        
        // HARD WALL COLLISION (Clamp to +/- 5.6 region)
        robot.position.x = Math.max(-5.6, Math.min(5.6, nextX));
        robot.position.z = Math.max(-5.6, Math.min(5.6, nextZ));
    }

    if (frameCount % 60 === 0) {
        reportStatus(robot.position.x, robot.position.z, collisionRisk ? 'AVOIDING_HAZARD' : 'Navigating: ' + currentTarget);
    }
}

async function pollTelemetry() {
    try {
        const res = await fetch('/telemetry');
        const data = await res.json();
        
        // Update HUD Elements
        document.getElementById('battery-fill').style.width = data.systems.battery + '%';
        document.getElementById('battery-val').innerText = data.systems.battery.toFixed(1) + '%';
        document.getElementById('temp-val').innerText = data.systems.motor_temp.toFixed(1) + '°C';
        document.getElementById('signal-val').innerText = data.systems.signal_strength.toFixed(0) + '%';
        
        const armVal = document.getElementById('arm-val');
        if (armVal) {
            armVal.innerText = data.robot.arm_status.toUpperCase();
            armVal.style.color = data.robot.arm_status === 'deployed' ? '#00f2ff' : 'var(--text-dim)';
        }

        const riskVal = document.getElementById('risk-val');
        const riskCard = document.getElementById('risk-card');
        if (riskVal) {
            riskVal.innerText = data.robot.collision_risk;
            if (data.robot.collision_risk === "CRITICAL") {
                riskVal.style.color = "#ff3300";
                riskCard.style.borderColor = "#ff3300";
            } else {
                riskVal.style.color = "var(--highlight)";
                riskCard.style.borderColor = "var(--border-color)";
            }
        }

        // Update Host Stats
        document.getElementById('cpu-val').innerText = data.host.cpu + '%';
        document.getElementById('ram-val').innerText = data.host.ram + '%';
        document.getElementById('uptime-val').innerText = data.host.uptime;

    } catch (e) {}
}

function waitForThree() {
    if (typeof THREE !== 'undefined') initSimulation();
    else setTimeout(waitForThree, 100);
}
waitForThree();
