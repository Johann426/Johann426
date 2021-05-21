import { UIElement, UIPanel, UIRow } from './ui.js';
//import { MenubarAdd } from './Menubar.Add.js';

class Menubar {

	constructor() {

		this.init();

	}

	init() {

		const menubar = new UIPanel().setId( 'menubar' );
		const curve = this.menu();
		curve.add( this.menuHeader( "Curve" ) );
		const items = this.menuItems();
		items.add( this.menuItem( "Add" ) );
		items.add( this.menuItem( "Remove" ) );
		items.add( this.menuItem( "Tangent" ) );
		curve.add( items );
		menubar.add( curve );
		const surf = this.menu();
		surf.add( this.menuHeader( "Surface" ) );
		menubar.add( surf );
		this.menubar = menubar;

	}

	menu( ) {

		const div = new UIElement( document.createElement( 'div' ) );
		div.setClass( 'menu' );

		return div;

	}

	menuHeader( name ) {

		const div = new UIElement( document.createElement( 'div' ) );
		div.setTextContent( name );
		div.setClass( 'head' );

		return div;

	}

	menuItems() {

		const div = new UIElement( document.createElement( 'div' ) );
		div.setTextContent( name );
		div.setClass( 'items' );

		return div;

	}

	menuItem( name ) {

		const div = new UIElement( document.createElement( 'div' ) );
		div.setTextContent( name );
		div.setClass( 'item' );

		return div;

	}

	menuDivider() {

		const hr = document.createElement( 'hr' );
		const divider = new UIElement( hr );

		return divider;

	}

	getDom() {

		return this.menubar.dom;

	}

}



export { Menubar };
