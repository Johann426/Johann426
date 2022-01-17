import * as THREE from '../Rendering/three.module.js';
import { IntBspline } from '../Modeling/IntBspline.js';
import { updateBuffer, updateLines } from '../Editor.js';

class Hull {

	constructor() {

		this.curves = [];

	}

	readTxt( txt ) {

		const arr = txt.split( '\r\n' );
		let n, m, row, isNew, isPts, curve;
		let i = 0;

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
					// 0 : ordinary
					// 1 : tangent
					// 2 : knuckle

				}

			}

			if ( isPts ) {

				if ( row.length == 5 && n > 0 ) {

					const x = Number( row[ 1 ] );
					const y = Number( row[ 2 ] );
					const z = Number( row[ 3 ] );
					curve.add( new THREE.Vector3( x, y, z ) );
					n --;

				}

				n == 0 ? isPts = false : null;

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
