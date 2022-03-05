import { exec, OutputMode } from "https://deno.land/x/exec/mod.ts";

const run = async (weights: number[], maxWait = 20000) => {
  const weightsString = JSON.stringify(weights);
  const { status, output } = await exec(
    `npm run get-fitness ${weightsString}`,
    { output: OutputMode.Capture }
  );
  if (status.code === 0) {
    const regex = /%(.*?)%/g;
    const result = regex.exec(output);
    if (result != null) {
      const { fitness } = JSON.parse(result[1]);
      return -fitness;
    }
  } else {
    console.log("Failed...");
  }
  return Infinity;
};
export default run;
