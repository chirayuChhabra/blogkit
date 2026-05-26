# Simulations & Client Specification

Simulations in Blogkit are standard JavaScript files executed in an isolated iframe. Use `.lab()` for interactive simulations and `.animation()` for passive motion.

## 1. The Companion Config (Zero-Config Lessons)

To make a simulation reusable, you should expose its defaults and controls via a companion configuration file. If your simulation is `gravity.js`, create a `gravity.config.json` next to it:

```json
{
  "aspect": "wide",
  "props": { "mass": 5, "trails": true },
  "tunables": {
    "mass": { "label": "Planet Mass", "min": 1, "max": 20, "step": 1 },
    "trails": { "label": "Show trails" }
  }
}
```

By providing this file, the lesson author can embed your simulation with zero configuration. Blogkit automatically resolves and parses the `.config.json` file!
```ts
.lab("gravity.js", { label: "Orbit lab" })
```

*Note: The lesson author can always override the defaults by explicitly passing `props` to the builder method.*

## 2. Dimensions & Fullscreen

Simulations default to a `"wide"` (16:9) aspect ratio, but you can explicitly request `"standard"` (4:3) or `"square"` (1:1) in your config.

**Maximization:** Every simulation receives a fullscreen maximize button on the page header. Because the iframe will rapidly change size when the user toggles fullscreen, your simulation *must* listen to the browser's `resize` event and redraw the `<canvas>` accordingly.

**Scaling is Automatic:** 
Blogkit natively handles scaling your simulation to fit the iframe (and fullscreen) perfectly, including high-DPI (Retina) screens. 

Simply wrap your drawing code in `window.bkSetup(logicalWidth, logicalHeight, drawFn)`. Blogkit will automatically apply CSS transforms and manage the internal high-resolution canvas bitmap to ensure perfectly crisp graphics at any zoom level while preserving your aspect ratio!

```js
function draw(ctx, logicalW, logicalH) {
  // No scaling math required! Just draw in your logical coordinates.
  ctx.clearRect(0, 0, logicalW, logicalH);
  
  ctx.beginPath();
  ctx.arc(logicalW / 2, logicalH / 2, 10, 0, Math.PI * 2); 
  ctx.fill();
}

// Start the simulation loop with a logical size of 800x500
window.bkSetup(800, 500, draw);
```

## 3. Layout, Styling & Interactivity

- **The Environment:** Blogkit provides a default `<canvas id="c">` injected into a minimal HTML wrapper.
- **Interactivity:** Attach pointer handlers directly to the canvas (`canvas.addEventListener("pointerdown", ...)`). Because Blogkit pins CSS dimensions, `event.offsetX` and `event.offsetY` will seamlessly map to your exact logical coordinates without any extra math required!
- **Dark Mode:** Blogkit passes theming down automatically. Inside your simulation CSS, use `@media (prefers-color-scheme: dark)` to adjust colors.

## 4. Receiving Options (Props)

Blogkit passes the configured props to the iframe globally as `window.__simProps`. When a reader adjusts a tunable control on the page, the simulation receives an event:

```js
window.addEventListener("bk:props", (event) => {
  const props = event.detail;
  // Update internal simulation state and redraw
});
```

*(Note: For older simulations that only read `window.__simProps` on load, Blogkit will automatically reload the iframe when controls change. However, listening for `bk:props` provides a much smoother experience).*
