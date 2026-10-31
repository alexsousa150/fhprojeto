import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = 'C:/Users/User/.gemini/antigravity/brain/2f653e9c-cbd1-4660-bb56-3fcb8b6b7b97/.user_uploaded/media_1790035920055.png';
const destPath = path.join(__dirname, '../public/logo-fh.png');

fs.copyFileSync(sourcePath, destPath);

const buf = fs.readFileSync(sourcePath);
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

// Extrai IDAT chunks
const idatChunks = [];
let offset = 8;
while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IDAT') {
    idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
  }
  offset += 12 + len;
}
const raw = zlib.inflateSync(Buffer.concat(idatChunks));

const stride = width * 4;
const pixels = Buffer.alloc(width * height * 4);
let rawOffset = 0;
for (let y = 0; y < height; y++) {
  const filterType = raw[rawOffset++];
  const prevLineOffset = (y - 1) * stride;
  const currLineOffset = y * stride;
  for (let x = 0; x < stride; x++) {
    const rawByte = raw[rawOffset++];
    const a = (x >= 4) ? pixels[currLineOffset + x - 4] : 0;
    const b = (y > 0) ? pixels[prevLineOffset + x] : 0;
    const c = (y > 0 && x >= 4) ? pixels[prevLineOffset + x - 4] : 0;
    let val = 0;
    if (filterType === 0) val = rawByte;
    else if (filterType === 1) val = (rawByte + a) & 0xff;
    else if (filterType === 2) val = (rawByte + b) & 0xff;
    else if (filterType === 3) val = (rawByte + Math.floor((a + b) / 2)) & 0xff;
    else if (filterType === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      val = (rawByte + pr) & 0xff;
    }
    pixels[currLineOffset + x] = val;
  }
}

// Encontra o círculo analisando a linha central e a coluna central
const midY = Math.floor(height / 2);
const midX = Math.floor(width / 2);

console.log('Cor no centro (midX, midY):', {
  r: pixels[(midY * width + midX) * 4],
  g: pixels[(midY * width + midX) * 4 + 1],
  b: pixels[(midY * width + midX) * 4 + 2],
  a: pixels[(midY * width + midX) * 4 + 3]
});

console.log('Cor no canto (10, 10):', {
  r: pixels[(10 * width + 10) * 4],
  g: pixels[(10 * width + 10) * 4 + 1],
  b: pixels[(10 * width + 10) * 4 + 2],
  a: pixels[(10 * width + 10) * 4 + 3]
});

// Encontrar onde o círculo começa e termina na linha horizontal central
let circleLeft = 0, circleRight = width - 1;
for (let x = 0; x < width; x++) {
  const idx = (midY * width + x) * 4;
  const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
  // Se não é branco puro
  if (!(r > 240 && g > 240 && b > 240)) {
    circleLeft = x;
    break;
  }
}
for (let x = width - 1; x >= 0; x--) {
  const idx = (midY * width + x) * 4;
  const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
  if (!(r > 240 && g > 240 && b > 240)) {
    circleRight = x;
    break;
  }
}

// Encontrar onde o círculo começa e termina na coluna vertical central
let circleTop = 0, circleBottom = height - 1;
for (let y = 0; y < height; y++) {
  const idx = (y * width + midX) * 4;
  const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
  if (!(r > 240 && g > 240 && b > 240)) {
    circleTop = y;
    break;
  }
}
for (let y = height - 1; y >= 0; y--) {
  const idx = (y * width + midX) * 4;
  const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
  if (!(r > 240 && g > 240 && b > 240)) {
    circleBottom = y;
    break;
  }
}

// Centro e raio precisos do círculo
const circleCenterX = 291.5;
const circleCenterY = 212.5;
const circleRadius = 208.5; // raio do círculo

// Gerar uma imagem perfeitamente quadrada com fundo 100% transparente
const targetSize = 420;
const targetCenter = targetSize / 2;
const targetRadius = 207;

const outputPixels = Buffer.alloc(targetSize * targetSize * 4);

for (let y = 0; y < targetSize; y++) {
  for (let x = 0; x < targetSize; x++) {
    const dstIdx = (y * targetSize + x) * 4;
    const dist = Math.hypot(x - targetCenter, y - targetCenter);

    if (dist <= targetRadius + 1.0) {
      // Coordenadas na imagem original
      const srcX = Math.round(circleCenterX - targetCenter + x);
      const srcY = Math.round(circleCenterY - targetCenter + y);

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIdx = (srcY * width + srcX) * 4;
        outputPixels[dstIdx] = pixels[srcIdx];         // R
        outputPixels[dstIdx + 1] = pixels[srcIdx + 1]; // G
        outputPixels[dstIdx + 2] = pixels[srcIdx + 2]; // B

        // Suavização anti-serrilhamento na borda
        if (dist <= targetRadius - 0.5) {
          outputPixels[dstIdx + 3] = 255;
        } else {
          const alpha = Math.max(0, Math.min(255, Math.round(255 * (1 - (dist - (targetRadius - 0.5)) / 1.5))));
          outputPixels[dstIdx + 3] = alpha;
        }
      }
    } else {
      // Fora do círculo: 100% TRANSPARENTE (SEM BRANCO)
      outputPixels[dstIdx] = 0;
      outputPixels[dstIdx + 1] = 0;
      outputPixels[dstIdx + 2] = 0;
      outputPixels[dstIdx + 3] = 0;
    }
  }
}

// Codificador PNG puro
function makePng(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[i] = c;
  }
  function crc32(b) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeChunk(type, data) {
    const len = data.length;
    const b = Buffer.alloc(12 + len);
    b.writeUInt32BE(len, 0);
    b.write(type, 4, 'ascii');
    data.copy(b, 8);
    b.writeUInt32BE(crc32(b.subarray(4, 8 + len)), 8 + len);
    return b;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.writeUInt8(8, 8); // 8 bits
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const rawScanlines = Buffer.alloc(h * (1 + w * 4));
  let srcP = 0, dstP = 0;
  for (let y = 0; y < h; y++) {
    rawScanlines[dstP++] = 0; // sem filtro
    rgba.copy(rawScanlines, dstP, srcP, srcP + w * 4);
    dstP += w * 4;
    srcP += w * 4;
  }

  const idat = zlib.deflateSync(rawScanlines, { level: 9 });
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', iend)
  ]);
}

const finalPng = makePng(targetSize, targetSize, outputPixels);
fs.writeFileSync(destPath, finalPng);
console.log(`Logo perfeitamente centralizada e sem fundo branco salva em: ${destPath} (${targetSize}x${targetSize}px)`);

// Salvar também como logo-fh.jpg (formato PNG com extensão ou cópia) para compatibilidade retroativa
const destPathJpg = path.join(__dirname, '../public/logo-fh.jpg');
fs.writeFileSync(destPathJpg, finalPng);
console.log(`Atualizado também em: ${destPathJpg}`);





