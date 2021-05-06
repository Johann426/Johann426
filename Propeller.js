class Propeller {

	constructor() {

		//Non-dimensional properties
		this.isNondimensional = true;
		this.rbyR = [ 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0 ]
		this.pitch= [ 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0 ]
		this.chord= [ 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.2, 0.2, 0.1 ]
		this.skew = [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ]
		this.rake = [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ]
		this.camber= [ 0.05, 0.04, 0.04, 0.03, 0.03, 0.02, 0.02, 0.01, 0.00 ]
		this.thick=  [ 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.02 ]


		this.meanline = {

			name: 'NACA 66 a = 1.0 meanline',
			xc  : [ 0.0, 0.0050, 0.0075, 0.0125, 0.0250, 0.0500, 0.0750, 0.1000, 0.1500, 0.2000, 0.2500, 0.3000, 0.3500, 0.4000, 0.4500, 0.5000, 0.5500, 0.6000, 0.6500, 0.7000, 0.7500, 0.8000, 0.8500, 0.9000, 0.9500, 1.0000 ],
			yc  : [ 0.0, 0.250, 0.350, 0.535, 0.930, 1.580, 2.120, 2.585, 3.365, 3.980, 4.475, 4.860, 5.150, 5.355, 5.475, 5.515, 5.475, 5.355, 5.150, 4.860, 4.475, 3.980, 3.365, 2.585, 1.580, 0.000 ],
			dydx: [ 0.00000, 0.42120, 0.38875, 0.34770, 0.29155, 0.23430, 0.19995, 0.17485, 0.13805, 0.11030, 0.08745, 0.06745, 0.04925, 0.03225, 0.01595, 0.00000, -0.01595, -0.03225, -0.04925, -0.06745, -0.08745, -0.11030, -0.13805, -0.17485, -0.23430, 0.00000 ]

		}

		this.section = {

			name: 'NACA 66 (mod)',
			xc  : [ 0.0, 0.0050, 0.0075, 0.0125, 0.0250, 0.0500, 0.0750, 0.1000, 0.1500, 0.2000, 0.2500, 0.3000, 0.3500, 0.4000, 0.4500, 0.5000, 0.5500, 0.6000, 0.6500, 0.7000, 0.7500, 0.8000, 0.8500, 0.9000, 0.9500, 1.0000 ],
			ytm : [ 0.0, 0.0665, 0.0812, 0.1044, 0.1466, 0.2066, 0.2525, 0.2907, 0.3521, 0.4000, 0.4363, 0.4637, 0.4832, 0.4952, 0.5000, 0.4962, 0.4846, 0.4653, 0.4383, 0.4035, 0.3612, 0.3110, 0.2532, 0.1877, 0.1143, 0.0333 ]

		}
		
	}

	getXYZ() {
		return calcPropGeom( 3, this.rbyR, this.pitch, this.chord, this.skew, this.rake, this.camber, this.thick, this.meanline, this.section );
	}
	
	calcPropGeom( NoBlade = 3, rbyR, pitch, chord, skew, rake, camber, thick, meanline, section ) {

		const PI = Math.PI;
		const r = rbyR.map(x => x * 0.5);
		const s = skew.map(x => x * PI / 180);
		chord(nj - 1) = Math.max(chord(nj - 1), thick(jm1) / 0.2);
		const nk = NoBlade;
		const nj = rbyR.length;
		const ni = section.xc.length;
		const xc = meanline.xc;
		const yc = meanline.yc;
		if (xc != section.xc) console.log('the data of meanline and that of section are not matched');
		const ytm = section.ytm;
		
		let max = 0;
		for (let i = 0; i < ni; i++) {
			if (yc[i] > max) max = yc[i];
		}
		
		const x = [];
		const y = [];
		const z = [];
		
		// Suction side
		for (let j = 0; j < nj; j++) {

			const pitchAngle = Math.atan(pitch[j] / 2 * PI * r[j]);

			for (let i = 0; i < ni; i++) {

				const camberAngle = Math.atan(dydx[i])
				const yt = ytm[i] * thick[j];
				yc[i] = yc[i] / max * camber[j]
				const yu = yc[i] * chord[j] + yt * Math.cos(camberAngle);

				x[i][j] = -( rake[j] + radius[j] * skew[j] * Math.tan(pitchAngle) )
					+ ( 0.5 - xc[i] ) * chord[j] * Math.sin(pitchAngle)
					+ yu * Math.cos(pitchAngle);

				y[i][j] = radius[j] * Math.sin( skew[j]
					- ( ( 0.5 - xc[i] ) * chord[j] * Math.cos(pitchAngle)
					- yu * Math.sin(pitchAngle) ) / radius[j] );

				z[i][j] = radius[j] * Math.cos( skew[j]
					- ( ( 0.5 - xc[i] ) * chord[j] * Math.cos(pitchAngle)
					- yu * Math.sin(pitchAngle) ) / radius[j] );

			}
		}

// 		// pressure side
// 		for (let j = 0; j < nj; j++) {

// 			const pitchAngle = Math.atan(pitch[j] / 2 * PI * r[j]);

// 			for (let i = 0; i < ni; i++) {

// 				const camberAngle = Math.atan(dydx[i])
// 				const yt = ytm[i] * thick[j];
// 				yc[j] = ycc[j] / dmax * camber[j] //?????????
// 				const yl = yc[i] * chord[j] - yt * Math.cos(camberAngle);

// 				x[i][j] = -( rake[j] + radius[j] * skew[j] * Math.tan(pitchAngle) )
// 					+ ( 0.5 - xc[i] ) * chord[j] * Math.sin(pitchAngle)
// 					+ yl * Math.cos(pitchAngle);

// 				y[i][j] = radius[j] * Math.sin(skew[j] 
// 					- ( ( 0.5 - xc[i] ) * chord[j] * Math.cos(pitchAngle)
// 					- yl * Math.sin(pitchAngle) ) / radius[j] );
// 				z[i][j] = radius[j] * Math.cos(skew[j] 
// 					- ( ( 0.5 - xc[i] ) * chord[j] * Math.cos(pitchAngle)
// 					- yl * Math.sin(pitchAngle) ) / radius[j] );

// 				}
// 		}


// 		for (let k = 0; k < nk; k++) {

// 			phi = 2 * PI * k / (nk - 1);

// 			for (let j = 0; j < nj; j++) {

// 				for (let i = 0; i < ni; i++) {

// 					dumy = y[i, j, k];
// 					dumz = z[i, j, k];

// 					y[i][j][k] = dumy * Math.cos(phi) - dumz * Math.sin(phi);
// 					z[i][j][k] = dumy * Math.sin(phi) + dumz * Math.cos(phi);

// 				}
// 			}
// 		}

	return { 'x': x, 'y': y, 'z': z };
		
	}

}
