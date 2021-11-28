import * as THREE from '../Rendering/three.module.js';
import { UIElement } from './UIElement.js';
import { IntBspline } from '../Modeling/IntBspline.js';

class Menubar extends UIElement {

	constructor( scene, buffer, pickable, selected ) {

		super( 'div' );
		this.setId( 'menubar' );
		this.add( this.file() );
		this.add( this.edit() );
		this.add( this.curve() );
		this.add( this.surface() );
		this.state = 'view';
		this.scene = scene;
		this.buffer = buffer;
		this.pickable = pickable;
		this.selected = selected;

	}

	file() {

		const menu = new Menu();
		menu.add( new MenuHeader( 'File' ) );
		const items = new MenuItems();
		items.add( new MenuItem( 'Import hull' ) );
		items.add( new MenuItem( 'Import Propeller' ) );
		menu.add( items );

		items.dom.children[ 0 ].addEventListener( 'click', () => {

			hullOpen.click();

		} );

		items.dom.children[ 1 ].addEventListener( 'click', () => {

			propOpen.click();

		} );

		const hullOpen = document.createElement( 'input' );
		hullOpen.type = 'file';
		hullOpen.addEventListener( 'change', function () {

			// do something

		} );

		const propOpen = document.createElement( 'input' );
		propOpen.type = 'file';
		propOpen.addEventListener( 'change', function () {

			// do something

		} );

		return menu;

	}

	edit() {

		const menu = new Menu();
		menu.add( new MenuHeader( 'Edit' ) );
		const items = new MenuItems();
		items.add( new MenuItem( 'Add point' ) );
		items.add( new MenuItem( 'Add tangent' ) );
		items.add( new MenuItem( 'Remove point' ) );
		items.add( new MenuItem( 'Remove tangent' ) );
		menu.add( items );

		items.dom.children[ 0 ].addEventListener( 'click', () => {

			this.selected.lines.curve.add( new THREE.Vector3() );
			this.state = 'Add';

		} );

		items.dom.children[ 1 ].addEventListener( 'click', () => {

			this.state = 'Tangent';

		} );

		items.dom.children[ 2 ].addEventListener( 'click', () => {

			this.state = 'Remove';

		} );

		items.dom.children[ 3 ].addEventListener( 'click', () => {

			this.state = 'Remove tangent';

		} );

		return menu;

	}

	curve() {

		const menu = new Menu();
		menu.add( new MenuHeader( 'Lines' ) );
		const items = new MenuItems();
		items.add( new MenuItem( 'Line' ) );
		items.add( new MenuItem( 'Circle' ) );
		items.add( new MenuDivider() );
		items.add( new MenuItem( 'Curve' ) );
		menu.add( items );

		items.dom.children[ 0 ].addEventListener( 'click', () => {

		} );

		items.dom.children[ 1 ].addEventListener( 'click', () => {



		} );

		items.dom.children[ 3 ].addEventListener( 'click', () => {

			const geo = this.buffer.lines.geometry.clone();
			const mat = this.buffer.lines.material.clone();
			const lines = new THREE.Line( geo, mat );
			const curve = new IntBspline( 3 );
			Object.defineProperty( lines, 'curve', { value: curve } );
			mat.color.set( 0x808080 );
			this.pickable.add( lines );
			this.selected.lines = lines;
			this.state = 'Add';
			const buffer = this.buffer;
			[ buffer.lines, buffer.points, buffer.ctrlPoints, buffer.polygon, buffer.curvature ].map( e => e.visible = true );

		} );

		return menu;

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
