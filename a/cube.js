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
// This script creates and animates a 3D Rubik's Cube using Three.js.
// Global variables for the scene, camera, renderer, and cubelets
let scene,
  camera,
  renderer,
  cubed = [],
  animating = false,
  controls;
// Image loaders for textures.
const logoTexture = new THREE.TextureLoader().load('Gan_cube_brand.webp');
let currentFrontFace = 'F'; // Default: front face is 'F'
const colors = {
  U: 0xffffff, // White (no change, as it's not in the provided image)
  D: 0xffffff, // Yellow
  L: 0xffffff, // UT orange
  R: 0xffffff, // Red
  F: 0xffffff, // Lime green
  B: 0xffffff, // RISD Blue
};
/*
 
const colors = {
    "U": 0xFFFFFF, // White (no change, as it's not in the provided image)
    "D": 0xFDFF16, // Yellow
    "L": 0xFF8B21, // UT orange
    "R": 0xFA2422, // Red
    "F": 0x04D006, // Lime green
    "B": 0x275CFE  // RISD Blue
}*/
// Maps the facelet position from the cube.js string to a 3D color.
// The cube.js string order is U, R, D, L, B, F.
// This function determines the color for a specific face of a given cubelet.
function get3DColor(face, position) {
  const roundTo = (val) => Math.round(val * 10) / 10;
  const x = roundTo(position.x);
  const y = roundTo(position.y);
  const z = roundTo(position.z);
  let stickerIndex = -1;
  switch (face) {
    case 'U': // White face (top)
      if (y > 0) {
        if (x === -1 && z === -1) stickerIndex = 0; // ULB
        else if (x === 0 && z === -1) stickerIndex = 1; // UB
        else if (x === 1 && z === -1) stickerIndex = 2; // URB
        else if (x === -1 && z === 0) stickerIndex = 3; // UL
        else if (x === 0 && z === 0) stickerIndex = 4; // U
        else if (x === 1 && z === 0) stickerIndex = 5; // UR
        else if (x === -1 && z === 1) stickerIndex = 6; // ULF
        else if (x === 0 && z === 1) stickerIndex = 7; // UF
        else if (x === 1 && z === 1) stickerIndex = 8; // URF
      }
      break;
    case 'F': // Green face (front)
      if (z > 0) {
        if (y === 1 && x === -1) stickerIndex = 18; // ULF
        else if (y === 1 && x === 0) stickerIndex = 19; // UF
        else if (y === 1 && x === 1) stickerIndex = 20; // URF
        else if (y === 0 && x === -1) stickerIndex = 21; // FL
        else if (y === 0 && x === 0) stickerIndex = 22; // F
        else if (y === 0 && x === 1) stickerIndex = 23; // FR
        else if (y === -1 && x === -1) stickerIndex = 24; // DLF
        else if (y === -1 && x === 0) stickerIndex = 25; // DF
        else if (y === -1 && x === 1) stickerIndex = 26; // DRF
      }
      break;
    case 'D': // Yellow face (bottom)
      if (y < 0) {
        if (x === -1 && z === 1) stickerIndex = 27; // DLF
        else if (x === 0 && z === 1) stickerIndex = 28; // DF
        else if (x === 1 && z === 1) stickerIndex = 29; // DRF
        else if (x === -1 && z === 0) stickerIndex = 30; // DL
        else if (x === 0 && z === 0) stickerIndex = 31; // D
        else if (x === 1 && z === 0) stickerIndex = 32; // DR
        else if (x === -1 && z === -1) stickerIndex = 33; // DLB
        else if (x === 0 && z === -1) stickerIndex = 34; // DB
        else if (x === 1 && z === -1) stickerIndex = 35; // DRB
      }
      break;
    case 'R': // Red face (right) FIXED
      if (x > 0) {
        if (y === 1 && z === 1) stickerIndex = 9; // UL 9 -> UR 15 x
        else if (y === 0 && z === 1) stickerIndex = 12; // L 10 -> U 12 x
        else if (y === -1 && z === 1) stickerIndex = 15; // DL 11 -> UL 9
        else if (y === 1 && z === 0) stickerIndex = 10; // U 12 -> L 10 x
        else if (y === 0 && z === 0) stickerIndex = 13; // C 13 ->
        else if (y === -1 && z === 0) stickerIndex = 16; // D 14 -> R 16 x
        else if (y === 1 && z === -1) stickerIndex = 11; // UR 15 -> DL 11
        else if (y === 0 && z === -1) stickerIndex = 14; // R 16 -> D 14 x
        else if (y === -1 && z === -1) stickerIndex = 17; // DR 17 x
      }
      break;
    case 'L': // Orange face (left) FIXED
      if (x < 0) {
        if (y === 1 && z === -1) stickerIndex = 36; // ULF
        else if (y === 0 && z === -1) stickerIndex = 37; // LF
        else if (y === -1 && z === -1) stickerIndex = 38; // DLF
        else if (y === 1 && z === 0) stickerIndex = 39; // UL
        else if (y === 0 && z === 0) stickerIndex = 40; // L
        else if (y === -1 && z === 0) stickerIndex = 41; // DL
        else if (y === 1 && z === 1) stickerIndex = 42; // ULB
        else if (y === 0 && z === 1) stickerIndex = 43; // LB
        else if (y === -1 && z === 1) stickerIndex = 44; // DLB
      }
      break;
    case 'B': // Blue face (back)
      if (z < 0) {
        if (y === 1 && x === 1) stickerIndex = 45; // URB
        else if (y === 1 && x === 0) stickerIndex = 46; // UB
        else if (y === 1 && x === -1) stickerIndex = 47; // ULB
        else if (y === 0 && x === 1) stickerIndex = 48; // RB
        else if (y === 0 && x === 0) stickerIndex = 49; // B
        else if (y === 0 && x === -1) stickerIndex = 50; // LB
        else if (y === -1 && x === 1) stickerIndex = 51; // DRB
        else if (y === -1 && x === 0) stickerIndex = 52; // DB
        else if (y === -1 && x === -1) stickerIndex = 53; // DLB
      }
      break;
  }
  if (stickerIndex !== -1 && window.lastStateString) {
    const stateString = window.lastStateString;
    const facelet = stateString[stickerIndex];
    return colors[facelet];
  }
  return 0x000000;
}
let sdr = false;
function resetCube() {
  if (sdr) return;
  sdr = true;
  // Reset the global cube variable to a new solved instance
  cube = new Cube();
  const solvedState = cube.asString();
  // Create a new scene to prevent WebGL crashes
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
  // Rebuild cubelets
  cubed = []; // Clear existing cubelets array
  const cubeletSize = 0.95;
  const offset = 1;
  const offCenterFix = 0;
  // Rebuild all cubelets in their initial positions
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const materials = [
          new THREE.MeshStandardMaterial({ color: 0x000000 }), // right
          new THREE.MeshStandardMaterial({ color: 0x000000 }), // left
          new THREE.MeshStandardMaterial({ color: 0x000000 }), // up
          new THREE.MeshStandardMaterial({ color: 0x000000 }), // down
          new THREE.MeshStandardMaterial({ color: 0x000000 }), // front
          new THREE.MeshStandardMaterial({ color: 0x000000 }), // back
        ];
        const geo = new THREE.BoxGeometry(
          cubeletSize,
          cubeletSize,
          cubeletSize
        );
        const cubelet = new THREE.Mesh(geo, materials);
        cubelet.position.set(
          x * offset + offCenterFix,
          y * offset + offCenterFix,
          z * offset + offCenterFix
        );
        // Ensure clean rotation state
        cubelet.rotation.set(0, 0, 0);
        cubelet.quaternion.identity();
        cubelet.updateMatrix();
        scene.add(cubelet);
        cubed.push(cubelet);
        // Add black wireframe for definition
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        cubelet.add(line);
      }
    }
  }
  // Add lighting back
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);
  // Update the visual state
  update3DCubeFromState(solvedState);
  window.lastStateString = solvedState;
  // Force a renderer clear and reset
  renderer.clear();
  renderer.resetState();
  // Re-enable animations after a short delay
  setTimeout(() => {
    sdr = false;
  }, 2000);
}
/**
 * Initializes the 3D cube scene, camera, and renderer.
 * @param {string} containerId The ID of the HTML container for the 3D scene.
 */
