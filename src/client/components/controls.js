import React from 'react'

export default () => {
	return (
		<div className="modal controls">
				<div className="modal-content">
					<section className="menu">
						<form id="controls">
							<h2>Controls</h2>

							<table>
								<tbody>
									<tr>
										<th>Action</th>
										<th>Player 1</th>
										<th>Player 2</th>
									</tr>
									<tr>
										<td>Move left</td>
										<td>Left key</td>
										<td>NUMPAD 4</td>
									</tr>
									<tr>
										<td>Move right</td>
										<td>Right key</td>
										<td>NUMPAD 6</td>
									</tr>
									<tr>
										<td>Rotate <span>&#8635;</span></td>
										<td>Up key / R key</td>
										<td>NUMPAD 8</td>
									</tr>
									<tr>
										<td>Push down</td>
										<td>Down key</td>
										<td>NUMPAD 5</td>
									</tr>
									<tr>
										<td>Drop in pile</td>
										<td>D key</td>
										<td>NUMPAD 2</td>
									</tr>
									<tr>
										<td>Rotate <span>&#8634;</span></td>
										<td>Q key</td>
										<td>NUMPAD 7</td>
									</tr>
									<tr>
										<td>Pause</td>
										<td>P key</td>
										<td>-</td>
									</tr>
								</tbody>
							</table>

						</form>
					</section>
				</div>
		</div>
	);
}