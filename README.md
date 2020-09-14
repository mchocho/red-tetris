<div align="center">
   <h1>Red Tetris</h1>
   <h4>The objective of this project is to develop a networked multiplayer tetris game from a stack of software exclusively Full Stack Javascript</h4>
</div>

## Table of Contents

- [Install](#install)
- [Preview](#preview)
- [Tests](#tests)

### `Install`

<h2 align="center">Install</h2>

Download and install <a href="https://nodejs.org/en/">Node.js</a>

Then open your terminal and run

```bash
npm install
npm run client
```

Open a new window and run
```bash
npm run server
```

Open http://localhost:3000#<room\>[<player_name>] to view it in the browser.

  Where
  		room is the name of the game to create or join
  		player_name is the name of the player

For example http://localhost:3000/#demo[mchocho] 

### `Preview`

<div align="center">
	<img width="80%" src="./screenshots/main.png" alt="Game main menu"/>
	<img width="80%" src="./screenshots/controls.png" alt="Game controls menu"/>
	<img width="80%" src="./screenshots/single-player.png" alt="Single player game"/>
	<img width="80%" src="./screenshots/room-menu.png" alt="Multiplayer startup room"/>
	<img width="80%" src="./screenshots/multiplayer.png" alt="Multiplayer game"/>
</div>

### `Tests`

To run tests

```bash
cd /tests
npm test filename (e.g game.class.test)
```