import * as THREE from 'three';
import * as dat from 'dat.gui';

// GUI Configuration
const GUIConfiguration = {
    camera: {
        cameraZPosition: { min: 10, max: 200, default: 100 }
    },
    grid: {
        gridSpacing: { min: 0.1, max: 5, default: 1 },
        minDotSize: { min: 0.1, max: 2, default: 1 },
        maxDotSize: { min: 0.1, max: 20, default: 5 }
    },
    waveMovement: {
        speed: { min: 0, max: 10, default: 1 },
        frequency: { min: 0, max: 2, default: .125 },
        angle: { min: 0, max: 360, default: 20 },
    },
    waveGeometry: {
        convexity: { min: 0, max: 1, default: .5 },
    },
    environment: {
        groundFriction: { min: 0, max: 1, default: .5 },
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
guiCreator.setCallback('angle', (value) => {
    shaderMaterial.uniforms.angle.value = THREE.MathUtils.degToRad(value);
});
guiCreator.setCallback('waveWidth', (value) => {
    shaderMaterial.uniforms.waveWidth.value = value;
});
guiCreator.setCallback('convexity', (value) => {
    shaderMaterial.uniforms.convexity.value = value;
});
guiCreator.setCallback('groundFriction', (value) => {
    shaderMaterial.uniforms.groundFriction.value = value;
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
        angle: { value: THREE.MathUtils.degToRad(params.angle) },
        convexity: { value: params.convexity },
        groundFriction: { value: params.groundFriction },
    },
    vertexShader: `
        uniform float time;
        uniform float minDotSize;
        uniform float maxDotSize;
        uniform float speed;
        uniform float frequency;
        uniform float angle;
        uniform float convexity;
        uniform float groundFriction;
    
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
            float pi = 3.14159265359;
            float adjustedX = mvPosition.x * cos(angle) - mvPosition.y * sin(angle);
            float x = mod(adjustedX * frequency - time * speed, 2.0 * pi) / (2.0 * pi);
        
            float wave;
            float curvePower = 2.0 + 8.0 * convexity;
            wave = pow(x, curvePower);
        
            if (x > 0.99) { // Very close to the end
                wave = 0.0;  // sharp drop
            }
        
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
    const aspectRatio = newWidth / newHeight;

    renderer.setSize(newWidth, newHeight);
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();

    // Calculate gridCols based on the aspect ratio to maintain the same density
    gridCols = Math.floor(gridRows / aspectRatio);

    console.log("resize:" + gridRows + "," + gridCols);

    geometry.setAttribute('position', createGrid());
});

animate();
