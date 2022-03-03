import { Data, getPlotter } from "./utils";
let globalIsDone = false;
const algorithmsWithColor = [
  ["pso", "pink"],
  ["ga", "#90EE90"],
  ["gd", "purple"],
];
for (const [alg, color] of algorithmsWithColor) {
  document.getElementById(alg)!.style.backgroundColor = color;
}
window.plot = async () => {
  globalIsDone = false;
  const algorithms = algorithmsWithColor.filter(
    (a) => (document.getElementById(a[0])! as HTMLInputElement).checked,
  );
  if (algorithms.length > 0) {
    const indexDiv = document.getElementById("iteration")! as HTMLInputElement;
    indexDiv.value = `${indexDiv.value.split(":")[0]}: ${0}`;
    const objectiveFunctionName = (
      document.getElementById("objectiveFunctionSelect")! as HTMLSelectElement
    ).value;
    // const fileName = 'obj_f:rosenbrock,n_par:40,iter:1000,in_srat:DynamicAdaptiveStrategy,rng:100,grd_coef:0,seed:132176,rnd_grad:false'
    const plotters = [
      await getPlotter(
        algorithms.map((a) => [
          `./data/${objectiveFunctionName}_${a[0]}.json`,
          a[1],
        ]),
        "plot1",
        objectiveFunctionName,
        "surface",
      ),
      await getPlotter(
        algorithms.map((a) => [
          `./data/${objectiveFunctionName}_${a[0]}.json`,
          a[1],
        ]),
        "plot2",
        objectiveFunctionName,
        "contour",
      ),
    ];
    let i = 0;
    const animate = async () => {
      indexDiv.value = `${indexDiv.value.split(":")[0]}: ${i}`;
      let isDone = false;
      for (const plotter of plotters) {
        isDone = await plotter.update();
      }
      if (!isDone && !globalIsDone) {
        window.requestAnimationFrame(animate);
        i += 1;
      }
    };
    window.requestAnimationFrame(animate);
  }
};

window.stopPlot = () => {
  globalIsDone = true;
};

window.plot();
