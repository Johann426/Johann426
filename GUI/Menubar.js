import { UIElement } from './ui.js';
//import { MenubarAdd } from './Menubar.Add.js';

class Menubar extends UIElement {

	constructor() {

		super( 'div' );
		this.setId( 'menubar' );
		this.add( this.file() );
		this.add( this.edit() );
		this.add( this.curve() );
		this.add( this.surface() );
		this.state = 'view';

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

		items.dom.children[ 0 ].addEventListener( 'click', () => {

			this.state = 'Add';

		} );

		items.dom.children[ 1 ].addEventListener( 'click', () => {

			this.state = 'Tangent';

		} );

		items.dom.children[ 2 ].addEventListener( 'click', () => {

			this.state = 'Remove';

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

			this.state = 'Line';

		} );

		items.dom.children[ 1 ].addEventListener( 'click', () => {

			this.state = 'Circle';

		} );

		items.dom.children[ 2 ].addEventListener( 'click', () => {

			this.state = 'Curve';

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
