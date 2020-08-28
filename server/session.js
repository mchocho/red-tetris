class Session {
        constructor(id, userId)
        {
                this.id = id;
                this.clients = new Set;
		this.gameStarted = false;
		this.owner = userId;
		this.pieceLayout = [];
        }
	addNewPiece() {
		//Adds new random piece to tetrmonio list
		const pieces = 'ILJOTSZ';
		const index = pieces.length * Math.random() | 0;

		this.pieceLayout.push(pieces[index]);
		return pieces[index];
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
