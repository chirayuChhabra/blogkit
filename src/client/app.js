function bkSimDoc(js, props, loop, dependencies) {
	const scriptTags = (dependencies || []).map(url => '<script src="' + url.replace(/"/g, '&quot;') + '"></' + 'script>').join("\\n");
	return (
		"<!DOCTYPE html><html><head>" +
		scriptTags +
		"<style>" +
		"html,body{height:100%;width:100%;margin:0;padding:0;overflow:hidden;background:transparent;display:flex;align-items:center;justify-content:center}" +
		"canvas{display:block;touch-action:none;transform-origin:center center;flex-shrink:0}" +
		"body{font-family:sans-serif}" +
		'</style></head><body><canvas id="c" width="800" height="500"></canvas><script>' +
		"window.__simProps=" +
		JSON.stringify(props) +
		";window.__loop=" +
		JSON.stringify(Boolean(loop)) +
		";window.bkSetupCalled=false;" +
		'window.bkCanvasPoint=function(e,c){const r=(c||e.currentTarget||e.target).getBoundingClientRect(),w=(c&&c.__bkLogicalW)||800,h=(c&&c.__bkLogicalH)||500;return{x:(e.clientX-r.left)*w/r.width,y:(e.clientY-r.top)*h/r.height}};' +
		'window.bkFitCanvas=function(c,reqW,reqH,o){if(!c)return{scale:1,width:reqW,height:reqH,cssScale:1};const d=window.devicePixelRatio||1;const w=reqW;const h=reqH;c.__bkLogicalW=w;c.__bkLogicalH=h;c.style.width=w+"px";c.style.height=h+"px";c.style.position="relative";c.style.left="auto";c.style.top="auto";c.style.transformOrigin="center center";const sx=window.innerWidth/w,sy=window.innerHeight/h,cssS=Math.max(sx,sy);c.style.transform="scale("+cssS+")";const pw=Math.max(1,Math.round(w*d)),ph=Math.max(1,Math.round(h*d));if(!o||o.bitmap!==false){if(c.width!==pw||c.height!==ph){c.width=pw;c.height=ph}}return{scale:d,width:w,height:h,cssScale:cssS}};' +
		'window.bkSetup=function(w,h,f){window.bkSetupCalled=true;const c=document.getElementById("c");if(!c)return;const ctx=c.getContext("2d");function l(){const fit=window.bkFitCanvas(c,w,h);if(window.innerWidth>=32&&window.innerHeight>=32){ctx.save();ctx.scale(fit.scale,fit.scale);f(ctx,fit.width,fit.height);ctx.restore()}requestAnimationFrame(l)}l()};' +
		'window.addEventListener("message",function(event){if(!event.data||event.data.type!=="bk:set-props")return;window.__simProps=Object.assign({},window.__simProps,event.data.props);window.dispatchEvent(new CustomEvent("bk:props",{detail:window.__simProps}));});' +
		"try{" +
		js +
		'}catch(e){console.error("Simulation Error:",e);document.body.innerHTML="<div style=\'padding: 20px; color: red; font-family: monospace;\'>Error: "+e.message+"</div>"}' +
		"if(!window.bkSetupCalled){function fallbackScale(){window.bkFitCanvas(document.getElementById('c'),800,500,{bitmap:false});requestAnimationFrame(fallbackScale)}fallbackScale()}" +
		"</" + "script></body></html>"
	);
}

function bkReadSimProps(figure) {
	const props = {};
	figure.querySelectorAll("[data-bk-prop]").forEach((input) => {
		if (input.type === "checkbox") {
			props[input.dataset.bkProp] = input.checked;
		} else if (input.type === "range" || input.type === "number") {
			props[input.dataset.bkProp] = Number(input.value);
			const output = input.parentElement?.querySelector("output");
			if (output) output.textContent = input.value;
		} else {
			props[input.dataset.bkProp] = input.value;
		}
	});
	return props;
}

function bkRestartSim(iframe, config, props) {
	iframe.srcdoc = bkSimDoc(config.js, props, config.loop, config.dependencies);
}

function bkWireSimControls() {
	document.querySelectorAll(".bk-object").forEach((figure) => {
		const configEl = figure.querySelector(".bk-sim-config");
		const iframe = figure.querySelector("iframe");
		if (!configEl || !iframe) return;

		let config;
		try {
			config = JSON.parse(configEl.textContent || "{}");
		} catch {
			return;
		}

		figure.querySelectorAll("[data-bk-prop]").forEach((input) => {
			input.addEventListener("input", () => {
				const props = bkReadSimProps(figure);
				iframe.contentWindow?.postMessage({ type: "bk:set-props", props }, "*");
			});
			input.addEventListener("change", () => {
				const props = bkReadSimProps(figure);
				iframe.contentWindow?.postMessage({ type: "bk:set-props", props }, "*");
			});
		});
	});
}

function bkWireMaximizeControls() {
	document.querySelectorAll(".bk-object-maximize").forEach((btn) => {
		btn.addEventListener("click", () => {
			const obj = btn.closest(".bk-object");
			if (!obj) return;
			const isMax = obj.classList.toggle("bk-object--maximized");
			if (isMax) {
				document.body.style.overflow = "hidden";
				btn.innerHTML =
					'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
			} else {
				document.body.style.overflow = "";
				btn.innerHTML =
					'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
			}
		});
	});
}

function bkWireInteractiveFrames() {
	document.querySelectorAll(".bk-object").forEach((obj) => {
		const activate = () => {
			const frame = obj.querySelector(".bk-embed-interactive");
			if (frame) frame.classList.add("is-interactive");
		};
		obj.addEventListener("pointerdown", activate, { passive: true });
		obj.addEventListener("focusin", activate, { passive: true });
	});

	const exitInteractive = (e) => {
		document
			.querySelectorAll(".bk-embed-interactive.is-interactive")
			.forEach((frame) => {
				const container = frame.closest(".bk-object") || frame;
				if (!container.contains(e.target)) {
					frame.classList.remove("is-interactive");
				}
			});
	};
	document.addEventListener("pointerdown", exitInteractive, { passive: true });
	document.addEventListener("focusin", exitInteractive, { passive: true });
}

function bkWireSidebarToggle() {
	const shell = document.querySelector(".bk-shell");
	const collapseBtn = document.getElementById("bk-sidebar-collapse");
	const expandBtn = document.getElementById("bk-sidebar-expand");
	if (collapseBtn)
		collapseBtn.addEventListener("click", () =>
			shell.setAttribute("data-collapsed", "true"),
		);
	if (expandBtn)
		expandBtn.addEventListener("click", () =>
			shell.removeAttribute("data-collapsed"),
		);
}

function bkWireThemeControls() {
	const root = document.documentElement;
	const button = document.getElementById("bk-settings-button");
	const panel = document.getElementById("bk-theme-panel");
	const themeBtns = document.querySelectorAll("#bk-theme-icons button");
	const paletteBtns = document.querySelectorAll("#bk-palette-icons button");
	const savedTheme = localStorage.getItem("bk-theme");
	const savedPalette = localStorage.getItem("bk-palette");

	function updateThemeBtn(val) {
		themeBtns.forEach(b => {
			if(b.dataset.theme === val) b.classList.add("active");
			else b.classList.remove("active");
		});
	}

	function updatePaletteBtn(val) {
		paletteBtns.forEach(b => {
			if(b.dataset.palette === val) b.classList.add("active");
			else b.classList.remove("active");
		});
	}

	if (savedTheme) {
		updateThemeBtn(savedTheme);
		savedTheme === "auto"
			? root.removeAttribute("data-theme")
			: root.setAttribute("data-theme", savedTheme);
	}
	if (savedPalette) {
		const normalizedPalette = savedPalette === "green" ? "field" : savedPalette;
		updatePaletteBtn(normalizedPalette);
		root.setAttribute("data-palette", normalizedPalette);
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

	themeBtns.forEach(btn => {
		btn.addEventListener("click", () => {
			const val = btn.dataset.theme;
			localStorage.setItem("bk-theme", val);
			updateThemeBtn(val);
			val === "auto"
				? root.removeAttribute("data-theme")
				: root.setAttribute("data-theme", val);
		});
	});

	paletteBtns.forEach(btn => {
		btn.addEventListener("click", () => {
			const val = btn.dataset.palette;
			localStorage.setItem("bk-palette", val);
			updatePaletteBtn(val);
			root.setAttribute("data-palette", val);
		});
	});
}

// Quiz interaction
// biome-ignore lint/correctness/noUnusedVariables: Used in generated HTML
function bkAnswer(btn, qid) {
	// biome-ignore lint/correctness/noUnusedVariables: Kept for clarity
	const isCorrect = btn.dataset.correct === "true";
	const question = document.getElementById(qid);
	question.querySelectorAll(".bk-opt").forEach((b) => {
		if (b.dataset.correct === "true") {
			b.classList.add("correct");
		} else if (b === btn) {
			b.classList.add("wrong");
		} else {
			b.classList.add("disabled");
		}
	});
	const exp = document.getElementById(`${qid}-exp`);
	if (exp) exp.hidden = false;
}

// Active sidebar link on scroll
document.addEventListener("DOMContentLoaded", () => {
	bkWireMaximizeControls();
	bkWireSidebarToggle();
	bkWireThemeControls();
	bkWireSimControls();
	bkWireInteractiveFrames();

	const sections = document.querySelectorAll(
		'[id^="heading-"], [id^="section-"], [id^="quiz-"]',
	);
	const navLinks = document.querySelectorAll(".bk-nav-item");

	if (!sections.length || !navLinks.length) return;

	const obs = new IntersectionObserver(
		(entries) => {
			let activeId = null;
			entries.forEach((e) => {
				if (e.isIntersecting) {
					activeId = e.target.id;
				}
			});

			if (activeId) {
				navLinks.forEach((l) => {
					if (l.dataset.id === activeId) {
						l.classList.add("active");
					} else {
						l.classList.remove("active");
					}
				});
			}
		},
		{ rootMargin: "-20% 0px -60% 0px", threshold: 0 },
	);

	sections.forEach((s) => {
		obs.observe(s);
	});
});
