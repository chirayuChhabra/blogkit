// Simple electric field line simulator
// window.__simProps = { initialParticles: 2, showFieldLines: true }

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const props = window.__simProps || {};

canvas.width = canvas.offsetWidth || 640;
canvas.height = canvas.offsetHeight || 400;

const W = canvas.width,
  H = canvas.height;
let charges = [];
let dragging = null;

function initCharges(n) {
  charges = [];
  for (let i = 0; i < n; i++) {
    charges.push({
      x: W * (0.3 + (i * 0.4) / Math.max(n - 1, 1)),
      y: H / 2,
      q: i % 2 === 0 ? 1 : -1,
      r: 18,
    });
  }
}

initCharges(props.initialParticles ?? 2);

function fieldAt(px, py) {
  let fx = 0,
    fy = 0;
  for (const c of charges) {
    const dx = px - c.x,
      dy = py - c.y;
    const r2 = dx * dx + dy * dy;
    if (r2 < 100) continue;
    const mag = c.q / r2;
    fx += (mag * dx) / Math.sqrt(r2);
    fy += (mag * dy) / Math.sqrt(r2);
  }
  return { fx, fy };
}

function drawFieldLines() {
  ctx.lineWidth = 0.8;
  for (const c of charges) {
    if (c.q < 0) continue;
    const nLines = 16;
    for (let a = 0; a < nLines; a++) {
      const angle = (a / nLines) * Math.PI * 2;
      let x = c.x + Math.cos(angle) * (c.r + 4);
      let y = c.y + Math.sin(angle) * (c.r + 4);
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let step = 0; step < 200; step++) {
        const { fx, fy } = fieldAt(x, y);
        const mag = Math.sqrt(fx * fx + fy * fy);
        if (mag < 0.0001) break;
        x += (fx / mag) * 4;
        y += (fy / mag) * 4;
        ctx.lineTo(x, y);
        if (x < 0 || x > W || y < 0 || y > H) break;
        // stop near a negative charge
        let nearNeg = false;
        for (const nc of charges) {
          if (nc.q < 0 && Math.hypot(x - nc.x, y - nc.y) < nc.r + 4) {
            nearNeg = true;
            break;
          }
        }
        if (nearNeg) break;
      }
      // Color by charge type
      const grad = ctx.createLinearGradient(c.x, c.y, x, y);
      grad.addColorStop(0, "rgba(59,139,212,0.6)");
      grad.addColorStop(1, "rgba(216,90,48,0.6)");
      ctx.strokeStyle = grad;
      ctx.stroke();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Dark background
  ctx.fillStyle = "#0f0f13";
  ctx.fillRect(0, 0, W, H);

  if (props.showFieldLines !== false) drawFieldLines();

  // Draw charges
  for (const c of charges) {
    const color = c.q > 0 ? "#378add" : "#d85a30";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = c.q > 0 ? "#7fb8ee" : "#f09570";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.q > 0 ? "+" : "−", c.x, c.y);
  }

  // Label
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Drag charges to explore the field", 12, H - 12);
}

// Mouse interaction
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left,
    my = e.clientY - rect.top;
  for (const c of charges) {
    if (Math.hypot(mx - c.x, my - c.y) < c.r + 6) {
      dragging = c;
      break;
    }
  }
});
canvas.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  dragging.x = e.clientX - rect.left;
  dragging.y = e.clientY - rect.top;
  draw();
});
canvas.addEventListener("mouseup", () => {
  dragging = null;
});

draw();
