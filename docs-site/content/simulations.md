# Simulations & Client Specification

Simulations in Mr Markdown are standard JavaScript files executed in an isolated iframe, meaning they are completely sandboxed and safe from breaking the rest of your course page.

Use `.lab("sim.js")` to embed interactive simulations that users can play with, and `.animation("sim.js")` for passive motion/demos.

This guide covers everything you need to build a flawless, interactive, and reusable simulation in Mr Markdown.

---

## 1. The Companion Config (Zero-Config Lessons)

To make a simulation reusable, you must expose its defaults and interactive controls via a companion configuration file. If your simulation code is in `gravity.js`, you should create a `gravity.config.json` directly next to it in the same folder.

```json
{
  "props": { "mass": 5, "trails": true },
  "tunables": {
    "mass": { "label": "Planet Mass", "min": 1, "max": 20, "step": 1 },
    "trails": { "label": "Show trails" }
  }
}
```

By providing this file, the lesson author can embed your simulation with zero configuration. Mr Markdown automatically resolves and parses the `.config.json` file during the build process, seamlessly turning your `tunables` into interactive UI sliders and toggles above the simulation!

```ts
export const orbitLesson = lesson("Orbiting Planets", { contentBase: import.meta.dir }, ctx => {
  ctx.lab("gravity.js", { label: "Orbit lab" });
});
```

> [!WARNING]
> **CRITICAL: Setting `contentBase`**  
> For Mr Markdown to automatically discover your `gravity.config.json` file during the build process, you MUST pass the correct `contentBase` option to your `lesson()` definition. Otherwise, the framework defaults to the root project folder, silently fails to find your config, and **will not render the tunable UI sliders**!
> 
> In your `lesson.ts`, always explicitly specify `import.meta.dir`:
> ```ts
> export const orbitLesson = lesson("Orbiting Planets", { contentBase: import.meta.dir }, ctx => {
>   ctx.lab("gravity.js", { label: "Orbit lab" });
> });
> ```

---

## 2. Managing State & The `bk:props` Event (Crucial for Smoothness)

When a reader adjusts a tunable control (like sliding the "Planet Mass" slider), Mr Markdown immediately communicates the new values to your simulation's iframe.

**There are two ways Mr Markdown handles this:**

### The Preferred Way (Smooth & Performant)
Your simulation should actively listen to the `bk:props` custom event. This allows you to update your internal variables on the fly without losing the current state of the simulation (like positions, velocities, etc.).

```js
// Initial State
let mass = 5;
let trails = true;

// Override with defaults from the framework on load
if (window.__simProps) {
  if (window.__simProps.mass !== undefined) mass = window.__simProps.mass;
  if (window.__simProps.trails !== undefined) trails = window.__simProps.trails;
}

// Listen for LIVE changes from the UI sliders!
window.addEventListener("bk:props", (event) => {
  const props = event.detail;
  if (props.mass !== undefined) mass = props.mass;
  if (props.trails !== undefined) trails = props.trails;
});
```

### The Fallback Way (Silent Failures)
If your simulation code does not listen for the `bk:props` event, it will not automatically update when the user drags a slider. Mr Markdown does not automatically reload the iframe for you! The new properties will be quietly applied to `window.__simProps`, but your simulation will be stuck using the old values (unless you manually poll `window.__simProps` inside a `requestAnimationFrame` loop).

**This results in broken interactivity where sliders do nothing.** Always implement the `bk:props` listener!

---

## 3. Dimensions, Scaling & `bkSetup`

Simulations are strictly enforced to a `16:9` wide aspect ratio for all media in Mr Markdown to ensure visual perfection across courses.

**Scaling is 100% Automatic (Object-Fit Cover Semantics):** 
Mr Markdown natively handles scaling your simulation to fit the iframe perfectly, including high-DPI (Retina) screens. 

If the logical aspect ratio of your simulation (e.g. `1600x900` which is exactly 16:9, or `800x500` which is 16:10) doesn't perfectly match, Mr Markdown applies mathematical `object-fit: cover` scaling. It automatically scales the canvas uniformly from the center to fully cover the container without **any distortion** and without **any black bars**, gracefully cropping only the absolute minimal overhanging edges!

Simply wrap your drawing code in `window.bkSetup(logicalWidth, logicalHeight, drawFn)`. Mr Markdown provides a hidden `<canvas id="c">` and automatically applies the necessary CSS transforms and manages the internal high-resolution canvas bitmap to ensure perfectly crisp graphics at any zoom level while preserving your aspect ratio!

```js
let initialized = false;

function draw(ctx, logicalW, logicalH) {
  // Initialization logic that runs exactly once
  if (!initialized) {
    console.log("Starting simulation!");
    initialized = true;
  }

  // No scaling math required! Just draw in your logical coordinates.
  ctx.clearRect(0, 0, logicalW, logicalH);
  
  ctx.beginPath();
  ctx.arc(logicalW / 2, logicalH / 2, 10, 0, Math.PI * 2); 
  ctx.fill();
}

// Start the simulation loop with a logical size of 800x500
window.bkSetup(800, 500, draw);
```

> [!TIP]
> `window.bkSetup` automatically wraps your `draw` function in a `requestAnimationFrame` loop. You DO NOT need to call `requestAnimationFrame` yourself, otherwise your simulation will run multiple overlapping loops!

---

## 4. Interactivity & Mouse/Touch Events

Because Mr Markdown automatically scales your canvas but pins the CSS dimensions appropriately, browser pointer events map directly 1:1 to your logical coordinates!

Attach pointer handlers directly to the canvas during your initialization phase. 

```js
let dragX = 0;

function draw(ctx, logicalW, logicalH) {
  if (!initialized) {
    const canvas = ctx.canvas;
    
    // Crucial: Prevent mobile scrolling when interacting with the canvas
    canvas.style.touchAction = "none";
    
    canvas.addEventListener("pointerdown", (e) => {
      // e.offsetX / e.offsetY natively match your logical 800x500 space!
      dragX = e.offsetX; 
    });

    canvas.addEventListener("pointermove", (e) => { ... });
    canvas.addEventListener("pointerup", (e) => { ... });

    initialized = true;
  }
}
```

### Safety Features & Scroll Hijacking
You might be worried that if you add zooming (`wheel` events) or panning (`pointermove` events), you will accidentally hijack the reader's ability to scroll down the article. 

**Don't worry! Mr Markdown has built-in safety features.**
Interactive simulations are hidden behind a "Click to interact" overlay by default. The simulation iframe only begins receiving pointer and scroll events *after* the user explicitly clicks the canvas to activate it. If the user clicks anywhere outside the simulation, interactivity is immediately disabled again. 

### Implementing a Movable Space (Camera Panning & Zooming)
Because Mr Markdown protects the main page scroll, you are completely free to implement your own "Movable Space" or camera inside your simulation. 

You can easily add zooming and panning capabilities to your `draw` function. For example, using the Canvas 2D API:

```js
let cameraX = 0;
let cameraY = 0;
let zoom = 1;

function draw(ctx, logicalW, logicalH) {
  if (!initialized) {
    const canvas = ctx.canvas;
    canvas.style.touchAction = "none"; // Disable browser touch actions
    
    // Panning
    canvas.addEventListener("pointermove", (e) => {
      if (e.buttons === 1) { // Left click dragging
        cameraX += e.movementX / zoom;
        cameraY += e.movementY / zoom;
      }
    });

    // Zooming
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault(); // Prevent page scroll just in case
      zoom += e.deltaY * -0.001;
      zoom = Math.max(0.1, Math.min(zoom, 10)); // Clamp zoom between 0.1x and 10x
    });

    initialized = true;
  }

  // Clear background
  ctx.clearRect(0, 0, logicalW, logicalH);
  
  // Apply Camera Transform
  ctx.save();
  ctx.translate(logicalW / 2, logicalH / 2); // Center camera
  ctx.scale(zoom, zoom);
  ctx.translate(cameraX, cameraY);
  
  // ---> DRAW EVERYTHING HERE <---
  // The center of your world is now movable and zoomable!
  
  ctx.restore(); // Reset transform for the next frame
}
```

---

## 5. Inherently Themed Simulations

Mr Markdown allows users to fully customize the look and feel of the lesson by changing the Light/Dark mode (THEME), color palettes (PALETTE), and interface shapes (UI Styles). 

To ensure your simulations look natively integrated, they should inherently respect the active aesthetic. **We highly recommend incorporating all three (Theme, Palette, and UI) into your simulation for complete visual consistency!**

Mr Markdown provides three global helper functions injected automatically into your iframe to help you draw responsive graphics:

### `window.bkColor(name)` - Palettes
The site provides three distinct structural palettes: `"ink"` (Grayscale/Blue), `"field"` (Green), and `"ember"` (Orange/Red). Readers can even unlock "evolved" palettes via easter eggs (like "Elixir", "Trunk", or "Lava"). 

You shouldn't hardcode hex colors. Instead, fetch the active color dynamically. It instantly updates when the user changes their active palette or theme:
```js
// Instantly draw a background that perfectly matches the site!
ctx.fillStyle = bkColor('bg');
ctx.fillRect(0, 0, w, h);

// Draw your objects using the active theme's accent color
ctx.fillStyle = bkColor('accent');
```

Available color tokens you can request:
- `"bg"`: The main background canvas color.
- `"paper"`: A slightly elevated background color for cards/objects.
- `"line"` / `"line-strong"`: Great for borders, axes, and structural grids.
- `"text"` / `"text-light"`: Primary and secondary text colors.
- `"accent"` / `"accent-soft"`: The active brand color (e.g. green for Field, orange for Ember).

### `window.bkUi()` - UI Styles
The structural UI style fundamentally changes the shape of the website. You should adapt the shapes you draw to match!
- `"standard"`: A sleek, balanced, slightly rounded organic look.
- `"neo"`: A brutalist design with hard borders and sharp corners.
- `"playful"`: A bouncy, friendly design with highly rounded bubbles.

```js
const ui = bkUi();
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

### `window.bkThemeMode()` - Theme (Light/Dark)
Returns `"light"` or `"dark"`. This is crucial when rendering effects like glows or shadows that require Canvas blending modes!
```js
// If you are drawing glowing bioluminescence:
// "screen" looks beautiful in dark mode, but disappears on light backgrounds!
const isLight = bkThemeMode() === "light";
ctx.globalCompositeOperation = isLight ? "multiply" : "screen";
```

> [!TIP]
> **No page reloads necessary!** Because `bkSetup` runs continuously in `requestAnimationFrame`, your canvas will instantly morph and repaint natively whenever the user clicks a settings button!

---

## 6. Summary Checklist for a Perfect Simulation

1. [ ] **Logic File:** Write your simulation logic inside `my-sim.js`.
2. [ ] **Logical Space:** Use `window.bkSetup(width, height, drawFn)` to start your loop. Don't worry about screen resolutions; just draw to your logical space.
3. [ ] **State Initialization:** Use an `if (!initialized)` block inside your `draw` function to set up `pointer` listeners and establish default positions.
4. [ ] **Props Loading:** Check `window.__simProps` during initialization to load default values passed from the framework.
5. [ ] **Dynamic Props:** Register a `bk:props` event listener to instantly update variables when UI sliders move.
6. [ ] **Config File:** Create `my-sim.config.json` directly next to your JS file to expose UI `tunables` and define defaults.
7. [ ] **Lesson Integration:** In your `lesson.ts`, make sure to pass `{ contentBase: import.meta.dir }` to the `lesson()` builder to ensure Mr Markdown discovers your `.config.json` correctly.
