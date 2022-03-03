const drawPlot = async () => {
  const objectiveFuntionName = "rastrigin";
  const rawData = await (await fetch(`${objectiveFuntionName}.json`)).json();
  const rawDataGD = await (
    await fetch(`${objectiveFuntionName}_gd.json`)
  ).json();
  const minPositionX = Math.min(
    ...rawData.flatMap((x) => x.map((y) => y.position[0])),
  );
  const minPositionY = Math.min(
    ...rawData.flatMap((x) => x.map((y) => y.position[1])),
  );
  const maxPositionX = Math.max(
    ...rawData.flatMap((x) => x.map((y) => y.position[0])),
  );
  const maxPositionY = Math.max(
    ...rawData.flatMap((x) => x.map((y) => y.position[1])),
  );
  const rastrigin = (x) =>
    x.reduce(
      (acc, val) => acc + Math.pow(val, 2) - 10 * Math.cos(2 * Math.PI * val),
      0,
    ) + 20;
  const rosenbrock = (x) => {
    const a = 0;
    const b = 1;
    return Math.pow(a - x[0], 2) + b * Math.pow(x[1] - Math.pow(x[0], 2), 2);
  };
  const objectiveFuntions = {
    rastrigin,
    rosenbrock,
  };
  const chosenFuntion = objectiveFuntions[objectiveFuntionName];
  const z_data = [];
  const pixDensity = 150;
  const xStep = (maxPositionX - minPositionX) / pixDensity;
  const yStep = (maxPositionY - minPositionY) / pixDensity;
  for (let i = 0; i < pixDensity; i++) {
    const row = [];
    for (let j = 0; j < pixDensity; j++) {
      const x = minPositionX + xStep * i;
      const y = minPositionY + yStep * j;
      row.push(chosenFuntion([x, y]));
    }
    z_data.push(row);
  }
  const min = Math.min(...z_data.flatMap((r) => r));
  const max = Math.max(...z_data.flatMap((r) => r));
  const normalizeZ = (y) => (y - min) / (max - min);
  const ballShift = (max - min) / 45;
  const normalizeX = (x) => (x - minPositionX) / (maxPositionX - minPositionX);
  const normalizeY = (x) => (x - minPositionY) / (maxPositionY - minPositionY);

  const fixedZData = z_data.map((x) => x.map(normalizeZ));
  const surfaceTrace = {
    z: fixedZData,
    type: "surface",
  };
  const contourTrace = {
    z: fixedZData,
    type: "contour",
  };
  const contourParticleTrace = {
    x: rawData[0].map((p) => pixDensity * normalizeY(p.position[1])),
    y: rawData[0].map((p) => pixDensity * normalizeX(p.position[0])),
    type: "scatter2d",
    mode: "markers",
    marker: {
      size: 10,
      line: {
        color: "rgba(217, 217, 217, 0.14)",
        width: 0.5,
      },
      opacity: 0.8,
    },
  };
  const surfaceParticleTrace = {
    x: rawData[0].map((p) => pixDensity * normalizeY(p.position[1])),
    y: rawData[0].map((p) => pixDensity * normalizeX(p.position[0])),
    z: rawData[0].map((p) => normalizeZ(chosenFuntion(p.position)) + ballShift),
    mode: "markers",
    marker: {
      size: 4,
      line: {
        color: "rgba(217, 217, 217, 0.14)",
        width: 0.5,
      },
      opacity: 0.8,
    },
    type: "scatter3d",
  };
  const surfaceParticleTraceGD = {
    x: [pixDensity * normalizeY(rawDataGD[0][1])],
    y: [pixDensity * normalizeX(rawDataGD[0][0])],
    z: [chosenFuntion(rawDataGD[0])],
    mode: "markers",
    marker: {
      size: 4,
      line: {
        color: "rgba(217, 217, 217, 0.14)",
        width: 0.5,
      },
      opacity: 0.8,
    },
    type: "scatter3d",
  };
  const contourParticleTraceGD = {
    x: [pixDensity * normalizeY(rawDataGD[0][1])],
    y: [pixDensity * normalizeX(rawDataGD[0][0])],
    mode: "markers",
    marker: {
      size: 10,
      line: {
        color: "rgba(217, 217, 217, 0.14)",
        width: 0.5,
      },
      opacity: 0.8,
    },
    type: "scatter2d",
  };
  const data = [surfaceTrace, surfaceParticleTrace];
  const layout = {
    title: objectiveFuntionName,
    autosize: true,
    width: window.innerWidth / 2.1,
    height: window.innerHeight,
    scene: {
      camera: {
        eye: objectiveFuntionName === "rastrigin"
          ? { x: 0.8, y: -0.8, z: 1.5 }
          : {},
      },
    },
    margin: {
      l: 65,
      r: 50,
      b: 65,
      t: 90,
    },
  };
  const iterationCounter = document.getElementById("iteration");
  iterationCounter.innerHTML = 0;
  const surfacePlot = document.getElementById("plot1");
  const contourPlot = document.getElementById("plot2");
  await Plotly.newPlot(
    contourPlot,
    [contourTrace, contourParticleTrace, contourParticleTraceGD],
    {
      title: objectiveFuntionName,
      width: window.innerWidth / 2.1,
      height: window.innerHeight,
    },
  );
  await Plotly.newPlot(surfacePlot, data, layout);
  let i = 1;
  const updatePlot = async () => {
    if (i < rawData.length) {
      iterationCounter.innerHTML = i;
      await Plotly.animate("plot1", {
        data: [
          {
            x: rawData[i].map((p) => pixDensity * normalizeY(p.position[1])),
            y: rawData[i].map((p) => pixDensity * normalizeX(p.position[0])),
            z: rawData[i].map((p) =>
              normalizeZ(chosenFuntion(p.position) + ballShift)
            ),
          },
        ],
        traces: [1],
      });
      /*
      await Plotly.animate("plot2", {
        data: [
          {
            x: [pixDensity * normalizeY(rawDataGD[i][1])],
            y: [pixDensity * normalizeX(rawDataGD[i][0])],
            // z: [normalizeZ(chosenFuntion(rawDataGD[0])) + ballShift],
          },
        ],
        traces: [2],
      });
      */
      contourParticleTraceGD.x = [pixDensity * normalizeY(rawDataGD[i][1])];
      contourParticleTraceGD.y = [pixDensity * normalizeX(rawDataGD[i][0])];
      contourParticleTrace.x = rawData[i].map(
        (p) => pixDensity * normalizeY(p.position[1]),
      );
      contourParticleTrace.y = rawData[i].map(
        (p) => pixDensity * normalizeX(p.position[0]),
      );
      Plotly.redraw("plot2");
      /*
        await Plotly.animate("plot2", {
          data: [
            {
              x: rawData[i].map((p) => pixDensity * normalizeY(p.position[1])),
              y: rawData[i].map((p) => pixDensity * normalizeX(p.position[0])),
            },
          ],
          traces: [1],
        });
      */
      i += 1;
      window.requestAnimationFrame(updatePlot);
    }
  };
  window.requestAnimationFrame(updatePlot);
};
await drawPlot();
