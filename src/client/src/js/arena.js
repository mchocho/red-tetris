import Events from './events';

const dev = window.DEV;
const collisionStatus = window.COLLISION;

export default (w, h) => {
	if (dev) {
		console.log('Creating matrix');
	}
	const matrix = [];
	const events = Events();
	
	while (h--) {
		matrix.push(new Array(w).fill(0));
	}
	if (dev) {
		console.log('Game arena:');
		console.table(matrix);
	}
	
	return {
		matrix,
		addListener(name, callback) {
			events.listen(name, callback);
		},
		clear(arena) {
			arena.matrix.forEach(row => row.fill(0)); //Remove everything from the arena
			events.emit('matrix', matrix);
		},

		collide(arena, player) {
			//Tuple assigner
			const [m, o] = [player.matrix, player.pos]; //matrix and current position

			for (let y = 0; y < m.length; ++y) {
				for (let x = 0; x < m[y].length; ++x) {
					if (m[y][x] !== 0 && //Check if player matrix is not 0
			    		(arena.matrix[y + o.y] &&	//Check if arena has a row & is not 0 and null)
			    		arena.matrix[y + o.y][x + o.x]) !== 0) {
							if (collisionStatus) {
								console.log('Collision detected');
							}
							return true; //There was a collision
					}

				}
			}
			if (collisionStatus) {
				console.log('No collision detected');
			}
			return false;	//There was no collision
		},

		merge(matrix, player) {
			//Copies the players position into the arena
			player.matrix.forEach((row, y) => {
				row.forEach((value, x) => {
					if (value !== 0) {
						matrix[y + player.pos.y][x + player.pos.x] = value;
					}
				});
			});
			events.emit('matrix', matrix);
		},

		setMatrix(value) {
			if (!value) return;
			if (!value.every(row => row.every(el => !isNaN(el)))) return

			//matrix = value;
			value.forEach((row, index) => {
				matrix[index] = value[index];
			});
		},

		sweep(/*arena, */player) {
			//Collects the game rows
			let rowCount = 1;

			outer:
			for (let y = /*arena.*/matrix.length - 1; y > 0; --y) { //Started from the bottom
				for (let x = 0; x < /*arena*/matrix[y].length; ++x) {
					//Check if any rows have a 0 or null; meaning it's not fully populated
					if ([0, -1, null].indexOf(matrix[y][x]) > -1) {
						continue outer;	//Continue on next row
						//labels: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label
					}
				}

				//Perfect row. remove row from arena
				const row = /*arena*/matrix.splice(y, 1)[0].fill(0); //After remove, copy and zero fill
				/*arena*/matrix.unshift(row);	//Throw row ontop of arena 
				++y;			//Offset y position
				player.score += rowCount * 10;
				rowCount *= 2;		//For every row doublw score
				events.emit('matrix', matrix);
				events.emit('sweep', true);

				if (dev)
					console.log('Swept a row. Nice!');
			}
		}

	};
}