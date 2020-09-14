//Events object test

import Events from '../src/client/js/events';

const events = Events();

test("Events() returns an object that represents a custom handler which emit and listens for events", () => {
	expect(events).toEqual(
		expect.objectContaining({
			listen: expect.any(Function),
			emit: 	expect.any(Function)
		})
	);
});

test("listen(name, callback) will start listening for events of the specified and trigger the callback", () => {
	const name = 'matrix';	//Player matrix received
	const callback = () => {
		//Boom
	}

	expect(events.listen(name, callback)).toBeUndefined();
});

test("emit(name, ...data) will forward an event to the server which processes and broadcasts the results", () => {
	const name = 'state';	//Player matrix received
	const callback = () => {
		//Kaboom
	}

	expect(events.emit(name, callback)).toBeUndefined();
});