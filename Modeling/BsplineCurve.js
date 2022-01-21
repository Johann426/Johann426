import { parameterize, deBoorKnots } from './NurbsLib.js';
import { Bspline } from './Bspline.js';

class BsplineCurve extends Bspline {

	constructor( deg ) {

		super( deg );

	}

	get ctrlPoints() {

		if ( this.needsUpdate ) {

			this.prm = parameterize( this.ctrlp, 'chordal' );
			this.knots = deBoorKnots( this.deg, this.prm );

		}

		return this.ctrlp;

	}

	get designPoints() {

		return this.ctrlp;

	}

	get parameter() {

		return this.prm;

	}

	add( v ) {

		this.ctrlp.push( v );
		this.needsUpdate = true;

	}

	remove( i ) {

		const removed = this.ctrlp.splice( i, 1 );
		this.needsUpdate = true;
		return removed[ 0 ];

	}

	mod( i, v ) {

		this.ctrlp[ i ] = v;
		this.needsUpdate = true;

	}

	incert( i, v ) {

		this.ctrlp.splice( i, 0, v );
		this.needsUpdate = true;

	}

	incertPointAt( t, v ) {

		if ( t > 0.0 && t < 1.0 ) {

			const i = this.prm.findIndex( e => e > t );
			this.incert( i, v );

		}

	}

	incertClosestPoint( v ) {

		const e = this.closestPosition( v );
		const t = e[ 0 ];
		//const p = e[ 1 ];

		if ( t > 0.0 && t < 1.0 ) {

			const i = this.prm.findIndex( e => e > t );
			this.incert( i, v );
			return i;

		} else if ( t == 0 ) {

			this.incert( 0, v );
			return 0;

		} else if ( t == 1 ) {

			this.add( v );
			return this.prm.length;

		} else {

			console.warn( 'Parametric position is out of range' );

		}

	}

}

export { BsplineCurve };
