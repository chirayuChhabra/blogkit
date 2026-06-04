let energyDensity = 5;

if (window.__simProps) {
  if (window.__simProps.energyDensity !== undefined) energyDensity = window.__simProps.energyDensity;
}

window.addEventListener("bk:props", (event) => {
  const props = event.detail;
  if (props.energyDensity !== undefined) energyDensity = props.energyDensity;
});

let initialized = false;
let time = 0;
let pairs = [];

function draw(ctx, logicalW, logicalH) {
  if (!initialized) {
    const canvas = ctx.canvas;
    canvas.style.touchAction = "none";
    initialized = true;
  }
  time += 0.02;

  // Draw deep vacuum space with gentle fluctuations
  ctx.fillStyle = '#020205';
  ctx.fillRect(0, 0, logicalW, logicalH);
  
  ctx.save();
  ctx.translate(logicalW / 2, logicalH / 2);

  // Background quantum fluctuations (overlapping waves)
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    for (let x = -logicalW/2; x < logicalW/2; x += 20) {
      let y = Math.sin(x * 0.01 + time * (i+1)) * 40 * (energyDensity/5) * Math.cos(x * 0.005 - time);
      if (x === -logicalW/2) ctx.moveTo(x, y + i * 50 - 50);
      else ctx.lineTo(x, y + i * 50 - 50);
    }
    ctx.strokeStyle = `rgba(50, 100, 255, ${0.1 + energyDensity * 0.02})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Spawn Virtual Particle Pairs
  if (Math.random() < (energyDensity * 0.05)) {
    let angle = Math.random() * Math.PI * 2;
    let dist = Math.random() * 300;
    let px = Math.cos(angle) * dist;
    let py = Math.sin(angle) * dist;
    let spreadAngle = Math.random() * Math.PI * 2;
    
    pairs.push({
      x: px, y: py,
      angle: spreadAngle,
      dist: 0,
      life: 1.0,
      maxDist: 20 + Math.random() * 40
    });
  }

  // Update & Draw Pairs
  for (let p of pairs) {
    p.life -= 0.02; // Fast decay
    if (p.life > 0.5) {
      p.dist += 2; // Moving apart
    } else {
      p.dist -= 2; // Snapping back together
    }

    let p1x = p.x + Math.cos(p.angle) * p.dist;
    let p1y = p.y + Math.sin(p.angle) * p.dist;
    
    let p2x = p.x - Math.cos(p.angle) * p.dist;
    let p2y = p.y - Math.sin(p.angle) * p.dist;
    
    let alpha = Math.max(0, p.life);

    // Connecting energy arc
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    // Add a control point for a curved arc
    ctx.quadraticCurveTo(p.x, p.y - 20, p2x, p2y);
    ctx.strokeStyle = `rgba(200, 100, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Particle 1 (Matter)
    ctx.beginPath();
    ctx.arc(p1x, p1y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.2})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p1x, p1y, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.fill();

    // Particle 2 (Antimatter)
    ctx.beginPath();
    ctx.arc(p2x, p2y, 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 0, 100, ${alpha * 0.2})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p2x, p2y, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 0, 100, ${alpha})`;
    ctx.fill();
  }
  
  pairs = pairs.filter(p => p.life > 0);

  ctx.restore();
}

window.bkSetup(1200, 800, draw);
