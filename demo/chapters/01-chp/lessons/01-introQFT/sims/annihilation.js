let speed = 3;
let resetTrigger = false;

if (window.__simProps) {
  if (window.__simProps.speed !== undefined) speed = window.__simProps.speed;
  if (window.__simProps.reset !== undefined) resetTrigger = window.__simProps.reset;
}

window.addEventListener("bk:props", (event) => {
  const props = event.detail;
  if (props.speed !== undefined) speed = props.speed;
  if (props.reset !== undefined && props.reset !== resetTrigger) {
    resetTrigger = props.reset;
    resetSimulation();
  }
});

let initialized = false;

// States: APPROACH, ANNIHILATE, PHOTONS
let state = "APPROACH";
let e1 = { x: -300, y: 0 };
let e2 = { x: 300, y: 0 };
let p1 = { x: 0, y: 0 };
let p2 = { x: 0, y: 0 };
let explosionTime = 0;
let explosionMax = 40;
let trails = [];
let particlesSystem = [];

function resetSimulation() {
  state = "APPROACH";
  e1 = { x: -400, y: 0 };
  e2 = { x: 400, y: 0 };
  p1 = { x: 0, y: 0 };
  p2 = { x: 0, y: 0 };
  explosionTime = 0;
  trails = [];
  particlesSystem = [];
}

function addTrail(x, y, color) {
  trails.push({ x, y, color, life: 1.0 });
  if (trails.length > 100) trails.shift();
}

function createExplosion() {
  for (let i = 0; i < 50; i++) {
    particlesSystem.push({
      x: 0, y: 0,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      life: 1.0,
      color: Math.random() > 0.5 ? '#fff' : '#00ffff'
    });
  }
}

function draw(ctx, logicalW, logicalH) {
  if (!initialized) {
    const canvas = ctx.canvas;
    canvas.style.touchAction = "none";
    resetSimulation();
    initialized = true;
  }

  // Update Logic
  if (state === "APPROACH") {
    e1.x += speed * 2;
    e2.x -= speed * 2;
    
    addTrail(e1.x, e1.y, '#00c8ff'); // Electron (cyan)
    addTrail(e2.x, e2.y, '#ff0055'); // Positron (magenta)

    if (e1.x >= e2.x) {
      state = "ANNIHILATE";
      createExplosion();
    }
  } else if (state === "ANNIHILATE") {
    explosionTime += 1;
    if (explosionTime > explosionMax) {
      state = "PHOTONS";
    }
  } else if (state === "PHOTONS") {
    explosionTime += 0.5; // Continue fading shockwave
    p1.y -= speed * 2.5;
    p2.y += speed * 2.5;
    
    // Photon wobbly trails
    addTrail(p1.x + Math.sin(p1.y * 0.1) * 10, p1.y, '#ffff00');
    addTrail(p2.x + Math.sin(p2.y * 0.1) * 10, p2.y, '#ffff00');

    // Auto reset if photons leave screen completely
    if (p1.y < -logicalH/2 - 100) {
      resetSimulation();
    }
  }

  // Update Particles
  for (let p of particlesSystem) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
  }
  particlesSystem = particlesSystem.filter(p => p.life > 0);

  // Update Trails
  for (let t of trails) {
    t.life -= 0.015;
  }
  trails = trails.filter(t => t.life > 0);

  // Rendering
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, logicalW, logicalH);
  
  ctx.save();
  ctx.translate(logicalW / 2, logicalH / 2);
  ctx.globalCompositeOperation = "screen";

  // Draw Trails
  for (let t of trails) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, 4 * t.life, 0, Math.PI * 2);
    ctx.fillStyle = t.color;
    ctx.globalAlpha = t.life;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw Explosion Particles
  for (let p of particlesSystem) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw Entities
  if (state === "APPROACH") {
    // Electron
    ctx.beginPath();
    ctx.arc(e1.x, e1.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#00c8ff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00c8ff';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('e⁻', e1.x, e1.y);

    // Positron
    ctx.beginPath();
    ctx.arc(e2.x, e2.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0055';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('e⁺', e2.x, e2.y);
  }

  if (state === "ANNIHILATE" || state === "PHOTONS") {
    // Shockwave
    if (explosionTime > 0 && explosionTime < 100) {
      let r = explosionTime * 10;
      let alpha = Math.max(0, 1 - (explosionTime / 40));
      
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 10 * alpha;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150, 0, 255, ${alpha * 0.5})`;
      ctx.fill();
    }
  }

  if (state === "PHOTONS") {
    // Photons
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffff00';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('γ', p1.x + 20, p1.y);

    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffff00';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('γ', p2.x + 20, p2.y);
  }

  ctx.restore();
}

window.bkSetup(1200, 800, draw);
