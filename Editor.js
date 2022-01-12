import * as THREE from './Rendering/three.module.js';
import { History } from './commands/History.js';
import { RemovePointCommand } from './commands/RemovePointCommand.js';

class Editor {

	constructor( scene, buffer, pickable ) {

		this.scene = scene;
		this.buffer = buffer;
		this.pickable = pickable;
		this.history = new History();

	}

	removePoint( point ) {

		const selected = this.pickable.selected;
		this.excute( new RemovePointCommand( selected, point ) );

	}

	excute( cmd ) {

		this.history.excute( cmd );
		const buffer = this.buffer;
		const selected = this.pickable.selected;
		const curve = selected.curve;
		updateBuffer( curve, buffer );
		updateLines( curve, selected );

	}

	undo() {

		this.history.undo();
		const buffer = this.buffer;
		const selected = this.pickable.selected;
		const curve = selected.curve;
		updateBuffer( curve, buffer );
		updateLines( curve, selected );

	}

	redo() {

		this.history.redo();

	}

}

const MAX_POINTS = 500;
const MAX_LINES_SEG = 200;

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

	pos = new Float32Array( 2 * 3 );
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	geo.setDrawRange( 0, 2 );
	mat.color.set( 0x006000 );
	const distance = new THREE.Line( geo, mat );

	point.renderOrder = 100;
	lines.renderOrder = 100;

	return {

		point: point,
		points: points,
		ctrlPoints: ctrlPoints,
		lines: lines,
		polygon: polygon,
		curvature: curvature,
		distance: distance

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
	pos = geo.attributes.position;
	pos.needsUpdate = true;
	arr = pos.array;
	index = 0;

	for ( let i = 0, l = pts.length; i < MAX_POINTS; i ++ ) {

		arr[ index ++ ] = i < l ? pts[ i ].x : null;
		arr[ index ++ ] = i < l ? pts[ i ].y : null;
		arr[ index ++ ] = i < l ? pts[ i ].z : null;

	}

	geo = polygon.geometry;
	geo.setDrawRange( 0, pts.length );
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

function updateCurvature( curve, curvature ) {

	// update curvature
	if ( curvature !== undefined ) {

		const geo = curvature.geometry;
		geo.setDrawRange( 0, MAX_LINES_SEG * 2 );
		const pos = geo.attributes.position;
		const pts = curve.interrogating( MAX_LINES_SEG );
		pos.needsUpdate = true;
		const arr = pos.array;
		let index = 0;

		for ( let i = 0; i < MAX_LINES_SEG; i ++ ) {

			arr[ index ++ ] = pts[ i ].point.x;
			arr[ index ++ ] = pts[ i ].point.y;
			arr[ index ++ ] = pts[ i ].point.z;

			const crvt = pts[ i ].normal.clone().negate().mul( pts[ i ].curvature );
			const tuft = pts[ i ].point.clone().add( crvt );

			arr[ index ++ ] = tuft.x;
			arr[ index ++ ] = tuft.y;
			arr[ index ++ ] = tuft.z;

		}

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

export { Editor, getLocalCoordinates, preBuffer, updateBuffer as updateCurveBuffer, updatePoints as updateCurvePoints, updateLines, updateCurvature, updateDistance, updateSelectedPoint };
