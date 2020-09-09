import menu from './menu'

export default (gameManager) => {
	return (event) => {
		if (event.keyCode === 8) {
			console.log('Type', event.target.type);
			event.preventDefault();
			//Search for text input with focus if not available prevent defualt
		}

		if (!gameManager.isRunning() && event.type === 'keydown') {
			switch(event.keyCode) {
				case 8:		//Backspace
				case 27:	//Escape
					gameManager.openMenu('.main');
					gameManager.state = null;
					break;
				case 13:	//Enter
				case 32:	//Space
					menu(gameManager);
					break;
			}
			return;
		}

		const games = [...gameManager.instances];

		[
			//Player 1
			[
				32, //0 Space key	(Vertical fit) 
				37, //1 Left key	(Move left)
				38, //2 up key		(Rotate clockwise)
				39, //3 Right key 	(Move right)
				40, //4 Down key	(Go down)
				68, //5 D key		(Drop piece in pile)
				81, //6 Q key 		(Rotate anti-clockwise)
				87, //7 R key 		(Rotate clockwise)
				80  //8 P key		(Pause)
			],
			//Player 2
			[
				104, //0 NUMPAD 8
				100, //1 NUMPAD 4
				105, //2 NUMPAD 9
				102, //3 NUMPAD 6
				101, //4 NUMPAD 5
				98,  //5 NUMPAD 2
				103, //6 NUMPAD 7
				null
			]
		].forEach((key, index) => {
			if (!games[index])
				return;

			if (index === 1 && gameManager.getMode() !== '2-player')
			 	return;	//Check if mode is in 2 player

			if (index > 1)
				return;

			const player = games[index].player;
			
			if (event.type === 'keydown') {
				switch(event.keyCode) {
					case key[0]:
						//Test left align then right align
						//This is shit!!!
						if (!player.verticalAlign(player, -1)) {
							console.log('Testing right side');
							player.verticalAlign(player, 1);
						}
						break;
					case key[1]:
						player.move(player, -1); //Move left
						break;
					case key[2]:
					case key[7]:
						player.rotate(player, 1); //Rotate
						break;
					case key[3]:
						player.move(player, 1);	  //Move right
						break;
					case key[5]:
						player.dropPieceInPile(player);
						break;
					case key[6]:
						player.rotate(player, -1);	//Q
						break;
					case key[8]:
						if (player.isPaused())
							player.resume();
						else
							player.pause();
						break;
				}
			}

			if (event.keyCode === key[4]) {
				if (event.type === 'keydown') {
					if (player.dropInterval !== player.DROP_FAST) {
						player.drop(player);	//Move down
						player.dropInterval = player.DROP_FAST;
					}
				}
				else {
					player.dropInterval = player.DROP_SLOW;
				}
			}
		});
	}
};