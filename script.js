const cnv = document.getElementById('canvas');
const ctx = cnv.getContext('2d');

const squareSize = 50;
const ballSize = 20;
let ballsMoving = false;
cnv.width = Math.round((window.innerWidth - 40) / 2 / squareSize) * squareSize;
cnv.height = Math.round((window.innerHeight - 150) / squareSize) * squareSize;

const gameWindow = {
  l: 0,
  r: cnv.width,
  t: Math.round(150 / squareSize) * squareSize,
  b: cnv.height,
};

let mouse = {};
let objects = {
  balls: [],
  squares: [],
};

for (let n = 0; n < 5; n++) {
  objects.balls.push(null);
}

let marker = {
  x: gameWindow.l + (gameWindow.r - gameWindow.l) / 2,
  y: cnv.height - ballSize,
  r: ballSize,
  shooting: false,
  draw: true,
  angle: 0,
  frameShot: 0,
  ballIndex: 0,
  shootDelay: 5,

  draw() {
    if (this.shooting) this.shoot();
    if (objects.balls[objects.balls.length - 1]) return;

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  },

  shoot() {
    ballsMoving = true;
    if ((frameCount - this.frameShot) % this.shootDelay && frameCount - this.frameShot) return;
    new Ball(this.angle + Math.PI + this.ballIndex * 0.0001 * 0, this.ballIndex);
    this.ballIndex++;

    if (this.ballIndex >= objects.balls.length) this.shooting = false;
  },
};

let aim = {
  x: marker.x,
  y: marker.y,
  r: 7,
  spacing: 15,
  angle: 0,

  draw() {
    if (!mouse.down || ballsMoving) return;

    this.updateAngle();

    if (this.spacing < 20) return;

    for (let n = 0; n < 10; n++) {
      const coords = this.getCoords(n);

      ctx.fillStyle = 'black';
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

    const x = marker.x - hyp * Math.cos(this.angle);
    const y = marker.y - hyp * Math.sin(this.angle);

    return { x: x, y: y };
  },
};

class Ball {
  constructor(angle, index) {
    this.index = index;

    this.x = marker.x;
    this.y = marker.y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 15;
    this.r = ballSize;
    this.sliding = false;
    this.color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(
      Math.random() * 256
    )})`;

    this.setVelocity(angle);
    objects.balls[this.index] = this;
  }

  draw() {
    this.move();
    if (this.sliding) this.slide();
    this.checkCollision();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
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
    if (Math.sign(this.vx) * (marker.x - (this.x + this.vx)) <= 0) {
      objects.balls[this.index] = null;
    }
  }

  checkCollision() {
    if (this.x + this.r > gameWindow.r) {
      this.vx *= -1;
      this.x = gameWindow.r - this.r;
    } else if (this.x - this.r < gameWindow.l) {
      this.vx *= -1;
      this.x = gameWindow.l + this.r;
    }

    if (this.y - this.r < gameWindow.t) {
      this.vy *= -1;
      this.y = gameWindow.t + this.r;
    } else if (this.y + this.r > gameWindow.b) {
      if (this.index === 0) marker.x = this.x;
      if (this.index === objects.balls.length - 1) ballsMoving = false;

      this.sliding = true;
      this.vx = Math.sign(marker.x - this.x) * this.speed;
      this.vy = 0;
      this.y = gameWindow.b - this.r;
    }

    for (let i = 0; i < objects.squares.length; i++) {
      if (!this.vx && !this.vy) return;

      const square = objects.squares[i];

      const squareEdges = {
        l: square.x,
        r: square.x + square.size,
        t: square.y,
        b: square.y + square.size,
      };

      function colliding(thisBall) {
        if (
          thisBall.x > squareEdges.l &&
          thisBall.x < squareEdges.r &&
          thisBall.y > squareEdges.t &&
          thisBall.y < squareEdges.b
        ) {
          return true;
        }

        let dist = {
          x: 0,
          y: 0,
        };

        if (thisBall.x < squareEdges.l) {
          dist.x = squareEdges.l - thisBall.x;
        } else if (thisBall.x > squareEdges.r) {
          dist.x = squareEdges.r - thisBall.x;
        }

        if (thisBall.y < squareEdges.t) {
          dist.y = squareEdges.t - thisBall.y;
        } else if (thisBall.y > squareEdges.b) {
          dist.y = squareEdges.b - thisBall.y;
        }

        const totalDist = Math.sqrt(dist.x ** 2 + dist.y ** 2);

        if (totalDist < thisBall.r) return true;
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

        for (let i = 0; i < maybeHit.sides.length; i++) {
          let side = maybeHit.sides[i];

          if (checkSide(thisBall, side, lastPos)) {
            return side;
          }
        }

        for (let i = 0; i < maybeHit.corners.length; i++) {
          let corner = maybeHit.corners[i];

          if (i == maybeHit.corners.length - 1 || checkCorner(thisBall, corner, lastPos)) {
            return corner;
          }
        }
      }

      if (colliding(this)) {
        const hit = hitWhat(this);

        if (hit === 'l') {
          this.x = squareEdges.l - this.r;
          this.vx *= -1;
        } else if (hit == 'r') {
          this.x = squareEdges.r + this.r;
          this.vx *= -1;
        } else if (hit === 't') {
          this.y = squareEdges.t - this.r;
          this.vy *= -1;
        } else if (hit === 'b') {
          this.y = squareEdges.b + this.r;
          this.vy *= -1;
        } else {
          const corner = {
            x: squareEdges[hit[1]],
            y: squareEdges[hit[0]],
          };

          fixPos(corner, this);
          cornerBounce(corner, this);
        }
      }

      function checkSide(thisBall, side, lastPos) {
        const axis1 = side === 'l' || side === 'r' ? 'x' : 'y';
        const axis2 = axis1 === 'x' ? 'y' : 'x';
        const r = side === 'l' || side == 't' ? -thisBall.r : thisBall.r;

        const timeToSide = (squareEdges[side] - lastPos[axis1] + r) / thisBall['v' + axis1];
        const valueAtSide = lastPos[axis2] + thisBall['v' + axis2] * timeToSide;

        if (axis1 === 'x' && squareEdges.t < valueAtSide && valueAtSide < squareEdges.b) {
          return true;
        } else if (axis1 === 'y' && squareEdges.l < valueAtSide && valueAtSide < squareEdges.r) {
          return true;
        } else {
          return false;
        }
      }

      function checkCorner(thisBall, corner, lastPos) {
        // Get the x and y of the corner and whether the radius should be added or subtracted
        const sideX = squareEdges[corner[1]];
        const signX = corner[1] === 'l' ? -1 : 1;

        const sideY = squareEdges[corner[0]];
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
        const magnitude = Math.sqrt(thisBall.vx ** 2 + thisBall.vy ** 2);
        const vector = { x: thisBall.vx / magnitude, y: thisBall.vy / magnitude };
        const normal = { x: (corner.x - thisBall.x) / thisBall.r, y: (corner.y - thisBall.y) / thisBall.r };
        const dotProduct = getDotProduct(vector, normal);
        const reflection = subtractVectors(vector, scaleVector(normal, 2 * dotProduct));
        thisBall.vx = reflection.x * thisBall.speed;
        thisBall.vy = reflection.y * thisBall.speed;

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
  }
}

class Square {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.health = objects.balls.length;

    this.size = 200;
    this.fontSize = this.size / 2;

    objects.squares.push(this);
  }

  draw() {
    ctx.strokeStyle = 'black';
    ctx.strokeRect(this.x, this.y, this.size, this.size);

    ctx.fillStyle = 'red';
    ctx.font = `${this.fontSize}px Comic Sans MS`;
    const width = ctx.measureText(this.health).width;
    ctx.fillText(this.health, this.x - width / 2 + this.size / 2, this.y + this.fontSize / 3 + this.size / 2);
  }
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

  if (!marker.shooting && aim.spacing > 20 && !ballsMoving) {
    marker.shooting = true;
    marker.angle = aim.angle;
    marker.frameShot = frameCount - 1;
    marker.ballIndex = 0;
  }
});

let frameCount = 0;

function loop() {
  frameCount++;
  ctx.clearRect(0, 0, cnv.width, cnv.height);

  for (let y = gameWindow.t; y < gameWindow.b; y += squareSize) {
    for (let x = gameWindow.l; x < gameWindow.r; x += squareSize) {
      ctx.strokeRect(x, y, squareSize, squareSize);
    }
  }

  marker.draw();
  aim.draw();

  for (let i = 0; i < objects.balls.length; i++) {
    if (objects.balls[i]) {
      objects.balls[i].draw();
    }
  }

  for (let i = 0; i < objects.squares.length; i++) {
    objects.squares[i].draw();
  }

  requestAnimationFrame(loop);
}

loop();

// setInterval(loop, 500);
