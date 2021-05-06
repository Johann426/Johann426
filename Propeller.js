class Propeller {

	constructor() {

		//Non-dimensional properties
		this.isNondimensional = true;
		this.rbyR = [ 0.1550, 0.2000, 0.2500, 0.3000, 0.4000, 0.5000, 0.6000, 0.7000, 0.8000, 0.8500, 0.9000, 0.9500, 0.9750, 1.000 ]
		this.pitch= [ 0.8002, 0.8218, 0.8423, 0.8599, 0.8879, 0.9083, 0.9225, 0.9294, 0.9280, 0.9247, 0.9192, 0.9116, 0.9068, 0.9017 ]
		this.rake = [ 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000 ]
		this.skew = [ 0.00, -0.90, -1.89, -2.80, -4.24, -4.80, -4.10, -1.75, 2.65, 5.75, 9.51, 13.97, 16.49, 19.20 ]
		this.chord= [ 0.2106, 0.2214, 0.2314, 0.2402, 0.2546, 0.2653, 0.2730, 0.2766, 0.2740, 0.2672, 0.2504, 0.2114, 0.1608, 0.0000 ]
		this.camber= [ 0.0531, 0.0538, 0.0531, 0.0509, 0.0446, 0.0373, 0.0301, 0.0234, 0.0177, 0.0157, 0.0143, 0.0123, 0.0090, 0.0000 ]
		this.thick=  [ 0.0318, 0.0308, 0.0295, 0.0283, 0.0254, 0.0223, 0.0186, 0.0146, 0.0105, 0.0084, 0.0065, 0.0046, 0.0036, 0.0025 ]
		this.tetm =  [ 0.0548, 0.0565, 0.0587, 0.0611, 0.0674, 0.0755, 0.0872, 0.1052, 0.1382, 0.1657, 0.2101, 0.2940, 0.3719, 0.5122 ]

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
		return this.calcPropGeom( 3, this.rbyR, this.pitch, this.chord, this.skew, this.rake, this.camber, this.thick, this.meanline, this.section );
	}
	
	calcPropGeom( NoBlade = 3, rbyR, pitch, chord, skew, rake, camber, thick, meanline, section ) {

		const PI = Math.PI;
		const r = rbyR.map(x => x * 0.5);
		const s = skew.map(x => x * PI / 180);
		const nk = NoBlade;
		const nj = rbyR.length;
		const ni = section.xc.length;
		const xc = meanline.xc;
		const yc = meanline.yc;
		const dydx = meanline.dydx
		if (xc != section.xc) console.log('the data of meanline and that of section are not matched');
		const ytm = section.ytm;
		
		chord[nj - 1] = Math.max(chord[nj - 1], thick[nj - 1] / 0.2);
		
		let max = 0;
		for (let i = 0; i < ni; i++) {
			if (yc[i] > max) max = yc[i];
		}
		
		const x = Array.from( Array(ni), () => new Array(nj) );
		const y = Array.from( Array(ni), () => new Array(nj) );
		const z = Array.from( Array(ni), () => new Array(nj) );
		
		// Suction side
		for (let j = 0; j < nj; j++) {

			const pitchAngle = Math.atan(pitch[j] / 2 * PI * r[j]);

			for (let i = 0; i < ni; i++) {

				const radius = 0.5 * rbyR[j];
				const camberAngle = Math.atan(dydx[i])
				const yt = ytm[i] * thick[j];
				yc[i] = yc[i] / max * camber[j]
				const yu = yc[i] * chord[j] + yt * Math.cos(camberAngle);

				x[i][j] = -( rake[j] + radius * skew[j] * Math.tan(pitchAngle) )
					+ ( 0.5 - xc[i] ) * chord[j] * Math.sin(pitchAngle)
					+ yu * Math.cos(pitchAngle);

				y[i][j] = radius * Math.sin( skew[j]
					- ( ( 0.5 - xc[i] ) * chord[j] * Math.cos(pitchAngle)
					- yu * Math.sin(pitchAngle) ) / radius );

				z[i][j] = radius * Math.cos( skew[j]
					- ( ( 0.5 - xc[i] ) * chord[j] * Math.cos(pitchAngle)
					- yu * Math.sin(pitchAngle) ) / radius );

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
