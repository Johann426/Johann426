import { nurbsCurvePoint, nurbsCurveDers, deWeight, calcGreville, knotsInsert } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class Nurbs extends Parametric {

	constructor( deg ) {

		super();

		this.dmax = deg;

		this.knots = [];

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

		const prm = calcGreville( this.deg, this.knots );
		const pts = [];

		for ( let i = 0; i < prm.length; i ++ ) {

			pts.push( this.getPointAt( prm[ i ] ) );

		}

		return pts;

	}

	get weight() {

		return this.ctrlpw.map( e => e.w );

	}

	insertKnotAt( t = 0.5 ) {

		if ( t != 0.0 && t != 1.0 ) knotsInsert( this.deg, this.knots, this.ctrlpw, t );

	}

	getPointAt( t ) {

		return nurbsCurvePoint( this.deg, this.knots, this.ctrlpw, t );

	}

	getDerivatives( t, k ) {

		return nurbsCurveDers( this.deg, this.knots, this.ctrlpw, t, k );

	}

}

export { Nurbs };
