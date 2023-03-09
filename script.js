const cnv = document.getElementById("canvas");
const ctx = cnv.getContext("2d");

cnv.width = window.innerWidth - 40;
cnv.height = window.innerHeight - 40;

let mouse = {};
let objects = {
  balls: [null],
  squares: [],
};

let marker = {
  x: cnv.width / 2,
  y: cnv.height * 0.9,
  r: 7,
  shooting: false,
  draw: true,
  angle: 0,
  frameShot: 0,
  ballIndex: 0,
  shootDelay: 5,

  draw() {
    if (this.shooting) this.shoot();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  },

  shoot() {
    if ((frameCount - this.frameShot) % this.shootDelay && frameCount - this.frameShot) return;

    const flipped = ((this.angle + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    new Ball(flipped, this.ballIndex);

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
    this.angle = angle;
    this.index = index;

    this.x = marker.x;
    this.y = marker.y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 1;
    this.r = 7;

    this.setVelocity();
    objects.balls[this.index] = this;
  }

  draw() {
    this.move();
    this.checkCollision();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1, 0, 2 * Math.PI);
    ctx.fill();
  }

  setVelocity() {
    this.vx = this.speed * Math.cos(this.angle);
    this.vy = this.speed * Math.sin(this.angle);
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;
  }

  checkCollision() {
    if (this.x + this.r > cnv.width || this.x - this.r < 0) {
      this.vx *= -1;
    }

    if (this.y - this.r < 0) {
      this.vy *= -1;
    } else if (this.y - this.r > cnv.height) {
      objects.balls[this.index] = null;
    }

    for (let i = 0; i < objects.squares.length; i++) {
      const square = objects.squares[i];

      const squareEdges = {
        left: square.x,
        right: square.x + square.size,
        top: square.y,
        bottom: square.y + square.size,
      };

      let gap = {
        x: 0,
        y: 0,
      };

      let side;

      if (this.x < squareEdges.left) {
        gap.x = this.x - squareEdges.left;
        side = "left";
      } else if (this.x > squareEdges.right) {
        gap.x = this.x - squareEdges.right;
        side = "right";
      }

      if (this.y < squareEdges.top) {
        gap.y = this.y - squareEdges.top;

        if (side === "left") side = "topLeft";
        else if (side === "right") side = "topRight";
        else side = "top";
      } else if (this.y > squareEdges.bottom) {
        gap.y = this.y - squareEdges.bottom;

        if (side === "left") side = "bottomLeft";
        else if (side === "right") side = "bottomRight";
        else side = "bottom";
      }

      const dist = Math.sqrt(gap.x ** 2 + gap.y ** 2);

      if (dist < this.r) {
        // square.health--;

        if (side === "topLeft" || side === "topRight" || side === "bottomLeft" || side === "bottomRight") {
          const lastPos = {
            x: this.x - this.vx,
            y: this.y - this.vy,
          };

          const distTo = {
            left: Math.abs((squareEdges.left - this.x) / this.vx),
            right: Math.abs((squareEdges.right - this.x) / this.vx),
            top: Math.abs((squareEdges.top - this.y) / this.vy),
            bottom: Math.abs((squareEdges.bottom - this.y) / this.vy),
          };

          const closest = Math.min(...Object.values(distTo));

          const a1 = this.y - lastPos.y;
          const b1 = this.x - lastPos.x;
          const c1 = this.x * lastPos.y - lastPos.x * this.y;

          let a2, b2, c2;
          let moveSide = {};

          if (closest == distTo.left) {
            a2 = -1;
            b2 = 0;
            c2 = squareEdges.left - this.r;
            moveSide.x = -this.r;
          } else if (closest == distTo.right) {
            a2 = -1;
            b2 = 0;
            c2 = squareEdges.right + this.r;
            moveSide.x = this.r;
          } else if (closest == distTo.top) {
            a2 = 0;
            b2 = 1;
            c2 = squareEdges.top - this.r;
            moveSide.y = -this.r;
          } else if (closest == distTo.bottom) {
            a2 = 0;
            b2 = 1;
            c2 = squareEdges.bottom + this.r;
            moveSide.y = this.r;
          }

          let intersection = {
            x: (b1 * c2 - b2 * c1) / (a1 * b2 - a2 * b1) - (moveSide.x || 0),
            y: -(a2 * c1 - a1 * c2) / (a1 * b2 - a2 * b1) - (moveSide.y || 0),
          };

          const m = -(intersection.x - this.x) / (intersection.y - this.y);
          const b = intersection.y - m * intersection.x;

          ctx.strokeStyle = "blue";
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + this.vx * 100, this.y + this.vy * 100);
          ctx.stroke();

          ctx.strokeStyle = "green";
          ctx.beginPath();
          ctx.moveTo(0, 0 + b);
          ctx.lineTo(cnv.width, cnv.width * m + b);
          ctx.stroke();
          ctx.strokeStyle = "black";

          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.arc(intersection.x, intersection.y, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "black";

          this.x -= this.vx;
          this.y -= this.vy;
        } else {
          if (side === "left" || side === "right") this.vx *= -1;
          else this.vy *= -1;
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

    this.size = 50;
    this.fontSize = this.size * 0.6;

    objects.squares.push(this);
  }

  draw() {
    ctx.strokeRect(this.x, this.y, this.size, this.size);

    ctx.fillStyle = "red";
    ctx.font = `${this.fontSize}px Comic Sans MS`;
    const width = ctx.measureText(this.health).width;
    ctx.fillText(this.health, this.x - width / 2 + this.size / 2, this.y + this.fontSize / 3 + this.size / 2);
    ctx.fillStyle = "black";
  }
}

// for (let n = 0; n < 10; n++) {
//   objects.balls.push(null);
// }

new Square(marker.x - 100, marker.y - 100);

document.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

document.addEventListener("mousedown", () => {
  mouse.downX = mouse.x;
  mouse.downY = mouse.y;
  mouse.down = true;
});

document.addEventListener("mouseup", () => {
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
