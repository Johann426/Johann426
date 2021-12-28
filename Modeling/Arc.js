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
		const a1 = 360.0;

		const tmp = makeNurbsCircle( o, x, y, r, a0, a1 );
		const knots = tmp[ 0 ];
		const ctrlp = deWeight( tmp[ 1 ] );
		const weight = tmp[ 1 ].map( e => e.w );
		super( deg, knots, ctrlp, weight );

	}

}

export { Arc };
