import React from 'react'

export default () => {
	return (
		<>
			<div id="game">

				<div className="player-list">
					<ul className="nes-list is-disc">
						<li className="you"></li> 

						<div className="alt-players">
						</div>

					</ul>
				</div>

				<div id="players"></div>

			</div>
		</>
	);
};