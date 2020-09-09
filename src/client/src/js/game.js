import Arena from './arena';
import Player from './player';

const dev = window.DEV;
const logEvents = window.EVENTS;
const collisionStatus = window.COLLISION;

export default (element, gameManager) => {
	if (dev) {
		console.log('Starting game');
	}
	const canvas = element.querySelector('canvas');
	const context = canvas.getContext('2d');
	let arena = Arena(13, 20);
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
		element,
		canvas,
		context,
		arena,
		draw(game) {
			if (!arena.matrix || !player.matrix)
				return;

			context.fillStyle = '#000';
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			//Draws placed pieces to arena
			game.drawMatrix(arena.matrix, {x: 0, y: 0});
			game.drawMatrix(player.matrix, player.pos);
		},
		drawMatrix(matrix, offset) {
			const useColours = gameManager.disableColours === false;

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
		run() {
			update();
		},
		updatePanel() {
			element.querySelector('.score').textContent = `Score: ${game.player.score}`;
			element.querySelector('.pieces').textContent = `Pieces: ${game.player.getPieceCount()}`;
		}
	};
	let player = Player(game, gameManager);
	let lastTime = 0;

	function update(time = 0) {
		//We need to make this reusable
		if (!gameManager.isRunning()) {
			console.log('Game is not running');
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
	//update();
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
		//arena = Object.assign(state.arena);
		console.log('Unserialized arena: ', state.arena);
		arena.setMatrix(state.arena.matrix);
		//player = Object.assign(state.player);
		game.player.newPosition(state.player);
		game.updatePanel();
		game.draw(game);
	}
	
	player.addListener('score', score => {
		game.updatePanel();
	});
	
	return game;
}