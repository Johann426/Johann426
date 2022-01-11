class RemovePointCommand {

	constructor( selected, points ) {

		//this.selected = selected;
		this.curve = selected.lines.curve;
		this.points = points;

	}

	excute() {

		const curve = this.curve; //selected.lines.curve;
		const points = this.points;

		if ( points.length > 0 ) {

			this.index = points[ 0 ].index;
			this.point = curve.remove( this.index );

		}

	}

	undo() {

		const curve = this.curve; //.selected.lines.curve;
		curve.incert( this.index, this.point );

	}

}

export { RemovePointCommand };
