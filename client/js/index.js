function Arena(w, h) {
	if (dev) {
		console.log('Creating matrix');
	}
	const matrix = [];
	const events = Events();
	
	while (h--) {
		matrix.push(new Array(w).fill(0));
	}
	if (dev) {
		console.log('Game arena:');
		console.table(matrix);
	}
	
	return {
		matrix,
		addListener(name, callback) {
			events.listen(name, callback);
		},
		clear(arena) {
			arena.matrix.forEach(row => row.fill(0)); //Remove everything from the arena
			events.emit('matrix', matrix);
		},

		collide(arena, player) {
			//Tuple assigner
			const [m, o] = [player.matrix, player.pos]; //matrix and current position

			for (let y = 0; y < m.length; ++y) {
				for (let x = 0; x < m[y].length; ++x) {
					if (m[y][x] !== 0 && //Check if player matrix is not 0
			    		(arena.matrix[y + o.y] &&	//Check if arena has a row & is not 0)
			    		arena.matrix[y + o.y][x + o.x]) !== 0) {
						if (collisionStatus) {
							console.log('Collision detected');
						}
						return true; //There was a collision
					}

				}
			}
			if (collisionStatus) {
				console.log('No collision detected');
			}
			return false;	//There was no collision
		},

		merge(matrix, player) {
			//Copies the players position into the arena
			player.matrix.forEach((row, y) => {
				row.forEach((value, x) => {
					if (value !== 0) {
						matrix[y + player.pos.y][x + player.pos.x] = value;
					}
				});
			});
			events.emit('matrix', matrix);
		},

		sweep(/*arena, */player) {
			//Collects the game rows
			let rowCount = 1;

			outer:
			for (let y = /*arena.*/matrix.length - 1; y > 0; --y) { //Started from the bottom
				for (let x = 0; x < /*arena*/matrix[y].length; ++x) {
					//Check if any rows have a 0; meaning it's not fully populated
					if (/*arena*/matrix[y][x] === 0) {
						continue outer;	//Continue on next row
						//labels: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label
					}
				}

				//Perfect row. remove row from arena
				const row = /*arena*/matrix.splice(y, 1)[0].fill(0); //After remove, copy and zero fill
				/*arena*/matrix.unshift(row);	//Throw row ontop of arena 
				++y;			//Offset y position
				player.score += rowCount * 10;
				rowCount *= 2;		//For every row doublw score
				events.emit('matrix', matrix);

				if (dev) {
					console.log('Swept a row. Nice!');
				}
			}
		}

	};
}

function connectionManager(gameManager) {
	let connection = null;
	const peers = new Map;
	const localTetris = [...gameManager.instances][0];
	
	function initSession() {
		const sessionId = window.location.hash.split('#')[1];	//Everything after the hash
		if (sessionId) {
			sendMessage({
				type: 'join-session',
				id: sessionId
			})
		}
		else {
			sendMessage({
				type: 'create-session'
			});
			//connection.send('create-session');
		}
	}

	function receive(msg) {
		const data = JSON.parse(msg);

		if (data.type === 'session-created') {
			window.location.hash = data.id;
		}
		else if (data.type === 'session-broadcast') {
			updateManager(data.peers);
		}
		else if (data.type === 'state-update') {
			console.log('Received content: ', data);
			updatePeer(data.clientId, data.fragment, data.state);
		}
	}

	function sendMessage(data) {
		const msg = JSON.stringify(data);

		if (dev) {
			console.log(`Sending message ${msg}`);
		}
		connection.send(msg);
	}
	
	function updateManager(peersList) {
		const me = peersList.you;
		const clients = peersList.clients.filter(id => me !== id);

		clients.forEach(id => {
			if (!peers.has(id)) {
				//Adds new player to the game view
				const player = gameManager.createPlayer();
				peers.set(id, player);
			}
		});

		[...peers.entries()].forEach(([id, player]) => {
			if (clients.indexOf(id) === -1) {
				gameManager.removePlayer(player);  //Remove player from view
				peers.delete(id);	//Remove player from room
			}
		});
	}

	function updatePeer(id, fragment, [prop, value]) {
		if (!peers.has(id)) {
			console.error('Client does not exit', id);
			return;
		}
		const game = peers.get(id);

		game[fragment][prop] = value;

		if (prop === 'score') {
			game.updatePanel();
		}
		else {
			game.draw(game);
		}
	}

	function watchEvents() {
		const player = localTetris.player;
		const arena = localTetris.arena;

		['pos', 'matrix', 'score'].forEach(prop => {
			player.addListener(prop, value => {
				sendMessage({
					type: 'state-update',
					fragment: 'player',
					state: [prop, value]
				});
			});
		});

		['matrix'].forEach(prop => {
			arena.addListener(prop, value => {
				sendMessage({
					type: 'state-update',
					fragment: 'arena',
					state: [prop, value]
				});
			});
		});


	/*	player.addListener('pos', pos => {
			if (logEvents) {
				console.log('Player pos changed', pos);
			}
		});

		player.addListener('matrix', matrix => {
			if (logEvents) {
				console.log('Player matrix changed', matrix);
			}
		});*/

	}

	return {
		connect(address) {
			connection = new WebSocket(address);

			//Add connection listener
			connection.addEventListener('open', () => {
				if (dev) {
					console.log('Connection established');
				}
				initSession();
				watchEvents();
			});

			//Add message received listener
			connection.addEventListener('message', event => {
				if (dev) {
					console.log('Received message', event.data);
				}
				receive(event.data);
			});
		},		
		send(data) {
			sendMessage(data);
		}
	};
}

function createPiece(type) {
//3x3 or higher because you can't rotate with less
	if (type === 'T') {
		return [
			[0, 0, 0],
			[1, 1, 1],
			[0, 1, 0]
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
			[0, 3, 0],
			[0, 3, 0],
			[0, 3, 3]
		];

	}
	else if (type === 'J') {
		return [
			[0, 4, 0],
			[0, 4, 0],
			[4, 4, 0]
		];
	}
	else if (type === 'I') {
		return [
			[0, 5, 0, 0],
			[0, 5, 0, 0],
			[0, 5, 0, 0],
			[0, 5, 0, 0]
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

function Events() {
	const listeners = new Set;

	return {
		listen(name, callback) {
			if (logEvents) {
				console.log('Event triggered: ', name);
			}

			listeners.add({
				name,
				callback
			});
		},
		emit(name, ...data) {
			if (logEvents) {
				console.log('Emitting event: ', name);
			}

			listeners.forEach(listener => {
				if (listener.name === name) {
					listener.callback(...data);
				}
			});
		}
	};
}


function Game(element) {
	if (dev) {
		console.log('Starting game');
	}
	const canvas = element.querySelector('canvas');
	const context = canvas.getContext('2d');
	const arena = Arena(13, 20);
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
			context.fillStyle = '#000';
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			//Draws placed pieces to arena
			game.drawMatrix(arena.matrix, {x: 0, y: 0});
			game.drawMatrix(player.matrix, player.pos);
		},
		drawMatrix(matrix, offset) {
			matrix.forEach((row, y) => {
				row.forEach((value, x) => {
					if (value !== 0) {
						context.fillStyle = colours[value];
						context.fillRect(x + offset.x,
								 y + offset.y,
						 		 1, 1);
					}
				});
			});
		},
		run() {
			update();
		},
		updatePanel() {
			element.querySelector('.score').textContent = `Score: ${game.player.score}`;
			element.querySelector('.pieces').textContent = `Pieces: ${game.player.getPieceCount()}`;
		}
	};
	const player = Player(game);
	let lastTime = 0;

	function update(time = 0) {
	//We need to make this reusable
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
	
	player.addListener('score', score => {
		game.updatePanel();
	});
	
	return game;
}

function GameManager() {
	const instances = new Set; //Arrays are not optimal and may hold duplicates
	const template = document.getElementById('player-template');

	//Hardcoded player add functionality
	/*const playerElements = document.querySelectorAll('.player');
	[...playerElements].forEach(element => {
		const tetris = Game(element);

		instances.push(element);
	 });*/

	return {
		instances,
		createPlayer() {
			const element = document
					.importNode(template.content, true)
					.children[0];
			const tetris = Game(element);

			instances.add(tetris);
			document.body.appendChild(element);

			return tetris;
		},
		removePlayer(player) {
			this.instances.delete(player);
			document.body.removeChild(player.element);
		}
	};
}

function Player(game) {
	if (dev) {
		console.log('New player joined');
	}

	const pos = {x: 0, y: 0};
	const arena = game.arena;
	
	const events = Events(); 
	
	let pieceCount = 0;
	let dropCounter = 0;	

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
			pos.y++;
			dropCounter = 0;
			if (arena.collide(arena, player)) {
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
			while(!arena.collide(arena, player)) {
				pos.y++;
			}
			player.move(player, -1, 'y');
			player.drop(player);
		},

		getPieceCount() {
			return pieceCount;
		},

		move(player, dir, axis='x') {
			//Return true if no collision was detected otherwise false
			pos[axis] += dir;

			if (arena.collide(arena, player)) {
				pos[axis] -= dir;
				return false;
			}
			events.emit('pos', pos);
			return true;
		},

		reset(player) {
			const pieces = 'ILJOTSZ';

			//New piece should be provided by server
			player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
			pos.y = 0;
			pos.x = (arena.matrix[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0)
			pieceCount++;

			if (arena.collide(arena, player)) {
				//Game over
				arena.matrix.forEach(row => row.fill(0)); //Remove everything from the arena
				player.score = 0; //Maybe on new game
				pieceCount = 0; //Maybe on new game
				events.emit('score', player.score);
				//game.updatePanel();
			}
			events.emit('pos', pos);
			events.emit('matrix', player.matrix);
		},

		rotate(player, dir) {
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


		update(player, deltaTime) {
			dropCounter += deltaTime;

			if (dropCounter > player.dropInterval) {
				player.drop(player);
			}
		},
		

		verticalAlign(player, dir=-1, jump=false) {
			//Move to the side
			if (dev) {
				console.log('Aligning tetromino vertically');
			}
			let tileAvailable = player.move(player, dir);
			let lowerTileAvailable, aboveTileAvailable;

			if (tileAvailable) {
				//Check tiles above and below
				if (lowerTileAvailable = player.move(player, 1, 'y')) {
					/*if (jump) {
						//Above tile availble
						if (!player.move(player, -2, 'y'))
							return true;
						player.move(player, 1, 'y')
					}*/
					player.move(player, -1, 'y');
					player.move(player, dir * -1);
					return false;
				}
				else if (aboveTileAvailable = player.move(player, -1, 'y')) {
					/*if (jump && !lowerTileAvailable)
						return true;*/

					player.move(player, 1, 'y');
					player.move(player, dir * -1);
					return false;
				}
				return true;
			}
			return false;
		}
  
	};
}

//To quickly fill a row
//arena[19].fill(1)


//Test merge
//merge(arena, player);
//console.table.arena


//Main
const dev = false;
const logEvents = true;
const collisionStatus = false;
const gameManager = GameManager();
const localTetris = gameManager.createPlayer();

//Create socket connection
const connection = connectionManager(gameManager);
connection.connect('ws://localhost:9000');

let gameActive = false;


localTetris.element.classList.add('local');
localTetris.run();

 
//Run in console to manipulate tetromino
//localTetris.player.rotate(tetri[0].player, -1)


//Controller
const keyListener = (event) => {
	if (dev) {
		console.log(event);
	}
	const gameState = [...gameManager.instances];

	[
		//Player 1
		[
			32, //0 Space key	(Vertical fit) 
			37, //1 Left key	(Move left)
			38, //2 up key		(Rotate clockwise)
			39, //3 Right key 	(Move right)
			40, //4 Down key	(Go down)
			68, //5 D key		(Drop piece in pile)
			81, //6 Q key 		(Rotate anti-clockwise)
			87  //7 R key 		(Rotate clockwise)
		],
		//Player 2
		[
			104, //0 NUMPAD 8
			100, //1 NUMPAD 4
			105, //2 NUMPAD 9
			102, //3 NUMPAD 6
			101, //4 NUMPAD 5
			98,  //5 NUMPAD 2
			103, //6 NUMPAD 7
			null
		]
	].forEach((key, index) => {
		if (!gameState[index])
			return;

		/*if (index === 1 && gameManager.mode !== '2-player') {
		 	return;	//Check if mode is in 2 player
		 }*/

		const player = gameState[index].player;
		
		if (event.type === 'keydown') {
			switch(event.keyCode) {
				case key[0]:
					//Test left align then right align
					if (!player.verticalAlign(player, -1))
						if (!player.verticalAlign(player, 1))
							 if (!player.verticalAlign(player, -1, true))
								if (!player.verticalAlign(player, 1, true))
					break;
				case key[1]:
					player.move(player, -1); //Move left
					break;
				case key[2]:
				case key[7]:
					player.rotate(player, 1); //Rotate
					break;
				case key[3]:
					player.move(player, 1);	  //Move right
					break;
				case key[5]:
					player.dropPieceInPile(player);
					break;
				case key[6]:
					player.rotate(player, -1);	//Q
					break;
			}
		}

		if (event.keyCode === key[4]) {
			if (event.type === 'keydown') {
				if (player.dropInterval !== player.DROP_FAST) {
					player.drop(player);	//Move down
					player.dropInterval = player.DROP_FAST;
				}
			}
			else {
				player.dropInterval = player.DROP_SLOW;
			}
		}
	});
};

document.addEventListener('keydown', keyListener); 
document.addEventListener('keyup', keyListener); 
