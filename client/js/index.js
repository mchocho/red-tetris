document.addEventListener('DOMContentLoaded', (event) => {
const AUDIO = new Audio('assets/sound.mp3');


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

		setMatrix(value) {
			if (!value) return;
			if (!value.every(row => row.every(el => !isNaN(el)))) return

		//	matrix = value;
			value.forEach((row, index) => {
				matrix[index] = value[index];
			});
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
		const state = localTetris.serialize(localTetris);
		if (sessionId) {
			sendMessage({
				type: 'join-session',
				id: sessionId,
				state
			})
		}
		else {
			sendMessage({
				type: 'create-session',
				state
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
		const clients = peersList.clients.filter(client => me !== client.id);

		clients.forEach(client => {
			if (!peers.has(client.id)) {
				//Adds new player to the game view
				const player = gameManager.createPlayer();

				player.unserialize(client.state)
				peers.set(client.id, player);
			}
		});

		[...peers.entries()].forEach(([id, player]) => {
			//Client id is not in payload
			if (!clients.some(client => client.id === id)) { 
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
		else if (prop === 'pos') {
			//game.player.newPosition(value);
			game.player.x = value.x;
			game.player.y = value.y;
			game.draw(game);
		}
		else if (prop === 'matrix') {
			//console.log('YOU SHOULD BE DRAWING!');
			game.arena.setMatrix(value);
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


function Game(element, gameManager) {
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
						context.fillStyle = useColours ? colours[value] : 'red';
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
	let player = Player(game, gameManager);
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

function GameManager() {
	const instances = new Set; //Arrays are not optimal and may hold duplicates
	const template = document.getElementById('player-template');

	//connection = connectionManager(gameManager);
	let mode = null;
	let paused = true;
	let isRunning = false;
	let gameOver = true;

	//Hardcoded player add functionality
	/*const playerElements = document.querySelectorAll('.player');
	[...playerElements].forEach(element => {
		const tetris = Game(element);

		instances.push(element);
	 });*/

	function closeMenus() {
		const el = document.querySelectorAll('.modal');

		for (let i = 0; i < el.length; i++) {
			el[i].classList.remove('show');
		}
	} 

	function createPlayer(gameManager, isLocal=false) {
		const element = document
				.importNode(template.content, true)
				.children[0];
		const tetris = Game(element, gameManager);
		
		tetris.isLocal = (isLocal === true);
		instances.add(tetris);
		document.body.appendChild(element); //Append to a div or something

		return tetris;
	}	

	function openMenu(value) {
		closeMenus();
		let el;

		switch(value) {
			case 'settings':
			case 'game-over':
			case 'multiplayer':
				el = document.querySelector('.modal.' + value);
				break;
			default:
				el = document.querySelector('.modal.main');
		}
		if (el) {
			el.classList.add('show');
			el.querySelector('form').focus();
		}
	}	

	function removePlayer(player) {
		instances.delete(player);
		document.body.removeChild(player.element);
	}

	return {
		instances,
		state: null,
		isGameOver() {
			return gameOver === true;
		},
				openMenu(value='main') {
			openMenu(value);
		},
		gameOver() {
			gameOver = true;
		},
		isPaused() {
			return paused === true;
		},
		isRunning() {
			return isRunning === true;
		},
		getMode() {
			return mode;
		},
		removePlayer(player) {
			removePlayer(player);
		},
		setMode(value) {
			const modes = ['1-player', '2-player', 'multiplayer'];

			if (modes.indexOf(value) > -1)
				mode = value;
			else mode = '1-player';
		},
		startNewGame(gameManager) {
			isRunning = true;
			paused = false;
			gameOver = false;

			if (instances.size > 0) {
				[...instances].forEach((player) => {
					removePlayer(player);
				});
			}

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
					//game.Manager.start
					//connection.connect('ws://localhost:9000');
					break;
				default:
					localPlayer.run();
					return;
			}
		}

	};
}

function Player(game, gameManager) {
	if (dev) {
		console.log('New player joined');
	}

	const pos = {x: 0, y: 0};
	const arena = game.arena;
	const events = Events(); 
	
	let gameOver = false;
	let dropCounter = 0;	
	let pieceCount = 0;


	function onGameOver(player) {
		gameOver = true;
		
		if (game.isLocal || gameManager.getMode() === '2-player') {
			gameManager.openMenu('game-over');
		}
		gameManager.state = 'game-over';
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

			pos.y++;
			dropCounter = 0;
			if (arena.collide(arena, player)) {
				AUDIO.play();
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

		getPieceCount() {
			return pieceCount;
		},

		move(player, dir, axis='x') {
			if (gameOver) return;

			//Return true if no collision was detected otherwise false
			pos[axis] += dir;

			if (arena.collide(arena, player)) {
				pos[axis] -= dir;
				return false;
			}
			events.emit('pos', pos);
			return true;
		},

		newGame(player) {
			gameOver = true;
			arena.matrix.forEach(row => row.fill(0)); //Clean the arena
			player.score = 0;
			pieceCount = 0;
		},

		newPosition(value) {
			if (gameOver) return;
			if (!value) return;
			if (isNaN(value.x) || isNaN(value.y)) return;

			pos.x = value.x;
			pos.y = value.y;
		},

		reset(player) {
			if (gameOver) return;
			
			const pieces = 'ILJOTSZ';

			//New piece should be provided by server
			player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
			pos.y = 0;
			pos.x = (arena.matrix[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0)
			pieceCount++;

			if (arena.collide(arena, player)) {
				//Game over
				onGameOver(player);
				events.emit('game-over', {
					score: player.score
				});
			}
			events.emit('pos', pos);
			events.emit('matrix', player.matrix);
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


		update(player, deltaTime) {
			if (gameOver) return;

			dropCounter += deltaTime;

			if (dropCounter > player.dropInterval) {
				player.drop(player);
			}
		},
		

		verticalAlign(player, dir=-1, jump=false) {
			if (gameOver) return;

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

function menuOptions(gameManager) {
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
			//
			break;
		case 'game-over':
			element = document.querySelector('#game-over input:checked');

			if (!element)
				return;

			let value = element.value.toLowerCase();

			if (value === 'yes') {
				gameManager.startNewGame(gameManager);
			} else {
				gameManager.openMenu('.main');
				gameManager.state = null;
			}

			break;
		default: {
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
					gameManager.setMode(value);
					gameManager.initSession();
					break;
				case 'settings':
					//gameManager.setMode(value);
					gameManager.state = 'settings';
					gameManager.openMenu(value);
					break;
				default:
					return;
			}
		}
	}

	//console.log('Checked element: ', element.value);
}

//To quickly fill a row
//arena[19].fill(1)


//Test merge
//merge(arena, player);
//console.table.arena


//Main
const dev = true;
const logEvents = true;
const collisionStatus = false;
//let gameState = false;
const gameManager = GameManager();
//let gameManager;
//const localPlayer = gameManager.createPlayer();

//Create socket connection
/*const connection = connectionManager(gameManager);
connection.connect('ws://localhost:9000');

let gameActive = false;


localPlayer.element.classList.add('local');
localPlayer.run();
*/
 
//Run in console to manipulate tetromino
//localPlayer.player.rotate(tetri[0].player, -1)


//Controller
const keyListener = (event) => {
	/*if (dev) {
		console.log(event);
	}*/
	if (!gameManager.isActive && event.type === 'keydown') {
		switch(event.keyCode) {
			case 8:		//Backspace
			case 27:	//Escape
				gameManager.openMenu('.main');
				break;
			case 13:	//Enter
			case 32:	//Space
				menuOptions(gameManager);
				break;
		}
		/*if (event.keyCode === 8 || event.keyCode === 27) {
			gameManager.openMenu('.main');
			return;
		}

		if (event.keyCode === 13 || event.keyCode === 32) {
			//Enter or space key pressed
		}*/

	}


	const games = [...gameManager.instances];

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
			87, //7 R key 		(Rotate clockwise)
			80  //8 P key		(Pause)
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
		if (!games[index])
			return;

		if (index === 1 && gameManager.getMode() !== '2-player')
		 	return;	//Check if mode is in 2 player

		if (index > 1)
			return;

		const player = games[index].player;
		
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
				case key[8]:
					if (player.isPaused())
						player.resume();
					else
						player.pause();
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

const formListener = (event) => {
	const el = event.target;

	if (!el) return;

	const tagName = el.tagName.toLowerCase();

	if (tagName === 'form') {
		el.focus();
	}
	if (tagName === 'input' && el.type === 'radio') {
		el.checked = true;
	}
	if (tagName === 'label' && el.firstElementChild) {
		const firstChild = el.firstElementChild;

		if (firstChild.tagName.toLowerCase() === 'input' && firstChild.type === 'radio')
			firstChild.focus();
	}
}

const formSubmit = (event) => {
	event.preventDefault();


	if (!gameManager.isActive) {
		//Enter or space key pressed
		menuOptions(gameManager);

	}


	//console.log("Triggered by: ", event.target.id);
};

const settingsListener = (event) => {
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
};


document.addEventListener('keydown', keyListener); 
document.addEventListener('keyup', keyListener); 
document.addEventListener('mouseover', formListener);
document.addEventListener('submit', formSubmit);
document.addEventListener('change', settingsListener);

});
