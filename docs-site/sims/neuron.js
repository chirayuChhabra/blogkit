// ============================================================
//  Organic Neural Network Cascades
//  Cinematic bioluminescent action potentials
// ============================================================

let signalSpeed = 2;
let refractoryTime = 2;

if (window.__simProps) {
  if (window.__simProps.signalSpeed !== undefined) signalSpeed = window.__simProps.signalSpeed;
  if (window.__simProps.refractoryTime !== undefined) refractoryTime = window.__simProps.refractoryTime;
}

window.addEventListener("bk:props", (e) => {
  const p = e.detail;
  if (p.signalSpeed !== undefined) signalSpeed = p.signalSpeed;
  if (p.refractoryTime !== undefined) refractoryTime = p.refractoryTime;
});

const NUM_NEURONS = 22;
const CONNECTION_RADIUS = 300;
const SOMA_RADIUS = 12;

// Utility to draw organic splines
function drawBezierCurve(ctx, x1, y1, x2, y2, controlScale = 0.5) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  // Normal vector
  const nx = -dy / dist;
  const ny = dx / dist;
  
  // Control point offset
  // We use a deterministic pseudo-random offset based on coordinates
  const rand = Math.sin(x1 * 12.9898 + y1 * 78.233) * 43758.5453;
  const offset = (rand - Math.floor(rand) - 0.5) * dist * controlScale;
  
  const cx = mx + nx * offset;
  const cy = my + ny * offset;
  
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  
  // Return control point for particle pathing
  return { cx, cy };
}

// Function to get point on quadratic bezier
function getBezierPoint(t, p0x, p0y, p1x, p1y, p2x, p2y) {
  const x = Math.pow(1 - t, 2) * p0x + 2 * (1 - t) * t * p1x + Math.pow(t, 2) * p2x;
  const y = Math.pow(1 - t, 2) * p0y + 2 * (1 - t) * t * p1y + Math.pow(t, 2) * p2y;
  return { x, y };
}

class Neuron {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.connections = []; // { target: Neuron, cx, cy }
    this.state = "resting"; // resting, firing, refractory
    this.timer = 0;
    
    // Organic body shape parameters
    this.bodyShape = [];
    const numPoints = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numPoints; i++) {
      const angle = (Math.PI * 2 / numPoints) * i;
      const r = SOMA_RADIUS * (0.8 + Math.random() * 0.4);
      this.bodyShape.push({ angle, r });
    }
    
    // Organic Dendrites
    this.dendrites = [];
    const numDendrites = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numDendrites; i++) {
      const angle = (Math.PI * 2 / numDendrites) * i + (Math.random() - 0.5);
      const length = 30 + Math.random() * 50;
      
      // Branching
      const branches = [];
      if (Math.random() > 0.3) {
        branches.push({
          angle: angle + (Math.random() * 0.8 - 0.4),
          length: length * (0.4 + Math.random() * 0.4)
        });
      }
      this.dendrites.push({ angle, length, branches });
    }
    
    // Slight breathing animation offset
    this.breathOffset = Math.random() * Math.PI * 2;
  }

  fire() {
    if (this.state !== "resting") return;
    this.state = "firing";
    this.timer = 0.3; // brief intense flash
    
    for (const conn of this.connections) {
      signals.push(new Signal(this, conn.target, conn.cx, conn.cy));
    }
  }

  update(dt) {
    if (this.state === "firing") {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = "refractory";
        this.timer = refractoryTime;
      }
    } else if (this.state === "refractory") {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = "resting";
      }
    }
  }

  draw(ctx, time) {
    ctx.save();
    
    const isResting = this.state === "resting";
    const isFiring = this.state === "firing";
    
    // 1. Draw Dendrites
    ctx.strokeStyle = isResting ? "rgba(0, 150, 200, 0.25)" : 
                      isFiring ? "rgba(100, 255, 255, 0.6)" : 
                      "rgba(120, 30, 80, 0.2)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    for (const d of this.dendrites) {
      // Main branch
      ctx.lineWidth = 1.5;
      const bx = this.x + Math.cos(d.angle) * d.length;
      const by = this.y + Math.sin(d.angle) * d.length;
      
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      drawBezierCurve(ctx, this.x, this.y, bx, by, 0.2);
      ctx.stroke();
      
      // Sub branches
      ctx.lineWidth = 0.8;
      for (const sub of d.branches) {
        const sx = bx + Math.cos(sub.angle) * sub.length;
        const sy = by + Math.sin(sub.angle) * sub.length;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        drawBezierCurve(ctx, bx, by, sx, sy, 0.2);
        ctx.stroke();
      }
    }

    // 2. Bioluminescent Glow
    ctx.globalCompositeOperation = "screen";
    const glowRadius = isFiring ? SOMA_RADIUS * 6 : SOMA_RADIUS * 3;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
    
    if (isResting) {
      const breath = Math.sin(time * 2 + this.breathOffset) * 0.1 + 0.9;
      grad.addColorStop(0, `rgba(0, 255, 200, ${0.4 * breath})`);
      grad.addColorStop(1, "rgba(0, 100, 150, 0)");
    } else if (isFiring) {
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.2, "rgba(100, 255, 255, 0.8)");
      grad.addColorStop(1, "rgba(0, 100, 255, 0)");
    } else { // Refractory
      grad.addColorStop(0, "rgba(150, 0, 100, 0.4)");
      grad.addColorStop(1, "rgba(50, 0, 50, 0)");
    }
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Organic Cell Body (Soma)
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    for (let i = 0; i < this.bodyShape.length; i++) {
      const pt = this.bodyShape[i];
      // breathing deformation
      const breathR = pt.r + Math.sin(time * 3 + pt.angle + this.breathOffset) * 1.5;
      const px = this.x + Math.cos(pt.angle) * breathR;
      const py = this.y + Math.sin(pt.angle) * breathR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    
    if (isResting) {
      ctx.fillStyle = "rgba(0, 40, 50, 1)";
      ctx.strokeStyle = "rgba(0, 200, 180, 0.8)";
    } else if (isFiring) {
      ctx.fillStyle = "rgba(200, 255, 255, 1)";
      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    } else {
      ctx.fillStyle = "rgba(40, 10, 30, 1)";
      ctx.strokeStyle = "rgba(120, 30, 80, 0.6)";
    }
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    
    // Draw nucleus
    ctx.beginPath();
    ctx.arc(this.x, this.y, SOMA_RADIUS * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = isFiring ? "#fff" : (isResting ? "rgba(0, 255, 200, 0.3)" : "rgba(150, 50, 100, 0.2)");
    ctx.fill();

    ctx.restore();
  }
}

class Signal {
  constructor(source, target, cx, cy) {
    this.source = source;
    this.target = target;
    this.cx = cx; // Control point for bezier curve
    this.cy = cy;
    this.progress = 0; // 0 to 1
    
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    this.dist = Math.sqrt(dx*dx + dy*dy);
    
    // Particles flowing with the signal
    this.particles = [];
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        offset: (Math.random() - 0.5) * 8, // perpendicular offset
        speedMult: 0.8 + Math.random() * 0.4,
        relPos: Math.random() * 0.3 - 0.15 // relative position to main pulse
      });
    }
  }

  update(dt) {
    // Constant speed propagation
    this.progress += (180 / this.dist) * signalSpeed * dt;
    
    if (this.progress >= 1) {
      this.target.fire();
      return true; // Done
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    
    // Main Pulse
    const pos = getBezierPoint(this.progress, this.source.x, this.source.y, this.cx, this.cy, this.target.x, this.target.y);
    
    const pulseRadius = 15;
    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, pulseRadius * 2);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.2, "rgba(100, 255, 255, 0.8)");
    grad.addColorStop(1, "rgba(0, 150, 255, 0)");
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pulseRadius * 2, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Trailing particles
    ctx.fillStyle = "rgba(100, 255, 255, 0.9)";
    for (const p of this.particles) {
      let pPos = this.progress + p.relPos;
      if (pPos < 0 || pPos > 1) continue;
      
      const pt = getBezierPoint(pPos, this.source.x, this.source.y, this.cx, this.cy, this.target.x, this.target.y);
      
      // Calculate tangent for perpendicular offset
      const t1 = Math.max(0, pPos - 0.01);
      const t2 = Math.min(1, pPos + 0.01);
      const pt1 = getBezierPoint(t1, this.source.x, this.source.y, this.cx, this.cy, this.target.x, this.target.y);
      const pt2 = getBezierPoint(t2, this.source.x, this.source.y, this.cx, this.cy, this.target.x, this.target.y);
      
      const angle = Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x);
      const px = pt.x + Math.cos(angle + Math.PI/2) * p.offset;
      const py = pt.y + Math.sin(angle + Math.PI/2) * p.offset;
      
      ctx.globalAlpha = 1 - Math.abs(p.relPos) / 0.15; // fade out edges
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

let neurons = [];
let signals = [];
let initialized = false;
let lastTime = 0;
let time = 0;

function generateNetwork(W, H) {
  neurons = [];
  signals = [];
  
  // Poisson-disc like distribution (avoid overlap)
  for (let i = 0; i < NUM_NEURONS; i++) {
    let x, y, valid;
    let attempts = 0;
    do {
      x = W * 0.1 + Math.random() * W * 0.8;
      y = H * 0.1 + Math.random() * H * 0.8;
      valid = true;
      for (const n of neurons) {
        if (Math.hypot(n.x - x, n.y - y) < 100) {
          valid = false; break;
        }
      }
      attempts++;
    } while (!valid && attempts < 50);
    
    neurons.push(new Neuron(x, y));
  }
  
  // Connect neurons with curved axons
  // Fake context to calculate curves
  const fakeCtx = { quadraticCurveTo: () => {} };
  
  for (let i = 0; i < neurons.length; i++) {
    const n1 = neurons[i];
    
    let nearby = [];
    for (let j = 0; j < neurons.length; j++) {
      if (i === j) continue;
      const n2 = neurons[j];
      const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
      if (dist < CONNECTION_RADIUS) {
        nearby.push({ node: n2, dist });
      }
    }
    
    // Sort and connect to 2-3 closest
    nearby.sort((a, b) => a.dist - b.dist);
    const numConnections = 1 + Math.floor(Math.random() * 2);
    
    for (let k = 0; k < Math.min(numConnections, nearby.length); k++) {
      const target = nearby[k].node;
      
      // Calculate control point for curved axon
      const mx = (n1.x + target.x) / 2;
      const my = (n1.y + target.y) / 2;
      const dx = target.x - n1.x;
      const dy = target.y - n1.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const nx = -dy / dist;
      const ny = dx / dist;
      
      const rand = Math.sin(n1.x * 12.9898 + n1.y * 78.233) * 43758.5453;
      const offset = (rand - Math.floor(rand) - 0.5) * dist * 0.4; // curve severity
      
      const cx = mx + nx * offset;
      const cy = my + ny * offset;
      
      n1.connections.push({ target, cx, cy });
    }
  }
}

function draw(ctx, logicalW, logicalH) {
  if (!initialized) {
    const canvas = ctx.canvas;
    canvas.style.touchAction = "none";
    
    function toLogical(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (logicalW / rect.width),
        y: (e.clientY - rect.top) * (logicalH / rect.height)
      };
    }
    
    canvas.addEventListener("pointerdown", (e) => {
      const pt = toLogical(e);
      for (const n of neurons) {
        if (Math.hypot(n.x - pt.x, n.y - pt.y) < SOMA_RADIUS * 3) {
          n.fire();
          break;
        }
      }
    });

    generateNetwork(logicalW, logicalH);
    // Random fire to start
    neurons[Math.floor(Math.random() * neurons.length)].fire();
    
    lastTime = performance.now();
    initialized = true;
  }

  const now = performance.now();
  let dt = (now - lastTime) / 1000;
  if (dt > 0.1) dt = 0.1;
  lastTime = now;
  time += dt;

  // Updates
  for (const n of neurons) n.update(dt);
  for (let i = signals.length - 1; i >= 0; i--) {
    if (signals[i].update(dt)) signals.splice(i, 1);
  }

  // Draw Background
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#010308";
  ctx.fillRect(0, 0, logicalW, logicalH);
  
  // Subtle organic vignette / noise overlay could go here

  // Draw Axons
  ctx.save();
  for (const n1 of neurons) {
    for (const conn of n1.connections) {
      const target = conn.target;
      
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.quadraticCurveTo(conn.cx, conn.cy, target.x, target.y);
      
      ctx.lineWidth = 1;
      
      // Color based on state
      if (n1.state === "firing") {
        ctx.strokeStyle = "rgba(0, 200, 255, 0.4)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(0, 255, 255, 0.5)";
      } else if (n1.state === "resting") {
        ctx.strokeStyle = "rgba(0, 100, 150, 0.15)";
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = "rgba(100, 20, 80, 0.1)";
        ctx.shadowBlur = 0;
      }
      
      ctx.stroke();
      
      // Synaptic Terminal (Glowing dot at the end)
      ctx.beginPath();
      ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  }
  ctx.restore();

  // Draw Signals
  for (const s of signals) s.draw(ctx);

  // Draw Neurons
  for (const n of neurons) n.draw(ctx, time);
  
  // Instructions
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(0, 255, 200, 0.5)";
  ctx.font = "14px monospace";
  ctx.fillText("Click any soma to trigger an action potential", 20, 30);
  ctx.restore();
}

window.bkSetup(1200, 800, draw);
