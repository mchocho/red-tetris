import React from 'react'

export default () => {
    return (
		<div className="modal main show">
				<div className="modal-content">
					<section className="menu">
						<form id="main-menu">
							<h2 id="articles">Red Tetris</h2>

							<label>
								<input type="radio" className="nes-radio" name="mode" value="multiplayer" />
								<span>Multiplayer</span>
							</label>

							<label>
								<input type="radio" className="nes-radio" name="mode" value="1-player" />
								<span>Single Player</span>
							</label>

							<label>
								<input type="radio" className="nes-radio" name="mode" value="2-player" />
								<span>2 Players</span>
							</label>

							<label>
								<input type="radio" className="nes-radio" name="mode" value="settings" />
								<span>Settings</span>
							</label>
						</form>
					</section>
				</div>
		</div>
	);
};