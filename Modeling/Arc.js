import { NurbsCurve } from './NurbsCurve.js';
import { Vector3, makeNurbsCircle, deWeight } from './NurbsLib.js';

class Arc extends NurbsCurve {

	constructor() {

		const deg = 2;
		const o = new Vector3( 0.0, 0.0, 0.0 );
		const x = new Vector3( 1.0, 0.0, 0.0 );
		const y = new Vector3( 0.0, 1.0, 0.0 );
		const r = 1.0;
		const a0 = 0.0;
		const a1 = 2.0 * Math.PI;
		const tmp = makeNurbsCircle( o, x, y, r, a0, a1 );
		const knots = tmp[ 0 ];
		const ctrlp = deWeight( tmp[ 1 ] );
		const weight = tmp[ 1 ].map( e => e.w );
		super( deg, knots, ctrlp, weight );

		this.pole = [];

	}

	get o() {

		return this.pole[ 0 ].point;

	}

	get x() {

		const v = this.pole[ 1 ].point.clone().sub( this.o );
		return v.normalize();

	}

	get y() {

		const v = this.normal.clone().cross( this.x );
		return v.normalize();

	}

	get r() {

		const v = this.pole[ 1 ].point.clone().sub( this.o );
		return v.length();

	}

	get a0() {

		return 0.0;

	}

	get a1() {

		const p1 = this.pole[ 1 ].point.clone().sub( this.o );
		const p2 = this.pole[ 2 ].point.clone().sub( this.o );
		var theta = p1.clone().dot( p2 ) / p1.length() / p2.length();
		theta = Math.acos( theta );
		return theta;

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

		const u1 = v.clone().sub( this.o );

		switch ( i ) {

			case 0 :
				this.pole[ 0 ].point = v;
				//this.pole[ 1 ].point.add( del );
				//this.pole[ 2 ].point.add( del );
				break;

			case 1 :
				this.pole[ 1 ].point = v;
				break;

			case 2 :
				const u2 = this.pole[ 1 ].point.clone().sub( this.o );
				this.normal = u2.cross( u1 ).normalize();
				this._calcCtrlPoints( this.o, this.x, this.y, this.r, 0.0, 2.0 * Math.PI );
				const tmp = this.closestPoint( v );
				console.log( tmp.length() );
				isNaN( tmp.length() ) ? console.log( 'error!' ) : this.pole[ 2 ].point = tmp;

		}

		this.needsUpdate = true;

	}

	getPointAt( t ) {

		if ( this.needsUpdate ) this._calcCtrlPoints( this.o, this.x, this.y, this.r, this.a0, this.a1 );
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
