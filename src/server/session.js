class Session {
        constructor(id, client)
        {
                this.id = id;
                this.clients = new Set;
		this.isRunning = false;
		this.owner = client.id;
		this.pieceLayout = [];
        }
	addNewPiece() {
		//Adds new random piece to tetrmonio list
		const pieces = 'ILJOTSZ';
		const index = pieces.length * Math.random() | 0;

		this.pieceLayout.push(pieces[index]);
		return pieces[index];
	}
	getNewOwner() {
		const clients = [...this.clients];

		if (clients.some(client => client.id !== this.owner)) {
			const client = clients[0];

			this.owner = client.id;


			//DEV
			console.log('New game room owner is ', client.name);
			//ENDOF DEV


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

module.exports = Session;
