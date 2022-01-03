class Command {

	constructor( selected ) {

		this.selected = selected;

	}

	excute( action, points ) {

		const curve = this.selected.lines.curve;

		switch ( action ) {

			case 'Remove':

				if ( points.length > 0 ) {

					this.point = points[ 0 ].point;
					this.index = points[ 0 ].index;
					curve.remove( this.index );

				}

				break;

		}

	}

	undo() {

		const curve = this.selected.lines.curve;
		curve.incert( this.index, this.point );
		console.log( this.point );

	}

}

export { Command };
