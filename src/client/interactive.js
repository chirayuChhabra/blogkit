export function bkWireInteractiveFrames() {
	const interactiveHandler = (e) => {
		const obj = e.target.closest?.(".bk-object");
		const activateFrame = obj
			? obj.querySelector(".bk-embed-interactive")
			: null;

		document
			.querySelectorAll(".bk-embed-interactive.is-interactive")
			.forEach((frame) => {
				if (frame !== activateFrame) {
					frame.classList.remove("is-interactive");
					const iframe = frame.querySelector("iframe");
					if (iframe?.contentWindow) {
						iframe.contentWindow.postMessage({ type: "bk:pause" }, "*");
					}
				}
			});

		if (activateFrame && !activateFrame.classList.contains("is-interactive")) {
			activateFrame.classList.add("is-interactive");
			const iframe = activateFrame.querySelector("iframe");
			if (iframe?.contentWindow) {
				iframe.contentWindow.postMessage({ type: "bk:play" }, "*");
			}
		}
	};
	document.addEventListener("pointerdown", interactiveHandler, {
		passive: true,
	});
	document.addEventListener("focusin", interactiveHandler, { passive: true });

	const obs = new IntersectionObserver(
		(entries) => {
			entries.forEach((e) => {
				const frame = e.target;
				const iframe = frame.querySelector("iframe");
				if (!e.isIntersecting) {
					if (frame.classList.contains("is-interactive")) {
						frame.classList.remove("is-interactive");
					}
					if (iframe?.contentWindow) {
						iframe.contentWindow.postMessage({ type: "bk:pause" }, "*");
					}
				} else {
					if (frame.dataset.isAnimation === "true") {
						if (iframe?.contentWindow) {
							iframe.contentWindow.postMessage({ type: "bk:play" }, "*");
						}
					}
				}
			});
		},
		{ threshold: 0 },
	);

	document.querySelectorAll(".bk-embed-interactive").forEach((frame) => {
		obs.observe(frame);
	});

	document.addEventListener(
		"contentvisibilityautostatechange",
		(e) => {
			const frame = e.target;
			if (frame?.classList?.contains("bk-embed-interactive")) {
				const iframe = frame.querySelector("iframe");
				if (!iframe?.contentWindow) return;

				if (e.skipped) {
					iframe.contentWindow.postMessage({ type: "bk:pause" }, "*");
				} else {
					if (
						frame.dataset.isAnimation === "true" ||
						frame.classList.contains("is-interactive")
					) {
						iframe.contentWindow.postMessage({ type: "bk:play" }, "*");
					}
				}
			}
		},
		{ capture: true },
	);
}
