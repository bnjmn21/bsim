import { Iter, all, collect, flip, iter, map, zip } from "../iterators.js";
import { Constructor, Instance } from "../types.js";
import { test } from "../testing.js";
import { Vec2 } from "../math.js";

export type ComponentId<T extends Component<any>> = Constructor<T>;
export type Component<T extends ComponentId<any>> = Instance<T>;

export class World {
    entities: Entities = new Entities();
}

class Entities {
    
}

class EntityTable<T extends ComponentId<any>> {
    #entities: Map<T, Component<T>[]> = new Map();

    constructor (components: T[]) {
        for (const component of components) {
            this.#entities.set(component, []);
        }
    }

    /**
     * Gets a column of components of the same type.
     * 
     * # Safety
     * 
     * `component` must be a component that is part of the table.
     * 
     * # Examples
     * 
     * ```
     * const table = new EntityTable(Position, Velocity);
     * table.insertEntity(new Position(2, 4), new Velocity(0, 1));
     * table.insertEntity(new Position(2, 4), new Velocity(-1, 0));
     * table.insertEntity(new Position(2, 4), new Velocity(1, -1));
     * 
     * console.log(table.getColumnUnsafe(Velocity));
     * ```
     * 
     * @param component The column to get
     * @returns The column
     */
    getColumnUnsafe<C extends T>(component: C): Component<C>[] {
        return this.#entities.get(component) as Component<C>[];
    }

    getEntitiesUnsafe<C extends T>(components: C[]): Iter<Component<C>[]> {
        let columns = collect(map(iter(components), c => iter(this.getColumnUnsafe(c))));
        return flip(columns);
    }

    getEntities<C extends T>(components: C[]): Iter<Component<C>[]> | null {
        if (this.hasComponents(components)) {
            return this.getEntitiesUnsafe(components);
        }

        return null;
    }

    hasComponents(components: ComponentId<any>[]): boolean {
        return all(map(iter(components), c => this.#entities.has(c as T)));
    }

    components(): Iter<T> {
        return this.#entities.keys();
    }

    isComponents(components: ComponentId<any>[]): boolean {
        return this.hasComponents(components) && all(map(this.components(), c => components.find(v => v === c) !== undefined));
    }

    insertEntityUnsafe(components: Component<T>[]) {
        let columns = map(iter(components), c => this.getColumnUnsafe(c.__proto__));
        let colsWithComponents = zip(columns, iter(components));
        for (const [column, component] of colsWithComponents) {
            column.push(component);
        }
    }

    tryInsertEntity(components: Component<T>[]): boolean {
        if (this.isComponents(components)) {
            this.insertEntityUnsafe(components);
            return true;
        }
        return false;
    }

    insertEntity(components: Component<T>[]) {
        if (!this.tryInsertEntity(components)) {
            throw new Error("Tried to insert entity with components that didn't match the table.");
        }
    }

    removeEntityUnsafe(index: number) {}
}

test("EntityTable", () => {
    class Position extends Vec2 {}
    class Velocity extends Vec2 {}
    
});