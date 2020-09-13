require('dotenv').config({path: './.env'});

const DEV = process.env.DEV || false;

class Piece {
	constructor()
	{
		// this.pieceLayout 	= [];
	}

	addNewPiece(layout) {
		//Adds new random piece to tetrmonio list
		const pieces = 'ILJOTSZ';
		const index = pieces.length * Math.random() | 0;
		const value = pieces[index];

		layout.push(value);
		return value;
	}

}

module.exports = Piece;