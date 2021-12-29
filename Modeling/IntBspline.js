/*
 * If the given data consists of points (and constraints), this class provides methods to evaluate parameterized values, knot vector,
 * and a global algorithm to solve the linear equations finding unknown control points.
 * code by Johann426
 */
import { curvePoint, curveDers, parameterize, deBoorKnots, globalCurveInterpTngt, knotsInsert } from './NurbsLib.js';
import { Parametric } from './Parametric.js';

class IntBspline extends Parametric {

	constructor( deg, type = 'chordal' ) {

		super();

		this.dmax = deg;

		this.type = type;

		this.pole = [];

	}

	get deg() {

		const nm1 = this.pole.length - 1;
		return ( nm1 > this.dmax ? this.dmax : nm1 );

	}

	get ctrlPoints() {

		if ( this.needsUpdate ) this._calcCtrlPoints();
		return this.ctrlp;

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
		v.normalize().multiplyScalar( chordL * 0.5 );
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

	getPointAt( t ) {

		if ( this.needsUpdate ) this._calcCtrlPoints();
		return curvePoint( this.deg, this.knots, this.ctrlp, t );

	}

	getDerivatives( t, k ) {

		if ( this.needsUpdate ) this._calcCtrlPoints();
		return curveDers( this.deg, this.knots, this.ctrlp, t, k );

	}

	interrogating( n ) {

		if ( this.needsUpdate ) this._calcCtrlPoints();

		return super.interrogating( n );

	}

	_calcCtrlPoints() {

		const points = this.pole.map( e => e.point );
		this.param = parameterize( points, this.type );

		//this.knots = calcKnotsMult( this.deg, this.param, this.pole );
		//this.ctrlp = globalCurveInterp( this.deg, this.param, this.knots, this.pole );

		this._assignEndDers();

		this.needsUpdate = false;

	}

	// Assign end derivatives at corner point. Written by Johann426
	_assignEndDers() {

		const n = this.pole.length;
		const index = []; // index array of corner points
		index.push( 0 ); // start point into index

		for ( let i = 1; i < n; i ++ ) {

			this.pole[ i ].knuckle == true ? index.push( i ) : null; // knuckle points into index

		}

		index.push( n - 1 ); // end point into index

		const lPole = []; // local pole points

		for ( let i = 1; i < index.length; i ++ ) {

			const tmp = this.pole.slice( index[ i - 1 ], index[ i ] + 1 );
			lPole.push( tmp.map( e => Object.assign( {}, e ) ) );

		}

		const lKnot = []; // local knot vector
		const lCtrl = []; // local control points

		for ( let i = 0; i < lPole.length; i ++ ) {

			const nm1 = lPole[ i ].length - 1;
			const deg = nm1 > this.deg ? this.deg : nm1;
			const pts = lPole[ i ].map( e => e.point );
			const prm = parameterize( pts, this.type );
			const knot = calcKnots( deg, prm, lPole[ i ] );
			//lPole[ i ].map( e => e.knuckle = undefined );
			const ctrl = globalCurveInterpTngt( deg, prm, knot, lPole[ i ] );
			const chordL = this.getChordLength( pts );

			if ( lPole.length > 1 ) {

				lPole[ i ][ 0 ].slope == undefined ? lPole[ i ][ 0 ].slope = ctrl[ 1 ].clone().sub( ctrl[ 0 ] ).normalize().mul( chordL ) : null;
				lPole[ i ][ nm1 ].slope == undefined ? lPole[ i ][ nm1 ].slope = ctrl[ nm1 ].clone().sub( ctrl[ nm1 - 1 ] ).normalize().mul( chordL ) : null;

			}

			lKnot.push( calcKnots( this.deg, prm, lPole[ i ] ) );
			lCtrl.push( globalCurveInterpTngt( this.deg, prm, lKnot[ i ], lPole[ i ] ) );

		}

		this.knots = lKnot[ 0 ];
		this.ctrlp = lCtrl[ 0 ];

		for ( let i = 1; i < lCtrl.length; i ++ ) {

			for ( let j = 0; j < lKnot[ i ].length; j ++ ) {

				lKnot[ i ][ j ] += i;

			}

			this.knots = this.knots.slice( 0, - 1 ).concat( lKnot[ i ].slice( this.deg + 1 ) );
			this.ctrlp = this.ctrlp.concat( lCtrl[ i ].slice( 1 ) );

		}

		for ( let j = 0; j < this.knots.length; j ++ ) {

			this.knots[ j ] /= lKnot.length;

		}

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
