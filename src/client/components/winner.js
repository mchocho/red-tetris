import React from 'react'

export default () => {
	return (
		<div className="modal winner">
			<div className="modal-content">
				<section className="menu">
					<form id="winner">
						<h2>You won the game! <i className="nes-icon trophy is-large"></i></h2>

						<div className="modal-content">
							Continue

							<label>
								<input type="radio" className="nes-radio" name="try-again" value="Yes" />
								<span>Yes</span>
							</label>

							<label>
								<input type="radio" className="nes-radio" name="try-again" value="No" />
								<span>No</span>
							</label>
						</div>
					</form>
				</section>
			</div>
		</div>
	);
};