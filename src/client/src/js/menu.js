export default (gameManager) => {
	let element;

	switch(gameManager.state) {
		case 'settings':
			//Hide settings menu
			//Show main menu
			gameManager.openMenu('.main');
			gameManager.state = null;
			break;
		case 'multiplayer':
			//Hide start game menu
			gameManager.startSession(gameManager);
			break;
		case 'game-over':
		case 'winner':
			element = document.querySelector(`#${gameManager.state} input:checked`);

			if (!element)
				return;

			let value = element.value.toLowerCase();

			if (value === 'yes') {

				if (gameManager.getMode() === 'multiplayer') {
					gameManager.state = 'multiplayer';
					gameManager.openMenu('multiplayer');

				}
				else
					gameManager.startNewGame(gameManager);
			} else {
				gameManager.openMenu('.main');
				gameManager.state = null;
				gameManager.setMode(null);
			}

			break;
		default: {
			//Main menu
			element = document.querySelector('#main-menu input:checked');

			if (!element)
				return;

			let value = element.value;

			switch(value) {
				case '1-player':
				case '2-player':
					//Start the game;
					gameManager.setMode(value);
					gameManager.startNewGame(gameManager);
					break;
				case 'multiplayer':
					//Open multiplayer menu
					gameManager.state = value;
					gameManager.setMode(value);
					gameManager.initRoom(gameManager);
					break;
				case 'settings':
					//gameManager.setMode(value);
					gameManager.state = value;
					gameManager.openMenu(value);
					break;
				default:
					return;
			}
		}
	}
}