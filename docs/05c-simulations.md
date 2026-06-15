## Receiving Live Updates

When a reader drags the "Planet Mass" slider, Mr Markdown instantly communicates the new value to your simulation via a custom browser event: `bk:props`.

Inside your `sims/gravity.js` file, you need to listen for this event to update your simulation state without reloading the iframe.

```js
// 1. Initial Default State
let mass = 5;
let trails = true;

// 2. Override with defaults provided by the framework on load
if (window.__simProps) {
  if (window.__simProps.mass !== undefined) mass = window.__simProps.mass;
  if (window.__simProps.trails !== undefined) trails = window.__simProps.trails;
}

// 3. Listen for LIVE changes from the UI sliders!
window.addEventListener("bk:props", (event) => {
  const props = event.detail;
  if (props.mass !== undefined) mass = props.mass;
  if (props.trails !== undefined) trails = props.trails;
});
```

If you do not implement this event listener, your simulation will not respond to the UI sliders!

## Writing the Drawing Loop

Mr Markdown natively handles scaling your simulation to fit the iframe perfectly (including high-DPI Retina screens) using an automatic `object-fit: cover` technique.

You don't need to write scaling math! Simply wrap your drawing code in `window.bkSetup(logicalWidth, logicalHeight, drawFn)`. 

```js
let initialized = false;

function draw(ctx, logicalW, logicalH) {
  // Initialization logic that runs exactly once
  if (!initialized) {
    // Add pointer listeners for interactivity here
    // e.g. ctx.canvas.addEventListener("pointerdown", ...)
    initialized = true;
  }

  // Draw in your logical coordinates (e.g. 800x500 space)
  ctx.clearRect(0, 0, logicalW, logicalH);
  ctx.beginPath();
  ctx.arc(logicalW / 2, logicalH / 2, mass * 2, 0, Math.PI * 2); 
  ctx.fill();
}

// Start the simulation loop with a logical size of 800x500.
// bkSetup automatically manages the requestAnimationFrame loop for you!
window.bkSetup(800, 500, draw);
```

## Inheriting the Site Theme

Mr Markdown allows readers to switch between Light/Dark mode and change color palettes. To ensure your simulation perfectly matches the active theme, use the global helper function `window.bkColor(name)`.

```js
// Instantly draw a background that perfectly matches the site!
ctx.fillStyle = window.bkColor('bg');
ctx.fillRect(0, 0, logicalW, logicalH);

// Draw your objects using the active theme's accent color
ctx.fillStyle = window.bkColor('accent');
```

Available colors: `"bg"`, `"paper"`, `"line"`, `"text"`, `"text-light"`, `"accent"`, `"accent-soft"`.

---

**Next up:** We will look at adding interactive quizzes to test the reader's knowledge.
