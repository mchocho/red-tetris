export default (gameManager) =>
{
	let element;
	let value;

	switch(gameManager.state)
	{
		case 'settings':
		case 'controls':
			gameManager.openMenu('.main');
			gameManager.state = null;

			break;
		case 'multiplayer':
			gameManager.startSession(gameManager);

			break;
		case 'pause':
			element = document.querySelector(`#${gameManager.state} input:checked`);

			if (!element || !gameManager.isRunning() || gameManager.getMode() === 'multiplayer')
				return;

			value = element.value.toLowerCase();

			if (value === 'continue')
			{
				gameManager.resume();
				return;
			}
			gameManager.gameOver(false);
			gameManager.setMode(null);
			gameManager.openMenu('.main');
			gameManager.state = null;

			break;
		case 'game-over':
		case 'winner':
			element = document.querySelector(`#${gameManager.state} input:checked`);

			if (!element)
				return;

			value = element.value.toLowerCase();

			if (value === 'yes')
			{
				gameManager.state = gameManager.getMode();

				if (gameManager.getMode() === 'multiplayer')
					gameManager.openMenu('multiplayer');
				else
					gameManager.startNewGame(gameManager);
			}
			else
			{
				gameManager.openMenu('.main');
				gameManager.state = null;
				gameManager.setMode(null);
			}

			break;
		default: 
			element = document.querySelector('#main-menu input:checked');

			if (!element)
				return;

			value = element.value;

			switch(value) {
				case '1-player':
				case '2-player':
					//Start the game;
					gameManager.state = value;
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
				case 'controls':
					gameManager.state = value;
					gameManager.openMenu(value);

					break;
				default:
				
					return;
			}
	}
}