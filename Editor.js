import * as THREE from './Rendering/three.module.js';
import { IntBsplineSurf } from './Modeling/IntBsplineSurf.js';
import { History } from './commands/History.js';
import { RemovePointCommand } from './commands/RemovePointCommand.js';
import { IncertPointCommand } from './commands/IncertPointCommand.js';
import { IncertKnotCommand } from './commands/IncertKnotCommand.js';
import { RemoveTangentCommand } from './commands/RemoveTangentCommand.js';
import { RemoveKnuckleCommand } from './commands/RemoveKnuckleCommand.js';
import { AddTangentCommand } from './commands/AddTangentCommand.js';
import { AddKnuckleCommand } from './commands/AddKnuckleCommand.js';

class Editor {

	constructor( scene ) {

		this.scene = scene;
		this.history = new History();
		this.alpha = 1.0;

	}

	removePoint( buffer, point ) {

		this.execute( new RemovePointCommand( buffer, point ) );

	}

	incertPoint( buffer, point ) {

		this.execute( new IncertPointCommand( buffer, point ) );

	}

	incertKnot( buffer, point ) {

		this.execute( new IncertKnotCommand( buffer, point ) );

	}

	removeTangent( buffer, point ) {

		this.execute( new RemoveTangentCommand( buffer, point ) );

	}

	removeKnuckle( buffer, point ) {

		this.execute( new RemoveKnuckleCommand( buffer, point ) );

	}

	addTangent( buffer, index, tangent ) {

		this.execute( new AddTangentCommand( buffer, index, tangent ) );

	}

	addKnuckle( buffer, index, knuckle ) {

		this.execute( new AddKnuckleCommand( buffer, index, knuckle ) );

	}

	execute( cmd ) {

		this.history.excute( cmd );

	}

	undo() {

		this.history.undo();

	}

	redo() {

		this.history.redo();

	}

}

const MAX_POINTS = 500;
const MAX_LINES_SEG = 500;

function getLocalCoordinates( dom, x, y ) {

	const rect = dom.getBoundingClientRect();
	const pointer = new THREE.Vector2();
	pointer.x = ( x - rect.x ) / window.innerWidth * 2 - 1;
	pointer.y = - ( y - rect.y ) / window.innerHeight * 2 + 1;

	return pointer;

}

function preBuffer() {

	let geo, pos, mat;

	geo = new THREE.BufferGeometry();

	// define custom shader
	mat = new THREE.ShaderMaterial( {

		transparent: true,
		uniforms: {
			size: { value: 10 },
			scale: { value: 1 },
			color: { value: new THREE.Color( 'Yellow' ) }
		},
		vertexShader: THREE.ShaderLib.points.vertexShader,
		fragmentShader: `
				uniform vec3 color;
				void main() {
					vec2 xy = gl_PointCoord.xy - vec2(0.5);
					float ll = length(xy);
					gl_FragColor = vec4(color, step(ll, 0.5));
			}
			`

	} );

	geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( 3 ), 3 ) );
	const point = new THREE.Points( geo.clone(), mat.clone() );

	pos = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	geo.setDrawRange( 0, 0 );

	mat.uniforms.color = { value: new THREE.Color( 'DimGray' ) };
	const ctrlPoints = new THREE.Points( geo.clone(), mat.clone() );

	mat.uniforms.color = { value: new THREE.Color( 'Aqua' ) };
	const points = new THREE.Points( geo.clone(), mat.clone() );

	mat = new THREE.LineBasicMaterial( { color: 0x808080 } );
	const polygon = new THREE.Line( geo.clone(), mat.clone() );

	mat.color.set( 0xffff00 );
	const lines = new THREE.Line( geo.clone(), mat.clone() );

	pos = new Float32Array( MAX_LINES_SEG * 2 * 3 ); // x 2 points per line segment x 3 vertices per point
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	mat.color.set( 0x800000 );
	const curvature = new THREE.LineSegments( geo.clone(), mat.clone() );

	pos = new Float32Array( MAX_LINES_SEG * 3 ); // 3 vertices per point
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	curvature.add( new THREE.Line( geo.clone(), mat.clone() ) );

	pos = new Float32Array( 2 * 3 );
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	geo.setDrawRange( 0, 2 );
	mat.color.set( 0x006000 );
	const distance = new THREE.Line( geo, mat );

	point.renderOrder = 1;
	lines.renderOrder = 1;

	const arrow = new THREE.ArrowHelper( new THREE.Vector3( 1, 0, 0 ), new THREE.Vector3(), 1, 0xffff00 );

	return {

		point: point,
		points: points,
		ctrlPoints: ctrlPoints,
		lines: lines,
		polygon: polygon,
		curvature: curvature,
		distance: distance,
		pickable: new THREE.Object3D(),
		tangent: arrow

	};

}

function updateBuffer( curve, buffer ) {

	updatePoints( curve, buffer.points, buffer.ctrlPoints, buffer.polygon );
	updateLines( curve, buffer.lines );
	updateCurvature( curve, buffer.curvature );

}

function updatePoints( curve, points, ctrlPoints, polygon ) {

	let pts, geo, pos, arr, index;

	// update design points
	pts = curve.designPoints;
	geo = points.geometry;
	geo.setDrawRange( 0, pts.length );
	geo.computeBoundingBox();
	geo.computeBoundingSphere();
	pos = geo.getAttribute( 'position' ); // geo.attributes.position;
	pos.needsUpdate = true;
	arr = pos.array;
	index = 0;

	for ( let i = 0, l = pts.length; i < MAX_POINTS; i ++ ) {

		arr[ index ++ ] = i < l ? pts[ i ].x : null;
		arr[ index ++ ] = i < l ? pts[ i ].y : null;
		arr[ index ++ ] = i < l ? pts[ i ].z : null;

	}

	// update control points
	pts = curve.ctrlPoints;
	geo = ctrlPoints.geometry;
	geo.setDrawRange( 0, pts.length );
	geo.computeBoundingBox();
	geo.computeBoundingSphere();
	pos = geo.attributes.position;
	pos.needsUpdate = true;
	arr = pos.array;
	index = 0;

	for ( let i = 0, l = pts.length; i < MAX_POINTS; i ++ ) {

		arr[ index ++ ] = i < l ? pts[ i ].x : null;
		arr[ index ++ ] = i < l ? pts[ i ].y : null;
		arr[ index ++ ] = i < l ? pts[ i ].z : null;

	}

	// update control polygon
	geo = polygon.geometry;
	geo.setDrawRange( 0, pts.length );
	geo.computeBoundingBox();
	geo.computeBoundingSphere();
	pos = geo.attributes.position;
	pos.needsUpdate = true;
	arr = pos.array;
	index = 0;

	for ( let i = 0, l = pts.length; i < MAX_POINTS; i ++ ) {

		arr[ index ++ ] = i < l ? pts[ i ].x : null;
		arr[ index ++ ] = i < l ? pts[ i ].y : null;
		arr[ index ++ ] = i < l ? pts[ i ].z : null;

	}

}

function updateLines( curve, lines ) {

	// update curve
	const geo = lines.geometry;
	geo.setDrawRange( 0, MAX_POINTS );
	geo.computeBoundingBox();
	geo.computeBoundingSphere();
	const pos = geo.attributes.position;
	const pts = curve.getPoints( MAX_POINTS );
	pos.needsUpdate = true;
	const arr = pos.array;
	let index = 0;

	for ( let i = 0; i < MAX_POINTS; i ++ ) {

		arr[ index ++ ] = pts[ i ].x;
		arr[ index ++ ] = pts[ i ].y;
		arr[ index ++ ] = pts[ i ].z;

	}

}

function updateCurvature( curve, curvature, optional ) {

	// update curvature
	if ( curvature !== undefined ) {

		const geo = curvature.geometry;

		geo.computeBoundingBox();
		geo.computeBoundingSphere();
		const pos = geo.attributes.position;
		//const pts = curve.interrogations( MAX_LINES_SEG );
		const prm = curve.parameter;
		pos.needsUpdate = true;
		const arr = pos.array;
		let index = 0;

		const geoPoly = curvature.children[ 0 ].geometry;

		geoPoly.computeBoundingBox();
		geoPoly.computeBoundingSphere();
		const posPoly = geoPoly.attributes.position;
		posPoly.needsUpdate = true;
		const arrPoly = posPoly.array;
		let index2 = 0;

		for ( let j = 1; j < prm.length; j ++ ) {

			const span = prm[ j ] - prm[ j - 1 ] - 1e-10;
			const tmp = MAX_LINES_SEG / ( prm.length - 1 );
			const n = tmp > 20 ? 20 : tmp;
			console.log( n );

			for ( let i = 0; i < n; i ++ ) {

				const t = i * span / ( n - 1 ) + prm[ j - 1 ];
				const pts = curve.interrogationAt( t );

				arr[ index ++ ] = pts.point.x;
				arr[ index ++ ] = pts.point.y;
				arr[ index ++ ] = pts.point.z;

				const crvt = pts.normal.clone().negate().mul( pts.curvature );
				if ( optional ) crvt.mul( optional );
				const tuft = pts.point.clone().add( crvt );

				arr[ index ++ ] = tuft.x;
				arr[ index ++ ] = tuft.y;
				arr[ index ++ ] = tuft.z;

				arrPoly[ index2 ++ ] = tuft.x;
				arrPoly[ index2 ++ ] = tuft.y;
				arrPoly[ index2 ++ ] = tuft.z;

			}

		}

		geo.setDrawRange( 0, index / 3 );
		geoPoly.setDrawRange( 0, index2 / 3 );

	}

}

function updateDistance( curve, distance, v ) {

	let pts, pos, arr, index;
	pts = [ v, curve.closestPoint( v ) ];
	pos = distance.geometry.attributes.position;
	pos.needsUpdate = true;
	arr = pos.array;
	index = 0;

	for ( let i = 0; i < 2; i ++ ) {

		arr[ index ++ ] = pts[ i ].x;
		arr[ index ++ ] = pts[ i ].y;
		arr[ index ++ ] = pts[ i ].z;

	}

}

function updateSelectedPoint( point, v ) {

	const pos = point.geometry.attributes.position;
	pos.needsUpdate = true;
	const arr = pos.array;
	arr[ 0 ] = v.x;
	arr[ 1 ] = v.y;
	arr[ 2 ] = v.z;

}



function drawProp( prop ) {

	const nk = prop.NoBlade;
	const nj = prop.rbyR.length;
	const ni = prop.meanline.xc.length;
	const blade = prop.getXYZ();
	const points = [];

	for ( let j = 0; j < nj; j ++ ) {

		points[ j ] = [];

		for ( let i = 0; i < ni; i ++ ) {

			const x = blade[ 0 ].back.x[ i ][ j ];
			const y = blade[ 0 ].back.y[ i ][ j ];
			const z = blade[ 0 ].back.z[ i ][ j ];
			points[ j ][ i ] = new THREE.Vector3( x, y, z );

		}

	}

	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array( 200 * 200 * 3 * 6 ); // 200 x 200 x 3 vertices per point x 6 points per surface
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	const mat = new THREE.MeshBasicMaterial();
	mat.side = THREE.DoubleSide;
	const propMeshs = [];

	updateGeo( new IntBsplineSurf( ni, nj, points, 3, 3 ), geo );

	// loop over no. of blade
	for ( let k = 1; k <= nk; k ++ ) {

		const phi = 2 * Math.PI * ( k - 1 ) / nk;
		propMeshs.push( new THREE.Mesh( geo.clone().rotateX( phi ), mat ) );

	}


	for ( let j = 0; j < nj; j ++ ) {

		points[ j ] = [];

		for ( let i = 0; i < ni; i ++ ) {

			const x = blade[ 0 ].face.x[ i ][ j ];
			const y = blade[ 0 ].face.y[ i ][ j ];
			const z = blade[ 0 ].face.z[ i ][ j ];
			points[ j ][ i ] = new THREE.Vector3( x, y, z );

		}

	}

	updateGeo( new IntBsplineSurf( ni, nj, points, 3, 3 ), geo );

	// loop over no. of blade
	for ( let k = 1; k <= nk; k ++ ) {

		const phi = 2 * Math.PI * ( k - 1 ) / nk;
		propMeshs.push( new THREE.Mesh( geo.clone().rotateX( phi ), mat ) );

	}

	prop.ids.length = 0;
	propMeshs.map( e => prop.ids.push( e.id ) );

	return propMeshs;

}

function updateProp( meshList, prop ) {

	const nk = prop.NoBlade;
	const nj = prop.rbyR.length;
	const ni = prop.meanline.xc.length;
	const blade = prop.getXYZ();
	const points = [];

	for ( let k = 0; k < nk; k ++ ) {

		for ( let j = 0; j < nj; j ++ ) {

			points[ j ] = [];

			for ( let i = 0; i < ni; i ++ ) {

				const x = blade[ k ].back.x[ i ][ j ];
				const y = blade[ k ].back.y[ i ][ j ];
				const z = blade[ k ].back.z[ i ][ j ];
				points[ j ][ i ] = new THREE.Vector3( x, y, z );

			}

		}

		updateGeo( new IntBsplineSurf( ni, nj, points, 3, 3 ), meshList[ k ].geometry );

		for ( let j = 0; j < nj; j ++ ) {

			points[ j ] = [];

			for ( let i = 0; i < ni; i ++ ) {

				const x = blade[ k ].face.x[ i ][ j ];
				const y = blade[ k ].face.y[ i ][ j ];
				const z = blade[ k ].face.z[ i ][ j ];
				points[ j ][ i ] = new THREE.Vector3( x, y, z );

			}

		}

		updateGeo( new IntBsplineSurf( ni, nj, points, 3, 3 ), meshList[ nk + k ].geometry );

	}

}

function updateGeo( surface, geo ) {

	geo.computeBoundingBox();
	geo.computeBoundingSphere();
	const pos = geo.attributes.position;
	pos.needsUpdate = true;

	const MAX_RADIAL_POINTS = 200;
	const MAX_CHORDAL_POINTS = 200;

	const surf = surface.getPoints( MAX_CHORDAL_POINTS, MAX_RADIAL_POINTS );

	const arr = pos.array;
	let index = 0;
	for ( let j = 0; j < MAX_RADIAL_POINTS - 1; j ++ ) {

		for ( let i = 0; i < MAX_CHORDAL_POINTS - 1; i ++ ) {

			arr[ index ++ ] = surf[ j ][ i ].x;
			arr[ index ++ ] = surf[ j ][ i ].y;
			arr[ index ++ ] = surf[ j ][ i ].z;
			arr[ index ++ ] = surf[ j ][ i + 1 ].x;
			arr[ index ++ ] = surf[ j ][ i + 1 ].y;
			arr[ index ++ ] = surf[ j ][ i + 1 ].z;
			arr[ index ++ ] = surf[ j + 1 ][ i ].x;
			arr[ index ++ ] = surf[ j + 1 ][ i ].y;
			arr[ index ++ ] = surf[ j + 1 ][ i ].z;

			arr[ index ++ ] = surf[ j + 1 ][ i + 1 ].x;
			arr[ index ++ ] = surf[ j + 1 ][ i + 1 ].y;
			arr[ index ++ ] = surf[ j + 1 ][ i + 1 ].z;
			arr[ index ++ ] = surf[ j + 1 ][ i ].x;
			arr[ index ++ ] = surf[ j + 1 ][ i ].y;
			arr[ index ++ ] = surf[ j + 1 ][ i ].z;
			arr[ index ++ ] = surf[ j ][ i + 1 ].x;
			arr[ index ++ ] = surf[ j ][ i + 1 ].y;
			arr[ index ++ ] = surf[ j ][ i + 1 ].z;

		}

	}

}

export { Editor, getLocalCoordinates, preBuffer, updateBuffer, updatePoints, updateLines, updateCurvature, updateDistance, updateSelectedPoint, updateProp, drawProp };
