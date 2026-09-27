import * as THREE from 'three';

/**
 * Generates procedural canvas textures for planets, clouds, and stars.
 * Zero external asset dependencies, instant load time, high visual fidelity.
 */

// Cache textures so they are created only once
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a procedural Terran world texture with blue oceans, green/emerald landmasses,
 * and white polar ice caps.
 */
export function getTerranTexture(): THREE.CanvasTexture {
  if (textureCache.has('terran')) return textureCache.get('terran')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep oceanic base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 256);
  oceanGrad.addColorStop(0, '#0c4a6e');
  oceanGrad.addColorStop(0.5, '#0284c7');
  oceanGrad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 512, 256);

  // Continental landmasses
  ctx.fillStyle = '#10b981';
  for (let i = 0; i < 18; i++) {
    const cx = (i * 31 + 45) % 512;
    const cy = 40 + ((i * 47) % 170);
    const r = 30 + ((i * 19) % 45);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Secondary continent lobes
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(cx + r * 0.4, cy + r * 0.3, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
  }

  // Polar ice caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 234, 512, 22);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('terran', texture);
  return texture;
}

/**
 * Creates a transparent swirling cloud layer texture
 */
export function getCloudTexture(): THREE.CanvasTexture {
  if (textureCache.has('clouds')) return textureCache.get('clouds')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';

  for (let i = 0; i < 28; i++) {
    const cx = (i * 29) % 512;
    const cy = 30 + ((i * 37) % 190);
    const w = 60 + ((i * 17) % 90);
    const h = 8 + ((i * 7) % 18);

    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('clouds', texture);
  return texture;
}

/**
 * Creates an Ocean world texture (turquoise shallows and deep indigo)
 */
export function getOceanTexture(): THREE.CanvasTexture {
  if (textureCache.has('ocean')) return textureCache.get('ocean')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#0369a1');
  grad.addColorStop(0.3, '#0284c7');
  grad.addColorStop(0.7, '#0ea5e9');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Tropical archipelagos
  ctx.fillStyle = '#38bdf8';
  for (let i = 0; i < 35; i++) {
    const cx = (i * 41) % 512;
    const cy = 40 + ((i * 23) % 170);
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + (i % 8), 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('ocean', texture);
  return texture;
}

/**
 * Creates a Desert world texture (banded copper and golden dunes)
 */
export function getDesertTexture(): THREE.CanvasTexture {
  if (textureCache.has('desert')) return textureCache.get('desert')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < 256; y += 4) {
    const r = 217 + Math.sin(y * 0.1) * 30;
    const g = 119 + Math.cos(y * 0.08) * 25;
    const b = 6 + Math.sin(y * 0.15) * 10;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, y, 512, 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('desert', texture);
  return texture;
}

/**
 * Creates an Ice world texture (glacial cyan with white crevasses)
 */
export function getIceTexture(): THREE.CanvasTexture {
  if (textureCache.has('ice')) return textureCache.get('ice')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 20; i++) {
    const cx = (i * 53) % 512;
    const cy = (i * 37) % 256;
    ctx.fillRect(cx, cy, 70, 30);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('ice', texture);
  return texture;
}

/**
 * Creates a Volcanic world texture (obsidian with glowing magma fissures)
 */
export function getVolcanicTexture(): THREE.CanvasTexture {
  if (textureCache.has('volcanic')) return textureCache.get('volcanic')!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1917';
  ctx.fillRect(0, 0, 512, 256);

  // Glowing lava veins
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 8;

  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    let x = (i * 45) % 512;
    let y = (i * 35) % 256;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (Math.sin(j + i) * 35);
      y += (Math.cos(j * i) * 30);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('volcanic', texture);
  return texture;
}

/**
 * Creates a Sun star surface texture with animated solar granulation
 */
export function getSunTexture(colorHex: string = '#f59e0b'): THREE.CanvasTexture {
  const cacheKey = `sun_${colorHex}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, colorHex);
  grad.addColorStop(0.8, '#78350f');
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}
