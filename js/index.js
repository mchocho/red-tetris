const dev = true;
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);


//Our pieces will have 3 rows and cols, because you can't rotate with less
const matrix = [
	[0, 0, 0],
	[1, 1, 1],
	[0, 1, 0]
];

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

function collide(arena, player) {
	//Tuple assigner
	const [m, o] = [player.matrix, player.pos]; //matrix and current position

	for (let y = 0; y < m.length; ++y) {
		for (let x = 0; x < m[y].length; ++x) {
			if (m[y][x] !== 0 && //Check if player matrix is not 0
			    (arena[y + o.y] &&	//Check if arena has a row & is not 0)
			    arena[y + o.y][x + o.x]) !== 0)
				return true; //There was a collision

		}
	}
	return false;	//There was no collision
}

function draw() {
	context.fillStyle = '#000';
	context.fillRect(0, 0, canvas.width, canvas.height);

	drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				context.fillStyle = 'red';
				context.fillRect(x + offset.x,
						 y + offset.y,
						 1, 1);
			}
		})
	});
}

function merge(arena, player) {
	//Merges the players position in the arena
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				arena[y + player.pos.y][x + player.pos.x] = value;
			}
		})
	});
}

let dropCounter = 0;
let dropInterval = 1000;	//Every 1 second we want to drop a piece

function playerDrop() {
	player.pos.y++;
	dropCounter = 0;
}

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

const arena = createMatrix(12, 20);


//Test merge
//merge(arena, player);
//console.table.arena

//Player
const player = {
	matrix,
	pos: {x: 5, y: 5}
};

//Controller
document.addEventListener('keydown', event => {
	if (event.keyCode === 37) {
		player.pos.x--;	//Move left
	}
	else if (event.keyCode === 39) {
		player.pos.x++; //Move right
	}
	else if (event.keyCode === 40) {
		playerDrop();	//Move down
	}
});

update();
