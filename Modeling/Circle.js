import { NurbsCurve } from './NurbsCurve.js';
import { Vector4 } from './NurbsLib.js';

class Circle extends NurbsCurve {

	constructor() {

		const deg = 2;
		const knots = [ 0.0, 0.0, 0.0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1.0, 1.0, 1.0 ];
		const ctrlp = [];
		ctrlp.push( new Vector3( 1.0, 0.0, 0.0 ) );
		ctrlp.push( new Vector3( 1.0, 1.0, 0.0 ) );
		ctrlp.push( new Vector3( 0.0, 1.0, 0.0 ) );
		ctrlp.push( new Vector3( - 1.0, 1.0, 0.0 ) );
		ctrlp.push( new Vector3( - 1.0, 0.0, 0.0 ) );
		ctrlp.push( new Vector3( - 1.0, - 1.0, 0.0 ) );
		ctrlp.push( new Vector3( 0.0, - 1.0, 0.0 ) );
		ctrlp.push( new Vector3( 1.0, - 1.0, 0.0 ) );
		ctrlp.push( new Vector3( 1.0, 0.0, 0.0 ) );
		const w1 = 0.5 * Math.sqrt( 2.0 );
		const weight = [ 1.0, w1, 1.0, w1, 1.0, w1, 1.0, w1, 1.0 ];

		super( deg, knots, ctrlp, weight );

	}

	unitCircle() {

	}

}

export { Circle };
