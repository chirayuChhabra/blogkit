## Global Theming
You can define global themes by passing options to your `chapter()` or `lesson()` builders. 
Lessons automatically inherit their parent chapter's options!

```typescript
export const myLesson = lesson("My Lesson", {
  theme: "auto",
  palette: "ink",
  ui: "standard"
}, ctx => { ... });
```
