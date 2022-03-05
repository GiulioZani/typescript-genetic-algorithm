import { getAvgFitness } from "../../dist/get_fitness.js";

export default (nn: number[]) => -getAvgFitness(nn);
