import Events from './events';

const DEV = window.DEV;
const AUDIO = new Audio('./assets/sound.mp3');

export default (game, gameManager) => {
	if (DEV) {
		console.log('New player joined');
	}

	const pieces 		= gameManager.getPiecesList();
	const pos 			= {x: 0, y: 0};
	const arena 		= game.arena;
	const events 		= Events();
	const slow 			= 1000;
	const fast 			= 50;
	
	let name 			= null;
	let gameOver 		= false;
	let paused 			= false;
	let dropCounter 	= 0;
	let pieceCount 		= 0;
	let score 			= 0;

	function onGameOver(player) {
		const gameMode = gameManager.getMode();
		
		gameOver = true;
		
		if (game.isLocal || gameMode === '2-player') {
			gameManager.gameOver();
			gameManager.state = 'game-over';
		}
	}

	function newPiece() {
		return new Promise((resolve, reject) => {

			if (gameManager.getMode() === '1-player') {
				const random = gameManager.createRandomPiece();

				resolve(random);
				return;
			}

			gameManager.getPieceAtIndex(gameManager, pieceCount)
			.then(result => {
				resolve(gameManager.createPiece(result));
			})
			.catch(e => {
				reject(e);
			});
		});
	}

	return {
		game,
		arena,
		pos,
		matrix: null,
		dropInterval: 1000, 	//Every 1 second we want to drop a piece
		addListener(name, callback) {
			events.listen(name, callback);
		},
		drop(player) {
			if (paused || gameOver) return;

			pos.y++;
			dropCounter = 0;
			if (arena.collide(arena, player)) {
				if (gameManager.enableSound)
					AUDIO.play();
				pos.y--;
				arena.merge(arena.matrix, player);
				player.reset(player);
				arena.sweep(player, gameManager);
				events.emit('score', player.getScore());
				game.updatePanel(); //Shows score and pieces count
				return;
			}
			events.emit('pos', pos);
		},

		dropPieceInPile(player) {
			if (paused || gameOver) return;

			while(!arena.collide(arena, player)) {
				pos.y++;
			}
			player.move(player, -1, 'y');
			player.drop(player);
		},

		fast() {
			return fast;
		},

		gameOver() {
			gameOver = true;
		},

		getName() {
			return name;
		},

		getPieceCount() {
			return pieceCount;
		},

		getScore() {
			return score;
		},

		isPaused() {
			return paused;
		},

		move(player, dir, axis='x', emit=true) {
			if (paused || gameOver) return;

			//Return true if no collision was detected otherwise false
			pos[axis] += dir;

			if (arena.collide(arena, player)) {
				pos[axis] -= dir;
				return false;
			}
			if (emit)
				events.emit('pos', pos);
			return true;
		},

		newGame(player) {
			score 		= 0;
			pieceCount 	= 0;
			gameOver 	= false;
			paused 		= false;
			arena.matrix.forEach(row => row.fill(0)); //Clean the arena
			player.reset(player);
		},

		newPosition(value) {
			if (paused || gameOver) return;
			if (!value) return;
			if (isNaN(value.x) || isNaN(value.y)) return;

			pos.x = value.x;
			pos.y = value.y;
		},

		pause() {
			if (paused || gameOver) return;
			if (['1-player', '2-player'].indexOf(gameManager.getMode()) === -1) return;

			paused = true;
			gameManager.state = 'pause';
			gameManager.openMenu('pause');
		},

		quitGame() {
			gameOver = true;
		
			gameManager.gameOver(false);
			gameManager.state = null;
			gameManager.openMenu('main');
		},

		randomPiece() {
			const piece = pieces[pieces.length * Math.random() | 0];
			
			return piece;
		},

		reset(player) {
			if (paused || gameOver) return;
			
			//New piece should be provided by server
			newPiece()
			.then(piece => {
				player.matrix = piece;
				pos.y = 0;
				pos.x = (arena.matrix[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
				pieceCount++;

				if (arena.collide(arena, player)) {
					//Game over
					onGameOver(player);
				}
				events.emit('pos', pos);
				events.emit('matrix', player.matrix);
			})
			.catch(e => {
				//Game over
				if (gameManager.isRunning()) {
					onGameOver(player);
					gameManager.openMenu('error');
				}
			})
		},

		resume() {
			if (!paused || gameOver) return;

			paused = false;
			gameManager.closeMenus();
		},

		rotate(player, dir) {
			if (paused || gameOver) return;

			const xAxis = pos.x;
			let offset = 1;

			player._rotateMatrix(player.matrix, dir);
			while(arena.collide(arena, player)) {
				pos.x += offset;
				offset = -(offset + (offset > 0 ? 1 : -1));
				if (offset > player.matrix[0].length) {
					player._rotateMatrix(player.matrix, -dir);
					pos.x =  xAxis; 
					return;
				}
			}
			events.emit('matrix', player.matrix);
		},

		_rotateMatrix(matrix, dir) {
			if (paused || gameOver) return;

			for (let y = 0; y < matrix.length; ++y) {
				for (let x = 0; x < y; ++x) {
					//Swap values respectfully between first and last rows or columns
					[
						matrix[x][y],
						matrix[y][x]
					] = [
						matrix[y][x],
						matrix[x][y]
					]
				}
			}

			if (dir > 0) {
				matrix.forEach(row => row.reverse());
			} else {
				matrix.reverse();
			}
		},

		setName(value) {
			name = value;
		},

		setScore(value) {
			if (isNaN(value))
				return;

			score = parseInt(value);
		},

		slow() {
			return slow;
		},

		update(player, deltaTime,) {
			if (paused || gameOver) return;

			dropCounter += deltaTime;

			if (dropCounter > player.dropInterval) {
				player.drop(player);
			}
		},
		

		verticalAlign(player, dir=-1) {
			if (paused || gameOver) return;

			//Move to the side
			if (DEV) {
				console.log('Aligning tetromino vertically');
			}
			const emit = false;
			let tileAvailable = player.move(player, dir, emit);

			if (tileAvailable) {
				//Check tiles above and below
				if (player.move(player, 1, 'y', emit)) {
					player.move(player, -1, 'y', emit);
					player.move(player, dir * -1, emit);
					return false;
				}
				else if (player.move(player, -1, 'y', emit)) {
					player.move(player, 1, 'y', emit);
					player.move(player, dir * -1, emit);
					return false;
				}
				return true;
			}
			return false;
		}
  
	};
}