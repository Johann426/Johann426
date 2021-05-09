/*
If the giiven data consists of only points (and constraints), on the basis of The NURBS Book,
this class provides a global algorithm to solve the linear equations to evaluate an unknown NURBS,
i.e., parameterized value, knot vector, and control points.
js code by Johann426.github
*/

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

		const points = this.pole.map( e => e.point )
		const chordL = this.getChordLength( points )
		v.normalize().multiplyScalar( chordL );
		this.pole[ i ].slope = v;

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
		const p = this.ctrlPoints;

		return toVector3( p );

	}

	getPointAt( t ) {

		this._calcCtrlPoints();
		const p = NurbsUtil.curvePoint( this.deg(), this.knots, this.ctrlPoints, t );

		return new Vector3( p.x, p.y, p.z );

	}

	getPoints( n ) {

		this._calcCtrlPoints();
		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			//call function curvePointUni(), if you prefer to use B-spline instead of NURBS.
			p.push( NurbsUtil.curvePoint( this.deg(), this.knots, this.ctrlPoints, t ) );

		}

		return toVector3( p );

	}

	getDerivatives( t, k ) {

		this._calcCtrlPoints();
		//call function curveDersUni(), if you prefer to use B-spline instead of NURBS.
		const ders = NurbsUtil.curveDers( this.deg(), this.knots, this.ctrlPoints, t, k );

		return toVector3( ders );

	}

	shapeInterrogation( n ) {

		this._calcCtrlPoints();

		const p = [];

		for ( let i = 0; i < n; i ++ ) {

			const t = i / ( n - 1 );
			const ders = toVector3( NurbsUtil.curveDers( this.deg(), this.knots, this.ctrlPoints, t ) );
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

	_calcCtrlPoints() {

		const points = this.pole.map( e => e.point )
		this.para = this._parameterize( points, this.type );
		this.knots = this._calcKnots( this.deg(), this.para, this.pole );
		this.ctrlPoints = NurbsUtil.globalCurveInterp( this.deg(), this.para, this.knots, this.pole );

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

		return NurbsUtil.deBoorKnots( deg, a ); //.sort( ( a, b ) => { return a - b } );

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