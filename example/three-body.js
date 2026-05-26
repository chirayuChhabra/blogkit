let props = window.__simProps || { speed: 1.0, perturbation: 0, reset: false };

const initW = 800;
const initH = 450;

let bodies = [];
let trails = [];
let prevPerturbation = props.perturbation;

function resetSystem() {
  const cx = initW / 2;
  const cy = initH / 2;
  // Famous figure-8 orbit initial conditions (approximate)
  bodies = [
    { m: 100, x: cx + 100, y: cy, vx: 0, vy: 1 + props.perturbation * 0.1, color: "#f87171" },
    { m: 100, x: cx - 100, y: cy, vx: 0, vy: -1 - props.perturbation * 0.1, color: "#38bdf8" },
    { m: 100, x: cx, y: cy, vx: 0, vy: 0, color: "#facc15" }
  ];
  trails = [[], [], []];
}

resetSystem();

// Match the iframe background to the canvas to hide letterboxing sidebars
document.body.style.background = "#0a0a0a";

let camera = { x: initW / 2, y: initH / 2, zoom: 1 };
let isPanning = false;
let panStart = { x: 0, y: 0, camX: 0, camY: 0 };
let dragging = null;

window.addEventListener("bk:props", (e) => {
  const oldProps = { ...props };
  props = { ...props, ...e.detail };
  if (props.perturbation !== prevPerturbation || (props.reset && !oldProps.reset)) {
    prevPerturbation = props.perturbation;
    resetSystem();
    if (props.reset) setTimeout(() => {
      props.reset = false;
      window.dispatchEvent(new CustomEvent("bk:props", { detail: props }));
    }, 50);
  }
});

function physics() {
  const G = 1;
  const dt = 0.5 * props.speed;
  
  // Calculate forces
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].fx = 0; bodies[i].fy = 0;
    for (let j = 0; j < bodies.length; j++) {
      if (i === j) continue;
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const r2 = dx*dx + dy*dy;
      const r = Math.sqrt(r2);
      if (r < 5) continue; // collision prevention
      const f = (G * bodies[i].m * bodies[j].m) / r2;
      bodies[i].fx += f * (dx/r);
      bodies[i].fy += f * (dy/r);
    }
  }
  
  // Update velocity and position
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b === dragging) {
      b.vx = 0;
      b.vy = 0;
      trails[i] = [];
      continue;
    }
    b.vx += (b.fx / b.m) * dt;
    b.vy += (b.fy / b.m) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    
    trails[i].push({ x: b.x, y: b.y });
    if (trails[i].length > 400) trails[i].shift();
  }
}

function draw(ctx, logicalW, logicalH) {
  for(let i=0; i<4; i++) physics();
  
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, logicalW, logicalH);
  
  ctx.save();
  ctx.translate(logicalW / 2, logicalH / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (let i = 0; i < bodies.length; i++) {
    if (trails[i].length > 1) {
      ctx.beginPath();
      ctx.moveTo(trails[i][0].x, trails[i][0].y);
      for (let j = 1; j < trails[i].length; j++) {
        ctx.lineTo(trails[i][j].x, trails[i][j].y);
      }
      ctx.strokeStyle = bodies[i].color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    
    ctx.beginPath();
    ctx.arc(bodies[i].x, bodies[i].y, 6, 0, Math.PI * 2);
    ctx.fillStyle = bodies[i].color;
    ctx.fill();
  }
  
  ctx.restore();
}

function toWorld(sx, sy) {
  return {
    x: (sx - initW / 2) / camera.zoom + camera.x,
    y: (sy - initH / 2) / camera.zoom + camera.y
  };
}

const canvas = document.getElementById("c");

canvas.addEventListener("pointerdown", (e) => {
  const worldPos = toWorld(e.offsetX, e.offsetY);
  
  for (const b of bodies) {
    if (Math.hypot(worldPos.x - b.x, worldPos.y - b.y) < Math.max(15, 15 / camera.zoom)) {
      dragging = b;
      b.vx = 0;
      b.vy = 0;
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }
  
  isPanning = true;
  panStart = { x: e.offsetX, y: e.offsetY, camX: camera.x, camY: camera.y };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (dragging) {
    const worldPos = toWorld(e.offsetX, e.offsetY);
    dragging.x = worldPos.x;
    dragging.y = worldPos.y;
  } else if (isPanning) {
    camera.x = panStart.camX - (e.offsetX - panStart.x) / camera.zoom;
    camera.y = panStart.camY - (e.offsetY - panStart.y) / camera.zoom;
  }
});

canvas.addEventListener("pointerup", () => {
  dragging = null;
  isPanning = false;
});
canvas.addEventListener("pointercancel", () => {
  dragging = null;
  isPanning = false;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoomFactor = Math.pow(0.999, e.deltaY);
  const mx = e.offsetX;
  const my = e.offsetY;
  const worldPosBefore = toWorld(mx, my);
  
  camera.zoom *= zoomFactor;
  camera.zoom = Math.max(0.05, Math.min(camera.zoom, 50));
  
  const worldPosAfter = toWorld(mx, my);
  camera.x += worldPosBefore.x - worldPosAfter.x;
  camera.y += worldPosBefore.y - worldPosAfter.y;
});

window.bkSetup(initW, initH, draw);
