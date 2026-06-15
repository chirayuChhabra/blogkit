
Simulations in Mr Markdown are standard JavaScript files executed inside an isolated, sandboxed iframe. This means they are completely safe from breaking the rest of your course page.

To embed a simulation, place your JavaScript file in the `sims/` directory and use the `ctx.lab()` method:

```ts
export const myLesson = lesson("Orbiting Planets", { contentBase: import.meta.dir }, ctx => {
  ctx.lab("sims/gravity.js", { 
    label: "Orbit Lab", 
    caption: "Drag the planets to change their orbits." 
  });
});
```
