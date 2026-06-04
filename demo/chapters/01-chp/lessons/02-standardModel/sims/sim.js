let time = 0;
let distance = 150;
let speed = 1;

if (window.__simProps) {
  if (window.__simProps.distance !== undefined) distance = window.__simProps.distance;
  if (window.__simProps.speed !== undefined) speed = window.__simProps.speed;
}

window.addEventListener("bk:props", (event) => {
  const props = event.detail;
  if (props.distance !== undefined) distance = props.distance;
  if (props.speed !== undefined) speed = props.speed;
});

function draw(ctx, logicalW, logicalH) {
    time += 0.02 * speed;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, logicalW, logicalH);
    
    // Position of Matter (Blue) and Antimatter (Red)
    let p1x = logicalW / 2 - distance * Math.cos(time);
    let p1y = logicalH / 2 - distance * Math.sin(time);
    
    let p2x = logicalW / 2 + distance * Math.cos(time);
    let p2y = logicalH / 2 + distance * Math.sin(time);
    
    let dist = Math.sqrt(Math.pow(p1x - p2x, 2) + Math.pow(p1y - p2y, 2));
    
    if (dist < 20) {
        // Annihilation flash
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - dist/20) + ')';
        ctx.beginPath();
        ctx.arc(logicalW / 2, logicalH / 2, 80 + Math.random() * 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Emitting photons
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(logicalW/2, logicalH/2);
        ctx.lineTo(logicalW/2 + (Math.random()-0.5)*200, logicalH/2 + (Math.random()-0.5)*200);
        ctx.stroke();
    } else {
        // Matter particle
        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.arc(p1x, p1y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Antimatter particle
        ctx.fillStyle = '#ff2255';
        ctx.beginPath();
        ctx.arc(p2x, p2y, 15, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.bkSetup(800, 500, draw);
