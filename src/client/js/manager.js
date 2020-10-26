import Game 				from "./game";
import ConnectionManager 	from "../middleware/connection";
import Controller 			from "./controller";
import Form 				from "./form";
import Settings 			from "./settings";

const SERVER_URL = "ws://localhost:9000";

export default () =>
{
	const instances = new Set(); //Arrays are not optimal and may hold duplicates
	const pieces 	= "ILJOTSZ";
	const layout 	= [];

	let connection = null;
	let mode = null;
	let isRunning = false;
	let gameOver = true;

	function closeMenus()
	{
		const el = document.querySelectorAll(".modal");

		for (let i = 0; i < el.length; i++)
			el[i].classList.remove("show");
	}

	function createPiece(type)
	{
		//3x3 or higher because you can"t rotate with less
		if (type === "T")
		{
			return [
				[0, 1, 0],
				[1, 1, 1],
				[0, 0, 0]
			];
		}
		else if (type === "O")
		{
			return [
				[2, 2],
				[2, 2]
			];
		}
		else if (type === "L")
		{
			return [
				[0, 0, 3],
				[3, 3, 3],
				[0, 0, 0]
			];

		}
		else if (type === "J")
		{
			return [
				[4, 0, 0],
				[4, 4, 4],
				[0, 0, 0]
			];
		}
		else if (type === "I")
		{
			return [
				[0, 0, 0, 0],
				[5, 5, 5, 5],
				[0, 0, 0, 0],
				[0, 0, 0, 0]
			];
		}
		else if (type === "S")
		{
			return [
				[0, 6, 6],
				[0, 6, 0],
				[6, 6, 0]
			];
		}
		else if (type === "Z")
		{
			return [
				[7, 7, 0],
				[0, 7, 7],
				[0, 0, 0]
			];
		}
	}

	function createPlayer(gameManager, isLocal=false, hide=false)
	{
		const element 		= document.createElement("div");

		element.className 	= "player";
		element.innerHTML 	= `<canvas class="tetris" width="180" height="400"></canvas>`;

		const tetris 		= Game(element, gameManager);
		const container 	= document.getElementById("players");
		
		tetris.isLocal 		= (isLocal === true);
		tetris.hidden	 	= (hide === true);
		instances.add(tetris);

		if (!hide && container)
			container.appendChild(element);

		return tetris;
	}

	function openMenu(value)
	{
		let el;
		closeMenus();

		switch(value)
		{
			case "settings":
			case "game-over":
			case "multiplayer":
			case "pause":
			case "winner":
			case "loading":
			case "controls":
			case "error":
				if (value === "multiplayer")
				{
					gameOver = false;
					isRunning = false;
				}
				
				el = document.querySelector(".modal." + value);
				break;
			default:
				if (connection)
					connection.close();

				window.location.hash = "";
				removeAllPlayers();
				el = document.querySelector(".modal.main");
		}
		if (el)
		{
			el.classList.add("show");
			el.querySelector("form").focus();

			const input = el.querySelector("input:first-of-type");

			if (input)
			{
				input.focus();

				if (input.type === "radio")
					input.click();
			}
		}
	}	

	function removeAllPlayers()
	{
		[...instances].forEach((game) =>
		{
			removePlayer(game);
		});
	}

	function removePlayer(game)
	{
		const container = document.getElementById("players");

		game.player.gameOver();
		instances.delete(game);

		if (!game.hidden && container)
			container.removeChild(game.element);
	}

	return {
		instances,
		enableSound: false,
		enableColours: false,
		state: null,
		activePlayers()
		{
			if (connection)
				return connection.activePlayers();
			return 1;
		},
		closeSession()
		{
			if (connection)
				connection.close();
		},
		closeMenus()
		{
			closeMenus();
		},
		connectionAvaialable()
		{
			if (!connection)
				return false;

			return connection.isConnected();
		},
		createPiece(type)
		{
			return createPiece(type);
		},
		createPlayer(gameManager, hide=false)
		{
			return createPlayer(gameManager, false, hide);
		},
		createRandomPiece()
		{
			return createPiece(pieces[pieces.length * Math.random() | 0]);
		},
		gameOver(menu=true)
		{
			if (menu)
				openMenu("game-over");

			if (mode !== "multiplayer")
				removeAllPlayers();
			else if (connection)
			{
				if (!isRunning)
					return;

				[...instances].forEach(game => game.player.gameOver());
				
				connection.send({
					type: "game-over",
					id: connection.getSessionId()
				});
			}

			isRunning = false;
			gameOver = true;
		},
		getMode()
		{
			return mode;
		},
		getPieceAtIndex(gameManager, index)
		{
			return new Promise((resolve, reject) =>
			{
				let piece;

				if (mode === "multiplayer")
				{
					if (!connection)
					{
						reject("Socket connection unavailable");
						return;
					}
				}
				else if (mode !== "2-player")
				{
					reject("Mode is not set");
					return;
				}

				if (isNaN(index))
				{
					reject("Value is not an index");
					return;
				}

				//Get piece
				if (layout[index])
					piece = layout[index];
				else if (mode === "multiplayer")
				{
					layout.splice(0, layout.length, ...connection.getSessionLayout());
					piece = layout[index];
				}
				else
				{
					//2 player mode no server connection required
					piece = pieces[pieces.length * Math.random() | 0];	//Get random piece from 1st player
					layout.push(piece);
				}

				if (piece)
				{
					if (mode === "multiplayer")
						connection.send({ type: "new-piece" });
					resolve(piece);
					return;
				}
				reject("Piece unavailable");
			});
		},
		getPiecesList()
		{
			return [...pieces];
		},
		initRoom(gameManager)
		{
			if (connection)
				connection.close();		//Close current connection

			if (!connection || instances.size === 0)
				connection = ConnectionManager(gameManager);

			if (!connection.isConnected())
				connection.connect(SERVER_URL);
		},
		isGameOver()
		{
			return gameOver;
		},
		isPaused()
		{
			return ([...instances].some(game => game.player.isPaused()));
		},
		isRunning()
		{
			return isRunning;
		},
		onReady(gameManager)
		{
			return () =>
			{
				const hash 	= window.location.hash.split("#")[1];
				const el 	= document.querySelector(".menu input:first-of-type");

				document.addEventListener("keydown", Controller(gameManager)); 
				document.addEventListener("keyup", Controller(gameManager));
				document.addEventListener("change", Settings(gameManager));
				document.addEventListener("submit", Form(gameManager));

				if (el)
				{
					el.click();
					el.focus();
				}

				if (!hash)
					return;

				if (hash.length === 0)
					return;

				mode = "multiplayer";
				gameManager.state = "multiplayer";
				gameManager.openMenu("loading");
				gameManager.initRoom(gameManager);
			}
		},
		openMenu(value="main")
		{
			openMenu(value);
		},
		pause()
		{
			if (!isRunning || mode === "multiplayer")
				return;

			([...instances].forEach(game => game.player.pause()));
		},
		removePlayer(player)
		{
			removePlayer(player);
		},
		resume()
		{
			if (!isRunning || mode === "multiplayer")
				return;

			([...instances].forEach(game => game.player.resume()));
		},
		setMode(value="1-player")
		{
			const modes = [null, "1-player", "2-player", "multiplayer"];

			if (modes.indexOf(value) > -1)
				mode = value;
		},
		startNewGame(gameManager)
		{
			isRunning = true;
			gameOver = false;

			layout.splice(0, layout.length);
			removeAllPlayers();

			const localPlayer = createPlayer(gameManager, true);
			let player2;
	
			closeMenus();
			localPlayer.element.classList.add("local");
			localPlayer.player.setName("Player 1");

			switch(mode)
			{
				case "2-player":
					player2 = createPlayer(gameManager);
					player2.player.setName("Player 2");

					localPlayer.run(localPlayer);
					player2.run(player2);
					break;
				case "multiplayer":
					gameManager.openMenu("loading");
					isRunning = false;
					return localPlayer;
				default:
					//Single player
					localPlayer.run(localPlayer);
					return;
			}
		},
		startNewGameLAN(gameManager)
		{
			if (gameManager.getMode() !== "multiplayer" || gameManager.isRunning() || !connection)
				return;

			if (!connection.isConnected())
			{
				gameManager.openMenu("error");
				return;
			}
			
			const game = [...instances][0];

			game.reset();
			closeMenus();
			isRunning = true;
			gameOver = false;

			game.player.newGame(game.player);
			game.run(game);
		},
		startSession(gameManager)
		{
			if (gameManager.getMode() !== "multiplayer" || gameManager.isRunning() || !connection)
				return;

			if (!connection.isConnected())
			{
				gameManager.openMenu("error");
				return;
			}
			
			connection.send({ 
				type 		: "start-game",
				id 			: connection.getSessionId()
			});

			return;
		},
		totalPlayers()
		{
			if (connection)
				return connection.totalPlayers();
			
			return 1;
		}
	};
}