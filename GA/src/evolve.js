const getArgMax = (values) => {
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
const getArgMin = (values) => {
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
const random = (a, b) => Math.random() * (b - a) + a;
const randomGenomes = (count, validGenomeRanges) => {
    return Array(count)
        .fill(0)
        .map(() => validGenomeRanges.map((x) => random(x[0], x[1])));
};
const clip = (val, min, max) => Math.min(max, Math.max(min, val));
const getMutation = (value, range, mutationImpact) => clip(value +
    Math.random() *
        mutationImpact *
        (range[1] - range[0]) *
        (Math.random() > 0.5 ? -1 : 1), range[0], range[1]);
const mutate = (genome, mutationRate, mutationImpact, validGenomeRanges) => {
    const doMutate = Math.random() <= mutationRate;
    const mutated = genome.map((x, i) => doMutate ? getMutation(x, validGenomeRanges[i], mutationImpact)
        : x);
    return mutated;
};
const selectBest = (genomes, fitnesses, survivalThreshold = 0.3) => {
    //const sortedGenomes = argSort(genomes, fitnesses);
    const sortedGenomesWithFitnesses = genomes.map((g, i) => [g, fitnesses[i]]).sort((a, b) => a[1] - b[1]);
    const sortedGenomes = sortedGenomesWithFitnesses.map((x) => x[0]);
    const topIndex = Math.round(survivalThreshold * genomes.length);
    const result = sortedGenomes.slice(0, topIndex);
    return result;
};
const mate = (g1, g2, mutationRate, mutationImpact, validGenomeRanges) => {
    return mutate(g1.map((_, i) => (g1[i] + g2[i]) / 2), mutationRate, mutationImpact, validGenomeRanges);
};
const getChildren = (genomes, mutationRate, mutationImpact, validGenomeRanges, count = 0) => {
    if (count === 0) {
        count = genomes.length;
    }
    const children = new Array();
    while (children.length < count) {
        for (let i = genomes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            children.push(mate(genomes[i], genomes[j], mutationRate, mutationImpact, validGenomeRanges));
        }
    }
    return children.slice(0, count);
};
const getFitnesses = (threads, population) => new Promise((resolve, _reject) => {
    const fitnesses = new Array();
    let completed = 0;
    let sent = 0;
    for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const genome1 = population[sent];
        thread.postMessage([genome1, sent]);
        sent += 1;
        thread.onmessage = (e) => {
            const [fitness, index] = e["data"];
            fitnesses[index] = fitness;
            completed += 1;
            if (sent < population.length) {
                const genome2 = population[sent];
                thread.postMessage([genome2, sent]);
                sent += 1;
            }
            else if (completed === population.length) {
                resolve(fitnesses);
            }
        };
    }
});
export { getArgMax, getArgMin, getChildren, getFitnesses, randomGenomes, selectBest, };
