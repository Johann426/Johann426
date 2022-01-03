import * as THREE from '../Rendering/three.module.js';
import { UIElement } from './UIElement.js';
import { IntBspline } from '../Modeling/IntBspline.js';
import { Line } from '../modeling/Line.js';
import { Circle } from '../Modeling/Circle.js';
import { Arc } from '../Modeling/Arc.js';
import { updateProp, drawProp } from '../cad_curves.js';

class Menubar extends UIElement {

	constructor( scene, buffer, pickable, selected, hull, prop ) {

		super( 'div' );
		this.setId( 'menubar' );
		this.add( this.file( scene, hull, prop ) );
		this.add( this.edit( selected ) );
		this.add( this.curve( buffer, pickable, selected ) );
		this.add( this.surface() );
		this.state = 'view';

	}

	file( scene, hull, prop ) {

		var item;
		const menu = new Menu();
		menu.add( new MenuHeader( 'File' ) );
		const items = new MenuItems();
		item = new MenuItem( 'Import hull' )
		item.dom.onclick = () => {

			hullOpen.click();

		};

		items.add( item );
		item = new MenuItem( 'Import Propeller' )
		item.dom.onclick = () => {

			propOpen.click();

		};
		
		items.add( item );
		menu.add( items );

		const hullOpen = document.createElement( 'input' );
		hullOpen.type = 'file';
		hullOpen.onchange = function () {

			const file = this.files[ 0 ];
			const reader = new FileReader();

			reader.onload = function ( e ) {

				const txt = e.target.result;
				console.log( txt );
				hull.readTxt( txt );

			};

			reader.readAsText( file );

		};

		const propOpen = document.createElement( 'input' );
		propOpen.type = 'file';
		propOpen.onchange = function () {

			const file = this.files[ 0 ];
			const reader = new FileReader();

			reader.onload = function ( e ) {

				const NoBlade = prop.NoBlade;
				const txt = e.target.result;
				prop.readTxt( txt );

				const meshList = [];
				prop.ids.map( e => meshList.push( scene.getObjectById( e ) ) );

				if ( NoBlade == prop.NoBlade ) {

					updateProp( meshList, prop );

				} else {

					meshList.map( e => scene.remove( e ) );
					drawProp( prop ).map( e => scene.add( e ) );

				}

			};

			reader.readAsText( file );

		};

		return menu;

	}

	edit( selected ) {

		var item;
		const menu = new Menu();
		menu.add( new MenuHeader( 'Edit' ) );
		const items = new MenuItems();
		item = new MenuItem( 'Add point' );
		item.dom.onclick = () => {

			selected.lines.curve.add( new THREE.Vector3() );
			this.state = 'Add';

		};

		items.add( item );
		item = new MenuItem( 'Add tangent' );
		item.dom.onclick = () => {

			this.state = 'Tangent';

		};

		items.add( item );
		item = new MenuItem( 'Remove point' );
		item.dom.onclick = () => {

			this.state = 'Remove';

		};

		items.add( item );
		item = new MenuItem( 'Remove tangent' );
		item.dom.onclick = () => {

			this.state = 'Remove tangent';

		};

		items.add( item );
		item = new MenuItem( 'knot insert' );
		item.dom.onclick = () => {

			this.state = 'Knot insert';

		};

		items.add( item );
		item = new MenuItem( 'add knuckle' );
		item.dom.onclick = () => {

			this.state = 'Knuckle';

		};

		items.add( item );
		item = new MenuItem( 'remove knuckle' );
		item.dom.onclick = () => {

			this.state = 'Remove knuckle';

		};

		items.add( item );
		item = new MenuItem( 'incert point' );
		item.dom.onclick = () => {

			this.state = 'Incert Point';

		};

		items.add( item );
		menu.add( items );

		return menu;

	}

	curve( buffer, pickable, selected ) {

		var item;
		const menu = new Menu();
		menu.add( new MenuHeader( 'Lines' ) );
		const items = new MenuItems();
		item = new MenuItem( 'Line' );
		this.curveItemClick( item, buffer, pickable, selected );
		items.add( item );
		item = new MenuItem( 'Arc' );
		this.curveItemClick( item, buffer, pickable, selected );
		items.add( item );
		item = new MenuItem( 'Circle' );
		this.curveItemClick( item, buffer, pickable, selected );
		items.add( item );
		items.add( new MenuDivider() );
		item = new MenuItem( 'Curve' );
		this.curveItemClick( item, buffer, pickable, selected );
		items.add( item );
		menu.add( items );

		return menu;

	}

	curveItemClick( item, buffer, pickable, selected ) {

		const dom = item.dom;

		dom.onclick = ( ) => {

			const geo = buffer.lines.geometry.clone();
			const mat = buffer.lines.material.clone();
			const lines = new THREE.Line( geo, mat );

			switch ( dom.textContent ) {

				case 'Line':
					Object.defineProperty( lines, 'curve', { value: new Line() } );
					break;
				case 'Arc':
					Object.defineProperty( lines, 'curve', { value: new Arc() } );
					break;
				case 'Circle':
					Object.defineProperty( lines, 'curve', { value: new Circle() } );
					break;
				case 'Curve':
					Object.defineProperty( lines, 'curve', { value: new IntBspline( 3 ) } );
					break;

			}

			mat.color.set( 0x808080 );
			pickable.add( lines );
			selected.lines = lines;
			this.state = 'Add';
			[ buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = true );

		};

	}

	surface() {

		const menu = new Menu();
		menu.add( new MenuHeader( 'Surface' ) );
		const items = new MenuItems();
		menu.add( items );

		return menu;

	}

}

class Menu extends UIElement {

	constructor() {

		super( 'div' );
		this.setClass( 'menu' );

	}

}

class MenuHeader extends UIElement {

	constructor( name ) {

		super( 'div' );
		this.setClass( 'head' );
		this.setTextContent( name );

	}

}

class MenuItems extends UIElement {

	constructor() {

		super( 'div' );
		this.setClass( 'items' );

	}

}


class MenuItem extends UIElement {

	constructor( name ) {

		super( 'div' );
		this.setClass( 'item' );
		this.setTextContent( name );

	}

}

class MenuDivider extends UIElement {

	constructor() {

		super( 'hr' );
		this.setClass( 'divider' );

	}

}



export { Menubar };
