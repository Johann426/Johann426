import { NurbsSurface } from './Modeling/NurbsSurface.js';

const MAX_POINTS = 500;
const MAX_SEG = 200;
const mode = {

	curve: ''

};

init();

function init() {

	const scene = new THREE.Scene();
	scene.add( new THREE.AxesHelper( 1 ) );

	const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 10000 );
	camera.position.set( 0, 0, 1 );

	const renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( time => {

		controls.update();
		renderer.render( scene, camera );

	} );

	document.body.appendChild( renderer.domElement );

	const controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;

	window.addEventListener( 'resize', () => {

		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

	} );

	window.addEventListener( 'load', () => {

		var obj = {
			//str : 'abc',
			//number: 0,
			//value: 0,
			//valueRange : [-1,1],
			//bool: false,
			select: [ 'Add', 'Remove', 'Tanget' ]
		};

		var controlKit = new ControlKit();

		controlKit.addPanel( { label: 'Panel' } )
			.addSubGroup( { label: 'Curve' } )
		//.addStringInput(obj,'str',{label: 'String'})
		//.addNumberInput(obj,'number',{label: 'Number'})
		//.addSlider(obj,'value','valueRange',{label: 'Value'})
		//.addRange(obj,'valueRange',{label : 'Value Range'})
		//.addCheckbox(obj, 'bool', {label: 'Bool'})
			.addSelect( obj, 'select', { label: 'Points', onChange: e => {

				mode.curve = obj.select[ e ];
				console.log( mode.curve );

			} } );

	} );

	const raycaster = new THREE.Raycaster();
	raycaster.params.Points.threshold = 0.05;

	document.addEventListener( 'keydown', e => {

		switch ( e.code ) {

			case 'ShiftLeft':
				mode.curve = 'Add';
				break;

			case 'ControlLeft':
				//controls.enabled = true;
				break;

			case 'KeyC':
				//intCurve.push( new NurbsCurve( 3 ) );
				break;

			case 'Escape':
				mode.curve = null;
				break;

			default :

		}

	} );

	document.addEventListener( 'keyup', e => {

		if ( e.code === 'ControlLeft' ) {

			//controls.enabled = false;

		}

	} );

	var isDrag = false;
	var previousIntersect = new THREE.Vector3();

	document.addEventListener( 'mousemove', e => {

		const pointer = new THREE.Vector2();
		pointer.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		pointer.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

		switch ( mode.curve ) {

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

			case 'Tanget':
				for ( let i = 0; i < curve.pole.length; i ++ ) {

					const v = curve.pole[ i ].point;
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.02 ) {

						raycaster.ray.intersectPlane( plane, intersect );
						curve.addTangent( i, intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) ) );
						updateCurveBuffer( curve, buffer );
						renderer.render( scene, camera );

					}

				}

				break;

			default:

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

		switch ( mode.curve ) {

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
					if ( distance < 0.02 ) {

						curve.remove( i );
						updateCurveBuffer( curve, buffer );
						renderer.render( scene, camera );

					}

				}

				break;

			case 'Tanget':
				for ( let i = 0; i < curve.pole.length; i ++ ) {

					const v = curve.pole[ i ].point;
					const distance = raycaster.ray.distanceToPoint( v );
					if ( distance < 0.02 ) {

						raycaster.ray.intersectPlane( plane, intersect );
						curve.addTangent( i, intersect.sub( new THREE.Vector3( v.x, v.y, v.z ) ) );
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

		isDrag = false;

	} );

	// Surface temp code
	const points = [];
	points.push( [ new THREE.Vector3( - 0.5, 0.1, 0.0 ), new THREE.Vector3( - 0.3, 0.2, 0.0 ), new THREE.Vector3( - 0.1, 0.3, 0.0 ), new THREE.Vector3( 0.1, 0.4, 0.0 ), new THREE.Vector3( 0.3, 0.5, 0.0 ) ] );
	points.push( [ new THREE.Vector3( - 0.5, 0.0, 0.0 ), new THREE.Vector3( - 0.3, 0.1, 0.0 ), new THREE.Vector3( - 0.1, 0.2, 0.1 ), new THREE.Vector3( 0.1, 0.3, 0.0 ), new THREE.Vector3( 0.3, 0.4, 0.0 ) ] );
	points.push( [ new THREE.Vector3( - 0.5, - 0.2, 0.0 ), new THREE.Vector3( - 0.3, - 0.1, 0.1 ), new THREE.Vector3( - 0.1, 0.0, 0.2 ), new THREE.Vector3( 0.1, 0.1, 0.1 ), new THREE.Vector3( 0.3, 0.2, 0.0 ) ] );
	points.push( [ new THREE.Vector3( - 0.5, - 0.4, 0.0 ), new THREE.Vector3( - 0.3, - 0.3, 0.0 ), new THREE.Vector3( - 0.1, - 0.2, 0.1 ), new THREE.Vector3( 0.1, - 0.1, 0.0 ), new THREE.Vector3( 0.3, 0.0, 0.0 ) ] );
	points.push( [ new THREE.Vector3( - 0.5, - 0.5, 0.0 ), new THREE.Vector3( - 0.3, - 0.4, 0.0 ), new THREE.Vector3( - 0.1, - 0.3, 0.0 ), new THREE.Vector3( 0.1, - 0.2, 0.0 ), new THREE.Vector3( 0.3, - 0.1, 0.0 ) ] );
	const surfaces = [];
	surfaces.push( new NurbsSurface( 5, 5, points, 3 ) );
	surfaces[ 0 ]._calcCtrlPoints();

	const nj = 5;
	const ni = 5;
	let index = 0;
	const positions = [];

	for ( let j = 0; j < nj - 1; j ++ ) {

		for ( let i = 0; i < ni - 1; i ++ ) {

			positions[ index ++ ] = points[ i ][ j ].x;
			positions[ index ++ ] = points[ i ][ j ].y;
			positions[ index ++ ] = points[ i ][ j ].z;
			positions[ index ++ ] = points[ i + 1 ][ j ].x;
			positions[ index ++ ] = points[ i + 1 ][ j ].y;
			positions[ index ++ ] = points[ i + 1 ][ j ].z;
			positions[ index ++ ] = points[ i ][ j + 1 ].x;
			positions[ index ++ ] = points[ i ][ j + 1 ].y;
			positions[ index ++ ] = points[ i ][ j + 1 ].z;

			positions[ index ++ ] = points[ i + 1 ][ j + 1 ].x;
			positions[ index ++ ] = points[ i + 1 ][ j + 1 ].y;
			positions[ index ++ ] = points[ i + 1 ][ j + 1 ].z;
			positions[ index ++ ] = points[ i ][ j + 1 ].x;
			positions[ index ++ ] = points[ i ][ j + 1 ].y;
			positions[ index ++ ] = points[ i ][ j + 1 ].z;
			positions[ index ++ ] = points[ i + 1 ][ j ].x;
			positions[ index ++ ] = points[ i + 1 ][ j ].y;
			positions[ index ++ ] = points[ i + 1 ][ j ].z;

		}

	}

	const geometry = new THREE.BufferGeometry();
	const positionNumComponents = 3;
	geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), positionNumComponents ) );

	geometry.computeVertexNormals();

	const material = new THREE.MeshNormalMaterial();
	material.side = THREE.DoubleSide;
	const mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

}


function preSurfBuffer() {

	let geometry, positions, material;

	// geometry
	geometry = new THREE.BufferGeometry();

	// attributes
	positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
	geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

	// material
	material = new THREE.MeshNormalMaterial();
	material.side = THREE.DoubleSide;

	const surface = new THREE.Mesh( geometry, material );

	return {

		'surface': surface,

	};

}

function updateTriangles( surf, buffer ) {



}
