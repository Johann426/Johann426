import { Vector3 } from './NurbsLib.js';

class Circle {

	constructor() {

		this.deg = 2;
		this.knots = [ 0.0, 0.0, 0.0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1.0, 1.0, 1.0 ];
		this.ctrlp = [];
		this.ctrlp.push( new Vector3( 1.0, 0.0, 0.0 ) );
		this.ctrlp.push( new Vector3( 1.0, 1.0, 0.0 ) );
		this.ctrlp.push( new Vector3( 0.0, 1.0, 0.0 ) );
		this.ctrlp.push( new Vector3( - 1.0, 1.0, 0.0 ) );
		this.ctrlp.push( new Vector3( - 1.0, 0.0, 0.0 ) );
		this.ctrlp.push( new Vector3( - 1.0, - 1.0, 0.0 ) );
		this.ctrlp.push( new Vector3( 0.0, - 1.0, 0.0 ) );
		this.ctrlp.push( new Vector3( 1.0, - 1.0, 0.0 ) );
		this.ctrlp.push( new Vector3( 1.0, 0.0, 0.0 ) );
		const w1 = 0.5 * Math.sqrt( 2.0 );
		this.weight = [ 1.0, w1, 1.0, w1, 1.0, w1, 1.0, w1, 1.0 ];

	}

}

export { Circle };
