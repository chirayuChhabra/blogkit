# Showcase

Welcome to **Mr Markdown**, the ultimate game changer for interactive documentation and learning. This isn't just another markdown parser—it's a modern, heavily opinionated framework designed to build ultra-rich, responsive learning experiences. 

Forget static pages. Seamlessly blend prose, complex LaTeX math, responsive layouts, syntax-highlighted code, and fully-interactive JavaScript simulations into a single, breathtaking canvas.

---

## Explore the User Interface

Mr Markdown ships with a powerful, highly-customizable UI built right in. Try opening the **Settings** panel (the gear icon in the corner) to explore:

- **Theme Modes**: Instantly toggle between crisp Light and immersive Dark modes.
- **UI Styles**: Change the entire vibe of the page on the fly. Try the minimalist `Clean` look, the bold neo-brutalist `NEO` aesthetic, or the playful `TOY` interface.
- **Palettes**: Experiment with different curated accent colors to match your brand. *Secret Easter Egg: Double-click a palette color for a surprise evolution!*

---

## Typography & Formatting

### Blockquotes

> "The advance of technology is based on making it fit in so that you don't really even notice it, so it's part of everyday life."
> — Bill Gates

### Lists

**Unordered List:**
- Physics
  - Quantum Mechanics
  - General Relativity
- Mathematics
  - Linear Algebra
  - Calculus

**Ordered List:**
1. Formulate a hypothesis.
2. Design an experiment.
3. Collect data.
4. Analyze results.

---

## Data Presentation

### Tables

| Feature | Supported | Description |
| :--- | :---: | :--- |
| **Markdown** | ✅ | Standard GitHub flavored markdown |
| **LaTeX** | ✅ | Native math rendering via KaTeX |
| **Simulations** | ✅ | Sandboxed interactive JS environments |
| **Quizzes** | ✅ | Built-in interactive quiz components |

---

## Code & Development

```typescript
// Mr Markdown provides full syntax highlighting
export function calculateEnergy(mass: number): number {
    const c = 299792458; // Speed of light in m/s
    return mass * Math.pow(c, 2);
}
```

---

## Callouts & Notifications

> [!important]
> This is an **important** callout. Use it to highlight critical information like breaking changes or security warnings.

> [!tip]
> This is a **tip** callout. It's perfect for highlighting best practices or performance optimizations.

> [!note]
> This is a **note** callout. It's great for adding background context without distracting from the main lesson.

> [!warning]
> This is a **warning** callout. Use it to warn users about deprecated APIs or potential pitfalls.

---

## Media & Layout

<columns>
<column markdown="### Advanced Layouts\n\nCreate side-by-side columns effortlessly. This is great for putting code or math next to an explanation. On mobile, this will automatically stack vertically!" />
<column latex="e^{i\pi} + 1 = 0" />
</columns>

### Images
![A beautiful landscape image embedded natively.](../media/nature.jpg)

### Video Embeds
![A Khan Academy YouTube video embed.](https://www.youtube.com/watch?v=riXcZT2ICjA)

![Direct MP4 Video embed.](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4)

### Audio Embeds
![Audio player embed.](https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3)

---

## Live Demonstrations

Mr Markdown supports rich, interactive components. Try out these live simulations and the quiz below!

![Interactive QCD string breaking. Drag a quark to pull it out of the proton.](../sims/qcd.js)

![A* Algorithm solving a maze. Drag the green start and red end nodes, or change the maze density.](../sims/pathfinder.js)

![A sample interactive quiz.](../quizzes/sample.json)
