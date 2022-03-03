export default async (weights: number[]) => {
  const weightsString = JSON.stringify(weights);
  let code: (number | null) = null;
  const p = Deno.run({
    cmd: ["npm", "run", "get-fitness", weightsString],
    stdout: "piped",
    stderr: "null",
  });
  const t0 = performance.now();
  const maxWait = 3000
  const checkTime = () => {
    if (code === null) {
      if ((performance.now() - t0) < maxWait) {
        setTimeout(checkTime, 10);
      } else {
        console.log("Killed a process");
        p.kill(Deno.Signal.SIGKILL);
        p.close();
      }
    }
  };
  checkTime();
  code = (await p.status()).code;
  if (code === 0) {
    console.log(`Took ${performance.now() - t0}`);
    const rawOutput = new TextDecoder().decode(await p.output());
    // console.log(rawOutput)
    const regex = /%(.*?)%/g;
    const result = regex.exec(rawOutput);
    if (result != null) {
      const { fitness } = JSON.parse(result[1]);
      return -fitness;
    }
  } else {
    /* error */
  }
  return Infinity;
};
