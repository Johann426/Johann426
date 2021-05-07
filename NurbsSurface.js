
/*
If the giiven data consists of only points (and constraints), on the basis of The NURBS Book,
this class provides a global algorithm to solve the linear equations to evaluate an unknown NURBS,
i.e., parameterized value, knot vector, and control points.
js code by Johann426.github
*/

class NurbsSurface {
	
	constructor( deg, type = 'chordal' ) {
	  
		this.pole = []; //to store points, their parameterized value, and directional constraints(option).

		this.type = type;

		this.deg = () => {

			const nm1 = this.pole.length - 1;

			return ( nm1 > deg ? deg : nm1 );

		};

	}
  

  }