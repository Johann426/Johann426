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
		var file;
		const menu = new Menu();
		menu.add( new MenuHeader( 'File' ) );
		const items = new MenuItems();
		item = new MenuItem( 'Hull :' );
		file = new SelectFile();
		file.onLoad( function ( e ) {

			const txt = e.target.result;
			console.log( txt );
			hull.readTxt( txt );

		} );
		item.add( file );
		items.add( item );
		item = new MenuItem( 'Propeller :' );
		file = new SelectFile();
		file.onLoad( function ( e ) {

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

		} );
		item.add( file );
		items.add( item );
		menu.add( items );

		return menu;

	}

	edit( selected ) {

		var item;
		const menu = new Menu();
		menu.add( new MenuHeader( 'Edit' ) );
		const items = new MenuItems();
		item = new MenuItem( 'Add point' );
		item.onClick( () => {

			selected.lines.curve.add( new THREE.Vector3() );
			this.state = 'Add';

		} );

		items.add( item );
		item = new MenuItem( 'Add tangent' );
		item.onClick( () => {

			this.state = 'Tangent';

		} );

		items.add( item );
		item = new MenuItem( 'Remove point' );
		item.onClick( () => {

			this.state = 'Remove';

		} );

		items.add( item );
		item = new MenuItem( 'Remove tangent' );
		item.onClick( () => {

			this.state = 'Remove tangent';

		} );

		items.add( item );
		item = new MenuItem( 'knot insert' );
		item.onClick( () => {

			this.state = 'Knot insert';

		} );

		items.add( item );
		item = new MenuItem( 'add knuckle' );
		item.onClick( () => {

			this.state = 'Knuckle';

		} );

		items.add( item );
		item = new MenuItem( 'remove knuckle' );
		item.onClick( () => {

			this.state = 'Remove knuckle';

		} );

		items.add( item );
		item = new MenuItem( 'incert point' );
		item.onClick( () => {

			this.state = 'Incert Point';

		} );

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

		item.onClick( ( ) => {

			const geo = buffer.lines.geometry.clone();
			const mat = buffer.lines.material.clone();
			const lines = new THREE.Line( geo, mat );

			switch ( item.textContent ) {

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

		} );

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

class SelectFile extends UIElement {

	constructor() {

		super( 'input' );
		this.setClass( 'item' );
		this.dom.type = 'file';

	}

	onLoad( func ) {

		this.dom.onchange = function () {

			const file = this.files[ 0 ];
			const reader = new FileReader();

			reader.onload = func;

			reader.readAsText( file );

		};

	}

}

export { Menubar };
