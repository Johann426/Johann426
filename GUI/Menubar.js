import { UIElement } from './ui.js';
//import { MenubarAdd } from './Menubar.Add.js';

class Menubar extends UIElement {

	constructor() {

		super( 'div' );
		this.setId( 'menubar' );
		this.init();

	}

	init() {

		this.add( this.file() );
		this.add( this.edit() );
		this.add( this.curve() );
		this.add( this.surface() );

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
		menu.add( items );

		return menu;

	}

	curve() {

		const menu = new Menu();
		menu.add( new MenuHeader( 'Lines' ) );
		const items = new MenuItems();
		items.add( new MenuItem( 'line' ) );
		items.add( new MenuItem( 'Circle' ) );
		items.add( new MenuDivider() );
		items.add( new MenuItem( 'Curve' ) );
		menu.add( items );

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
