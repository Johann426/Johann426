/*
 * If the giiven data consists of only points (and constraints), on the basis of The NURBS Book,
 * this class provides a global algorithm to solve the linear equations to evaluate an unknown NURBS,
 * i.e., parameterized value, knot vector, and control points.
 * js code by Johann426.github
 */

import { NurbsUtil, Vector3 } from './NurbsUtil.js';

class NurbsSurface {

	constructor( ni, nj, points, deg, type = 'chordal' ) {

		this.ni = ni;
		this.nj = nj;
		this.points = points;
		this.pole = [];

		for ( let j = 0; j < nj; j ++ ) {

			this.pole[ j ] = [];

			for ( let i = 0; i < ni; i ++ ) {

				this.pole[ j ].push( { 'point': points[ j ][ i ] } );

			}

		}

		this.type = type;

		this.deg = () => {

			const nm1 = this.pole.length - 1;

			return ( nm1 > deg ? deg : nm1 );

		};

	}

	_calcCtrlPoints() {

		const ni = this.ni;
		const nj = this.nj;
		const points = this.points; //this.pole.map( e => e.point )
		this.para = this._parameterize( ni, nj, points, this.type );
		this.knots = this._calcKnots( ni, nj, this.deg(), this.para, this.pole );
		this.ctrlPoints = [];

		for ( let j = 0; j < nj; j ++ ) {

			this.ctrlPoints[ j ] = NurbsUtil.globalCurveInterp( this.deg(), this.para.row, this.knots.row, this.pole[ j ] );

		}

		for ( let i = 0; i < ni; i ++ ) {

			const r = [];

			for ( let j = 0; j < nj; j ++ ) {

				r[ j ] = { 'point': this.ctrlPoints[ j ][ i ] };

			}

			const ctrl = NurbsUtil.globalCurveInterp( this.deg(), this.para.col, this.knots.col, r );

			for ( let j = 0; j < nj; j ++ ) {

				this.ctrlPoints[ j ][ i ] = ctrl[ j ];

			}

		}

	}

	_calcKnots( ni, nj, deg, prm, pole ) {

		// const a = prm.row.slice();
		// var m = 0;

		// for ( let i = 0; i < n; i ++ ) {

		// 	const hasValue = pole[ i ].slope ? true : false;

		// 	if ( hasValue ) {

		// 		let one3rd, two3rd;

		// 		switch ( i ) {

		// 			case 0 :

		// 				one3rd = 0.6667 * prm[ 0 ] + 0.3333 * prm[ i + 1 ];
		// 				a.splice( 1, 0, one3rd );
		// 				break;

		// 			case nm1 :

		// 				one3rd = 0.6667 * prm[ nm1 ] + 0.3333 * prm[ nm1 - 1 ];
		// 				a.splice( nm1 + m, 0, one3rd );
		// 				break;

		// 			default :

		// 				one3rd = 0.6667 * prm[ i ] + 0.3333 * prm[ i - 1 ];
		// 				two3rd = 0.6667 * prm[ i ] + 0.3333 * prm[ i + 1 ];
		// 				a.splice( i + m, 0, one3rd );
		// 				a.splice( i + m + 1, 1, two3rd );

		// 		}

		// 		m ++;

		// 	}

		// }

		const knot = {

			'row': [],
			'col': []

		};

		knot.row = NurbsUtil.deBoorKnots( deg, prm.row ); //.sort( ( a, b ) => { return a - b } );
		knot.col = NurbsUtil.deBoorKnots( deg, prm.col );

		return knot;

	}

	_parameterize( ni, nj, points, curveType ) {

		const prm = {

			'row': [],
			'col': []

		};

		for ( let j = 0; j < nj; j ++ ) {

			let sum = 0.0;

			for ( let i = 1; i < ni; i ++ ) {

				const del = points[ j ][ i ].clone().sub( points[ j ][ i - 1 ] );
				const len = curveType === 'centripetal' ? Math.sqrt( del.length() ) : del.length();
				sum += len;
				prm.row[ i ] = sum;

			}

			prm.row[ 0 ] = 0.0;

			for ( let i = 1; i < ni; i ++ ) {

				prm.row[ i ] += prm.row[ i ] / sum / nj;

			}

			prm.row[ ni - 1 ] = 1.0; //last one to be 1.0 instead of 0.999999..

		}

		for ( let i = 0; i < ni; i ++ ) {

			let sum = 0.0;

			for ( let j = 1; j < nj; j ++ ) {

				const del = points[ j ][ i ].clone().sub( points[ j - 1 ][ i ] );
				const len = curveType === 'centripetal' ? Math.sqrt( del.length() ) : del.length();
				sum += len;
				prm.col[ j ] = sum;

			}

			prm.col[ 0 ] = 0.0;

			for ( let j = 1; j < nj; j ++ ) {

				prm.col[ j ] += prm.col[ j ] / sum / ni;

			}

			prm.col[ nj - 1 ] = 1.0; //last one to be 1.0 instead of 0.999999..

		}

		return prm;

	}

}

export { NurbsSurface };
