/*
 * If the given data consists of points (and constraints), this class provides methods to evaluate parameterized values, knot vector,
 * and a global algorithm to solve the linear equations finding unknown control points.
 * code by Johann426
 */
import { curvePoint, curveDers, parameterize, deBoorKnots, globalCurveInterp, globalCurveInterpTngt, knotsInsert } from './NurbsLib.js';
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

	get designPoints() {

		return this.pole.map( e => e.point );

	}

	add( v ) {

		this.pole.push( { point: v } );
		this.needsUpdate = true;

	}

	remove( i ) {

		this.pole.splice( i, 1 );
		this.needsUpdate = true;

	}

	mod( i, v ) {

		this.pole[ i ].point = v;
		this.needsUpdate = true;

	}

	incert( i, v ) {

		this.pole.splice( i, 0, { point: v } );
		this.needsUpdate = true;

	}

	incertPointAt( t, v ) {

		if ( t > 0.0 && t < 1.0 ) {

			const i = this.prm.findIndex( e => e > t );
			this.incert( i, v );

		}

	}

	addTangent( i, v ) {

		const chordL = getChordLength( this.pole.map( e => e.point ) );
		v.normalize().multiplyScalar( chordL * 0.5 );
		this.pole[ i ].slope = v;
		this.needsUpdate = true;

	}

	addKnuckle( i ) {

		console.warn( 'addKnuckle( i ) has been deprecated' );
		this.pole[ i ].knuckle = true;
		this.needsUpdate = true;

	}

	addKnuckle( i, v ) {

		if ( i == 0 || i == this.pole.length - 1 ) {

			v.length() == 0 ? null : this.addTangent( i, v );

		} else {

			const chordL = getChordLength( this.pole.map( e => e.point ) );
			v.normalize().multiplyScalar( chordL * 0.5 );
			this.pole[ i ].knuckle = v;
			this.needsUpdate = true;

		}

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

		this._assignEndDers();

		this.needsUpdate = false;

	}

	// After dividing a curve into local parts, assign end derivatives to each of coner points
	_assignEndDers() {

		const n = this.pole.length;
		const index = []; // index array of corner points
		index.push( 0 ); // the first into index

		for ( let i = 1; i < n; i ++ ) {

			this.pole[ i ].knuckle ? index.push( i ) : null; // knuckle into index

		}

		index.push( n - 1 ); // the last into index

		const lPole = []; // local pole points

		for ( let i = 1; i < index.length; i ++ ) {

			const tmp = this.pole.slice( index[ i - 1 ], index[ i ] + 1 );
			lPole.push( tmp.map( e => Object.assign( {}, e ) ) );

		}

		const nl = lPole.length;
		const lPrm = []; // local parameters
		const lKnot = []; // local knot vector
		const lCtrl = []; // local control points

		for ( let i = 0; i < nl; i ++ ) {

			const nm1 = lPole[ i ].length - 1;
			const deg = nm1 > this.deg ? this.deg : nm1;
			const pts = lPole[ i ].map( e => e.point );
			const prm = parameterize( pts, this.type );
			//const knot = calcKnots( deg, prm, lPole[ i ] );
			//const ctrl = globalCurveInterpTngt( deg, prm, knot, lPole[ i ] );
			const knot = deBoorKnots( deg, prm );
			const ctrl = globalCurveInterp( deg, prm, knot, pts );

			// specify end derivatives
			if ( nl > 1 ) {

				const p0 = lPole[ i ][ 0 ];
				const p1 = lPole[ i ][ nm1 ];
				const d0 = ctrl[ 1 ].clone().sub( ctrl[ 0 ] );
				const d1 = ctrl[ nm1 ].clone().sub( ctrl[ nm1 - 1 ] );
				const chordL = getChordLength( lPole[ i ].map( e => e.point ) );

				// at the first index
				if ( p0.slope == undefined ) {

					p0.slope = d0.normalize().mul( chordL );

				}

				// at the last index
				if ( p1.knuckle == undefined ) {

					if ( p1.slope == undefined ) {

						p1.slope = d1.normalize().mul( chordL );

					}

				} else {

					if ( p1.knuckle.length() == 0.0 ) {

						p1.slope = d1.normalize().mul( chordL );

					} else {

						p1.slope = lPole[ i ][ nm1 ].knuckle;

					}

				}

			}

			lPrm.push( prm );
			lKnot.push( calcKnots( this.deg, prm, lPole[ i ] ) );
			lCtrl.push( globalCurveInterpTngt( this.deg, prm, lKnot[ i ], lPole[ i ] ) );

		}

		this.prm = lPrm[ 0 ];
		this.knots = lKnot[ 0 ];
		this.ctrlp = lCtrl[ 0 ];

		for ( let i = 1; i < nl; i ++ ) {

			for ( let j = 0; j < lKnot[ i ].length; j ++ ) {

				lPrm[ i ][ j ] += i;
				lKnot[ i ][ j ] += i;

			}

			this.prm = this.prm.concat( lPrm[ i ].slice( 1 ) );
			this.knots = this.knots.slice( 0, - 1 ).concat( lKnot[ i ].slice( this.deg + 1 ) );
			this.ctrlp = this.ctrlp.concat( lCtrl[ i ].slice( 1 ) );

		}

		// normalize parameter 0 < t < 1
		for ( let j = 0; j < this.prm.length; j ++ ) {

			this.prm[ j ] /= nl;

		}

		// normalize knot vector
		for ( let j = 0; j < this.knots.length; j ++ ) {

			this.knots[ j ] /= nl;

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

function getChordLength( pts ) {

	const n = pts.length;
	var sum = 0.0;

	for ( let i = 1; i < n; i ++ ) {

		const del = pts[ i ].clone().sub( pts[ i - 1 ] );
		const len = del.length();
		sum += len;

	}

	return sum;

}

export { IntBspline };
