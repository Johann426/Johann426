import { nurbsCurvePoint, nurbsCurveDers, weightedCtrlp, deWeight, calcGreville, knotsInsert } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class NurbsCurve extends Parametric {

	constructor( deg, knots, ctrlp, weight ) {

		super();

		this.dmax = deg;

		this.knots = knots;

		this.ctrlpw = weightedCtrlp( ctrlp, weight );

	}

	get deg() {

		const nm1 = this.ctrlpw.length - 1;
		return ( nm1 > this.dmax ? this.dmax : nm1 );

	}

	get ctrlPoints() {

		return deWeight( this.ctrlpw );

	}

	get pole() {

		const prm = calcGreville( this.deg, this.knots );
		const pole = [];

		for ( let i = 0; i < prm.length; i ++ ) {

			pole.push( { point: this.getPointAt( prm[ i ] ) } );

		}

		//console.log( pole );
		return pole;

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

export { NurbsCurve };
