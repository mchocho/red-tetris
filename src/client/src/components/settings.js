import React from 'react'

export default function Menu() {
	return (
		<div className="modal settings">
			<div className="modal-content">
				<section className="menu">
					<form id="settings">
						<h2>Settings</h2>

						<label>
							<input type="checkbox" value="toggleSounds" className="nes-checkbox" onChange={()=>{}} checked />
							<span>Enable sounds</span>
						</label>
				
						<label>
							<input type="checkbox" value="toggleColours" className="nes-checkbox" onChange={()=>{}} checked />
							<span>Disable colours</span>
						</label>

						<label>
							<input type="checkbox" value="togglePeers" className="nes-checkbox" />
							<span>Show peers game</span>
						</label>

						<button type="submit" className="nes-btn is-primary">Continue</button>						
					</form>
				</section>
			</div>
		</div>
	);
};