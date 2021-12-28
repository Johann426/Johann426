import { nurbsCurvePoint, nurbsCurveDers, weightedCtrlp, deWeight, calcGreville, knotsInsert } from './NurbsLib.js';

class NurbsCurve {

	constructor( deg, knots, ctrlp, weight ) {

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

	getPoints( n ) {

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			p[ i ] = this.getPointAt( t );

		}

		return p;

	}

	getDerivatives( t, k ) {

		return nurbsCurveDers( this.deg, this.knots, this.ctrlpw, t, k );

	}

	interrogating( n ) {

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			const ders = nurbsCurveDers( this.deg, this.knots, this.ctrlpw, t, 2 );
			const binormal = ders[ 1 ].clone().cross( ders[ 2 ] );
			const normal = binormal.clone().cross( ders[ 1 ] );

			p.push( {

				point: ders[ 0 ],
				curvature: binormal.length() / ders[ 1 ].length() ** 3,
				tangent: ders[ 1 ].normalize(),
				normal: normal.normalize(),
				binormal: binormal.normalize()

			} );

		}

		return p;

	}

	closestPosition( v ) {

		let t = 0;
		let l = this.getPointAt( 0 ).sub( v ).length();

		for ( let i = 1; i <= 20; i ++ ) {

			const len = this.getPointAt( i / 20 ).sub( v ).length();

			if ( len < l ) {

				t = i / 20;
				l = len;

			}

		}

		let i = 0;
		let pts;
		let isOrthogonal = false;
		let isConverged = false;

		while ( ! ( isOrthogonal || isConverged ) ) {

			const ders = this.getDerivatives( t, 2 );
			pts = ders[ 0 ];
			const sub = pts.clone().sub( v );
			if ( sub.length() < 1E-9 ) break;
			const del = ders[ 1 ].dot( sub ) / ( ders[ 2 ].dot( sub ) + ders[ 1 ].dot( ders[ 1 ] ) );
			t -= del;

			if ( t > 1.0 ) {

				t = 1.0;

			}

			if ( t < 0.0 ) {

				t = 0.0;

			}

			isOrthogonal = Math.abs( ders[ 1 ].dot( sub ) ) < 1E-9;
			isConverged = ( ders[ 1 ].clone().mul( del ) ) < 1E-9;
			i ++;
			if ( i > 20 ) break;

		}

		return [ t, pts ];

	}

	closestPoint( v ) {

		const res = this.closestPosition( v );
		return res[ 1 ];

	}

}

export { NurbsCurve };
