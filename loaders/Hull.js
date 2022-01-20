import * as THREE from '../Rendering/three.module.js';
import { IntBspline } from '../modeling/IntBspline.js';
import { updateBuffer, updateLines } from '../Editor.js';

class Hull {

	constructor() {

		this.curves = [];

	}

	readTxt( txt ) {

		const arr = txt.split( '\r\n' );
		let n, m, row, isNew, isPts, curve;
		let i = 0;

		const tangent = [];
		const knuckle = [];

		while ( arr[ i ] != undefined ) {

			row = arr[ i ].split( /\s+/ );

			if ( row[ 1 ] == 'T' ) {

				isNew = true;
				n = row[ 5 ];
				curve = new IntBspline( 3 );
				this.curves.push( curve );

			}

			if ( isNew ) {

				if ( row.length == 3 ) {

					isNew = false;
					isPts = true;
					m = row[ 2 ];

				}

			}

			if ( isPts ) {

				// 0 : ordinary
				// 1 : tangent
				// 2 : knuckle

				if ( row.length == 6 && m > 0 ) {

					knuckle.push( row[ 4 ] );
					tangent.push( row[ 4 ] );
					m --;

				}

				if ( row.length == 5 ) {

					for ( let j = 0; j < n; j ++ ) {

						row = arr[ i ].split( /\s+/ );
						const x = Number( row[ 1 ] );
						const y = Number( row[ 2 ] );
						const z = Number( row[ 3 ] );
						const s = Number( row[ 4 ] );
						curve.add( new THREE.Vector3( x, y, z ) );
						if ( s != 0 ) curve.addKnuckle( j, true );
						i ++;

					}

					isPts = false;

				}

			}

			i ++;

		}

	}

	getCurves() {
	}

	drawHull( buffer ) {

		for ( let i = 0; i < this.curves.length; i ++ ) {

			const geo = buffer.lines.geometry.clone();
			const mat = buffer.lines.material.clone();
			const lines = new THREE.Line( geo, mat );
			const curve = this.curves[ i ];
			Object.defineProperty( lines, 'curve', { value: curve } );
			mat.color.set( 0x808080 );
			buffer.pickable.add( lines );
			updateBuffer( curve, buffer );
			updateLines( curve, lines );

		}

	}

}

export { Hull };
