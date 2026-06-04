import { chapter, lesson } from "./src/index.js"; chapter("test", ctx => ctx.lesson(lesson("test", lCtx => { lCtx.markdown("Hello inline **markdown**!"); lCtx.important("Watch out!"); }))).build();
