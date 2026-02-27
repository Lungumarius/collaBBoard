import * as fabric from 'fabric';

console.log('Canvas Prototype properties:');
const props = Object.getOwnPropertyNames(fabric.Canvas.prototype);
console.log('getPointer exists?', props.includes('getPointer'));
console.log('getScenePoint exists?', props.includes('getScenePoint'));
