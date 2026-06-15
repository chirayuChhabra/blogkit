export function bkReadSimProps(figure) {
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

export function bkWireSimControls() {
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
