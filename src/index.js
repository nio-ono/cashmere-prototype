import * as THREE from 'three';
// import * as Noise from 'three-noise';
// console.log(Noise);

// === GLOBAL PARAMETERS ===

const cameraZPosition = 50;
const gridSpacing = .5;
const dotBaseSize = .5;
const waveSpeed = 2;
const waveIntensity = 1; // The contrast between the smallest and largest dots
const waveAmplitude = .5; // The magnitude of the waves at the high end (makes the big dots bigger)
const waveFrequency = .51;  // The scale of the noise overall (How zoomed in you are)
const octaveCount = 4; // Number of octaves
const persistence = .05; // Amount by which each octave contributes less than the previous one
const windDirection = new THREE.Vector2(0.5, 0.5);
const windIntensity = 0.01;

const vertices = [];

// const noise = new Noise.Perlin();

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

const rtTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
});

const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        dotBaseSize: { value: dotBaseSize },
        waveIntensity: { value: waveIntensity },
        waveSpeed: { value: waveSpeed },
        waveFrequency: { value: waveFrequency },
        waveAmplitude: { value: waveAmplitude },
        octaveCount: { value: octaveCount }, 
        persistence: { value: persistence },
        screenWidth: { value: window.innerWidth },
        screenHeight: { value: window.innerHeight },
        previousFrame: { value: rtTexture.texture },
        windDirection: { value: windDirection },  // example direction
        windIntensity: { value: windIntensity },  // example intensity

    },
    vertexShader: `
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

        // Simplex 2D noise
        //
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        
        float snoise(vec2 v){
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
        
        precision highp float;
        
        float layeredNoise(vec2 pos) {
            float total = 0.0;
            float amplitude = waveAmplitude;
            float frequency = waveFrequency;
            for(int i = 0; i < int(octaveCount); i++) {
                total += snoise(pos * frequency + time * 0.01) * amplitude;
                frequency *= 2.0;
                amplitude *= persistence;
            }
            return total;
        }
        
        float layeredNoiseWithWind(vec2 pos) {
            vec2 windPos = pos + windDirection * windIntensity * time;
            float windEffect = snoise(windPos);
            return layeredNoise(pos) + windEffect;
        }
    
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            float wave = layeredNoiseWithWind(mvPosition.xy * 0.5) * waveIntensity;
            gl_PointSize = clamp(dotBaseSize * (300.0 / -mvPosition.z) * (1.0 + wave), 1.0, 100.0);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        precision highp float;
        uniform sampler2D previousFrame;
        uniform float screenWidth;
        uniform float screenHeight;

        
        void main() {
            vec4 lastFrameColor = texture2D(previousFrame, gl_FragCoord.xy / vec2(screenWidth, screenHeight));
            gl_FragColor = vec4(1.0);  // Set this for a white color, remove mix function
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
    renderer.render(scene, camera, rtTexture);  // Render to the target
    renderer.render(scene, camera);  // Render to the screen

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
    shaderMaterial.uniforms.screenHeight.value = window.innerHeight;

});

animate();
