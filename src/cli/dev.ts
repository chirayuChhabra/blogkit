import { createRequire } from "module";

const require = createRequire(import.meta.url);

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { logger } from "./logger.js";

declare const Bun: any;

export async function runDev(args: string[]) {
	process.env.NODE_ENV = "development";
	const target = args[0];

	if (!target) {
		logger.error("Usage: mr-md dev <file-or-directory>");
		process.exit(1);
	}

	let isDirectory = false;
	let filePath = "";
	const targetPath = path.resolve(process.cwd(), target);
	if (!fs.existsSync(targetPath)) {
		logger.error(`File or directory not found: ${target}`);
		process.exit(1);
	}

	if (fs.statSync(targetPath).isDirectory()) {
		isDirectory = true;
		try {
			const { generateChapterContent } = require("./chapter.js");
			generateChapterContent(targetPath);
		} catch (err: any) {
			logger.error(err.message);
			process.exit(1);
		}
	} else {
		filePath = targetPath;
		if (!filePath.endsWith(".md")) {
			logger.error(`Not a markdown file: ${target}`);
			process.exit(1);
		}
	}

	const contentBase = isDirectory ? targetPath : path.dirname(filePath);
	const outDir = path.resolve(contentBase, "out");

	logger.dev(`Preparing dev server for: ${targetPath}`);

	let server: any;

	const rebuild = () => {
		logger.startSpinner("Rebuilding...");
		try {
			const {
				parseChapter,
				parseLesson,
				buildChapter,
				buildLesson,
			} = require("../parser/mdx.js");

			if (isDirectory) {
				const { generateChapterContent } = require("./chapter.js");
				const chapterContent = generateChapterContent(targetPath);
				const chapter = parseChapter(
					chapterContent,
					{ outDir, contentBase },
					contentBase,
				);
				buildChapter(chapter, { outDir, contentBase });
			} else {
				const content = fs.readFileSync(filePath, "utf-8");
				const parsed = require("gray-matter")(content);
				const isChapter =
					parsed.data.chapter === true || parsed.data.type === "chapter";

				if (isChapter) {
					const chapter = parseChapter(
						content,
						{ outDir, contentBase },
						contentBase,
					);
					buildChapter(chapter, { outDir, contentBase });
				} else {
					const lesson = parseLesson(
						content,
						{ outDir, contentBase },
						contentBase,
					);
					buildLesson(lesson, { outDir, contentBase });
				}
			}
			logger.succeedSpinner(`Build successful for ${targetPath}.`);
			server?.publish("livereload", "reload");
		} catch (err: any) {
			logger.failSpinner(`Build failed`);
			logger.error(err.message || err);
		}
	};

	rebuild();

	let timeout: NodeJS.Timeout;
	fs.watch(contentBase, { recursive: true }, (_eventType, filename) => {
		if (!filename || !/\.(md|mdx|js|ts|jsx|tsx|json|css)$/i.test(filename)) {
			return;
		}

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			logger.watch(`File changed: ${filename}`);
			rebuild();
		}, 200);
	});
	logger.watch(`Watching ${contentBase} for changes...`);

	const basePort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
	let port = basePort;
	const maxPort = basePort + 10;

	const fetchHandler = async (req: any, srv: any) => {
		const start = Date.now();
		const clientIp = srv.requestIP(req)?.address || "::1";
		const url = new URL(req.url);
		const method = req.method;
		const decodedPath = decodeURIComponent(url.pathname);

		if (!srv.upgrade(req)) {
			logger.httpReq(clientIp, method, decodedPath);
		}

		const handle = async () => {
			if (srv.upgrade(req)) return null;

			let outFilePath = path.resolve(outDir, `.${decodedPath}`);

			if (decodedPath.endsWith("/")) {
				outFilePath = path.join(outDir, "index.html");
			} else if (
				!fs.existsSync(outFilePath) &&
				fs.existsSync(outFilePath + ".html")
			) {
				outFilePath += ".html";
			}

			const normalizedOutDir = outDir.endsWith(path.sep)
				? outDir
				: outDir + path.sep;
			if (!outFilePath.startsWith(normalizedOutDir) && outFilePath !== outDir) {
				return new Response("Forbidden", { status: 403 });
			}

			if (fs.existsSync(outFilePath) && fs.statSync(outFilePath).isFile()) {
				if (outFilePath.endsWith(".html")) {
					const file = Bun.file(outFilePath);
					let text = await file.text();

					const script = `<script>
						const ws = new WebSocket(\`ws://\${location.host}/\`);
						ws.onmessage = (e) => { if (e.data === "reload") location.reload(); };
					</script>`;

					const lastBodyIndex = text.toLowerCase().lastIndexOf("</body>");
					if (lastBodyIndex !== -1) {
						text =
							text.slice(0, lastBodyIndex) + script + text.slice(lastBodyIndex);
					} else {
						text += script;
					}
					return new Response(text, {
						headers: { "Content-Type": "text/html" },
					});
				}
				return new Response(Bun.file(outFilePath));
			}

			return new Response("Not found", { status: 404 });
		};

		const res = await handle();
		if (res) {
			logger.httpRes(clientIp, res.status, Date.now() - start);
			return res;
		}
	};

	const wsHandler = {
		message() {},
		open(ws: any) {
			ws.subscribe("livereload");
		},
	};

	process.on("SIGINT", () => {
		logger.info("Gracefully shutting down. Please wait...");
		if (server) {
			server.stop(true);
		}
		process.exit(0);
	});

	while (port <= maxPort) {
		try {
			server = Bun.serve({
				port,
				fetch: fetchHandler,
				websocket: wsHandler,
			});
			const localUrl = `http://localhost:${server.port}`;

			const interfaces = os.networkInterfaces();
			let networkUrl: string | null = null;
			for (const name of Object.keys(interfaces)) {
				for (const iface of interfaces[name]!) {
					if (iface.family === "IPv4" && !iface.internal) {
						networkUrl = `http://${iface.address}:${server.port}`;
						break;
					}
				}
				if (networkUrl) break;
			}

			logger.serveBox(localUrl, networkUrl, basePort, port);
			break;
		} catch (err: any) {
			if (err.code === "EADDRINUSE") {
				logger.warn(`Port ${port} is in use, trying ${port + 1}...`);
				port++;
			} else {
				throw err;
			}
		}
	}

	if (!server) {
		logger.error(
			`Could not find an open port between ${basePort} and ${maxPort}.`,
		);
		process.exit(1);
	}
}
