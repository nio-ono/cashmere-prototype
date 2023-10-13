import * as THREE from 'three';

// === GLOBAL PARAMETERS ===

const cameraZPosition = 50;
const gridSpacing = 1.0;
const dotBaseSize = .5;
const waveSpeed = .125;
const waveIntensity = .5;

const vertices = [];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = cameraZPosition;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let gridRows = Math.floor(window.innerWidth / gridSpacing);
let gridCols = Math.floor(window.innerHeight / gridSpacing);

function createGrid() {
    vertices.length = 0;
    const halfWidth = (gridRows * gridSpacing) / 2;
    const halfHeight = (gridCols * gridSpacing) / 2;
    for (let i = -halfWidth; i <= halfWidth; i += gridSpacing) {
        for (let j = -halfHeight; j <= halfHeight; j += gridSpacing) {
            vertices.push(i, j, 0);
        }
    }
    return new THREE.Float32BufferAttribute(vertices, 3);
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', createGrid());

const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        dotBaseSize: { value: dotBaseSize },
        waveIntensity: { value: waveIntensity }
    },
    vertexShader: `
        precision highp float;
        
        uniform float time;
        uniform float dotBaseSize;
        uniform float waveIntensity;
    
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            float wave = sin(position.x + time) * waveIntensity; // Only use the x coordinate for the wave
            gl_PointSize = clamp(dotBaseSize * (300.0 / -mvPosition.z) * (1.0 + wave), 1.0, 100.0);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        precision highp float;
        
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    `,
    transparent: true,
    depthTest: false,
});

const particles = new THREE.Points(geometry, shaderMaterial);
scene.add(particles);

function animate() {
    shaderMaterial.uniforms.time.value += waveSpeed;
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    renderer.setSize(newWidth, newHeight);
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    gridRows = Math.floor(newWidth / gridSpacing);
    gridCols = Math.floor(newHeight / gridSpacing);

    geometry.setAttribute('position', createGrid());
});

animate();
