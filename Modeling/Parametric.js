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

	/**
	 * Find the closest parametric position on the curve from a given point.
	 *
	 * The distance from P to C(t) is minimized when f = 0, where f =  C'(t) • ( C(t) - P )
	 * To obtain the candidate parameter t, Newton iteration is used
	 *
	 * t* = t - f / f'
	 *
	 * where, conversion criteria 1,
	 *
	 * t* - t < e1
	 *
	 * and criteria 2,
	 *
	 * f = C'(t) • ( C(t) - P ) < e2
	 *
	 */
	closestPosition( v ) {

		// Evaluate curve points at n equally spaced parametric position
		let i, t, pts;
		t = 0;
		let min = this.getPointAt( 0 ).sub( v ).length();
		const n = 40;

		for ( i = 1; i <= n; i ++ ) {

			const d = this.getPointAt( i / n ).sub( v ).length();

			// choose one having the minimum distance from a given point as initial candidate.
			if ( d < min ) {

				t = i / n;
				min = d;

			}

		}

		i = 0;
		// Newton iteration
		while ( i < 20 ) {

			const ders = this.getDerivatives( t, 2 );
			pts = ders[ 0 ];
			const sub = pts.clone().sub( v );
			if ( sub.length() < 1E-9 ) break;
			// f =  C'(t) • ( C(t) - P )
			const f = ders[ 1 ].clone().dot( sub );
			// f' = C"(u) * ( C(u) - p ) + C'(u) * C'(u)
			const df = ders[ 2 ].clone().dot( sub ) + ders[ 1 ].clone().dot( ders[ 1 ] );
			const del = f / df;
			t -= del;

			if ( t > 1.0 ) t = 1.0;
			if ( t < 0.0 ) t = 0.0;

			// t* - t  < e1
			const cr1 = Math.abs( del ) < 1E-9; // is converged?

			// C' • ( C - P ) < e2
			const cr2 = Math.abs( f ) < 1E-9; // is orthogonal?

			if ( cr1 && cr2 ) {

				//console.log( 'criteria 1 ' + del );
				//console.log( 'criteria 2 ' + f );
				return [ t, pts ];

			}

			i ++;

			if ( i == 20 ) console.log( 'imax' );

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
