import { UIElement } from './UIElement.js';
import { NurbsCurve } from '../Modeling/NurbsCurve.js';

class Menubar extends UIElement {

	constructor( scene, curves, buffer, pickable, selected ) {

		super( 'div' );
		this.setId( 'menubar' );
		this.add( this.file() );
		this.add( this.edit() );
		this.add( this.curve() );
		this.add( this.surface() );
		this.state = 'view';
		this.scene = scene;
		this.curves = curves;
		this.buffer = buffer;
		this.pickable = pickable;
		this.selected = selected;

	}

	file() {

		const menu = new Menu();
		menu.add( new MenuHeader( 'File' ) );
		const items = new MenuItems();
		menu.add( items );

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

			this.curves.push( new NurbsCurve( 3 ) );
			const clone = new THREE.Line( this.buffer.lines.geometry.clone(), this.buffer.lines.material.clone() );
			this.pickable.add( clone );
			this.selected.curve = this.curves.length - 1;

		} );

		items.dom.children[ 1 ].addEventListener( 'click', () => {



		} );

		items.dom.children[ 3 ].addEventListener( 'click', () => {

			this.state = 'Add';

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
