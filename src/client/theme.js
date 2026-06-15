import { normalIcons, proIcons, proPalettes } from "./icons.js";

export function bkBroadcastTheme(targetWindow) {
	const root = document.documentElement;
	const styles = getComputedStyle(root);
	const state = {
		theme: root.dataset.theme || "light",
		palette: root.dataset.palette || "ink",
		ui: root.dataset.ui || "standard",
		colors: {
			bg: styles.getPropertyValue("--bg").trim(),
			paper: styles.getPropertyValue("--paper").trim(),
			line: styles.getPropertyValue("--line").trim(),
			"line-strong": styles.getPropertyValue("--line-strong").trim(),
			text: styles.getPropertyValue("--text").trim(),
			"text-light": styles.getPropertyValue("--text-light").trim(),
			accent: styles.getPropertyValue("--accent").trim(),
			"accent-soft": styles.getPropertyValue("--accent-soft").trim(),
		},
	};
	if (targetWindow) {
		targetWindow.postMessage({ type: "bk:theme-sync", state }, "*");
	} else {
		document
			.querySelectorAll(".bk-embed-interactive iframe")
			.forEach((iframe) => {
				if (iframe.contentWindow)
					iframe.contentWindow.postMessage(
						{ type: "bk:theme-sync", state },
						"*",
					);
			});
	}
}

export function bkWireThemeControls() {
	const root = document.documentElement;
	const button = document.getElementById("bk-settings-button");
	const panel = document.getElementById("bk-theme-panel");
	const themeBtns = document.querySelectorAll("#bk-theme-icons button");
	const paletteBtns = document.querySelectorAll("#bk-palette-icons button");
	const uiBtns = document.querySelectorAll("#bk-ui-icons button");
	let savedTheme = localStorage.getItem("bk-theme");
	if (!savedTheme) savedTheme = "auto";
	const savedPalette = localStorage.getItem("bk-palette");
	const savedUi = localStorage.getItem("bk-ui");

	function updateThemeBtn(val) {
		themeBtns.forEach((b) => {
			if (b.dataset.theme === val) b.classList.add("active");
			else b.classList.remove("active");
		});
	}

	function updatePaletteBtn(val) {
		paletteBtns.forEach((b) => {
			const basePalette = b.dataset.palette;

			if (val === proPalettes[basePalette]) {
				b.innerHTML = proIcons[val];
			} else {
				b.innerHTML = normalIcons[basePalette];
			}

			if (basePalette === val || proPalettes[basePalette] === val)
				b.classList.add("active");
			else b.classList.remove("active");
		});
	}

	function updateUiBtn(val) {
		uiBtns.forEach((b) => {
			if (b.dataset.ui === val) b.classList.add("active");
			else b.classList.remove("active");
		});
	}

	if (savedTheme) {
		updateThemeBtn(savedTheme);
		root.setAttribute("data-theme", savedTheme);
	}
	if (savedPalette) {
		const normalizedPalette = savedPalette === "green" ? "field" : savedPalette;
		updatePaletteBtn(normalizedPalette);
		root.setAttribute("data-palette", normalizedPalette);
	}
	if (savedUi) {
		updateUiBtn(savedUi);
		root.setAttribute("data-ui", savedUi);
	}

	button &&
		panel &&
		button.addEventListener("click", (event) => {
			event.stopPropagation();
			const open = panel.hasAttribute("hidden");
			panel.hidden = !open;
			button.setAttribute("aria-expanded", String(open));
		});

	panel?.addEventListener("click", (event) => event.stopPropagation());
	document.addEventListener("click", () => {
		if (!button || !panel || panel.hidden) return;
		panel.hidden = true;
		button.setAttribute("aria-expanded", "false");
	});
	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape" || !button || !panel || panel.hidden) return;
		panel.hidden = true;
		button.setAttribute("aria-expanded", "false");
		button.focus();
	});

	themeBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			const val = btn.dataset.theme;
			localStorage.setItem("bk-theme", val);
			updateThemeBtn(val);
			root.setAttribute("data-theme", val);
			bkBroadcastTheme();
		});
	});

	paletteBtns.forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const baseVal = btn.dataset.palette;
			const currentVal = root.getAttribute("data-palette") || "ink";
			let newVal = baseVal;

			if (e.detail === 2) {
				if (currentVal === proPalettes[baseVal]) {
					newVal = baseVal;
				} else {
					newVal = proPalettes[baseVal];
				}
			} else {
				if (currentVal === proPalettes[baseVal]) {
					newVal = proPalettes[baseVal];
				}
			}

			localStorage.setItem("bk-palette", newVal);
			updatePaletteBtn(newVal);
			root.setAttribute("data-palette", newVal);
			bkBroadcastTheme();
		});
	});

	uiBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			const val = btn.dataset.ui;
			localStorage.setItem("bk-ui", val);
			updateUiBtn(val);
			root.setAttribute("data-ui", val);
			bkBroadcastTheme();
		});
	});

	// Broadcast the initial theme to any iframes already present
	// We use requestAnimationFrame to ensure CSS variables are fully computed
	requestAnimationFrame(() => bkBroadcastTheme());
}

// Global listeners for theme sync
if (typeof window !== "undefined") {
	window.addEventListener("message", (e) => {
		const isValidSource = Array.from(document.querySelectorAll("iframe")).some(
			(f) => f.contentWindow === e.source,
		);
		if (!isValidSource) return;

		if (e.data && e.data.type === "bk:request-theme") {
			// Small delay to ensure CSS has applied if this happens right on load
			requestAnimationFrame(() => bkBroadcastTheme(e.source));
		}
	});

	// Watch for OS theme changes if on auto
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", () => {
			if (document.documentElement.dataset.theme === "auto") {
				bkBroadcastTheme();
			}
		});
}
