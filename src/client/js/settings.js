export default (gameManager) => {
	return (event) => {
		const el = event.target;

		if (!el || gameManager.state !== 'settings')
			return;

		const value = el.value;

		if (value === 'toggleSounds') {
			gameManager.enableSound = el.checked;
		}
		else if (value === 'toggleColours') {
			gameManager.enableColours = el.checked;
		}
		else if (value === 'togglePeers') {
			gameManager.showPeers = el.checked;
		}

	}
};