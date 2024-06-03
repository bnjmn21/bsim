export type Constructor<T> = new (...args: any[]) => T;
export type Instance<T extends Constructor<any>> = T extends Constructor<infer I> ? I : never;

export type Entity<T> = T[];
export type EntityWrapper<T extends Constructor<any>> = (<E extends Instance<T>>(component: Constructor<E>) => E) & {
    has: (component: T) => boolean;
    componentTypes: () => T[];
    componentValues: () => T[];
    components: () => [T, Instance<T>][];
    delete: () => void;
    deleteComponent: <E extends Instance<T>>(component: Constructor<E>) => void;
};
function createEntityWrapper<T extends Constructor<any>>(world: World, entity: Entity<Instance<T>>, entityArray: Entity<any>[]): EntityWrapper<T> {
    let conformingEntity = entity as Entity<Instance<T>>;
    const entityReference = <E extends Instance<T>>(component: Constructor<E>) => {
        return conformingEntity.find(v => v.constructor === component) as Instance<T>;
    }
    entityReference.has = (component: T) => {
        return conformingEntity.find(v => v.constructor === component) !== undefined;
    }
    entityReference.componentTypes = () => {
        return conformingEntity.map(v => v.constructor as T);
    }
    entityReference.componentValues = () => {
        return conformingEntity;
    }
    entityReference.components = () => {
        return conformingEntity.map<[T, Instance<T>]>(v => [v.constructor, v]);
    }
    entityReference.delete = () => {
        delete entityArray[entityArray.findIndex(v => v === conformingEntity)];
    }
    entityReference.deleteComponent = <E extends Instance<T>>(component: Constructor<E>): EntityWrapper<Exclude<T, Constructor<E>>> => {
        const newEntity = conformingEntity.filter(v => v.constructor !== component) as (Exclude<Instance<T>, E>[]);
        world.spawn(newEntity);
        delete entityArray[entityArray.findIndex(v => v === conformingEntity)];
        const components = newEntity.map(v => v.constructor as Constructor<Exclude<Instance<T>, E>>);
        return createEntityWrapper<Exclude<T, Constructor<E>>>(world, newEntity, componentMapGetExact(world.entityRegistries, components));
    }
    entityReference.addComponent = <E extends Instance<any>>(component: E): EntityWrapper<T | Constructor<E>> => {
        const newEntity = [component, ...conformingEntity];
        world.spawn(newEntity);
        delete entityArray[entityArray.findIndex(v => v === conformingEntity)];
        const components = newEntity.map(v => (v as {constructor: Constructor<T | Constructor<E>>}).constructor);
        return createEntityWrapper<T | Constructor<E>>(world, newEntity, componentMapGetExact(world.entityRegistries, components));
    }
    return entityReference;
}

export type Schedule = Reference<null, "schedule", {}>;

export type System<T extends Constructor<any>> = (e: EntityWrapper<T>[]) => void;

export type InternalPlugin = {result: any, fn: Plugin<any, any>, args: any[]};
export type Plugin<T, A extends any[]> = (world: World, ...args: A) => T;

export type DeepArray<T> = (T | DeepArray<T>)[];

function componentMapHasExact(map: Map<Constructor<any>[], any>, has: Constructor<any>[]) {
    for (const [k, v] of map.entries()) {
        if (k.every((v, i) => v === has[i]) && k.length === has.length) {
            return true;
        }
    }
    return false;
}

function componentMapGetExact(map: Map<Constructor<any>[], any>, key: Constructor<any>[]) {
    for (const [k, v] of map.entries()) {
        if (k.every((v, i) => v === key[i]) && k.length === key.length) {
            return v;
        }
    }
    return undefined;
}

export class World {
    entityRegistries: Map<Constructor<any>[], Entity<any>[]> = new Map();
    scheduleRegistry: Registry<null, "schedule", {}> = new Registry("schedule");
    systems: [Constructor<any>[], System<any>][][] = [];
    plugins: InternalPlugin[] = [];
    Setup;

    constructor () {
        this.Setup = this.schedule();
    }

    getEntities<T extends Constructor<any>>(...components: DeepArray<T>): EntityWrapper<T>[] {
        const flatComponents = components.flat() as Constructor<any>[];
        const totalEntities: EntityWrapper<T>[] = [];
        for (let [registryComponents, entities] of this.entityRegistries) {
            if (containsAll(registryComponents, flatComponents)) {
                for (let entity of entities) {
                    if (entity) {
                        totalEntities.push(createEntityWrapper(this, entity, entities));
                    }
                }
            }
        }
        return totalEntities;
    }

    spawn<T extends Instance<Constructor<any>>>(...components: DeepArray<T>): EntityWrapper<Constructor<T>> {
        const flatComponents = components.flat() as Instance<Constructor<any>>[];
        const componentTypes = flatComponents.map(v => v.constructor as Constructor<any>);
        componentTypes.reduce((p, v) => {
            if (p.includes(v)) {
                throw new Error("A Entity can only have one of each component");
            }
            p.push(v);
            return p;
        }, [] as Constructor<any>[]);
        if (!componentMapHasExact(this.entityRegistries, componentTypes)) {
            this.entityRegistries.set(componentTypes, [flatComponents]);
        } else {
            (componentMapGetExact(this.entityRegistries, componentTypes) as Entity<any>[]).push(flatComponents);
        }
        return createEntityWrapper(this, flatComponents, componentMapGetExact(this.entityRegistries, componentTypes) as Entity<any>[]);
    }

    schedule(): Reference<null, "schedule", {}> {
        const reference = this.scheduleRegistry.push(null, () => ({}));
        this.systems[reference.data.index] = [];
        return reference;
    }

    system<T extends Constructor<any>>(schedule: Schedule, deepComponents: DeepArray<T> | T, system: System<T>) {
        let components: T[];
        if (deepComponents instanceof Array) {
            components = deepComponents.flat() as T[];
        } else {
            components = [deepComponents];
        }
        this.systems[schedule.data.index].push([components, system]);
    }

    runSchedule(schedule: Schedule) {
        this.scheduleRegistry.checkRefAndThrow(schedule);
        const scheduleSystems = this.systems[schedule.data.index];
        for (let [components, system] of scheduleSystems) {
            let entities;
            if (components.length !== 0) {
                entities = this.getEntities(components);
            } else {
                entities = this.getEntities();
            }
            system(entities);
        }
    }

    plugin<T extends any, A extends any[]>(plugin: Plugin<T, A>, ...args: A): T {
        if (typeof plugin !== "function") {
            throw new Error("A plugin must be a function that takes a world as an argument.");
        }
        const foundPlugin = this.plugins.find(v => v.fn === plugin && v.args.every((v, i) => v === args[i]));
        if (foundPlugin === undefined) {
            const result = plugin(this, ...args);
            this.plugins.push({
                result: result,
                fn: plugin,
                args: args
            });
            return result;
        } else {
            return foundPlugin.result;
        }
        
    }

    run() {
        this.runSchedule(this.Setup);
    }
}

type ReferenceData<N extends string> = {type: N, index: number};
type Reference<V, N extends string, R extends object | Function> = {data: ReferenceData<N>} & R;

class Registry<T, N extends string, R extends object | Function> {
    values: T[] = [];
    references: Reference<T, N, R>[] = [];
    name: N;
    friendlyName: string;

    constructor (name: N, friendlyName: string | void) {
        this.name = name;
        this.friendlyName = friendlyName || name;
    }

    push<V extends T>(value: V, refSource: (ref: ReferenceData<N>) => R): Reference<V, N, R> {
        const index = this.values.push(value) - 1;
        const referenceData = {
            type: this.name,
            index: index,
        };
        const reference = refSource(referenceData) as Reference<V, N, R>;
        reference.data = referenceData;
        Object.freeze(reference.data);
        this.references.push(reference);
        return reference;
    }

    checkRefAndThrow(reference: Reference<T, N, R>) {
        const hasData = reference.data !== undefined;
        if (!hasData) {
            throw new Error(`Invalid ${this.friendlyName}`);
        }
        const isCorrectType = reference.data.type === this.name;
        const hasIndex = reference.data.index !== undefined;
        if (!(isCorrectType || hasIndex)) {
            throw new Error(`Invalid ${this.friendlyName}`);
        }
        const isOriginalReference = reference === this.references[reference.data.index];
        if (!isOriginalReference) {
            throw new Error(`A ${this.friendlyName} cannot be manually constructed.`);
        }
    }

    checkRef(reference: Reference<T, N, R>): boolean {
        const hasData = reference.data !== undefined;
        if (!hasData) {
            return false;
        }
        const isCorrectType = reference.data.type === this.name;
        const hasIndex = reference.data.index !== undefined;
        if (!(isCorrectType || hasIndex)) {
            return false;
        }
        const isOriginalReference = reference === this.references[reference.data.index];
        if (!isOriginalReference) {
            return false;
        }
        return true;
    }

    get<V extends T>(reference: Reference<V, N, R>): V {
        this.checkRefAndThrow(reference);
        return this.values[reference.data.index] as V;
    }
}

export class Time {
    isPerformanceSupported: boolean;
    relativeTimestamp: number;
    lastLastFrame: number;
    lastFrame: number;
    currentFrame: number;
    frameCount: number;

    constructor () {
        this.isPerformanceSupported = !!(window.performance && window.performance.now);
        if (!this.isPerformanceSupported) {
            console.warn("Performance API not supported. Using the Date API instead which is less accurate and can tick backwards, e.g. when the user swiches timezones.");
        }
        this.relativeTimestamp = this.now();
        this.lastLastFrame = this.relativeTimestamp;
        this.lastFrame = this.relativeTimestamp;
        this.currentFrame = this.relativeTimestamp;
        this.frameCount = 0;
    }

    now(): number {
        return this.isPerformanceSupported ? window.performance.now() : Date.now();
    }

    ms(): number {
        return this.now() - this.relativeTimestamp;
    }

    s(): number {
        return this.ms() / 1000;
    }

    frame() {
        this.lastLastFrame = this.lastFrame;
        this.lastFrame = this.currentFrame;
        this.currentFrame = this.ms();
        this.frameCount++;
    }

    deltaMs(): number {
        return (this.lastFrame - this.lastLastFrame);
    }

    deltaS(): number {
        return (this.lastFrame - this.lastLastFrame) / 1000;
    }

    getFrameCount(): number {
        return this.frameCount;
    }
}

export class Plugins {
    static time = (world: World) => {
        const time = new Time();
        const Loop = world.schedule();
        const AfterLoop = world.schedule();
        world.system(Loop, [], _ => {
            time.frame();
            requestAnimationFrame(() => {
                world.runSchedule(Loop);
                world.runSchedule(AfterLoop);
            });
        });
        world.system(world.Setup, [], _ => {
            time.frame();
            world.runSchedule(Loop);
            world.runSchedule(AfterLoop);
        });
        return {
            time: time,
            Loop: Loop,
            AfterLoop: AfterLoop,
        }        
    };
    static default = (world: World) => {
        const {time, Loop} = world.plugin(Plugins.time);
        return {
            time: time,
            Loop: Loop
        }
    };
}

function recursiveEvery<T>(array: DeepArray<T>, fn: (array: DeepArray<T>) => boolean): boolean {
    return array.every(v => {
        if (v instanceof Array) {
            return recursiveEvery(v, fn);
        } else {
            return true;
        }
    }) && fn(array);
}

function containsAll<T>(haystack: T[], needles: T[]) {
    return needles.every(needle => haystack.includes(needle));
}