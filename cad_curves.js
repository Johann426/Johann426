import * as THREE from './Rendering/three.module.js';
import { OrbitControls } from './Rendering/OrbitControls.js';
import { Menubar } from './GUI/Menubar.js';
import { UITabbedPanel } from './GUI/Sidebar.js';
import { IntBsplineSurf } from './Modeling/IntBsplineSurf.js';
import { Rhino3dmLoader } from './loaders/3DMLoader.js';
import { GUI } from './libs/dat.gui.module.js';
import { wigleyHull } from './wigleyHull.js';
import { Propeller } from './Propeller.js';
import { Hull } from './Hull.js';
import { RemovePointCommand } from './commands/RemovePointCommand.js';
import { AddPointCommand } from './commands/AddPointCommand.js';
import { History } from './commands/History.js';

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

	// stats
	const stats = new Stats();
	stats.showPanel( 0 );
	//document.body.appendChild( stats.dom );

	// grid
	const gridHelper = new THREE.GridHelper( 30, 30, 0x303030, 0x303030 );
	gridHelper.geometry.rotateX( 0.5 * Math.PI );
	scene.add( gridHelper );

	window.addEventListener( 'resize', () => {

		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

	} );

	const raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 1;
	raycaster.params.Line.threshold = 1;

	document.addEventListener( 'keydown', e => {

		if ( e.code == 'KeyZ' && e.ctrlKey ) {

			console.log( 'ctrl + z' );
			history.undo();
			selected = pickable.selected;
			const curve = selected.curve;
			updateCurveBuffer( curve, buffer );
			updateLines( curve, selected );

		}

		switch ( e.code ) {

			case 'ShiftLeft':

				break;

			case 'ControlLeft':

				break;

			case 'KeyZ':

				break;

			case 'KeyC':

				break;

			case 'Enter':
			case 'Space':

				menubar.state = 'curve';

				break;

			case 'Escape':

				menubar.state = 'view';
				[ buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = false );

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

	document.addEventListener( 'pointermove', e => {

		const pointer = getLocalCoordinates( renderer.domElement, e.clientX, e.clientY );

		raycaster.setFromCamera( pointer, camera );
		selected = pickable.selected;
		const curve = selected.curve;
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

				updateCurveBuffer( curve, buffer ); // fps drop !!! why ???
				updateLines( curve, selected );

				break;

			case 'Remove':
				break;

			case 'Tangent':
				for ( let i = 0; i < curve.designPoints.length; i ++ ) {

					const v = curve.designPoints[ i ];
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.2 ) {

						raycaster.ray.intersectPlane( plane, intersect );
						curve.addTangent( i, intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) ) );
						updateCurveBuffer( curve, buffer );
						updateLines( curve, selected );

					}

				}

				break;

			case 'Knuckle':
				for ( let i = 0; i < curve.designPoints.length; i ++ ) {

					const v = curve.designPoints[ i ];
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.2 ) {

						raycaster.ray.intersectPlane( plane, intersect );
						curve.addKnuckle( i, intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) ) );
						updateCurveBuffer( curve, buffer );
						updateLines( curve, selected );

					}

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
						updateCurveBuffer( curve, buffer );
						updateLines( curve, selected );
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
		selected = pickable.selected;
		const curve = selected.curve;
		const intersect = new THREE.Vector3();
		const plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );

		const intPoints = raycaster.intersectObjects( [ buffer.points ], true );

		switch ( menubar.state ) {

			case 'view':

				const intersects = raycaster.intersectObjects( pickable.children, true );
				if ( intersects.length > 0 ) {

					selected = intersects[ 0 ].object;
					updateCurveBuffer( selected.curve, buffer );
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

				// raycaster.ray.intersectPlane( plane, intersect );
				// curve.add( intersect );
				// updateCurveBuffer( curve, buffer );
				// updateLines( curve, selected );
				isAdd = true;

				break;

			case 'Remove':

				history.excute( new RemovePointCommand( selected, intPoints ) );
				updateCurveBuffer( curve, buffer );
				updateLines( curve, selected );
				// if ( intPoints.length > 0 ) {

				// 	curve.remove( intPoints[ 0 ].index );
				// 	updateCurveBuffer( curve, buffer );
				// 	updateLines( curve, selected );

				// }

				break;

			case 'Tangent':

				break;

			case 'Remove tangent':

				if ( intPoints.length > 0 ) {

					curve.removeTangent( intPoints[ 0 ].index );
					updateCurveBuffer( curve, buffer );
					updateLines( curve, selected );

				}

				break;

			case 'Knot insert':

				raycaster.ray.intersectPlane( plane, intersect );
				const t = curve.closestPosition( intersect )[ 0 ];
				curve.insertKnotAt( t );
				updateCurveBuffer( curve, buffer );
				updateLines( curve, selected );

				break;

			case 'Knuckle':

				break;

			case 'Remove knuckle':

				if ( intPoints.length > 0 ) {

					curve.removeKnuckle( intPoints[ 0 ].index );
					updateCurveBuffer( curve, buffer );
					updateLines( curve, selected );

				}

				break;

			case 'Incert Point':

				raycaster.ray.intersectPlane( plane, intersect );
				//const p = curve.closestPosition( intersect );
				//curve.incertPointAt( p[ 0 ], p[ 1 ] );
				curve.addressPoint( intersect );
				updateCurveBuffer( curve, buffer );
				updateLines( curve, selected );

				break;

			default:

		}

		buffer.point.visible = true;

	} );

	document.addEventListener( 'pointerup', e => {

		const pointer = getLocalCoordinates( renderer.domElement, e.clientX, e.clientY );

		//dragging = false;

		buffer.point.visible = false;

		if ( menubar.state == 'editting' ) {

			menubar.state = 'curve';

		}

	} );

	var selected;
	const pickable = new THREE.Object3D();
	const buffer = preBuffer();
	scene.add( pickable, buffer.point, buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature, buffer.distance );

	const history = new History();

	// Create model and menubar
	const geometry = new THREE.SphereGeometry( 0.02 );
	const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	const sphereInter = new THREE.Mesh( geometry, material );
	sphereInter.visible = false;
	scene.add( sphereInter );

	const prop = new Propeller();
	const hull = new Hull();
	const menubar = new Menubar( scene, preBuffer(), pickable, selected, hull, prop );
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
		selected = pickable.selected;
		const curve = selected.curve;
		for ( let i = 0; i < 10; i ++ ) {

			const p = pts[ i + 10 * j ];
			curve.add( new THREE.Vector3( p[ 0 ], p[ 1 ], p[ 2 ] ) );

		}

		menubar.state = 'view';
		updateLines( curve, selected );
		renderer.render( scene, camera );

	}

	drawProp( prop ).map( e => scene.add( e ) );

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

	//const geo = mesh.geometry;
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

	pos = new Float32Array( MAX_SEG * 2 * 3 ); // x 2 points per line segment x 3 vertices per point
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

function updateCurveBuffer( curve, buffer ) {

	updateCurvePoints( curve, buffer.points, buffer.ctrlPoints, buffer.polygon );
	updateLines( curve, buffer.lines );
	updateCurvature( curve, buffer.curvature );

}

function updateCurvePoints( curve, points, ctrlPoints, polygon ) {

	let pts, geo, pos, arr, index;

	//update design points
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

	//update control points
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

	//update curve
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

	//update curvature
	if ( curvature !== undefined ) {

		const geo = curvature.geometry;
		geo.setDrawRange( 0, MAX_SEG * 2 );
		const pos = geo.attributes.position;
		const pts = curve.interrogating( MAX_SEG );
		pos.needsUpdate = true;
		const arr = pos.array;
		let index = 0;

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
	//console.log( "distance=", v.clone().sub( curve.closestPoint( v ) ).length() );
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

export { updateProp, drawProp };
