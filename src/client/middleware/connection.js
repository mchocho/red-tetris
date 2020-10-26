const dev = false;

export default (gameManager) => {
	const 	peers 			= new Map();
	const 	localPlayer 	= gameManager.startNewGame(gameManager);
	let 	connection 		= null;

	let 	layout 			= [];
	let 	id 				= null;
	let 	activePlayers 	= 0;
	let 	totalPlayers 	= 1;

	function getHash()
	{
		const hash = window.location.hash.split('#')[1];

		if (!hash)
			return null;

		if (hash.length === 0)
			return null;

		return hash;
	}

	function getSessionId()
	{
		const 	hash = getHash();
		let 	guard;

		if (!hash)
			return null;

		if ((guard = hash.indexOf('[') === -1) || hash.indexOf(']') <= guard)
			return hash;

		return hash.slice(0, hash.indexOf('[')); 
	}

	function getUsername()
	{
		const 	hash = getHash();
		let 	guard;

		if (!hash)
			return null;

		if (hash.length === 0)
			return null;

		if ((guard = hash.indexOf('[')) === -1 || hash.indexOf(']') <= guard)
			return null;

		return hash.slice(hash.indexOf('[') + 1, hash.indexOf(']'));
	}
	
	function initSession()
	{
		const sessionId = getSessionId();
		const name 		= getUsername();
		const state 	= localPlayer.serialize(localPlayer);

		if (sessionId)
		{
			sendMessage({
				type: 'join-session',
				id: sessionId,
				name,
				state
			})
		}
		else
		{
			sendMessage({
				type: 'create-session',
				name,
				state
			});
		}
	}

	function receive(msg)
	{
		const data = JSON.parse(msg);
		const menu = document.querySelector('#start-game');

		if (data.type === 'session-created' || data.type === 'session-join')
		{
			const name 		= data.name;
			const cmdNode 	= menu.querySelector('.cmd');
			const urlNode 	= menu.querySelector('.url');
			const nameNode 	= menu.querySelector('.you')

			id = data.id;
			localPlayer.player.setName(name);
			
			if (data.type === 'session-created')
			{
				window.location.hash = `${id}[${name}]`;
				cmdNode.textContent = 'Press Enter to start';
			}
			
			gameManager.openMenu('multiplayer');
			urlNode.textContent = `${window.location.origin}/#${id}`;
			nameNode.textContent = name;
		}
		else if (data.type === 'session-broadcast')
		{
			if (data.id)
				id = data.id;

			layout = data.layout;
			updateManager(data.peers);
		}
		else if (data.type === 'game-winner')
		{
			if (!gameManager.isRunning())
				return;

			gameManager.gameOver(false);
			gameManager.openMenu('winner');
			gameManager.state = 'winner';
		}
		else if (data.type === 'state-update')
		{
			updatePeer(data.clientId, data.fragment, data.state);
		}
		else if (data.type === 'penalty')
		{
			localPlayer.penalty(localPlayer);
		}
		else if (data.type === 'owner-permissions')
		{
			menu.querySelector('.cmd').textContent = 'Press Enter to start';
		}
		else if (data.type === 'start-game')
		{
			gameManager.startNewGameLAN(gameManager);
		}
	}

	function sendMessage(data)
	{
		if (!connection)
			return;

		const msg = JSON.stringify(data);

		if (dev)
			console.log(`Sending message ${msg}`);

		connection.send(msg);
	}

	function updateManager(peersList)
	{
		const me 			= peersList.you;
		const clients 		= peersList.clients.filter(client => me !== client.id);	//Remove local player from list
		const hidePeers 	= (!gameManager.showPeers);
		const playerList 	= document.querySelector('.alt-players');

		playerList.innerHTML = '';
		clients.forEach(client =>
		{
			//Add name to player list
			const content = `<li>
				${client.name}
				${client.playing ? ' <i class="nes-jp-logo"></i>' : ''}
			</li>`;

			playerList.innerHTML += content;

			if (!peers.has(client.id))
			{
				//Adds new player to the game view
				const player = gameManager.createPlayer(gameManager, hidePeers);

				if (dev)
					console.log(`${client.name} joined the game`);

				player.player.setName(client.name);
				player.unserialize(client.state)
				peers.set(client.id, player);
			}
		});

		[...peers.entries()].forEach(([id, player]) =>
		{
			//Client id is not in payload
			if (!clients.some(client => client.id === id))
			{ 
				gameManager.removePlayer(player);
				peers.delete(id);	//Remove player from room
			}
		});

		totalPlayers = clients.length + 1;
		activePlayers = clients.filter(client => client.playing).length + 1;
	}

	function updatePeer(id, fragment, [prop, value])
	{
		if (!peers.has(id))
		{
			console.error('Client does not exit', id);
			return;
		}
		const game = peers.get(id);

		game[fragment][prop] = value;

		if (prop === 'score')
		{
			game.player.setScore(value);
			game.updatePanel();
		}
		else if (prop === 'pos')
		{
			game.player.newPosition(value);
			// game.player.x = value.x;
			// game.player.y = value.y;
			game.draw(game);
		}
		else if (prop === 'matrix')
		{
			game.arena.setMatrix(value);
			game.draw(game);
		}
	}

	function watchEvents()
	{
		const player 	= localPlayer.player;
		const arena 	= localPlayer.arena;

		['pos', 'matrix', 'score'].forEach(prop =>
		{
			player.addListener(prop, value =>
			{
				sendMessage({
					type: 'state-update',
					fragment: 'player',
					state: [prop, value]
				});
			});
		});

		['matrix', 'sweep'].forEach(prop =>
		{
			arena.addListener(prop, value =>
			{
				sendMessage({
					type: 'state-update',
					fragment: 'arena',
					state: [prop, value]
				});
			});
		});
	}

	return {
		activePlayers()
		{
			return activePlayers;
		},
		close()
		{
			if (connection !== null)
				connection.close();
			connection = null;
		},
		connect(address)
		{
			connection = new WebSocket(address);

			//Add connection listener
			connection.addEventListener('open', () =>
			{
				if (dev)
					console.log('Connection established');

				initSession();
				watchEvents();
			});

			//Add message received listener
			connection.addEventListener('message', event =>
			{
				if (dev)
					console.log('Received message', event.data);

				receive(event.data);
			});

			connection.addEventListener('error', event =>
			{
				connection = null;
				gameManager.state = null;
				gameManager.gameOver(false);
				gameManager.openMenu('error');
			});
		},
		getSessionLayout()
		{
			return [].concat(layout);
		},
		getSessionId()
		{
			return id;
		},
		isConnected()
		{
			return connection !== null;
		},
		send(data)
		{
			sendMessage(data);
		},
		totalPlayers()
		{
			return totalPlayers;
		}
	};
}