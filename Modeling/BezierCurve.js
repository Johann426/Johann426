import { pointOnBezierCurve } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class BezierCurve extends Parametric {

	constructor() {

		super();

	}

	get ctrlPoints() {
	
		return this.ctrlp;

	}
	
	add( v ) {
		
		this.ctrlp.push( v );

	}
	
	getPoints( n ) {

		const p = [];
		
		for ( let i =0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			p[ i ] = this.getPointAt( t );

		}
		
		return p;

	}

	getPointAt ( t ) {

		return pointOnBezierCurve( this.ctrlp, t );

	}

}

export { BezierCurve };
