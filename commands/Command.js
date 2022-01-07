class Command {

	constructor( selected, points ) {

		this.selected = selected;
		this.points = points;

	}

	excute() {

		const curve = this.selected.lines.curve;
		const points = this.points;

		// 'Remove'

		if ( points.length > 0 ) {

			this.point = points[ 0 ].point;
			this.index = points[ 0 ].index;
			curve.remove( this.index );

		}

	}

	undo() {

		const curve = this.selected.lines.curve;
		curve.incert( this.index, this.point );

	}

}

export { Command };
