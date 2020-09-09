require('dotenv').config({path: './.env'});

const WebSocketServer = require('ws').Server;
const isString = require('lodash.isstring');
const Session = require('./session');
const Client = require('./client');

const PORT = process.env.PORT || 9000;
const QUE_LIMIT = 5;

const server = new WebSocketServer({port: PORT}, () => {
	console.log('Socket listening on port ', PORT);
});
const dev = process.env.DEV || false; 
const logSessions = process.env.SESSION || false;

const sessions = new Map();

function broadcastSession(session) {
	const clients = [...session.clients];

	clients.forEach(client => {
		client.send({
			type: 'session-broadcast',
			layout: session.pieceLayout,
			peers: {
				you: client.id,
				clients: clients.map(client => {
					return {
						id: client.id,
						name: client.name,
						owner: client.id === session.owner,
						playing: client.isPlaying,
						score: client.score,
						state: client.state,
					};
				}),
			}
		});
	});
}
 
function createClient(conn, id=createId()) {
	return new Client(conn, id);
}

function createId(len=6, chars='abcdefghjkmnopqrstwxyz0123456789') {
	let id = '';
	while (len--) {
		id += chars[Math.random() * chars.length | 0];
	}
	return id;
}

function createName(name, session) {
	if (isString(name))
		if (name.trim().length > 3)
			if (![...session.clients].some(client => client.name === name.trim()))
				return name;
	return `user-${createId()}`;
}

function createSession(id=createId(), client, data) {
	if (sessions.has(id)) {
		throw new Error(`Session ${id} already exists`);
	}

	const session = new Session(id, client);
	if (dev) {
		console.log('Creating session', session);
	}
	sessions.set(id, session);			//Add session to list
	client.name = createName(data.name, session);
	session.join(client);				//Add client to game room

	//Set initial state of client
	client.state = data.state;
	client.send({
		type: 'session-created',
		id: session.id,
		name: client.name,
		owner: client.id
	});	//Send the room id and owner	


	broadcastSession(session);

	return session;
}

function gameOver(data, client) {
	if (!sessions.has(data.id)) {
		if (dev) {
			console.log('Session does not exist');
		}
		return;
	}
	const session = getSession(data.id);

	client.isPlaying = false;
	broadcastSession(session);

	const playersLeft = [...session.clients].filter(client => client.isPlaying);
	let winner;

	if (playersLeft.length === 1) {
		playersLeft[0].isPlaying = false;
		winner = playersLeft[0];
	}
	else if (playersLeft.length === 0) {
		winner = client;
	}
	else {
		return;		//The game is still on
	}

	if (dev) console.log(`${winner.name} is the winner.`);
	session.isRunning = false;
	session.pieceLayout = [];

	winner.send({ type: 'game-winner' });

	winner.broadcast({
		type: 'new-winner',
		name: winner.name
	});

	return;
	

	//clients.broadcastSession(session, false, true);	//Game over property 
}

function getSession(id) {
	return sessions.get(id);
}

function joinSession(data, client, data) {
	if (!sessions.has(data.id)) {
		//Game room hasn't been created
		createSession(data.id, client, data);
		return;
	}
	
	//Joining game room
	const session = getSession(data.id); 

	client.name = createName(data.name, session);
	session.join(client);	//You need to make sure the session is alive
	client.state = data.state;

	client.send({
		type: 'session-join',
		id: session.id,
		name: client.name
	});

	/*client.broadcast({
		type: 'new-player',
		name: client.name
	});*/
	broadcastSession(session);
}

function nextPiece(res, client) {
	if (!client.isPlaying || !isString(client.session)) {
		res(null);
		return;
	}
	else if (!sessions.has(client.session)) {
		res(null);
		return;
	}

	const pieces = "IJLOSTZ";
	const session = sessions.get(client.session);

	client.pieces += 1;

	if (isString(session.pieceLayout[client.pieces - 1])) {
		res({
			value: session.pieceLayout[client.pieces - 1],
			count: client.pieces
		});
		return;
	}
	res({
		value: session.addNewPiece(),
		count: client.pieces
	});
}

function startGame(data, client) {
	if (!sessions.has(data.id)) {
		throw new Error(`Session does not exist`);
	}

	const session = getSession(data.id);
	const clients = [...session.clients];

	broadcastSession(session);

	//DEV	
	/*console.log('Session: ', session)
	console.log('Client: ', client);
	console.log('Compared ids: ', session.owner, client.id);
	*///ENDOF DEV
	if (session.owner !== client.id) {
		client.send({
			type: 'multiplayer-error',
			message: 'Waiting for the room owner'
		});
		return;
	}

	if (session.isRunning) {
		if (dev) {
			console.log('Game is still being played');
		}
		return;
	}

	session.isRunning = true;
	session.addNewPiece();
	clients.forEach(client => {
		client.isPlaying = true;
		client.send({ type: 'start-game' });
	});
}

server.on('connection', conn => {
	if (dev) {
		console.log('Connection established');
	}
	const client = createClient(conn, createId());

	conn.on('message', (msg) => {
		if (dev) {
			console.log('Message receieved', msg);
		}
		const data = JSON.parse(msg);

		if (data.type === 'create-session') {
			createSession(createId(), client, data);
		}
		else if (data.type === 'join-session') {
			joinSession(data, client, data);
		}
		else if (data.type === 'start-game') {
			startGame(data, client);
		}
		else if (data.type === 'game-over') {
			gameOver(data, client);
		}
		else if (data.type === 'new-piece') {
			client.pieces++;
		}
		else if (data.type === 'state-update') {
			const [prop, value] = data.state;
	
			if (prop === 'sweep') {
				if (dev)
					console.log('Punish other players');
				client.broadcast({ type: 'penalty' });
				return;
			}

			//Update state of peer view
			client.state[data.fragment][prop] = value;
			client.broadcast(data);	
			
		}

		if (sessions.has(client.session.id)) {
			const session = getSession(client.session.id);
				
			//Add new pieces if client reaches end of que in 5 drop
			while ([...session.clients].some(client => client.pieces >= session.pieceLayout.length - 5)) {
				if (dev)
					console.log('Adding new piece');
				session.addNewPiece();
			}
			broadcastSession(session);
		}
	});


	conn.on('close', () => {
		if (dev) {
			console.log(`${client.name} left the game`);
			//console.log('Connection closed');
		}
		//When a connection is closed we want to leave the session
		const session = client.session;

		if (session) {
			session.leave(client);
			broadcastSession(session);

			const playersActive = [...session.clients].filter(client => client.isPlaying); 

			if (session.clients.size === 0) {
				if (dev) {
					console.log('Deleting session.');
				}
				//No one is in this session, we can delete the session
				sessions.delete(session.id);
				return;
			}
			else if (playersActive.length === 1) {
				//There's only 1 player left in the current game announce them as winner
				const player = playersActive[0];

				session.isRunning = false;
				player.send({ type: 'game-winner' });
			}

			if (session.owner === client.id) {
				//The client who left is in charge of the session
				session.getNewOwner(session);
			}
		}
	});
});
