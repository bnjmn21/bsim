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

export type Constructor<T> = new (...args: any[]) => T;
export type Instance<T extends Constructor<any>> = T extends Constructor<infer I> ? I : never;

export type ResourceRef<T> = Reference<T, "resource", {}>;
export type ResourceWrapper = (<R>(resource: ResourceRef<R>) => R);

export type Entity<T> = T[];
export type EntityWrapper<T extends Constructor<any>> = (<E extends Instance<T>>(component: Constructor<E>) => E) & {
    has: (component: T) => boolean;
    componentTypes: () => T[];
    componentValues: () => T[];
    components: () => [T, Instance<T>][];
};

export type Schedule = Reference<null, "schedule", {}>;

export type System<T extends Constructor<any>> = (e: EntityWrapper<T>[], r: ResourceWrapper) => void;

export type InternalPlugin = {result: any, fn: Plugin<any, any>, args: any[]};
export type Plugin<T, A extends any[]> = (world: World, ...args: A) => T;

export type DeepArray<T> = (T | DeepArray<T>)[];

export class World {
    resourceRegistry: Registry<any, "resource", {}> = new Registry("resource");
    entityRegistries: Map<Constructor<any>[], Entity<any>[]> = new Map();
    scheduleRegistry: Registry<null, "schedule", {}> = new Registry("schedule");
    systemRegistries: Map<Constructor<any>[], Function[]>[] = [];
    plugins: InternalPlugin[] = [];
    Setup;

    constructor () {
        this.Setup = this.schedule();
    }

    resource<T>(value: T): ResourceRef<T> {
        return this.resourceRegistry.push(value, () => ({}));
    }

    getResource<T>(resource: ResourceRef<T>): T {
        return this.resourceRegistry.get(resource);
    }

    getEntities<T extends Constructor<any>>(...components: DeepArray<T>): EntityWrapper<T>[] {
        const flatComponents = components.flat() as Constructor<any>[];
        const totalEntities: EntityWrapper<T>[] = [];
        for (let [registryComponents, entities] of this.entityRegistries) {
            if (containsAll(registryComponents, flatComponents)) {
                for (let entity of entities) {
                    const conformingEntity = entity as Entity<Instance<T>>;
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
                    totalEntities.push(entityReference);
                }
            }
        }
        return totalEntities;
    }

    spawn<T extends Instance<Constructor<any>>>(...components: DeepArray<T>) {
        const flatComponents = components.flat() as Instance<Constructor<any>>[];
        const componentTypes = flatComponents.map(v => v.constructor as Constructor<any>);
        componentTypes.reduce((p, v) => {
            if (p.includes(v)) {
                throw new Error("A Entity can only have one of each component");
            }
            p.push(v);
            return p;
        }, [] as Constructor<any>[]);
        if (!this.entityRegistries.has(componentTypes)) {
            this.entityRegistries.set(componentTypes, [flatComponents]);
        } else {
            (this.entityRegistries.get(componentTypes) as Entity<any>[]).push(flatComponents);
        }
    }

    schedule(): Reference<null, "schedule", {}> {
        const reference = this.scheduleRegistry.push(null, () => ({}));
        this.systemRegistries[reference.data.index] = new Map();
        return reference;
    }

    system<T extends Constructor<any>>(schedule: Schedule, ...args: DeepArray<T | System<T>>) {
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
        const flatArgs = args.flat() as (T | System<T>)[];
        const components = [];
        for (let arg of flatArgs) {
            if (arg.toString().startsWith("class")) {
                components.push(arg as T);
            } else if (typeof arg === "function") {
                if (!this.systemRegistries[schedule.data.index].has(components)) {
                    this.systemRegistries[schedule.data.index].set(components, [arg]);
                } else {
                    (this.systemRegistries[schedule.data.index].get(components) as Function[]).push(arg);
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

    runSchedule(schedule: Schedule) {
        this.scheduleRegistry.checkRefAndThrow(schedule);
        const scheduleSystems = this.systemRegistries[schedule.data.index];
        for (let [components, systems] of scheduleSystems) {
            let entities;
            if (components.length !== 0) {
                entities = this.getEntities(components);
            } else {
                entities = this.getEntities();
            }
            for (let system of systems) {
                system(entities, (reference: ResourceRef<any>) => {
                    this.resourceRegistry.checkRefAndThrow(reference);
                    return this.resourceRegistry.values[reference.data.index];
                });
            }
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

    constructor () {
        this.isPerformanceSupported = !!(window.performance && window.performance.now);
        if (!this.isPerformanceSupported) {
            console.warn("Performance API not supported. Using the Date API instead which is less accurate and can tick backwards, e.g. when the user swiches timezones.");
        }
        this.relativeTimestamp = this.now();
        this.lastLastFrame = this.relativeTimestamp;
        this.lastFrame = this.relativeTimestamp;
        this.currentFrame = this.relativeTimestamp;
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
    }

    deltaMs(): number {
        return (this.lastFrame - this.lastLastFrame);
    }

    deltaS(): number {
        return (this.lastFrame - this.lastLastFrame) / 1000;
    }
}

export class Plugins {
    static time = (world: World) => {
        const TimeRes = world.resource(new Time());
        const Loop = world.schedule();
        world.system(Loop, (_, res) => {
            res<Time>(TimeRes).frame();
            requestAnimationFrame(() => world.runSchedule(Loop));
        });
        world.system(world.Setup, (_, res) => {
            res<Time>(TimeRes).frame();
            world.runSchedule(Loop);
        });
        return {
            Time: TimeRes,
            Loop: Loop
        }        
    };
    static default = (world: World) => {
        const {Time, Loop} = world.plugin(Plugins.time);
        return {
            Time: Time,
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