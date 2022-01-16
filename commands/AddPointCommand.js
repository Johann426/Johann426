import { updateBuffer, updateLines } from '../Editor.js';

class AddPointCommand {

	constructor( buffer, points ) {

		this.buffer = buffer;
		this.points = points;

	}

	excute() {

		const buffer = this.buffer;
		const points = this.points;
		const curve = buffer.pickable.selected.curve;

		if ( points.length > 0 ) {

		}

	}

	undo() {

	}

}

export { AddPointCommand };
