class Container {

	constructor( id, parent, child ) {

		this.id = id;
		this.listId = null;
		this.parent = parent;
		this.child = child;
		this.container = null;

	}

	create() {

		if ( this.container !== null ) {

			console.log( 'Container already created' );
			return;

		} else {

			this.container = document.createElement( 'div' );
			this.container.id = this.id;
			this.container.appendChild( this.child );
			this.parent.appendChild( this.container );

		}

	}

	createList() {

		if ( this.listId !== null ) {

			console.log( 'List already created' );
			return;

		} else {

			const list = document.createElement( 'ul' );
			list.id = this.id + '-list';

			const container = document.getElementById( this.id );
			container.appendChild( list );

			this.listId = list.id;

		}

	}

}

export { Container };
