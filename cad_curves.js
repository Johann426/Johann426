import * as THREE from './Rendering/three.module.js';
import { OrbitControls } from './Rendering/OrbitControls.js';
import { Menubar } from './GUI/Menubar.js';
import { UITabbedPanel } from './GUI/Sidebar.js';
import { Rhino3dmLoader } from './loaders/3DMLoader.js';
import { GUI } from './libs/dat.gui.module.js';
import { wigleyHull } from './wigleyHull.js';
import { Propeller } from './loaders/Propeller.js';
import { Hull } from './loaders/Hull.js';
import { Editor, getLocalCoordinates, preBuffer, updateBuffer, updatePoints, updateLines, updateCurvature, updateDistance, updateSelectedPoint, drawProp } from './Editor.js';

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

			case 'editting' :
				controls.enabled = false;
				break;

			default :

		}

		stats.begin();
		stats.end();

	} );

	renderer.domElement.id = 'canvas';
	document.body.appendChild( renderer.domElement );

	const controls = new OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;

	// stats
	const stats = new Stats();
	stats.showPanel( 0 );
	//document.body.appendChild( stats.dom );

	// grid
	const gridHelper = new THREE.GridHelper( 30, 30, 0x303030, 0x303030 );
	gridHelper.geometry.rotateX( 0.5 * Math.PI );
	scene.add( gridHelper );
	const gridHelper2 = new THREE.PolarGridHelper( 5, 16, 8, 64, 0x303030, 0x303030 );
	gridHelper2.geometry.rotateZ( 0.5 * Math.PI );
	scene.add( gridHelper2 );

	window.addEventListener( 'resize', () => {

		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

	} );

	const raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 1;
	raycaster.params.Line.threshold = 1;

	document.addEventListener( 'keydown', e => {

		const curve = buffer.pickable.selected.curve;

		if ( e.code == 'KeyZ' && e.ctrlKey ) {

			console.log( 'ctrl + z' );
			editor.undo();

		}

		if ( e.code == 'KeyY' && e.ctrlKey ) {

			console.log( 'ctrl + y' );
			editor.redo();

		}

		switch ( e.code ) {

			case 'ArrowUp':
				editor.alpha *= 1.2;
				updateCurvature( curve, buffer.curvature, editor.alpha );
				break;

			case 'ArrowDown':
				editor.alpha /= 1.2;
				updateCurvature( curve, buffer.curvature, editor.alpha );
				break;

			case 'ShiftLeft':

				break;

			case 'ControlLeft':

				break;

			case 'KeyZ':

				break;

			case 'KeyC':

				break;

			case 'Enter':
				break;

			case 'Space':

				menubar.state = 'curve';
				isKnuckle = false;
				isTangent = false;

				break;

			case 'Escape':

				menubar.state = 'view';
				[ buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = false );
				isKnuckle = false;
				isTangent = false;

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
	let isAdd = false;
	let isTangent = false;
	let isKnuckle = false;

	document.addEventListener( 'pointermove', e => {

		const pointer = getLocalCoordinates( renderer.domElement, e.clientX, e.clientY );

		raycaster.setFromCamera( pointer, camera );
		const curve = buffer.pickable.selected.curve;
		const intersect = new THREE.Vector3();
		const plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );

		const intPoints = raycaster.intersectObjects( [ buffer.points ], true );

		switch ( menubar.state ) {

			case 'Add':

				raycaster.ray.intersectPlane( plane, intersect );

				if ( curve.designPoints.length == 0 ) {

					curve.add( new THREE.Vector3() );

				} else {

					if ( isAdd ) {

						curve.add( intersect );
						isAdd = false;

					} else {

						curve.mod( curve.designPoints.length - 1, intersect );

					}

				}

				updateBuffer( curve, buffer );
				updateLines( curve, buffer.pickable.selected );

				break;

			case 'Remove':
				break;

			case 'Tangent':

				if ( isTangent ) {

					const v = curve.designPoints[ index ];
					raycaster.ray.intersectPlane( plane, intersect );
					const dir = intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) );
					curve.addTangent( index, dir );
					updateBuffer( curve, buffer );
					updateLines( curve, buffer.pickable.selected );

					buffer.tangent.position.copy( v );
					buffer.tangent.setDirection( dir.normalize() );

				}

				break;

			case 'Knuckle':

				if ( isKnuckle ) {

					const v = curve.designPoints[ index ];
					raycaster.ray.intersectPlane( plane, intersect );
					const dir = intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) );
					curve.addKnuckle( index, dir );
					updateBuffer( curve, buffer );
					updateLines( curve, buffer.pickable.selected );

					buffer.tangent.position.copy( v );
					buffer.tangent.setDirection( dir.normalize() );

				}

				break;

			default: // curve point editting

				raycaster.ray.intersectPlane( plane, intersect );
				updateDistance( curve, buffer.distance, intersect );

				if ( intPoints.length > 0 ) {

					const pos = new THREE.Vector3( intPoints[ 0 ].point.x, intPoints[ 0 ].point.y, intPoints[ 0 ].point.z );
					sphereInter.visible = true;
					sphereInter.position.copy( pos );

					if ( menubar.state == 'editting' ) {

						curve.mod( index, intersect );
						updateSelectedPoint( buffer.point, intersect );
						updateBuffer( curve, buffer );
						updateLines( curve, buffer.pickable.selected );
						sidebar.position.dom.children[ 1 ].value = intersect.x;
						sidebar.position.dom.children[ 2 ].value = intersect.y;
						sidebar.position.dom.children[ 3 ].value = intersect.z;

					}

				} else {

					sphereInter.visible = false;

				}

		}

	} );

	document.addEventListener( 'pointerdown', e => {

		const pointer = getLocalCoordinates( renderer.domElement, e.clientX, e.clientY );

		//dragging = true;

		raycaster.setFromCamera( pointer, camera );
		const curve = buffer.pickable.selected.curve;
		const intersect = new THREE.Vector3();
		const plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );

		const intPoints = raycaster.intersectObjects( [ buffer.points ], true );

		switch ( menubar.state ) {

			case 'view':

				const intersects = raycaster.intersectObjects( buffer.pickable.children, true );
				if ( intersects.length > 0 ) {

					buffer.pickable.selected = intersects[ 0 ].object;
					updateBuffer( buffer.pickable.selected.curve, buffer );
					menubar.state = 'curve';
					[ buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = true );

				}

				break;

			case 'curve':

				if ( intPoints.length > 0 ) {

					menubar.state = 'editting';
					index = intPoints[ 0 ].index;
					updateSelectedPoint( buffer.point, curve.designPoints[ index ] );

				}

				break;

			case 'Add':

				isAdd = true;
				break;

			case 'Remove':

				if ( intPoints.length > 0 ) {

					editor.removePoint( buffer, intPoints );

				}

				break;

			case 'Tangent':

				if ( isTangent ) {

					const v = curve.designPoints[ index ];
					raycaster.ray.intersectPlane( plane, intersect );
					const dir = intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) );
					editor.addTangent( buffer, index, dir );
					isTangent = false;

				} else {

					if ( intPoints.length > 0 ) {

						isTangent = true;
						index = intPoints[ 0 ].index;

					}

				}

				break;

			case 'Knuckle':

				if ( isKnuckle ) {

					const v = curve.designPoints[ index ];
					raycaster.ray.intersectPlane( plane, intersect );
					const dir = intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) );
					editor.addKnuckle( buffer, index, dir );
					isKnuckle = false;

				} else {

					if ( intPoints.length > 0 ) {

						index = intPoints[ 0 ].index;
						editor.addKnuckle( buffer, index, true );
						isKnuckle = true;

					}

				}

				break;

			case 'Remove tangent':

				if ( intPoints.length > 0 ) {

					editor.removeTangent( buffer, intPoints );

				}

				break;

			case 'Knot insert':

				raycaster.ray.intersectPlane( plane, intersect );
				editor.incertKnot( buffer, intersect );

				break;

			case 'Remove knuckle':

				if ( intPoints.length > 0 ) {

					editor.removeKnuckle( buffer, intPoints );

				}

				break;

			case 'Incert Point':

				raycaster.ray.intersectPlane( plane, intersect );
				editor.incertPoint( buffer, intersect );

				break;

			default:

		}

		buffer.point.visible = true;

	} );

	document.addEventListener( 'pointerup', e => {

		buffer.point.visible = false;

		if ( menubar.state == 'editting' ) {

			menubar.state = 'curve';

		}

	} );

	const buffer = preBuffer();
	scene.add( buffer.pickable, buffer.point, buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature, buffer.distance );
	scene.add( buffer.tangent );

	const editor = new Editor( scene, buffer );

	// Create model and menubar
	const geometry = new THREE.SphereGeometry( 0.02 );
	const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	const sphereInter = new THREE.Mesh( geometry, material );
	sphereInter.visible = false;
	scene.add( sphereInter );

	const prop = new Propeller();
	const hull = new Hull();
	const menubar = new Menubar( scene, buffer, hull, prop );
	document.body.appendChild( menubar.dom );
	const sidebar = new UITabbedPanel();
	document.body.appendChild( sidebar.dom );

	const geo_plane = new THREE.PlaneGeometry( 1, 1 );
	const mat_plane = new THREE.MeshBasicMaterial( { color: 0xc0c0c0, side: THREE.DoubleSide } );
	mat_plane.transparent = true;
	mat_plane.opacity = 0.5;
	const plane = new THREE.Mesh( geo_plane, mat_plane );
	scene.add( plane );

	// const loader = new Rhino3dmLoader();
	// loader.setLibraryPath( './libs/' );
	// loader.load( './3dm/Rhino_Logo.3dm', function ( object ) {

	// 	scene.add( object );
	// 	initGUI( object.userData.layers, scene );

	// 	// hide spinner
	// 	document.getElementById( 'loader' ).style.display = 'none';

	// } );


	const wHull = new wigleyHull();
	const pts = wHull.getSectionLines();

	for ( let j = 0; j < 10; j ++ ) {

		menubar.dom.children[ 2 ].children[ 1 ].children[ 4 ].click();
		const curve = buffer.pickable.selected.curve;
		for ( let i = 0; i < 10; i ++ ) {

			const p = pts[ i + 10 * j ];
			curve.add( new THREE.Vector3( p[ 0 ], p[ 1 ], p[ 2 ] ) );

		}

		menubar.state = 'view';
		updateBuffer( curve, buffer );
		updateLines( curve, buffer.pickable.selected );

	}

	drawProp( prop ).map( e => scene.add( e ) );

}
