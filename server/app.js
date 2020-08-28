require('dotenv').config({path: './.env'});

const WebSocketServer = require('ws').Server;
const isString = require('lodash.isstring');
const Session = require('./session');
const Client = require('./client');

const PORT = process.env.PORT || 9000;

const server = new WebSocketServer({port: PORT}, () => {
	console.log('Socket listening on port ', PORT);
});
const dev = process.env.DEV || false; 
const logSessions = process.env.SESSION || false;

const sessions = new Map();

function createId(len=6, chars='abcdefghjkmnopqrstwxyz0123456789') {
	let id = '';
	while (len--) {
		id += chars[Math.random() * chars.length | 0];
	}
	return id;
} 

function createClient(conn, id=createId(), name) {
	return new Client(conn, id);
}

function createSession(id=createId()) {
	if (sessions.has(id)) {
		throw new Error(`Session ${id} already exists`);
	}

	const session = new Session(id);
	if (dev) {
		console.log('Creating session', session);
	}
	sessions.set(id, session);

	return session;
}

function createUsername(name) {
	if (isString(name)) {
		if (name.trim() > 3) {
			return name;
		}
	}
	return `user-${createId()}`;
}

function getSession(id) {
	return sessions.get(id);
}

function broadcastSession(session) {
	const clients = [...session.clients];

	clients.forEach(client => {
		client.send({
			type: 'session-broadcast',
			peers: {
				you: client.id,
				clients: clients.map(client => {
					return {
						id: client.id,
						name: client.name,
						score: client.score,
						state: client.state
					};
				}),
			}
		});
	});
}

server.on('connection', conn => {
	if (dev) {
		console.log('Connection established');
	}
	const client = createClient(conn, createId);


	conn.on('message', msg => {
		if (dev) {
			console.log('Message receieved', msg);
		}
		const data = JSON.parse(msg);

		if (data.type === 'create-session') {
			const session = createSession(createId(), client.id);

			client.name = createName(data.name);
			session.join(client);

			//Set initial state of client
			client.state = data.state;
			//sessions.set(session.id, session);
			client.send({
				type: 'session-created',
				id: session.id
			});	//Send the room id	
		}
		else if (data.type === 'join-session') {
			const session = getSession(data.id) || createSession(data.id, client.id);
			
			client.name = createName(data.name);
			session.join(client);	//You need to make sure the session is alive

			client.state = data.state;
			broadcastSession(session);
		}
		else if (data.type === 'start-game') {
			if (!sessions.has(data.id)) {
				throw new Error(`Session does not exist`);
			}
			const session = getSession(data.id);
			const clients = [...session.clients];

			if (session.owner !== client.id) {
				client.send({
					type: 'multiplayer-error',
					message: `Waiting for the room owner`
				});
				return;

			if (session.size() <= 1) {
				return;

			clients.forEach(client => {
				client.send({
					type: 'start_game',
				});
			});
		}
		else if (data.type === 'state-update') {
			const [prop, value] = data.state;

			//Update state of peer view
			client.state[data.fragment][prop] = value;
			client.broadcast(data);
		}
	/*	if (logSessions) {
			console.log('Sessions ', sessions);
		}*/
	});


	conn.on('close', () => {
		if (dev) {
			console.log('Connection closed');
		}
		//When a connection is closed we want to leave the session
		const session = client.session;

		if (session) {
			session.leave(client);
			broadcastSession(session);

			if (session.clients.size === 0) {
				if (dev) {
					console.log('Deleting session.');
				}
				//No one is in this session, we can delete the session
				sessions.delete(session.id);
			}
			else if (session.owner === client.id) {
				//The client who left is in charge of the session
				session.getNewOwner();
			}
		}
	});
});
