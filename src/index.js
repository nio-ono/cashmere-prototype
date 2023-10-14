import * as THREE from 'three';
import * as dat from 'dat.gui';

// === PRESETS ===

const presets = {
    default: {
        cameraZPosition: 50,
        gridSpacing: .5,
        minDotSize: .5,
        maxDotSize: 1.5,
        waveSpeed: 2,
        waveFrequency: .51
    }
};

// === ACTIVE PARAMETERS ===

const params = presets.default;

const gui = new dat.GUI();
gui.add(params, 'cameraZPosition', 10, 100).onChange((value) => {
    camera.position.z = value;
});
gui.add(params, 'gridSpacing', 0.1, 5).onChange(createAndUpdateGrid);
gui.add(params, 'minDotSize', 0.1, 2).onChange((value) => {
    shaderMaterial.uniforms.minDotSize.value = value;
});
gui.add(params, 'maxDotSize', 0.1, 5).onChange((value) => {
    shaderMaterial.uniforms.maxDotSize.value = value;
});
gui.add(params, 'waveSpeed', 0, 10).onChange((value) => {
    shaderMaterial.uniforms.waveSpeed.value = value;
});
gui.add(params, 'waveFrequency', 0, 2).onChange((value) => {
    shaderMaterial.uniforms.waveFrequency.value = value;
});

function createAndUpdateGrid(value) {
    geometry.setAttribute('position', createGrid());
    gridRows = Math.floor(window.innerWidth / params.gridSpacing);
    gridCols = Math.floor(window.innerHeight / params.gridSpacing);
}

const vertices = [];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.z = params.cameraZPosition;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let gridRows = Math.floor(window.innerWidth / params.gridSpacing);
let gridCols = Math.floor(window.innerHeight / params.gridSpacing);

function createGrid() {
    vertices.length = 0;
    const halfWidth = (gridRows * params.gridSpacing) / 2;
    const halfHeight = (gridCols * params.gridSpacing) / 2;
    for (let i = -halfWidth; i <= halfWidth; i += params.gridSpacing) {
        for (let j = -halfHeight; j <= halfHeight; j += params.gridSpacing) {
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
        minDotSize: { value: params.minDotSize },
        maxDotSize: { value: params.maxDotSize },
        waveSpeed: { value: params.waveSpeed },
        waveFrequency: { value: params.waveFrequency }
    },
    vertexShader: `
        uniform float time;
        uniform float minDotSize;
        uniform float maxDotSize;
        uniform float waveSpeed;
        uniform float waveFrequency;

        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            float wave = 0.5 * sin(mvPosition.x * waveFrequency + time * waveSpeed) + 0.5; // Ranges from 0 to 1
            float size = mix(minDotSize, maxDotSize, wave);
            gl_PointSize = size;
            gl_Position = projectionMatrix * mvPosition;
        }

    `,
    fragmentShader: `
        void main() {
            gl_FragColor = vec4(1.0); 
        }
    `,
    transparent: true,
    depthTest: false,
});

const particles = new THREE.Points(geometry, shaderMaterial);
scene.add(particles);

function animate() {
    shaderMaterial.uniforms.time.value += params.waveSpeed * 0.01; // Smoother increase
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    renderer.setSize(newWidth, newHeight);
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    gridRows = Math.floor(newWidth / params.gridSpacing);
    gridCols = Math.floor(newHeight / params.gridSpacing);

    geometry.setAttribute('position', createGrid());
});

animate();
