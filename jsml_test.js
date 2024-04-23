import { Signals } from "./jsml/jsml";

const signals = new Signals();

const value = signals.value(0);
const isEven = signals.computed(() => value.get() % 2 == 0);
const parity = signals.computed(() => isEven.get() ? "even" : "odd");