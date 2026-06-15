import * as fs from "fs";

export function getNextPrefix(dirPath: string): string {
	if (!fs.existsSync(dirPath)) return "01";

	const files = fs.readdirSync(dirPath, { withFileTypes: true });
	let maxPrefix = 0;

	for (const file of files) {
		if (file.isDirectory()) {
			const match = file.name.match(/^(\d+)-/);
			if (match) {
				const num = parseInt(match[1], 10);
				if (num > maxPrefix) {
					maxPrefix = num;
				}
			}
		}
	}

	const next = maxPrefix + 1;
	return next.toString().padStart(2, "0");
}
