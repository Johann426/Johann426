import * as THREE from './Rendering/three.module.js';
import { OrbitControls } from './Rendering/OrbitControls.js';
import { Menubar } from './GUI/Menubar.js';
import { UITabbedPanel } from './GUI/Sidebar.js';
import { NurbsCurve } from './Modeling/NurbsCurve.js';
import { Rhino3dmLoader } from './loaders/3DMLoader.js';

const MAX_POINTS = 500;
const MAX_SEG = 200;

init();

function init() {

	const scene = new THREE.Scene();
	scene.add( new THREE.AxesHelper( 1 ) );

	const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 10000 );
	camera.position.set( 0, 0, 10 );

	const renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( () => {

		controls.update();
		renderer.render( scene, camera );

		switch ( menubar.state ) {

			case 'view':
				controls.enabled = true;
				break;

			default :
				controls.enabled = false;

		}

		stats.begin();
		stats.end();

	} );

	renderer.domElement.id = 'canvas';
	document.body.appendChild( renderer.domElement );

	const controls = new OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;

	const stats = new Stats();
	stats.showPanel( 0 );
	document.body.appendChild( stats.dom );

	window.addEventListener( 'resize', () => {

		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

	} );

	const raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 1;
	raycaster.params.Line.threshold = 1;

	document.addEventListener( 'keydown', e => {

		switch ( e.code ) {

			case 'ShiftLeft':

				menubar.state = 'Add';
				break;

			case 'ControlLeft':

				break;

			case 'KeyC':

				break;

			case 'Enter':
			case 'Space':

				menubar.state = 'curve';

				break;

			case 'Escape':

				menubar.state = 'view';
				[ buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = false );

				break;

			default :

		}

	} );

	document.addEventListener( 'keyup', e => {

		switch ( e.code ) {

			case 'ShiftLeft':

				break;

			default :

		}

	} );

	let index = 0;
	let dragging = false;
	var previousIntersect = new THREE.Vector3();

	document.addEventListener( 'pointermove', e => {

		const pointer = new THREE.Vector2();
		pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

		raycaster.setFromCamera( pointer, camera );
		const curve = selected.lines.curve;
		const intersect = new THREE.Vector3();
		const plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );

		switch ( menubar.state ) {

			case 'Add':

				raycaster.ray.intersectPlane( plane, intersect );
				if ( curve.pole !== undefined ) {

					// if ( curve.pole.map( e => e.point ).includes( previousIntersect ) ) {

					// 	curve.remove( curve.pole.length - 1 );

					// }

					curve.mod( curve.pole.length - 1, intersect );

				}

				// curve.add( intersect );

				updateCurveBuffer( curve, buffer ); // fps drop !!! why ???
				updateLines( curve, selected.lines );
				renderer.render( scene, camera );

				break;

			case 'Remove':
				break;

			case 'Tangent':
				for ( let i = 0; i < curve.pole.length; i ++ ) {

					const v = curve.pole[ i ].point;
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.2 ) {

						raycaster.ray.intersectPlane( plane, intersect );
						curve.addTangent( i, intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) ) );
						updateCurveBuffer( curve, buffer );
						updateLines( curve, selected.lines );
						renderer.render( scene, camera );

					}

				}

				break;

			default:

				raycaster.ray.intersectPlane( plane, intersect );
				updateDistance( curve, buffer.distance, intersect );

				const intPoints = raycaster.intersectObjects( [ buffer.points ], true );

				if ( intPoints.length > 0 ) {

					const pos = new THREE.Vector3( intPoints[ 0 ].point.x, intPoints[ 0 ].point.y, intPoints[ 0 ].point.z );
					sphereInter.visible = true;
					sphereInter.position.copy( pos );

					if ( menubar.state == 'editting' ) {

						curve.mod( index, intersect );
						updateSelectedPoint( buffer.point, intersect );
						updateCurveBuffer( curve, buffer );
						updateLines( curve, selected.lines );
						renderer.render( scene, camera );
						sidebar.position.dom.children[ 1 ].value = intersect.x;
						sidebar.position.dom.children[ 2 ].value = intersect.y;
						sidebar.position.dom.children[ 3 ].value = intersect.z;

					}

				} else {

					sphereInter.visible = false;

				}

		}

		previousIntersect = intersect;

	} );

	document.addEventListener( 'pointerdown', e => {

		const pointer = new THREE.Vector2();
		pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

		dragging = true;

		raycaster.setFromCamera( pointer, camera );
		const curve = selected.lines.curve;
		const intersect = new THREE.Vector3();
		const plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );

		const intPoints = raycaster.intersectObjects( [ buffer.points ], true );

		switch ( menubar.state ) {

			case 'view':

				const intersects = raycaster.intersectObjects( pickable.children, true );
				if ( intersects.length > 0 ) {

					selected.lines = intersects[ 0 ].object;
					updateCurveBuffer( selected.lines.curve, buffer );
					menubar.state = 'curve';
					[ buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = true );

				}

				break;

			case 'curve':

				if ( intPoints.length > 0 ) {

					menubar.state = 'editting';
					index = intPoints[ 0 ].index;

				}

				break;

			case 'Add':

				raycaster.ray.intersectPlane( plane, intersect );
				curve.add( intersect );
				updateCurveBuffer( curve, buffer );
				updateLines( curve, selected.lines );
				renderer.render( scene, camera );

				break;

			case 'Remove':

				/* for ( let i = 0; i < curve.pole.length; i ++ ) {

					const v = curve.pole[ i ].point;
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.1 ) {

						curve.remove( i );
						updateCurveBuffer( curve, buffer );
						updateLines( curve, selected.lines );
						renderer.render( scene, camera );

					}

				} */

				if ( intPoints.length > 0 ) {

					curve.remove( intPoints[ 0 ].index );
					updateCurveBuffer( curve, buffer );
					updateLines( curve, selected.lines );
					renderer.render( scene, camera );

				}

				break;

			case 'Tangent':

				break;

			case 'Remove tangent':

				if ( intPoints.length > 0 ) {

					curve.removeTangent( intPoints[ 0 ].index );
					updateCurveBuffer( curve, buffer );
					updateLines( curve, selected.lines );
					renderer.render( scene, camera );

				}

				break;

			default:

		}

		buffer.point.visible = true;

	} );

	document.addEventListener( 'pointerup', e => {

		const pointer = new THREE.Vector2();
		pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

		dragging = false;

		buffer.point.visible = false;

		if ( menubar.state == 'editting' ) {

			menubar.state = 'curve';

		}

	} );

	const pickable = new THREE.Object3D();
	const buffer = preBuffer();
	buffer.lines.renderOrder = 100;
	scene.add( pickable, buffer.point, buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature, buffer.distance );

	// Create model and menubar
	const selected = {

		lines: buffer.lines

	};

	Object.defineProperty( selected.lines, 'curve', { value: new NurbsCurve( 3 ) } );

	const geometry = new THREE.SphereGeometry( 1 );
	const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	const sphereInter = new THREE.Mesh( geometry, material );
	sphereInter.visible = false;
	scene.add( sphereInter );

	const menubar = new Menubar( scene, preBuffer(), pickable, selected );
	document.body.appendChild( menubar.dom );
	const sidebar = new UITabbedPanel( selected );
	document.body.appendChild( sidebar.dom );

	const geo_plane = new THREE.PlaneGeometry( 1, 1 );
	const mat_plane = new THREE.MeshBasicMaterial( { color: 0xc0c0c0, side: THREE.DoubleSide } );
	mat_plane.transparent = true;
	mat_plane.opacity = 0.5;
	const plane = new THREE.Mesh( geo_plane, mat_plane );
	scene.add( plane );

	const loader = new Rhino3dmLoader();
	loader.setLibraryPath( './libs/' );
	loader.load( './3dm/Rhino_Logo.3dm', function ( object ) {

		scene.add( object );
		initGUI( object.userData.layers );

		// hide spinner
		document.getElementById( 'loader' ).style.display = 'none';

	} );

}





function preBuffer() {

	let geo, pos, mat;

	geo = new THREE.BufferGeometry();
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
	pos[ 0 ] = pos[ 1 ] = pos[ 2 ] = - 10000;
	pos[ 3 ] = pos[ 4 ] = pos[ 5 ] = 10000;
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );

	mat.uniforms.color = { value: new THREE.Color( 'DimGray' ) };
	const ctrlPoints = new THREE.Points( geo.clone(), mat.clone() );

	mat.uniforms.color = { value: new THREE.Color( 'Aqua' ) };
	const points = new THREE.Points( geo.clone(), mat.clone() );

	mat = new THREE.LineBasicMaterial( { color: 0x808080 } );
	const polygon = new THREE.Line( geo.clone(), mat.clone() );

	mat.color.set( 0xffff00 );
	const lines = new THREE.Line( geo.clone(), mat.clone() );

	pos = new Float32Array( MAX_SEG * 2 * 3 ); // x 2 points per line segment x 3 vertices per point
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	mat.color.set( 0x800000 );
	const curvature = new THREE.LineSegments( geo.clone(), mat.clone() );

	geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( 2 * 3 ), 3 ) );
	mat.color.set( 0x00ff00 );
	const distance = new THREE.Line( geo, mat );

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

function updateCurveBuffer( curve, buffer ) {

	updateLines( curve, buffer.lines );
	updateCurvature( curve, buffer.curvature );
	updateCurvePoints( curve, buffer.points, buffer.ctrlPoints, buffer.polygon );

}

function updateCurvePoints( curve, points, ctrlPoints, polygon ) {

	let pts, geo, pos, arr, index;

	//update design points
	pts = curve.pole.map( e => e.point );
	geo = points.geometry;
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

	//update control points
	pts = curve.getCtrlPoints();
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

	let index;

	//update curve
	const pts = curve.getPoints( MAX_POINTS );
	const pos = lines.geometry.attributes.position;
	pos.needsUpdate = true;
	const arr = pos.array;
	index = 0;

	for ( let i = 0; i < MAX_POINTS; i ++ ) {

		arr[ index ++ ] = pts[ i ].x;
		arr[ index ++ ] = pts[ i ].y;
		arr[ index ++ ] = pts[ i ].z;

	}

}

function updateCurvature( curve, curvature ) {

	let index;

	//update curvature
	if ( curvature !== undefined ) {

		const pts = curve.interrogating( MAX_SEG );
		const pos = curvature.geometry.attributes.position;
		pos.needsUpdate = true;
		const arr = pos.array;
		index = 0;

		for ( let i = 0; i < MAX_SEG; i ++ ) {

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
	console.log( "distance=", v.clone().sub( curve.closestPoint( v ) ).length() );
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
