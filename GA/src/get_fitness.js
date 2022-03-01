let getFitness = null;
addEventListener("message", async (event) => {
    const parsedEvent = event["data"];
    if (typeof parsedEvent === "string") {
        try {
            getFitness = (await import(parsedEvent)).default;
        }
        catch {
            throw `Module ${parsedEvent} doesn't exist!`;
        }
    }
    else {
        if (getFitness !== null) {
            const [genome, index] = parsedEvent;
            const fitness = getFitness(genome);
            postMessage([fitness, index]);
        }
        else {
            throw "Must initialize objective function first!";
        }
    }
});
export {};
