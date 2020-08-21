const dev = true;
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);

function arenaSweep() {
	//Collects the game rows
	let rowCount = 1;

	outer:
	for (let y = arena.length - 1; y > 0; --y) { //Started from the bottom
		for (let x = 0; x < arena[y].length; ++x) {
			//Check if any rows have a 0; meaning it's not fully populated
			if (arena[y][x] === 0) {
				continue outer;	//Continue on next row
				//labels: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label
			}
		}

		//Perfect row. remove row from arena
		const row = arena.splice(y, 1)[0].fill(0); //After remove, copy and zero fill
		arena.unshift(row);	//Throw row ontop of arena 
		++y;			//Offset y position
		player.score += rowCount * 10;
		rowCount *= 2;		//For every row doublw score

		if (dev) {
			console.log('Swept a row. Nice!');
		}
	}
}

function collide(arena, player) {
	//Tuple assigner
	const [m, o] = [player.matrix, player.pos]; //matrix and current position

	for (let y = 0; y < m.length; ++y) {
		for (let x = 0; x < m[y].length; ++x) {
			if (m[y][x] !== 0 && //Check if player matrix is not 0
			    (arena[y + o.y] &&	//Check if arena has a row & is not 0)
			    arena[y + o.y][x + o.x]) !== 0) {
				if (dev) {
					console.log('Collision detected');
				}
				return true; //There was a collision
			}

		}
	}
	if (dev)
		console.log('No collision detected');
	return false;	//There was no collision
}

function createMatrix(w, h) {
	if (dev) {
		console.log('Creating matrix');
	}
	const matrix = [];

	while (h--) {
		matrix.push(new Array(w).fill(0));
	}
	if (dev) {
		console.log('Game arena:');
		console.table(matrix);
	}
	return matrix;
}

function createPiece(type) {
//3x3 or higher because you can't rotate with less
	if (type === 'T') {
		return [
			[0, 0, 0],
			[1, 1, 1],
			[0, 1, 0]
		];
	}
	else if (type === 'O') {
		return [
			[2, 2],
			[2, 2]
		];
	}
	else if (type === 'L') {
		return [
			[0, 3, 0],
			[0, 3, 0],
			[0, 3, 3]
		];

	}
	else if (type === 'J') {
		return [
			[0, 4, 0],
			[0, 4, 0],
			[4, 4, 0]
		];
	}
	else if (type === 'I') {
		return [
			[0, 5, 0, 0],
			[0, 5, 0, 0],
			[0, 5, 0, 0],
			[0, 5, 0, 0]
		];
	}
	else if (type === 'S') {

		return [
			[0, 6, 6],
			[0, 6, 0],
			[6, 6, 0]
		];
	}
	else if (type === 'Z') {
		return [
			[7, 7, 0],
			[0, 7, 7],
			[0, 0, 0]
		];
	}
}

function draw() {
	context.fillStyle = '#000';
	context.fillRect(0, 0, canvas.width, canvas.height);

	
	drawMatrix(arena, {x: 0, y: 0});		//Draws placed pieces to arena
	drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				context.fillStyle = colours[value];
				context.fillRect(x + offset.x,
						 y + offset.y,
						 1, 1);
			}
		})
	});
}

function merge(arena, player) {
	//Copies the players position into the arena
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				arena[y + player.pos.y][x + player.pos.x] = value;
			}
		})
	});
}

function playerDrop() {
	player.pos.y++;
	if (collide(arena, player)) {
		player.pos.y--;
		merge(arena, player);
		playerReset();
		arenaSweep();
		updateScore();
		//player.pos.y = 0;
	}
	dropCounter = 0;
}

//To quickly fill a row
//arena[19].fill(1)


function playerMove(dir) {
	player.pos.x += dir;

	if (collide(arena, player)) {
		player.pos.x -= dir;
	}
}

function playerReset() {
	const pieces = 'ILJOTSZ';

	player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
	player.pos.y = 0;
	player.pos.x = (arena[0].length / 2 | 0) -
		       (player.matrix[0].length / 2 | 0)

	if (collide(arena, player)) {
		//Game over
		arena.forEach(row => row.fill(0)); //Remove everything from the arena
		player.score = 0;
		updateScore();
	}

}

function playerRotate(dir) {
	const pos = player.pos.x;
	let offset = 1;

	rotate(player.matrix, dir);
	while(collide(arena, player)) {
		player.pos.x += offset;
		offset = -(offset + (offset > 0 ? 1 : -1));
		if (offset > player.matrix[0].length) {
			rotate(player.matrix, -dir);
			player.pos.x = pos;
			return;
		}
	}
}

function rotate(matrix, dir) {
	for (let y = 0; y < matrix.length; ++y) {
		for (let x = 0; x < y; ++x) {
			//Swap values respectfully between first and last rows or columns
			[
				matrix[x][y],
				matrix[y][x]
			] = [
				matrix[y][x],
				matrix[x][y]
			]
		}
	}

	if (dir > 0) {
		matrix.forEach(row => row.reverse());
	} else {
		matrix.reverse();
	}
}


let dropCounter = 0;
let dropInterval = 1000;	//Every 1 second we want to drop a piece

let lastTime = 0;
function update(time = 0) {
	const deltaTime = time - lastTime;
	lastTime = time;

	dropCounter += deltaTime;

	if (dropCounter > dropInterval) {
		playerDrop();
	}

	draw();
	requestAnimationFrame(update);
}

function updateScore() {
	document.getElementById('score').innerHTML = player.score;
}

const arena = createMatrix(12, 20);

//Test merge
//merge(arena, player);
//console.table.arena

const colours = [
	null,
	'red',
	'blue',
	'violet',
	'green',
	'purple',
	'orange',
	'pink'
];


//Player
const player = {
	matrix: null,
	pos: {x: 0, y: 0},
	score: 0
};

//Controller
document.addEventListener('keydown', event => {
	if (event.keyCode === 37) {
		playerMove(-1);		//Move left
	}
	else if (event.keyCode === 39) {
		playerMove(1);		//Move right
	}
	else if (event.keyCode === 40) {
		playerDrop();	//Move down
	}
	else if (event.keyCode === 81) {
		playerRotate(-1);	//Q
	}
	else if (event.keyCode === 87) {
		playerRotate(1);	//R
	}

});

playerReset();
updateScore();
update();
