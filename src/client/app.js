import { bkWireInteractiveFrames } from "./interactive.js";
import { bkWireQuizzes } from "./quiz.js";
import { bkWireSimControls } from "./simulation.js";
import { bkWireThemeControls } from "./theme.js";
import {
	bkWireCodeCopy,
	bkWireLastLessonTracking,
	bkWireMaximizeControls,
	bkWireScrollSpy,
	bkWireSidebarToggle,
} from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
	bkWireMaximizeControls();
	bkWireSidebarToggle();
	bkWireThemeControls();
	bkWireSimControls();
	bkWireInteractiveFrames();
	bkWireCodeCopy();
	bkWireScrollSpy();
	bkWireLastLessonTracking();
	bkWireQuizzes();
});
