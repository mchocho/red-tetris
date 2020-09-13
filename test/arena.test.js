//Game arena object test

import Arena from '../src/client/js/arena';

test("Returns an object representing a player's game view", () => {
	expect(Arena()).toEqual(
		expect.objectContaining({
			matrix: 		expect.any(Array),
			addListener: 	expect.any(Function),
			clear: 			expect.any(Function),
			collide: 		expect.any(Function),
			merge: 			expect.any(Function),
			setMatrix: 		expect.any(Function),
			sweep: 			expect.any(Function)
		})
	);
});
