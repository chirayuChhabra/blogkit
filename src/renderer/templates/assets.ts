import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function pageCSS(): string {
	return fs.readFileSync(
		path.join(__dirname, "../../styles/theme.css"),
		"utf-8",
	);
}

export function clientScript(): string {
	return fs.readFileSync(path.join(__dirname, "../../client/app.js"), "utf-8");
}
