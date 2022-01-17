import { updateBuffer, updateLines } from '../Editor.js';

class RemovePointCommand {

	constructor( buffer, points ) {

		this.buffer = buffer;
		this.points = points;

	}

	execute() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;

		if ( this.points.length > 0 ) {

			this.index = this.points[ 0 ].index;
			this.point = curve.remove( this.index );

			updateBuffer( curve, buffer );
			updateLines( curve, buffer.pickable.selected );

		}

	}

	undo() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;
		curve.incert( this.index, this.point );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

}

export { RemovePointCommand };