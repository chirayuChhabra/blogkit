#!/usr/bin/env bun

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
	console.error("Usage: mr-md <command> [args]");
	console.error("Commands:");
	console.error("  build      Build all chapters or a specific file");
	console.error("  dev        Start local dev server");
	process.exit(1);
}

switch (command) {
	case "dev":
		import("./cli/dev.js").then((m) => m.runDev(args.slice(1)));
		break;
	case "build":
		import("./cli/build.js").then((m) => m.runBuild(args.slice(1)));
		break;
	default:
		console.error(`Unknown command: ${command}`);
		process.exit(1);
}
