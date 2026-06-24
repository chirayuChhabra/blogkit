import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { lesson } from "../src/index.js";
import { render } from "../src/renderer/index.js";

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



	test("inline math parsing does not swallow across newlines", () => {
		const mdContent =
			"This is a price of $10.\n\nAnd here is another price of $20.";
		const l = lesson("Test Lesson").markdown(mdContent).toJSON();

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

	test("markdown links with $ in URL or text are not broken by math parser", () => {
		const mdContent = "Here is [link $x$](http://example.com/?v=$1)";
		const l = lesson("Test Lesson").markdown(mdContent).toJSON();
		const html = render(l, { strict: true });

		// The math inside the link text should be parsed
		expect(html).toContain("katex");
		
		// The URL should remain completely intact
		expect(html).toContain('href="http://example.com/?v=$1"');
	});
});
