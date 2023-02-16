const cnv = document.getElementById("canvas");
const ctx = cnv.getContext("2d");

cnv.width = window.innerWidth - 40;
cnv.height = window.innerHeight - 40;

let mouse = {};
let aim = {
  x: cnv.width / 2,
  y: cnv.height * 0.9,
  r: 7,
  spacing: 60,
  angle: 0,

  draw() {
    ctx.beginPath();
    for (let n = 0; n < 10; n++) {
      ctx.arc(this.x, this.y - n * this.spacing, this.r, 0, 2 * Math.PI);
    }
    ctx.fill();
  },
};

document.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

document.addEventListener("mousedown", () => {
  mouse.down = true;
});

document.addEventListener("mouseup", () => {
  mouse.down = false;
});

function loop() {
  ctx.clearRect(0, 0, cnv.width, cnv.height);

  aim.draw();

  requestAnimationFrame(loop);
}

loop();
