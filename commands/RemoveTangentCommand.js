import { updateBuffer, updateLines } from '../Editor.js';

class RemoveTangentCommand {

	constructor( buffer, points ) {

		this.buffer = buffer;
		this.points = points;

	}

	execute() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;

		if ( this.points.length > 0 ) {

			this.index = this.points[ 0 ].index;
			this.point = curve.removeTangent( this.index );

			updateBuffer( curve, buffer );
			updateLines( curve, buffer.pickable.selected );

		}

	}

	undo() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;
		curve.addTangent( this.index, this.point );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

}

export { RemoveTangentCommand };
