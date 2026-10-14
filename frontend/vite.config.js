import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcLogo = 'C:/Users/LEGION/.gemini/antigravity/brain/cbbef71f-8443-42c6-964a-83bccfec6bc7/.user_uploaded/media_1791760176587.png';

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calcCrc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const toCrc = Buffer.concat([typeBuf, dataBuf]);
  const crc = calcCrc(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

function removeBackground(inputPngBuf) {
  // Verify PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!inputPngBuf.subarray(0, 8).equals(sig)) {
    throw new Error('Not a PNG');
  }

  let pos = 8;
  let width = 0, height = 0, colorType = 0;
  const idatParts = [];

  while (pos < inputPngBuf.length) {
    const len = inputPngBuf.readUInt32BE(pos);
    const type = inputPngBuf.subarray(pos + 4, pos + 8).toString('ascii');
    const data = inputPngBuf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const rawCompressed = Buffer.concat(idatParts);
  const rawData = zlib.inflateSync(rawCompressed);

  const bpp = (colorType === 6) ? 4 : (colorType === 2) ? 3 : 1;
  const stride = width * bpp;
  const uncompressed = Buffer.alloc(width * height * bpp);

  let srcPos = 0;
  let dstPos = 0;
  for (let y = 0; y < height; y++) {
    const filter = rawData[srcPos++];
    for (let x = 0; x < stride; x++) {
      const b = (y > 0) ? uncompressed[dstPos - stride] : 0;
      const a = (x >= bpp) ? uncompressed[dstPos - bpp] : 0;
      const c = (y > 0 && x >= bpp) ? uncompressed[dstPos - stride - bpp] : 0;
      const rawVal = rawData[srcPos++];
      let val = rawVal;
      if (filter === 1) val = (rawVal + a) & 0xff;
      else if (filter === 2) val = (rawVal + b) & 0xff;
      else if (filter === 3) val = (rawVal + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = c;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        val = (rawVal + pr) & 0xff;
      }
      uncompressed[dstPos++] = val;
    }
  }

  // First pass: extract all pixels and compute tight bounding box around the artwork
  let minX = width, maxX = 0, minY = height, maxY = 0;
  const fullRgba = Buffer.alloc(width * height * 4);
  let inPixelPos = 0;
  dstPos = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = uncompressed[inPixelPos];
      const g = uncompressed[inPixelPos + 1];
      const b = uncompressed[inPixelPos + 2];
      inPixelPos += bpp;

      // In the oxblood maroon background: r is ~90, g is ~0, b is ~0.
      // In white linework: r, g, b are all high (~255).
      const lineStrength = Math.max(g, b);
      if (lineStrength >= 25) {
        const alpha = Math.min(255, Math.max(0, Math.round(((lineStrength - 25) / (255 - 25)) * 255)));
        fullRgba[dstPos] = 255;
        fullRgba[dstPos + 1] = 255;
        fullRgba[dstPos + 2] = 255;
        fullRgba[dstPos + 3] = alpha;

        if (alpha > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      } else {
        fullRgba[dstPos] = 0;
        fullRgba[dstPos + 1] = 0;
        fullRgba[dstPos + 2] = 0;
        fullRgba[dstPos + 3] = 0;
      }
      dstPos += 4;
    }
  }

  // Add 6px padding around artwork bounds
  const pad = 6;
  const cropX0 = Math.max(0, minX - pad);
  const cropY0 = Math.max(0, minY - pad);
  const cropX1 = Math.min(width - 1, maxX + pad);
  const cropY1 = Math.min(height - 1, maxY + pad);

  const cropWidth = cropX1 - cropX0 + 1;
  const cropHeight = cropY1 - cropY0 + 1;

  // Build tightly cropped 32-bit RGBA buffer
  const croppedRawRows = Buffer.alloc(cropHeight * (1 + cropWidth * 4));
  let outPos = 0;

  for (let y = cropY0; y <= cropY1; y++) {
    croppedRawRows[outPos++] = 0; // Filter 0 (None)
    for (let x = cropX0; x <= cropX1; x++) {
      const srcIdx = (y * width + x) * 4;
      croppedRawRows[outPos++] = fullRgba[srcIdx];
      croppedRawRows[outPos++] = fullRgba[srcIdx + 1];
      croppedRawRows[outPos++] = fullRgba[srcIdx + 2];
      croppedRawRows[outPos++] = fullRgba[srcIdx + 3];
    }
  }

  // Compress with zlib
  const newIdatData = zlib.deflateSync(croppedRawRows, { level: 9 });

  // IHDR chunk for RGBA (colorType = 6) with tight cropped dimensions
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(cropWidth, 0);
  ihdrData.writeUInt32BE(cropHeight, 4);
  ihdrData[8] = 8; // 8 bits
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const outBuf = Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', newIdatData),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);

  return outBuf;
}

try {
  if (fs.existsSync(srcLogo)) {
    const inputBuf = fs.readFileSync(srcLogo);
    const transparentPng = removeBackground(inputBuf);

    const publicDir = path.resolve(__dirname, 'public');
    const srcAssetsDir = path.resolve(__dirname, 'src/assets');
    const brainDir = path.resolve('C:/Users/LEGION/.gemini/antigravity/brain/cbbef71f-8443-42c6-964a-83bccfec6bc7');

    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    if (!fs.existsSync(srcAssetsDir)) fs.mkdirSync(srcAssetsDir, { recursive: true });

    // Save transparent files
    fs.writeFileSync(path.resolve(publicDir, 'forkcast-logo-transparent.png'), transparentPng);
    fs.writeFileSync(path.resolve(publicDir, 'forkcast-logo.png'), transparentPng);
    fs.writeFileSync(path.resolve(srcAssetsDir, 'forkcast-logo-transparent.png'), transparentPng);
    fs.writeFileSync(path.resolve(brainDir, 'forkcast-logo-transparent.png'), transparentPng);

    // Save base64 data for React bundle
    const base64Data = `data:image/png;base64,${transparentPng.toString('base64')}`;
    fs.writeFileSync(
      path.resolve(__dirname, 'src/logoData.js'),
      `export const forkcastLogo = "${base64Data}";\n`
    );
  }

  const srcHospitality = 'C:/Users/LEGION/.gemini/antigravity/brain/cbbef71f-8443-42c6-964a-83bccfec6bc7/.user_uploaded/media_1791793081595.png';
  if (fs.existsSync(srcHospitality)) {
    const hospBuf = fs.readFileSync(srcHospitality);
    const publicDir = path.resolve(__dirname, 'public');
    const brainDir = path.resolve('C:/Users/LEGION/.gemini/antigravity/brain/cbbef71f-8443-42c6-964a-83bccfec6bc7');
    fs.writeFileSync(path.resolve(publicDir, 'hospitality-sketch.png'), hospBuf);
    fs.writeFileSync(path.resolve(brainDir, 'hospitality-sketch.png'), hospBuf);

    const hospBase64 = `data:image/png;base64,${hospBuf.toString('base64')}`;
    fs.writeFileSync(
      path.resolve(__dirname, 'src/hospitalityData.js'),
      `export const hospitalitySketch = "${hospBase64}";\n`
    );
  }
} catch (err) {
  console.error('Error processing assets in vite.config:', err);
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: ['.', '..', 'C:/Users/LEGION/.gemini/antigravity/brain'],
    },
  },
});

