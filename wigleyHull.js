class wigleyHull {

	constructor( L = 10, B = 2, T = 1 ) {

		this.L = L;
		this.B = B;
		this.T = T;

	}

	getSectionLines( nPoint = 10, nLines = 10 ) {

		const ni = nPoint;
		const nj = nLines;
		const pts = [];

		for ( let j = 0; j < nj; j ++ ) {

			const x = - 0.5 * this.L + this.L * j / ( nj - 1 );

			for ( let i = 0; i < ni; i ++ ) {

				const z = - this.T + this.T * i / ( ni - 1 );
				const x2 = 2 * x / this.L;
				const z2 = z / this.T;
				const y = - 0.5 * this.B * ( 1 - x2 * x2 ) * ( 1 - z2 * z2 );
				pts.push( [ x, y, z ] );

			}

		}

		return pts;

	}

}

export { wigleyHull };
