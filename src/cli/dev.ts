import * as fs from "fs";
import * as path from "path";

declare const Bun: any;

export function runDev(args: string[]) {
	process.env.NODE_ENV = "development";
	const dir = args[0] || ".";
	let outDir = path.resolve(process.cwd(), dir, "out");

	console.log(`Starting dev server for directory: ${dir}`);

	let server: any;

	const rebuild = () => {
		console.log("Rebuilding...");
		const entryPoints = [
			"chapter.ts",
			"index.ts",
			"lesson.ts",
			"chapters/01-chapter/chapter.ts",
		];
		for (const entry of entryPoints) {
			const entryPath = path.join(dir, entry);
			if (fs.existsSync(entryPath)) {
				outDir = path.resolve(process.cwd(), path.dirname(entryPath), "out");
				
				try {
					for (const key in require.cache) {
						if (key.startsWith(process.cwd()) && !key.includes("/node_modules/")) {
							delete require.cache[key];
						}
					}

					const mod = require(path.resolve(entryPath));
					let built = false;
					for (const key in mod) {
						if (
							mod[key] &&
							typeof mod[key].build === "function" &&
							mod[key].constructor &&
							(mod[key].constructor.name === "ChapterBuilder" ||
								mod[key].constructor.name === "LessonBuilder")
						) {
							mod[key].build();
							built = true;
						}
					}

					if (!built) {
						console.log(
							`No exported ChapterBuilder or LessonBuilder found in ${entry}. Ensure you export your chapter or lesson (e.g., export const myChapter = chapter(...)).`
						);
					} else {
						console.log("Build successful.");
						server?.publish("livereload", "reload");
					}
				} catch (err: any) {
					console.error(`Build failed:`, err);
				}
				return;
			}
		}
		console.log("No chapter.ts or lesson.ts found to build automatically.");
	};

	rebuild();

	if (fs.existsSync(dir)) {
		let timeout: NodeJS.Timeout;
		fs.watch(dir, { recursive: true }, (_eventType, filename) => {
			if (
				!filename ||
				filename.includes("out/") ||
				filename.includes("out\\") ||
				filename.includes(".git/") ||
				filename.includes(".git\\")
			)
				return;

			clearTimeout(timeout);
			timeout = setTimeout(() => {
				console.log(`File changed: ${filename}`);
				rebuild();
			}, 200);
		});
		console.log(`Watching ${dir} for changes...`);
	}

	const basePort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
	let port = basePort;
	const maxPort = basePort + 10;

	const fetchHandler = async (req: any, srv: any) => {
		if (srv.upgrade(req)) return;

		const url = new URL(req.url);
		const decodedPath = decodeURIComponent(url.pathname);
		let filePath = path.resolve(outDir, `.${decodedPath}`);

		if (decodedPath.endsWith("/")) {
			filePath = path.join(outDir, "index.html");
		}

		const normalizedOutDir = outDir.endsWith(path.sep)
			? outDir
			: outDir + path.sep;
		if (!filePath.startsWith(normalizedOutDir) && filePath !== outDir) {
			return new Response("Forbidden", { status: 403 });
		}

		if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
			if (filePath.endsWith(".html")) {
				const file = Bun.file(filePath);
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
				return new Response(text, { headers: { "Content-Type": "text/html" } });
			}
			return new Response(Bun.file(filePath));
		}

		console.log("Returning 404 for filePath:", filePath, "outDir:", outDir);
		return new Response("Not found", { status: 404 });
	};

	const wsHandler = {
		message() {},
		open(ws: any) {
			ws.subscribe("livereload");
		},
	};

	while (port <= maxPort) {
		try {
			server = Bun.serve({
				port,
				fetch: fetchHandler,
				websocket: wsHandler,
			});
			console.log(`Dev server listening on http://localhost:${server.port}`);
			break;
		} catch (err: any) {
			if (err.code === "EADDRINUSE") {
				console.warn(`Port ${port} is in use, trying ${port + 1}...`);
				port++;
			} else {
				throw err;
			}
		}
	}

	if (!server) {
		console.error(
			`Could not find an open port between ${basePort} and ${maxPort}.`,
		);
		process.exit(1);
	}
}
