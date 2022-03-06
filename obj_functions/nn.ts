const getProcess = (weightsString:string) => Deno.run({
    cmd: ["npm", "run", "get-fitness", weightsString],
    stdout: "piped",
    stderr: "piped",
  });


export default async (weights: number[], maxWait = 40000) => {
  const weightsString = JSON.stringify(weights);
  let code: number | null = null;
  let p = getProcess(weightsString)
  let startTime = performance.now()
  const checkElapsedTime = () => {
    if (performance.now() - startTime > maxWait){
      console.log('Restarting subprocess')
      p = getProcess(weightsString)
      startTime = performance.now()
    }
  }
  const interval = setInterval(checkElapsedTime, 100)

  code = (await p.status()).code;
  clearInterval(interval)
  if (code === 0) {
    const rawOutput = new TextDecoder().decode(await p.output());
    //console.log(rawOutput)
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
