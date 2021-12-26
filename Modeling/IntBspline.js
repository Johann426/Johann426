/*
 * If the given data consists of only points (and constraints), on the basis of The NURBS Book,
 * this class provides a global algorithm to solve the linear equations to evaluate an unknown B-Spline,
 * i.e., parameterized value, knot vector, and control points.
 * js code by Johann426.github
 */

import { curvePoint, curveDers, parameterize, deBoorKnots, globalCurveInterp, generalCurveInterp, knotsInsert, calcNodes } from './NurbsUtil.js';

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

	addKnuckle( i ) {

		this.pole[ i ].knuckle = true;
		this.needsUpdate = true;

	}

	removeKnuckle( i ) {

		this.pole[ i ].knuckle = undefined;
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

		//this.knots = calcKnotsMult( this.deg, this.param, this.pole );
		//this.ctrlp = generalCurveInterp( this.deg, this.param, this.knots, this.pole );

		this._assignEndDers();

		this.needsUpdate = false;

	}

	// Assign end derivatives at corner point. Written by Johann426
	_assignEndDers() {

		const n = this.pole.length;
		const index = [];
		index.push( 0 );

		for ( let i = 1; i < n; i ++ ) {

			this.pole[ i ].knuckle == true ? index.push( i ) : null;

		}

		index.push( n - 1 );

		const lPole = []; // local pole points

		for ( let i = 1; i < index.length; i ++ ) {

			const copy = this.pole.map( e => Object.assign( {}, e ) );
			lPole.push( copy.slice( index[ i - 1 ], index[ i ] + 1 ) );

		}


		this.vPole = this.pole.map( e => Object.assign( {}, e ) ); // virtual pole

		for ( let i = 0; i < lPole.length; i ++ ) {

			const nm1 = lPole[ i ].length - 1;
			const deg = nm1 > this.deg ? this.deg : nm1;
			const pts = lPole[ i ].map( e => e.point );
			const prm = parameterize( pts, this.type );
			const knot = calcKnots( deg, prm, lPole[ i ] );
			lPole[ i ].map( e => e.knuckle = undefined );
			const ctrl = generalCurveInterp( deg, prm, knot, lPole[ i ] );
			const chordL = this.getChordLength( pts );

			this.vPole[ index[ i ] ].slope == undefined ? this.vPole[ index[ i ] ].slope = ctrl[ 1 ].clone().sub( ctrl[ 0 ] ).normalize().mul( chordL ) : null;
			this.vPole[ index[ i ] + nm1 ].slope == undefined ? this.vPole[ index[ i ] + nm1 ].slope = ctrl[ nm1 ].clone().sub( ctrl[ nm1 - 1 ] ).normalize().mul( chordL ) : null;

		}

		console.log( this.vPole );

		this.knots = calcKnotsMult( this.deg, this.param, this.vPole );
		this.ctrlp = generalCurveInterp( this.deg, this.param, this.knots, this.vPole );

	}

}



function calcKnots( deg, prm, pole ) {

	const n = pole.length;
	const nm1 = n - 1;
	const a = prm.slice();
	var m = 0;

	for ( let i = 0; i < n; i ++ ) {

		const hasSlope = pole[ i ].slope ? true : false;

		if ( hasSlope ) {

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

	return deBoorKnots( deg, a ); //uniformlySpacedknots( deg, a.length ); need parameter at basis maxima

}

function calcKnotsMult( deg, prm, pole ) {

	const knots = calcKnots( deg, prm, pole );
	const n = pole.length;
	let m = 0;

	for ( let i = 0; i < n; i ++ ) {

		if ( pole[ i ].slope ) m ++;

		if ( pole[ i ].knuckle ) {

			// knots multiplicity preliminary algorism... only works for deg = 3
			const index = deg + 1 + ( i + m - deg + 1 );
			knots[ index - 1 ] = knots[ index ];
			knots[ index + 1 ] = knots[ index ];

		}

	}

	return knots; //.sort( ( a, b ) => { return a - b } );

}

export { IntBspline };
