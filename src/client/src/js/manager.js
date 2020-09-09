import Game from './game';
import ConnectionManager from './connection';
import Controller from './controller';
import Form from './form';
import Settings from './settings';

const SERVER_URL = 'ws://localhost:9000';

export default () => {
	const instances = new Set(); //Arrays are not optimal and may hold duplicates

	let connection = null;
	let mode = null;
	let paused = true;
	let isRunning = false;
	let gameOver = true;

	function closeMenus() {
		const el = document.querySelectorAll('.modal');

		for (let i = 0; i < el.length; i++) {
			el[i].classList.remove('show');
		}
	} 

	function createPlayer(gameManager, isLocal=false, hide=false) {
		const template = document.getElementById('player-template');

		/*const element = document
				.importNode(template.content, true)
				.children[0];*/
		const element = document.createElement('div');

		element.className = 'player';
		element.innerHTML = `
			<div class="score"></div>
			<div class="pieces"></div>
			<canvas class="tetris" width="240" height="400"></canvas>`;

		const tetris = Game(element, gameManager);
		const container = document.getElementById('players');
		
		tetris.isLocal = (isLocal === true);
		tetris.hidden = (hide === true);
		instances.add(tetris);

		if (!hide)
			container.appendChild(element); //Append to a div or something

		return tetris;
	}

	function openMenu(value) {
		let el;
		closeMenus();

		switch(value) {
			case 'settings':
			case 'game-over':
			case 'multiplayer':
				if (value === 'multiplayer') {
					gameOver = false;
					isRunning = false;
				}
			case 'winner':
			case 'loading':
			case 'error':
				el = document.querySelector('.modal.' + value);
				break;
			default:
				if (connection)
					connection.close();
				window.location.hash = '';
				removeAllPlayers();
				el = document.querySelector('.modal.main');
		}
		if (el) {
			el.classList.add('show');
			el.querySelector('form').focus();

			const input = el.querySelector('input:first-of-type');

			if (input) {
				input.focus();
				if (input.type === 'radio')
					input.click();
			}
		}
	}	

	function removeAllPlayers() {
		[...instances].forEach((game) => {
			removePlayer(game);
		});
	}

	function removePlayer(game) {
		const container = document.getElementById('players');

		game.player.gameOver();
		instances.delete(game);

		if (!game.hidden)
			container.removeChild(game.element);
	}

	return {
		instances,
		state: null,
		closeSession() {
			if (connection)
				connection.close();
		},
		createPlayer(gameManager, hide=false) {
			return createPlayer(gameManager, false, hide);
		},
		gameOver(menu=true) {
			if (menu)
				openMenu('game-over');

			if (mode !== 'multiplayer') {
				removeAllPlayers();
			}
			else if (connection) {
				if (!isRunning)
					return;

				[...instances].forEach(game => game.player.gameOver());
				connection.send({
					type: 'game-over',
					id: connection.getSessionId()
				});
			}

			isRunning = false;
			gameOver = true;
		},
		getMode() {
			return mode;
		},
		getPieceAtIndex(gameManager, index) {
			return new Promise((resolve, reject) => {
				if (gameManager.getMode() !== 'multiplayer') {
					reject('Multiplayer mode not enabled');
					return;
				}
				else if (!connection) {
					reject('Socket connection unavailable');
					return;
				}
				else if (isNaN(index)) {
					reject('Value is not an index');
					return;
				}

				const layout = connection.getSessionLayout();
				const piece = layout[index];

				if (piece) {
					resolve(layout[index]);
					connection.send({ type: 'new-piece' });
					return;
				}
				reject('Piece unavailable');
			});
		},
		initRoom(gameManager) {
			if (connection)
				connection.close();		//Close current connection

			if (!connection || instances.size === 0)
				connection = ConnectionManager(gameManager);

			if (!connection.isConnected())
				connection.connect(SERVER_URL);
		},
		isGameOver() {
			return gameOver;
		},
		isPaused() {
			return paused;
		},
		isRunning() {
			return isRunning;
		},
		onReady(gameManager) {
			return () => {
				const hash = window.location.hash.split('#')[1];
				const el = document.querySelector('.menu input:first-of-type');

				document.addEventListener('keydown', Controller(gameManager)); 
				document.addEventListener('keyup', Controller(gameManager));
				document.addEventListener('change', Settings(gameManager));
				document.addEventListener('submit', Form(gameManager));

				if (el) {
					el.click();
					el.focus();
				}

				if (!hash)
					return;

				if (hash.length === 0)
					return;

				mode = 'multiplayer';
				gameManager.state = 'multiplayer';
				gameManager.openMenu('loading');
				gameManager.initRoom(gameManager);
			}
		},
		openMenu(value='main') {
			openMenu(value);
		},
		removePlayer(player) {
			removePlayer(player);
		},
		setMode(value) {
			const modes = [null, '1-player', '2-player', 'multiplayer'];

			if (modes.indexOf(value) > -1)
				mode = value;
			else mode = '1-player';
		},
		startNewGame(gameManager) {
			isRunning = true;
			paused = false;
			gameOver = false;

			removeAllPlayers();	

			const localPlayer = createPlayer(gameManager, true);
			let player2;
	
			closeMenus();
			localPlayer.element.classList.add('local');
			switch(gameManager.getMode()) {
				case '2-player':
					player2 = createPlayer(gameManager);
					localPlayer.run();
					player2.run();
					break;
				case 'multiplayer':
					gameManager.openMenu('loading');
					isRunning = false;
					return localPlayer;
				default:
					//Single player
					localPlayer.run();
					return;
			}
		},
		startSession(gameManager) {
			if (!connection.isConnected()) {
				gameManager.openMenu('error');
				return;
			}
			if (gameManager.getMode() !== 'multiplayer') return;
			if (gameManager.isRunning()) return;
			
			connection.send({ 
				type: 'start-game',
				id: connection.getSessionId()
			 });
			return;
		},
		startNewGameLAN(gameManager) {
			if (!connection.isConnected()) {
				gameManager.openMenu('error');
				return;
			}
			if (gameManager.getMode() !== 'multiplayer') return;
			if (gameManager.isRunning()) {
				console.log('game is running');
				return;
			}

			const game = [...instances][0];

			game.reset();
			closeMenus();
			isRunning = true;
			gameOver = false;

			//There's a bug, on replay instances is undefined
			game.player.newGame(game.player);
			game.run(true);
		}

	};
}