import { Genome } from "./evolve.ts";

let getFitness:
  | ((a: Genome) => number)
  | ((a: Genome) => Promise<number>)
  | null = null;
addEventListener("message", async (event) => { // acts as an abstraction layer between the (arbitrary) evaluation function and details about thread exectution in javascript
  const parsedEvent = (event as unknown as Record<string, unknown>)["data"];
  if (typeof parsedEvent === "string") {
    try {
      getFitness = (await import(parsedEvent)).default;
    } catch (e) {
      throw `Error loading module: ${e}`;
    }
  } else {
    if (getFitness !== null) {
      const [genome, index] = parsedEvent as [Genome, number];
      const fitness = await getFitness(genome);
      postMessage([fitness, index]);
    } else {
      throw "Must initialize objective function first!";
    }
  }
});
