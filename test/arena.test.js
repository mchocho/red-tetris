//Game arena object test

import Arena from '../src/client/js/arena';
import Manager from '../src/client/js/manager';

const arena = Arena(13, 20);

test("Returns an object representing a player's game view", () => {
	expect(arena).toEqual(
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

test("addListener(name, callback) adds a custom listener to the game arena", () => {
	const name = 'matrix';
	const callback = () => {
		//Do something
	};

	expect(arena.addListener(name, callback)).toBeUndefined();
});

test("clear(arena) removes the pile from the arena", () => {
	expect(arena.clear(arena)).toBeUndefined();
});

test("collide(arena, player) detects wheter or not the current piece colliding with the pile", () => {
	const player = {
		pos: {x: 0, y: 0},
		matrix: [
			[1, 1],
			[1, 1]
		]
	};

	expect(arena.collide(arena, player)).toBe(false);
});

test("merge(matrix, player) throws the current piece into the pile", () => {
	const player = {
		pos: {x: 0, y: 0},
		matrix: [
			[1, 1],
			[1, 1]
		]
	};

	expect(arena.merge(arena.matrix, player)).toBeUndefined();
});

test("setMatrix(value) accepts a new matrix and sets it up as the arena", () => {
	const matrix = [
		[1, 1, 1, 1, 1, 1, 1, 1, 1]
	]

	expect(arena.setMatrix(matrix)).toBeUndefined();
});

test("sweep(player, gameManager) checks if arena contains a perfect row, and increases player score", () => {
	const manager = Manager();
	const player = manager.createPlayer(manager, false);
	const matrix = [
		[1, 1, 1, 1, 1, 1, 1, 1, 1]
	];

	arena.setMatrix(matrix);

	expect(arena.sweep(player, manager)).toBeUndefined();
});