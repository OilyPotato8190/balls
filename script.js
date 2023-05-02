const cnv = document.getElementById('canvas');
const ctx = cnv.getContext('2d');

cnv.width = window.innerWidth - 40;
cnv.height = window.innerHeight - 40;

let mouse = {};
let objects = {
  balls: [],
  squares: [],
};

for (let n = 0; n < 1; n++) {
  objects.balls.push(null);
}

let marker = {
  x: cnv.width / 2,
  y: cnv.height * 0.9,
  r: 50,
  shooting: false,
  draw: true,
  angle: 0,
  frameShot: 0,
  ballIndex: 0,
  shootDelay: 3,

  draw() {
    if (this.shooting) this.shoot();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  },

  shoot() {
    if ((frameCount - this.frameShot) % this.shootDelay && frameCount - this.frameShot) return;
    new Ball(this.angle + Math.PI + this.ballIndex, this.ballIndex);

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
    if (!mouse.down || marker.shooting) return;

    this.updateAngle();

    if (this.spacing < 20) return;

    for (let n = 0; n < 10; n++) {
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

    const x = this.x - hyp * Math.cos(this.angle);
    const y = this.y - hyp * Math.sin(this.angle);

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
    this.speed = 20;
    this.r = marker.r;

    this.setVelocity(angle);
    objects.balls[this.index] = this;
  }

  draw() {
    this.move();
    this.checkCollision();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'black';
  }

  setVelocity(angle) {
    this.vx = this.speed * Math.cos(angle);
    this.vy = this.speed * Math.sin(angle);
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;
  }

  checkCollision() {
    if (this.x + this.r > cnv.width) {
      this.vx *= -1;
      this.x = cnv.width - this.r;
    } else if (this.x - this.r < 0) {
      this.vx *= -1;
      this.x = 0 + this.r;
    }

    // if (this.y - this.r < 0) {
    //    this.vy *= -1;
    // } else if (this.y - this.r > cnv.height) {
    //    objects.balls[this.index] = null;
    // }

    if (this.y - this.r < 0) {
      this.vy *= -1;
      this.y = 0 + this.r;
    } else if (this.y + this.r > cnv.height) {
      this.vy *= -1;
      this.y = cnv.height - this.r;
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
          //  cornerBounce(corner, this);
        }
        this.vx = 0;
        this.vy = 0;
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
    ctx.strokeRect(this.x, this.y, this.size, this.size);

    ctx.fillStyle = 'red';
    ctx.font = `${this.fontSize}px Comic Sans MS`;
    const width = ctx.measureText(this.health).width;
    ctx.fillText(this.health, this.x - width / 2 + this.size / 2, this.y + this.fontSize / 3 + this.size / 2);
    ctx.fillStyle = 'black';
  }
}

new Square(marker.x - 150, marker.y - 500);

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

  if (!marker.shooting && aim.spacing > 20) {
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
