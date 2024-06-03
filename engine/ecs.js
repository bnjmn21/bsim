function createEntityWrapper(world, entity, entityArray) {
    let conformingEntity = entity;
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
    entityReference.deleteComponent = (component) => {
        const newEntity = conformingEntity.filter(v => v.constructor !== component);
        world.spawn(newEntity);
        delete entityArray[entityArray.findIndex(v => v === conformingEntity)];
        const components = newEntity.map(v => v.constructor);
        return createEntityWrapper(world, newEntity, componentMapGetExact(world.entityRegistries, components));
    };
    entityReference.addComponent = (component) => {
        const newEntity = [component, ...conformingEntity];
        world.spawn(newEntity);
        delete entityArray[entityArray.findIndex(v => v === conformingEntity)];
        const components = newEntity.map(v => v.constructor);
        return createEntityWrapper(world, newEntity, componentMapGetExact(world.entityRegistries, components));
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
    systems = [];
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
                        totalEntities.push(createEntityWrapper(this, entity, entities));
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
        return createEntityWrapper(this, flatComponents, componentMapGetExact(this.entityRegistries, componentTypes));
    }
    schedule() {
        const reference = this.scheduleRegistry.push(null, () => ({}));
        this.systems[reference.data.index] = [];
        return reference;
    }
    system(schedule, deepComponents, system) {
        let components;
        if (deepComponents instanceof Array) {
            components = deepComponents.flat();
        }
        else {
            components = [deepComponents];
        }
        this.systems[schedule.data.index].push([components, system]);
    }
    runSchedule(schedule) {
        this.scheduleRegistry.checkRefAndThrow(schedule);
        const scheduleSystems = this.systems[schedule.data.index];
        for (let [components, system] of scheduleSystems) {
            let entities;
            if (components.length !== 0) {
                entities = this.getEntities(components);
            }
            else {
                entities = this.getEntities();
            }
            system(entities);
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
