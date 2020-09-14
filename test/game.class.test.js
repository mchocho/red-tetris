//new Game test

const Game 			= require('../src/server/game');
const Player 		= require('../src/server/player');
const { createId } 	= require('../src/server/util');

const conn 			= {};
const player 		= new Player(conn, createId());
const game 			= new Game(createId(), player);

test("new Game() returns instance of a game session stored on the server", () => {
	expect(game).toBeInstanceOf(Game);
});

test("Game().broadcastSession() sends a message to all players describing the state of the game and players", () => {
	expect(game.broadcastSession()).toBeUndefined();
});

test("Game().getNewOwner() sets a new owner to the session", () => {
	game.getNewOwner();

	expect(game.owner).toBe(player.id);
});

test("Game().join() add new player to the current session", () => {
	const newPlayer = new Player(conn, createId);

	game.join(newPlayer);
	expect([...game.clients].length).toBe(1);
});