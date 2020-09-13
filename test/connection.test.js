//Connection object test

import Manager from '../src/client/js/manager';
import Connection from '../src/client/middleware/connection';

test("Returns an object used to establish a web socket connection between client and server", () => {
	const manager = Manager();
	const connection = Connection(manager);

	expect(connection).toEqual(
		expect.objectContaining({
			close: 				expect.any(Function),
			connect: 			expect.any(Function),
			getSessionLayout: 	expect.any(Function),
			getSessionId: 		expect.any(Function),
			isConnected: 		expect.any(Function),
			send: 				expect.any(Function)
		})
	);
});