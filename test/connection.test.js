//Connection object test

import Manager from '../src/client/js/manager';
import Connection from '../src/client/middleware/connection';

const manager = Manager();
const connection = Connection(manager);

test("Returns an object used to establish a web socket connection between client and server", () => {

	expect(connection).toEqual(
		expect.objectContaining({
			activePlayers:		expect.any(Function),
			close: 				expect.any(Function),
			connect: 			expect.any(Function),
			getSessionLayout: 	expect.any(Function),
			getSessionId: 		expect.any(Function),
			isConnected: 		expect.any(Function),
			send: 				expect.any(Function)
		})
	);
});

test("activePlayers() returns the number of players within the session currently playing a game", () => {
	expect(connection.activePlayers()).toBe(0);
});

test("close() closes the socket connection and removes the api value", () => {
	expect(connection.close()).toBeUndefined();
});

test("connect(address) tries to establish a socket connection to the provided address", () => {
	const address = 'ws://localhost:9000';

	expect(connection.connect(address)).toBeUndefined();
});

test("getSessionLayout() returns the piece layout for the current sessions' game", () => {
	expect(connection.getSessionLayout()).toHaveLength(0);
});

test("getSessionId() returns the name of the player's current session", () => {
	expect(connection.getSessionId()).toBeNull();
});

test("isConnected() returns true if the player is connected to the server, otherwise false", () => {
	connection.close();		//We tried to establish a connection earlier

	expect(connection.isConnected()).toBe(false);
});

test("send() sends a data object to the server on the player's behalf", () => {
	const data = {
		msg: 'hello42'
	}

	expect(connection.send(data)).toBeUndefined();
});

test("totalPlayers() returns the total number of players within the sessions", () => {
	expect(connection.totalPlayers()).toBe(1);
});