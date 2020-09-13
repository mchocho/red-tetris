//Create ID test

const { createId, getSession } = require('../src/server/util');

test("createId function returns an ID string", () => {
	expect(createId()).toEqual(
		expect.any(String)
	);
});


test("getSession function returns requested game session object in map if exists", () => {
	const sessions = new Map();

	sessions.set('foo', {
		bar: 'Hi there'
	})

	expect(getSession(sessions, 'foo')).toEqual(
		expect.objectContaining({
			bar: expect.stringMatching('Hi there')
		})
	);
});