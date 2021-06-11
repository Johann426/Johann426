/*
 * If the given data consists of only points (and constraints), on the basis of The NURBS Book,
 * this class provides a global algorithm to solve the linear equations to evaluate an unknown NURBS,
 * i.e., parameterized value, knot vector, and control points.
 * js code by Johann426.github
 */

import { curvePoint, curveDers, globalCurveInterp, deBoorKnots, deWeight } from './NurbsUtil.js';

class NurbsCurve {

	constructor( deg, type = 'chordal' ) {

		this.pole = [];

		this.type = type;

		this.deg = () => {

			const nm1 = this.pole.length - 1;

			return ( nm1 > deg ? deg : nm1 );

		};

	}

	add( point ) {

		this.pole.push( { point: point } );

	}

	mod( i, point ) {

		this.pole[ i ].point = point;

	}

	incert( i, point ) {

		this.pole.splice( i, 0, { point: point } );

	}

	remove( i ) {

		this.pole.splice( i, 1 );

	}

	addTangent( i, v ) {

		const points = this.pole.map( e => e.point );
		const chordL = this.getChordLength( points );
		v.normalize().multiplyScalar( chordL );
		this.pole[ i ].slope = v;

	}

	removeTangent( i ) {

		this.pole[ i ].slope = undefined;

	}

	getChordLength( points ) {

		const n = points.length;
		var sum = 0.0;

		for ( let i = 1; i < n; i ++ ) {

			const del = points[ i ].clone().sub( points[ i - 1 ] );
			const len = del.length();
			sum += len;

		}

		return sum;

	}

	getCtrlPoints() {

		this._calcCtrlPoints();
		return deWeight( this.ctrlp );

	}

	getPointAt( t ) {

		this._calcCtrlPoints();
		return curvePoint( this.deg(), this.knots, this.ctrlp, t );

	}

	getPoints( n ) {

		this._calcCtrlPoints();
		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			p[ i ] = curvePoint( this.deg(), this.knots, this.ctrlp, t );

		}

		return p;

	}

	getDerivatives( t, k ) {

		this._calcCtrlPoints();
		return curveDers( this.deg(), this.knots, this.ctrlp, t, k );

	}

	interrogating( n ) {

		this._calcCtrlPoints();

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

		this._calcCtrlPoints();
		const t0 = 0.5;
		var i = 0;
		var t = t0;
		var isOrthogonal = false;
		var isConverged = false;
		const ders = curveDers( this.deg(), this.knots, this.ctrlp, t, 2 );
		while ( ! ( isOrthogonal || isConverged ) ) {

			const sub = ders[ 0 ].clone().sub( v );
			console.log( sub );
			if ( sub < 1E-9 ) break;
			const del = ders[ 1 ].dot( sub ) / ( ders[ 2 ].dot( sub ) + ders[ 1 ].dot( ders[ 1 ] ) );
			t -= del;

			if ( t > 1.0 ) {

				t = 1.0;

			}

			if ( t < 0.0 ) {

				t = 0.0;

			}

			isOrthogonal = Math.abt( ders[ 1 ].dot( sub ) ) < 1E-9;
			isConverged = ( ders[ 1 ].mul( t - t0 ) ) < 1E-9;
			i ++;
			if ( i > 20 ) break;

		}

	}

	_calcCtrlPoints() {

		const points = this.pole.map( e => e.point );
		this.param = this._parameterize( points, this.type );
		this.knots = this._calcKnots( this.deg(), this.param, this.pole );
		this.ctrlp = globalCurveInterp( this.deg(), this.param, this.knots, this.pole );

	}

	_calcKnots( deg, prm, pole ) {

		const n = pole.length;
		const nm1 = n - 1;
		const a = prm.slice();
		var m = 0;

		for ( let i = 0; i < n; i ++ ) {

			const hasValue = pole[ i ].slope ? true : false;

			if ( hasValue ) {

				let one3rd, two3rd;

				switch ( i ) {

					case 0 :

						one3rd = 0.6667 * prm[ 0 ] + 0.3333 * prm[ i + 1 ];
						a.splice( 1, 0, one3rd );
						break;

					case nm1 :

						one3rd = 0.6667 * prm[ nm1 ] + 0.3333 * prm[ nm1 - 1 ];
						a.splice( nm1 + m, 0, one3rd );
						break;

					default :

						one3rd = 0.6667 * prm[ i ] + 0.3333 * prm[ i - 1 ];
						two3rd = 0.6667 * prm[ i ] + 0.3333 * prm[ i + 1 ];
						a.splice( i + m, 0, one3rd );
						a.splice( i + m + 1, 1, two3rd );

				}

				m ++;

			}

		}

		return deBoorKnots( deg, a ); //.sort( ( a, b ) => { return a - b } );

	}

	_parameterize( points, curveType ) {

		const n = points.length;
		const prm = [];
		var sum = 0.0;

		for ( let i = 1; i < n; i ++ ) {

			const del = points[ i ].clone().sub( points[ i - 1 ] );
			const len = curveType === 'centripetal' ? Math.sqrt( del.length() ) : del.length();
			sum += len;
			prm[ i ] = sum;

		}

		prm[ 0 ] = 0.0;

		for ( let i = 1; i < n; i ++ ) {

			prm[ i ] /= sum;

		}

		prm[ n - 1 ] = 1.0; //last one to be 1.0 instead of 0.999999..
		return prm;

	}

}

export { NurbsCurve };
