import common from './shaders/common.glsl?raw';
import world from './shaders/world.frag?raw';
import titan from './shaders/titan.frag?raw';
import maw from './shaders/maw.frag?raw';
import gate from './shaders/gate.frag?raw';
import corruptionSrc from './shaders/corruption.frag?raw';

const inject = (src) => src.replace('// __COMMON__', common);

export function createScenes(renderer) {
  const { gl, compile, createTarget, draw, uni } = renderer;
  const progs = {
    world: compile(inject(world)),
    titan: compile(inject(titan)),
    maw: compile(inject(maw)),
    gate: compile(inject(gate)),
  };
  const corruption = compile(inject(corruptionSrc));
  let texA = createTarget(gl.canvas.width, gl.canvas.height);
  let texB = createTarget(gl.canvas.width, gl.canvas.height);

  function ensureSize() {
    if (texA.w !== gl.canvas.width || texA.h !== gl.canvas.height) {
      texA = createTarget(gl.canvas.width, gl.canvas.height);
      texB = createTarget(gl.canvas.width, gl.canvas.height);
    }
  }

  function renderInto(target, name, time, progress) {
    draw(progs[name], (g, p) => {
      g.uniform1f(uni(p, 'uTime'), time);
      g.uniform1f(uni(p, 'uProgress'), progress);
      g.uniform1f(uni(p, 'uAspect'), g.canvas.width / g.canvas.height);
    }, target);
  }

  // s = { from, to, blend, corruption, fromP, toP } from sampleScore
  function frame(s, time) {
    ensureSize();
    renderInto(texA, s.from, time, s.fromP);
    renderInto(texB, s.to, time, s.toP);
    draw(corruption, (g, p) => {
      g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, texA.tex); g.uniform1i(uni(p, 'uA'), 0);
      g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, texB.tex); g.uniform1i(uni(p, 'uB'), 1);
      g.uniform1f(uni(p, 'uBlend'), s.blend);
      g.uniform1f(uni(p, 'uCorrupt'), s.corruption);
      g.uniform1f(uni(p, 'uTime'), time);
      g.uniform1f(uni(p, 'uWire'), s.wire || 0);
    }, null);
  }

  return { frame };
}
