import { UIElement } from './UIElement.js';

class UITabbedPanel extends UIElement {

	constructor() {

		super();
		this.setId( 'sidebar' );

		this.tabs = [];
		this.panels = [];

		this.tabsDiv = new UIElement( 'div' );
		this.tabsDiv.setClass( 'Tabs' );

		this.panelsDiv = new UIElement( 'div' );
		this.panelsDiv.setClass( 'Panels' );

		this.add( this.tabsDiv );
		this.add( this.panelsDiv );

		this.selected = '';

	}

	select( id ) {

		let tab;
		let panel;
		const scope = this;

		// Deselect current selection
		if ( this.selected && this.selected.length ) {

			tab = this.tabs.find( function ( item ) {

				return item.dom.id === scope.selected;

			} );
			panel = this.panels.find( function ( item ) {

				return item.dom.id === scope.selected;

			} );

			if ( tab ) {

				tab.removeClass( 'selected' );

			}

			if ( panel ) {

				panel.setDisplay( 'none' );

			}

		}

		tab = this.tabs.find( function ( item ) {

			return item.dom.id === id;

		} );
		panel = this.panels.find( function ( item ) {

			return item.dom.id === id;

		} );

		if ( tab ) {

			tab.addClass( 'selected' );

		}

		if ( panel ) {

			panel.setDisplay( '' );

		}

		this.selected = id;

		return this;

	}

	addTab( id, label, items ) {

		const tab = new UITab( label, this );
		tab.setId( id );
		this.tabs.push( tab );
		this.tabsDiv.add( tab );

		const panel = new UIElement( 'div' );
		panel.setId( id );
		panel.add( items );
		panel.setDisplay( 'none' );
		this.panels.push( panel );
		this.panelsDiv.add( panel );

		this.select( id );

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
