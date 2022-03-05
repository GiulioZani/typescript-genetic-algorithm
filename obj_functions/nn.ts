export default async (weights: number[], maxWait = 20000) => {
  const weightsString = JSON.stringify(weights);
  let code: number | null = null;
  const p = Deno.run({
    cmd: ["npm", "run", "get-fitness", weightsString],
    stdout: "piped",
    stderr: "piped",
  });

  code = (await p.status()).code;
  if (code === 0) {
    const rawOutput = new TextDecoder().decode(await p.output());
    // console.log(rawOutput)
    const regex = /%(.*?)%/g;
    const result = regex.exec(rawOutput);
    if (result != null) {
      const { fitness } = JSON.parse(result[1]);
      return -fitness;
    }
  }
  const rawError = new TextDecoder().decode(await p.stderrOutput());
  console.log(rawError);
  return Infinity;
};
