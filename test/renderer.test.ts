import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { lesson } from "../src/index";

const TEST_DIR = path.join(__dirname, ".test_fixtures");

describe("Renderer Bug Fixes", () => {
  beforeAll(() => {
    if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR);
    // Create a dummy file for the code block test
    fs.writeFileSync(path.join(TEST_DIR, "dummy.ts"), "const x = 42;");
  });

  afterAll(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test("resolveContent correctly resolves a file for code blocks if it exists", () => {
    const l = lesson("Test Lesson", { contentBase: TEST_DIR, strict: true })
      .code("dummy.ts")
      .toJSON();
    
    // We expect the renderer to load the file contents instead of outputting "dummy.ts"
    // To test this we must call render on it.
    // Wait, the renderer is not exported from index.ts, only render function is.
    const { render } = require("../src/renderer");
    const html = render(l, { contentBase: TEST_DIR, strict: true });
    
    // The code block should contain "const x = 42;" not "dummy.ts"
    expect(html).toContain("const x = 42;");
    expect(html).not.toContain(">dummy.ts<");
  });

  test("resolveContent falls back to inline text for code blocks if it does not exist", () => {
    const inlineCode = "console.log('hello');";
    const l = lesson("Test Lesson", { contentBase: TEST_DIR, strict: true })
      .code(inlineCode)
      .toJSON();
    
    const { render } = require("../src/renderer");
    const html = render(l, { contentBase: TEST_DIR, strict: true });
    
    expect(html).toContain("console.log(&#39;hello&#39;);");
  });

  test("inline math parsing does not swallow across newlines", () => {
    const mdContent = "This is a price of $10.\n\nAnd here is another price of $20.";
    const l = lesson("Test Lesson")
      .markdown(mdContent)
      .toJSON();
    
    const { render } = require("../src/renderer");
    const html = render(l, { strict: true });
    
    // The text should not be swallowed by the math parser. 
    // We should see "price of $10." and "price of $20." preserved.
    expect(html).toContain("$10.");
    expect(html).toContain("$20.");
    
    // Verify an actual inline math works
    const mdMath = "Here is some math $x^2 + y^2$.";
    const lMath = lesson("Test Lesson").markdown(mdMath).toJSON();
    const htmlMath = render(lMath, { strict: true });
    // Actually katex renders output
    expect(htmlMath).toContain("katex");
  });
});
