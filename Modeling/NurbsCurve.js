import { Vector3 } from './NurbsUtil.js';

class NurbsCurve {

	constructor( deg, knots, ctrlp ) {

		this.knots = knots;
		this.ctrlp = ctrlp;

		this.deg = () => {

			const nm1 = this.ctrlp.length - 1;

			return ( nm1 > deg ? deg : nm1 );

		};

	}

}

export { NurbsCurve };
