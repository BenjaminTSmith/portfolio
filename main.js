import './style.css';

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function easeInOutQuart(x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
camera.position.setZ(30);

const light = new THREE.AmbientLight(0x404040, 50);
scene.add( light );

const loader = new GLTFLoader();
let gameboy = null;
loader.load(
    '/smaller.glb', // Replace with the path to your GLTF file
    (gltf) => {
        console.log('here');
        gameboy = gltf.scene;

        gameboy.scale.set(150, 150, 150); // Scale the model to make it bigger
        const box = new THREE.Box3().setFromObject(gameboy);
        const center = box.getCenter(new THREE.Vector3());
        gameboy.position.sub(center);
        gameboy.position.set(0, 0, 0); // Center the model
        gameboy.rotation.set(0, 0, 0);

        gameboy.userData.forwardQuat = gameboy.quaternion.clone();

        scene.add(gameboy);
    },
    (xhr) => {
        console.log(`Model ${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    (error) => {
        console.error('An error occurred while loading the GLTF model:', error);
    }
);


let x = 0;
let y = 0;
document.addEventListener('mousemove', function(event) {
    x = event.clientX;
    y = event.clientY;
});

const clock = new THREE.Clock(true);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let closestObject = null;

function getClosestIntersection(camera, scene) {
    raycaster.setFromCamera(mouse, camera);

    // Perform intersection test
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        closestObject = intersects[0].object; // First item is always the closest
    } else {
        closestObject = null;
    }
}

function isChildOf(child, parent) {
    while (child) {
        if (child === parent) return true;
        child = child.parent;
    }
    return false;
}

let gameboyTimer = 0;

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

document.addEventListener("visibilitychange", function() {
    if (document.hidden) {

    } else {

    }
});

const GameboyState = {
    spinning: "spinning",
    centering: "centering",
    zooming: "zooming",
    zoomed: "zoomed",
};

// gameboy state stuff for animation
let gameboyState = GameboyState.spinning;
let gameboyPositionInital = null;
let gameboyPositionFinal = new THREE.Vector3(0, -5, 26);
let gameboySpinRotationInitial = 0;
window.addEventListener('click', () => {
    getClosestIntersection(camera, scene);
    if (isChildOf(closestObject, gameboy) && gameboyState == GameboyState.spinning) {
        gameboyState = GameboyState.centering;   

        gameboySpinRotationInitial = gameboy.quaternion.clone();
    }
});

let running = true;

const gameboyAnimationPeriod = 3;
const f = 1 / gameboyAnimationPeriod;
let gameboyAnimationTimer = 0
let gameboySpinTimer = 0;
let closestEndOfPeriod = 0;


let logoAnimationComplete = false;
function animateLogo() {
    if (logoAnimationComplete) return;
    logoAnimationComplete = true;

    const logo = document.getElementById("nintendo");
    const sound = document.getElementById("sound");
    const projects = document.getElementById("projects");

    setTimeout(() => {
        logo.style.top = "50%";   // move into center vertically
        logo.style.transform = "translate(-50%, -50%)"; // keep centered
    }, 500);

    // After it’s in the middle, disappear
    setTimeout(() => {
        logo.style.display = "none";  // fade out
    }, 5000);

    // Optional: remove it from the DOM after fading
    setTimeout(() => {
        logo.remove();
        projects.style.display = "block";
    }, 5500);

    setTimeout(() => {
        sound.play();
    }, 2875);
}

function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    renderer.clear();

    if (gameboy !== null) {
        const element = document.getElementById("loading");
        element.style.display = "none";
    }

    getClosestIntersection(camera, scene);
    const dt = clock.getDelta();
    if (gameboyState == GameboyState.spinning) {

        if (isChildOf(closestObject, gameboy)) {
            gameboyTimer += dt / 0.7;
            if (gameboyTimer > 1) gameboyTimer = 1;
        } else {
            gameboyTimer -= dt / 0.7;
            if (gameboyTimer < 0) gameboyTimer = 0;
        }

        const gameboyT = easeInOutQuart(gameboyTimer);
        const gameboyZ = (1 - gameboyT) * 0 + gameboyT * 3.2;
        gameboy.position.z = gameboyZ;

        const timeToRotateGameboy = 6;
        gameboy.rotateY(dt / timeToRotateGameboy * 2 * Math.PI);
        console.log(gameboy.rotation.y);

        gameboyAnimationTimer += dt;
        if (gameboyAnimationTimer > gameboyAnimationPeriod) gameboyAnimationTimer = 0;
        gameboy.position.set(gameboy.position.x,
            1.5*Math.sin(f*2*Math.PI*gameboyAnimationTimer),
            gameboy.position.z);
        if (gameboyAnimationPeriod / 2 - gameboyAnimationTimer > 0) {
            closestEndOfPeriod = gameboyAnimationPeriod / 2;
        } else {
            closestEndOfPeriod = gameboyAnimationPeriod;
        }
    } else if (gameboyState == GameboyState.centering) {

        if (isChildOf(closestObject, gameboy)) {
            gameboyTimer += dt / 0.7;
            if (gameboyTimer > 1) gameboyTimer = 1;
        } else {
            // gameboyTimer -= dt / 0.7;
            if (gameboyTimer < 0) gameboyTimer = 0;
        }

        const gameboyT = easeInOutQuart(gameboyTimer);
        const gameboyZ = (1 - gameboyT) * 0 + gameboyT * 3.2;
        gameboy.position.z = gameboyZ;

        gameboySpinTimer += dt;
        if (gameboySpinTimer > 1) gameboySpinTimer = 1;
        //ameboy.rotation.y = lerp(gameboySpinRotationInitial, 0, easeInOutQuart(gameboySpinTimer));
        console.log(gameboy.rotation.y);
        // onsole.log(gameboySpinTimer);*/
        gameboy.quaternion.slerpQuaternions(gameboySpinRotationInitial, gameboy.userData.forwardQuat, easeInOutQuart(gameboySpinTimer));

        gameboyAnimationTimer += dt;
        if (gameboyAnimationTimer > closestEndOfPeriod) gameboyAnimationTimer = closestEndOfPeriod;
        gameboy.position.set(gameboy.position.x,
            1.5*Math.sin(f*2*Math.PI*gameboyAnimationTimer),
            gameboy.position.z);

        if (gameboySpinTimer == 1 && gameboyAnimationTimer == closestEndOfPeriod) {
            gameboyState = GameboyState.zooming;
            gameboyPositionInital = gameboy.position.clone();
            gameboyAnimationTimer = 0;
        }
    } else if (gameboyState == GameboyState.zooming) {
        gameboyAnimationTimer += dt;
        if (gameboyAnimationTimer > 1) {
            gameboyState = GameboyState.zoomed;
            renderer.domElement.style.display = 'none';
            document.body.style.backgroundColor = '#81975b';
        }
        gameboy.position.x = lerp(gameboyPositionInital.x, gameboyPositionFinal.x, easeInOutQuart(gameboyAnimationTimer));
        gameboy.position.y = lerp(gameboyPositionInital.y, gameboyPositionFinal.y, easeInOutQuart(gameboyAnimationTimer));
        gameboy.position.z = lerp(gameboyPositionInital.z, gameboyPositionFinal.z, easeInOutQuart(gameboyAnimationTimer));
    } else if (gameboyState == GameboyState.zoomed) {
        animateLogo();
    }

    renderer.render(scene, camera);
}

animate();
