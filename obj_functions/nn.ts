export default async (weights:number[]) => {
  const weightsString = JSON.stringify(weights)
  const p = Deno.run({cmd:['npm', 'run', 'get-fitness', weightsString]})
  await p.status()
}
