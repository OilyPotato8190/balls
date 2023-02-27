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

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  },

  shoot(angle) {
    marker.shooting = true;
    for (let i = 0; i < objects.balls.length; i++) {
      const flipped = ((angle + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
      new Ball(flipped, i);
    }
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
    this.speed = 3;
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
    if (this.x > cnv.width || this.x < 0) {
      this.vx *= -1;
    }

    if (this.y < 0) {
      this.vy *= -1;
    } else if (this.y > cnv.height) {
      objects.balls[this.index] = null;
    }

    for (let i = 0; i < objects.squares.length; i++) {
      const square = objects.squares[i];
      let distX = 0;
      let distY = 0;

      if (this.x < square.x) {
        distX = this.x - square.x;
      } else if (this.x > square.x + square.size) {
        distX = this.x - square.x + square.size;
      }

      if (this.y < square.y) {
        distY = this.y - square.y;
      } else if (this.y > square.y + square.size) {
        distY = this.y - square.y + square.size;
      }

      function getDist(circle, squre) {
        return circle + this.r - square;
      }

      const dist = Math.sqrt(distX ** 2 + distY ** 2);
      if (dist < this.r) {
        this.vx *= -1;
      }
    }
  }
}

class Square {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.size = 20;

    objects.squares.push(this);
  }

  draw() {
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

new Square(100, 100);

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
    marker.shoot(aim.angle);
  }
});

function loop() {
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
