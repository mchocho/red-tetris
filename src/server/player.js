require('dotenv').config({path: './.env'});

const isString 					= require('lodash.isstring');
const Game 						= require('./game');
const { createId, getSession } 	= require('./util');

const DEV = process.env.DEV || false;

class Player
{
	constructor(conn, id)
	{
		this.conn 		= conn;
		this.id 		= id;
		this.pieces 	= 0;
		this.score 		= 0;
		this.isPlaying 	= false;
		this.name 		= null;
		this.session 	= null;
		this.state 		= null;
	}

	broadcast(data)
	{
		if (!this.session)
			throw new Error('Can not broadcast without session');

		data.clientId = this.id;

		this.session.clients.forEach(client =>
		{
			if (this === client)
				return;
			client.send(data);
		});
	}

	createName(name, session)
	{
		if (DEV)
			console.log('Received name', name);
		
		if (isString(name))
			if (name.trim().length > 3)
				if (![...session.clients].some(client => client.name === name.trim()))
				{
					this.name = name.trim();
					return;
				}
		this.name = `user-${createId()}`;
	}

	createSession(id=createId(), sessions, data)
	{
		if (sessions.has(id))
			throw new Error(`Game ${id} already exists`);

		const session = new Game(id, this);
		
		if (DEV)
			console.log('Creating session', session);

		sessions.set(id, session);			//Add session to list
		this.createName(data.name, session);
		session.join(this);				//Add client to game room

		//Set initial state of client
		this.state = data.state;
		this.send({
			type: 'session-created',
			id: session.id,
			name: this.name,
			owner: this.id
		});

		session.broadcastSession();

		return session;
	}

	gameOver(sessions, data)
	{
		if (!sessions.has(data.id))
		{
			if (DEV)
				console.log('Game does not exist');
			return;
		}

		const session = getSession(sessions, data.id);

		this.isPlaying = false;
		session.broadcastSession();

		const playersLeft = [...session.clients].filter(client => client.isPlaying);
		let winner;

		if (playersLeft.length === 1)
		{
			playersLeft[0].isPlaying = false;
			winner = playersLeft[0];
		}
		else if (playersLeft.length === 0)
			winner = this;
		else
			return;		//The game is still running

		if (DEV)
			console.log(`${winner.name} is the winner.`);
		
		session.isRunning = false;
		session.pieceLayout = [];

		winner.send({ type: 'game-winner' });

		winner.broadcast({
			type: 'new-winner',
			name: winner.name
		});

		return;
	}

	joinSession(sessions, data)
	{
		if (!sessions.has(data.id))
		{
			//Game room hasn't been created
			this.createSession(data.id, sessions, data);
			return;
		}
		
		//Joining game room
		const session = getSession(sessions, data.id); 

		this.createName(data.name, session);
		session.join(this);	//You need to make sure the session is alive
		this.state = data.state;

		this.send({
			type	: 'session-join',
			id 		: session.id,
			name 	: this.name
		});

		session.broadcastSession();
	}

	send(data)
	{
		const msg = JSON.stringify(data);

		if (DEV)
			console.log(`Sending message ${msg}`);

		this.conn.send(msg, function ack(err)
		{
			if (err && DEV)
				console.error('Message failed. ', msg, err);
		});
	}

	startGame(sessions, data)
	{
		if (!sessions.has(data.id))
			throw new Error(`Game does not exist`);

		const session = getSession(sessions, data.id);
		session.broadcastSession();

		if (session.owner !== this.id)
		{
			this.send({
				type: 'multiplayer-error',
				message: 'Waiting for the room owner'
			});
			return;
		}

		if (session.isRunning)
		{
			if (DEV)
				console.log('Game is still being played');

			this.send({
				type: 'multiplayer-error',
				message: 'Game is still being played'
			});
			return;
		}

		const clients = [...session.clients];

		session.isRunning = true;
		session.addNewPiece();

		//Broadcast start gane messaage
		clients.forEach(client =>
		{
			client.isPlaying = true;
			client.send({ type: 'start-game' });
		});
	}
}

module.exports = Player;
