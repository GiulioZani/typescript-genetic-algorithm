import * as path from "https://deno.land/std/path/mod.ts";
import {
  Genome,
  getArgMin,
  getChildren,
  getFitnesses,
  randomGenomes,
  selectBest,
} from "./evolve.ts";
import config from "./config.json" assert { type: "json" };

const main = async () => {
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
  } = config;
  const validGenomeRanges = config.validGenomeRanges as [number, number][];
  let population = randomGenomes(populationSize, validGenomeRanges);
  let fitnesses: number[] = [];
  const threads = new Array(threadCount).fill(0).map(
    () =>
      new Worker(new URL("./get_fitness.ts", import.meta.url).href, {
        type: "module",
      }),
  );
  for (const thread of threads) {
    thread.postMessage(
      path.join(objectiveFunctionLocation, `${objectiveFunctionName}.ts`),
    );
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
    await Deno.writeTextFile(`history.json`, JSON.stringify(history, null, 2));
    population = [...survivors, ...children, ...novelIndividuals];
  }
  await Deno.writeTextFile(
    path.join(savePath,`${objectiveFunctionName}_ga.json`),
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
  Deno.exit();
};

await main();
