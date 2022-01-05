import * as THREE from '../Rendering/three.module.js';
import { IntBspline } from '../Modeling/IntBspline.js';
import { Line } from '../modeling/Line.js';
import { Circle } from '../Modeling/Circle.js';
import { Arc } from '../Modeling/Arc.js';
import { updateProp, drawProp } from '../cad_curves.js';
import { UIElement } from './UIElement.js';
import { UIPanel, UIRow, UIHorizontalRule, UIFile } from './ui.js';

class Menubar extends UIPanel {

	constructor( scene, buffer, pickable, selected, hull, prop ) {

		super();
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

		const menu = new UIPanel();
		menu.setClass( 'menu' );

		const head = new UIPanel();
		head.setTextContent( 'File' );
		head.setClass( 'head' );
		menu.add( head );

		const items = new UIPanel();
		items.setClass( 'items' );
		menu.add( items );

		// Import hull

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Hull :' );

		file = new UIFile();
		file.onLoad( function ( e ) {

			const txt = e.target.result;
			console.log( txt );
			hull.readTxt( txt );

		} );

		item.add( file );
		items.add( item );

		// Import propeller

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Propeller :' );

		file = new UIFile();
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

		return menu;

	}

	edit( selected ) {

		var item;

		const menu = new UIPanel();
		menu.setClass( 'menu' );

		const head = new UIPanel();
		head.setTextContent( 'Edit' );
		head.setClass( 'head' );
		menu.add( head );

		const items = new UIPanel();
		items.setClass( 'items' );
		menu.add( items );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Add point' );
		item.onClick( () => {

			selected.lines.curve.add( new THREE.Vector3() );
			this.state = 'Add';

		} );

		items.add( item );
		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Add tangent' );
		item.onClick( () => {

			this.state = 'Tangent';

		} );

		items.add( item );
		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Remove point' );
		item.onClick( () => {

			this.state = 'Remove';

		} );

		items.add( item );
		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Remove tangent' );
		item.onClick( () => {

			this.state = 'Remove tangent';

		} );

		items.add( item );
		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'knot insert' );
		item.onClick( () => {

			this.state = 'Knot insert';

		} );

		items.add( item );
		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'add knuckle' );
		item.onClick( () => {

			this.state = 'Knuckle';

		} );

		items.add( item );
		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'remove knuckle' );
		item.onClick( () => {

			this.state = 'Remove knuckle';

		} );

		items.add( item );
		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'incert point' );
		item.onClick( () => {

			this.state = 'Incert Point';

		} );

		items.add( item );

		return menu;

	}

	curve( buffer, pickable, selected ) {

		var item;

		const menu = new UIPanel();
		menu.setClass( 'menu' );

		const head = new UIPanel();
		head.setTextContent( 'Lines' );
		head.setClass( 'head' );
		menu.add( head );

		const items = new UIPanel();
		items.setClass( 'items' );
		menu.add( items );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Line' );
		this.curveItemClick( item, buffer, pickable, selected );
		items.add( item );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Arc' );
		this.curveItemClick( item, buffer, pickable, selected );
		items.add( item );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Circle' );
		this.curveItemClick( item, buffer, pickable, selected );
		items.add( item );

		items.add( new UIHorizontalRule() );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Curve' );
		this.curveItemClick( item, buffer, pickable, selected );
		items.add( item );

		return menu;

	}

	curveItemClick( item, buffer, pickable, selected ) {

		item.onClick( ( ) => {

			const geo = buffer.lines.geometry.clone();
			const mat = buffer.lines.material.clone();
			const lines = new THREE.Line( geo, mat );

			switch ( item.dom.textContent ) {

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

		const menu = new UIPanel();
		menu.setClass( 'menu' );

		const head = new UIPanel();
		head.setTextContent( 'Surface' );
		head.setClass( 'head' );
		menu.add( head );

		const items = new UIPanel();
		items.setClass( 'items' );
		menu.add( items );

		return menu;

	}

}

export { Menubar };
