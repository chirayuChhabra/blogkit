let highlightFamily = "all";

if (window.__simProps) {
  if (window.__simProps.highlightFamily !== undefined) highlightFamily = window.__simProps.highlightFamily;
}

window.addEventListener("bk:props", (event) => {
  const props = event.detail;
  if (props.highlightFamily !== undefined) highlightFamily = props.highlightFamily;
});

let initialized = false;
let time = 0;
let mouseX = -1;
let mouseY = -1;

const particles = [
  // Quarks (Purple)
  { id: 'u', name: 'Up', family: 'quarks', col: 0, row: 0, mass: '2.2 MeV/c²', charge: '+2/3', spin: '1/2', color: '#9d4edd' },
  { id: 'c', name: 'Charm', family: 'quarks', col: 1, row: 0, mass: '1.28 GeV/c²', charge: '+2/3', spin: '1/2', color: '#9d4edd' },
  { id: 't', name: 'Top', family: 'quarks', col: 2, row: 0, mass: '173.1 GeV/c²', charge: '+2/3', spin: '1/2', color: '#9d4edd' },
  { id: 'd', name: 'Down', family: 'quarks', col: 0, row: 1, mass: '4.7 MeV/c²', charge: '-1/3', spin: '1/2', color: '#9d4edd' },
  { id: 's', name: 'Strange', family: 'quarks', col: 1, row: 1, mass: '96 MeV/c²', charge: '-1/3', spin: '1/2', color: '#9d4edd' },
  { id: 'b', name: 'Bottom', family: 'quarks', col: 2, row: 1, mass: '4.18 GeV/c²', charge: '-1/3', spin: '1/2', color: '#9d4edd' },
  
  // Leptons (Green)
  { id: 'e', name: 'Electron', family: 'leptons', col: 0, row: 2, mass: '0.511 MeV/c²', charge: '-1', spin: '1/2', color: '#2a9d8f' },
  { id: 'μ', name: 'Muon', family: 'leptons', col: 1, row: 2, mass: '105.6 MeV/c²', charge: '-1', spin: '1/2', color: '#2a9d8f' },
  { id: 'τ', name: 'Tau', family: 'leptons', col: 2, row: 2, mass: '1.776 GeV/c²', charge: '-1', spin: '1/2', color: '#2a9d8f' },
  { id: 'νe', name: 'Electron Neutrino', family: 'leptons', col: 0, row: 3, mass: '< 1 eV/c²', charge: '0', spin: '1/2', color: '#2a9d8f' },
  { id: 'νμ', name: 'Muon Neutrino', family: 'leptons', col: 1, row: 3, mass: '< 0.17 MeV/c²', charge: '0', spin: '1/2', color: '#2a9d8f' },
  { id: 'ντ', name: 'Tau Neutrino', family: 'leptons', col: 2, row: 3, mass: '< 18.2 MeV/c²', charge: '0', spin: '1/2', color: '#2a9d8f' },
  
  // Gauge Bosons (Red/Orange)
  { id: 'g', name: 'Gluon', family: 'gauge_bosons', col: 3, row: 0, mass: '0', charge: '0', spin: '1', color: '#e76f51' },
  { id: 'γ', name: 'Photon', family: 'gauge_bosons', col: 3, row: 1, mass: '0', charge: '0', spin: '1', color: '#e76f51' },
  { id: 'Z', name: 'Z Boson', family: 'gauge_bosons', col: 3, row: 2, mass: '91.19 GeV/c²', charge: '0', spin: '1', color: '#e76f51' },
  { id: 'W', name: 'W Boson', family: 'gauge_bosons', col: 3, row: 3, mass: '80.39 GeV/c²', charge: '±1', spin: '1', color: '#e76f51' },

  // Scalar Boson (Yellow)
  { id: 'H', name: 'Higgs', family: 'scalar_bosons', col: 4, row: 0, mass: '125.1 GeV/c²', charge: '0', spin: '0', color: '#e9c46a' },
];

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function draw(ctx, logicalW, logicalH) {
  if (!initialized) {
    const canvas = ctx.canvas;
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointermove", (e) => {
      mouseX = e.offsetX;
      mouseY = e.offsetY;
    });
    canvas.addEventListener("pointerout", () => {
      mouseX = -1;
      mouseY = -1;
    });
    initialized = true;
  }
  time += 0.05;

  ctx.fillStyle = '#11131a';
  ctx.fillRect(0, 0, logicalW, logicalH);

  const startX = 100;
  const startY = 100;
  const cardW = 140;
  const cardH = 140;
  const gap = 15;
  let hoveredParticle = null;

  for (let p of particles) {
    const isHighlighted = highlightFamily === "all" || highlightFamily === p.family;
    const isHovered = mouseX >= startX + p.col * (cardW + gap) && 
                      mouseX <= startX + p.col * (cardW + gap) + cardW &&
                      mouseY >= startY + p.row * (cardH + gap) &&
                      mouseY <= startY + p.row * (cardH + gap) + cardH;

    if (isHovered) hoveredParticle = p;

    let alpha = isHighlighted ? 1 : 0.3;
    let scale = isHovered ? 1.05 : 1;
    
    // Slight floating animation
    let yOffset = isHighlighted ? Math.sin(time + p.col + p.row) * 3 : 0;
    
    const cx = startX + p.col * (cardW + gap) + cardW/2;
    const cy = startY + p.row * (cardH + gap) + cardH/2 + yOffset;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    
    // Draw card background
    ctx.globalAlpha = alpha;
    if (isHighlighted) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = p.color;
    }
    
    ctx.fillStyle = '#1c1f2b';
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, -cardW/2, -cardH/2, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    // Draw Symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.id, 0, -15);
    
    // Draw Name
    ctx.fillStyle = p.color;
    ctx.font = '16px sans-serif';
    ctx.fillText(p.name, 0, 35);
    
    // Draw brief stats
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px sans-serif';
    ctx.fillText(p.mass, 0, 55);

    ctx.restore();
  }

  // Draw Info Panel if hovered
  if (hoveredParticle) {
    ctx.save();
    const panelX = 900;
    const panelY = 100;
    ctx.fillStyle = '#1c1f2b';
    ctx.strokeStyle = hoveredParticle.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 30;
    ctx.shadowColor = hoveredParticle.color;
    
    drawRoundedRect(ctx, panelX, panelY, 250, 400, 16);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(hoveredParticle.id, panelX + 20, panelY + 20);

    ctx.fillStyle = hoveredParticle.color;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(hoveredParticle.name, panelX + 20, panelY + 100);
    
    ctx.fillStyle = '#aaa';
    ctx.font = '16px sans-serif';
    ctx.fillText("Family: " + hoveredParticle.family.replace('_', ' ').toUpperCase(), panelX + 20, panelY + 140);
    
    ctx.fillStyle = '#fff';
    ctx.fillText("Mass:", panelX + 20, panelY + 180);
    ctx.fillStyle = hoveredParticle.color;
    ctx.fillText(hoveredParticle.mass, panelX + 100, panelY + 180);

    ctx.fillStyle = '#fff';
    ctx.fillText("Charge:", panelX + 20, panelY + 220);
    ctx.fillStyle = hoveredParticle.color;
    ctx.fillText(hoveredParticle.charge, panelX + 100, panelY + 220);

    ctx.fillStyle = '#fff';
    ctx.fillText("Spin:", panelX + 20, panelY + 260);
    ctx.fillStyle = hoveredParticle.color;
    ctx.fillText(hoveredParticle.spin, panelX + 100, panelY + 260);

    ctx.restore();
  }
}

window.bkSetup(1200, 800, draw);
