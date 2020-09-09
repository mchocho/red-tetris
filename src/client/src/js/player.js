import Events from './events';

const dev = window.DEV;

export default (game, gameManager) => {
	if (dev) {
		console.log('New player joined');
	}

	const pieces = 'ILJOTSZ';
	const pos = {x: 0, y: 0};
	const arena = game.arena;
	const events = Events(); 
	
	let gameOver = false;
	let dropCounter = 0;	
	let pieceCount = 0;

	function createPiece(type) {
		//3x3 or higher because you can't rotate with less
		if (type === 'T') {
			return [
				[0, 1, 0],
				[1, 1, 1],
				[0, 0, 0]
			];
		}
		else if (type === 'O') {
			return [
				[2, 2],
				[2, 2]
			];
		}
		else if (type === 'L') {
			return [
				[0, 0, 3],
				[3, 3, 3],
				[0, 0, 0]
			];

		}
		else if (type === 'J') {
			return [
				[4, 0, 0],
				[4, 4, 4],
				[0, 0, 0]
			];
		}
		else if (type === 'I') {
			return [
				[0, 0, 0, 0],
				[5, 5, 5, 5],
				[0, 0, 0, 0],
				[0, 0, 0, 0]
			];
		}
		else if (type === 'S') {

			return [
				[0, 6, 6],
				[0, 6, 0],
				[6, 6, 0]
			];
		}
		else if (type === 'Z') {
			return [
				[7, 7, 0],
				[0, 7, 7],
				[0, 0, 0]
			];
		}
	}

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

			if (gameManager.getMode() !== 'multiplayer') {
				const piece = createPiece(pieces[pieces.length * Math.random() | 0]);

				resolve(piece);
				return;
			}

			console.log('Requesting piece');

			gameManager.getPieceAtIndex(gameManager, pieceCount)
			.then(result => {
				console.log('Server response: ', result);

				resolve(createPiece(result));
			})
			.catch(e => {
				console.log(e);
				/*gameManager.gameOver(false);
				gameManager.openMenu('error');*/
				reject(e);
			})
		});
	}

	return {
		game,
		arena,
		pos/*: {x: 0, y: 0}*/,
		matrix: null,
		DROP_SLOW: 1000,
		DROP_FAST: 50,
		dropInterval: 1000, //Every 1 second we want to drop a piece
		score: 0,
		addListener(name, callback) {
			events.listen(name, callback);
		},
		drop(player) {
			if (gameOver) return;

			// const AUDIO = new Audio('assets/sound.mp3');

			pos.y++;
			dropCounter = 0;
			if (arena.collide(arena, player)) {
				// AUDIO.play();
				pos.y--;
				arena.merge(arena.matrix, player);
				player.reset(player);
				arena.sweep(arena.matrix, player);
				events.emit('score', player.score);
				//game.updatePanel(); //Shows score and pieces count
				//player.pos.y = 0;
				//update player's game state on server
				return;
			}
			events.emit('pos', pos);
		},

		dropPieceInPile(player) {
			if (gameOver) return;

			while(!arena.collide(arena, player)) {
				pos.y++;
			}
			player.move(player, -1, 'y');
			player.drop(player);
		},	

		gameOver() {
			gameOver = true;
		},

		getPieceCount() {
			return pieceCount;
		},

		move(player, dir, axis='x', emit=true) {
			if (gameOver) return;

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
			gameOver = false;
			// pos.x = 0;
			// pos.y = 0;
			arena.matrix.forEach(row => row.fill(0)); //Clean the arena
			player.score = 0;
			pieceCount = 0;
			player.reset(player);
		},

		newPosition(value) {
			if (gameOver) return;
			if (!value) return;
			if (isNaN(value.x) || isNaN(value.y)) return;

			pos.x = value.x;
			pos.y = value.y;
		},

		reset(player) {
			//This method needs to be an async function

			if (gameOver) return;
			
			//New piece should be provided by server
			newPiece()
			.then(piece => {
				player.matrix = piece;

				console.log('Piece ', piece);

				//DEV
				// return;





				/*if (gameManager.getMode() === 'multiplayer') {
					fetchNewPiece()
					.then(piece => {
						player.matrix = piece;
					})
				}
				else {*/
					// player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);

					console.table('Assigned new piece: ', player.matrix);
				//}
				pos.y = 0;
				pos.x = (arena.matrix[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
				pieceCount++;

				if (arena.collide(arena, player)) {
					//Game over
					onGameOver(player);
					// if ()

					/*events.emit('game-over', {
						score: player.score
					});*/
				}
				events.emit('pos', pos);
				events.emit('matrix', player.matrix);
			})
			.catch(e => {
				//Game over
				//
			})

		},

		rotate(player, dir) {
			if (gameOver) return;

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
			if (gameOver) return;

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


		update(player, deltaTime,) {
			if (gameOver) return;

			dropCounter += deltaTime;

			if (dropCounter > player.dropInterval) {
				player.drop(player);
			}
		},
		

		verticalAlign(player, dir=-1) {
			if (gameOver) return;

			//Move to the side
			if (dev) {
				console.log('Aligning tetromino vertically');
			}
			const emit = false;
			let tileAvailable = player.move(player, dir, emit);
			let lowerTileAvailable, aboveTileAvailable;

			if (tileAvailable) {
				//Check tiles above and below
				if (lowerTileAvailable = player.move(player, 1, 'y', emit)) {
					player.move(player, -1, 'y', emit);
					player.move(player, dir * -1, emit);
					return false;
				}
				else if (aboveTileAvailable = player.move(player, -1, 'y', emit)) {
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