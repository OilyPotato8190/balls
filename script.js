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

  draw() {
    if (this.shooting) this.shoot();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  },

  shoot() {
    if (!(frameCount - this.frameShot) % 20) return;

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
    this.speed = 10;
    this.r = 7;

    this.setVelocity();
    objects.balls[this.index] = this;
  }

  draw() {
    this.move();
    this.checkCollision();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
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

      if (this.x < squareEdges.left) {
        gap.x = this.x - squareEdges.left;
      } else if (this.x > squareEdges.right) {
        gap.x = this.x - squareEdges.right;
      }

      if (this.y < squareEdges.top) {
        gap.y = this.y - squareEdges.top;
      } else if (this.y > squareEdges.bottom) {
        gap.y = this.y - squareEdges.bottom;
      }

      const dist = Math.sqrt(gap.x ** 2 + gap.y ** 2);

      if (dist < this.r) {
        square.health--;

        const lastPos = {
          x: this.x - this.vx,
          y: this.y - this.vy,
        };

        if (lastPos.x < squareEdges.left - this.r && squareEdges.left - this.r < this.x) {
          this.vx *= -1;
        } else if (this.x < squareEdges.right + this.r && squareEdges.right + this.r < lastPos.x) {
          this.vx *= -1;
        }

        if (lastPos.y < squareEdges.top - this.r && squareEdges.top - this.r < this.y) {
          this.vy *= -1;
        } else if (this.y < squareEdges.bottom + this.r && squareEdges.bottom + this.r < lastPos.y) {
          this.vy *= -1;
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
    ctx.fillRect(this.x, this.y, this.size, this.size);

    ctx.fillStyle = "red";
    ctx.font = `${this.fontSize}px Comic Sans MS`;
    const width = ctx.measureText(this.health).width;
    ctx.fillText(this.health, this.x - width / 2 + this.size / 2, this.y + this.fontSize / 3 + this.size / 2);
    ctx.fillStyle = "black";
  }
}

for (let n = 0; n < 10; n++) {
  objects.balls.push(null);
}

new Square(200, 700);

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
    marker.frameShot = frameCount;
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
      marker.shooting = true;
    } else {
      marker.shooting = false;
    }
  }

  for (let i = 0; i < objects.squares.length; i++) {
    objects.squares[i].draw();
  }

  requestAnimationFrame(loop);
}

loop();

// setInterval(loop, 250);
