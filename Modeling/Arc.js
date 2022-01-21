import { Vector3, weightedCtrlp, makeNurbsCircle } from './NurbsLib.js';
import { Nurbs } from './Nurbs.js';

class Arc extends Nurbs {

	constructor() {

		super( 2 );

		this.pole = [];
		this.normal = new Vector3( 0, 0, 1 );

	}

	// center point
	get p0() {

		return this.pole[ 0 ].point;

	}

	// start point (and radius)
	get p1() {

		return this.pole[ 1 ].point;

	}

	// end point
	get p2() {

		return this.pole[ 2 ].point;

	}

	get r1() {

		return this.p1.clone().sub( this.p0 );

	}

	get r2() {

		return this.p2.clone().sub( this.p0 );

	}

	get x() {

		const v = this.p1.clone().sub( this.p0 );
		return v.normalize();

	}

	get y() {

		const v = this.normal.clone().cross( this.x );
		return v.normalize();

	}

	get r() {

		const v = this.r1;
		return v.length();

	}

	get a0() {

		return 0.0;

	}

	get a1() {

		const r1 = this.r1;
		const r2 = this.r2;
		var theta = r1.clone().dot( r2 ) / ( r1.length() * r2.length() );
		theta = Math.acos( theta );

		const isFlipped = r1.cross( r2 ).normalize().add( this.normal ).length() < 1e-9;
		return isFlipped ? 2.0 * Math.PI - theta : theta;

	}

	get designPoints() {

		return this.pole.map( e => e.point );

	}

	add( v ) {

		if ( this.pole.length < 3 ) {

			this.pole.push( { point: v } );
			this.needsUpdate = true;

		}

	}

	mod( i, v ) {

		v = new Vector3( v.x, v.y, v.z );

		switch ( i ) {

			case 0 :
				v.sub( this.p0 );
				this.pole.map( e => e.point.add( v ) );
				break;

			case 1 :
				this.p1.copy( v );
				if ( this.pole.length == 3 ) {

					v.copy( this.r2 ).normalize().mul( this.r );
					this.p2.copy( v.add( this.p0 ) );

				}

				break;

			case 2 :
				v.sub( this.p0 ).normalize().mul( this.r );
				this.p2.copy( v.add( this.p0 ) );

		}

		this.needsUpdate = true;

	}

	getPointAt( t ) {

		if ( this.needsUpdate ) {

			const n = this.pole.length;

			if ( n == 3 ) {

				this._calcCtrlPoints( this.p0, this.x, this.y, this.r, this.a0, this.a1 );

			} else {

				for ( let i = 0; i < n; i ++ ) {

					this.knots[ 2 * i ] = 0.0;
					this.knots[ 2 * i + 1 ] = 1.0;
					this.knots.sort( ( a, b ) => a - b );
					this.ctrlpw[ i ] = weightedCtrlp( this.pole[ i ].point, 1.0 );

				}

			}

		}

		return super.getPointAt( t );

	}

	_calcCtrlPoints( o, x, y, r, a0, a1 ) {

		const arr = makeNurbsCircle( o, x, y, r, a0, a1 );
		this.knots = arr[ 0 ];
		this.ctrlpw = arr[ 1 ];
		this.needsUpdate = false;

	}

}

export { Arc };
