import React from 'react'

export default () => {
	return (
		<div className="modal pause">
				<div className="modal-content">
					<section className="menu">
						<form id="pause">
							<h2>Paused</h2>

							<label>
								<input type="radio" className="nes-radio" name="mode" value="continue" />
								<span>Continue</span>
							</label>

							<label>
								<input type="radio" className="nes-radio" name="mode" value="quit" />
								<span>Quit</span>
							</label>

						</form>
					</section>
				</div>
		</div>
	);
}