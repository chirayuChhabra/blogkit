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

Mr Markdown allows readers to switch between Light/Dark mode (THEME), change color palettes (PALETTE), and toggle interface shapes (UI Styles). To ensure your simulation perfectly matches the active theme and provides a natively integrated experience, we highly recommend incorporating all three into your simulation for visual consistency!

Mr Markdown provides three global helper functions to achieve this:

### 1. `window.bkColor(name)` - Palettes
The site provides three distinct structural palettes: `"ink"` (Grayscale/Blue), `"field"` (Green), and `"ember"` (Orange/Red). Readers can even unlock "evolved" palettes via easter eggs (like "Elixir", "Trunk", or "Lava"). 

You shouldn't hardcode hex colors. Instead, fetch the active color dynamically:
```js
// Instantly draw a background that perfectly matches the site!
ctx.fillStyle = window.bkColor('bg');
ctx.fillRect(0, 0, logicalW, logicalH);

// Draw your objects using the active theme's accent color
ctx.fillStyle = window.bkColor('accent');
```

Available color tokens you can request: 
- `"bg"`: The main background canvas color.
- `"paper"`: A slightly elevated background color for cards/objects.
- `"line"` / `"line-strong"`: Great for borders, axes, and structural grids.
- `"text"` / `"text-light"`: Primary and secondary text colors.
- `"accent"` / `"accent-soft"`: The active brand color (e.g. green for Field, orange for Ember).

### 2. `window.bkUi()` - UI Styles
The structural UI style fundamentally changes the shape of the website. You should adapt the shapes you draw to match!
- `"standard"`: A sleek, balanced, slightly rounded organic look.
- `"neo"`: A brutalist design with hard borders and sharp corners.
- `"playful"`: A bouncy, friendly design with highly rounded bubbles.

```js
const ui = window.bkUi();
if (ui === "neo") {
  // Draw brutalist rectangles with thick hard borders
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h); 
} else if (ui === "playful") {
  // Draw bouncy, friendly rounded bubbles
  ctx.roundRect(x, y, w, h, 15);
  ctx.fill();
} else {
  // Standard sleek look
  ctx.roundRect(x, y, w, h, 5);
  ctx.fill();
}
```

### 3. `window.bkThemeMode()` - Theme (Light/Dark)
Returns `"light"` or `"dark"`. This is crucial when rendering effects like glows or shadows that require Canvas blending modes!
```js
const isLight = window.bkThemeMode() === "light";
// "screen" looks beautiful in dark mode, but disappears on light backgrounds!
ctx.globalCompositeOperation = isLight ? "multiply" : "screen";
```

---

**Next up:** We will look at adding interactive quizzes to test the reader's knowledge.
