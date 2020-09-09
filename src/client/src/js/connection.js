const dev = window.DEV;

export default (gameManager) => {
	const peers = new Map();
	const localPlayer = gameManager.startNewGame(gameManager);
	let connection = null;
	let id = null;
	let layout = [];

	function getSessionId() {
		const hash = window.location.hash.split('#')[1];

		if (!hash)
			return null;

		if (hash.length === 0)
			return null;

		if (hash.indexOf('[') === -1 || hash.indexOf(']') === -1)
			return hash;

		return hash.slice(0, hash.indexOf('[')); 
	}

	function getUsername() {
		const hash = window.location.hash.split('#')[1];	//Everything after the hash

		if (!hash)
			return null;

		if (hash.length === 0)
			return null;

		if (hash.indexOf('[') === -1 || hash.indexOf(']') === -1)
			return null;

		return hash.slice(hash.indexOf('[') + 1, hash.indexOf(']'));
	}
	
	function initSession() {
		const sessionId = getSessionId();
		const name = getUsername();
		const state = localPlayer.serialize(localPlayer);

		if (sessionId) {
			sendMessage({
				type: 'join-session',
				id: sessionId,
				name,
				state
			})
		}
		else {
			sendMessage({
				type: 'create-session',
				name,
				state
			});
			//connection.send('create-session');
		}
	}

	function receive(msg) {
		//DEV: Testing url game id and player name hash-based url type
		//http://<server_name_or_ip>:<port>/#<room>[<player_name>]
		// return;

		const data = JSON.parse(msg);
		const menu = document.querySelector('#start-game');

		if (data.type === 'session-created' || data.type === 'session-join') {
			if (data.type === 'session-created') {
				window.location.hash = `${data.id}[${data.name}]`;
				menu.querySelector('.cmd').textContent = 'Press Enter to start';
			}
			id = data.id;
			gameManager.openMenu('multiplayer');
			menu.querySelector('.url').textContent = `${window.location.origin}/#${data.id}`;
			menu.querySelector('.you').textContent = data.name;
		}
		else if (data.type === 'start-game' ) {
			//updatePeerList(data.clientId, data.state);
			gameManager.startNewGameLAN(gameManager);
		}
		else if (data.type === 'session-broadcast') {
			if (data.id) {
				id = data.id;
			}
			updateManager(data.peers);
			layout = data.layout;
		}
		else if (data.type === 'penalty') {
			console.log('Meet the punisher');
			localPlayer.penalty(localPlayer);
		}
		else if (data.type === 'state-update') {
			if (dev) console.log('Received content: ', data);
			updatePeer(data.clientId, data.fragment, data.state);
		}
		else if (data.type === 'game-winner') {
			if (!gameManager.isRunning())
				return;

			gameManager.gameOver(false);
			gameManager.openMenu('winner');
			gameManager.state = 'winner';
		}
		else if (data.type === 'owner-permissions') {
			menu.querySelector('.cmd').textContent = 'Press Enter to start';
		}
	}

	function sendMessage(data) {
		if (!connection)
			return;

		const msg = JSON.stringify(data);

		if (dev) {
			console.log(`Sending message ${msg}`);
		}
		connection.send(msg);
	}


	
	function updateManager(peersList) {
		const me = peersList.you;
		const clients = peersList.clients.filter(client => me !== client.id);	//Remove local player from list
		const hidePeers = (!gameManager.showPeers);
		const playerList = document.querySelector('.alt-players');

		playerList.innerHTML = '';
		clients.forEach(client => {
			//Add name to player list
			playerList.innerHTML += `<li>
							${client.name}
							${client.playing ? ' <i class="nes-jp-logo"></i>' : ''}
						</li>`;

			if (!peers.has(client.id)) {
				//Adds new player to the game view
				const player = gameManager.createPlayer(gameManager, hidePeers);

				player.unserialize(client.state)
				peers.set(client.id, player);

				console.log('YOU SHOULD ADD NEW PEER');
				console.log('Peer list: ', peers);

			}

			

			//You should update scores here
			//Handle player list render

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
		const player = localPlayer.player;
		const arena = localPlayer.arena;

		['pos', 'matrix', 'score'].forEach(prop => {
			player.addListener(prop, value => {
				sendMessage({
					type: 'state-update',
					fragment: 'player',
					state: [prop, value]
				});
			});
		});

		['matrix', 'sweep'].forEach(prop => {
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
		close() {
			if (connection !== null) {
				connection.close();
			}
			connection = null;
		},
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

			connection.addEventListener('error', event => {
				connection = null;
				gameManager.state = null;
				gameManager.gameOver(false);
				gameManager.openMenu('error');
				//gameManager.removeAllPlayers();
			});
		},
		getSessionLayout() {
			return [].concat(layout);
		},
		getSessionId() {
			return id;
		},
		isConnected() {
			return connection !== null;
		},
		send(data) {
			sendMessage(data);
		},
		sendAndAck(data) {
			return new Promise((resolve, reject) => {
				if (!connection) {
					reject(null);
					return;
				}

				const msg = JSON.stringify(data);

				connection.send(msg, function(result) {
					console.log('hello result: ', result);
					resolve(result);
				});
			})
		}
	};
}