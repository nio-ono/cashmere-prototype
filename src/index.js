import * as THREE from 'three';
import * as dat from 'dat.gui';

const showControlsByDefault = true;

// GUI Configuration
const GUIConfiguration = {
    camera: {
        cameraZ: { min: 10, max: 200, default: 150 }
    },
    color: {
        foreground: { default: "rgb(147, 144, 139)"},
        background: { default: "rgb(0,0,0)"}
    },
    dots: {
        spacing: { min: 0.5, max: 5, default: 2 },
        minSize: { min: 0, max: 2, default: 1 },
        maxSize: { min: 0.1, max: 20, default: 7 },
    },
    waveMovement: {
        speed: { min: 0, max: 4, default: 1 },
        frequency: { min: 0, max: .25, default: .03 },
        angle: { min: 0, max: 360, default: 30 },
    },
    waveGeometry: {
        convexity: { min: 0, max: 1, default: 0.5 },
    },
    chaos: {
        frothiness: { min: 0, max: 30, default: 0 },
        curvatureStrength: { min: 0, max: 500, default: 50 },
        curvatureScale: { min: 20.0, max: 1000.0, default: 300.0 },
        timeModulation: { min: 0, max: 100, default: 15 }
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
                if (folderName === "color") {
                    folder.addColor(this.params, paramName).onChange((value) => {
                        if (this.onChangeCallbacks[paramName]) {
                            this.onChangeCallbacks[paramName](value);
                        }
                    });
                } else {
                    const { min, max } = this.configuration[folderName][paramName];
                    folder.add(this.params, paramName, min, max).onChange((value) => {
                        if (this.onChangeCallbacks[paramName]) {
                            this.onChangeCallbacks[paramName](value);
                        }
                    });
                }
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
if (showControlsByDefault) {
    const gui = new dat.GUI();
    const guiCreator = new GUICreator(gui, GUIConfiguration, params);
    
    guiCreator.setCallback('cameraZ', (value) => {
        camera.position.z = value;
    });
    guiCreator.setCallback('spacing', createAndUpdateGrid);
    guiCreator.setCallback('minSize', (value) => {
        shaderMaterial.uniforms.minSize.value = value;
    });
    guiCreator.setCallback('maxSize', (value) => {
        shaderMaterial.uniforms.maxSize.value = value;
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
    guiCreator.setCallback('frothiness', (value) => {
        shaderMaterial.uniforms.frothiness.value = value;
    });
    guiCreator.setCallback('curvatureStrength', (value) => {
        shaderMaterial.uniforms.curvatureStrength.value = value;
    });
    guiCreator.setCallback('curvatureScale', (value) => {
        shaderMaterial.uniforms.curvatureScale.value = value;
    });
    guiCreator.setCallback('timeModulation', (value) => {
        shaderMaterial.uniforms.timeModulation.value = value;
    });
    guiCreator.setCallback('foreground', (value) => {
        shaderMaterial.uniforms.foreground.value.set(value);
    });
    guiCreator.setCallback('background', (value) => {
        shaderMaterial.uniforms.background.value.set(value);
        renderer.setClearColor(new THREE.Color(value));
    });
}

function createAndUpdateGrid(value) {
    geometry.setAttribute('position', createGrid());
    gridRows = Math.floor(window.innerWidth / params.spacing);
    gridCols = Math.floor(window.innerHeight / params.spacing);
}

const vertices = [];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.z = params.cameraZ;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(params.background));
document.body.appendChild(renderer.domElement);

let gridRows = Math.floor(window.innerWidth / params.spacing);
let gridCols = Math.floor(window.innerHeight / params.spacing);

function createGrid() {
    vertices.length = 0;
    const halfWidth = (gridRows * params.spacing) / 2;
    const halfHeight = (gridCols * params.spacing) / 2;
    for (let i = -halfWidth; i <= halfWidth; i += params.spacing) {
        for (let j = -halfHeight; j <= halfHeight; j += params.spacing) {
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
        minSize: { value: params.minSize },
        maxSize: { value: params.maxSize },
        speed: { value: params.speed },
        frequency: { value: params.frequency },
        angle: { value: THREE.MathUtils.degToRad(params.angle) },
        convexity: { value: params.convexity },
        frothiness:  { value: params.frothiness },
        frothScale:     { value: 20.0 },
        screenWidth: {value: window.innerWidth },
        curvatureStrength: { value: params.curvatureStrength },
        curvatureScale: { value: params.curvatureScale },
        timeModulation: { value: params.timeModulation },
        foreground: { value: new THREE.Color(params.foreground) },
        background: { value: new THREE.Color(params.background) },

    },
    vertexShader: `
        // Perlin noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                  + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }
        uniform float time;
        uniform float minSize;
        uniform float maxSize;
        uniform float speed;
        uniform float frequency;
        uniform float angle;
        uniform float convexity;
        uniform float frothiness;
        uniform float frothScale; 
        uniform float curvatureStrength;
        uniform float curvatureScale;
        uniform float timeModulation;
        
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            float pi = 3.14159265359;
            float adjustedX = mvPosition.x * cos(angle) - mvPosition.y * sin(angle);
            
            // Compute the noise for curvature
            float curvatureNoiseValue = snoise(vec2(
                (mvPosition.x + time * timeModulation) / curvatureScale,
                (mvPosition.y + time * timeModulation) / curvatureScale
            ));
            adjustedX += curvatureStrength * curvatureNoiseValue;
            
            // Compute the noise for froth
            float frothNoiseValue = snoise(vec2(
                (mvPosition.x * frothScale),
                (mvPosition.y * frothScale)
            )); 
            
            // Add the noise to the x coordinate
            adjustedX += frothiness * frothNoiseValue;
            
            float x = mod(adjustedX * frequency - time * speed, 2.0 * pi) / (2.0 * pi);
            
            float wave;
            float curvePower = 2.0 + 8.0 * convexity;
            wave = pow(x, curvePower);
            
            if (x > 0.99) { // Very close to the end
                wave = 0.0;  // sharp drop
            }
            
            float size = mix(minSize, maxSize, wave);
            gl_PointSize = size;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform vec3 foreground;
        uniform vec3 background;
        
        void main() {
            if (gl_FragCoord.z > 0.5) { // Check depth, adjust condition as needed
                gl_FragColor = vec4(foreground, 1.0);
            } else {
                gl_FragColor = vec4(background, 1.0);
            }
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
