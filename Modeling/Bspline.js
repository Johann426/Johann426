import { curvePoint, curveDers, calcGreville, knotsInsert, knotsRefine } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class Bspline extends Parametric {

	constructor( deg ) {

		super();

		this.dmax = deg;

		this.knots = [];

		this.ctrlp = [];

	}

	get deg() {

		const nm1 = this.ctrlp.length - 1;
		return ( nm1 > this.dmax ? this.dmax : nm1 );

	}

	get ctrlPoints() {

		return this.ctrlp;

	}

	get designPoints() {

		const prm = calcGreville( this.deg, this.knots );
		const pts = [];

		for ( let i = 0; i < prm.length; i ++ ) {

			pts.push( this.getPointAt( prm[ i ] ) );

		}

		return pts;

	}

	insertKnotAt( t = 0.5 ) {

		if ( t != 0.0 && t != 1.0 ) knotsInsert( this.deg, this.knots, this.ctrlp, t );

	}

	refineKnot() {

		[ this.knots, this.ctrlp ] = knotsRefine( this.deg, this.knots, this.ctrlp, [ 0.3333, 0.6667, ] );

	}

	getPointAt( t ) {

		return curvePoint( this.deg, this.knots, this.ctrlp, t );

	}

	getDerivatives( t, k ) {

		return curveDers( this.deg, this.knots, this.ctrlp, t, k );

	}

}

export { Bspline };
