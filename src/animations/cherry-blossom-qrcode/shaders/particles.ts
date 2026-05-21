import {
  BLOCK_SIZE,
  FLAT_ANGLE_X,
  FLAT_ANGLE_Y,
  ISO_ANGLE_X,
  ISO_ANGLE_Y,
  VIEW_SCALE_2D,
  VIEW_SCALE_3D,
  X_OFFSET_2D,
  Y_OFFSET_2D,
} from '../constants';
import { uniformsStruct } from './helpers';

export const particleVertexShader = /* wgsl */ `
${uniformsStruct}

struct ParticleOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) seed: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

fn hash(seed: f32) -> f32 {
  let s = sin(seed * 12.9898) * 43758.5453;
  return s - floor(s);
}

@vertex
fn main(@builtin(vertex_index) vi: u32) -> ParticleOut {
  let particleIdx = vi / 6u;
  let vertIdx = vi % 6u;

  let seed = f32(particleIdx) + 1.0;
  
  // 1. Spawning coordinate limits
  let angle = hash(seed * 3.4) * 6.28318;
  let canopyRadius = hash(seed * 5.9) * 0.40 * uniforms.gridSize * ${BLOCK_SIZE};
  
  let spawnX = cos(angle) * canopyRadius;
  let spawnZ = sin(angle) * canopyRadius;
  
  // Starting height near canopy height (canopy base height is 12 * 0.0245 = 0.294)
  let spawnY = 0.294 + hash(seed * 8.2) * 0.20;
  
  // 2. Trajectory with wrapping
  let fallSpeed = 0.06 + hash(seed * 11.3) * 0.08;
  let timeOffset = hash(seed * 14.1) * 30.0;
  let age = (uniforms.time + timeOffset) * fallSpeed;
  let progressY = fract(age);
  
  // Falling from spawnY to ground
  let yPos = spawnY - progressY * (spawnY + 0.05);
  
  // Wind sway / horizontal drift
  let swayFreq = 1.2 + hash(seed * 17.2) * 1.5;
  let swayAmp = 0.015 + hash(seed * 19.8) * 0.025;
  let xPos = spawnX + sin(uniforms.time * swayFreq + seed) * swayAmp;
  let zPos = spawnZ + cos(uniforms.time * swayFreq * 0.8 + seed * 2.0) * swayAmp;

  // 3. Particle scaling (Winter snowflakes are slightly smaller)
  var size = 0.005 + hash(seed * 22.1) * 0.006;
  if (uniforms.season > 2.5) {
    size = 0.003 + hash(seed * 22.1) * 0.004;
  }
  
  // Seasonal leaf density threshold (out of 192 max particles)
  let seasonVal = uniforms.season;
  var maxActiveParticles = 192.0;

  if (seasonVal < 0.5) {
    // Spring: moderate petal fall (75 particles)
    maxActiveParticles = 75.0;
  } else if (seasonVal > 0.5 && seasonVal < 1.5) {
    // Summer: very few green leaves falling (15 particles)
    maxActiveParticles = 15.0;
  } else if (seasonVal > 1.5 && seasonVal < 2.5) {
    // Autumn: heavy leaf fall! (192 particles)
    maxActiveParticles = 192.0;
  } else {
    // Winter: steady, magical snowflake fall (120 particles)
    maxActiveParticles = 120.0;
  }

  if (f32(particleIdx) >= maxActiveParticles) {
    size = 0.0;
  }
  
  // Morph to size 0 in 2D flat view to maintain QR scannability
  size = size * (1.0 - uniforms.progress);

  // 4. Quad building
  var quad = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
  );
  let qv = quad[vertIdx] * size;

  // 5. Leaf tumbling rotations (Winter snowflakes do not tumble as aggressively)
  var rx = uniforms.time * (2.0 + hash(seed * 25.4) * 4.0) + seed;
  var ry = uniforms.time * (1.5 + hash(seed * 27.8) * 3.0) + seed;
  var rz = uniforms.time * (3.0 + hash(seed * 31.2) * 5.0) + seed;

  if (uniforms.season > 2.5) {
    rx = uniforms.time * 0.5 + seed;
    ry = uniforms.time * 0.8 + seed;
    rz = uniforms.time * 0.3 + seed;
  }

  let cx_rot = cos(rx); let sx_rot = sin(rx);
  let cy_rot = cos(ry); let sy_rot = sin(ry);
  let cz_rot = cos(rz); let sz_rot = sin(rz);

  // Particle lies flat on X-Z plane originally
  var localPos = vec3f(qv.x, 0.0, qv.y);

  // Rotate X
  let y1 = localPos.y * cx_rot - localPos.z * sx_rot;
  let z1 = localPos.y * sx_rot + localPos.z * cx_rot;
  localPos.y = y1; localPos.z = z1;

  // Rotate Y
  let x2 = localPos.x * cy_rot + localPos.z * sy_rot;
  let z2 = -localPos.x * sy_rot + localPos.z * cy_rot;
  localPos.x = x2; localPos.z = z2;

  // Rotate Z
  let x3 = localPos.x * cz_rot - localPos.y * sz_rot;
  let y3 = localPos.x * sz_rot + localPos.y * cz_rot;
  localPos.x = x3; localPos.y = y3;

  // Absolute 3D world position
  let worldPos = vec3f(xPos + localPos.x, yPos + localPos.y, zPos + localPos.z);

  // 6. Camera View transformation
  let progress = uniforms.progress;
  let isoAngleY = mix(${ISO_ANGLE_Y}, ${FLAT_ANGLE_Y}, progress);
  let isoAngleX = mix(${ISO_ANGLE_X}, ${FLAT_ANGLE_X}, progress);

  let cy_cam = cos(isoAngleY); let sy_cam = sin(isoAngleY);
  let cx_cam = cos(isoAngleX); let sx_cam = sin(isoAngleX);

  let ry_x = worldPos.x * cy_cam - worldPos.z * sy_cam;
  let ry_z = worldPos.x * sy_cam + worldPos.z * cy_cam;
  let rx_y = worldPos.y * cx_cam - ry_z * sx_cam;
  let rx_z = worldPos.y * sx_cam + ry_z * cx_cam;

  let viewScale = mix(${VIEW_SCALE_3D}, ${VIEW_SCALE_2D}, progress);
  let ar = uniforms.aspectRatio;
  let scaleX = viewScale / max(ar, 1.0);
  let scaleY = viewScale / max(1.0 / ar, 1.0);

  let yOffsetScene = mix(0.0, ${Y_OFFSET_2D}, progress);
  let xOffsetScene = mix(0.0, ${X_OFFSET_2D}, progress);

  var o: ParticleOut;
  o.position = vec4f(
    (ry_x + xOffsetScene) * scaleX,
    (rx_y + yOffsetScene) * scaleY,
    rx_z * 0.01 + 0.49, // Drawn in front of shadow, blended with tree blocks
    1.0
  );
  o.uv = quad[vertIdx];
  o.seed = seed;
  return o;
}
`;

export const particleFragmentShader = /* wgsl */ `
${uniformsStruct}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

fn hash(seed: f32) -> f32 {
  let s = sin(seed * 12.9898) * 43758.5453;
  return s - floor(s);
}

@fragment
fn main(@location(0) uv: vec2f, @location(1) seed: f32) -> @location(0) vec4f {
  let season = uniforms.season;
  let centered = uv;
  let dist = length(centered);

  // 1. Procedural pixel geometry shaping
  if (season > 2.5) {
    // Winter snowflake: soft round circular dot
    if (dist > 0.8) {
      discard;
    }
  } else {
    // Spring, Summer, Autumn: Pointy leaf shape
    let leafWidth = 0.45 + hash(seed * 41.2) * 0.35;
    let leafShape = abs(centered.y) - (1.0 - abs(centered.x)) * leafWidth;
    if (leafShape > 0.0) {
      discard;
    }
  }

  // 2. Season-based color selections
  var baseCol = vec3f(1.0);
  var alpha = 0.85;

  if (season < 0.5) {
    // Spring: Pink cherry blossom petals
    let pinkLight = vec3f(0.85, 0.45, 0.55);
    let pinkDark = vec3f(0.70, 0.25, 0.38);
    baseCol = mix(pinkLight, pinkDark, hash(seed * 43.7));
    alpha = 0.85;
  } else if (season > 0.5 && season < 1.5) {
    // Summer: Emerald green leaves
    let greenLight = vec3f(0.20, 0.58, 0.22);
    let greenDark = vec3f(0.06, 0.32, 0.08);
    baseCol = mix(greenLight, greenDark, hash(seed * 43.7));
    alpha = 0.80;
  } else if (season > 1.5 && season < 2.5) {
    // Autumn: Rich gold/red/orange leaves
    let gold = vec3f(0.92, 0.55, 0.06);
    let red = vec3f(0.72, 0.12, 0.04);
    baseCol = mix(gold, red, hash(seed * 43.7));
    alpha = 0.85;
  } else {
    // Winter: Frosted white snowflakes
    let white = vec3f(0.98, 0.98, 1.0);
    let blueTint = vec3f(0.82, 0.90, 0.96);
    baseCol = mix(white, blueTint, hash(seed * 43.7));
    // Soft radial fade for snowflakes
    alpha = 0.90 * (1.0 - dist);
  }

  // Multiply by (1.0 - progress) for safety to make 100% sure they fade out in 2D
  let finalAlpha = alpha * (1.0 - uniforms.progress);

  return vec4f(baseCol * finalAlpha, finalAlpha);
}
`;
