const cnv = document.getElementById("canvas");
const ctx = cnv.getContext("2d");

cnv.width = window.innerWidth - 40;
cnv.height = window.innerHeight - 40;

let mouse = {};
let balls = [];
let ballCount = 1;

let marker = {
  x: cnv.width / 2,
  y: cnv.height * 0.9,
  r: 7,

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  },
};

let aim = {
  x: marker.x,
  y: marker.y,
  r: 7,
  spacing: 15,
  angle: 0,

  draw() {
    if (!mouse.down) return;

    this.aim();

    if (this.spacing < 20) return;

    for (let n = 0; n < 10; n++) {
      ctx.beginPath();

      const hyp = this.y - (this.y - n * this.spacing);
      ctx.arc(this.x - hyp * Math.cos(this.angle), this.y - hyp * Math.sin(this.angle), this.r, 0, 2 * Math.PI);

      ctx.fill();
    }
  },

  aim() {
    const run = mouse.x - mouse.downX;
    const rise = mouse.y - mouse.downY;

    this.angle = Math.atan2(rise, run);

    this.spacing = Math.sqrt(run ** 2 + rise ** 2) * 0.1 + 15;
  },
};

class Ball {
  constructor() {
    balls.push(this);
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
});

function loop() {
  ctx.clearRect(0, 0, cnv.width, cnv.height);

  marker.draw();
  aim.draw();

  requestAnimationFrame(loop);
}

loop();
