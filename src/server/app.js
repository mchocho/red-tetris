require('dotenv').config({path: './.env'});

const WebSocketServer 			= require('ws').Server;
const isString 					= require('lodash.isstring');
const Game 						= require('./game');
const Player 					= require('./player');
const { createId, getSession } 	= require('./util');

const QUE_LIMIT 				= 5;
const PORT 						= process.env.PORT || 9000;
const DEV 						= process.env.DEV || false; 
const LOG_SESSIONS 				= process.env.SESSION || false;
const sessions 					= new Map();

const io 						= new WebSocketServer({port: PORT}, () =>
{
	console.log('Socket listening on port', PORT);
});

io.on('connection', conn =>
{
	if (DEV)
		console.log('Connection established');

	const client =  new Player(conn, createId());

	conn.on('message', msg =>
	{
		if (DEV)
			console.log('Message receieved', msg);
		
		const data = JSON.parse(msg);

		if (data.type === 'create-session')
			client.createSession(createId(), sessions, data);
		else if (data.type === 'join-session')
			client.joinSession(sessions, data);
		else if (data.type === 'start-game')
			client.startGame(sessions, data);
		else if (data.type === 'game-over')
			client.gameOver(sessions, data);
		else if (data.type === 'new-piece')
			client.pieces++;
		else if (data.type === 'state-update')
		{
			const [prop, value] = data.state;
	
			if (prop === 'sweep')
			{
				client.broadcast({ type: 'penalty' });
				return;
			}

			//Update state of peer view
			client.state[data.fragment][prop] = value;
			client.broadcast(data);
		}

		if (sessions.has(client.session.id))
		{
			const session = getSession(sessions, client.session.id);
				
			//Add new pieces if client reaches end of que in 5 drop
			while ([...session.clients].some(client => client.pieces >= session.pieceLayout.length - QUE_LIMIT))
				session.addNewPiece();

			session.broadcastSession();
		}
	});


	conn.on('close', () =>
	{
		if (DEV)
			console.log(`${client.name} left the game`);

		//When a connection is closed we want to leave the session
		const session = client.session;

		if (session)
		{
			session.leave(client);
			session.broadcastSession();

			const playersActive = [...session.clients].filter(client => client.isPlaying); 

			if (session.clients.size === 0)
			{
				if (DEV)
					console.log('Deleting session.');

				//No one is in this session, we can delete the session
				sessions.delete(session.id);
				return;
			}
			else if (playersActive.length === 1)
			{
				//There's only 1 player left in the current game announce them as winner
				const player = playersActive[0];

				session.isRunning = false;
				player.send({ type: 'game-winner' });
			}

			if (session.owner === client.id)
				session.getNewOwner(session);
		}
	});
});
