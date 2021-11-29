import { curvePoint, curveDers, globalCurveInterp } from './NurbsUtil.js';

class NurbsCurve {

	constructor( deg, knots, ctrlp ) {

		this.knots = knots;

		this.ctrlp = ctrlp;

		this.deg = () => {

			const nm1 = this.ctrlp.length - 1;

			return ( nm1 > deg ? deg : nm1 );

		};

	}
	
	getPointAt( t ) {

		return curvePoint( this.deg(), this.knots, this.ctrlp, t );

	}

	getPoints( n ) {

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			p[ i ] = curvePoint( this.deg(), this.knots, this.ctrlp, t );

		}

		return p;

	}

	getDerivatives( t, k ) {

		return curveDers( this.deg(), this.knots, this.ctrlp, t, k );

	}

	interrogating( n ) {

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			const ders = curveDers( this.deg(), this.knots, this.ctrlp, t, 2 );
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

	closestPoint( v ) {

		var t = 0;
		var l = curvePoint( this.deg(), this.knots, this.ctrlp, 0 ).sub( v ).length();

		for ( let i = 1; i <= 20; i ++ ) {

			const len = curvePoint( this.deg(), this.knots, this.ctrlp, i / 20 ).sub( v ).length();

			if ( len < l ) {

				t = i / 20;
				l = len;

			}

		}

		var i = 0;
		var isOrthogonal = false;
		var isConverged = false;

		while ( ! ( isOrthogonal || isConverged ) ) {

			const ders = curveDers( this.deg(), this.knots, this.ctrlp, t, 2 );
			const sub = ders[ 0 ].clone().sub( v );
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

		return curvePoint( this.deg(), this.knots, this.ctrlp, t );

	}

}

export { NurbsCurve };
