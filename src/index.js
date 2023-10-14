import * as THREE from 'three';
import * as dat from 'dat.gui';

// GUI Configuration
const GUIConfiguration = {
    camera: {
        cameraZPosition: { min: 10, max: 100, default: 50 }
    },
    grid: {
        gridSpacing: { min: 0.1, max: 5, default: .5 },
        minDotSize: { min: 0.1, max: 2, default: .5 },
        maxDotSize: { min: 0.1, max: 20, default: 6 }
    },
    waveMovement: {
        speed: { min: 0, max: 10, default: 2 },
        frequency: { min: 0, max: 2, default: .5 }
    },
    waveGeometry: {
        waveWidth: { min: 0.1, max: 10, default: 1 },
        steepness: { min: 0.1, max: 5, default: 2 },
        peakSoftness: { min: 0.1, max: 2, default: 1 },
        troughSoftness: { min: 0.1, max: 2, default: 1 },
        trailingConvexity: { min: 0.1, max: 10, default: 1 }
    }
};

// Presets
const presets = {
    default: {}
};
for (let folder in GUIConfiguration) {
    for (let param in GUIConfiguration[folder]) {
        presets.default[param] = GUIConfiguration[folder][param].default;
    }
}

// 3. GUICreator Class
class GUICreator {
    constructor(gui, configuration, params) {
        this.gui = gui;
        this.configuration = configuration;
        this.params = params;
        this.initGUI();
    }

    initGUI() {
        for (let folderName in this.configuration) {
            const folder = this.gui.addFolder(folderName);
            folder.open();
            for (let paramName in this.configuration[folderName]) {
                const { min, max } = this.configuration[folderName][paramName];
                folder.add(this.params, paramName, min, max).onChange((value) => {
                    if (this.onChangeCallbacks[paramName]) {
                        this.onChangeCallbacks[paramName](value);
                    }
                });
            }
        }
    }

    setCallback(paramName, callback) {
        if (!this.onChangeCallbacks) this.onChangeCallbacks = {};
        this.onChangeCallbacks[paramName] = callback;
    }
}

// Active parameters from the default preset
const params = presets.default;

const gui = new dat.GUI();
const guiCreator = new GUICreator(gui, GUIConfiguration, params);

guiCreator.setCallback('cameraZPosition', (value) => {
    camera.position.z = value;
});
guiCreator.setCallback('gridSpacing', createAndUpdateGrid);
guiCreator.setCallback('minDotSize', (value) => {
    shaderMaterial.uniforms.minDotSize.value = value;
});
guiCreator.setCallback('maxDotSize', (value) => {
    shaderMaterial.uniforms.maxDotSize.value = value;
});
guiCreator.setCallback('speed', (value) => {
    shaderMaterial.uniforms.speed.value = value;
});
guiCreator.setCallback('frequency', (value) => {
    shaderMaterial.uniforms.frequency.value = value;
});
guiCreator.setCallback('waveWidth', (value) => {
    shaderMaterial.uniforms.waveWidth.value = value;
});
guiCreator.setCallback('steepness', (value) => {
    shaderMaterial.uniforms.steepness.value = value;
});
guiCreator.setCallback('peakSoftness', (value) => {
    shaderMaterial.uniforms.peakSoftness.value = value;
});
guiCreator.setCallback('troughSoftness', (value) => {
    shaderMaterial.uniforms.troughSoftness.value = value;
});
guiCreator.setCallback('trailingConvexity', (value) => {
    shaderMaterial.uniforms.trailingConvexity.value = value;
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
        speed: { value: params.speed },
        frequency: { value: params.frequency },
        waveWidth: { value: params.waveWidth },
        steepness: { value: params.steepness },
        peakSoftness: { value: params.peakSoftness },
        troughSoftness: { value: params.troughSoftness },
        trailingConvexity: { value: params.trailingConvexity }
    },
    vertexShader: `
        uniform float time;
        uniform float minDotSize;
        uniform float maxDotSize;
        uniform float speed;
        uniform float frequency;
        uniform float waveWidth;
        uniform float steepness;
        uniform float peakSoftness;
        uniform float troughSoftness;
        uniform float trailingConvexity;

        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
            float pi = 3.14159265359;
            float x = mod(mvPosition.x * frequency + time * speed, 2.0 * pi) / (2.0 * pi) * waveWidth;
        
            float wave = 0.0;
        
            if(x < steepness) {
                wave = x / steepness;
            } else if(x < steepness + peakSoftness) {
                wave = 1.0 - (x - steepness) / peakSoftness;
            } else {
                wave = 1.0 - (x - steepness - peakSoftness) / (waveWidth - steepness - peakSoftness);
            }
        
            wave = mix(0.5, 1.0, wave); // Map to [0.5, 1.0] range
        
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
    shaderMaterial.uniforms.time.value += params.speed * 0.01; // Smoother increase
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
