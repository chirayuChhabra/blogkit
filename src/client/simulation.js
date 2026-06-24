export function bkReadSimProps(figure) {
	const props = {};
	figure.querySelectorAll("[data-bk-prop]").forEach((input) => {
		if (input.type === "checkbox") {
			props[input.dataset.bkProp] = input.checked;
		} else if (input.type === "range" || input.type === "number") {
			props[input.dataset.bkProp] = Number(input.value);
			// The synchronization of sibling inputs is handled in the event listener now
		} else {
			props[input.dataset.bkProp] = input.value;
		}
	});
	return props;
}

function updateSliderTrack(input) {
	if (input.type !== "range") return;
	const min = parseFloat(input.min) || 0;
	const max = parseFloat(input.max) || 100;
	const val = parseFloat(input.value) || 0;
	const percent = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
	input.style.setProperty("--bk-track-fill", `${percent}%`);
}

export function bkInitSimControls() {
	// Initialize all slider tracks
	document
		.querySelectorAll('input[type="range"][data-bk-prop]')
		.forEach(updateSliderTrack);
}

export function bkWireSimControls() {
	const handler = (e) => {
		const target = e.target;
		let propInput = target.closest?.("[data-bk-prop]");
		let syncInput = target.closest?.("[data-bk-sync]");

		if (syncInput && !propInput) {
			const propName = syncInput.dataset.bkSync;
			propInput = syncInput.parentElement?.querySelector(
				`[data-bk-prop="${propName}"]`,
			);
			if (propInput) {
				let val = parseFloat(syncInput.value);
				if (!Number.isNaN(val) && e.type === "change") {
					const min = parseFloat(syncInput.min);
					const max = parseFloat(syncInput.max);
					if (!Number.isNaN(min) && val < min) val = min;
					if (!Number.isNaN(max) && val > max) val = max;
					syncInput.value = val;
				}
				propInput.value = syncInput.value;
				updateSliderTrack(propInput);
			}
		} else if (propInput) {
			const propName = propInput.dataset.bkProp;
			syncInput = propInput.parentElement?.querySelector(
				`[data-bk-sync="${propName}"]`,
			);
			if (syncInput && e.target !== syncInput) {
				syncInput.value = propInput.value;
			}
			updateSliderTrack(propInput);
		}

		if (!propInput) return;
		const figure = propInput.closest(".bk-object");
		if (!figure) return;
		const iframe = figure.querySelector("iframe");
		if (!iframe) return;
		const props = bkReadSimProps(figure);
		iframe.contentWindow?.postMessage({ type: "bk:set-props", props }, "*");
	};
	document.addEventListener("input", handler, { passive: true });
	document.addEventListener("change", handler, { passive: true });
}
