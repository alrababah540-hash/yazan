// Single source of truth for apartment layouts. The same data draws the 2D architectural
// plan (canvas) AND extrudes the 3D apartment — so plan and model always match.
// Units: metres. x = left→right, y = corridor(0) → facade(D). Balcony beyond y = D.

export const LAYOUTS = {
  // Two-bedroom unit — the "selected" apartment
  b2: {
    W: 12, D: 9, balcony: 2.2, labelAr: 'غرفتا نوم',
    walls: [ // interior partitions [x1,y1,x2,y2]
      [3.4, 0, 3.4, 2.9], [5.2, 0, 5.2, 2.6], [5.2, 2.6, 5.6, 2.6], [6.4, 2.6, 7, 2.6],
      [7, 0, 7, 3.2], [7, 4.0, 7, 5.0], [7, 5.9, 7, 9], [7, 4.6, 12, 4.6],
      [7, 1.8, 7.0, 1.8], [9, 0, 9, 1.8], [9, 1.8, 10, 1.8], [10.8, 1.8, 12, 1.8],
    ],
    door: [3.8, 4.8], // entrance gap on y=0
    rooms: [
      { ar: 'المعيشة', x: 3.5, y: 6.9 }, { ar: 'المطبخ', x: 1.7, y: 1.5 },
      { ar: 'نوم رئيسية', x: 9.5, y: 6.8 }, { ar: 'نوم', x: 9.6, y: 3.2 },
      { ar: 'حمام', x: 6.1, y: 1.3 }, { ar: 'حمام', x: 10.5, y: 0.9 }, { ar: 'شرفة', x: 6, y: 10.1 },
    ],
    furniture: [ // [x, y, w, d, h, kind]
      [0.3, 0.3, 0.65, 2.6, 0.92, 'counter'], [1.4, 3.2, 1.6, 0.8, 0.92, 'counter'],
      [0.8, 7.0, 2.6, 0.95, 0.75, 'sofa'], [3.9, 5.6, 1.8, 0.95, 0.76, 'table'],
      [1.2, 5.6, 1.4, 0.7, 0.42, 'table'],
      [8.6, 6.0, 1.8, 2.1, 0.55, 'bed'], [8.9, 2.4, 1.4, 1.9, 0.55, 'bed'],
      [5.4, 0.2, 1.5, 0.75, 0.55, 'bath'], [9.2, 0.2, 1.6, 0.7, 0.55, 'bath'],
      [7.2, 0.2, 1.6, 0.6, 2.1, 'wardrobe'],
    ],
  },
  // One-bedroom variant (S6 "variety of layouts")
  b1: {
    W: 9, D: 9, balcony: 2.0, labelAr: 'غرفة نوم',
    walls: [[3.2, 0, 3.2, 3.0], [5.2, 0, 5.2, 2.6], [5.2, 2.6, 5.6, 2.6], [6.4, 2.6, 9, 2.6],
      [5.2, 4.2, 5.2, 9], [5.2, 2.6, 5.2, 3.2]],
    door: [3.6, 4.6],
    rooms: [{ ar: 'المعيشة', x: 2.6, y: 6.6 }, { ar: 'نوم', x: 7.1, y: 6.2 }, { ar: 'حمام', x: 7.2, y: 1.2 }, { ar: 'المطبخ', x: 1.6, y: 1.4 }],
    furniture: [[0.3, 0.3, 0.65, 2.6, 0.92, 'counter'], [0.6, 7.0, 2.4, 0.95, 0.75, 'sofa'],
      [6.0, 5.8, 1.8, 2.1, 0.55, 'bed'], [5.6, 0.2, 1.6, 0.7, 0.55, 'bath'], [2.0, 4.6, 1.6, 0.9, 0.76, 'table']],
  },
  // Three-bedroom variant
  b3: {
    W: 15, D: 9, balcony: 2.2, labelAr: 'ثلاث غرف نوم',
    walls: [[3.4, 0, 3.4, 2.9], [5.2, 0, 5.2, 2.6], [5.2, 2.6, 5.6, 2.6], [6.4, 2.6, 7, 2.6],
      [7, 0, 7, 3.2], [7, 4.0, 7, 5.0], [7, 5.9, 7, 9], [7, 4.6, 15, 4.6], [11, 4.6, 11, 9],
      [11, 0, 11, 2.0], [11, 2.9, 11, 4.6], [9, 0, 9, 1.8]],
    door: [3.8, 4.8],
    rooms: [{ ar: 'المعيشة', x: 3.5, y: 6.9 }, { ar: 'نوم', x: 9, y: 6.8 }, { ar: 'نوم', x: 13, y: 6.8 },
      { ar: 'نوم', x: 13, y: 2.4 }, { ar: 'المطبخ', x: 1.7, y: 1.5 }, { ar: 'حمام', x: 6.1, y: 1.3 }],
    furniture: [[0.3, 0.3, 0.65, 2.6, 0.92, 'counter'], [0.8, 7.0, 2.6, 0.95, 0.75, 'sofa'], [3.9, 5.6, 1.8, 0.95, 0.76, 'table'],
      [8.1, 6.0, 1.8, 2.1, 0.55, 'bed'], [12.1, 6.0, 1.8, 2.1, 0.55, 'bed'], [12.2, 1.4, 1.4, 1.9, 0.55, 'bed'],
      [5.4, 0.2, 1.5, 0.75, 0.55, 'bath']],
  },
};

const FONT = '"IBM Plex Sans Arabic"';

// Architectural drawing: poché exterior walls, thin partitions, door swings, dimension line.
// style: 'blueprint' (champagne lines on transparent) | 'paper' (charcoal on ivory)
export function drawPlan(ctx, L, { size = 1024, style = 'blueprint', labels = true, reveal = 1, dims = true } = {}) {
  const pad = size * 0.1;
  const s = (size - 2 * pad) / Math.max(L.W, L.D + L.balcony);
  const ox = (size - L.W * s) / 2, oy = (size - (L.D + L.balcony) * s) / 2;
  const P = (x, y) => [ox + x * s, oy + y * s];
  const ink = style === 'paper' ? '#2a2c30' : '#e6cf9c';
  const soft = style === 'paper' ? 'rgba(42,44,48,0.35)' : 'rgba(230,207,156,0.38)';
  ctx.clearRect(0, 0, size, size);
  if (style === 'paper') { ctx.fillStyle = '#f4efe5'; ctx.fillRect(0, 0, size, size); }
  ctx.save();
  // progressive reveal: clip from right to left (RTL reading direction)
  ctx.beginPath(); ctx.rect(size * (1 - reveal), 0, size * reveal, size); ctx.clip();
  // fine grid
  ctx.strokeStyle = style === 'paper' ? 'rgba(0,0,0,0.05)' : 'rgba(230,207,156,0.07)'; ctx.lineWidth = 1;
  for (let g = 0; g <= size; g += s * 0.5) { ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, size); ctx.moveTo(0, g); ctx.lineTo(size, g); ctx.stroke(); }
  // balcony
  ctx.setLineDash([s * 0.15, s * 0.1]); ctx.strokeStyle = soft; ctx.lineWidth = s * 0.03;
  ctx.strokeRect(...P(0.4, L.D), (L.W - 0.8) * s, L.balcony * s); ctx.setLineDash([]);
  // exterior walls (poché) with entrance gap and facade glazing
  const tw = 0.25 * s; ctx.fillStyle = ink;
  ctx.fillRect(...P(0, 0), L.door[0] * s, tw); ctx.fillRect(...P(L.door[1], 0), (L.W - L.door[1]) * s, tw);
  ctx.fillRect(...P(0, 0), tw, L.D * s); ctx.fillRect(...P(L.W - 0.25, 0), tw, L.D * s);
  // glazing on facade: double thin line + mullions
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.5, s * 0.025);
  const [gx, gy] = P(0, L.D);
  ctx.beginPath(); ctx.moveTo(gx, gy - tw * 0.2); ctx.lineTo(gx + L.W * s, gy - tw * 0.2);
  ctx.moveTo(gx, gy - tw * 0.8); ctx.lineTo(gx + L.W * s, gy - tw * 0.8); ctx.stroke();
  for (let x = 0; x <= L.W; x += 1.5) { ctx.fillRect(gx + x * s - 2, gy - tw, 4, tw); }
  // partitions
  ctx.lineWidth = 0.12 * s; ctx.lineCap = 'square';
  for (const [x1, y1, x2, y2] of L.walls) { ctx.beginPath(); ctx.moveTo(...P(x1, y1)); ctx.lineTo(...P(x2, y2)); ctx.stroke(); }
  // entrance door swing
  ctx.lineWidth = Math.max(1, s * 0.02); ctx.strokeStyle = soft;
  const dw = (L.door[1] - L.door[0]) * s; const [dx, dy] = P(L.door[0], 0.12);
  ctx.beginPath(); ctx.arc(dx, dy, dw, 0, Math.PI / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx, dy + dw); ctx.stroke();
  // furniture outlines
  ctx.strokeStyle = soft; ctx.lineWidth = Math.max(1, s * 0.018);
  for (const [x, y, w, d, , k] of L.furniture) {
    const [px, py] = P(x, y); ctx.beginPath(); ctx.roundRect(px, py, w * s, d * s, s * 0.08); ctx.stroke();
    if (k === 'bed') { ctx.beginPath(); ctx.moveTo(px, py + d * s * 0.22); ctx.lineTo(px + w * s, py + d * s * 0.22); ctx.stroke(); }
  }
  // room labels
  if (labels) {
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
    ctx.font = `500 ${Math.round(s * 0.42)}px ${FONT}`;
    for (const r of L.rooms) ctx.fillText(r.ar, ...P(r.x, r.y));
  }
  // overall dimension line (no invented areas — geometry only)
  if (dims) {
    ctx.strokeStyle = soft; ctx.lineWidth = 1.5;
    const y = oy - s * 0.45; ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + L.W * s, y);
    ctx.moveTo(ox, y - 8); ctx.lineTo(ox, y + 8); ctx.moveTo(ox + L.W * s, y - 8); ctx.lineTo(ox + L.W * s, y + 8); ctx.stroke();
  }
  ctx.restore();
}
