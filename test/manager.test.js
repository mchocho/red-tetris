//Manager object test

import Manager from '../src/client/js/manager';

const manager = Manager();

test("Returns an object representing a game's state available", () => {
	expect(manager).toEqual(
		expect.objectContaining({
			instances: 				expect.any(Object),
			activePlayers: 			expect.any(Function),
			closeSession: 			expect.any(Function),
			closeMenus: 			expect.any(Function),
			connectionAvaialable: 	expect.any(Function),
			createPiece: 			expect.any(Function),
			createPlayer: 			expect.any(Function),
			createRandomPiece: 		expect.any(Function),
			gameOver: 				expect.any(Function),
			getMode: 				expect.any(Function),
			getPieceAtIndex: 		expect.any(Function),
			getPiecesList: 			expect.any(Function),
			initRoom: 				expect.any(Function),
			isGameOver: 			expect.any(Function),
			isPaused: 				expect.any(Function),
			isRunning: 				expect.any(Function),
			onReady: 				expect.any(Function),
			openMenu: 				expect.any(Function),
			pause: 					expect.any(Function),
			removePlayer: 			expect.any(Function),
			resume: 				expect.any(Function),
			setMode: 				expect.any(Function),
			startNewGame: 			expect.any(Function),
			startSession: 			expect.any(Function),
			startNewGameLAN: 		expect.any(Function),
			totalPlayers: 			expect.any(Function) 
		})
	);
});


test("activePlayers() returns the number of players available in the current session", () => {
	expect(manager.activePlayers()).toBe(1);
});

test("closeSession() closes the player's connection to the server", () => {
	expect(manager.closeSession()).toBeUndefined();
});

test("closeMenus() hides all menus opening the game view", () => {
	expect(manager.closeMenus()).toBeUndefined();
});

test("connectionAvaialable() checks wether or not the player is connected to the server", () => {
	expect(manager.connectionAvaialable()).toBe(false);
});

test("createPiece(type) returns a matrix value representing the provided tetromino value", () => {
	expect(manager.createPiece('O')).toStrictEqual([
		[2, 2],
		[2, 2]
	]);
});

test("createPlayer(gameManager, hide) creates a new game object for a player", () => {
	expect(manager.createPlayer(manager, false)).toEqual(
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

test("createRandomPiece() returns a matrix value representing a random tetromino value", () => {
	expect(manager.createRandomPiece()).toBeDefined();
});

test("gameOver(menu) sets the player's state as game over and opens the appropriate menu", () => {
	expect(manager.gameOver(true)).toBeUndefined();
});

test("getMode() receives the current game mode the player is in", () => {
	const mode = '1-player';

	manager.setMode(mode);
	expect(manager.getMode()).toBe(mode);
});

test("getPieceAtIndex(gameManager, index) receives the tetromino at provided index of game's piece layout", () => {
	manager.setMode('2-player');

	expect(manager.getPieceAtIndex(manager, 0)).resolves.toMatch(/^(['ILJOTSZ']+)$/);
});

test("getPiecesList() returns a string of all the possible pieces in their character form", () => {
	const expected = ['I', 'L', 'J', 'O', 'T', 'S', 'Z'];

	expect(manager.getPiecesList()).toStrictEqual(expected);
});

test("openMenu(value) opens menu screen to query the player", () => {
	expect(manager.openMenu('main')).toBeUndefined();
});

test("pause() sets all game instances to paused, preventing player actions", () => {
	expect(manager.pause()).toBeUndefined();
});

test("removePlayer(player) removes the provided player's game view and instance from list", () => {
	const player = manager.createPlayer(manager, false);

	expect(manager.removePlayer(player)).toBeUndefined();
});

test("resume() continues a paused game", () => {
	expect(manager.resume()).toBeUndefined();
});

test("setMode(value) sets the game mode for the next game", () => {
	const mode = '2-player';

	manager.setMode(mode);
	expect(manager.getMode()).toBe(mode);
});

test("startNewGame(gameManager) sets up a new game of tetris depending on the mode provided", () => {
	const mode = '2-player';

	manager.setMode(mode);
	expect(manager.startNewGame(manager)).toBeUndefined();
});

test("startNewGameLAN(gameManager) begins a new game immediately after receiving start message from server", () => {
	const mode = 'multiplayer';

	manager.setMode(mode);
	expect(manager.startNewGameLAN(manager)).toBeUndefined();
});

test("startSession(gameManager) sends a message to server to begin broadcast a start game message", () => {
	const mode = 'multiplayer';

	manager.setMode(mode);
	expect(manager.startSession(manager)).toBeUndefined();
});

test("totalPlayers() returns the number of players available in the game", () => {
	expect(manager.totalPlayers()).toBe(1);
});