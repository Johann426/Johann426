class Hull {

	constructor() {
	}

	readTxt( txt ) {

		const arr = txt.split( '\r\n' );
		this.dia = Number( arr[ 4 ].split( /\s+/ )[ 1 ] );
		this.NoBlade = Number( arr[ 4 ].split( /\s+/ )[ 2 ] );
		this.HubD_face = Number( arr[ 5 ].split( /\s+/ )[ 1 ] );
		this.rbyR = arr[ 6 ].split( /\s+/ ).map( e => Number( e ) );
		this.rbyR.splice( 0, 1 );
		
		console.log( txt );

	}
	
	getCurves() {
	}

}

export { Hull };
