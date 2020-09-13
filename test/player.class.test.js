//new Player test

const Player 		= require('../src/server/player');
const Game 			= require('../src/server/game');
const { createId } 	= require('../src/server/util');

const conn 			= {
	send() {
		//Do something
	}
};
const player 		= new Player(conn, createId());

test("new Player() returns instance of a player representing the client", () => {
	expect(player).toBeInstanceOf(Player);
});

test("Player().createName(name) method sets up new name for player instance", () => {
	const game = new Game(createId(), player);
	const name = 'Fourty2';

	player.createName(name, game)

	expect(player.name).toBe(name);
});

test("Player().createSession(id(), sessions, data) creates a game session for the player", () => {
	const sessions = new Map();
	const data = {
		name: 'mchocho',
		state: null
	};
	const game = player.createSession(createId(), sessions, data);

	expect(game).toBeInstanceOf(Game);
});

test("Player().gameOver(sessions, data) ends the player's current game", () => {
	const sessions = new Map();
	const game = new Game(createId(), player);
	const data = {
		id: game.id
	};

	player.isPlaying = true;
	sessions.set(data.id, game);
	player.gameOver(sessions, data)

	expect(player.isPlaying).toBe(false);
});

test("Player().startGame(sessions, data) begins the game and notifies all players", () => {
	const sessions = new Map();
	const game = new Game(createId(), player);
	const data = {
		id: game.id
	};

	sessions.set(data.id, game);

	player.startGame(sessions, data);
	expect(game.isRunning).toBe(true);
});