
Lessons often require rich media and mathematical formulas to convey complex concepts. Mr Markdown makes this incredibly easy and ensures that everything scales responsively across all devices.

## Embedding Media

You can place your media files (images, video, audio) inside your lesson's `media/` directory. When the project builds, Mr Markdown automatically optimizes them, hashes them for cache busting, and copies them to the public output directory.

### Images

To embed an image:

```ts
export const myLesson = lesson("Media", { contentBase: import.meta.dir }, ctx => {
  
  // Note: Mr Markdown enforces strict mode by default. You MUST provide `alt` text!
  ctx.image("media/diagram.png", { 
    alt: "A diagram showing the water cycle", 
    caption: "The Water Cycle" // Optional: Displays text underneath the image
  });

});
```

### Video and Audio

You can embed local MP4 or WebM videos just as easily:

```ts
ctx.video("media/experiment.mp4", {
  caption: "A chemical reaction in slow motion"
});

ctx.audio("media/pronunciation.mp3");
```

### YouTube

If you don't want to host the video yourself, you can embed a YouTube video. Mr Markdown automatically uses YouTube's `youtube-nocookie.com` privacy-enhanced mode.

```ts
ctx.youtube("https://www.youtube.com/watch?v=riXcZT2ICjA", {
  caption: "Khan Academy: Introduction to Physics"
});
```

