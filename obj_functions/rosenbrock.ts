const rosenbrock = (x: [number, number]) => {
  const a = 1;
  const b = 100;
  return Math.pow(a - x[0], 2) + b * Math.pow(x[1] - Math.pow(x[0], 2), 2);
};

export default rosenbrock;
