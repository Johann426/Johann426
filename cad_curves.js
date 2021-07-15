import { Menubar } from './GUI/Menubar.js';

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

	} );

	document.body.appendChild( renderer.domElement );

	// Create model and menubar
	var selected;
	const curves = [];

	const controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;

	window.addEventListener( 'resize', () => {

		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

	} );

	const raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 0.05;
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

			case 'Escape':
				menubar.state = 'view';
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

	var isDrag = false;
	var previousIntersect = new THREE.Vector3();

	document.addEventListener( 'mousemove', e => {

		const pointer = new THREE.Vector2();
		pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

		raycaster.setFromCamera( pointer, camera );
		const curve = curves[ 0 ];
		const intersect = new THREE.Vector3();
		const plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );

		switch ( menubar.state ) {

			case 'Add':

				raycaster.ray.intersectPlane( plane, intersect );
				if ( curve.pole !== undefined ) {

					if ( curve.pole.map( e => e.point ).includes( previousIntersect ) ) {

						curve.remove( curve.pole.length - 1 );

					}

				}

				curve.add( intersect );
				previousIntersect = intersect;

				updateCurveBuffer( curve, buffer );
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
						renderer.render( scene, camera );

					}

				}

				break;

			default:

				raycaster.ray.intersectPlane( plane, intersect );
				updateDistance( curve, buffer.distance, intersect );

				raycaster.setFromCamera( pointer, camera );
				const intersects = raycaster.intersectObjects( pickable.children, true );
				if ( intersects.length > 0 ) {

					sphereInter.visible = true;
					sphereInter.position.copy( intersects[ 0 ].point );
					console.log( intersects[ 0 ] );

				} else {

					sphereInter.visible = false;

				}

		}

		if ( isDrag ) {

		}

	} );

	document.addEventListener( 'mousedown', e => {

		const pointer = new THREE.Vector2();
		pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

		raycaster.setFromCamera( pointer, camera );
		const curve = curves[ 0 ];
		const intersect = new THREE.Vector3();
		const plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );

		switch ( menubar.state ) {

			case 'Add':

				raycaster.ray.intersectPlane( plane, intersect );
				curve.add( intersect );
				updateCurveBuffer( curve, buffer );
				renderer.render( scene, camera );

				break;

			case 'Remove':

				for ( let i = 0; i < curve.pole.length; i ++ ) {

					const v = curve.pole[ i ].point;
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.1 ) {

						curve.remove( i );
						updateCurveBuffer( curve, buffer );
						renderer.render( scene, camera );

					}

				}

				break;

			case 'Tangent':

				for ( let i = 0; i < curve.pole.length; i ++ ) {

					const v = curve.pole[ i ].point;
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.2 ) {

						raycaster.ray.intersectPlane( plane, intersect );
						curve.addTangent( i, intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) ) );
						updateCurveBuffer( curve, buffer );
						renderer.render( scene, camera );

					}

				}

				break;

			case 'Remove tangent':

				for ( let i = 0; i < curve.pole.length; i ++ ) {

					const v = curve.pole[ i ].point;
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.1 ) {

						curve.removeTangent( i );
						updateCurveBuffer( curve, buffer );
						renderer.render( scene, camera );

					}

				}

				break;

			default:


		}

		isDrag = true;

	} );

	document.addEventListener( 'mouseup', e => {

		const pointer = new THREE.Vector2();
		pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
		isDrag = false;

	} );

	const pickable = new THREE.Object3D();
	const buffer = preBuffer();
	pickable.add( buffer.lines );
	scene.add( pickable, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature, buffer.distance );

	const geometry = new THREE.SphereGeometry( 1 );
	const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	const sphereInter = new THREE.Mesh( geometry, material );
	sphereInter.visible = false;
	scene.add( sphereInter );

	const menubar = new Menubar( scene, curves, buffer.lines );
	document.body.appendChild( menubar.dom );

}





function preBuffer() {

	let geo, pos, mat;

	geo = new THREE.BufferGeometry();
	pos = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );

	mat = new THREE.ShaderMaterial( {

		transparent: true,
		uniforms: {
			size: { value: 10 },
			scale: { value: 1 },
			color: { value: new THREE.Color( 'DimGray' ) }
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

	const ctrlPoints = new THREE.Points( geo.clone(), mat.clone() );

	mat.uniforms.color = { value: new THREE.Color( 'Aqua' ) };
	const points = new THREE.Points( geo.clone(), mat.clone() );

	mat = new THREE.LineBasicMaterial( { color: 0x808080 } );
	const polygon = new THREE.Line( geo.clone(), mat.clone() );

	mat.color.set( 0xffff00 );
	pos[ 0 ] = - 10000;
	pos[ 1 ] = - 10000;
	pos[ 2 ] = - 10000;
	pos[ 3 ] = 10000;
	pos[ 4 ] = 10000;
	pos[ 5 ] = 10000;
	const lines = new THREE.Line( geo.clone(), mat.clone() );

	pos = new Float32Array( MAX_SEG * 2 * 3 ); // x 2 points per line segment x 3 vertices per point
	geo.setAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
	mat.color.set( 0x800000 );
	const curvature = new THREE.LineSegments( geo.clone(), mat.clone() );

	geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( 2 * 3 ), 3 ) );
	mat.color.set( 0x00ff00 );
	const distance = new THREE.Line( geo, mat );

	return {

		points: points,
		ctrlPoints: ctrlPoints,
		lines: lines,
		polygon: polygon,
		curvature: curvature,
		distance: distance

	};

}

function updateCurveBuffer( curve, buffer ) {

	updateLines( curve, buffer.lines, buffer.curvature );
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

function updateLines( curve, lines, curvature ) {

	let pts, pos, arr, index;

	//update curve
	pts = curve.getPoints( MAX_POINTS );
	pos = lines.geometry.attributes.position;
	pos.needsUpdate = true;
	arr = pos.array;
	index = 0;

	for ( let i = 0; i < MAX_POINTS; i ++ ) {

		arr[ index ++ ] = pts[ i ].x;
		arr[ index ++ ] = pts[ i ].y;
		arr[ index ++ ] = pts[ i ].z;

	}

	//update curvature
	if ( curvature !== undefined ) {

		pts = curve.interrogating( MAX_SEG );
		pos = curvature.geometry.attributes.position;
		pos.needsUpdate = true;
		arr = pos.array;
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
