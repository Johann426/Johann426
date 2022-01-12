class RemovePointCommand {

	constructor( selected, points ) {

		this.curve = selected.curve;
		this.points = points;

	}

	execute() {

		const curve = this.curve;
		const points = this.points;

		if ( points.length > 0 ) {

			this.index = points[ 0 ].index;
			this.point = curve.remove( this.index );

		}

	}

	undo() {

		const curve = this.curve;
		curve.incert( this.index, this.point );

	}

}

export { RemovePointCommand };
