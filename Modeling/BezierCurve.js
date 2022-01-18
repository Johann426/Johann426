import { pointOnBezierCurve } from './NurbsLib.js';
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

	getPoints( n ) {

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			p[ i ] = this.getPointAt( t );

		}

		return p;

	}

	getPointAt( t ) {

		return pointOnBezierCurve( this.ctrlp, t );

	}

}

export { BezierCurve };
