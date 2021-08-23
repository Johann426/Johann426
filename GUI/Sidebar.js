import { UIElement } from './UIElement.js';

class UITabbedPanel extends UIElement {

	constructor( selected ) {

		super();
		this.setId( 'sidebar' );
		this.selected = selected;
		this.add( this.Position() );

	}

	Position() {

		const row = new UIElement( 'div' );
		const x = new UINumber().setStyle( 'width', [ '50px' ] );
		const y = new UINumber().setStyle( 'width', [ '50px' ] );
		const z = new UINumber().setStyle( 'width', [ '50px' ] );
		row.add( new UIElement( 'span' ).setTextContent( 'Position : ' ), x, y, z );

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
