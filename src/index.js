import * as THREE from 'three';

// Scene, Camera, and Renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Parameters for the dot matrix grid
const gridSize = 500; 
const dotBaseSize = .001;

// Generate grid of dots
const geometry = new THREE.BufferGeometry();
const vertices = [];

for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
        vertices.push(i, j, 0);
    }
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

// Custom shader to adjust individual dot sizes
const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        size: { value: dotBaseSize }
    },
    vertexShader: `
        uniform float time;
        attribute float scale;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = scale * ( 300.0 / -mvPosition.z );
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        void main() {
            gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );
        }
    `,
    transparent: true
});

const particles = new THREE.Points(geometry, shaderMaterial);
scene.add(particles);

// Parameters for the wave animation
const waveSpeed = 0.05;
const waveIntensity = 0.5;

let time = 0;
const scales = new Float32Array(vertices.length / 3).fill(1);  // Initialize all scales to 1
geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

// Animation loop
function animate() {
    time += waveSpeed;

    for (let i = 0, j = 0; i < scales.length; i++, j += 3) {
        const x = vertices[j];
        const y = vertices[j + 1];
        scales[i] = 1 + waveIntensity * Math.sin(0.1 * x + time) * Math.sin(0.1 * y + time);
    }
    
    particles.geometry.attributes.scale.needsUpdate = true;
    shaderMaterial.uniforms.time.value = time;

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
