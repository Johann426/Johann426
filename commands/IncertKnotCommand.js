import { updateBuffer, updateLines } from '../Editor.js';

class IncertKnotCommand {

	constructor( buffer, point ) {

		this.buffer = buffer;
		this.point = point;

	}

	execute() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;

		const t = curve.closestPosition( this.point )[ 0 ];
		curve.insertKnotAt( t );

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

	undo() {

		const buffer = this.buffer;
		const curve = buffer.pickable.selected.curve;

		// implement curve.removeknot();

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

}

export { IncertKnotCommand };
