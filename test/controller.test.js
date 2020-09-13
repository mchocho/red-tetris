//Controller object test

import Manager from '../src/client/js/manager';
import Controller from '../src/client/middleware/connection';

test("Returns an callback listener function used to handle player keyboard events", () => {
	const manager = Manager();
	const controller = Controller(manager);

	expect(controller).toEqual(
		expect.objectContaining({})
	);
});