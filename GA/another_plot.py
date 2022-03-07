import matplotlib.pyplot as plt
import json
import torch as t
import ipdb


def main():
    with open("history.json") as f:
        data = t.tensor(json.load(f))

    means = t.mean(data, dim=1)
    maxes = t.max(data, dim=1)[0]
    plt.plot(means)
    plt.plot(maxes)
    plt.show()


if __name__ == "__main__":
    main()
