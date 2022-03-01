import { Genome } from "./evolve";

let getFitness: ((a: Genome) => number) | null = null;
addEventListener("message", async (event) => {
  const parsedEvent = (event as unknown as Record<string, unknown>)["data"];
  if (typeof parsedEvent === "string") {
    try {
      getFitness = (await import(parsedEvent)).default;
    } catch {
      throw `Module ${parsedEvent} doesn't exist!`;
    }
  } else {
    if (getFitness !== null) {
      const [genome, index] = parsedEvent as [Genome, number];
      const fitness = getFitness(genome);
      postMessage([fitness, index]);
    } else {
      throw "Must initialize objective function first!";
    }
  }
});
