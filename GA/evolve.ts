import ProgressBar from "https://deno.land/x/progress@v1.1.4/mod.ts";
import {BitView} from './bit_view.ts'

type Genome = number[];
const getArgMax = (values: number[]) => {
  let max = values[0];
  let maxI = 0;
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val > max) {
      max = val;
      maxI = i;
    }
  }
  return maxI;
};
const getArgMin = (values: number[]) => {
  let max = values[0];
  let maxI = 0;
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val < max) {
      max = val;
      maxI = i;
    }
  }
  return maxI;
};

const random = (a: number, b: number): number => Math.random() * (b - a) + a;

const randomGenomes = (
  count: number,
  validGenomeRanges: [number, number][],
): Genome[] => {
  return Array(count)
    .fill(0)
    .map(() => validGenomeRanges.map((x) => random(x[0], x[1])) as Genome);
};

const clip = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

const getMutation = (
  value: number,
  range: [number, number],
  mutationImpact: number,
  binary = false,
): number => {
  let result: (null | number) = null;
  if (!binary) {
    result = clip(
      value +
        Math.random() *
          mutationImpact *
          (range[1] - range[0]) *
          (Math.random() > 0.5 ? -1 : 1),
      range[0],
      range[1],
    );
  } else {
    const p = 1 / 64;
    let bitValue = new BitView(value, 'float')
    for (let i = 0; i < 64; i++) {
      if (Math.random() < p) {
        bitValue = bitValue.toggle(i)
      }
    }
    result = value;
  }
  return result!;
};
const mutate = (
  genome: Genome,
  mutationRate: number,
  mutationImpact: number,
  validGenomeRanges: [number, number][],
  binary = false,
): Genome => {
  const doMutate = binary ? true : Math.random() <= mutationRate;
  const mutated = genome.map((x, i) =>
    doMutate ? getMutation(x, validGenomeRanges[i], mutationImpact, binary) : x
  ) as Genome;
  return mutated;
};
const selectBest = (
  genomes: Genome[],
  fitnesses: number[],
  survivalThreshold = 0.3,
): Genome[] => {
  //const sortedGenomes = argSort(genomes, fitnesses);
  const sortedGenomesWithFitnesses = genomes
    .map((g, i) => [g, fitnesses[i]] as [Genome, number])
    .sort((a, b) => a[1] - b[1]);
  const sortedGenomes = sortedGenomesWithFitnesses.map((x) => x[0]);
  const topIndex = Math.round(survivalThreshold * genomes.length);
  const result = sortedGenomes.slice(0, topIndex);
  return result;
};

const binaryCrossover = (val1: number, val2: number):number => {
  const bitVal1 = new BitView(val1)
  const bitVal2 = new BitView(val2)
  const crossoverPosition = Math.round(Math.random() * 32);
  const result = bitVal1.crossover(bitVal2, crossoverPosition)
  return result.float
};

const mate = (
  g1: Genome,
  g2: Genome,
  mutationRate: number,
  mutationImpact: number,
  validGenomeRanges: [number, number][],
  binary = false,
): Genome => {
  return mutate(
    g1.map((_, i) =>
      !binary ? (g1[i] + g2[i]) / 2 : binaryCrossover(g1[i], g2[i])
    ) as Genome,
    mutationRate,
    mutationImpact,
    validGenomeRanges,
    binary,
  );
};
const getChildren = (
  genomes: Genome[],
  mutationRate: number,
  mutationImpact: number,
  validGenomeRanges: [number, number][],
  binary = false,
  count = -1,
): Genome[] => {
  if (count === -1) {
    count = genomes.length;
  }
  const children = new Array<Genome>();
  while (children.length < count) {
    for (let i = genomes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      children.push(
        mate(
          genomes[i],
          genomes[j],
          mutationRate,
          mutationImpact,
          validGenomeRanges,
          binary,
        ),
      );
    }
  }
  return children.slice(0, count);
};
const getFitnesses = (
  threads: Worker[],
  population: Genome[],
): Promise<number[]> =>
  new Promise<number[]>((resolve, _reject) => {
    const progressCompleted = new ProgressBar({
      total: population.length,
      display: "COMPLETED :completed/:total :time [:bar] :percent",
    });

    const fitnesses = new Array<number>();
    let completed = 0;
    let sent = 0;
    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      const genome1 = population[sent];
      thread.postMessage([genome1, sent]);
      sent += 1;
      thread.onmessage = (e) => {
        const [fitness, index] = (
          e as unknown as Record<string, [number, number]>
        )["data"];
        fitnesses[index] = fitness;
        completed += 1;
        progressCompleted.render(completed);
        if (sent < population.length) {
          const genome2 = population[sent];
          thread.postMessage([genome2, sent]);
          sent += 1;
        } else if (completed === population.length) {
          resolve(fitnesses);
        }
      };
    }
  });

export type { Genome };
export {
  getArgMax,
  getArgMin,
  getChildren,
  getFitnesses,
  randomGenomes,
  selectBest,
};
