export default (gameManager) => {
	const formListener = (event) => {
		const el = event.target;

		if (!el) return;

		const tagName = el.tagName.toLowerCase();

		console.log(tagName);

		if (tagName === 'form') {
			el.focus();
		}
		if (tagName === 'input' && el.type === 'radio') {
			el.checked = true;
		}
		if (tagName === 'label' && el.firstElementChild) {
			const firstChild = el.firstElementChild;

			if (firstChild.tagName.toLowerCase() === 'input' && firstChild.type === 'radio')
				firstChild.focus();
				firstChild.click();
		}
	}

	return (event) => {
		console.log(event);

		if (event.type === 'submit') 
			event.preventDefault();

		if (event.type === 'mouseover')
			formListener(event);
	}
};