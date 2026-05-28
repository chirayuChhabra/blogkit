import * as path from "path";
import { chapter } from "../src/index";
import chargeLesson from "./charge.lesson";
import gravityLesson from "./gravity.lesson";

const outDir = path.join(__dirname, "out");
const contentBase = path.join(__dirname, "content");

chapter("Physics Basics", { outDir, contentBase })
	.description(
		"Welcome to your first level! Master the fundamentals of the universe.",
	)
	.lesson(chargeLesson)
	.lesson(gravityLesson)
	.build();
