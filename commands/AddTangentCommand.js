import { updateBuffer, updateLines } from '../Editor.js';

class AddTangentCommand {

	constructor( buffer ) {

		this.buffer = buffer;


	}

	execute() {

		

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

	undo() {

		

		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

}

export { AddTangentCommand };
