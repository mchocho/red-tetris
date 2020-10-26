import Events from './events';

const dev 				= window.DEV;

export default (w, h) =>
{
	if (dev)
		console.log('Creating matrix');

	const matrix = [];
	const events = Events();
	
	while (h--)
		matrix.push(new Array(w).fill(0));
	
	if (dev)
	{
		console.log('Game arena:');
		console.table(matrix);
	}

	function penalizeOpponent(player, gameManager)
	{
		//Penalise player on local game
		const players = [...gameManager.instances];

		if (player.game.isLocal)
			players[1].penalty(players[1]);
		else
			players[0].penalty(players[0]);
	}
	
	return {
		matrix,
		addListener(name, callback)
		{
			//Custom listener
			events.listen(name, callback);
		},
		clear(arena)
		{
			//Remove everything from the arena
			arena.matrix.forEach(row => row.fill(0));
			events.emit('matrix', matrix);
		},
		collide(arena, player)
		{
			//Checks for piece collision on drop 
			const [m, o] = [player.matrix, player.pos]; 

			for (let y = 0; y < m.length; ++y)
				for (let x = 0; x < m[y].length; ++x)
					if (m[y][x] !== 0 && 							//Check if player matrix is not 0
			    		(arena.matrix[y + o.y] &&					//Check if arena has a row & is not 0 and null)
			    		arena.matrix[y + o.y][x + o.x]) !== 0
			    	)
						return true;
			return false;
		},
		merge(matrix, player)
		{
			//Copies the players position into the arena
			player.matrix.forEach((row, y) =>
			{
				row.forEach((value, x) =>
				{
					if (value !== 0)
						matrix[y + player.pos.y][x + player.pos.x] = value;
				});
			});
			events.emit('matrix', matrix);
		},
		setMatrix(value)
		{
			if (!value) return;
			if (value.every(row => row.some(col => isNaN(col)))) return;

			value.forEach((row, index) =>
			{
				matrix[index] = value[index];
			});
		},
		sweep(player, gameManager)
		{
			//Checks and removes fully populated rows
			let rowCount = 1;

			outer:
			for (let y = matrix.length - 1; y > 0; --y)
			{
				for (let x = 0; x < matrix[y].length; ++x)
					if ([0, -1, null].indexOf(matrix[y][x]) > -1)
						continue outer;	//not fully populated

				const row = matrix.splice(y, 1)[0].fill(0);
				
				matrix.unshift(row);						//Throw row ontop of arena 
				++y;										//Offset y position
				player.setScore(player.getScore() + rowCount * 10)
				rowCount *= 2;
				events.emit('matrix', matrix);
				events.emit('sweep', true);

				if (gameManager.getMode() === '2-player')
					penalizeOpponent(player, gameManager);

				if (dev)
					console.log('Swept a row. Nice!');
			}
		}

	};
}