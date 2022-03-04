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

const evolve = async (
  mutationRate: number,
  mutationImpact: number,
  survivalThreshold: number,
  generationCount: number,
  populationSize: number,
  threadCount: number,
  objectiveFunctionLocation: string,
  objectiveFunctionName: string,
  savePath: string,
  validGenomeRanges: [number, number][]
) => {
  let population = randomGenomes(populationSize, validGenomeRanges);
  let fitnesses: number[] = [];
  const threads = new Array(threadCount).fill(0).map(
    () =>
      new Worker(new URL("./get_fitness.ts", import.meta.url).href, {
        type: "module",
        deno: { namespace: true, permissions: { net: true } },
      } as unknown as WorkerOptions)
  );
  const objectiveFunctionFileName = path.join(
    objectiveFunctionLocation,
    `${objectiveFunctionName}.ts`
  );
  for (const thread of threads) {
    thread.postMessage(objectiveFunctionFileName);
  }
  const history: [number[], Genome[]][] = [];
  let bestSoFar: Genome | null = null;
  for (let generation = 0; generation < generationCount; generation++) {
    fitnesses = await getFitnesses(threads, population);

    const survivors = selectBest(population, fitnesses, survivalThreshold);
    const parents = survivors.length > 1 ? survivors : population;
    const children = getChildren(
      parents,
      mutationRate,
      mutationImpact,
      validGenomeRanges,
      populationSize - survivors.length
    );
    const novelIndividuals = randomGenomes(
      populationSize - (children.length + survivors.length),
      validGenomeRanges
    );
    const argMin = getArgMin(fitnesses);
    bestSoFar = population[argMin];
    console.log(
      `
      End of generation ${generation + 1}/${generationCount}
      Best fitness:${-fitnesses[argMin]}\n`
    );
    history.push([fitnesses, population]);
    population = [...survivors, ...children, ...novelIndividuals];
    await Deno.writeTextFile(savePath, JSON.stringify(bestSoFar));
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
    validGenomeRanges,
  } = config;
  console.log(config);
  const parsedValidGenomeRanges = Array.isArray(validGenomeRanges)
    ? (validGenomeRanges as [number, number][])
    : Array(validGenomeRanges.length)
        .fill(0)
        .map(
          (x) =>
            [validGenomeRanges.min, validGenomeRanges.max] as [number, number]
        );
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
        savePath,
        parsedValidGenomeRanges
      )
    );
  }
  await Deno.writeTextFile(
    `histories/${objectiveFunctionName}.json`,
    JSON.stringify(histories, null, 2)
  );
  Deno.exit();
};

await main();
