import * as fabric from 'fabric';
import { JSDOM } from 'jsdom';

// Simulate browser environment
const dom = new JSDOM(`<!DOCTYPE html><html><body><canvas id="c"></canvas></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

try {
  const canvasEl = document.getElementById('c');
  const canvas = new fabric.Canvas(canvasEl, {
    width: 800,
    height: 600
  });
  console.log('Success! Canvas created.');
  console.log('Canvas Type:', typeof canvas);
  console.log('Is valid instance?', canvas instanceof fabric.Canvas);
} catch (e) {
  console.error('Initialization Error:', e);
}
