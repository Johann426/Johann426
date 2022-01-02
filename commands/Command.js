class CurveEditCommand {

	constructor( curve ) {

		this.curve = curve;

	}

	excute( action, points ) {

		const curve = this.curve;

		switch ( action ) {

			case 'Remove':

				if ( points.length > 0 ) {

					this.point = points[ 0 ];
					this.index = points[ 0 ].index;
					curve.remove( this.index );
					updateCurveBuffer( curve, buffer );
					updateLines( curve, selected.lines );

				}

				break;

		}

	}

	undo() {

		const curve = this.curve;
		curve.incertPointAt( this.index, this.point );
		updateCurveBuffer( curve, buffer );
		updateLines( curve, selected.lines );

	}

}
