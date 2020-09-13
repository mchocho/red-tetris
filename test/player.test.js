//Game Player test

import Player from '../src/client/js/player';
import Game from '../src/client/js/game';
import Manager from '../src/client/js/manager';

test("Returns an object representing a game player's state and actions available", () => {
	const manager 		= Manager();
	const testElement 	= document.createElement('div');
	testElement.appendChild(document.createElement('canvas')); //Nest canvas element

	const game 			= Game(testElement, manager);
	const player 		= Player(game, manager);

	expect(player).toEqual(
		expect.objectContaining({
			arena: 				expect.any(Object),
			addListener: 		expect.any(Function),
			drop: 				expect.any(Function),
			dropPieceInPile: 	expect.any(Function),
			gameOver: 			expect.any(Function),
			getPieceCount: 		expect.any(Function),
			getScore: 			expect.any(Function),
			move: 				expect.any(Function),
			newGame: 			expect.any(Function),
			reset: 				expect.any(Function),
			rotate: 			expect.any(Function),
			_rotateMatrix: 		expect.any(Function),
			slow: 				expect.any(Function),
			update: 			expect.any(Function) 
		})
	);
})