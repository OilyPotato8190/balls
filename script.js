const cnv = document.getElementById("canvas");
const ctx = cnv.getContext("2d");

cnv.width = window.innerWidth - 40;
cnv.height = window.innerHeight - 40;

const add = 2 * Math.PI;
const remainder = 2 * Math.PI;
console.log((-Math.PI + add) % remainder);
console.log((0 + add) % remainder);
console.log((Math.PI + add) % remainder);

let mouse = {};
let balls = [];
let ballCount = 1;

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
    for (let n = 0; n < ballCount; n++) {
      const newAngle = (angle + 2 * Math.PI) % (2 * Math.PI);
      console.log(angle, newAngle);
      new Ball();
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
  constructor(angle) {
    this.x = marker.x;
    this.y = marker.y;
    this.speed = 20;
    this.r = 7;
    this.angle = angle;

    balls.push(this);
  }

  draw() {
    this.move();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  }

  move() {
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
  }
}

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

  for (let i = 0; i < balls.length; i++) {
    balls[i].draw();
  }

  requestAnimationFrame(loop);
}

loop();
