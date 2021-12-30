import { Vector3 } from './NurbsLib.js';

const a = new Vector3( 1, 0, 0 );
const b = new Vector3( 0, 1, 0 );

const dot = a.clone().dot( b );
const cos = dot / a.length() / b.length();
const theta = Math.acos( cos ) * 180 / 3.141592653589793;

console.log( theta );

