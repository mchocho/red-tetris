import React from 'react'

export default () => {
	return (
		<>
			<div id="game">

				<div className="player-list">
					<div className="content">
						<div id="player-count"></div>
						<ul className="nes-list is-disc">
							<div className="you"></div> 

							<div className="alt-players"></div>
						</ul>
					</div>
				</div>


				<div id="players"></div>

			</div>
		</>
	);
};