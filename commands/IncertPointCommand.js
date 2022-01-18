import { updateBuffer, updateLines } from '../Editor.js';

class IncertPointCommand {

	constructor( buffer, point ) {

		this.buffer = buffer;
		this.point = point;

	}

	execute() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;
		// const p = curve.closestPosition( this.point );
		// curve.incertPointAt( p[ 0 ], p[ 1 ] );
		this.index = curve.incertClosestPoint( this.point );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

	undo() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;
		this.point = curve.remove( this.index );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

}

export { IncertPointCommand };
