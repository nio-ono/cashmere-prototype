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
    // return postProcess(combinedNoise); 
    return postProcess(combinedNoise + windEffectPos.y);
}

void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    float wave = layeredNoiseWithWind(mvPosition.xy * 0.5) * waveIntensity;
    gl_PointSize = clamp(dotBaseSize * (200.0 / -mvPosition.z) * (1.0 + wave * 1.5), 1.0, 100.0);
    gl_Position = projectionMatrix * mvPosition;
}