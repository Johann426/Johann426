/*
 * Abstract class representing parametric form in geometric modeling
 */
class Parametric {

	constructor() {

	}

	getPointAt() {

		console.warn( 'getPointAt() not implemented.' );

	}

	getDerivatives() {

		console.warn( 'getDerivatives() not implemented.' );

	}

	getPoints( n ) {

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			p[ i ] = this.getPointAt( t );

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

	interrogating( n ) {

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			const ders = this.getDerivatives( t, 2 );
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

}

export { Parametric };
