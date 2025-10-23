let cube; // keep cube instance global
document.getElementById('res').innerHTML = 'Initializing solver in worker...';
// Draw scrambled cube immediately
function initCube() {
  cube = new Cube();
  //cube.randomize()
  // Show cube state right away
  document.getElementById('cube').innerHTML = cube.asString();
  init3DCube('cube3d'); // start 3D cube
}
initCube();
// Start the worker
setTimeout(() => {
  try {
    document.getElementById('load').remove();
  } catch {}
}, 10000);
const worker = new Worker('Corker.js');
worker.onmessage = function (e) {
  if (e.data.type === 'ready') {
    document.getElementById('res').innerHTML = 'Solver ready!';
    document.getElementById('load').remove();
    // Now that solver is ready, send the cube state
    //worker.postMessage({ type: 'solve', state: cube.asString() });
  }
  if (e.data.type === 'solution') {
    //return;
    document.getElementById('res').innerHTML = 'Solution: ' + e.data.solution;
    const moves = e.data.solution.trim().split(/\s+/);
    // 3D animation
    //animate3DSolution(moves, 10);
    //
    SpikeCube(moves);
    /*document.getElementById('res').innerHTML = 'Solution: ' + e.data.solution;
 
    const moves = e.data.solution.trim().split(/\s+/);
    // Animate the cube solving step by step
    animateSolution(cube, moves, 'cubeCanvas', 600);*/
  }
};
async function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function sleep(miliseconds) {
  const currentTime = new Date().getTime();
  while (currentTime + miliseconds >= new Date().getTime()) {}
}
// Copy MAC address
function copy_mac() {
  const mac = document.getElementById('mac');
  mac.select();
  mac.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(mac.innerText);
}
// --- Store moves ---
var moves = [];
// Wait for the cube iframe to load
document.getElementById('cube-view').onload = function () {
  // Reset moves on load (clear state)
  moves = [];
  const iframeWindow = document.getElementById('cube-view').contentWindow;
  var macs = 'D6:B4:0A:E0:62:72';
  iframeWindow.prompt = function (...args) {
    console.log(...args);
    return macs;
  };
  if (iframeWindow) {
    const originalLog = iframeWindow.console.log;
    iframeWindow.console.log = function (...args) {
      originalLog.apply(console, args);
      if (args[1] && args[1].type === 'MOVE') {
        const move1 = args[1].move;
        moves.push(move1); // store as plain text
        console.log('Stored move:', move1);
        move(move1);
      }
    };
  }
};
// --- Send inverse moves ---
function reset2() {
  resetCube();
}
const reversedMoves = new Set(['D', 'L', 'F']);
// --- Perform moves (no colors) ---
async function move(mov) {
  moves.push(mov);
  cube.move(mov);
  console.log('Executing move:', mov);
  let clockwise = !mov.endsWith("'");
  let face = mov.replace("'", '');
  if (reversedMoves.has(face)) {
    clockwise = !clockwise;
  }
  await window.rotateFace(face, clockwise);
}
window.mover = move;
var ifr = document.getElementById('cube-view');
const targetFrame = window.top.frames[0];
function connect() {
  targetFrame.postMessage('connect');
}
function reset() {
  reset2();
  targetFrame.postMessage('reset');
}