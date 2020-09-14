//Game Player test

import Player from '../src/client/js/player';
import Game from '../src/client/js/game';
import Manager from '../src/client/js/manager';

const manager 		= Manager();
const testElement 	= document.createElement('div');
testElement.appendChild(document.createElement('canvas')); //Nest canvas element

const game 			= Game(testElement, manager);
const player 		= Player(game, manager);

test("Returns an object representing a game player's state and actions available", () => {
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
});


test("addListener(name, callback) sets up a custom listener for multiplayer experience", () => {
	const name = 'matrix';
	const callback = () => {
		console.log('Received updated matrix');
	};

	expect(player.addListener(name, callback)).toBeUndefined();
});

test("drop(player) increases the player's y coordinate on the grid, dropping them closer the pile", () => {
	player.matrix =  [['unit'], ['test'], ['42']];
	player.pos = {x: 0, y: 0};

	expect(player.drop(player)).toBeUndefined();
});

test("fast() returns the new interation speed used for increasing the speed of the game", () => {
	expect(player.fast()).toEqual(
		expect.any(Number)
	);
});

test("gameOver() sets the player state game over, this cancels rendering and player movement", () => {
	expect(player.gameOver()).toBeUndefined();
});

test("getName() receives the player's name. This could be a default or custom name", () => {
	const name = "42-test";

	player.setName(name);

	expect(player.getName()).toBe(name);
});

test("getPieceCount() returns the number of terominos the player's has dealt with", () => {
	expect(player.getPieceCount()).toBe(0);
});

test("getScore() returns the player's game score", () => {
	expect(player.getScore()).toBe(0);
});

test("isPaused() returns a boolean telling us whether or not the player's game is pauesed", () => {
	expect(player.isPaused()).toBe(false);
});

test("move(player, dir, axis, emit) moves the player along the arena", () => {
	expect(player.move(player, 1, 'x', false)).toBeUndefined();
});

test("newGame(player) sets up the player's field for a new game", () => {
	expect(player.newGame(player)).toBeUndefined();
});

test("newPosition(value) sets the players position in the arena", () => {
	const pos = {x: 0, y: 5};

	expect(player.newPosition(pos)).toBeUndefined();
});

test("pause() sets the players state to paused, only available in a local game", () => {
	player.pause();

	setTimeout(() => {
		expect(player.isPaused()).toBe(true);
	}, 1000)
});

test("quitGame() forces the player to leave their current game", () => {
	expect(player.quitGame()).toBeUndefined();
});

test("randomPiece() returns a random piece to throw into the local game", () => {
	expect(player.randomPiece()).toHaveLength(1);
});

test("reset() sets up a new tetromino for the player and checks whether the game is over", () => {
	manager.setMode('1-player');

	expect(player.reset()).toBeUndefined();
});

test("resume() allows a player to continue their game after a pause", () => {
	player.pause();

	player.resume

	setTimeout(() => {
		expect(player.isPaused()).toBe(false);
	}, 1000)
});

test("rotate(player, dir) calls rotation function for the current piece along the specified axis, rotates back to original state on collision", () => {
	expect(player.rotate(player, 1)).toBeUndefined()
});

test("_rotateMatrix(matrix, dir) rotates the provided matrix", () => {
	player.matrix =  [['unit'], ['test'], ['42']];

	expect(player._rotateMatrix(player.matrix, 1)).toBeUndefined();
});

test("setName(value) creates a new name for the player", () => {
	const name = "Another42-test";

	player.setName(name);

	expect(player.getName()).toBe(name);
});

test("setScore(value) sets a new score for the players", () => {
	const score = 42;

	player.setScore(score);

	expect(player.getScore()).toBe(score);
});

test("slow() returns an iteration speed used to slow the game down", () => {
	expect(player.fast()).toEqual(
		expect.any(Number)
	);
});

test("update(player, deltaTime) updates the frame rate for the game", () => {
	const deltaTime = 1000;

	expect(player.update(player, deltaTime)).toBeUndefined();
});

test("verticalAlign(player, dir=-1) attempts to fit the player's tetromino in nearby holes within the pile", () => {
	expect(player.verticalAlign(player, -1)).toBeUndefined();
});