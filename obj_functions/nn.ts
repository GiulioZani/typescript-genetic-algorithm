export default async (weights: number[]) => {
  const weightsString = JSON.stringify(weights);
  const p = Deno.run({
    cmd: ["npm", "run", "get-fitness", weightsString],
    stdout: "piped",
  });
  const { code } = await p.status();
  if (code === 0) {
    const rawOutput = new TextDecoder().decode(await p.output());
    const regex = /%(.*?)%/g;
    const result = regex.exec(rawOutput);
    if (result != null) {
      const { fitness } = JSON.parse(result[1]);
      return fitness;
    }
  } else {
    /* error */
  }
  return -1;
};
