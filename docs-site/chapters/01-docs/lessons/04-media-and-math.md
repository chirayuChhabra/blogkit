# Media & Math

Lessons often require rich media and mathematical formulas to convey complex concepts. Mr Markdown makes this incredibly easy and ensures that everything scales responsively across all devices.

## Embedding Media

You can place your media files (images, video, audio) inside your lesson's or chapter's directory. When the project builds, Mr Markdown automatically optimizes them, hashes them for cache busting, and copies them to the public output directory.

### Images

To embed an image, use the standard the standard image syntax tag:

```html
<!-- Note: Mr Markdown enforces strict mode by default. You MUST provide `alt` text! -->
![The Water Cycle](../media/nature.jpg)
```

*Live Example:*

![Local image embed](../media/nature.jpg)

<space size="2" />

### Video and Audio

You can embed local MP4 or WebM videos just as easily:

```html
![A chemical reaction in slow motion](../media/experiment.mp4)

![](../media/pronunciation.mp3)
```

<space size="2" />

### YouTube

If you don't want to host the video yourself, you can embed a YouTube video. Mr Markdown automatically uses YouTube's `youtube-nocookie.com` privacy-enhanced mode.

```html
![Khan Academy: Introduction to Physics](https://www.youtube.com/watch?v=riXcZT2ICjA)
```

*Live Example:*

![YouTube embed demo](https://www.youtube.com/watch?v=riXcZT2ICjA)

<space size="2" />

---

## Mathematical Formulas (LaTeX)

Mr Markdown has built-in, pre-configured support for KaTeX, a blazing-fast LaTeX math rendering engine.

### Inline Math in Markdown

Inside your standard markdown files, you can seamlessly write math using `$` delimiters:

```markdown
The area of a circle is calculated using the formula $A = \pi r^2$.

To calculate the roots of a quadratic equation, use:
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### Standalone LaTeX Blocks

If you want to render a large, standalone equation, use the block equation syntax (`$$ ... $$`):

```markdown
$$ e^{i\pi} + 1 = 0 $$
```

*Live Example:*

$$ e^{i\pi} + 1 = 0 $$

<space size="2" />

---

**Next up:** The most powerful feature of Mr Markdown: embedding secure, interactive JavaScript simulations.
