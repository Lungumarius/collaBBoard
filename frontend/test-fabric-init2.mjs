import * as fabric from 'fabric';
import { JSDOM } from 'jsdom';
import canvasModule from 'canvas';

// Simulate browser environment with actual canvas
const dom = new JSDOM(`<!DOCTYPE html><html><body><canvas id="c" width="800" height="600"></canvas></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

try {
  const canvasEl = document.getElementById('c');
  const canvas = new fabric.Canvas(canvasEl);
  console.log('Success! Canvas created.');
  console.log('Dimensions:', canvas.width, canvas.height);
} catch (e) {
  console.error('Initialization Error:', e);
}
