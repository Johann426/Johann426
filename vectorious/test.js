import { array, random, range } from './index.esm.js';

console.log( ' hello ' );

const a = array( [[1,0,0], [0.0,0.5,0.0], [0,0,1]] ); //random(3, 3).scale(10);
const b = array( [4,5,6] ).reshape(3,1); //random(3, 1).scale(10);

console.log(a);
console.log(b);
console.log(a.solve(b));