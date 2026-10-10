import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SAGE = [0x2f, 0x6d, 0x55, 255];
const CREAM = [0xf5, 0xf4, 0xee, 255];
const CLAY = [0xc9, 0x6b, 0x4a, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function pngFromRgba(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function set(buf, w, x, y, color) {
  if (x < 0 || y < 0 || x >= w || y >= buf.length / 4 / w) return;
  const i = (y * w + x) * 4;
  buf[i] = color[0];
  buf[i + 1] = color[1];
  buf[i + 2] = color[2];
  buf[i + 3] = color[3];
}

function fill(w, h, color) {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    buf[i * 4] = color[0];
    buf[i * 4 + 1] = color[1];
    buf[i * 4 + 2] = color[2];
    buf[i * 4 + 3] = color[3];
  }
  return buf;
}

function paintMark(buf, w, h, cx, cy, radius) {
  const rayInner = radius * 0.46;
  const rayOuter = radius * 0.92;
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    rays.push([
      cx + Math.cos(a) * rayInner,
      cy + Math.sin(a) * rayInner,
      cx + Math.cos(a) * rayOuter,
      cy + Math.sin(a) * rayOuter,
    ]);
  }
  const x0 = Math.max(0, Math.floor(cx - radius - 2));
  const x1 = Math.min(w - 1, Math.ceil(cx + radius + 2));
  const y0 = Math.max(0, Math.floor(cy - radius - 2));
  const y1 = Math.min(h - 1, Math.ceil(cy + radius + 2));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      if (d <= radius * 0.34) {
        set(buf, w, x, y, CLAY);
        continue;
      }
      let onRay = false;
      for (const [ax, ay, bx, by] of rays) {
        const vx = bx - ax;
        const vy = by - ay;
        const l2 = vx * vx + vy * vy;
        let t = ((x + 0.5 - ax) * vx + (y + 0.5 - ay) * vy) / l2;
        t = Math.max(0, Math.min(1, t));
        const dist = Math.hypot(x + 0.5 - (ax + t * vx), y + 0.5 - (ay + t * vy));
        if (dist <= Math.max(2, radius * 0.045)) onRay = true;
      }
      if (onRay && d <= radius) set(buf, w, x, y, SAGE);
    }
  }
}

function icon(size, { padded = false } = {}) {
  const buf = fill(size, size, padded ? CREAM : SAGE);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const disc = size * (padded ? 0.3 : 0.36);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.hypot(x - cx, y - cy) <= disc) set(buf, size, x, y, CREAM);
    }
  }
  paintMark(buf, size, size, cx, cy, size * (padded ? 0.26 : 0.32));
  return pngFromRgba(size, size, buf);
}

function splash(size) {
  const buf = fill(size, size, CREAM);
  const mark = Math.round(size * 0.22);
  const left = Math.round((size - mark) / 2);
  const top = Math.round((size - mark) / 2);
  const cx = left + (mark - 1) / 2;
  const cy = top + (mark - 1) / 2;
  const r = mark * 0.22;
  for (let y = top; y < top + mark; y++) {
    for (let x = left; x < left + mark; x++) {
      const dx = x - left - (mark - 1) / 2;
      const dy = y - top - (mark - 1) / 2;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const rr = mark * 0.18;
      const half = mark / 2;
      const qx = Math.max(ax - (half - rr), 0);
      const qy = Math.max(ay - (half - rr), 0);
      if (qx * qx + qy * qy <= rr * rr) set(buf, size, x, y, SAGE);
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.hypot(x - cx, y - cy) <= mark * 0.36) set(buf, size, x, y, CREAM);
    }
  }
  paintMark(buf, size, size, cx, cy, r > 0 ? mark * 0.32 : r);
  return pngFromRgba(size, size, buf);
}

function write(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}

write("public/pwa-192.png", icon(192, { padded: true }));
write("public/pwa-512.png", icon(512, { padded: true }));
write("public/apple-touch-icon.png", icon(180));
write("resources/icon.png", icon(1024));
write("resources/splash.png", splash(2732));
console.log("Wrote PWA icons, apple-touch-icon, resources/icon.png, resources/splash.png");
