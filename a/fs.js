document.addEventListener('fullscreenchange', (event) => {
  if (!document.fullscreenElement) {
    document.getElementById(
      'full'
    ).innerHTML = `<i class="fa-solid fa-expand"></i>`;
    fullscreenstate = false;
  }
  if (document.fullscreenElement) {
    document.getElementById(
      'full'
    ).innerHTML = `<i class="fa-solid fa-compress"></i>`;
    fullscreenstate = true;
  }
});

async function resetMotors() {
  if (!SpikeState.left && !SpikeState.right) {
    log('No Spike connected');
    return;
  }
  scSecure = true;
  log('Resetting motors to home position...');

  // Reset all motors on the left side
  bettew = 4000;
  if (SpikeState.left) {
    await sendLine(
      leftWriter,
      'motor.run_to_absolute_position(port.A, 0, 50, direction=motor.SHORTEST_PATH, stop=motor.BRAKE, acceleration=1000, deceleration=1000);'
    );
    await new Promise((resolve) => setTimeout(resolve, bettew));
    await sendLine(
      leftWriter,
      'motor.run_to_absolute_position(port.C, 0, 50, direction=motor.SHORTEST_PATH, stop=motor.BRAKE, acceleration=1000, deceleration=1000);'
    );
    await new Promise((resolve) => setTimeout(resolve, bettew));
    await sendLine(
      leftWriter,
      'motor.run_to_absolute_position(port.E, 0, 50, direction=motor.SHORTEST_PATH, stop=motor.BRAKE, acceleration=1000, deceleration=1000);'
    );
    await new Promise((resolve) => setTimeout(resolve, bettew));
  }

  // Reset all motors on the right side
  if (SpikeState.right) {
    await sendLine(
      rightWriter,
      'motor.run_to_absolute_position(port.D, 0, 50, direction=motor.SHORTEST_PATH, stop=motor.BRAKE, acceleration=1000, deceleration=1000);'
    );
    await new Promise((resolve) => setTimeout(resolve, bettew));
    await sendLine(
      rightWriter,
      'motor.run_to_absolute_position(port.F, 0, 50, direction=motor.SHORTEST_PATH, stop=motor.BRAKE, acceleration=1000, deceleration=1000);'
    );
    await new Promise((resolve) => setTimeout(resolve, bettew));
    await sendLine(
      rightWriter,
      'motor.run_to_absolute_position(port.B, 0, 50, direction=motor.SHORTEST_PATH, stop=motor.BRAKE, acceleration=1000, deceleration=1000);'
    );
    await new Promise((resolve) => setTimeout(resolve, bettew));
  }

  log('Motors reset complete');
  scSecure = false;
}

function sexyMoves1() {
  SpikeCube(sexyMove1, 200);
}
function sexyMoves2() {
  SpikeCube(sexyMove2, 200);
}
function sexyMoves3() {
  SpikeCube(sexyMove3, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  const keyToCubeMove = {
    5: 'U',
    t: "U'",
    g: 'U2',
    6: 'R',
    y: "R'",
    h: 'R2',
    7: 'F',
    u: "F'",
    j: 'F2',
    8: 'L',
    i: "L'",
    k: 'L2',
    9: 'D',
    o: "D'",
    l: 'D2',
    0: 'B',
    p: "B'",
    ';': 'B2',
  };
  let keyboard = {
    1: sexyMoves1,
    2: sexyMoves2,
    3: sexyMoves3,
    c: FullConnect,
    r: reset,
    enter: sc,
    w: StartCube,
    s: spin,
    f: fullscreen,
    backspace: scramble,
  };
  document.body.addEventListener('keydown', (e) => {
    console.log('Key pressed:', e.key);
    const fn = keyboard[e.key] || keyboard[e.key.toLowerCase()];
    const fn2 = keyToCubeMove[e.key] || keyToCubeMove[e.key.toLowerCase()];
    if (fn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      console.log('working');
      fn();
    }
    if (fn2) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      playMove(fn2);
    }
    bc.postMessage('key' + e.key);
  });
  document.body.addEventListener('keyup', (e) => {
    bc.postMessage('ked' + e.key);
  });
});

// Connection to a broadcast channel
const bc = new BroadcastChannel('test_channel');
// Example of sending of a very simple message
bc.postMessage('This is a test message.');

bc.onmessage = (event) => {
  var data = event.data;
  if (data == true) {
    document.getElementById('timerBlock').style.display = 'none';
  } else if (data == false) {
    document.getElementById('timerBlock').style.display = 'block';
  }
};
