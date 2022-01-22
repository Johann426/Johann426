import { deCasteljau1, dersBezier } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class BezierCurve extends Parametric {

	constructor() {

		super();

		this.ctrlp = [];

	}

	get ctrlPoints() {

		return this.ctrlp;

	}

	get designPoints() {

		return this.ctrlp;

	}

	add( v ) {

		this.ctrlp.push( v );

	}

	remove( i ) {

		const removed = this.ctrlp.splice( i, 1 );
		return removed[ 0 ];

	}

	mod( i, v ) {

		this.ctrlp[ i ] = v;

	}

	incert( i, v ) {

		this.ctrlp.splice( i, 0, v );

	}

	getPointAt( t ) {

		//return pointOnBezierCurve( this.ctrlp, t );
		return deCasteljau1( this.ctrlp, t );

	}

	getDerivatives( t ) {

		return dersBezier( this.ctrlp, t );

	}

}

export { BezierCurve };
