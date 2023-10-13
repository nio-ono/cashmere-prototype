import * as THREE from 'three';
import * as Noise from 'three-noise';
console.log(Noise);

// === GLOBAL PARAMETERS ===

const cameraZPosition = 50;
const gridSpacing = 1.0;
const dotBaseSize = .25;
const waveSpeed = 1;
const waveIntensity = 20;

const vertices = [];

const noise = new Noise.Perlin();

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
        waveIntensity: { value: waveIntensity },
        waveSpeed: { value: waveSpeed },
        screenWidth: { value: window.innerWidth }
    },
    vertexShader: `
        uniform float screenWidth;
        const float PI = 3.1415926535897932384626433832795;

        float rand(vec2 c){
            return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }
        
        float noise(vec2 p, float freq ){
            float unit = screenWidth/freq;
            vec2 ij = floor(p/unit);
            vec2 xy = mod(p,unit)/unit;
            //xy = 3.*xy*xy-2.*xy*xy*xy;
            xy = .5*(1.-cos(PI*xy));
            float a = rand((ij+vec2(0.,0.)));
            float b = rand((ij+vec2(1.,0.)));
            float c = rand((ij+vec2(0.,1.)));
            float d = rand((ij+vec2(1.,1.)));
            float x1 = mix(a, b, xy.x);
            float x2 = mix(c, d, xy.x);
            return mix(x1, x2, xy.y);
        }
        
        float pNoise(vec2 p, int res){
            float persistance = .5;
            float n = 0.;
            float normK = 0.;
            float f = 4.;
            float amp = 1.;
            int iCount = 0;
            for (int i = 0; i<50; i++){
                n+=amp*noise(p, f);
                f*=2.;
                normK+=amp;
                amp*=persistance;
                if (iCount == res) break;
                iCount++;
            }
            float nf = n/normK;
            return nf*nf*nf*nf;
        }
        
        precision highp float;
        
        uniform float time;
        uniform float dotBaseSize;
        uniform float waveIntensity;
        uniform float waveSpeed;
    
        float noise(vec3 pos) {
            return pNoise(pos.xy, 4);  // Using the provided pNoise function
        }
    
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            float wave = sin(noise(mvPosition.xyz + time * waveSpeed)) * waveIntensity;
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
    shaderMaterial.uniforms.screenWidth.value = window.innerWidth;

});

animate();
