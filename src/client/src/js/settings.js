export default (gameManager) => {
	return (event) => {
		const el = event.target;

		console.log('Game state: ', gameManager.state);

		if (!el || gameManager.state !== 'settings')
			return;

		const value = el.value;

		if (value === 'toggleSounds')
			gameManager.enableSound = el.checked;
		else if (value === 'toggleColours')
			gameManager.disableColours = el.checked;
		else if (value === 'togglePeers')
			gameManager.showPeers = el.checked;

		console.log("Triggered by: ", el);
		console.log('Checked: ', el.checked);
	}
};