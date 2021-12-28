import { ludcmp, lubksb } from './Solver.js';

/*
 * Assign parametric values to each point by chordal length (or centripetal) method.
 */
function parameterize( points, curveType ) {

	const n = points.length;
	const prm = [];
	var sum = 0.0;

	for ( let i = 1; i < n; i ++ ) {

		const del = points[ i ].clone().sub( points[ i - 1 ] );
		const len = curveType === 'chordal' ? del.length() : Math.sqrt( del.length() ); // Otherwise, use centripetal
		sum += len;
		prm[ i ] = sum;

	}

	prm[ 0 ] = 0.0;

	for ( let i = 1; i < n; i ++ ) {

		prm[ i ] /= sum;

	}

	prm[ n - 1 ] = 1.0;

	return prm;

}

/*
 * Having multiplicity of degree + 1 at corner, assign knot vector averaged over degree number of parameters.
 */
function deBoorKnots( deg, prm ) {

	const n = prm.length;
	const knot = [];

	for ( let i = 0; i <= deg; i ++ ) {

		knot[ i ] = 0.0;
		knot[ i + n ] = 1.0;

	}

	for ( let i = 1; i < n - deg; i ++ ) {

		let sum = 0.0;

		for ( let j = i; j < i + deg; j ++ ) {

			sum += prm[ j ];

		}

		knot[ i + deg ] = sum / deg;

	}

	return knot;

}

/*
 * Assign uniformly spaced knot vector.
 */
function uniformlySpacedknots( deg, n ) {

	const knot = [];

	for ( let i = 0; i <= deg; i ++ ) {

		knot[ i ] = 0.0;
		knot[ i + n ] = 1.0;

	}

	for ( let i = 1; i < n - deg; i ++ ) {

		for ( let j = i; j < i + deg; j ++ ) {

			knot[ i + deg ] = i / ( n - deg );

		}

	}

	return knot;

}

/*
 * Compute Greville points (Greville abscissae) averaged over degree number of knots
 */
function calcGreville( deg, knot ) {

	const prm = [];

	for ( let i = 1; i < knot.length - deg; i ++ ) {

		let sum = 0;

		for ( let j = i; j < i + deg; j ++ ) {

			sum += knot[ j ];

		}

		prm.push( sum / deg );

	}

	return prm;

}

/*
 * Compute the value of nth-degree Bernstein polynomials. See The NURBS Book, page 20, algorithm A1.2
 * i : index number
 * n : number of control points
 * t : parametric point
 */
function basisBernstein( i, n, t ) {

	const nm1 = n - 1;
	const t1 = 1.0 - t;
	const arr = new Array( n ).fill( 0.0 );
	arr[ nm1 - 1 ] = 1.0;

	for ( let j = 1; j <= nm1; j ++ ) {

		for ( let i = nm1; i >= j; i -- ) {

			arr[ i ] = t1 * arr[ i ] + t * arr[ i - 1 ];

		}

	}

	return arr[ nm1 ];

}

/*
 * Compute all nth-degree Bernstein polynomials. See The NURBS Book, page 21, algorithm A1.3
 * n : number of control points
 * t : parametric point
 */
function allBernstein( n, t ) {

	const t1 = 1.0 - t;
	const arr = new Array( n );
	arr[ 0 ] = 1.0;

	for ( let j = 1; j < n; j ++ ) {

		let saved = 0.0;

		for ( let i = 0; i < j; i ++ ) {

			const tmp = arr[ i ];
			arr[ i ] = saved * t1 * tmp;
			saved = t * tmp;

		}

		arr[ j ] = saved;

	}

	return arr;

}

/*
 * Compute point on Bezier curve. See The NURBS Book, page 22, algorithm A1.4
 * ctrl : control points
 * t : parameteric point
 */
function pointOnBezierCurve( ctrl, t ) {

	const n = ctrl.length;
	const v = new Vector3( 0, 0, 0 );
	const b = allBernstein( n, t );

	for ( let j = 0; j < n; j ++ ) {

		v.x += b[ j ] * ctrl[ j ].x;
		v.y += b[ j ] * ctrl[ j ].y;
		v.z += b[ j ] * ctrl[ j ].z;

	}

	return v;

}

/*
 * Compute point on Bezier curve by deCasteljau algorithm. See The NURBS Book, page 24, algorithm A1.5
 * ctrl : control points
 * t : parameteric point
 */
function deCasteljau1( ctrl, t ) {

	const n = ctrl.length;
	const sum = [];

	for ( let j = 1; j < n; j ++ ) {

		sum[ j ] = ctrl[ j ].clone();

		for ( let i = 0; i < n - j; i ++ ) {

			sum[ i ] = sum[ i ].clone().mul( 1.0 - t ).add( sum[ i + 1 ].clone().mul( t ) );

		}

	}

	return sum[ 0 ];

}

/*
 * Determine the span index of knot vector in which parameter lies. See The NURBS Book, page 68, algorithm A2.1
 * deg : degree
 * knot : knot vector
 * n : number of control points
 * t : parameteric point
 */
function findIndexSpan( deg, knot, n, t ) {

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
 * Compute nonvanishing basis functions. See The NURBS Book, page 70, algorithm A2.2
 * deg : degree
 * knot : knot vector
 * span : index of knot vector at a parametric point
 * t : parameteric point
 */
function basisFuncs( deg, knot, span, t ) {

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
 * Compute nonzero basis functions and their derivatives, up to and including nth derivatives. See The NURBS Book, page 72, algorithm A2.3.
 * ders[k][j] is the kth derivative where 0 <= k <= n and 0 <= j <= degree
 * deg : degree
 * knot : knot vector
 * span : index of knot vector at a parametric point
 * n : order of the highest derivative to compute
 * t : parameteric point
 */
function dersBasisFunc( deg, knot, span, n, t ) {

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
 * Compute B-Spline curve point. See The NURBS Book, page 82, algorithm A3.1.
 * deg : degree
 * knot : knot vector
 * ctrl : control points
 * t : parameteric point
*/
function curvePoint( deg, knot, ctrl, t ) {

	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const nj = basisFuncs( deg, knot, span, t );
	const v = new Vector3( 0, 0, 0 );

	for ( let j = 0; j <= deg; j ++ ) {

		v.x += nj[ j ] * ctrl[ span - deg + j ].x;
		v.y += nj[ j ] * ctrl[ span - deg + j ].y;
		v.z += nj[ j ] * ctrl[ span - deg + j ].z;

	}

	return v;

}

/*
 * Compute derivatives of a B-Spline. See The NURBS Book, page 93, algorithm A3.2.
 * deg : degree
 * knot : knot vector
 * ctrl : control points
 * t : parameteric point
 * n : order of the highest derivative to compute (default value is 2)
 */
function curveDers( deg, knot, ctrl, t, n = 2 ) {

	const v = [];
	// We allow n > degree, although the ders are 0 in this case (for nonrational curves),
	// but these ders are needed for rational curves
	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const nders = dersBasisFunc( deg, knot, span, n, t );

	for ( let k = 0; k <= n; k ++ ) {

		v[ k ] = new Vector3( 0, 0, 0 );

		for ( let j = 0; j <= deg; j ++ ) {

			v[ k ].x += nders[ k ][ j ] * ctrl[ span - deg + j ].x;
			v[ k ].y += nders[ k ][ j ] * ctrl[ span - deg + j ].y;
			v[ k ].z += nders[ k ][ j ] * ctrl[ span - deg + j ].z;

		}

	}

	return v;

}

/*
 * Compute B-Spline surface point. See The NURBS Book, page 103, algorithm A3.5.
 * degU, degV : degrees of B-Spline surface
 * knotU, knotV : knot vectors
 * ctrl : control points
 * t1, t2 : parametric points
*/
function surfacePoint( n, m, degU, degV, knotU, knotV, ctrl, t1, t2 ) {

	const spanU = findIndexSpan( degU, knotU, n, t1 );
	const spanV = findIndexSpan( degV, knotV, m, t2 );
	const ni = basisFuncs( degU, knotU, spanU, t1 );
	const nj = basisFuncs( degV, knotV, spanV, t2 );
	const v = new Vector3( 0, 0, 0 );

	for ( let j = 0; j <= degV; j ++ ) {

		const index = spanV - degV + j;
		const tmp = new Vector3( 0, 0, 0 );
		for ( let i = 0; i <= degU; i ++ ) {

			tmp.x += ni[ i ] * ctrl[ index ][ spanU - degU + i ].x;
			tmp.y += ni[ i ] * ctrl[ index ][ spanU - degU + i ].y;
			tmp.z += ni[ i ] * ctrl[ index ][ spanU - degU + i ].z;

		}

		v.x += nj[ j ] * tmp.x;
		v.y += nj[ j ] * tmp.y;
		v.z += nj[ j ] * tmp.z;

	}

	return v;

}

/*
 * Compute the point on a Non Uniform Rational B-Spline curve. See The NURBS Book, page 124, algorithm A4.1.
 * deg : degree
 * knot : knot vector
 * ctrl = (wx, wy, wz, w) : weighted control points in four-dimensional space
 * t : parameteric point
*/
function nurbsCurvePoint( deg, knot, ctrl, t ) {

	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const nj = basisFuncs( deg, knot, span, t );
	const v = new Vector4( 0, 0, 0, 0 );

	for ( let j = 0; j <= deg; j ++ ) {

		v.x += nj[ j ] * ctrl[ span - deg + j ].x;
		v.y += nj[ j ] * ctrl[ span - deg + j ].y;
		v.z += nj[ j ] * ctrl[ span - deg + j ].z;
		v.w += nj[ j ] * ctrl[ span - deg + j ].w;

	}

	return deWeight( v );

}

/*
 * Compute derivatives of a Non Uniform Rational B-Spline curve. See The NURBS Book, page 127, algorithm A4.2.
 * deg : degree
 * knot : knot vector
 * ctrl : control points
 * t : parameteric point
 * n : order of the highest derivative to compute (default value is 2)
 */
function nurbsCurveDers( deg, knot, ctrl, t, n = 2 ) {

	const v = [];
	const span = findIndexSpan( deg, knot, ctrl.length, t );
	const nders = dersBasisFunc( deg, knot, span, n, t );

	for ( let k = 0; k <= n; k ++ ) {

		v[ k ] = new Vector4( 0, 0, 0, 0 );

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

	const ders = v.map( e => new Vector3( e.x, e.y, e.z ) );

	return ders;

}

/*
 * Compute binomial coefficient, k! / ( i! * ( k - i )! )
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

/*
 * Compute Nurbs surface point. See The NURBS Book, page 134, algorithm A4.3.
 * degU, degV : degrees of Nurbs surface
 * knotU, knotV : knot vectors
 * ctrl : control points
 * t1, t2 : parametric points
 */
function nurbsSurfacePoint( n, m, degU, degV, knotU, knotV, ctrl, t1, t2 ) {

	const spanU = findIndexSpan( degU, knotU, n, t1 );
	const spanV = findIndexSpan( degV, knotV, m, t2 );
	const ni = basisFuncs( degU, knotU, spanU, t1 );
	const nj = basisFuncs( degV, knotV, spanV, t2 );
	const v = new Vector4( 0, 0, 0, 0 );

	for ( let j = 0; j <= degV; j ++ ) {

		const index = spanV - degV + j;
		const tmp = new Vector4( 0, 0, 0 );
		for ( let i = 0; i <= degU; i ++ ) {

			tmp.x += ni[ i ] * ctrl[ spanU - degU + i ][ index ].x;
			tmp.y += ni[ i ] * ctrl[ spanU - degU + i ][ index ].y;
			tmp.z += ni[ i ] * ctrl[ spanU - degU + i ][ index ].z;
			tmp.w += ni[ i ] * ctrl[ spanU - degU + i ][ index ].z;

		}

		v.x += nj[ index ] * tmp.x;
		v.y += nj[ index ] * tmp.y;
		v.z += nj[ index ] * tmp.z;

	}

	return v;

}

/*
 * Modify control points by knots insertion. See The NURBS Book, page 151, algorithm A5.1.
 * deg : degree
 * knot : knot vector
 * ctrl : control points
 * t : parameteric point
*/
function knotsInsert( deg, knot, ctrl, t ) {

	var q = [];
	const span = findIndexSpan( deg, knot, ctrl.length, t );

	for ( let i = 0; i <= deg; i ++ ) {

		const tmp = ctrl[ span - deg + i ];
		q[ i ] = tmp;

	}

	const low = span - deg + 1;

	for ( let i = 0; i < deg; i ++ ) {

		const alpha = ( t - knot[ low + i ] ) / ( knot[ span + 1 + i ] - knot[ low + i ] );
		q[ i ] = q[ i + 1 ].clone().mul( alpha ).add( q[ i ].clone().mul( 1.0 - alpha ) );

	}

	for ( let i = 0; i < deg; i ++ ) {

		i == deg - 1 ? ctrl.splice( low + i, 0, q[ i ] ) : ctrl[ low + i ] = q[ i ];

	}

	knot.splice( span + 1, 0, t );

}

/*
 * Create arbitrary Nurbs circular arc. See The NURBS Book, page 308, algorithm A7.1.
 * o : origin of local coordinates
 * x : unit length vector in the reference plane of the circle
 * y : unit length vector in the ref. plane, and orthogonal to x
 * a0, a1 : start and end angles in relative to horizontal coordinate of x
 */
function makeNurbsCircle( o, x, y, r, a0, a1 ) {

	a1 < a0 ? a1 = 360.0 + a1 : null;

	const pi = 4.0 * Math.atan( 1.0 );
	a0 *= pi / 180.0;
	a1 *= pi / 180.0;
	const theta = a1 - a0;
	let narcs;

	if ( theta <= 0.5 * pi ) {

		narcs = 1;

	} else if ( theta <= pi ) {

		narcs = 2;

	} else if ( theta <= 1.5 * pi ) {

		narcs = 3;

	} else {

		narcs = 4;

	}

	const dtheta = theta / narcs;
	//const nm1 = 2 * narcs;
	const w1 = Math.cos( 0.5 * dtheta ); // 0.5 * dtheta is base angle
	const p0 = o.clone();
	p0.add( x.clone().mul( r * Math.cos( a0 ) ) );
	p0.add( y.clone().mul( r * Math.sin( a0 ) ) );
	const t0 = y.clone().mul( Math.cos( a0 ) ).sub( x.clone().mul( Math.sin( a0 ) ) ); // Initialize start values
	const pw = [];
	pw[ 0 ] = new Vector4( p0.x, p0.y, p0.z, 1.0 );
	let index = 0;
	let angle = a0;

	for ( let i = 1; i <= narcs; i ++ ) {

		angle += dtheta;
		const p2 = o.clone();
		p2.add( x.clone().mul( r * Math.cos( angle ) ) );
		p2.add( y.clone().mul( r * Math.sin( angle ) ) );
		pw[ index + 2 ] = new Vector4( p2.x, p2.y, p2.z, 1.0 );
		const t2 = y.clone().mul( Math.cos( angle ) ).sub( x.clone().mul( Math.sin( angle ) ) );
		const p1 = intersect3DLines( p0, t0.clone(), p2, t2.clone() );
		pw[ index + 1 ] = new Vector4( w1 * p1.x, w1 * p1.y, w1 * p1.z, w1 );
		index += 2;
		p0.copy( p2 );
		t0.copy( t2 );

	}

	let j = 2 * narcs + 1;
	const knot = [];

	for ( let i = 0; i < 3; i ++ ) {

		knot[ i ] = 0.0;
		knot[ i + j ] = 1.0;

	}

	switch ( narcs ) {

		case 1:
			break;

		case 2:
			knot[ 3 ] = knot[ 4 ] = 0.5;
			break;

		case 3:
			knot[ 3 ] = knot[ 4 ] = 1.0 / 3.0;
			knot[ 5 ] = knot[ 6 ] = 2.0 / 3.0;
			break;

		case 4:
			knot[ 3 ] = knot[ 4 ] = 0.25;
			knot[ 5 ] = knot[ 6 ] = 0.5;
			knot[ 7 ] = knot[ 8 ] = 0.75;
			break;

	}

	return [ knot, pw ];

}

/*
 * Check intersection of two 3D lines
 * p0, p1 : start point
 * d1, d2 : direction of parametric representations of the line
 * C(t) = p0 + d0 x s
 * C(s) = p1 + d1 x t
 * where 0 ≤ t ,s ≤ 1
 */
function intersect3DLines( p0, d0, p1, d1 ) {

	const a = [];
	const b = [];
	a[ 0 ] = new Array( 2 ).fill( 0.0 );
	a[ 0 ][ 0 ] = d0.x;
	a[ 0 ][ 1 ] = - d1.x;
	a[ 1 ] = new Array( 2 ).fill( 0.0 );
	a[ 1 ][ 0 ] = d0.y;
	a[ 1 ][ 1 ] = - d1.y;
	b[ 0 ] = p1.x - p0.x;
	b[ 1 ] = p1.y - p0.y;

	const index = [];
	ludcmp( 2, a, index );
	lubksb( 2, a, index, b );

	const c1 = p0.z + d0.z * b[ 0 ];
	const c2 = p1.z + d1.z * b[ 1 ];

	if ( c1 - c2 < 1e-20 ) {

		const res = p0.clone().add( d0.clone().mul( b[ 0 ] ) );
		return res;

	} else {

		return 0; // no intersection

	}

}

/*
 * Global interpolation through points. See The NURBS Book, page 369, algorithm A9.1.
 * deg : degree
 * prm : parameterized values at each point
 * knot : knot vector
 * pts : to store points having slope constraints(optional)
 */
function globalCurveInterp( deg, prm, knot, pts ) {

	const n = pts.length;
	var arr = [];

	for ( let i = 0; i < n; i ++ ) {

		const span = findIndexSpan( deg, knot, n, prm[ i ] );
		const nj = basisFuncs( deg, knot, span, prm[ i ] );
		arr[ i ] = new Array( n ).fill( 0.0 );

		for ( let j = 0; j <= deg; j ++ ) {

			arr[ i ][ span - deg + j ] = nj[ j ];

		}

	}

	const ctrlp = pts.slice();
	const index = [];
	ludcmp( n, arr, index );
	lubksbV3( n, arr, index, ctrlp );
	return ctrlp;

}


/*
 * Determine control points of curve interpolation with directional constraints. See Piegl et al (2008).
 * deg : degree
 * prm : parameterized values at each point
 * knot : knot vector
 * pole : to store points having slope constraints(tangent vector, optional)
 */
function globalCurveInterpTngt( deg, prm, knot, pole ) {

	const n = pole.length;
	const point = pole.map( e => e.point );
	const slope = pole.map( e => e.slope ).filter( Boolean );
	var arr = [];

	if ( ! slope.length ) { // no directional constraint

		for ( let i = 0; i < n; i ++ ) {

			const span = findIndexSpan( deg, knot, n, prm[ i ] );
			const nj = basisFuncs( deg, knot, span, prm[ i ] );
			arr[ i ] = new Array( n ).fill( 0.0 );

			for ( let j = 0; j <= deg; j ++ ) {

				arr[ i ][ span - deg + j ] = nj[ j ];

			}

		}

		const ctrlp = point.slice();
		const index = [];
		ludcmp( n, arr, index );
		lubksbV3( n, arr, index, ctrlp );
		return ctrlp;

	} else { // if directional constraint(s) exist

		const nCtrlp = n + slope.length;
		const b = new Array( nCtrlp ).fill( new Vector3() );
		var m = 0;

		for ( let i = 0; i < n; i ++ ) {

			const span = findIndexSpan( deg, knot, nCtrlp, prm[ i ] );
			const nj = basisFuncs( deg, knot, span, prm[ i ] );
			arr[ i + m ] = new Array( nCtrlp ).fill( 0.0 );

			for ( let j = 0; j <= deg; j ++ ) {

				arr[ i + m ][ span - deg + j ] = nj[ j ];

			}

			b[ i + m ] = point[ i ];

			const hasValue = pole[ i ].slope ? true : false;

			if ( hasValue ) { // additional ctrlp for directional constraint

				m ++;
				arr[ i + m ] = new Array( nCtrlp ).fill( 0.0 );
				const tmp = new Vector3();

				switch ( i ) {

					case 0 :

						arr[ i + m ][ 0 ] = - 1.0;
						arr[ i + m ][ 1 ] = 1.0;
						b[ i + m ] = tmp.copy( pole[ i ].slope ).mul( ( knot[ deg + 1 ] - knot[ 0 ] ) / deg );
						break;

					case n - 1 :

						arr[ i + m ][ nCtrlp - 2 ] = - 1.0;
						arr[ i + m ][ nCtrlp - 1 ] = 1.0;
						b[ i + m ] = tmp.copy( pole[ i ].slope ).mul( ( knot[ nCtrlp + deg ] - knot[ nCtrlp - 1 ] ) / deg );
						break;

					default :

						const span = findIndexSpan( deg, knot, nCtrlp, prm[ i ] );
						const nder = dersBasisFunc( deg, knot, span, 1, prm[ i ] );

						for ( let j = 0; j <= deg; j ++ ) {

							arr[ i + m ][ span - deg + j ] = nder[ 1 ][ j ]; // set the first derivative

						}

						b[ i + m ] = pole[ i ].slope; // to be equal with directional constraint

				}

			}

		}

		const ctrlp = b.slice();
		const index = [];
		ludcmp( nCtrlp, arr, index );
		lubksbV3( nCtrlp, arr, index, ctrlp );
		return ctrlp;

	}

}

// experimental interpolation with kunckle (pre-calculated multiplicity of knots are needed)
function tempCurveInterp( deg, prm, knot, pole ) {

	const n = pole.length;
	const point = pole.map( e => e.point );
	const slope = pole.map( e => e.slope ).filter( Boolean );
	var arr = [];

	if ( ! slope.length ) { // no directional constraint

		for ( let i = 0; i < n; i ++ ) {

			const span = findIndexSpan( deg, knot, n, prm[ i ] );
			const nj = basisFuncs( deg, knot, span, prm[ i ] );
			arr[ i ] = new Array( n ).fill( 0.0 );

			if ( pole[ i ].knuckle ) { // knuckle point

				arr[ i ] = new Array( n ).fill( 0.0 );
				arr[ i ][ i ] = 1.0; // ctrlp = point

			} else { // ordinary point

				for ( let j = 0; j <= deg; j ++ ) {

					arr[ i ][ span - deg + j ] = nj[ j ];

				}

			}

		}

		const ctrlp = point.slice();
		const index = [];
		ludcmp( n, arr, index );
		lubksbV3( n, arr, index, ctrlp );
		return ctrlp;

	} else { // if directional constraint(s) exist

		const nCtrlp = n + slope.length;
		const b = new Array( nCtrlp ).fill( new Vector3() );
		var m = 0;

		for ( let i = 0; i < n; i ++ ) {

			const span = findIndexSpan( deg, knot, nCtrlp, prm[ i ] );
			const nj = basisFuncs( deg, knot, span, prm[ i ] );
			arr[ i + m ] = new Array( nCtrlp ).fill( 0.0 );

			if ( pole[ i ].knuckle ) { // knuckle point

				arr[ i + m ] = new Array( nCtrlp ).fill( 0.0 );
				arr[ i + m ][ i + m ] = 1.0; // ctrlp = point

			} else { // ordinary point

				for ( let j = 0; j <= deg; j ++ ) {

					arr[ i + m ][ span - deg + j ] = nj[ j ];

				}

			}

			b[ i + m ] = point[ i ];

			const hasValue = pole[ i ].slope ? true : false;

			if ( hasValue ) { // additional ctrlp for directional constraint

				m ++;
				arr[ i + m ] = new Array( nCtrlp ).fill( 0.0 );
				const tmp = new Vector3();

				switch ( i ) {

					case 0 :

						arr[ i + m ][ 0 ] = - 1.0;
						arr[ i + m ][ 1 ] = 1.0;
						b[ i + m ] = tmp.copy( pole[ i ].slope ).mul( ( knot[ deg + 1 ] - knot[ 0 ] ) / deg );
						break;

					case n - 1 :

						arr[ i + m ][ nCtrlp - 2 ] = - 1.0;
						arr[ i + m ][ nCtrlp - 1 ] = 1.0;
						b[ i + m ] = tmp.copy( pole[ i ].slope ).mul( ( knot[ nCtrlp + deg ] - knot[ nCtrlp - 1 ] ) / deg );
						break;

					default :

						const span = findIndexSpan( deg, knot, nCtrlp, prm[ i ] );
						const nder = dersBasisFunc( deg, knot, span, 1, prm[ i ] );

						for ( let j = 0; j <= deg; j ++ ) {

							arr[ i + m ][ span - deg + j ] = nder[ 1 ][ j ]; // set the first derivative

						}

						b[ i + m ] = pole[ i ].slope; // to be equal with directional constraint

				}

			}

		}

		const ctrlp = b.slice();
		const index = [];
		ludcmp( nCtrlp, arr, index );
		lubksbV3( nCtrlp, arr, index, ctrlp );
		return ctrlp;

	}

}

function lubksbV3( n, a, indx, b ) {

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

		b[ i ] = new Vector3( x[ i ], y[ i ], z[ i ] );

	}

}

// Compute weighted control points to make use of nonrational form (four-dimensional coordinates)
function weightedCtrlp( v3, weight ) {

	const v4 = [];

	for ( let i = 0; i < v3.length; i ++ ) {

		const x = v3[ i ].x;
		const y = v3[ i ].y;
		const z = v3[ i ].z;
		const w = weight[ i ];
		v4.push( new Vector4( w * x, w * y, w * z, w ) );

	}

	return v4;

}

// Convert weighted control points () into control points (in three-dimensional coordinates)
function deWeight( v4 ) {

	const isArray = Array.isArray( v4 );

	if ( isArray ) {

		const v3 = [];

		for ( let i = 0; i < v4.length; i ++ ) {

			const w = v4[ i ].w;
			const x = v4[ i ].x / w;
			const y = v4[ i ].y / w;
			const z = v4[ i ].z / w;
			v3.push( new Vector3( x, y, z ) );

		}

		return v3;

	} else {

		const w = v4.w;
		const x = v4.x / w;
		const y = v4.y / w;
		const z = v4.z / w;

		return new Vector3( x, y, z );

	}

}

class Vector3 {

	constructor( x = 0, y = 0, z = 0 ) {

		this.x = x;
		this.y = y;
		this.z = z;

	}

	clone() {

		return new this.constructor( this.x, this.y, this.z );

	}

	copy( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		return this;

	}

	add( v ) {

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;

	}

	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;

	}

	mul( s ) {

		this.x *= s;
		this.y *= s;
		this.z *= s;

		return this;

	}

	div( s ) {

		return this.mul( 1 / s );

	}

	dot( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z;

	}

	cross( v ) {

		const u = this.clone();
		this.x = u.y * v.z - u.z * v.y;
		this.y = u.z * v.x - u.x * v.z;
		this.z = u.x * v.y - u.y * v.x;

		return this;

	}

	negate() {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;

		return this;

	}

	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	}

	normalize() {

		return this.div( this.length() || 1 );

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;
		yield this.z;

	}

}

class Vector4 {

	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

	}

	clone() {

		return new this.constructor( this.x, this.y, this.z, this.w );

	}

	copy( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		this.w = v.w;
		return this;

	}

	add( v ) {

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		this.w += v.w;

		return this;

	}

	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		this.w -= v.w;

		return this;

	}

	mul( s ) {

		this.x *= s;
		this.y *= s;
		this.z *= s;
		this.w *= s;

		return this;

	}

	div( s ) {

		return this.mul( 1 / s );

	}

	dot( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;

	}

	negate() {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;
		this.w = - this.w;

		return this;

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;
		yield this.z;
		yield this.w;

	}

}

export { curvePoint, curveDers, surfacePoint, nurbsCurvePoint, nurbsCurveDers, nurbsSurfacePoint, parameterize, deBoorKnots, globalCurveInterp, globalCurveInterpTngt, weightedCtrlp, deWeight, knotsInsert, Vector3, calcGreville, makeNurbsCircle };
