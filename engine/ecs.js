function createEntityWrapper(entity, entityArray) {
    const conformingEntity = entity;
    const entityReference = (component) => {
        return conformingEntity.find(v => v.constructor === component);
    };
    entityReference.has = (component) => {
        return conformingEntity.find(v => v.constructor === component) !== undefined;
    };
    entityReference.componentTypes = () => {
        return conformingEntity.map(v => v.constructor);
    };
    entityReference.componentValues = () => {
        return conformingEntity;
    };
    entityReference.components = () => {
        return conformingEntity.map(v => [v.constructor, v]);
    };
    entityReference.delete = () => {
        delete entityArray[entityArray.findIndex(v => v === conformingEntity)];
    };
    return entityReference;
}
function componentMapHasExact(map, has) {
    for (const [k, v] of map.entries()) {
        if (k.every((v, i) => v === has[i]) && k.length === has.length) {
            return true;
        }
    }
    return false;
}
function componentMapGetExact(map, key) {
    for (const [k, v] of map.entries()) {
        if (k.every((v, i) => v === key[i]) && k.length === key.length) {
            return v;
        }
    }
    return undefined;
}
export class World {
    entityRegistries = new Map();
    scheduleRegistry = new Registry("schedule");
    systemRegistries = [];
    plugins = [];
    Setup;
    constructor() {
        this.Setup = this.schedule();
    }
    getEntities(...components) {
        const flatComponents = components.flat();
        const totalEntities = [];
        for (let [registryComponents, entities] of this.entityRegistries) {
            if (containsAll(registryComponents, flatComponents)) {
                for (let entity of entities) {
                    if (entity) {
                        totalEntities.push(createEntityWrapper(entity, entities));
                    }
                }
            }
        }
        return totalEntities;
    }
    spawn(...components) {
        const flatComponents = components.flat();
        const componentTypes = flatComponents.map(v => v.constructor);
        componentTypes.reduce((p, v) => {
            if (p.includes(v)) {
                throw new Error("A Entity can only have one of each component");
            }
            p.push(v);
            return p;
        }, []);
        if (!componentMapHasExact(this.entityRegistries, componentTypes)) {
            this.entityRegistries.set(componentTypes, [flatComponents]);
        }
        else {
            componentMapGetExact(this.entityRegistries, componentTypes).push(flatComponents);
        }
        return createEntityWrapper(flatComponents, componentMapGetExact(this.entityRegistries, componentTypes));
    }
    schedule() {
        const reference = this.scheduleRegistry.push(null, () => ({}));
        this.systemRegistries[reference.data.index] = new Map();
        return reference;
    }
    system(schedule, ...args) {
        const invArgs = () => new Error("Invalid Arguments. Syntax:\n" +
            "- system(schedule, ...components <can be (nested) arrays>..., function)\n" +
            "- system(schedule, ...arrays of [...components <can be (nested) arrays>..., function])\n" +
            "These can be combined:\n" +
            "system(schedule,\n" +
            "   Comp1, Comp2, fn,\n" +
            "   [Comp1, Comp2], Comp3, fn,\n" +
            "   [Comp1, Comp2, fn, Comp3, fn],\n" +
            "   [[Comp1, Comp2], fn, Comp3, fn]\n" +
            ");\n" +
            "This is all one function, creating many systems at once,\n" +
            "where each function gets the components before it");
        if (args.length < 1) {
            throw invArgs();
        }
        if (!recursiveEvery(args, v => v.length === 0 ||
            typeof v[v.length - 1] === "function" ||
            v.every(sv => sv.constructor === Array))) {
            throw invArgs();
        }
        const flatArgs = args.flat();
        let components = [];
        for (let arg of flatArgs) {
            if (arg.toString().startsWith("class")) {
                components.push(arg);
            }
            else if (typeof arg === "function") {
                if (!componentMapHasExact(this.systemRegistries[schedule.data.index], components)) {
                    this.systemRegistries[schedule.data.index].set(components, [arg]);
                }
                else {
                    componentMapGetExact(this.systemRegistries[schedule.data.index], components).push(arg);
                }
                components = [];
            }
            else {
                throw invArgs();
            }
        }
        if (components.length !== 0) {
            throw invArgs();
        }
    }
    runSchedule(schedule) {
        this.scheduleRegistry.checkRefAndThrow(schedule);
        const scheduleSystems = this.systemRegistries[schedule.data.index];
        for (let [components, systems] of scheduleSystems) {
            let entities;
            if (components.length !== 0) {
                entities = this.getEntities(components);
            }
            else {
                entities = this.getEntities();
            }
            for (let system of systems) {
                system(entities);
            }
        }
    }
    plugin(plugin, ...args) {
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
        }
        else {
            return foundPlugin.result;
        }
    }
    run() {
        this.runSchedule(this.Setup);
    }
}
class Registry {
    values = [];
    references = [];
    name;
    friendlyName;
    constructor(name, friendlyName) {
        this.name = name;
        this.friendlyName = friendlyName || name;
    }
    push(value, refSource) {
        const index = this.values.push(value) - 1;
        const referenceData = {
            type: this.name,
            index: index,
        };
        const reference = refSource(referenceData);
        reference.data = referenceData;
        Object.freeze(reference.data);
        this.references.push(reference);
        return reference;
    }
    checkRefAndThrow(reference) {
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
    checkRef(reference) {
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
    get(reference) {
        this.checkRefAndThrow(reference);
        return this.values[reference.data.index];
    }
}
export class Time {
    isPerformanceSupported;
    relativeTimestamp;
    lastLastFrame;
    lastFrame;
    currentFrame;
    frameCount;
    constructor() {
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
    now() {
        return this.isPerformanceSupported ? window.performance.now() : Date.now();
    }
    ms() {
        return this.now() - this.relativeTimestamp;
    }
    s() {
        return this.ms() / 1000;
    }
    frame() {
        this.lastLastFrame = this.lastFrame;
        this.lastFrame = this.currentFrame;
        this.currentFrame = this.ms();
        this.frameCount++;
    }
    deltaMs() {
        return (this.lastFrame - this.lastLastFrame);
    }
    deltaS() {
        return (this.lastFrame - this.lastLastFrame) / 1000;
    }
    getFrameCount() {
        return this.frameCount;
    }
}
export class Plugins {
    static time = (world) => {
        const time = new Time();
        const Loop = world.schedule();
        const AfterLoop = world.schedule();
        world.system(Loop, _ => {
            time.frame();
            requestAnimationFrame(() => {
                world.runSchedule(Loop);
                world.runSchedule(AfterLoop);
            });
        });
        world.system(world.Setup, _ => {
            time.frame();
            world.runSchedule(Loop);
            world.runSchedule(AfterLoop);
        });
        return {
            time: time,
            Loop: Loop,
            AfterLoop: AfterLoop,
        };
    };
    static default = (world) => {
        const { time, Loop } = world.plugin(Plugins.time);
        return {
            time: time,
            Loop: Loop
        };
    };
}
function recursiveEvery(array, fn) {
    return array.every(v => {
        if (v instanceof Array) {
            return recursiveEvery(v, fn);
        }
        else {
            return true;
        }
    }) && fn(array);
}
function containsAll(haystack, needles) {
    return needles.every(needle => haystack.includes(needle));
}
