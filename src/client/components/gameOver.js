import React from 'react'

export default () => {
	return (
		<div className="modal game-over">
			<div className="modal-content">
				<section className="menu">
					<form id="game-over">
						<h2>Game over</h2>

						<div className="modal-content">
							Play again

							<label>
								<input type="radio" className="nes-radio" name="try-again" value="Yes" onChange={()=>{}} checked/>
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