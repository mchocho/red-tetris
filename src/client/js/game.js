import Arena from './arena';
import Player from './player';

const dev = window.DEV;

export default (element, gameManager) => {
	if (dev) {
		console.log('Starting game');
	}
	const canvas = element.querySelector('canvas');
	const context = canvas.getContext('2d');
	let arena = Arena(10, 20);
	const colours = [
		null,
		'red',
		'blue',
		'violet',
		'green',
		'purple',
		'orange',
		'pink'
	];
	const game = {
		element,		//Unnecesary property
		canvas,			//Unnecesary property
		context,		//Unnecesary property
		arena,
		draw(game) {
			if (!arena.matrix || !player.matrix || !gameManager.isRunning())
				return;

			context.fillStyle = '#000';
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			//Draws placed pieces to arena
			game.drawMatrix(arena.matrix, {x: 0, y: 0});
			game.drawMatrix(player.matrix, player.pos);
		},
		drawMatrix(matrix, offset) {
			const useColours = gameManager.enableColours;

			matrix.forEach((row, y) => {
				row.forEach((value, x) => {
					if (value !== 0) {
						if (value === null)
							context.fillStyle = 'white';	//Permanent wall
						else if (value === -1)
							context.fillStyle = 'grey';		//Breakable wall
						else
							context.fillStyle = useColours ? colours[value] : 'red';
						context.fillRect(x + offset.x,
								y + offset.y,
						 		1, 1);
					}
				});
			});
		},
		penalty(game) {
			//Returns true if the size of the penalty wall increased otherwise false
			//Temp is -1 and permanent is null
			const matrix = arena.matrix;

			for (let y = matrix.length - 1; y > 0; --y) {
				if (matrix[y][0] === -1) {
					matrix[y].fill(null);
					return false;
				}
			}

			//Create a temporary wall
			const temp = matrix[0].slice(0).fill(-1);

			matrix.push(temp);
			game.draw(game);	//Render new changes

			if (matrix[0].some(value => value !== 0)) {
				//The pile reached past the starting point. Game over
				gameManager.gameOver();
				return true;
			}
			//Remove the top row
			matrix.shift();
			return true;
		},
		reset() {
			arena.clear(arena);
		},
		run(game) {
			update();
			game.updatePanel();
		},
		updatePanel() {
			const players 		= [...gameManager.instances];
			const localPlayer 	= players.shift();
			const localPlayerEl	= document.querySelector('#game .player-list .you');
			const playerList 	= document.querySelector('#game .alt-players');
			const countEl 		= document.getElementById('player-count');
			const mode 			= gameManager.getMode();	

			if (!localPlayerEl || !playerList || !countEl)
				return;

			if (mode === '1-player')
				countEl.textContent = 'Single player';
			else if (mode === '2-player')
				countEl.textContent = '2-players';
			else
				countEl.textContent = `Players ${gameManager.activePlayers()} / ${gameManager.totalPlayers()}`;

			localPlayerEl.innerHTML = `<li>
											<span class="name">${localPlayer.player.getName()}</span>
											${(mode !== '2-player') ? '<div class="indicator"></div>' : ''}
											<span class="score">${localPlayer.player.getScore()}</span>
										</li>`;
			
			playerList.innerHTML = '';
			players.forEach((game, index) => {
				const player = game.player;
				const content 	= `<li>
									<span class="name">${player.getName()}</span>
									<span class="score">${player.getScore()}</span>
								   </li>`;
				playerList.innerHTML += content;

			});

		}
	};
	let player = Player(game, gameManager);
	let lastTime = 0;

	function update(time = 0) {
		//We need to make this reusable
		if (!gameManager.isRunning()) {
			return;
		}

		const deltaTime = time - lastTime;

		lastTime = time;

		player.update(player, deltaTime);
		game.draw(game);
		requestAnimationFrame(update);
	}

	context.scale(18, 20);
	player.reset(player);
	game.player = player;	//Maybe an array

	game.serialize = function(game) {
		return {
			arena: {
				matrix: game.arena.matrix
			},
			player: {
				matrix: game.player.matrix,
				pos: game.player.pos,
				score: game.player.score
			}
		};
	};

	game.unserialize = function(state) {
		if (dev) {
			console.log('Unserialized arena: ', state.arena);
		}
		arena.setMatrix(state.arena.matrix);
		game.player.newPosition(state.player);
		game.updatePanel();
		game.draw(game);
	}
	
	player.addListener('score', score => {
		game.updatePanel();
	});
	
	return game;
}