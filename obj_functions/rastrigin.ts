const rastrigin = (x: [number, number]) =>
  x.reduce(
    (acc, val) => acc + Math.pow(val, 2) - 10 * Math.cos(2 * Math.PI * val),
    0,
  ) + 20;

export default rastrigin;
