require('dotenv').config({path: './.env'});

const piece = new (require('./piece'))();
const DEV 	= process.env.DEV || false;

class Game {
	constructor(id, client)
	{
		this.id 			= id;
		this.clients 		= new Set();
		this.owner 			= client.id;
		this.pieceLayout 	= [];
		this.isRunning 		= false;
	}

	addNewPiece() {
		//Adds new random piece to tetrmonio list
		return piece.addNewPiece(this.pieceLayout);
	}

	broadcastSession() {
		const clients = [...this.clients];

		clients.forEach(client => {
			client.send({
				type: 'session-broadcast',
				layout: this.pieceLayout,
				peers: {
					you: client.id,
					clients: clients.map(client => {
						return {
							id: client.id,
							name: client.name,
							owner: client.id === this.owner,
							playing: client.isPlaying,
							score: client.score,
							state: client.state
						};
					}),
				}
			});
		});
	}

	getNewOwner() {
		const clients = [...this.clients];

		if (clients.some(client => client.id !== this.owner)) {
			const client = clients[0];

			this.owner = client.id;

			if (DEV) {
				console.log('New game room owner is ', client.name);
			}

			client.send({type: 'owner-permissions'});

			client.broadcast({
				type: 'new-owner',
				id: client.id
			});
		}
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
		//Removes client from session
		if (client.session !== this) {
			throw new Error('Client not in session');
		}
		this.clients.delete(client);
		client.session = null;
	}

	
	
}

module.exports = Game;
