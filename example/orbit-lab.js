let props = window.__simProps || {
	starMass: 1000,
	planetVel: 4.5,
	showTrails: true,
};

let planet = { x: 0, y: 0, vx: 0, vy: 0 };
let trail = [];

function resetPlanet(logicalW, logicalH) {
	planet = {
		x: logicalW / 2,
		y: logicalH / 2 - 150,
		vx: props.planetVel,
		vy: 0,
	};
	trail = [];
}

// We don't have access to logicalW and logicalH globally, but they are constant
// It's cleaner to keep them here for initialisation
const initW = 800;
const initH = 450;
resetPlanet(initW, initH);

const camera = { x: initW / 2, y: initH / 2, zoom: 1 };
let isPanning = false;
let panStart = { x: 0, y: 0, camX: 0, camY: 0 };
let dragging = null;

// Match the iframe background to the canvas to hide letterboxing sidebars
document.body.style.background = "#0a0a0a";

function updateProps(nextProps) {
	const oldVel = props.planetVel;
	props = { ...props, ...nextProps };
	if (props.planetVel !== oldVel) {
		resetPlanet(initW, initH);
	}
}

window.addEventListener("bk:props", (e) => updateProps(e.detail || {}));

function physics(logicalW, logicalH) {
	const cx = logicalW / 2;
	const cy = logicalH / 2;
	const dx = cx - planet.x;
	const dy = cy - planet.y;
	const r2 = dx * dx + dy * dy;
	const r = Math.sqrt(r2);

	// F = G * M / r^2 (simplified)
	const f = props.starMass / r2;
	const fx = f * (dx / r);
	const fy = f * (dy / r);

	if (!dragging) {
		planet.vx += fx;
		planet.vy += fy;
		planet.x += planet.vx;
		planet.y += planet.vy;
	}

	if (props.showTrails && !dragging) {
		trail.push({ x: planet.x, y: planet.y });
		if (trail.length > 300) trail.shift();
	} else if (!props.showTrails) {
		trail = [];
	}
}

function draw(ctx, logicalW, logicalH) {
	physics(logicalW, logicalH);

	ctx.fillStyle = "#0a0a0a";
	ctx.fillRect(0, 0, logicalW, logicalH);

	ctx.save();
	ctx.translate(logicalW / 2, logicalH / 2);
	ctx.scale(camera.zoom, camera.zoom);
	ctx.translate(-camera.x, -camera.y);

	const cx = logicalW / 2;
	const cy = logicalH / 2;

	// Draw trail
	if (trail.length > 1) {
		ctx.beginPath();
		ctx.moveTo(trail[0].x, trail[0].y);
		for (let i = 1; i < trail.length; i++) {
			ctx.lineTo(trail[i].x, trail[i].y);
		}
		ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	// Draw star
	const starRadius = Math.max(10, props.starMass / 50);
	ctx.beginPath();
	ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
	ctx.fillStyle = "#fb923c"; // Ember color
	ctx.fill();

	// Draw planet
	ctx.beginPath();
	ctx.arc(planet.x, planet.y, 6, 0, Math.PI * 2);
	ctx.fillStyle = "#38bdf8";
	ctx.fill();

	ctx.restore();
}

function toWorld(sx, sy) {
	return {
		x: (sx - initW / 2) / camera.zoom + camera.x,
		y: (sy - initH / 2) / camera.zoom + camera.y,
	};
}

const canvas = document.getElementById("c");

canvas.addEventListener("pointerdown", (e) => {
	const worldPos = toWorld(e.offsetX, e.offsetY);

	if (
		Math.hypot(worldPos.x - planet.x, worldPos.y - planet.y) <
		Math.max(15, 15 / camera.zoom)
	) {
		dragging = planet;
		planet.vx = 0;
		planet.vy = 0;
		trail = [];
		canvas.setPointerCapture(e.pointerId);
		return;
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
	const zoomFactor = 0.999 ** e.deltaY;
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
