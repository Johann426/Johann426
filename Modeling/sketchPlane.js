// define sketch plane (Hesse normal form)
class sketchPlane {

	constructor( v, s ) {

		this.normal = v.normalize();
		this.scalar = s;

	}

	get normal() {

		return this.normal;

	}

	get scalar() {

		return this.scalar;

	}

	set( v, s ) {

		this.normal.copy( v.normalize() );
		this.scalar = s;

	}

}

export { sketchPlane };
