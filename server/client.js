 require('dotenv').config({path: './.env'});

const DEV = process.env.DEV;

class Client {
        constructor(conn, id) {
                this.conn = conn;       //Store the clients connection
                this.id = id;
		this.isPlaying = false;
		this.name = null;
		this.pieces = 0;
		this.score = 0;
                this.session = null;    //Session the client will live in
		this.state = null;
        }

	broadcast(data) {
		if (!this.session) {
			throw new Error('Can not broadcast without session');
		}

		data.clientId = this.id;

		this.session.clients.forEach(client => {
			if (this === client) {
				return; //We don't need to broadcast to ourself
			}
			client.send(data);
		});
	}

	send(data) {
		const msg = JSON.stringify(data);

		if (DEV) {
			console.log(`Sending message ${msg}`);
		}
		this.conn.send(msg, function ack(err) {
			if (err && DEV) {
				console.error('Message failed. ', msg, err);
			}
		});
	}
}

module.exports = Client;
