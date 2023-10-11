import * as THREE from 'three';

// === GLOBAL PARAMETERS ===

const cameraZPosition = 50;
const gridSpacing = 10;
const dotBaseSize = 0.1;
const waveSpeed = .5;
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
        pointSize: { value: 10.0 }
    },
    vertexShader: `
        precision highp float;
        uniform float time;
        in float scale;
        
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = 5.0;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        precision highp float;
        
        void main() {
            gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );
        }
    `,
    transparent: true,
    depthTest: false,
});

const particles = new THREE.Points(geometry, shaderMaterial);
scene.add(particles);

let time = 0;
const scales = new Float32Array(gridRows * gridCols).fill(5.0);
geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

function animate() {
    time += waveSpeed;

    for (let i = 0, j = 0; i < scales.length; i++, j += 3) {
        const x = vertices[j];
        const y = vertices[j + 1];
    }
    
    particles.geometry.attributes.scale.needsUpdate = true;
    shaderMaterial.uniforms.time.value = time;

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
    geometry.attributes.scale.array = new Float32Array(gridRows * gridCols).fill(1);
});

animate();
