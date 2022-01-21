import { weightedCtrlp, deWeight, parameterize, deBoorKnots } from './NurbsLib.js';
import { Nurbs } from './Nurbs.js';

class NurbsCurve extends Nurbs {

	constructor( deg ) {

		super( deg );

	}

	get ctrlPoints() {

		if ( this.needsUpdate ) {

			const ctrlp = deWeight( this.ctrlpw );
			this.prm = parameterize( ctrlp, 'chordal' );
			this.knots = deBoorKnots( this.deg, this.prm );

		}

		return deWeight( this.ctrlpw );

	}

	get designPoints() {

		return deWeight( this.ctrlpw );

	}

	get parameter() {

		return this.prm;

	}

	add( v ) {

		this.ctrlpw.push( weightedCtrlp( v, 1.0 ) );
		this.needsUpdate = true;

	}

	remove( i ) {

		const removed = this.ctrlpw.splice( i, 1 );
		this.needsUpdate = true;
		return deWeight( removed[ 0 ] );

	}

	mod( i, v ) {

		this.ctrlpw[ i ] = weightedCtrlp( v, 1.0 );
		this.needsUpdate = true;

	}

	incert( i, v ) {

		this.ctrlpw.splice( i, 0, weightedCtrlp( v, 1.0 ) );
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

export { NurbsCurve };
