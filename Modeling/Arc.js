import { NurbsCurve } from './NurbsCurve.js';
import { Vector3, makeNurbsCircle, deWeight } from './NurbsLib.js';

class Arc extends NurbsCurve {

	constructor() {

		const deg = 2;
		const o = new Vector3( 0.0, 0.0, 0.0 );
		const x = new Vector3( 1.0, 0.0, 0.0 );
		const y = new Vector3( 0.0, 1.0, 0.0 );
		//this.normal = new Vector3( 0, 0, 1 );
		const r = 1.0;
		const a0 = 0.0;
		const a1 = 360.0;

		const tmp = makeNurbsCircle( o, x, y, r, a0, a1 );
		const knots = tmp[ 0 ];
		const ctrlp = deWeight( tmp[ 1 ] );
		const weight = tmp[ 1 ].map( e => e.w );
		super( deg, knots, ctrlp, weight );

		this.pole = [];

	}

	set normal( v ) {

		return v;

	}

	get o() {

		return this.pole[ 0 ].point;

	}

	get x() {

		return this.pole[ 1 ].point;

	}

	get y() {

		return this.normal.cross( this.x );

	}

	get a0() {

		return 0.0;

	}

	get a1() {

		const p1 = this.pole[ 1 ].point;
		const p2 = this.pole[ 2 ].point;
		const dot = p1.clone().dot( p2 );
		const cos = dot / p1.length() / p2.length();
		return Math.acos( cos ) * 180 / 3.141592653589793;

	}

	get designPoints() {

		return this.pole.map( e => e.point );

	}

	add( v ) {

		this.pole.length < 3 ? this.pole.push( { point: v } ) : null;
		this.needsUpdate = true;

	}

	mod( i, v ) {

		this.pole[ i ].point = v;
		this.needsUpdate = true;
		console.log( this.pole );

	}

	_calcCtrlPoints( o, x, y, r, a0, a1 ) {

		const arr = makeNurbsCircle( o, x, y, r, a0, a1 );
		this.knots = arr[ 0 ];
		this.ctrlpw = arr[ 1 ];
		this.needsUpdate = false;

	}

}

export { Arc };
