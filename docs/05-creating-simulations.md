---
index: 5
title: Creating Simulations
slug: creating-simulations
---

# Creating Simulations

`mr-md` embeds interactive JavaScript simulations natively within a secure, sandboxed `iframe`.

## Embedding a Simulation

Embed a simulation using the standard Markdown image syntax, pointing to a `.js` or `.ts` file:

```markdown
![Pathfinder Simulation](../sims/pathfinder.js)
```

## The `.config.json` File

If you place a JSON file next to your script with the same name (e.g., `pathfinder.config.json` for `pathfinder.js`), `mr-md` automatically parses it and passes the properties to your script at runtime.

**pathfinder.config.json**:
```json
{
  "dependencies": []
}
```

## The `bk` API (Injected Global Environment)

To ensure simulations scale perfectly and match the host's dark/light mode theme seamlessly, `mr-md` injects several `bk` (BlogKit) global functions into the iframe sandbox.

### `window.__simProps`
Contains the parsed JSON object from your `.config.json` file.
```javascript
const rows = window.__simProps.rows || 10;
```

### `window.bkSetup(width, height, loopFn)`
Bootstraps a 2D canvas simulation. It automatically creates an internal canvas (available via `document.getElementById("c")`), sets up DPI scaling, handles window resizing, and invokes your `loopFn` to draw.

```javascript
// Request an 800x500 logical canvas
window.bkSetup(800, 500, function(ctx, fit) {
  // 'ctx' is the 2D Context
  // 'fit' contains scaling and dimensions
  
  ctx.clearRect(0, 0, fit.width, fit.height);
  ctx.fillStyle = window.bkColor("primary");
  ctx.fillRect(10, 10, 50, 50);
});
```

### `window.bkColor(name)`
Fetches a dynamically synced color from the `mr-md` theme system (supporting dark/light mode switches automatically).
```javascript
const red = window.bkColor("red");
const bg = window.bkColor("background");
```

### `window.bkCanvasPoint(event, canvas)`
Translates raw DOM pointer coordinates (like `event.clientX`) into the logical coordinate space of the DPI-scaled canvas. Essential for handling mouse and touch interactions accurately.
```javascript
canvas.addEventListener("pointermove", (e) => {
  const pt = window.bkCanvasPoint(e, canvas);
  console.log("Pointer at:", pt.x, pt.y);
});
```

### `window.bkFitCanvas(canvas, requestedW, requestedH, options)`
If you are doing custom canvas rendering (like WebGL instead of 2D), call this manually to apply the CSS scaling transforms needed to make your canvas responsive inside the `mr-md` layout container.
