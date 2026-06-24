export function bkInitRouter() {
	if (window.__bk_router_initialized) return;
	window.__bk_router_initialized = true;

	function handleNavigation(url, addToHistory = true) {
		const targetUrl = new URL(url, window.location.origin);
		if (targetUrl.origin !== window.location.origin) return false;
		
		document.body.classList.add('bk-is-navigating');

		fetch(targetUrl.href)
			.then(res => res.text())
			.then(html => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(html, 'text/html');

				const newMain = doc.querySelector('.bk-main');
				const newNav = doc.querySelector('.bk-nav');
				const newHeader = doc.querySelector('.bk-sidebar-header');
				const newTitle = doc.title;

				if (newMain && newNav && newHeader) {
					document.querySelector('.bk-main').innerHTML = newMain.innerHTML;
					document.querySelector('.bk-nav').innerHTML = newNav.innerHTML;
					document.querySelector('.bk-sidebar-header').innerHTML = newHeader.innerHTML;
					document.title = newTitle;

					if (addToHistory) {
						window.history.pushState({}, '', targetUrl.href);
					}

					// Reset scroll to top
					window.scrollTo(0, 0);
					document.querySelector('.bk-main').scrollTop = 0;

					window.dispatchEvent(new Event('bk-page-loaded'));
				} else {
					window.location.href = targetUrl.href;
				}
			})
			.catch(() => {
				window.location.href = targetUrl.href;
			})
			.finally(() => {
				document.body.classList.remove('bk-is-navigating');
			});
		
		return true;
	}

	document.addEventListener('click', (e) => {
		const a = e.target.closest('a');
		if (!a || !a.href) return;
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
		if (a.target === '_blank') return;
		
		const targetUrl = new URL(a.href);
		if (targetUrl.origin === window.location.origin && targetUrl.pathname.endsWith('.html')) {
			e.preventDefault();
			handleNavigation(targetUrl.href);
		}
	});

	window.addEventListener('popstate', () => {
		handleNavigation(window.location.href, false);
	});
}
