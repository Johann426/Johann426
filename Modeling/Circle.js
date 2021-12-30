import { NurbsCurve } from './NurbsCurve.js';
import { Vector3, weightedCtrlp } from './NurbsLib.js';

class Circle extends NurbsCurve {

	constructor() {

		super( 2 );

		this.knots = [ 0.0, 0.0, 0.0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1.0, 1.0, 1.0 ];

		this.pole = [];

		this.normal = new Vector3( 0, 0, 1 );

	}

	// center point
	get p0() {

		return this.pole[ 0 ].point;

	}

	// start & end point (and radius)
	get p1() {

		return this.pole[ 1 ].point;

	}

	get r() {

		const v = this.p1.clone().sub( this.p0 );
		return v.length();

	}

	get designPoints() {

		return this.pole.map( e => e.point );

	}

	add( v ) {

		if ( this.pole.length < 2 ) {

			this.pole.push( { point: v } );
			this.needsUpdate = true;

		}

	}

	mod( i, v ) {

		v = new Vector3( v.x, v.y, v.z );
		if ( i == 0 ) {

			v.sub( this.p0 );
			this.pole.map( e => e.point.add( v ) );

		} else {

			this.p1.copy( v );

		}

		this.needsUpdate = true;

	}

	getPointAt( t ) {

		this.needsUpdate ? this._calcCtrlPoints() : null;

		return super.getPointAt( t );

	}

	_calcCtrlPoints() {

		const ctrlp = [];
		ctrlp[ 0 ] = new Vector3( 1.0, 0.0, 0.0 );
		ctrlp[ 1 ] = new Vector3( 1.0, 1.0, 0.0 );
		ctrlp[ 2 ] = new Vector3( 0.0, 1.0, 0.0 );
		ctrlp[ 3 ] = new Vector3( - 1.0, 1.0, 0.0 );
		ctrlp[ 4 ] = new Vector3( - 1.0, 0.0, 0.0 );
		ctrlp[ 5 ] = new Vector3( - 1.0, - 1.0, 0.0 );
		ctrlp[ 6 ] = new Vector3( 0.0, - 1.0, 0.0 );
		ctrlp[ 7 ] = new Vector3( 1.0, - 1.0, 0.0 );
		ctrlp[ 8 ] = new Vector3( 1.0, 0.0, 0.0 );
		const w1 = 0.5 * Math.sqrt( 2.0 );
		const weight = [ 1.0, w1, 1.0, w1, 1.0, w1, 1.0, w1, 1.0 ];

		this.pole.length == 2 ? ctrlp.map( e => e.mul( this.r ) ) : null;

		ctrlp.map( e => e.add( this.p0 ) );

		this.ctrlpw = weightedCtrlp( ctrlp, weight );

		this.needsUpdate = false;

	}

}

export { Circle };
