require('dotenv').config({path: './.env'});

const WebSocketServer = require('ws').Server;
const port = process.env.PORT || 9000;

const server = new WebSocketServer({port}, () => {
	console.log('Socket listening on port ', port);
});
const dev = process.env.DEV || false; 

const sessions = new Map();

class Session {
	constructor(id)
	{
		this.id = id;
		this.clients = new Set;
	}
	join(client)
	{
		//Connects client to a session
		if (client.session) {
			throw new Error('Client already in session');
		}
		this.clients.add(client);
		client.session = this;
	}
	leave(client)
	{
		//
		if (client.session !== this) {
			throw new Error('Client not in session');
		}
		this.clients.delete(client);
		client.session = null;
	}
}

class Client {
	constructor(conn) {
		this.conn = conn;	//Store the clients connection
		this.session = null;	//Session the client will live in
	}
}

function createId(len = 6, chars = 'abcdefghjkmnopqrstwxyz0123456789') {
	let id = '';
	while (len--) {
		id += chars[Math.random() * chars.length | 0];
	}
	return id;
} 

server.on('connection', conn => {
	if (dev) {
		console.log('Connection established');
	}
	const client = new Client(conn);


	conn.on('message', msg => {
		if (dev) {
			console.log('Message receieved', msg);
		}

		if (msg === 'create-session') {
			//A few problems with basics sessions
			const id = createId();	//Create unique id
			const session = new Session(id);
			session.join(client);
			sessions.set(session.id, session);
			if (dev) {
				console.log(sessions);
			}
		}
	});


	conn.on('close', () => {
		if (dev) {
			console.log('Connection closed');
		}
		//When a connection is closed we want to leave the session
		const session = client.session;

		if (session) {
			session.leave(client);

			if (session.clients.size === 0) {
				if (dev) {
					console.log('Deleting session.');
				}
				//No one is in this session, we can delete the session
				sessions.delete(session.id);
			}
		}
	});
});
