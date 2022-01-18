import * as THREE from '../Rendering/three.module.js';
import { IntBspline } from '../Modeling/IntBspline.js';
import { NurbsCurve } from '../Modeling/NurbsCurve.js';
import { BezierCurve } from '../Modeling/BezierCurve.js';
import { Line } from '../modeling/Line.js';
import { Circle } from '../Modeling/Circle.js';
import { Arc } from '../Modeling/Arc.js';
import { updateProp, drawProp } from '../Editor.js';
import { UIPanel, UIRow, UIHorizontalRule, UIFile } from './ui.js';

class Menubar extends UIPanel {

	constructor( scene, buffer, hull, prop ) {

		super();
		this.setId( 'menubar' );
		this.add( this.file( scene, buffer, hull, prop ) );
		this.add( this.edit( buffer.pickable ) );
		this.add( this.curve( buffer ) );
		this.add( this.surface() );
		this.state = 'view';

	}

	file( scene, buffer, hull, prop ) {

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
		file.onChange( function ( e ) {

			const txt = e.target.result;
			hull.readTxt( txt );
			hull.drawHull( buffer );

		} );

		item.add( file );
		items.add( item );

		// Import propeller

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Propeller :' );

		file = new UIFile();
		file.onChange( function ( e ) {

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

	edit( pickable ) {

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

			pickable.selected.curve.add( new THREE.Vector3() );
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

	curve( buffer ) {

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
		this.curveItemClick( item, buffer );
		items.add( item );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Arc' );
		this.curveItemClick( item, buffer );
		items.add( item );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Circle' );
		this.curveItemClick( item, buffer );
		items.add( item );

		items.add( new UIHorizontalRule() );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Curve' );
		this.curveItemClick( item, buffer );
		items.add( item );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Nurbs' );
		this.curveItemClick( item, buffer );
		items.add( item );

		item = new UIRow();
		item.setClass( 'item' );
		item.setTextContent( 'Bezier' );
		this.curveItemClick( item, buffer );
		items.add( item );

		return menu;

	}

	curveItemClick( item, buffer ) {

		item.onClick( ( ) => {

			const txt = item.dom.textContent;
			const geo = buffer.lines.geometry.clone();
			const mat = buffer.lines.material.clone();
			const lines = new THREE.Line( geo, mat );

			switch ( txt ) {

				case 'Line':
					Object.defineProperty( lines, 'curve', { value: new IntBspline( 1 ) } );
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
				case 'Nurbs':
					Object.defineProperty( lines, 'curve', { value: new NurbsCurve( 3 ) } );
					break;
				case 'Bezier':
					Object.defineProperty( lines, 'curve', { value: new BezierCurve() } );
					break;

			}

			mat.color.set( 0x808080 );
			buffer.pickable.add( lines );
			buffer.pickable.selected = lines;
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
