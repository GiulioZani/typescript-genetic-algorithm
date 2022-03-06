/// FIXME: in place operations like toggle_ don't work!!
export class BitView {
  intView: Uint32Array;
  floatView: Float32Array;
  constructor(num: number = 0, type: "float" | "int" = "float") {
    const buffer = new ArrayBuffer(4);
    this.intView = new Uint32Array(buffer);
    this.floatView = new Float32Array(buffer);
    if (type === "float") {
      this.floatView[0] = num;
    } else {
      this.intView[0] = num;
    }
  }
  get float() {
    return this.floatView[0];
  }
  set float(newVal: number) {
    this.floatView[0] = newVal;
  }
  get int() {
    return this.intView[0];
  }
  set int(newVal: number) {
    this.intView[0] = newVal;
  }
  clearFirst(n: number): BitView {
    const val = (this.int >> n) << n;
    return new BitView(val, "int");
  }
  clearLast(n: number): BitView {
    const val = (this.int << n) >> n;
    return new BitView(val, "int");
  }
  or(bitView: BitView): BitView {
    return new BitView(this.int | bitView.int, "int");
  }
  is1(bit: number): boolean {
    return (this.int >> bit) % 2 != 0;
  }
  set1_(bit: number) {
    this.int = this.int | (1 << bit);
  }
  set_(bit: number, val: boolean) {
    if (this.is1(bit) !== val) {
      if (val) {
        this.set1_(bit);
      } else {
        this.set0_(bit);
      }
    }
  }
  set(bit: number, val: boolean): BitView {
    if (this.is1(bit) !== val) {
      if (val) {
        return this.set1(bit);
      } else {
        return this.set0(bit);
      }
    }
    return new BitView(this.float);
  }
  set0_(bit: number) {
    this.int = this.int & ~(1 << bit);
  }
  set1(bit: number) {
    return new BitView(this.int | (1 << bit), "int");
  }
  set0(start: number, end = -1): BitView {
    let result: BitView | null = null;
    if (end === -1) {
      result = new BitView(this.int & ~(1 << start), "int");
    } else {
      result = new BitView(this.float);
      for (let i = start; i < end; i++) {
        result.int = result.int & ~(1 << i);
      }
    }
    return result!;
  }
  crossover(val: BitView, position: number): BitView {
    const newView = new BitView();
    for (let i = 0; i < 32; i++) {
      if (i < position) {
        newView.set_(i, this.is1(i));
      } else {
        newView.set_(i, val.is1(i));
      }
    }
    return newView;
  }
  toggle_(bit: number) {
    if (this.is1(bit)) {
      this.set1_(bit);
    } else {
      this.set0_(bit);
    }
  }
  toggle(bit: number) {
    return this.set(bit, !this.is1(bit));
    //const a  =this.is1(bit)
    //this.set1(bit) : this.set0(bit)
  }
  toString() {
    return this.intView[0].toString(2).padStart(32, "0");
  }
}
