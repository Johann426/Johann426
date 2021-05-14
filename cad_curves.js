
import { Container } from './GUI/container.js';
import { NurbsCurve } from './Modeling/NurbsCurve.js';

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

	//document.body.appendChild( renderer.domElement );
	let container = new Container( 'mainCanvas', document.body, renderer.domElement );
	container.create();
	container.createList();

	const controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;
	controls.enabled = false;

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
				controls.enabled = true;
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

			controls.enabled = false;

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
		//console.log(isDrag);
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

		switch ( e.which ) {

			case 1:


				break;

			case 2:

				curve.addTangent( 0, new THREE.Vector3( 0, 0, 0 ) );
				curve.hasSlope = true;
				curve._calcCtrlPoints();

				break;

			case 3:



				break;

			default:

		}


		isDrag = true;

	} );

	document.addEventListener( 'mouseup', e => {

		isDrag = false;

	} );

	const buffer = preBuffer();
	scene.add( buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.lines, buffer.curvature );

	const curves = [];
	curves.push( new NurbsCurve( 3 ) );

}

function preBuffer() {

	let geometry, positions, material;

	// geometry
	geometry = new THREE.BufferGeometry();

	// attributes
	positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
	geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) ); //geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );

	// material
	material = new THREE.ShaderMaterial( {
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

	// control points
	const ctrlPoints = new THREE.Points( geometry, material );

	// design points
	const points = new THREE.Points( geometry.clone(), material.clone() );

	// material
	material = new THREE.LineBasicMaterial( { color: 0xffffff } );

	// polygon
	const polygon = new THREE.Line( geometry.clone(), material );

	// lines
	const lines = new THREE.Line( geometry.clone(), material.clone() );

	// geometry
	geometry = new THREE.BufferGeometry();

	// attributes
	positions = new Float32Array( MAX_SEG * 2 * 3 ); // x 2 points per line segment x 3 vertices per point
	geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

	// curvature
	const curvature = new THREE.LineSegments( geometry, material.clone() );

	points.material.uniforms.color = { value: new THREE.Color( 'Aqua' ) };
	polygon.material.color.set( 0x808080 );
	lines.material.color.set( 0xffff00 );
	curvature.material.color.set( 0x800000 );

	return {

		'points': points,
		'ctrlPoints': ctrlPoints,
		'lines': lines,
		'polygon': polygon,
		'curvature': curvature

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

	if ( curvature !== undefined ) {

		pts = curve.shapeInterrogation( MAX_SEG );
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
