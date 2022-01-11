import { nurbsCurvePoint, nurbsCurveDers, weightedCtrlp, deWeight, calcGreville, knotsInsert, parameterize, deBoorKnots } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class NurbsCurve extends Parametric {

	constructor( deg ) {

		super();

		this.dmax = deg;

		this.ctrlpw = [];

	}

	get deg() {

		const nm1 = this.ctrlpw.length - 1;
		return ( nm1 > this.dmax ? this.dmax : nm1 );

	}

	get ctrlPoints() {

		const ctrlp = deWeight( this.ctrlpw );

		if ( this.needsUpdate ) {

			this.prm = parameterize( ctrlp, 'chordal' );
			this.knots = calcKnots( this.deg, this.prm );

		}

		return deWeight( this.ctrlpw );

	}

	get designPoints() {

		return deWeight( this.ctrlpw );

	}

	get weight() {

		return this.ctrlpw.map( e => e.w );

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

	insertKnotAt( t = 0.5 ) {

		if ( t != 0.0 && t != 1.0 ) knotsInsert( this.deg, this.knots, this.ctrlpw, t );
		console.log( this.knots );

	}

	getPointAt( t ) {

		return nurbsCurvePoint( this.deg, this.knots, this.ctrlpw, t );

	}

	getDerivatives( t, k ) {

		return nurbsCurveDers( this.deg, this.knots, this.ctrlpw, t, k );

	}

}


function calcKnots( deg, prm ) {

	return deBoorKnots( deg, prm );

}

export { NurbsCurve };
