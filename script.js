const cnv = document.getElementById('canvas');
const ctx = cnv.getContext('2d');

const squareSize = 50;
const rowNum = 15;
const columnNum = 12;
cnv.width = squareSize * columnNum;
cnv.height = squareSize * rowNum;

let scoreEl = document.getElementById('score');

const ballSize = 12;
const framesToMove = 1;
let ballsLeft;
let squaresMoving;
let addBalls;
let score;
let stepsPerFrame;
let mouse;
let balls;
let grid;
let rgb;
let ballColor;
let markerStart;
let markerEnd;
let aim;

class Ball {
  constructor(angle, index) {
    this.index = index;

    this.x = markerStart.x;
    this.y = markerStart.y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 10;
    this.r = ballSize;
    this.sliding = false;

    this.setVelocity(angle);
    balls[this.index] = this;
  }

  draw() {
    if (this.vy != 0 && +Math.sqrt(this.vx ** 2 + this.vy ** 2).toFixed(5) != 10) {
      throw 'bad';
      // saveGameState();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = ballColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  }

  step() {
    this.move();
    if (this.sliding) this.slide();
    else this.checkCollision();
    if (!balls[this.index]) return;
  }

  setVelocity(angle) {
    this.vx = this.speed * Math.cos(angle);
    this.vy = this.speed * Math.sin(angle);
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;
  }

  slide() {
    if (Math.sign(this.vx) * (markerEnd.x - (this.x + this.vx)) <= 0) {
      balls[this.index] = null;
      if (isLast()) addScore();

      function isLast() {
        for (let i = 0; i < balls.length; i++) {
          if (balls[i]) return false;
        }
        return true;
      }
    }
  }

  checkCollision() {
    if (this.x + this.r > cnv.width) {
      this.vx *= -1;
      this.x = cnv.width - this.r;
    } else if (this.x - this.r < 0) {
      this.vx *= -1;
      this.x = this.r;
    }

    if (this.y - this.r < 0) {
      this.vy *= -1;
      this.y = this.r;
    } else if (this.y + this.r > cnv.height) {
      ballsLeft--;

      if (ballsLeft === balls.length - 1) {
        markerEnd.x = this.x;
        balls[this.index] = null;
        if (balls.length === 1) addScore();
        return;
      }

      this.sliding = true;
      this.vx = Math.sign(markerEnd.x - this.x) * this.speed;
      this.vy = 0;
      this.y = cnv.height - this.r;
      return;
    }

    let collisions = [];
    let velocities = { x: this.vx, y: this.vy };

    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        // Orb collision check
        if (grid[i][j] instanceof Orb) {
          let orb = grid[i][j];
          if ((orb.x - this.x) ** 2 + (orb.y - this.y) ** 2 < (orb.outerR + this.r) ** 2) {
            grid[i][j] = null;
            addBalls++;
          }
          continue;
        }

        // Square collision check
        const square = grid[i][j];
        if (!square || square.transparency != 1) continue;

        const squareEdges = {
          l: square.x,
          r: square.x + square.size,
          t: square.y,
          b: square.y + square.size,
        };

        if (this.x > squareEdges.l && this.x < squareEdges.r && this.y > squareEdges.t && this.y < squareEdges.b) {
          collisions.push(square);
        }

        let dist = {
          x: 0,
          y: 0,
        };

        if (this.x < squareEdges.l) {
          dist.x = squareEdges.l - this.x;
        } else if (this.x > squareEdges.r) {
          dist.x = squareEdges.r - this.x;
        }

        if (this.y < squareEdges.t) {
          dist.y = squareEdges.t - this.y;
        } else if (this.y > squareEdges.b) {
          dist.y = squareEdges.b - this.y;
        }

        const totalDist = Math.sqrt(dist.x ** 2 + dist.y ** 2);

        if (totalDist < this.r) collisions.push(square);
      }
    }

    for (let i = 0; i < collisions.length; i++) {
      const collision = collisions[i];
      const edges = {
        l: collision.x,
        r: collision.x + collision.size,
        t: collision.y,
        b: collision.y + collision.size,
      };

      collision.health--;

      const hit = checkAdjacent(hitWhat(this));
      if (!hit) continue;

      if (hit === 'l') {
        this.x = edges.l - this.r;
        velocities.x = -Math.abs(this.vx);
      } else if (hit == 'r') {
        this.x = edges.r + this.r;
        velocities.x = Math.abs(this.vx);
      } else if (hit === 't') {
        this.y = edges.t - this.r;
        velocities.y = -Math.abs(this.vy);
      } else if (hit === 'b') {
        this.y = edges.b + this.r;
        velocities.y = Math.abs(this.vy);
      } else {
        const corner = {
          x: edges[hit[1]],
          y: edges[hit[0]],
        };

        fixPos(corner, this);
        cornerBounce(corner, this);
      }

      function checkAdjacent(hit) {
        // If the ball has hit the corner of the square check for grid adjacent to it

        const left = grid[collision.yIndex][collision.xIndex - 1];
        const right = grid[collision.yIndex][collision.xIndex + 1];
        const above = grid[collision.yIndex - 1][collision.xIndex];
        const below = grid[collision.yIndex + 1][collision.xIndex];

        const leftBool = left && left instanceof Square ? true : false;
        const rightBool = right && right instanceof Square ? true : false;
        const aboveBool = above && above instanceof Square ? true : false;
        const belowBool = below && below instanceof Square ? true : false;

        // Check top left
        if (hit === 'tl') {
          if (leftBool && aboveBool) return;
          else if (leftBool) return 't';
          else if (aboveBool) return 'l';
        }
        // Check top right
        else if (hit === 'tr') {
          if (rightBool && aboveBool) return;
          else if (rightBool) return 't';
          else if (aboveBool) return 'r';
        }
        // Check bottom left
        else if (hit === 'bl') {
          if (leftBool && belowBool) return;
          else if (leftBool) return 'b';
          else if (belowBool) return 'l';
        }
        // Check bottom right
        else if (hit === 'br') {
          if (rightBool && belowBool) return;
          else if (rightBool) return 'b';
          else if (belowBool) return 'r';
        }

        // No corners were hit
        return hit;
      }

      function hitWhat(thisBall) {
        const lastPos = {
          x: thisBall.x - thisBall.vx,
          y: thisBall.y - thisBall.vy,
        };

        let maybeHit = {
          sides: [],
          corners: [],
        };

        //   Based on the direction of the ball
        //   which parts of the square could have been hit
        if (thisBall.vx > 0) {
          maybeHit.sides.push('l');
          maybeHit.corners.push('tl', 'bl');
          if (thisBall.vy > 0) {
            maybeHit.corners.push('tr');
          } else if (thisBall.vy < 0) {
            maybeHit.corners.push('br');
          }
        } else if (thisBall.vx < 0) {
          maybeHit.sides.push('r');
          maybeHit.corners.push('tr', 'br');
          if (thisBall.vy > 0) {
            maybeHit.corners.push('tl');
          } else if (thisBall.vy < 0) {
            maybeHit.corners.push('bl');
          }
        }

        if (thisBall.vy > 0) {
          maybeHit.sides.push('t');
        } else if (thisBall.vy < 0) {
          maybeHit.sides.push('b');
        }

        // Check all the sides that were maybe hit to see whether they were actually hit
        for (let i = 0; i < maybeHit.sides.length; i++) {
          let side = maybeHit.sides[i];

          if (checkSide(thisBall, side, lastPos)) {
            return side;
          }
        }

        // Check all the corners that were maybe hit to see whether they were actually hit
        for (let i = 0; i < maybeHit.corners.length; i++) {
          let corner = maybeHit.corners[i];

          if (i === maybeHit.corners.length - 1 || checkCorner(thisBall, corner, lastPos)) {
            return corner;
          }
        }
      }

      function checkSide(thisBall, side, lastPos) {
        const axis1 = side === 'l' || side === 'r' ? 'x' : 'y';
        const axis2 = axis1 === 'x' ? 'y' : 'x';
        const r = side === 'l' || side == 't' ? -thisBall.r : thisBall.r;

        const timeToSide = (edges[side] - lastPos[axis1] + r) / thisBall['v' + axis1];
        const valueAtSide = lastPos[axis2] + thisBall['v' + axis2] * timeToSide;

        if (axis1 === 'x' && edges.t < valueAtSide && valueAtSide < edges.b) {
          return true;
        } else if (axis1 === 'y' && edges.l < valueAtSide && valueAtSide < edges.r) {
          return true;
        } else {
          return false;
        }
      }

      function checkCorner(thisBall, corner, lastPos) {
        // Get the x and y of the corner and whether the radius should be added or subtracted
        const sideX = edges[corner[1]];
        const signX = corner[1] === 'l' ? -1 : 1;

        const sideY = edges[corner[0]];
        const signY = corner[0] === 't' ? -1 : 1;

        // Find the y value of the ball when its a radius away from the x side
        const timeToX = (sideX + signX * thisBall.r - lastPos.x) / thisBall.vx;
        const valueY = lastPos.y + thisBall.vy * timeToX;

        // Find the x value of the ball when its a radius away from the y side
        const timeToY = (sideY + signY * thisBall.r - lastPos.y) / thisBall.vy;
        const valueX = lastPos.x + thisBall.vx * timeToY;

        // Convert path of ball to general form ax + by + c = 0
        const a = thisBall.vy;
        const b = -thisBall.vx;
        const c = -a * thisBall.x - b * thisBall.y;

        // Get distance from the corner to the closest point on the line
        const distToCorner = Math.abs(a * sideX + b * sideY + c) / Math.sqrt(a ** 2 + b ** 2);

        // Check if it hit the corner
        if (distToCorner < thisBall.r) {
          if (signX === -Math.sign(thisBall.vx)) {
            if (valueY * signY > sideY * signY) {
              return true;
            }
          } else if (valueX * signX > sideX * signX) {
            return true;
          }
        }

        return false;
      }

      function fixPos(corner, thisBall) {
        // Using the quadratic formula solve for t in this equation of a circle moving along a straight line at the point where it touches the corner:
        // (corner.x - (thisBall.x + thisBall.vx * t))**2 + (corner.y - (thisBall.y + thisBall.vy * t))**2 = r**2
        const a = thisBall.vx ** 2 + thisBall.vy ** 2;
        const b =
          -2 * corner.x * thisBall.vx +
          2 * thisBall.x * thisBall.vx -
          2 * corner.y * thisBall.vy +
          2 * thisBall.y * thisBall.vy;
        const c =
          corner.x ** 2 -
          2 * corner.x * thisBall.x +
          thisBall.x ** 2 +
          corner.y ** 2 -
          2 * corner.y * thisBall.y +
          thisBall.y ** 2 -
          thisBall.r ** 2;

        const numerator = -b - Math.sqrt(b ** 2 - 4 * a * c);
        const denominator = 2 * a;
        const t = numerator / denominator;

        // Set the position of the circle to be exactly where it hits the corner
        thisBall.x += thisBall.vx * t;
        thisBall.y += thisBall.vy * t;
      }

      function cornerBounce(corner, thisBall) {
        const vector = { x: thisBall.vx / thisBall.speed, y: thisBall.vy / thisBall.speed };
        const normal = { x: (corner.x - thisBall.x) / thisBall.r, y: (corner.y - thisBall.y) / thisBall.r };
        const dotProduct = getDotProduct(vector, normal);
        const reflection = subtractVectors(vector, scaleVector(normal, 2 * dotProduct));
        velocities.x = reflection.x * thisBall.speed;
        velocities.y = reflection.y * thisBall.speed;

        function getDotProduct(a, b) {
          return a.x * b.x + a.y * b.y;
        }

        function subtractVectors(a, b) {
          return {
            x: a.x - b.x,
            y: a.y - b.y,
          };
        }

        function scaleVector(vector, scalar) {
          return {
            x: vector.x * scalar,
            y: vector.y * scalar,
          };
        }
      }
    }

    this.vx = velocities.x;
    this.vy = velocities.y;
  }
}

class Orb {
  constructor(xIndex, yIndex) {
    this.xIndex = xIndex;
    this.yIndex = yIndex || 0;
    this.innerR = 7;
    this.outerRSize = 12;
    this.outerR = this.outerRSize;
    this.type = 'orb';

    grid[this.yIndex][this.xIndex] = this;
  }

  draw() {
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'black';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.innerR, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.outerR, 0, 2 * Math.PI);
    ctx.stroke();
  }

  step() {
    this.x = this.xIndex * squareSize + squareSize / 2;
    this.y = this.yIndex * squareSize + squareSize / 2;
    this.outerR = this.outerRSize + Math.sin(0.3 * frameCount);
  }
}

class Square {
  constructor(xIndex, yIndex, health) {
    this.xIndex = xIndex;
    this.yIndex = yIndex || 0;
    this.health = health || (Math.random() < 0.8 ? score : 2 * score);
    this.size = squareSize;
    this.fontSize = this.size / 2;
    this.backgroundColor = 'white';
    this.transparency = 1;
    this.type = 'square';

    grid[this.yIndex][this.xIndex] = this;
  }

  draw() {
    ctx.globalAlpha = this.transparency;
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(this.x, this.y, this.size, this.size);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(this.x, this.y, this.size, this.size);

    ctx.fillStyle = 'red';
    ctx.font = `${this.fontSize}px Comic Sans MS`;
    const width = ctx.measureText(this.health).width;
    ctx.fillText(this.health, this.x - width / 2 + this.size / 2, this.y + this.fontSize / 3 + this.size / 2);
  }

  step() {
    if (this.health <= 0) {
      this.transparency -= 0.1;
      this.health = 0;
    }
    if (this.transparency <= 0) return (grid[this.yIndex][this.xIndex] = null);

    this.x = this.xIndex * squareSize;
    this.y = this.yIndex * squareSize;
  }
}

function initialize() {
  ballsLeft = -1;
  squaresMoving = false;
  addBalls = 0;
  score = 1;
  stepsPerFrame = 1;
  mouse = {};
  balls = [null];

  rgb = [
    { value: 0, change: 0 },
    { value: 0, change: 0 },
    { value: 0, change: 0 },
  ];
  ballColor = `rgb(${rgb[0].value}, ${rgb[1].value}, ${rgb[2].value})`;

  grid = [];

  for (let n = 0; n < rowNum; n++) {
    let array = [];
    for (let n = 0; n < columnNum; n++) {
      array.push(null);
    }
    grid.push(array);
  }

  markerStart = {
    x: cnv.width / 2,
    y: cnv.height - ballSize,
    r: ballSize,
    shooting: false,
    angle: 0,
    frameShot: 0,
    ballIndex: 0,
    shootDelay: 5,

    draw() {
      if (!this.shooting && ballsLeft > -1) return;
      ctx.globalAlpha = 1;
      ctx.fillStyle = ballColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      ctx.fill();
    },

    step() {
      if (this.disappear) {
        if (this.r > 0.5) {
          this.r -= ballSize / framesToMove;
          this.y += ballSize / framesToMove;
        } else {
          this.r = 0;
        }
      }

      if (this.shooting) this.shoot();
    },

    shoot() {
      if ((frameCount - this.frameShot) % this.shootDelay && frameCount - this.frameShot) return;
      new Ball(this.angle + Math.PI + this.ballIndex * 0.0001 * 0, this.ballIndex);
      this.ballIndex++;

      if (this.ballIndex >= balls.length) this.shooting = false;
    },
  };

  markerEnd = {
    x: 0,
    y: cnv.height - ballSize,
    r: ballSize,

    draw() {
      if (ballsLeft === balls.length || ballsLeft === -1) return;

      ctx.globalAlpha = 1;
      ctx.fillStyle = ballColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      ctx.fill();
    },
  };

  aim = {
    x: markerStart.x,
    y: markerStart.y,
    r: 7,
    spacing: 15,
    angle: 0,
    goodAngle: false,

    draw() {
      if (!mouse.down || ballsLeft > -1 || squaresMoving) return;

      this.updateAngle();
      this.goodAngle = this.spacing > 20 && this.angle > 0.05 && this.angle < Math.PI - 0.05 ? true : false;

      if (!this.goodAngle) return;

      ctx.globalAlpha = 1;
      ctx.fillStyle = ballColor;

      for (let n = 1; n <= 10; n++) {
        const coords = this.getCoords(n);

        ctx.beginPath();
        ctx.arc(coords.x, coords.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
      }
    },

    updateAngle() {
      const run = mouse.x - mouse.downX;
      const rise = mouse.y - mouse.downY;

      this.angle = Math.atan2(rise, run);

      this.spacing = Math.sqrt(run ** 2 + rise ** 2) * 0.1 + 15;
    },

    getCoords(n) {
      const hyp = this.y - (this.y - n * this.spacing);

      const x = markerStart.x - hyp * Math.cos(this.angle);
      const y = markerStart.y - hyp * Math.sin(this.angle);

      return { x: x, y: y };
    },
  };
}

function updateColor() {
  ballColor = `rgb(${rgb[0].value}, ${rgb[1].value}, ${rgb[2].value})`;
}

function addScore() {
  for (let n = 0; n < addBalls; n++) balls.push(null);
  addBalls = 0;
  ballsLeft--;
  markerStart.x = markerEnd.x;
  score++;
  scoreEl.innerHTML = score;
  generateSquares();
  aim.angle = Math.random() * Math.PI;
  shootBalls();
}

function generateSquares() {
  const max = 5;
  const min = 3;
  const squareNum = Math.floor(Math.random() * (max + 1 - min) + min);

  let indexes = grid[0].map((_value, index) => index);

  for (let n = 0; n < grid[0].length - (squareNum + 1); n++) {
    indexes.splice(Math.floor(Math.random() * indexes.length), 1);
  }

  // Create orbs
  if (score > 1) {
    const randIndex = Math.floor(Math.random() * indexes.length);
    grid[0][indexes[randIndex]] = new Orb(indexes[randIndex]);
    indexes.splice(randIndex, 1);
  }

  for (let i = 0; i < indexes.length; i++) {
    grid[0][indexes[i]] = new Square(indexes[i]);
  }
  moveSquares();
}

function moveSquares() {
  if (!squaresMoving) {
    for (let i = grid.length - 1; i >= 0; i--) {
      grid[i] = grid[i - 1] || new Array(grid[0].length).fill(null);
    }
  }
  squaresMoving = true;

  for (let i = 0; i < grid[grid.length - 1].length; i++) {
    if (grid[grid.length - 1][i]) markerStart.disappear = true;
  }

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const square = grid[i][j];
      if (square) {
        square.yIndex += 1 / framesToMove;
        if (Number.isInteger(+square.yIndex.toFixed(3))) {
          squaresMoving = false;
          square.yIndex = Math.round(square.yIndex);
        }
      }
    }
  }
}

function loadGameState() {
  initialize();

  const gameState = JSON.parse(localStorage.getItem('gameState'));
  markerStart.x = gameState.markerX;
  aim.angle = gameState.aimAngle;
  balls = new Array(gameState.ballNum).fill(null);
  score = gameState.score;
  scoreEl.innerHTML = score;

  for (let i = 0; i < gameState.grid.length; i++) {
    const cell = gameState.grid[i];
    if (cell.type === 'orb') {
      new Orb(cell.xIndex, cell.yIndex - 1);
    } else if (cell.type === 'square') {
      new Square(cell.xIndex, cell.yIndex - 1, cell.health);
    }
  }

  moveSquares();
  if (gameState.shoot) shootBalls();
}

function saveGameState() {
  let saveGrid = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];
      if (cell) {
        saveGrid.push({
          xIndex: cell.xIndex,
          yIndex: cell.yIndex,
          health: cell.health,
          type: cell.type,
        });
      }
    }
  }
  let gameState = {
    markerX: markerStart.x,
    aimAngle: aim.angle,
    shoot: ballsLeft > -1,
    score: score,
    ballNum: balls.length,
    grid: saveGrid,
  };
  localStorage.setItem('gameState', JSON.stringify(gameState));
}

function reloadScript() {
  let scriptElement = document.getElementById('script');
  let parentElement = scriptElement.parentNode;
  parentElement.removeChild(scriptElement);

  let head = document.getElementsByTagName('head')[0];
  let script = document.createElement('script');
  script.src = 'script.js';
  head.appendChild(script);
}

function shootBalls() {
  markerStart.shooting = true;
  markerStart.angle = aim.angle;
  markerStart.frameShot = frameCount - 1;
  markerStart.ballIndex = 0;
  ballsLeft = balls.length;
}

document.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

document.addEventListener('mousedown', () => {
  mouse.downX = mouse.x;
  mouse.downY = mouse.y;
  mouse.down = true;
});

document.addEventListener('mouseup', () => {
  mouse.down = false;

  if (aim.goodAngle && ballsLeft === -1) shootBalls();
});

let frameCount = 0;
function loop() {
  // Simulation steps
  for (let n = 0; n < stepsPerFrame; n++) {
    frameCount++;

    // Change colors randomly
    for (let i = 0; i < rgb.length; i++) {
      rgb[i].value += rgb[i].change;
      if (rgb[i].value <= 0 || rgb[i].value >= 256) {
        rgb[i].value = rgb[i].value < 0 ? 0 : 256;
        const sign = rgb[i].value === 0 ? 1 : -1;
        rgb[i].change = sign * Math.random() * 5;
      }
    }
    updateColor();

    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        grid[i][j]?.step();
      }
    }

    for (let i = 0; i < balls.length; i++) {
      if (balls[i]) {
        balls[i].step();
      }
    }

    markerStart.step();

    if (squaresMoving) moveSquares();
  }

  // Animation frames
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      grid[i][j]?.draw();
    }
  }

  for (let i = 0; i < balls.length; i++) {
    if (balls[i]) {
      balls[i].draw();
    }
  }

  aim.draw();
  markerStart.draw();
  markerEnd.draw();

  requestAnimationFrame(loop);
}

localStorage.gameState =
  '{"markerX":252.90892354892955,"aimAngle":0.8194832810800086,"shoot":true,"score":70,"ballNum":1,"grid":[{"xIndex":5,"yIndex":1,"health":5,"type":"square"},{"xIndex":4,"yIndex":2,"health":51,"type":"square"},{"xIndex":5,"yIndex":2,"health":51,"type":"square"},{"xIndex":6,"yIndex":2,"health":34,"type":"square"},{"xIndex":8,"yIndex":2,"health":0,"type":"square"},{"xIndex":2,"yIndex":3,"health":68,"type":"square"},{"xIndex":6,"yIndex":3,"health":43,"type":"square"},{"xIndex":9,"yIndex":3,"health":19,"type":"square"},{"xIndex":0,"yIndex":4,"health":116,"type":"square"},{"xIndex":3,"yIndex":4,"type":"orb"},{"xIndex":5,"yIndex":4,"health":0,"type":"square"},{"xIndex":8,"yIndex":4,"health":45,"type":"square"},{"xIndex":9,"yIndex":4,"health":37,"type":"square"},{"xIndex":11,"yIndex":4,"health":40,"type":"square"},{"xIndex":0,"yIndex":5,"health":48,"type":"square"},{"xIndex":1,"yIndex":5,"health":39,"type":"square"},{"xIndex":7,"yIndex":5,"type":"orb"},{"xIndex":10,"yIndex":5,"health":0,"type":"square"},{"xIndex":0,"yIndex":7,"health":20,"type":"square"},{"xIndex":3,"yIndex":7,"health":21,"type":"square"}]}';
// '{"markerX":252.90892354892955,"aimAngle":0.8194832810800086,"shoot":true,"score":70,"ballNum":1,"grid":[{"xIndex":5,"yIndex":1,"health":5,"type":"square"},{"xIndex":4,"yIndex":2,"health":51,"type":"square"},{"xIndex":5,"yIndex":2,"health":51,"type":"square"},{"xIndex":6,"yIndex":2,"health":34,"type":"square"},{"xIndex":8,"yIndex":2,"health":0,"type":"square"},{"xIndex":2,"yIndex":3,"health":68,"type":"square"},{"xIndex":6,"yIndex":3,"health":43,"type":"square"},{"xIndex":9,"yIndex":3,"health":19,"type":"square"},{"xIndex":0,"yIndex":4,"health":116,"type":"square"},{"xIndex":3,"yIndex":4,"type":"orb"},{"xIndex":5,"yIndex":4,"health":0,"type":"square"},{"xIndex":8,"yIndex":4,"health":45,"type":"square"},{"xIndex":9,"yIndex":4,"health":37,"type":"square"},{"xIndex":11,"yIndex":4,"health":40,"type":"square"},{"xIndex":0,"yIndex":5,"health":48,"type":"square"},{"xIndex":1,"yIndex":5,"health":39,"type":"square"},{"xIndex":7,"yIndex":5,"type":"orb"},{"xIndex":10,"yIndex":5,"health":0,"type":"square"},{"xIndex":0,"yIndex":7,"health":20,"type":"square"},{"xIndex":3,"yIndex":7,"health":21,"type":"square"}]}';
// '{"markerX":252.90892354892955,"aimAngle":0.8194832810800086,"shoot":true,"score":70,"ballNum":1,"grid":[{"xIndex":5,"yIndex":1,"health":5,"type":"square"},{"xIndex":4,"yIndex":2,"health":51,"type":"square"},{"xIndex":5,"yIndex":2,"health":51,"type":"square"},{"xIndex":8,"yIndex":2,"health":0,"type":"square"},{"xIndex":2,"yIndex":3,"health":68,"type":"square"},{"xIndex":6,"yIndex":3,"health":43,"type":"square"},{"xIndex":9,"yIndex":3,"health":19,"type":"square"},{"xIndex":0,"yIndex":4,"health":116,"type":"square"},{"xIndex":3,"yIndex":4,"type":"orb"},{"xIndex":5,"yIndex":4,"health":0,"type":"square"},{"xIndex":8,"yIndex":4,"health":45,"type":"square"},{"xIndex":9,"yIndex":4,"health":37,"type":"square"},{"xIndex":11,"yIndex":4,"health":40,"type":"square"},{"xIndex":0,"yIndex":5,"health":48,"type":"square"},{"xIndex":1,"yIndex":5,"health":39,"type":"square"},{"xIndex":7,"yIndex":5,"type":"orb"},{"xIndex":10,"yIndex":5,"health":0,"type":"square"},{"xIndex":0,"yIndex":7,"health":20,"type":"square"},{"xIndex":3,"yIndex":7,"health":21,"type":"square"}]}';
initialize();
loop();
generateSquares();
if (localStorage.gameState) loadGameState();

// setInterval(loop, 500);
