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

// initializes  the workers
const getWorkers = (threadCount: number, objectiveFunctionFileName: string) =>{
  const threads = new Array(threadCount).fill(0).map(
    () =>
      new Worker(new URL("./get_fitness.ts", import.meta.url).href, {
        type: "module",
        deno: {
          namespace: true,
          permissions: { net: true, read: true, write: true },
        },
      } as unknown as WorkerOptions)
  );
  for (const thread of threads) {
    thread.postMessage(objectiveFunctionFileName);
  }
  return threads
}

// initializes and evolves the genomes
const evolve = async ({
  mutationRate,
  mutationImpact,
  survivalThreshold,
  generationCount,
  populationSize,
  threadCount,
  objectiveFunctionLocation,
  objectiveFunctionName,
  savePath,
  validGenomeRanges,
  binary,
}: {
  mutationRate: number;
  mutationImpact: number;
  survivalThreshold: number;
  generationCount: number;
  populationSize: number;
  threadCount: number;
  objectiveFunctionLocation: string;
  objectiveFunctionName: string;
  savePath: string;
  validGenomeRanges: [number, number][];
  binary: boolean;
}) => {
  let population = randomGenomes(populationSize, validGenomeRanges);
  let fitnesses: number[] = [];
  const objectiveFunctionFileName = path.join(
    objectiveFunctionLocation,
    `${objectiveFunctionName}.ts`
  );
  let threads = getWorkers(threadCount, objectiveFunctionFileName);
  const history: number[][] = [];
  let bestSoFar: Genome | null = null;
  for (let generation = 1; generation < generationCount + 1; generation++) {
    if (generation % 5 === 0 && generation > 1 ) {
      console.log("Restarting all threads");
      for (const thread of threads){
        thread.terminate()
      }
      threads = getWorkers(threadCount, objectiveFunctionFileName);
    }
    fitnesses = await getFitnesses(threads, population);

    const survivors = selectBest(population, fitnesses, survivalThreshold);
    const parents = survivors.length > 1 ? survivors : population;
    const children = getChildren(
      parents,
      mutationRate,
      mutationImpact,
      validGenomeRanges,
      binary,
      /*populationSize - */survivors.length
    );
    const novelIndividuals = randomGenomes(
      populationSize - (children.length + survivors.length),
      validGenomeRanges
    );
    const argMin = getArgMin(fitnesses);
    bestSoFar = population[argMin];
    const bestFitness = -fitnesses[argMin]
    console.log(
      `
      End of generation ${generation}/${generationCount}
      Best fitness:${bestFitness}\n`
    );
    history.push(fitnesses);
    population = [...survivors, ...children, ...novelIndividuals];
    const currentSavePath = savePath.at(-1)! !== '/' ? savePath : path.join(savePath, `${generation}_${Math.round(bestFitness)}.json`)
    console.log(`Saving to ${currentSavePath}`)
    await Deno.writeTextFile(currentSavePath, JSON.stringify(bestSoFar));
    await Deno.writeTextFile('history.json', JSON.stringify(history));
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
    binary,
  } = config;
  const longValidGenomeRanges = validGenomeRanges as unknown as {length:number, max:number, min:number}
  const parsedValidGenomeRanges = Array.isArray(validGenomeRanges)
    ? (validGenomeRanges as [number, number][])
    : Array(longValidGenomeRanges.length)
        .fill(0)
        .map(
          (_) =>
            [longValidGenomeRanges.min, longValidGenomeRanges.max] as [number, number]
        );
  const histories = [];
  for (let i = 0; i < repeat; i++) {
    histories.push(
      await evolve({
        mutationRate,
        mutationImpact,
        survivalThreshold,
        generationCount,
        populationSize,
        threadCount,
        objectiveFunctionLocation,
        objectiveFunctionName,
        savePath,
        validGenomeRanges: parsedValidGenomeRanges,
        binary,
      })
    );
  }
  await Deno.writeTextFile(
    `histories/${objectiveFunctionName}.json`,
    JSON.stringify(histories, null, 2)
  );
  Deno.exit();
};

await main();
