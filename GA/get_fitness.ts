import { Genome } from "./evolve.ts";

let getFitness:
  | ((a: Genome, b:number) => number)
  | ((a: Genome, b:number) => Promise<number>)
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
      const [genome, index, generation] = parsedEvent as [Genome, number, number];
      const fitness = await getFitness(genome, generation);
      postMessage([fitness, index]);
    } else {
      throw "Must initialize objective function first!";
    }
  }
});
