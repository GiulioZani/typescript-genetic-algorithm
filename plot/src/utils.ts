class Datum {
  position: [number, number];
  velocity: [number, number];
  constructor() {
    this.position = [1, 1];
    this.velocity = [1, 1];
  }
}
type Data = [[Datum]];
class Plotter {
  update = async () => true;
  constructor() {
    this.update = async () => true;
  }
}

const getMinPositionX = (data: Data) =>
  Math.min(
    ...data.flatMap((x) => x.map((y) => y.position[0])),
  );
const getMinPositionY = (data: Data) =>
  Math.min(
    ...data.flatMap((x) => x.map((y) => y.position[1])),
  );
const getMaxPositionX = (data: Data) =>
  Math.max(
    ...data.flatMap((x) => x.map((y) => y.position[0])),
  );
const getMaxPositionY = (data: Data) =>
  Math.max(
    ...data.flatMap((x) => x.map((y) => y.position[1])),
  );

const rastrigin = (x: [number, number]) =>
  x.reduce(
    (acc, val) => acc + Math.pow(val, 2) - 10 * Math.cos(2 * Math.PI * val),
    0,
  ) + 20;
const rosenbrock = (x: [number, number]) => {
  const a = 1;
  const b = 100;
  return Math.pow(a - x[0], 2) + b * Math.pow(x[1] - Math.pow(x[0], 2), 2);
};

const objectiveFunctions: Record<
  string,
  (c: [a: number, b: number]) => number
> = {
  rosenbrock,
  rastrigin,
};
const dataToTrace = (dati: Datum[], type:string, objectiveFunction:(a:[number,number])=>number, color:string) => {
    const result = {
      x: dati.map(p=>p.position[0]),//dati.map((p) => pixDensity * normalizeY(p.position[1])),
      y: dati.map(p=>p.position[1]),//dati.map((p) => pixDensity * normalizeX(p.position[0])),
      type: type === "contour" ? "scatter2d" : "scatter3d",
      mode: "markers",
      marker: {
        size: type === "contour" ? 10 : 2.5,
        color: color,
        line: {
          width: 0.5,
        },
        opacity: 0.8,
      },
    };
    if (type === "surface") {
      result["z"] = dati.map((p) =>
        objectiveFunction([p.position[1], p.position[0]])
      );
    }
    return result;
  };

const getPlotter = async (
  fileNamesWithColors: [string, string][],
  divName: string,
  objectiveFunctionName: string,
  type = "contour",
  //objectiveFunction:(c:[a:number, b:number])=>number
): Promise<Plotter> => {
  const objectiveFunction = objectiveFunctions[objectiveFunctionName];
  const allData: Data[] = [];
  const fileNames = fileNamesWithColors.map(x=>x[0])
  for (const fileName of fileNames) {
    const content = await (await fetch(fileName)).json() as unknown as Data;
    allData.push(content);
  }
  const margin = 0.00
  const maxPositionX = Math.max(...allData.map(data=>getMaxPositionX(data))) + margin;
  const maxPositionY = Math.max(...allData.map(data=>getMaxPositionY(data))) + margin;
  const minPositionX = Math.min(...allData.map(data=>getMinPositionX(data))) - margin;
  const minPositionY = Math.min(...allData.map(data=>getMinPositionY(data))) - margin;
  const pixDensity = 250;
  const xStep = (maxPositionX - minPositionX) / pixDensity;
  const yStep = (maxPositionY - minPositionY) / pixDensity;
  const xData = []
  const yData = []
  const zData = [];
  for (let i = 0; i < pixDensity; i++) {
    const x = minPositionX + xStep * i;
    xData.push(x)
    const row = [];
    for (let j = 0; j < pixDensity; j++) {
      const y = minPositionY + yStep * j;
      if (yData.length < pixDensity){
        yData.push(y)
      }
      row.push(objectiveFunction([x-0.39, y+0.39]));
    }
    zData.push(row);
  }
  const functionTrace = {
    z: zData,
    y:yData,
    x:xData,
    opacity:0.9,
    type: type === "contour" ? "contour" : "surface",
  };
 const dotTrace = {
      x: [0],
      y: [0],
      type: type === "contour" ? "scatter2d" : "scatter3d",
      mode: "markers",
      marker: {
        size: type === "contour" ? 10 : 2.5,
        color: 'red',
        line: {
          width: 0.5,
        },
        opacity: 0.8,
      },
  }; 
  const traces = [functionTrace, dotTrace]
  for (let i = 0; i<allData.length; i++){
    traces.push(dataToTrace(allData[i][0], type, objectiveFunction, fileNamesWithColors[i][1]));
  }

  const plot = document.getElementById(divName);
  await Plotly.newPlot(plot, traces, {
    width: window.innerWidth / 2.1,
    height: window.innerHeight*0.9,
    showlegend:false,
    scene: {
      camera: {
        eye: objectiveFunctionName === "rastrigin"
          ? { x: 0.8, y: -0.8, z: 1.5 }
          : {},
      },
    },
  });
  const getValues = (i: number, dati: Datum[]) =>
    dati.map(
      (p) => p.position[i]//pixDensity * normalizeY(p.position[i]),
    );

  let i = 0;
  const dataSize = Math.min(...allData.map(x=>x.length))
  const plotter = {
    "update": async () => {
      if (i < dataSize) {
        for (let j=0;j<allData.length; j++){
          const trace = traces[j+2]
          const data = allData[j]
          trace.x = getValues(0, data[i]);
          trace.y = getValues(1, data[i]);
          if (type === "surface") {
            trace["z"] = data[i].map((p) =>
              objectiveFunction([p.position[1], p.position[0]]) + 0.01
            );
          }
        }
        await Plotly.redraw(plot);
        i += 1;
        return false;
      }
      return true;
    },
  };
  return plotter as unknown as Plotter;
};

export { Data, getPlotter };
