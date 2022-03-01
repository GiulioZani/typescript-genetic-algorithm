import * as path from 'path';
import * as fs from 'fs';

import {
  Genome,
  getArgMin,
  getChildren,
  getFitnesses,
  randomGenomes,
  selectBest,
} from "./evolve";

const evolve = async (
  mutationRate: number,
  mutationImpact: number,
  survivalThreshold: number,
  generationCount: number,
  populationSize: number,
  threadCount: number,
  objectiveFunctionLocation: string,
  objectiveFunctionName: string,
  validGenomeRanges: [number, number][],
  savePath: string,
) => {
  let population = randomGenomes(populationSize, validGenomeRanges);
  let fitnesses: number[] = [];
  const threads = new Array(threadCount).fill(0).map(
    () =>
      new Worker(new URL("./get_fitness.ts", import.meta.url).href, {
        type: "module",
      }),
  );
  const objectiveFunctionFileName = path.join(
    objectiveFunctionLocation,
    `${objectiveFunctionName}.ts`,
  );
  for (const thread of threads) {
    thread.postMessage(objectiveFunctionFileName);
  }
  const history: [number[], Genome[]][] = [];
  for (let generation = 0; generation < generationCount; generation++) {
    fitnesses = await getFitnesses(threads, population);

    const survivors = selectBest(population, fitnesses, survivalThreshold);
    const children = getChildren(
      survivors,
      mutationRate,
      mutationImpact,
      validGenomeRanges,
      populationSize - survivors.length
    );
    const novelIndividuals = randomGenomes(
      populationSize - (children.length + survivors.length),
      validGenomeRanges,
    );
    const argMin = getArgMin(fitnesses);
    // console.log(fitnesses.map((x) => x).sort((x, y) => y - x));
    //console.log(fitnesses.slice().sort())
    console.log(
      `End of generation ${generation + 1}\nBest fitness:${
        fitnesses[argMin]
      }\nBest genome:\n${population[argMin]}\n`,
    );
    history.push([fitnesses, population]);
    population = [...survivors, ...children, ...novelIndividuals];
  }
  /*
  await Deno.writeTextFile(
    `histories/${objectiveFunctionName}_${
      String(performance.now()).replace(".", "")
    }.json`,
    JSON.stringify(history, null, 2),
  );
  */
  /*
  await Deno.writeTextFile(
    path.join(savePath, `${objectiveFunctionName}_ga.json`),
    JSON.stringify(
      history.map((xs) =>
        xs[1].map((x) => {
          return { position: x };
        })
      ),
      null,
      2,
    ),
  );
  */
  return history;
};
const main = async () => {
  const config = JSON.parse(fs.readFileSync("./config.json") as unknown as string)
  const {
    mutationRate,
    mutationImpact,
    survivalThreshold,
    generationCount,
    populationSize,
    threadCount,
    objectiveFunctionLocation,
    objectiveFunctionName,
    savePath,
    repeat,
  } = config;
  const validGenomeRanges = config.validGenomeRanges as [number, number][];
  const histories = [];
  for (let i = 0; i < repeat; i++) {
    histories.push(
      await evolve(
        mutationRate,
        mutationImpact,
        survivalThreshold,
        generationCount,
        populationSize,
        threadCount,
        objectiveFunctionLocation,
        objectiveFunctionName,
        validGenomeRanges,
        savePath,
      ),
    );
  }
  //await Deno.writeTextFile(
  //  `histories/${objectiveFunctionName}.json`,
  //  JSON.stringify(histories, null, 2),
  //);
  //Deno.exit();
};

await main();
