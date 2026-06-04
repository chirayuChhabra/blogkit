import * as fs from "fs";
import * as path from "path";
import type { BuildOptions } from "../types.js";

export interface NavItem {
	id: string;
	label: string;
	kind: "heading" | "section" | "quiz" | "simulation";
}

// ─── Smart Content Resolution ────────────────────────────────────────────────

function resolveContent(
	src: string,
	options: BuildOptions,
	expectedType: "md" | "js" | "json" | "text" = "text",
): string {
	if (src.includes("\n")) return src;

	if (/^https?:\/\//.test(src)) {
		if (options.strict !== false) {
			throw new Error(`Remote URLs are not yet supported for content files: ${src}`);
		}
		return src;
	}

	const isLikelyFilePath =
		(expectedType !== "text" && src.endsWith(`.${expectedType}`)) ||
		src.startsWith("/") ||
		src.startsWith("./") ||
		src.startsWith("../");

	const filePath = path.isAbsolute(src)
		? src
		: path.resolve(options.contentBase ?? ".", src);

	if (fs.existsSync(filePath)) {
		const stat = fs.statSync(filePath);
		if (stat.isFile()) {
			return fs.readFileSync(filePath, "utf-8");
		}
	}

	if (isLikelyFilePath && options.strict !== false) {
		throw new Error(
			`Missing ${expectedType.toUpperCase()} content: ${filePath}`,
		);
	}

	// If it's not a valid file path, or the file doesn't exist, treat it as raw text
	return src;
}

function resolveAssetSrc(src: string, options: BuildOptions): string {
	if (/^(https?:|data:)/.test(src)) return src;

	const isWebAbsolute = src.startsWith("/") && !fs.existsSync(src);
	if (isWebAbsolute) return src;

	const filePath = path.isAbsolute(src) 
		? src 
		: path.resolve(options.contentBase ?? ".", src);
	if (!fs.existsSync(filePath)) {
		if (options.strict !== false)
			throw new Error(`Missing media asset: ${filePath}`);
		return src;
	}

	const ext = path.extname(filePath).toLowerCase();
	const mime =
		ext === ".svg"
			? "image/svg+xml"
			: ext === ".png"
				? "image/png"
				: ext === ".jpg" || ext === ".jpeg"
					? "image/jpeg"
					: ext === ".webp"
						? "image/webp"
						: ext === ".gif"
							? "image/gif"
							: ext === ".avif"
								? "image/avif"
								: ext === ".mp4"
									? "video/mp4"
									: ext === ".webm"
										? "video/webm"
										: ext === ".mp3"
											? "audio/mpeg"
											: ext === ".wav"
												? "audio/wav"
												: "application/octet-stream";

	return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

export { resolveAssetSrc, resolveContent };
