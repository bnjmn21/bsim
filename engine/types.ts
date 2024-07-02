export type Constructor<T extends Instance<any>> = new (...args: any[]) => T;
export type Instance<T extends Constructor<any>> = T extends new (...args: any[]) => infer U ? U & {__proto__: T} : never;