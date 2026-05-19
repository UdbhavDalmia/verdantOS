import { Jimp } from 'jimp';
import GIFEncoder from 'gif-encoder-2';
import fs from 'fs';
import path from 'path';

const baseImgPath = '/Users/mac/.gemini/antigravity/brain/a4a83a64-2a5c-4ed8-81c1-1910a5b8f450/verdant_base_wallpaper_1779098835072.png';
const outputDir = '/Users/mac/Desktop/OS/public/wallpapers';

// Ensure output dir exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log("Loading base image...");
  const baseImg = await Jimp.read(baseImgPath);
  
  // Crop to 1024x576 (lush middle canopy segment)
  const width = 1024;
  const height = 576;
  const cropped = baseImg.clone().crop({ x: 0, y: 420, w: width, h: height });
  
  const weathers = ['sunny', 'sunset', 'rainy', 'night'];
  
  for (const weather of weathers) {
    console.log(`Generating identical base for weather: ${weather}...`);
    const weatherBase = cropped.clone();
    
    // Apply highly harmonious weather color adjustments
    if (weather === 'sunset') {
      // Golden hour warm orange tint
      weatherBase.color([
        { apply: 'red', params: [25] },
        { apply: 'green', params: [8] },
        { apply: 'blue', params: [-15] }
      ]);
    } else if (weather === 'rainy') {
      // Darker, blue-grey desaturated storm tone
      weatherBase.color([
        { apply: 'blue', params: [15] },
        { apply: 'desaturate', params: [25] },
        { apply: 'darken', params: [20] }
      ]);
    } else if (weather === 'night') {
      // Deep blue navy forest with strong shadow contrast
      weatherBase.color([
        { apply: 'blue', params: [35] },
        { apply: 'red', params: [-35] },
        { apply: 'green', params: [-20] },
        { apply: 'darken', params: [40] }
      ]);
    } else {
      // Sunny: Original rich vibrant forest green
      weatherBase.color([
        { apply: 'saturate', params: [5] }
      ]);
    }
    
    // Set up GIF Encoder
    const encoder = new GIFEncoder(width, height, 'octree', true);
    const gifPath = path.join(outputDir, `${weather}.gif`);
    encoder.createReadStream().pipe(fs.createWriteStream(gifPath));
    
    encoder.start();
    encoder.setRepeat(0); // infinite loop
    encoder.setDelay(80); // 80ms delay = ~12.5 fps (buttery smooth for retro 16-bit pixel art!)
    encoder.setQuality(10);
    
    const totalFrames = 16;
    
    // Initialize stateful weather particle tracking for seamless loop
    const rainParticles = [];
    for (let i = 0; i < 50; i++) {
      rainParticles.push({
        x: Math.random() * width * 1.2,
        y: Math.random() * height,
        length: Math.random() * 15 + 10,
        speed: Math.random() * 12 + 10
      });
    }
    
    const fireflies = [];
    for (let i = 0; i < 20; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.6 + height * 0.3, // main clearance
        pulseOffset: Math.random() * Math.PI * 2,
        speedX: Math.random() * 2 - 1,
        angle: Math.random() * Math.PI * 2
      });
    }
    
    for (let f = 0; f < totalFrames; f++) {
      const frameImg = new Jimp({ width, height, color: 0x000000FF });
      
      // Determine max wind sway
      let maxSway = 6;
      if (weather === 'rainy') maxSway = 18; // strong wind in storm!
      
      // 1. Skew treetops row-by-row
      for (let y = 0; y < height; y++) {
        // Upper canopy sways, bottom is static
        const factor = Math.pow((height - 1 - y) / (height - 1), 2.2);
        const offsetX = Math.sin((f / totalFrames) * Math.PI * 2 + y * 0.012) * maxSway * factor;
        
        for (let x = 0; x < width; x++) {
          const srcX = Math.round(x - offsetX);
          const clampedX = Math.max(0, Math.min(width - 1, srcX));
          const colorInt = weatherBase.getPixelColor(clampedX, y);
          frameImg.setPixelColor(colorInt, x, y);
        }
      }
      
      // 2. Draw falling rain streaks
      if (weather === 'rainy') {
        const windX = -5;
        rainParticles.forEach(p => {
          // Advance rain positions statefully
          const py = (p.y + f * p.speed) % height;
          const px = (p.x + f * windX) % width;
          const finalX = px < 0 ? width + px : px;
          
          drawLine(
            frameImg,
            Math.round(finalX),
            Math.round(py),
            Math.round(finalX + windX * 0.8),
            Math.round(py + p.length),
            186, 230, 253, 130
          );
        });
      }
      
      // 3. Draw organic pulsing fireflies
      if (weather === 'night') {
        fireflies.forEach(p => {
          // Drifts slightly per frame
          const px = (p.x + f * p.speedX + width) % width;
          const py = p.y + Math.sin(p.angle + (f / totalFrames) * Math.PI * 2) * 8;
          
          const pulseVal = (Math.sin((f / totalFrames) * Math.PI * 2 + p.pulseOffset) + 1) / 2;
          const alpha = Math.round((pulseVal * 0.7 + 0.3) * 255);
          
          drawGlowDot(frameImg, Math.round(px), Math.round(py), 163, 230, 53, alpha);
        });
      }
      
      // Add compiled frame raw RGBA buffer to GIF encoder
      encoder.addFrame(frameImg.bitmap.data);
    }
    
    encoder.finish();
    console.log(`Successfully compiled: ${gifPath}`);
  }
}

// Local helper to convert RGBA to 32-bit unsigned integer color
function rgbaToColor(r, g, b, a) {
  return ((r & 0xFF) << 24 | (g & 0xFF) << 16 | (b & 0xFF) << 8 | (a & 0xFF)) >>> 0;
}

// Bresenham's line algorithm for gorgeous optimized rain streaks
function drawLine(img, x0, y0, x1, y1, r, g, b, a) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;
  
  let x = x0;
  let y = y0;
  const colorInt = rgbaToColor(r, g, b, a);
  
  while (true) {
    if (x >= 0 && x < img.bitmap.width && y >= 0 && y < img.bitmap.height) {
      img.setPixelColor(colorInt, x, y);
    }
    
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

// Custom layered radial glow dots for lag-free glowing fireflies
function drawGlowDot(img, cx, cy, r, g, b, maxAlpha) {
  const color1 = rgbaToColor(217, 249, 157, maxAlpha);
  const color2 = rgbaToColor(r, g, b, Math.round(maxAlpha * 0.45));
  const color3 = rgbaToColor(r, g, b, Math.round(maxAlpha * 0.15));
  
  // Core pixel
  if (cx >= 0 && cx < img.bitmap.width && cy >= 0 && cy < img.bitmap.height) {
    img.setPixelColor(color1, cx, cy);
  }
  
  // 3x3 inner glow
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const px = cx + dx;
      const py = cy + dy;
      if (px >= 0 && px < img.bitmap.width && py >= 0 && py < img.bitmap.height) {
        img.setPixelColor(color2, px, py);
      }
    }
  }
  
  // 5x5 outer glow
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) continue;
      const px = cx + dx;
      const py = cy + dy;
      if (px >= 0 && px < img.bitmap.width && py >= 0 && py < img.bitmap.height) {
        img.setPixelColor(color3, px, py);
      }
    }
  }
}

run().catch(console.error);
