import { spawnSync } from "child_process";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { logger } from "../cli/logger.js";
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
			throw new Error(
				`Remote URLs are not yet supported for content files: ${src}`,
			);
		}
		return src;
	}

	const isLikelyFilePath =
		(expectedType === "js" && /\.(js|ts|jsx|tsx)$/i.test(src)) ||
		(expectedType === "md" && /\.(md|mdx)$/i.test(src)) ||
		(expectedType !== "text" && src.endsWith(`.${expectedType}`)) ||
		src.startsWith("/") ||
		src.startsWith("./") ||
		src.startsWith("../");

	let filePath = path.isAbsolute(src)
		? src
		: path.resolve(options.contentBase ?? ".", src);

	// Graceful fallback: If it starts with "/" but doesn't exist at the root,
	// the user likely meant it relative to the lesson folder (contentBase).
	if (src.startsWith("/") && !fs.existsSync(filePath)) {
		const fallbackPath = path.resolve(options.contentBase ?? ".", src.slice(1));
		if (fs.existsSync(fallbackPath)) {
			filePath = fallbackPath;
		}
	}

	const securityDir = process.cwd();
	if (
		!filePath.startsWith(securityDir + path.sep) &&
		filePath !== securityDir &&
		options.strict !== false
	) {
		throw new Error(
			`Security Error: Path traversal attempt outside project root: ${filePath}`,
		);
	}

	if (fs.existsSync(filePath)) {
		const stat = fs.statSync(filePath);
		if (stat.isFile()) {
			if (
				expectedType === "js" &&
				(filePath.endsWith(".js") ||
					filePath.endsWith(".ts") ||
					filePath.endsWith(".jsx") ||
					filePath.endsWith(".tsx"))
			) {
				if (typeof process !== "undefined" && (process as any).isBun) {
					const out = spawnSync(process.execPath, [
						"build",
						"--target=browser",
						filePath,
					]);
					if (out.status === 0) {
						return out.stdout.toString("utf-8");
					} else {
						logger.warn(
							`\n  ⚠ Bun build failed for ${filePath}:\n${out.stderr.toString("utf-8")}`,
						);
						// fallback to reading raw
					}
				} else {
					logger.warn(
						`\n  ⚠ Bun is required to build JS/TS simulation files. Falling back to raw file for ${filePath}.`,
					);
				}
			}
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

	const hashIndex = src.indexOf("#");
	const queryIndex = src.indexOf("?");
	const breakIndex =
		hashIndex !== -1 && queryIndex !== -1
			? Math.min(hashIndex, queryIndex)
			: Math.max(hashIndex, queryIndex);

	let cleanSrc = src;
	let suffix = "";
	if (breakIndex !== -1) {
		cleanSrc = src.substring(0, breakIndex);
		suffix = src.substring(breakIndex);
	}

	let isWebAbsolute = cleanSrc.startsWith("/") && !fs.existsSync(cleanSrc);

	let filePath = path.isAbsolute(cleanSrc)
		? cleanSrc
		: path.resolve(options.contentBase ?? ".", cleanSrc);

	if (cleanSrc.startsWith("/") && !fs.existsSync(filePath)) {
		const fallbackPath = path.resolve(
			options.contentBase ?? ".",
			cleanSrc.slice(1),
		);
		if (fs.existsSync(fallbackPath)) {
			filePath = fallbackPath;
			isWebAbsolute = false; // We found it locally, so don't treat it as a web URL
		}
	}

	if (isWebAbsolute) return src;
	if (!fs.existsSync(filePath)) {
		if (options.strict !== false)
			throw new Error(`Missing media asset: ${filePath}`);
		return src;
	}

	// Copy asset to outDir/assets instead of base64 encoding
	const outDir = options.outDir ?? "./out";
	const assetsDir = path.join(outDir, "assets");
	if (!fs.existsSync(assetsDir)) {
		fs.mkdirSync(assetsDir, { recursive: true });
	}

	// Create a safe filename with hash to avoid collisions
	// Use relative path for hashing to ensure deterministic builds across different machines
	const relPathForHash = path
		.relative(options.contentBase ?? process.cwd(), filePath)
		.replace(/\\/g, "/"); // Normalize to POSIX slashes for deterministic cross-platform hashes

	const hash = crypto
		.createHash("md5")
		.update(relPathForHash)
		.digest("hex")
		.substring(0, 8);
	const ext = path.extname(filePath);
	const filename = `${path.basename(filePath, ext)}-${hash}${ext}`;
	const outPath = path.join(assetsDir, filename);

	if (!fs.existsSync(outPath)) {
		fs.copyFileSync(filePath, outPath);
	}

	return `assets/${filename}${suffix}`;
}

export { resolveAssetSrc, resolveContent };
