import * as THREE from 'three';
import * as dat from 'dat.gui';

// === PRESETS ===

const presets = {
    default: {
        cameraZPosition: 50,
        gridSpacing: .7,
        dotBaseSize: .1,
        waveSpeed: 2,
        waveIntensity: .9,
        waveAmplitude: .08,
        waveFrequency: 1,
        octaveCount: 4,
        persistence: .05,
        windDirection: new THREE.Vector2(0.5, 0.5),
        windIntensity: 0.3,
    }
};

// === ACTIVE PARAMETERS ===

const params = presets.default;

const gui = new dat.GUI();
gui.add(params, 'cameraZPosition', 10, 100).onChange((value) => {
    camera.position.z = value;
});
gui.add(params, 'gridSpacing', 0.1, 5).onChange(createAndUpdateGrid);
gui.add(params, 'dotBaseSize', 0.1, 2).onChange((value) => {
    shaderMaterial.uniforms.dotBaseSize.value = value;
});
gui.add(params, 'waveSpeed', 0, 10);
gui.add(params, 'waveIntensity', 0, 5).onChange((value) => {
    shaderMaterial.uniforms.waveIntensity.value = value;
});
gui.add(params, 'waveAmplitude', 0, 2).onChange((value) => {
    shaderMaterial.uniforms.waveAmplitude.value = value;
});
gui.add(params, 'waveFrequency', 0, 2).onChange((value) => {
    shaderMaterial.uniforms.waveFrequency.value = value;
});
gui.add(params, 'octaveCount', 1, 8).step(1).onChange((value) => {
    shaderMaterial.uniforms.octaveCount.value = value;
});
gui.add(params, 'persistence', 0, 1).onChange((value) => {
    shaderMaterial.uniforms.persistence.value = value;
});
gui.add(params.windDirection, 'x', -1, 1).name('Wind Dir X').onChange(updateWindDirection);
gui.add(params.windDirection, 'y', -1, 1).name('Wind Dir Y').onChange(updateWindDirection);
gui.add(params, 'windIntensity', 0, 0.1).onChange((value) => {
    shaderMaterial.uniforms.windIntensity.value = value;
});

function createAndUpdateGrid(value) {
    geometry.setAttribute('position', createGrid());
    gridRows = Math.floor(window.innerWidth / params.gridSpacing);
    gridCols = Math.floor(window.innerHeight / params.gridSpacing);
}

function updateWindDirection() {
    shaderMaterial.uniforms.windDirection.value = params.windDirection;
}

const vertices = [];

// const noise = new Noise.Perlin();

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

const rtTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
});

const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        dotBaseSize: { value: params.dotBaseSize },
        waveIntensity: { value: params.waveIntensity },
        waveSpeed: { value: params.waveSpeed },
        waveFrequency: { value: params.waveFrequency },
        waveAmplitude: { value: params.waveAmplitude },
        octaveCount: { value: params.octaveCount },
        persistence: { value: params.persistence },
        screenWidth: { value: window.innerWidth },
        screenHeight: { value: window.innerHeight },
        previousFrame: { value: rtTexture.texture },
        windDirection: { value: params.windDirection },
        windIntensity: { value: params.windIntensity },
    },
    vertexShader: `
        precision highp float;

        uniform float screenWidth;
        uniform float screenHeight;
        uniform float time;
        uniform float dotBaseSize;
        uniform float waveIntensity;
        uniform float waveSpeed;
        uniform float waveFrequency;
        uniform float waveAmplitude;
        uniform float octaveCount;
        uniform float persistence;
        uniform vec2 windDirection;
        uniform float windIntensity;
        
        const float PI = 3.1415926535897932384626433832795;
        
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        
        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                   -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
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
        
        float turbulentNoise(vec2 pos) {
            float value = 0.0;
            float amplitude = waveAmplitude;
            float frequency = waveFrequency;
            float baseFrequency = 0.05;
            for(int i = 0; i < int(octaveCount); i++) {
                value += abs(snoise(pos * frequency + baseFrequency + time * 0.01)) * amplitude;
                frequency *= 2.2;
                amplitude *= persistence;
            }
            return value;
        }
        
        float postProcess(float value) {
            return pow(value, 0.8); // This is where the value is post-processed.
        }
        
        float layeredNoiseWithWind(vec2 pos) {
            vec2 windEffectPos = pos + windDirection * windIntensity * time * turbulentNoise(pos);
            // vec2 windEffectPos = pos;
            float currentNoise = turbulentNoise(pos);
            float shiftedNoise = turbulentNoise(pos + vec2(0.1, 0.1) * currentNoise);
            float combinedNoise = mix(currentNoise, shiftedNoise, 0.5);
            return postProcess(combinedNoise + windEffectPos.y);
        }
        
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            float wave = layeredNoiseWithWind(mvPosition.xy * 0.5) * waveIntensity;
            gl_PointSize = clamp(dotBaseSize * (200.0 / -mvPosition.z) * (1.0 + wave * 1.5), 1.0, 100.0);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        precision highp float;
        float rand(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            float dither = rand(gl_FragCoord.xy) * 0.0;
            gl_FragColor = vec4(1.0) + dither;
        }
    `,
    transparent: true,
    depthTest: false,
});

const particles = new THREE.Points(geometry, shaderMaterial);
scene.add(particles);

function animate() {
    shaderMaterial.uniforms.time.value += params.waveSpeed;
    requestAnimationFrame(animate);
    renderer.render(scene, camera, rtTexture);  // Render to the target
    renderer.render(scene, camera);  // Render to the screen

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
    shaderMaterial.uniforms.screenWidth.value = window.innerWidth;
    shaderMaterial.uniforms.screenHeight.value = window.innerHeight;

});

animate();
