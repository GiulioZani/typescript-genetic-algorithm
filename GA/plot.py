import matplotlib.pyplot as plt
import os
import json
import ipdb
import torch as t
import numpy as np
from itertools import product


def rosenbrock(x):
    a = 1
    b = 100
    return (a - x[0]) ** 2 + b * (x[1] - x[0] ** 2) ** 2


def rastrigin(x):
    return (
        (x[0] ** 2 - 10 * np.cos(2 * np.pi * x[0]))
        + (x[1] ** 2 - 10 * np.cos(2 * np.pi * x[1]))
        + 20
    )


def main():
    funcs = {"rastrigin": rastrigin, "rosenbrock": rosenbrock}
    for func_name in funcs.keys():
        func = funcs[func_name]
        combos = tuple(product((-10, 10), (-10, 10)))
        max_val = max([abs(func(c)) for c in combos])
        data = json.load(open(os.path.join("histories", f"{func_name}.json")))
        tensor_data = t.tensor([[u[0] for u in d] for d in data])
        max_val = t.max(tensor_data)
        parsed_data = t.abs(max_val - tensor_data)
        mean_mean = t.mean(t.mean(parsed_data, dim=2), dim=0)
        err_mean = t.var(t.mean(parsed_data, dim=2), dim=0) / t.sqrt(
            t.tensor(len(mean_mean))
        )
        mean_max = t.mean(t.max(parsed_data, dim=2)[0], dim=0)
        err_max = t.var(t.max(parsed_data, dim=2)[0], dim=0) / t.sqrt(
            t.tensor(len(mean_max))
        )
        # ipdb.set_trace()
        xs = t.arange(len(mean_mean))
        # ipdb.set_trace()
        if True:
            _, (ax1, ax2) = plt.subplots(2, sharex=True)
            ax1.errorbar(xs, mean_mean, yerr=err_mean, label="Average")
            ax1.set_title("Average")
            ax2.errorbar(xs, mean_max, yerr=err_max, label="Max")
            ax2.set_title("Max")
        else:
            plt.errorbar(xs, mean_mean, yerr=err_mean, label="Average")
            plt.errorbar(xs, mean_max, yerr=err_max, label="Max")
        plt.suptitle(f"GA performance {func_name}")
        # plt.errorbar(xs, mean_max)
        # plt.errorbar(xs, mean_max, yerr=err_max, label="Max")
        # ipdb.set_trace()
        plt.xlabel("Generation")
        plt.ylabel("Fitness")
        plt.savefig(f"{func_name}.png", dpi=200)
    # ipdb.set_trace()


if __name__ == "__main__":
    main()
