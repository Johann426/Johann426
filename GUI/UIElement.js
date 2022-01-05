class UIElement {

	constructor( type ) {

		this.dom = document.createElement( type );

	}

	get textContent() {

		return this.dom.textContent;

	}

	add() {

		for ( let i = 0; i < arguments.length; i ++ ) {

			const argument = arguments[ i ];

			this.dom.appendChild( argument.dom );

			// if ( argument instanceof UIElement ) {

			// 	this.dom.appendChild( argument.dom );

			// } else {

			// 	console.error( 'UIElement:', argument, 'is not an instance of UIElement.' );

			// }

		}

		return this;

	}

	remove() {

		for ( let i = 0; i < arguments.length; i ++ ) {

			const argument = arguments[ i ];

			if ( argument instanceof UIElement ) {

				this.dom.removeChild( argument.dom );

			} else {

				console.error( 'UIElement:', argument, 'is not an instance of UIElement.' );

			}

		}

		return this;

	}

	clear() {

		while ( this.dom.children.length ) {

			this.dom.removeChild( this.dom.lastChild );

		}

	}

	setId( id ) {

		this.dom.id = id;

		return this;

	}

	getId() {

		return this.dom.id;

	}

	setClass( name ) {

		this.dom.className = name;

		return this;

	}

	addClass( name ) {

		this.dom.classList.add( name );

		return this;

	}

	removeClass( name ) {

		this.dom.classList.remove( name );

		return this;

	}

	setStyle( style, array ) {

		for ( let i = 0; i < array.length; i ++ ) {

			this.dom.style[ style ] = array[ i ];

		}

		return this;

	}

	setDisabled( value ) {

		this.dom.disabled = value;

		return this;

	}

	setTextContent( value ) {

		this.dom.textContent = value;

		return this;

	}

	getIndexOfChild( element ) {

		return Array.prototype.indexOf.call( this.dom.children, element.dom );

	}

	removeEventListener( name, func ) {

		this.dom.removeEventListener( name, func );

	}

	onClick( func ) {

		this.dom.addEventListener( 'click', func );

	}

}

export { UIElement };
