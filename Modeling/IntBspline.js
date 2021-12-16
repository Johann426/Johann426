/*
 * If the given data consists of only points (and constraints), on the basis of The NURBS Book,
 * this class provides a global algorithm to solve the linear equations to evaluate an unknown B-Spline,
 * i.e., parameterized value, knot vector, and control points.
 * js code by Johann426.github
 */

import { curvePoint, curveDers, deBoorKnots, globalCurveInterp, knotsInsert } from './NurbsUtil.js';

class IntBspline {

	constructor( deg, type = 'chordal' ) {

		this.dmax = deg;

		this.type = type;

		this.pole = [];

		this.needsUpdate = false;

	}

	get deg() {

		const nm1 = this.pole.length - 1;
		return ( nm1 > this.dmax ? this.dmax : nm1 );

	}

	add( point ) {

		this.pole.push( { point: point } );
		this.needsUpdate = true;

	}

	mod( i, point ) {

		this.pole[ i ].point = point;
		this.needsUpdate = true;

	}

	incert( i, point ) {

		this.pole.splice( i, 0, { point: point } );
		this.needsUpdate = true;

	}

	remove( i ) {

		this.pole.splice( i, 1 );
		this.needsUpdate = true;

	}

	addTangent( i, v ) {

		const points = this.pole.map( e => e.point );
		const chordL = this.getChordLength( points );
		v.normalize().multiplyScalar( chordL );
		this.pole[ i ].slope = v;
		this.needsUpdate = true;

	}

	addKnuckle( i, v ) {

		this.pole[ i ].slope = v;
		this.needsUpdate = true;

	}

	removeTangent( i ) {

		this.pole[ i ].slope = undefined;
		this.needsUpdate = true;

	}

	insertKnotAt( t = 0.5 ) {

		if ( t != 0.0 && t != 1.0 ) knotsInsert( this.deg, this.knots, this.ctrlp, t );

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

		if ( this.needsUpdate ) this._calcCtrlPoints();
		return this.ctrlp;

	}

	getPointAt( t ) {

		if ( this.needsUpdate ) this._calcCtrlPoints();
		return curvePoint( this.deg, this.knots, this.ctrlp, t );

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

		if ( this.needsUpdate ) this._calcCtrlPoints();
		return curveDers( this.deg, this.knots, this.ctrlp, t, k );

	}

	interrogating( n ) {

		if ( this.needsUpdate ) this._calcCtrlPoints();

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			const ders = curveDers( this.deg, this.knots, this.ctrlp, t, 2 );
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

		if ( this.needsUpdate ) this._calcCtrlPoints();
		var t = 0;
		var l = curvePoint( this.deg, this.knots, this.ctrlp, 0 ).sub( v ).length();

		for ( let i = 1; i <= 20; i ++ ) {

			const len = curvePoint( this.deg, this.knots, this.ctrlp, i / 20 ).sub( v ).length();

			if ( len < l ) {

				t = i / 20;
				l = len;

			}

		}

		var i = 0;
		var isOrthogonal = false;
		var isConverged = false;

		while ( ! ( isOrthogonal || isConverged ) ) {

			const ders = curveDers( this.deg, this.knots, this.ctrlp, t, 2 );
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

		return t;

	}

	closestPoint( v ) {

		const t = this.closestPosition( v );
		return curvePoint( this.deg, this.knots, this.ctrlp, t );

	}

	_calcCtrlPoints() {

		const points = this.pole.map( e => e.point );
		this.param = parameterize( points, this.type );
		this.knots = calcKnots( this.deg, this.param, this.pole );
		this.ctrlp = globalCurveInterp( this.deg, this.param, this.knots, this.pole );
		this.needsUpdate = false;

	}

}

function parameterize( points, curveType ) {

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

function calcKnots( deg, prm, pole ) {

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



export { IntBspline };
