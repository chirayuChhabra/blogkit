#!/usr/bin/env node

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
	console.error("Usage: mr-md <command> [args]");
	console.error("Commands:");
	console.error("  init       Scaffold a new mr-md project");
	console.error("  g          Generate resources (ch, lesson, quiz)");
	console.error("  dev        Start local dev server");
	process.exit(1);
}

switch (command) {
	case "init":
		import("./cli/init.js").then((m) => m.runInit());
		break;
	case "g":
	case "generate":
		import("./cli/generate.js").then((m) => m.runGenerate(args.slice(1)));
		break;
	case "dev":
		import("./cli/dev.js").then((m) => m.runDev(args.slice(1)));
		break;
	default:
		console.error(`Unknown command: ${command}`);
		process.exit(1);
}
