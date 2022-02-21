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
) =>
  clip(
    value +
      Math.random() *
        mutationImpact *
        (range[1] - range[0]) *
        (Math.random() > 0.5 ? -1 : 1),
    range[0],
    range[1],
  );
const mutate = (
  genome: Genome,
  mutationRate: number,
  mutationImpact: number,
  validGenomeRanges: [number, number][],
): Genome => {
  return genome.map((x, i) =>
    Math.random() <= mutationRate
      ? getMutation(x, validGenomeRanges[i], mutationImpact)
      : x
  ) as Genome;
};
const selectBest = (
  genomes: Genome[],
  fitnesses: number[],
  survivalThreshold = 0.3,
): Genome[] => {
  //const sortedGenomes = argSort(genomes, fitnesses);
  const sortedGenomesWithFitnesses = genomes.map((g, i) =>
    [g, fitnesses[i]] as [Genome, number]
  ).sort((a, b) => a[1] - b[1]);
  const sortedGenomes = sortedGenomesWithFitnesses.map((x) => x[0]);
  const topIndex = Math.round(survivalThreshold * genomes.length);
  const result = sortedGenomes.slice(0, topIndex);
  return result;
};

const mate = (
  g1: Genome,
  g2: Genome,
  mutationRate: number,
  mutationImpact: number,
  validGenomeRanges: [number, number][],
): Genome => {
  return mutate(
    g1.map((_, i) => (Math.random() > 0.5 ? g1[i] : g2[i])) as Genome,
    mutationRate,
    mutationImpact,
    validGenomeRanges,
  );
};
const getChildren = (
  genomes: Genome[],
  mutationRate: number,
  mutationImpact: number,
  validGenomeRanges: [number, number][],
): Genome[] => {
  const children = new Array<Genome>();
  for (let i = genomes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    children.push(
      mate(
        genomes[i],
        genomes[j],
        mutationRate,
        mutationImpact,
        validGenomeRanges,
      ),
    );
  }
  return children;
};
const getFitnesses = (
  threads: Worker[],
  population: Genome[],
): Promise<number[]> =>
  new Promise<number[]>((resolve, _reject) => {
    const fitnesses = new Array<number>();
    let completed = 0;
    let sent = 0;
    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      const genome1 = population[sent];
      if (genome1 === undefined) {
        debugger;
      }
      thread.postMessage([genome1, sent]);
      sent += 1;
      thread.onmessage = (e) => {
        const [fitness, index] = (
          e as unknown as Record<string, [number, number]>
        )["data"];
        fitnesses[index] = fitness;
        completed += 1;
        if (sent < population.length) {
          const genome2 = population[sent];
          if (genome2 === undefined) {
            debugger;
          }
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
