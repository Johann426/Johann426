import { updateBuffer, updateLines } from '../Editor.js';

class AddKnuckleCommand {

	constructor( buffer, index, knuckle ) {

		this.buffer = buffer;
		this.index = index;
		this.knuckle = knuckle;

	}

	execute() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;
		curve.addKnuckle( this.index, this.knuckle );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

	undo() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;
		curve.removeKnuckle( this.index );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

}

export { AddKnuckleCommand };
