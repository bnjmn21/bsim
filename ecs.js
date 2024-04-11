/**
 * Entity-Component-System Modell, inspiriert von [bevy_ecs](https://docs.rs/bevy_ecs/)
 * Ein ECS besteht aus einer Welt und Systemen.
 * Eine Welt speichert Daten, und Systeme transformieren die Welt.
 * Man kann sich das vorstellen wie die Position aller Atome als Welt, und die physikalischen Gesetze als Systeme.
 * Eine Welt besteht aus Entitäten, Komponenten und Resourcen.
 * Resourcen sind global verfügbare Daten, z.B. Texturen, das HTML-Dokument oder die Uhr.
 * Entitäten sind die eigentlichen "Sachen" einer Welt, sie bestehen aus 0 oder mehr Komponenten.
 * Komponenten speichern Daten zu Entitäten.
 * Systeme sind einfache Funktionen. Sie werden zu einer schedule zugeordnet.
 * Sobald man dann `world.run()` ausführt werden alle Systeme aus der `Setup`-schedule ausgeführt.
 * `Setup` ist standardweise die einzige schedule die es gibt.
 * 
 * Eine Atom-Entität besteht vielleicht aus Position- und Geschwindigkeits-Komponenten:
 * ```js
 * const world = new World();
 * 
 * const {Draw, Time} = world.plugin(Plugins.default);
 * // Fügt einige praktische Resourcen zur Welt hinzu.
 * // Plugins sind Funktionen die die Welt modifizieren.
 * // Sie können z.B. neue Resourcen, Komponenten, Systeme, usw. hinzufügen.
 * // Theoretisch kann man die ganze App als Plugin programmieren und dann zur Welt hinzufügen.
 * // "Draw" ist eine Schedule, deren Systeme ganze Zeit wiederholt ausgeführt wird.
 * // "Time" ist eine Resource, mit der sich genaue Zeitabstände messen lassen.
 * // Die Zeile lässt sich auch schreiben als:
 * // const {Draw} = world.plugin(Plugins.default);
 * // const {Time} = world.plugin(Plugins.default);
 * // Alle Plugins werden nur maximal einmal ausgeführt. world.plugin() merkt sich den return-Wert
 * // von allen bereits ausgeführten Plugins und wenn man dann noch mal world.plugin() ausführt,
 * // wird einfach der bereits gespeicherte Wert ausgegeben.
 * 
 * const Position = world.component("x", "y");
 * // Erstellt eine Position-Komponente, die aus x und y besteht.
 * 
 * const Velocity = world.component(Vec2);
 * // Man kann auch Komponenten aus Klassen erstellen.
 * // alternativ kann man auch beide world.component-Befehle in einen komprimieren:
 * // const {Position, Velocity} = world.component({Position: ["x", "y"], Velocity: Vec2});
 * 
 * world.spawn(Position({x: 0, y: 0}), Velocity(new Vec2(0, 1));
 * // Erzeugt eine Entität die aus einer Position und Geschwindigkeit besteht.
 * // Bei Komponenten aus Klassen kann man auch Velocity.new(0, 1) statt Velocity(new Vec2(0, 1)) verwenden.
 * 
 * world.add_system(Draw, Position, Velocity, (entities, resources) => {
 *     entities.forEach(entity => {
 *         entity(Position).x += resources(Time).deltaSeconds() * entity(Velocity).x;
 *         entity(Position).y += resources(Time).deltaSeconds() * entity(Velocity).y;
 *     });
 * });
 * // Hier wird ein System zu "Draw" hinzugefügt, dass heißt es wird die ganze Zeit ausgeführt.
 * // Das System betrifft nur Entitäten die eine Position- sowie eine Velocity-Komponente haben.
 * // Mit entity(Komponente) kann man auf eine Komponente von einer Entität zugreifen.
 * // Mit resources(Resource) kann man auf eine Resource zugreifen.
 * // resources(Time).deltaSeconds() misst die Zeit die nach einem "Draw" vergangen ist.
 * // So ist die tatsächliche Geschwindigkeit der Atome immer gleich,
 * // egal wie viele Draw-Durchläufe der Computer vom Nutzer pro Sekunde ausführen kann.
 * 
 * world.run();
 * // Jetzt gehts los!
 * // run() blockiert nur so lange wie die Setup-schedule braucht.
 * // Die Draw-schedule aus Plugins.default() wird über `requestAnimationFrame()` ausgeführt und blockiert daher nicht.
 * ```
 */
class World {
    resourceRegistry = new Registry("resource");
    componentRegistry = new Registry("componentType", "component type");
    entityRegistries = {};
    scheduleRegistry = new Registry("schedule");
    systemRegistries = {};
    plugins = [];
    Setup;
    constructor () {
        this.Setup = this.schedule();
    }

    resource(value) {
        return this.resourceRegistry.push(value);
    }

    getResource(resource) {
        return this.resourceRegistry.get(resource);
    }

    getEntities(...components) {
        const flatComponents = components.flat();
        const componentIndices = flatComponents.map(comp =>
            (!this.componentRegistry.checkRefAndThrow(comp)) &&
            comp.data.index
        );
        const totalEntities = [];
        for (let [registryComponents, entities] of Object.entries(this.entityRegistries)) {
            if (containsAll(registryComponents.split(","), componentIndices.map(ci => ci.toString()))) {
                for (let [index, entity] of Object.entries(entities)) {
                    const world = this;
                    const entityComponents = registryComponents.split(",").map(i => +i);
                    const entityReference = (component) => {
                        this.componentRegistry.checkRefAndThrow(component);
                        return entity[entityComponents.findIndex(i => i === component.data.index)];
                    }
                    entityReference.has = (component) => {
                        world.componentRegistry.checkRefAndThrow(component);
                        return entityComponents.includes(component.data.index);
                    }
                    totalEntities.push(entityReference);
                }
            }
        }
        return totalEntities;
    }

    component(...args) {
        const flatArgs = args.flat();

        if (flatArgs.every(v => typeof v === "string")) {
            return this.componentRegistry.push({
                    type: "object",
                    fields: flatArgs
                }, ref => object => {
                        if (flatArgs.some(field => object[field] === undefined)) {
                            throw new Error(`Component missing a field`);
                        }
                        return {
                            typeRef: ref,
                            data: object
                        };
                    }
            );
        }

        if (flatArgs.length === 1 && typeof flatArgs[0] === "function") {
            return this.componentRegistry.push({
                    type: "function",
                }, ref => {
                    const refFns = object => {
                        if (!(object instanceof flatArgs[0])) {
                            throw new Error(`Expected class ${flatArgs[0].name}`);
                        }
                        return ({
                            typeRef: ref,
                            data: object
                        });
                    }
                    refFns.new = (...objects) => {
                        return ({
                            typeRef: ref,
                            data: new flatArgs[0](...objects)
                        });
                    }
                    return refFns;
                }
            );
        }

        if (flatArgs.length === 1 && typeof flatArgs[0] === "object") {
            const returnObj = {};
            for (let [key, value] of Object.entries(flatArgs[0])) {
                returnObj[key] = this.component(value);
            }
            return returnObj;
        }

        throw new Error(
            "Invalid arguments. The correct syntax is:\n" +
            "- component(...strings <arrays will automatically be flattened>)\n" +
            "- component(class)\n" +
            "- component(<object consisting of string lists or classes, can be nested>) <returns an object of all of the return values>"
        );
    }

    spawn(...components) {
        const flatComponents = components.flat();
        const componentTypes = flatComponents.map(v => v.typeRef.index);
        const componentData = flatComponents.map(v => v.data);
        flatComponents.reduce((p, v) => {
            if (p.includes(v)) {
                throw new Error("A Entity can only have one of each component");
            }
            p.push(v);
            return p;
        }, []);
        if (this.entityRegistries[componentTypes] === undefined) {
            this.entityRegistries[componentTypes] = [componentData];
        } else {
            this.entityRegistries[componentTypes].push(componentData);
        }
    }

    schedule() {
        const reference = this.scheduleRegistry.push(null);
        this.systemRegistries[reference.data.index] = {};
        return reference;
    }

    system(schedule, ...args) {
        const invArgs = () => new Error(
            "Invalid Arguments. Syntax:\n" +
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
            "where each function gets the components before it"
        );

        if (args.length < 1) {
            throw invArgs();
        }
        if (!recursiveEvery(args, v => v.length === 0 ||
            typeof v[v.length - 1] === "function" ||
            v.every(sv => sv.constructor === Array)))
        {
            throw invArgs();
        }
        const flatArgs = args.flat();
        const components = [];
        for (let arg of flatArgs) {
            if (this.componentRegistry.checkRef(arg)) {
                components.push(arg.data.index);
            } else if (typeof arg === "function" && !this.componentRegistry.checkRef(arg)) {
                if (!this.systemRegistries[schedule.data.index][components]) {
                    this.systemRegistries[schedule.data.index][components] = [arg];
                } else {
                    this.systemRegistries[schedule.data.index][components].push(arg);
                }
                components.splice(0, components.length);
            } else {
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
        for (let [components, systems] of Object.entries(scheduleSystems)) {
            let entities;
            if (components !== "") {
                entities = this.getEntities(components.split(",").map(id => this.componentRegistry.references[id]));
            } else {
                entities = this.getEntities();
            }
            for (let system of systems) {
                system(entities, (reference) => {
                    this.resourceRegistry.checkRefAndThrow(reference);
                    return this.resourceRegistry.values[reference.data.index];
                });
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
        } else {
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

    constructor (name, friendlyName) {
        this.name = name;
        this.friendlyName = friendlyName || name;
    }

    push(value, refSource = _ => ({})) {
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

class Resources {
    static Time = class {
        isPerformanceSupported;
        relativeTimestamp;
        lastLastFrame;
        lastFrame;
        currentFrame;

        constructor () {
            this.isPerformanceSupported = window.performance && window.performance.now;
            if (!this.isPerformanceSupported) {
                console.warn("Performance API not supported. Using the Date API instead which is less accurate and can tick backwards, e.g. when the user swiches timezones.");
            }
            this.relativeTimestamp = this.now();
            this.lastLastFrame = this.relativeTimestamp;
            this.lastFrame = this.relativeTimestamp;
            this.currentFrame = this.relativeTimestamp;
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
        }

        deltaMs() {
            return (this.lastFrame - this.lastLastFrame);
        }

        deltaS() {
            return (this.lastFrame - this.lastLastFrame) / 1000;
        }
    }
}

class Plugins {
    static time = world => {
        const Time = world.resource(new Resources.Time());
        const Loop = world.schedule();
        world.system(Loop, (_, res) => {
            res(Time).frame();
            requestAnimationFrame(() => world.runSchedule(Loop));
        });
        world.system(world.Setup, (_, res) => {
            res(Time).frame();
            world.runSchedule(Loop);
        });
        return {
            Time: Time,
            Loop: Loop
        }        
    };
    static default = world => {
        const {Time, Loop} = world.plugin(Plugins.time);
        return {
            Time: Time,
            Loop: Loop
        }
    };
}

function recursiveEvery(array, fn) {
    return array.every(v => {
        if (v.constructor === Array) {
            return recursiveEvery(v, fn);
        } else {
            return true;
        }
    }) && fn(array);
}

function containsAll(haystack, needles) {
    return needles.every(needle => haystack.includes(needle));
}