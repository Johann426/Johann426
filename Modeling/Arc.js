import { NurbsCurve } from './NurbsCurve.js';
import { Vector3, makeNurbsCircle, deWeight } from './NurbsLib.js';

class Arc extends NurbsCurve {

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

	get x() {

		const v = this.p1.clone().sub( this.p0 );
		return v.normalize();

	}

	get y() {

		const v = this.normal.clone().cross( this.x );
		return v.normalize();

	}

	get r() {

		const v = this.p1.clone().sub( this.p0 );
		return v.length();

	}

	get a0() {

		return 0.0;

	}

	get a1() {

		const d1 = this.p1.clone().sub( this.p0 );
		const d2 = this.p2.clone().sub( this.p0 );
		var theta = d1.clone().dot( d2 ) / ( d1.length() * d2.length() );
		theta = Math.acos( theta );

		const isFlipped = d1.cross( d2 ).normalize().add( this.normal ).length() < 1e-9;
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
				this.pole.length == 3 ? this.p2.sub( this.p0 ).normalize().mul( this.r ).add( this.p0 ) : null;
				break;

			case 2 :
				v.sub( this.p0 ).normalize().mul( this.r );
				this.p2.copy( v.add( this.p0 ) );

		}

		this.needsUpdate = true;

	}

	getPointAt( t ) {

		if ( this.needsUpdate ) {

			if ( this.pole.length == 3 ) {

				this._calcCtrlPoints( this.p0, this.x, this.y, this.r, this.a0, this.a1 );

			} else {

				this._calcCtrlPoints( this.p0, this.p0, this.p0, 0.0, 0.0, 0.0 );

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
