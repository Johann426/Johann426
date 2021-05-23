import { UIElement, UIPanel, UIRow } from './ui.js';
//import { MenubarAdd } from './Menubar.Add.js';

class Menubar extends UIElement {

	constructor() {

		super( document.createElement( 'div' ) );
		this.setId( 'menubar' );
		this.init();

	}

	init() {

		const curve = this.menu();
		curve.add( this.menuHeader( "Lines" ) );
		const items = this.menuItems();
		items.add( this.menuItem( "line" ) );
		items.add( this.menuItem( "Curve" ) );
		items.add( this.menuItem( "Circle" ) );
		curve.add( items );
		this.add( curve );
		const surf = this.menu();
		surf.add( this.menuHeader( "Surface" ) );
		this.add( surf );

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

		return this.dom;

	}

}



export { Menubar };
