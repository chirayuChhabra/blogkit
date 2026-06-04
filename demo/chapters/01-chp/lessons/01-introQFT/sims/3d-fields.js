let fieldType = "electron";
let excitation = 5;

// Load defaults
if (window.__simProps) {
  if (window.__simProps.fieldType !== undefined) fieldType = window.__simProps.fieldType;
  if (window.__simProps.excitation !== undefined) excitation = window.__simProps.excitation;
}

// Listen for UI updates
window.addEventListener("bk:props", (event) => {
  const props = event.detail;
  if (props.fieldType !== undefined) fieldType = props.fieldType;
  if (props.excitation !== undefined) excitation = props.excitation;
});

let initialized = false;
let time = 0;
let cameraX = 0;
let cameraY = 150;
let zoom = 1.2;

const gridSize = 40;
const cols = 25;
const rows = 25;

// Field profiles
const profiles = {
  electron: { color: 'rgba(0, 200, 255, 0.8)', waveSpeed: 0.05, freq: 0.1, baseAmp: 10 },
  photon: { color: 'rgba(255, 200, 0, 0.8)', waveSpeed: 0.1, freq: 0.2, baseAmp: 5 },
  quark: { color: 'rgba(255, 50, 150, 0.8)', waveSpeed: 0.03, freq: 0.15, baseAmp: 15 },
  higgs: { color: 'rgba(150, 255, 100, 0.8)', waveSpeed: 0.01, freq: 0.05, baseAmp: 25 },
};

function draw(ctx, logicalW, logicalH) {
  if (!initialized) {
    const canvas = ctx.canvas;
    canvas.style.touchAction = "none";
    
    canvas.addEventListener("pointermove", (e) => {
      if (e.buttons === 1) {
        cameraX += e.movementX / zoom;
        cameraY += e.movementY / zoom;
      }
    });
    
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      zoom += e.deltaY * -0.001;
      zoom = Math.max(0.2, Math.min(zoom, 5));
    });
    initialized = true;
  }

  time += 1;
  const p = profiles[fieldType] || profiles.electron;
  
  // Background
  ctx.fillStyle = '#0a0b10';
  ctx.fillRect(0, 0, logicalW, logicalH);
  
  ctx.save();
  ctx.translate(logicalW / 2, logicalH / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(cameraX, cameraY);
  
  // Isometric projection setup
  ctx.scale(1, 0.5);
  ctx.rotate(-Math.PI / 4);
  
  const amplitude = p.baseAmp * (excitation / 5);
  
  // Pre-calculate heights
  let grid = [];
  for (let x = 0; x < cols; x++) {
    grid[x] = [];
    for (let y = 0; y < rows; y++) {
      let dist = Math.sqrt(Math.pow(x - cols/2, 2) + Math.pow(y - rows/2, 2));
      let h = Math.sin(dist * p.freq - time * p.waveSpeed) * amplitude;
      // Add some noise if highly excited
      if (excitation > 6) {
        h += (Math.random() - 0.5) * (excitation - 6) * 2;
      }
      grid[x][y] = h;
    }
  }

  const offset = -(cols * gridSize) / 2;
  
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  
  // Draw the grid
  for (let x = 0; x < cols - 1; x++) {
    for (let y = 0; y < rows - 1; y++) {
      ctx.beginPath();
      
      const px = offset + x * gridSize;
      const py = offset + y * gridSize;
      
      ctx.moveTo(px, py - grid[x][y]);
      ctx.lineTo(px + gridSize, py - grid[x+1][y]);
      ctx.lineTo(px + gridSize, py + gridSize - grid[x+1][y+1]);
      ctx.lineTo(px, py + gridSize - grid[x][y+1]);
      ctx.closePath();
      
      // Calculate depth for color shading
      const depth = (y + x) / (cols + rows);
      ctx.strokeStyle = p.color.replace('0.8', (1 - depth * 0.7).toString());
      
      // Dynamic fill color based on height
      const avgHeight = (grid[x][y] + grid[x+1][y] + grid[x+1][y+1] + grid[x][y+1]) / 4;
      const intensity = Math.max(0, Math.min(1, (avgHeight + amplitude) / (amplitude * 2 || 1)));
      
      ctx.fillStyle = `rgba(${p.color.match(/\d+/g).slice(0,3).join(',')}, ${0.1 + intensity * 0.3})`;
      
      ctx.fill();
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

window.bkSetup(1200, 800, draw);
