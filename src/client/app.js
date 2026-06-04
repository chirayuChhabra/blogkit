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
		'window.bkSetup=function(w,h,f){window.bkSetupCalled=true;const c=document.getElementById("c");if(!c)return;const ctx=c.getContext("2d");let loopId=null;let fit=window.bkFitCanvas(c,w,h);function l(){if(window.innerWidth>=32&&window.innerHeight>=32){ctx.save();ctx.scale(fit.scale,fit.scale);f(ctx,fit.width,fit.height);ctx.restore()}if(window.__loop){loopId=requestAnimationFrame(l)}else{loopId=null}}function i(){if(window.innerWidth>=32&&window.innerHeight>=32){fit=window.bkFitCanvas(c,w,h);l()}else{requestAnimationFrame(i)}}i();window.addEventListener("resize",function(){fit=window.bkFitCanvas(c,w,h);if(!window.__loop&&window.innerWidth>=32&&window.innerHeight>=32&&!loopId){ctx.save();ctx.scale(fit.scale,fit.scale);f(ctx,fit.width,fit.height);ctx.restore()}});window.addEventListener("message",function(event){if(!event.data)return;if(event.data.type==="bk:play"){window.__loop=true;if(!loopId)loopId=requestAnimationFrame(l)}else if(event.data.type==="bk:pause"){window.__loop=false}});};' +
		'window.addEventListener("message",function(event){if(!event.data||event.data.type!=="bk:set-props")return;window.__simProps=Object.assign({},window.__simProps,event.data.props);window.dispatchEvent(new CustomEvent("bk:props",{detail:window.__simProps}));});' +
		"try{" +
		js +
		'}catch(e){console.error("Simulation Error:",e);document.body.innerHTML="<div style=\'padding: 20px; color: red; font-family: monospace;\'>Error: "+e.message+"</div>"}' +
		"if(!window.bkSetupCalled){function fallbackScale(){window.bkFitCanvas(document.getElementById('c'),800,500,{bitmap:false});}fallbackScale();window.addEventListener('resize', fallbackScale);}" +
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

function bkWireSimControls() {
	const handler = (e) => {
		const input = e.target.closest?.("[data-bk-prop]");
		if (!input) return;
		const figure = input.closest(".bk-object");
		if (!figure) return;
		const iframe = figure.querySelector("iframe");
		if (!iframe) return;
		const props = bkReadSimProps(figure);
		iframe.contentWindow?.postMessage({ type: "bk:set-props", props }, "*");
	};
	document.addEventListener("input", handler, { passive: true });
	document.addEventListener("change", handler, { passive: true });
}

function bkWireMaximizeControls() {
	document.addEventListener("click", (e) => {
		const btn = e.target.closest?.(".bk-object-maximize");
		if (!btn) return;
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
}

function bkWireInteractiveFrames() {
	const activate = (e) => {
		const obj = e.target.closest?.(".bk-object");
		if (!obj) return;
		const frame = obj.querySelector(".bk-embed-interactive");
		if (frame) {
			frame.classList.add("is-interactive");
			const iframe = frame.querySelector("iframe");
			if (iframe && iframe.contentWindow) {
				iframe.contentWindow.postMessage({ type: "bk:play" }, "*");
			}
		}
	};
	document.addEventListener("pointerdown", activate, { passive: true });
	document.addEventListener("focusin", activate, { passive: true });

	const exitInteractive = (e) => {
		document
			.querySelectorAll(".bk-embed-interactive.is-interactive")
			.forEach((frame) => {
				const container = frame.closest(".bk-object") || frame;
				if (!container.contains(e.target)) {
					frame.classList.remove("is-interactive");
					const iframe = frame.querySelector("iframe");
					if (iframe && iframe.contentWindow) {
						iframe.contentWindow.postMessage({ type: "bk:pause" }, "*");
					}
				}
			});
	};
	document.addEventListener("pointerdown", exitInteractive, { passive: true });
	document.addEventListener("focusin", exitInteractive, { passive: true });

	const obs = new IntersectionObserver((entries) => {
		entries.forEach((e) => {
			const frame = e.target;
			const iframe = frame.querySelector("iframe");
			if (!e.isIntersecting) {
				if (frame.classList.contains("is-interactive")) {
					frame.classList.remove("is-interactive");
				}
				if (iframe && iframe.contentWindow) {
					iframe.contentWindow.postMessage({ type: "bk:pause" }, "*");
				}
			} else {
				if (frame.dataset.isAnimation === "true") {
					if (iframe && iframe.contentWindow) {
						iframe.contentWindow.postMessage({ type: "bk:play" }, "*");
					}
				}
			}
		});
	}, { threshold: 0 });

	document.querySelectorAll(".bk-embed-interactive").forEach((frame) => {
		obs.observe(frame);
	});
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
		root.setAttribute("data-theme", savedTheme);
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
			root.setAttribute("data-theme", val);
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

// Code Block Copy Button
function bkWireCodeCopy() {
	document.querySelectorAll("pre > code").forEach((code) => {
		const pre = code.parentElement;
		let container = pre.closest(".bk-code-block");
		
		if (!container) {
			container = document.createElement("div");
			container.className = "bk-code-block";
			const scroll = document.createElement("div");
			scroll.className = "bk-code-scroll";
			
			pre.parentNode.insertBefore(container, pre);
			scroll.appendChild(pre);
			container.appendChild(scroll);
		}

		if (getComputedStyle(container).position === "static") {
			container.style.position = "relative";
		}

		const btn = document.createElement("button");
		btn.className = "bk-copy-btn";
		btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
		btn.setAttribute("aria-label", "Copy code");
		btn.title = "Copy code";
		container.appendChild(btn);
	});

	document.addEventListener("click", async (e) => {
		const btn = e.target.closest?.(".bk-copy-btn");
		if (!btn) return;
		const container = btn.closest(".bk-code-block");
		if (!container) return;
		const code = container.querySelector("code");
		if (!code) return;
		try {
			await navigator.clipboard.writeText(code.textContent || "");
			btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
			btn.classList.add("copied");
			setTimeout(() => {
				btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
				btn.classList.remove("copied");
			}, 2000);
		} catch (err) {
			console.error("Failed to copy", err);
		}
	});
}

// Active sidebar link on scroll
document.addEventListener("DOMContentLoaded", () => {
	bkWireMaximizeControls();
	bkWireSidebarToggle();
	bkWireThemeControls();
	bkWireSimControls();
	bkWireInteractiveFrames();
	bkWireCodeCopy();

	const navLinks = document.querySelectorAll(".bk-nav-item");
	if (!navLinks.length) return;

	const nav = document.querySelector(".bk-nav");
	let pill = document.querySelector(".bk-nav-active-pill");
	if (nav && !pill) {
		pill = document.createElement("div");
		pill.className = "bk-nav-active-pill";
		nav.prepend(pill);
	}

	const sections = [];
	navLinks.forEach((l) => {
		const id = l.dataset.id;
		if (id) {
			const el = document.getElementById(id);
			if (el) sections.push({ id, el, link: l, isAbove: false });
		}
	});

	if (!sections.length) return;

	function setActive(idx) {
		sections.forEach((s, i) => {
			if (i === idx) {
				s.link.classList.add("active");
				if (pill) {
					pill.style.top = s.link.offsetTop + "px";
					pill.style.height = s.link.offsetHeight + "px";
					pill.style.opacity = "1";
				}
			} else {
				s.link.classList.remove("active");
			}
		});
	}

	function updateActive() {
		let activeIdx = 0;
		for (let i = 0; i < sections.length; i++) {
			if (sections[i].isAbove) activeIdx = i;
		}
		setActive(activeIdx);
	}

	const mainScrollContainer = document.querySelector(".bk-main");
	const sectionObs = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			const section = sections.find(s => s.el === entry.target);
			if (!section) continue;
			if (entry.isIntersecting) {
				section.isAbove = true;
			} else {
				section.isAbove = entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0);
			}
		}
		updateActive();
	}, {
		root: mainScrollContainer || null,
		rootMargin: "0px 0px -75% 0px",
		threshold: 0
	});

	sections.forEach(s => sectionObs.observe(s.el));
	setActive(0);
});
