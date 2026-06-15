import { bkWireInteractiveFrames } from "./interactive.js";
import { bkWireSimControls } from "./simulation.js";
import { bkWireThemeControls } from "./theme.js";
import {
	bkWireCodeCopy,
	bkWireMaximizeControls,
	bkWireScrollSpy,
	bkWireSidebarToggle,
} from "./ui.js";

// Make sure quiz functions are loaded
import "./quiz.js";

document.addEventListener("DOMContentLoaded", () => {
	bkWireMaximizeControls();
	bkWireSidebarToggle();
	bkWireThemeControls();
	bkWireSimControls();
	bkWireInteractiveFrames();
	bkWireCodeCopy();
	bkWireScrollSpy();
});
