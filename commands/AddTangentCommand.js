import { updateBuffer, updateLines } from '../Editor.js';

class AddTangentCommand {

	constructor( buffer, index, tangent ) {

		this.buffer = buffer;
		this.index = index;
		this.tangent = tangent;

	}

	execute() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;
		curve.addTangent( this.index, this.tangent );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

	undo() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;
		curve.removeTangent( this.index );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

}

export { AddTangentCommand };
