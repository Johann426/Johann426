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

		return deWeight( this.ctrlpw );

	}

	get designPoints() {


		const ctrlp = this.ctrlPoints;

		if ( this.needsUpdate ) {

			this.prm = parameterize( ctrlp, 'Chordal' );
			this.knots = calcKnots( this.deg, this.prm );

		}

		const pts = [];

		for ( let i = 0; i < this.prm.length; i ++ ) {

			pts.push( this.getPointAt( this.prm[ i ] ) );

		}

		return pts;

	}

	get weight() {

		return this.ctrlpw.map( e => e.w );

	}

	add( v ) {

		this.ctrlp.push( weightedCtrlp( v, 1.0 ) );
		this.needsUpdate = true;

	}

	mov( i, v ) {

		this.ctrlp[ i ] = v;
		this.needsUpdate = true;

	}

	insertKnotAt( t = 0.5 ) {

		if ( t != 0.0 && t != 1.0 ) knotsInsert( this.deg, this.knots, this.ctrlpw, t );
		this.needsUpdate = true;

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
