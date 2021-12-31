import { parameterize, deBoorKnots } from './NurbsLib.js';
import { Bspline } from "./Bspline.js";

class Line extends Bspline {

	constructor() {

		super( 1 );

		this.pole = [];

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

			const pts = this.pole.map( e => e.point );
			const prm = parameterize( pts, 'chordal' );
			const i = prm.findIndex( e => e > t );
			this.incert( i, v );

		}

	}

	getPointAt( t ) {

		this.needsUpdate ? this._calcCtrlPoints() : null;
		return super.getPointAt( t );

	}

	_calcCtrlPoints() {

		const pts = this.pole.map( e => e.point );
		const prm = parameterize( pts, 'chordal' );
		this.knots = deBoorKnots( this.deg, prm );
		this.ctrlp = pts;
		this.needsUpdate = false;

	}

}

export { Line };
