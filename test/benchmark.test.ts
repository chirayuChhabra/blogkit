import { test } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { resolveAssetSrc } from "../src/renderer/utils.js";

test("resolveAssetSrc benchmark", () => {
	const TEST_DIR = path.join(__dirname, ".test_fixtures");
	if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR);

	const dummyImgPath = path.join(TEST_DIR, "dummy.png");
	// Create a larger dummy file for benchmark
	const buffer = Buffer.alloc(1024 * 1024); // 1MB
	fs.writeFileSync(dummyImgPath, buffer);

	const options = { contentBase: TEST_DIR, strict: true };

	const start = performance.now();
	for (let i = 0; i < 100; i++) {
		resolveAssetSrc(dummyImgPath, options);
	}
	const end = performance.now();

	console.log(`resolveAssetSrc took ${(end - start).toFixed(2)}ms for 100 calls (1MB file)`);

	fs.rmSync(TEST_DIR, { recursive: true, force: true });
});
