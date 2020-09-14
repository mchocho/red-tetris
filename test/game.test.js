//Game object test

import Manager from '../src/client/js/manager';
import Game from '../src/client/js/game';

const manager 		= Manager();
const testElement 	= document.createElement('div');
testElement.appendChild(document.createElement('canvas')); //Nest canvas element

const game 			= Game(testElement, manager);

test("Game(element, manager) returns an object that represents an instance of a single tetris game", () => {
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
});

test("draw(game) calls renderer for the game arena, pile, and current piece to screen", () => {
	expect(game.draw(game)).toBeUndefined();
});

test("drawMatrix(matrix, offset) renders the game arena", () => {
	const matrix = [['unit'], ['test'], ['42']];
	const offset = {x: 0, y: 0};

	expect(game.drawMatrix(matrix, offset)).toBeUndefined();
})

test("penalty(game) penalises the player by adding a either temp or indestructable wall to player's arena", () => {
	expect(game.penalty(game)).toBe(true);
});

test("reset() empties the player's arena, clearing the pile in the process", () => {
	expect(game.reset()).toBeUndefined();
});

test("run(game) starts running game instance", () => {
	expect(game.run(game)).toBeUndefined();
});

test("updatePanel() displays the list of players in the game with their scores", () => {
	expect(game.updatePanel()).toBeUndefined();
});

test("serialize(game) stores the players current state to be sent to server", () => {
	expect(game.serialize(game)).toEqual(
		expect.objectContaining({
			arena: 			expect.any(Object),
			player:			expect.any(Object)
		})
	);
});

test("unserialize(state) creates and sets received player data", () => {
	const state = {
		arena: {
			matrix: [['unit'], ['test'], ['42']]
		},
		player: {x: 0, y: 0}
	}

	expect(game.unserialize(state)).toBeUndefined();
});