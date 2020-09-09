import React from 'react'

export default function Menu() {
	return (
		<div className="modal multiplayer">
			<div className="modal-content">
				<section className="menu">
					<form id="start-game">
						<h3>Game Room</h3>
							
						<div className="game-link">
							<span className="url"></span>
						</div>

						<div className="player-list">
							<h4>Player list</h4>
							
							<div className="lists">
								<ul className="nes-list is-disc">
									<li>
										<span className="you"></span>
										<span>(You)</span>
									</li>

									<div className="alt-players"></div>
								</ul>
							</div>
						</div>

						<div className="error_message">
							Shit... Something happened
						</div>

						<div>
							<p className="cmd"></p>
						</div>
					</form>
				</section>
			</div>
		</div>
	);
};