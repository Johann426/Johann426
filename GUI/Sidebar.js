import { UIElement } from './UIElement.js';

class UITabbedPanel extends UIElement {

	constructor( selected ) {

		super( 'div' );
		this.setId( 'sidebar' );
		this.selected = selected;
		this.add( this.Coords( 'Position' ) );
		this.add( this.Coords( 'Rotation' ) );
		this.add( this.Coords( 'Scale' ) );

	}

	Coords( name ) {

		const row = new UIElement( 'div' );
		const t = new UIText().setValue( name + ' : ' ).setStyle( 'width', [ '75px' ] );
		const x = new UINumber().setStyle( 'width', [ '67px' ] );
		const y = new UINumber().setStyle( 'width', [ '67px' ] );
		const z = new UINumber().setStyle( 'width', [ '67px' ] );
		row.add( t, x, y, z );

		//console.log( this.selected.buffer.lines.curve );
		//const pts = this.selected.buffer.lines.curve.pole.map( e => e.point );
		
		return row;

	}

}

class UINumber extends UIElement {

	constructor() {

		super( 'input' );
		this.setClass( 'Number' );
		this.dom.value = '0.00';

	}

}

class UITab extends UIElement {

	constructor( text, parent ) {

		super( text );

		this.dom.className = 'Tab';

		this.parent = parent;

		const scope = this;

		this.dom.addEventListener( 'click', function () {

			scope.parent.select( scope.dom.id );

		} );

	}

}

class UIText extends UIElement {

	constructor( text ) {

		super( 'span' );

		this.dom.className = 'Text';
		this.dom.style.cursor = 'default';
		this.dom.style.display = 'inline-block';
		this.dom.style.verticalAlign = 'middle';

		this.setValue( text );

	}

	getValue() {

		return this.dom.textContent;

	}

	setValue( value ) {

		if ( value !== undefined ) {

			this.dom.textContent = value;

		}

		return this;

	}

}

export { UITabbedPanel };
