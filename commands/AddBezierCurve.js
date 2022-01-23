import { updateBuffer, updateLines } from '../Editor.js';
import { BezierCurve } from '../Modeling/BezierCurve.js';
import * as THREE from '../Rendering/three.module.js';

class AddBezierCurve {

	constructor( buffer, ctrlp ) {

		this.buffer = buffer;
		this.ctrlp = ctrlp;

	}

	execute() {

		const buffer = this.buffer;
		const ctrlp = this.ctrlp;

		if ( this.mesh !== undefined ) {

			buffer.pickable.add( this.mesh );
			const curve = this.mesh.curve;
			updateBuffer( curve, buffer );

		} else {

			this.addCurve( buffer, ctrlp );
			if ( ctrlp !== undefined ) {

				const curve = this.mesh.curve;
				updateBuffer( curve, buffer );

			}

		}

		[ buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = true );

	}

	undo() {

		const buffer = this.buffer;
		buffer.pickable.remove( this.mesh );
		[ buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = false );

	}

	addCurve( buffer, ctrl ) {

		const geo = buffer.lines.geometry.clone();
		const mat = buffer.lines.material.clone();
		const lines = new THREE.Line( geo, mat );

		Object.defineProperty( lines, 'curve', {

			value: ctrl != undefined ? new BezierCurve().set( ctrl ) : new BezierCurve()

		} );

		mat.color.set( 0x808080 );
		buffer.pickable.add( lines );
		buffer.pickable.selected = lines;
		this.mesh = lines;

	}

}

export { AddBezierCurve };
