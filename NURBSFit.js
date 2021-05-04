
/*
If the giiven data consists of only points (and derivatives), this class provides a global algorithm, to solve
the linear equations to evaluate an unknown NURBS, i.e., knot vector, control points, and their parameters.
On the basis of The NURBS Book / js code by Johann426.github
*/

class NURBSFit {

	constructor( deg, type = 'chordal' ) {

		this.pole = []; //to store points, their parameterized value, and directional constraints(optional).

		this.type = type;

		this.deg = () => {

			const nm1 = this.pole.length - 1;

			return ( nm1 > deg ? deg : nm1 );

		};

	}

	add( point ) {

		this.pole.push( { 'point': point } );

	}

	mod( i, point ) {

		this.pole[ i ].point = point;

	}

	incert( i, point ) {

		this.pole.splice( i, 0, { 'point': point } );

	}

	remove( i ) {

		this.pole.splice( i, 1 );

	}

	addTangent( i, v ) {

		v.normalize().multiplyScalar( this.polyL );
		this.pole[ i ].slope = v;

	}

	getKnots() {

		const points = this.pole.map( e => e.point );
		calcKnots( this.type, this.deg(), points );

		return this.knots;

	}

	getCtrlPoints() {

		this._calcCtrlPoints();
		const p = this.ctrlPoints;

		return toVector3( p );

	}

	getPointAt( t ) {

		this._calcCtrlPoints();
		const p = this._curvePoint( this.deg(), t );

		return new THREE.Vector3( p.x, p.y, p.z );

	}

	getPoints( n ) {

		this._calcCtrlPoints();
		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			//call function curvePointUni(), if you prefer to use B-spline instead of NURBS.
			p.push( this._curvePoint( this.deg(), this.knots, this.ctrlPoints, t ) );

		}

		return toVector3( p );

	}

	getDerivatives( t, k ) {

		this._calcCtrlPoints();
		//call function curveDersUni(), if you prefer to use B-spline instead of NURBS.
		const ders = this._curveDers( this.deg(), this.knots, this.ctrlPoints, t, k );

		return toVector3( ders );

	}

	shapeInterrogation( n ) {

		this._calcCtrlPoints();

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			const ders = toVector3( this._curveDers( this.deg(), this.knots, this.ctrlPoints, t ) );
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
console.log(this)
		return p;

	}

	_calcCtrlPoints() {

		const points = this.pole.map( e => e.point );
		this._calcKnots( this.type, this.deg(), points );
		this._globalCurveInterp( this.deg(), this.knots, this.pole );

	}

	_parameterize( curveType, points ) {
		
		const n = points.length;
		const nm1 = n - 1;
		var sum = 0.0;

		for ( let i = 1; i < n; i ++ ) {

			const del = points[ i ].clone().sub( points[ i - 1 ] );
			const len = curveType === 'centripetal' ? Math.sqrt( del.length() ) : del.length();
			sum += len;

		}

		this.polyL = sum;
		this.pole[ 0 ].param = 0.0;

		for ( let i = 1; i < n; i ++ ) {

			const del = points[ i ].clone().sub( points[ i - 1 ] );
			const len = curveType === 'centripetal' ? Math.sqrt( del.length() ) : del.length();
			this.pole[ i ].param = this.pole[ i - 1 ].param + len / sum;

		}

		this.pole[ nm1 ].param = 1.0; //last one to be 1.0 instead of 0.999999..

	}

	_calcKnots( curveType, deg, points ) {

		const n = points.length;
		const nm1 = n - 1;
		const order = deg + 1;
		const knot = [];

		this._parameterize( curveType, points );
		const prm = this.pole.map( e => e.param );

		for ( let i = 0; i <= deg; i ++ ) {

			knot[ i ] = 0.0;

		}
		
		var sum = 0.0;

		for ( let i = 1; i <= n - order; i ++ ) {

			sum = 0.0;

			for ( let j = i; j < i + deg; j ++ ) {

				sum += prm[ j ];

			}

			sum /= deg;
			knot[ i + deg ] = sum;

		}

		for ( let i = 0; i <= deg; i ++ ) {

			knot[ i + n ] = 1.0;

		}

		for ( let i = 0; i < n; i ++ ) {

			const hasValue = this.pole[ i ].slope ? true : false;

			if ( hasValue ) {

				let one3rd, two3rd;
				//const span = this._findIndexSpan(deg, knot, n , this.pole[ i ].param)

				switch ( i ) {

					case 0 :
						
						one3rd = 0.6667 * prm[ 0 ] + 0.3333 * prm[ i + 1 ];
						knot.splice( i + deg, 0, one3rd );
						break ;

					case nm1 :
						
						one3rd = 0.6667 * prm[ nm1 ] + 0.3333 * prm[ nm1 - 1 ];
						knot.splice( i + deg, 0, one3rd );
						break ;

					default :

						one3rd = 0.6667 * prm[ i ] + 0.3333 * prm[ i - 1 ];
						two3rd = 0.6667 * prm[ i ] + 0.3333 * prm[ i + 1 ];
						knot.splice( i + deg - 1, 0, one3rd );
						knot.splice( i + deg, 1, two3rd );
						console.log(one3rd);
						console.log(two3rd);

				}
				
				

			}

		}

		// knot.sort( ( a, b ) => {

		// 	return a - b;

		// } );

		this.knots = knot;

	}

	/*
	Determine control points of interpolated curve. See The NURBS Book, page 369, algorithm A9.1
	Solve linear algebra of AX = B, Sum( Ni(Ui) * Pi ) = Qi, where i = 0..nm1
	*/
	_globalCurveInterp( deg, knot, pole ) {

		const n = pole.length;
		const point = this.pole.map( e => e.point );
		const slope = this.pole.map( e => e.slope ).filter( Boolean );
		var arr = [];

		if ( ! slope.length ) {

			for ( let i = 0; i < n; i ++ ) {

				const span = this._findIndexSpan( deg, knot, n, pole[ i ].param );
				const nj = this._basisFuncs( deg, knot, span, pole[ i ].param );
				arr[ i ] = new Array( n ).fill( 0.0 );

				for ( let j = 0; j <= deg; j ++ ) {

					arr[ i ][ span - deg + j ] = nj[ j ];

				}

			}

			var index = [];
			this.ctrlPoints = point.slice();
			ludcmp( n, arr, index );
			lubksb4D( n, arr, index, this.ctrlPoints )

		} else {

			const nps = n + slope.length;
			const b = new Array( nps ).fill( new THREE.Vector3() );

			// for ( let i = 0; i < nps; i ++ ) {

			// 	arr[ i ] = new Array( nps ).fill( 0.0 );

			// }


			var m = 0;

			for ( let i = 0; i < n; i ++ ) {

				const span = this._findIndexSpan( deg, knot, nps, pole[ i ].param );
				const nj = this._basisFuncs( deg, knot, span, pole[ i ].param );
				arr[ i + m ] = new Array( nps ).fill( 0.0 );

				for ( let j = 0; j <= deg; j ++ ) {

					arr[ i + m ][ span - deg + j ] = nj[ j ];

				}

				b[ i + m ] = point[ i ];

				const noSlope = pole[ i ].slope === undefined;

				if ( ! noSlope ) {

					m ++;
					arr[ i + m ] = new Array( nps ).fill( 0.0 );

					switch ( i ) {

						case 0 :

							arr[ i + m ][ 0 ] = - 1.0;
							arr[ i + m ][ 1 ] = 1.0;
							b[ i + m ] = pole[ i ].slope; // * chord
							break ;

						case n - 1 :

							arr[ i + m ][ nps - 2 ] = - 1.0;
							arr[ i + m ][ nps - 1 ] = 1.0;
							b[ i + m ] = pole[ i ].slope; // * chord
							break ;

						default :

							const span = this._findIndexSpan( deg, knot, nps, pole[ i ].param );
							const nder = this._dersBasisFunc( deg, knot, span, 1, pole[ i ].param );
							
							for ( let j = 0; j <= deg; j ++ ) {

								arr[ i + m ][ span - deg + j ] = nder[ 1 ][ j ];

							}

							b[ i + m ] = pole[ i ].slope; // * chord;

					}

				}

			}

			var index = [];
			this.ctrlPoints = b.slice();
			ludcmp( nps, arr, index );
			lubksb4D( nps, arr, index, this.ctrlPoints )

		}

	}

	/*
	Determine the span index of knot vector. See The NURBS Book, page 68, algorithm A2.1
	*/
	_findIndexSpan( deg, knot, n, t ) {

		const nm1 = n - 1;

		//Make sure the parameter t is within the knots range
		if ( t >= knot[ n ] ) return nm1; //special case of t at the curve end
		if ( t <= knot[ deg ] ) return deg;

		//Find index of ith knot span(half-open interval)
		var low = deg;
		var high = n;
		var mid = Math.floor( ( high + low ) / 2 );

		//Do binary search
		while ( t < knot[ mid ] || t >= knot[ mid + 1 ] ) {

			t < knot[ mid ] ? high = mid : low = mid;
			mid = Math.floor( ( high + low ) / 2 );

		}

		return mid;

	}

	/*
	Compute nonvanishing basis functions. See The NURBS Book, page 70, algorithm A2.2
	*/
	_basisFuncs( deg, knot, span, t ) {

		const left = [];
		const right = [];
		const ni = [];
		ni[ 0 ] = 1.0;

		for ( let j = 1; j <= deg; j ++ ) {

			left[ j ] = t - knot[ span + 1 - j ];
			right[ j ] = knot[ span + j ] - t;
			let saved = 0.0;

			for ( let k = 0; k < j; k ++ ) {

				const tmp = ni[ k ] / ( right[ k + 1 ] + left[ j - k ] );
				ni[ k ] = saved + right[ k + 1 ] * tmp;
				saved = left[ j - k ] * tmp;

			}

			ni[ j ] = saved;

		}

		return ni;

	}

	/*
	Compute nonzero basis functions and their derivatives. See The NURBS Book, page 72, algorithm A2.3.
		ders[k][j] is the kth derivative where 0 <= k <= n and 0 <= j <= degree
		n : number of derivatives to calculate
	*/
	_dersBasisFunc( deg, knot, span, n, t ) {

		const order = deg + 1;
		const ndu = Array.from( Array( order ), () => new Array( order ) );
		const ders = Array.from( Array( n + 1 ), () => new Array( order ) );
		const left = new Array( order );
		const right = new Array( order );

		ndu[ 0 ][ 0 ] = 1.0;

		for ( let j = 1; j <= deg; j ++ ) {

			left[ j ] = t - knot[ span + 1 - j ];
			right[ j ] = knot[ span + j ] - t;
			let saved = 0.0;

			for ( let r = 0; r < j; r ++ ) {

				// Lower triangle
				ndu[ j ][ r ] = right[ r + 1 ] + left[ j - r ];
				const tmp = ndu[ r ][ j - 1 ] / ndu[ j ][ r ];

				// Upper triangle
				ndu[ r ][ j ] = saved + right[ r + 1 ] * tmp;
				saved = left[ j - r ] * tmp;

			}

			ndu[ j ][ j ] = saved;

		}

		for ( let j = 0; j <= deg; j ++ ) {

			ders[ 0 ][ j ] = ndu[ j ][ deg ]; // Load the basis funcs

		}

		// This section computes the derivatives (Eq. [2.9])
		for ( let r = 0; r <= deg; r ++ ) {	//Loop over function index

			let s1 = 0;
			let s2 = 1;	// Alternative rows in array a
			// two most recently computed rows a(k,j) and a(k-1,j)
			const a = Array.from( Array( 2 ), () => new Array( order ) );
			a[ 0 ][ 0 ] = 1.0;

			for ( let k = 1; k <= n; k ++ ) {	// Loop to compute kth derivative

				let d = 0.0;
				const rk = r - k;
				const pk = deg - k;

				if ( r >= k ) {

					a[ s2 ][ 0 ] = a[ s1 ][ 0 ] / ndu[ pk + 1 ][ rk ];
					d = a[ s2 ][ 0 ] * ndu[ rk ][ pk ];

				}

				const j1 = rk >= - 1 ? 1 : - rk;
				const j2 = r - 1 <= pk ? k - 1 : deg - r;

				for ( let j = j1; j <= j2; j ++ ) {

					a[ s2 ][ j ] = ( a[ s1 ][ j ] - a[ s1 ][ j - 1 ] ) / ndu[ pk + 1 ][ rk + j ];
					d += a[ s2 ][ j ] * ndu[ rk + j ][ pk ];

				}

				if ( r <= pk ) {

					a[ s2 ][ k ] = - a[ s1 ][ k - 1 ] / ndu[ pk + 1 ][ r ];
					d += a[ s2 ][ k ] * ndu[ r ][ pk ];

				}

				ders[ k ][ r ] = d;
				const j = s1; s1 = s2; s2 = j; //Switch rows

			}

		}

		// Multiply through by the correct factors (Eq. [2.9])
		let r = deg;

		for ( let k = 1; k <= n; k ++ ) {

			for ( let j = 0; j <= deg; j ++ ) {

				ders[ k ][ j ] *= r;

			}

			r *= ( deg - k );

		}

		return ders;

	}

	/*
	Compute B-Spline curve points. See The NURBS Book, page 82, algorithm A3.1.
	*/
	_curvePointUni( deg, knot, ctrl, t ) {

		const span = this._findIndexSpan( deg, knot, ctrl.length, t );
		const nj = this._basisFuncs( deg, knot, span, t );
		var v = new THREE.Vector3( 0, 0, 0 );

		for ( let j = 0; j <= deg; j ++ ) {

			v.x += nj[ j ] * ctrl[ span - deg + j ].x;
			v.y += nj[ j ] * ctrl[ span - deg + j ].y;
			v.z += nj[ j ] * ctrl[ span - deg + j ].z;

		}

		return v;

	}

	/*
	Compute the point on a Non Uniform Rational B-Spline curve. See The NURBS Book, page 124, algorithm A4.1.
	*/
	_curvePoint( deg, knot, ctrl, t ) { // four-dimensional point (wx, wy, wz, w)

		const span = this._findIndexSpan( deg, knot, ctrl.length, t );
		const nj = this._basisFuncs( deg, knot, span, t );
		const v = new THREE.Vector4( 0, 0, 0, 0 );

		for ( let j = 0; j <= deg; j ++ ) {

			const wNj = ctrl[ span - deg + j ].w * nj[ j ];
			v.x += wNj * ctrl[ span - deg + j ].x;
			v.y += wNj * ctrl[ span - deg + j ].y;
			v.z += wNj * ctrl[ span - deg + j ].z;
			v.w += wNj;

		}

		return v;

	}

	/*
	Compute derivatives of a B-Spline. See The NURBS Book, page 93, algorithm A3.2.
	n : number of derivatives
	*/
	_curveDersUni( deg, knot, ctrl, t, n = 2 ) {

		const v = [];
		// We allow n > degree, although the ders are 0 in this case (for nonrational curves),
		// but these ders are needed for rational curves
		const span = this._findIndexSpan( deg, knot, ctrl.length, t );
		const nders = this._dersBasisFunc( deg, knot, span, n, t );

		for ( let k = 0; k <= n; k ++ ) {

			v[ k ] = new THREE.Vector3( 0, 0, 0 );

			for ( let j = 0; j <= deg; j ++ ) {

				v[ k ].x += nders[ k ][ j ] * ctrl[ span - deg + j ].x;
				v[ k ].y += nders[ k ][ j ] * ctrl[ span - deg + j ].y;
				v[ k ].z += nders[ k ][ j ] * ctrl[ span - deg + j ].z;

			}

		}

		return v;

	}


	/*
	Compute derivatives of a rational B-Spline. See The NURBS Book, page 127, algorithm A4.2.
	n : number of derivatives
	*/
	_curveDers( deg, knot, ctrl, t, n = 2 ) {

		const v = [];
		const span = this._findIndexSpan( deg, knot, ctrl.length, t );
		const nders = this._dersBasisFunc( deg, knot, span, n, t );

		for ( let k = 0; k <= n; k ++ ) {

			v[ k ] = new THREE.Vector4( 0, 0, 0, 0 );

			for ( let j = 0; j <= deg; j ++ ) {

				v[ k ].x += nders[ k ][ j ] * ctrl[ span - deg + j ].x;
				v[ k ].y += nders[ k ][ j ] * ctrl[ span - deg + j ].y;
				v[ k ].z += nders[ k ][ j ] * ctrl[ span - deg + j ].z;
				v[ k ].w += nders[ k ][ j ] * ctrl[ span - deg + j ].w;

			}

		}

		for ( let k = 0; k <= n; k ++ ) {

			for ( let i = 1; i <= k; i ++ ) {

				v[ k ].x -= binomial( k, i ) * v[ k ].w * v[ k - i ].x;
				v[ k ].y -= binomial( k, i ) * v[ k ].w * v[ k - i ].y;
				v[ k ].z -= binomial( k, i ) * v[ k ].w * v[ k - i ].z;

			}

			v[ k ].x /= v[ 0 ].w;
			v[ k ].y /= v[ 0 ].w;
			v[ k ].z /= v[ 0 ].w;

		}

		return v;

	}

}

function toVector3( v4 ) {

	const v3 = [];

	for ( let i = 0; i < v4.length; i ++ ) {

		v3.push( new THREE.Vector3( v4[ i ].x, v4[ i ].y, v4[ i ].z ) );

	}

	return v3;

}

/*
Compute binomial coefficient, k! / ( i! * ( k - i )! )
*/
function binomial( k, i ) {

	let nom = 1;

	for ( let j = 2; j <= k; j ++ ) {

		nom *= j;

	}

	let den = 1;

	for ( let j = 2; j <= i; j ++ ) {

		den *= j;

	}

	for ( let j = 2; j <= k - i; j ++ ) {

		den *= j;

	}

	return nom / den;

}

function ludcmp( n, a, indx ) {

	/*Given a matrix a[1..n][1..n], this routine replaces it by the LU decomposition of a rowwise
		permutation of itself. a and n are input. a is output, arranged as in equation (2.3.14) above;
		indx[1..n] is an output vector that records the row permutation effected by the partial
		pivoting; d is output as ±1 depending on whether the number of row interchanges was even
		or odd, respectively. This routine is used in combination with lubksb to solve linear equations
		or invert a matrix.*/

	var imax = n - 1;
	const TINY = 1e-20;
	const vv = [];	//vv stores the implicit scaling of each row.
	let big, dum, sum;

	//Loop over rows to get the implicit scaling information.
	for ( let i = 0; i <= n - 1; i ++ ) {

		big = 0.0;
		for ( let j = 0; j <= n - 1; j ++ )
			if ( Math.abs( a[ i ][ j ] ) > big ) big = Math.abs( a[ i ][ j ] );
		if ( big == 0.0 ) console.log( "Singular matrix(determinant is zero) in routine ludcmp" );
		//No nonzero largest element.
		vv[ i ] = 1.0 / big;

	}

	//This is the loop over columns of Crout's method.
	for ( let j = 0; j <= n - 1; j ++ ) {

		//This is equation (2.3.12) except for i = j.
		for ( let i = 0; i < j; i ++ ) {

			sum = a[ i ][ j ];
			for ( let k = 0; k < i; k ++ ) sum -= a[ i ][ k ] * a[ k ][ j ];
			a[ i ][ j ] = sum;

		}

		big = 0.0;	//Initialize for the search for largest pivot element.

		//This is i = j of equation (2.3.12) and i = j+1. . .N of equation (2.3.13).
		for ( let i = j; i <= n - 1; i ++ ) {

			sum = a[ i ][ j ];

			for ( let k = 0; k < j; k ++ ) {

				sum -= a[ i ][ k ] * a[ k ][ j ];

			}

			a[ i ][ j ] = sum;

			if ( vv[ i ] * Math.abs( sum ) >= big ) {

				//Is the figure of merit for the pivot better than the best so far?
				big = vv[ i ] * Math.abs( sum );
				imax = i;

			}

		}

		//Do we need to interchange rows?
		if ( j != imax ) {

			//Yes, do so...
			for ( let k = 0; k <= n - 1; k ++ ) {

				dum = a[ imax ][ k ];
				a[ imax ][ k ] = a[ j ][ k ];
				a[ j ][ k ] = dum;

			}

			vv[ imax ] = vv[ j ];	//Also interchange the scale factor.

		}

		indx[ j ] = imax;

		/*If the pivot element is zero the matrix is singular (at least to the precision of the
			algorithm). For some applications on singular matrices, it is desirable to substitute
			TINY for zero.*/
		if ( parseFloat( a[ j ][ j ] ) === 0 ) {

			a[ j ][ j ] = TINY;

		}

		if ( j != n - 1 ) {

			//Now, finally, divide by the pivot element.
			dum = 1.0 / ( a[ j ][ j ] );
			for ( let i = j + 1; i <= n - 1; i ++ ) a[ i ][ j ] *= dum;

		}

	}

	//return [ a, indx ];

}

function lubksb( n, a, indx, b ) {

	/*Solves the set of n linear equations A dot X = B. Here a[1..n][1..n] is input, not as the matrix
		A but rather as its LU decomposition, determined by the routine ludcmp. indx[1..n] is input
		as the permutation vector returned by ludcmp. b[1..n] is input as the right-hand side vector
		B, and returns with the solution vector X. a, n, and indx are not modified by this routine
		and can be left in place for successive calls with different right-hand sides b. This routine takes
		into account the possibility that b will begin with many zero elements, so it is efficient for use
		in matrix inversion.*/

	let i, ii, ip, j;
	let sum;
	ii = - 1;

	for ( i = 0; i <= n - 1; i ++ ) {

		/*When ii is set to a positive value, it will become the
			index of the first nonvanishing element of b. Wenow
			do the forward substitution, equation (2.3.6). The
			only new wrinkle is to unscramble the permutation
			as we go.*/
		ip = indx[ i ];
		sum = b[ ip ];
		b[ ip ] = b[ i ];

		if ( ii != - 1 ) {

			for ( j = ii; j <= i - 1; j ++ ) sum -= a[ i ][ j ] * b[ j ];

		} else if ( sum != 0.0 ) {

			ii = i;

		}

		/*A nonzero element was encountered, so from now on we
			will have to do the sums in the loop above.*/
		b[ i ] = sum;

	}

	//Now we do the backsubstitution, equation (2.3.7).
	for ( i = n - 1; i >= 0; i -- ) {

		sum = b[ i ];
		for ( j = i + 1; j <= n - 1; j ++ ) sum -= a[ i ][ j ] * b[ j ];
		b[ i ] = sum / a[ i ][ i ];		//Store a component of the solution vector.

	}

}

function lubksb4D( n, a, indx, b ) {

	const x = [];
	const y = [];
	const z = [];

	for ( let i = 0; i < n; i ++ ) {

		x.push( b[ i ].x );
		y.push( b[ i ].y );
		z.push( b[ i ].z );

	}

	lubksb( n, a, indx, x );
	lubksb( n, a, indx, y );
	lubksb( n, a, indx, z );

	for ( let i = 0; i < n; i ++ ) {

		b[ i ] = new THREE.Vector4( x[ i ], y[ i ], z[ i ], 1.0 );

	}

}