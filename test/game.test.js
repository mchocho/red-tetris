//Connection object test

import Manager from '../src/client/js/manager';
import Game from '../src/client/js/game';

test("Returns an object that represents an instance of a single tetris game", () => {
	const manager 		= Manager();
	const testElement 	= document.createElement('div');
	testElement.appendChild(document.createElement('canvas')); //Nest canvas element

	const game 			= Game(testElement, manager);

	expect(game).toEqual(
		expect.objectContaining({
			arena: 			expect.any(Object),
			draw: 			expect.any(Function),
			drawMatrix: 	expect.any(Function),
			penalty: 		expect.any(Function),
			reset: 			expect.any(Function),
			run: 			expect.any(Function),
			serialize: 		expect.any(Function),
			unserialize: 	expect.any(Function),
			updatePanel: 	expect.any(Function)
		})
	);
})