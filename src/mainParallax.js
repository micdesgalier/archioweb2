import Circle from "./class/CircleInFlatTorus.js";
import Vector2 from "./class/Vector2.js";
import MainLoop from "mainloop.js";
import { randomInt, clamp } from "./utils/math.js";
import Keyboard from "./class/Keyboard.js";
import TouchAngle from "./class/TouchAngle.js";

// Request fullscreen on mobile devices
const isMobile = window.matchMedia('(pointer: coarse)').matches;
document.addEventListener('click', () => {
  if (!isMobile) return;
  document.documentElement.requestFullscreen();
});

const starColors = [
  'rgb(155, 176, 255)',
  'rgb(255, 255, 255)',
  'rgb(255, 244, 234)',
  'rgb(255, 210, 161)',
  'rgb(255, 204, 111)',
  'rgb(255, 192, 203)',
];

const keyboard = new Keyboard();
const touchAngle = new TouchAngle();
let lastAngle = 0;

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
ctx.canvas.width = ctx.canvas.clientWidth;
ctx.canvas.height = ctx.canvas.clientHeight;

const circles = [];
const nbCircles = Math.max(ctx.canvas.height/80 * ctx.canvas.width/80, 80);
for (let i = 0; i < nbCircles; i++) {
  const radius = randomInt(3, clamp(i/(nbCircles/50), 3, 50));
  const position = new Vector2({
    x: randomInt(0, ctx.canvas.width),
    y: randomInt(0, ctx.canvas.height)
  });
  const velocity = Vector2.fromAngle(lastAngle, radius / 100);
  const color = starColors[randomInt(0, starColors.length - 1)];
  circles.push(new Circle({ position, radius, velocity, color }));
}
circles.sort((a, b) => a.radius - b.radius);

function getKeyboardAngle() {
  if (keyboard.isKeysDown('KeyA', 'KeyW')) return Math.PI * 0.25;
  if (keyboard.isKeysDown('KeyA', 'KeyS')) return Math.PI * 1.75;
  if (keyboard.isKeysDown('KeyD', 'KeyW')) return Math.PI * 0.75;
  if (keyboard.isKeysDown('KeyD', 'KeyS')) return Math.PI * 1.25;
  if (keyboard.isKeyDown('KeyS')) return Math.PI * 1.5;
  if (keyboard.isKeyDown('KeyD')) return Math.PI;
  if (keyboard.isKeyDown('KeyW')) return Math.PI * 0.5;
  if (keyboard.isKeyDown('KeyA')) return 0;
  return false;
}

function tickPhysic(dt) {
  let angle = getKeyboardAngle();
  if (angle === false) angle = touchAngle.getAngle();
  if (angle === false) angle = lastAngle;
  lastAngle = angle;
  for (const circle of circles) {
    circle.velocity.setAngle(angle);
    circle.update(dt, ctx.canvas.width, ctx.canvas.height);
  }
}

function tickRender() {
  ctx.canvas.width = ctx.canvas.clientWidth;
  ctx.canvas.height = ctx.canvas.clientHeight;

  for (const circle of circles) {
    circle.draw(ctx);
  }
}

MainLoop
  .setUpdate(tickPhysic)
  .setDraw(tickRender)
  .start();

document.addEventListener('visibilitychange', () => {
  document.hidden ? MainLoop.stop() : MainLoop.start();
});