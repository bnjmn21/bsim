import { all, collect, flip, iter, map, zip } from "../iterators.js";
import { test } from "../testing.js";
import { Vec2 } from "../math.js";
export class World {
    entities = new Entities();
}
class Entities {
}
class EntityTable {
    #entities = new Map();
    constructor(components) {
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
    getColumnUnsafe(component) {
        return this.#entities.get(component);
    }
    getEntitiesUnsafe(components) {
        let columns = collect(map(iter(components), c => iter(this.getColumnUnsafe(c))));
        return flip(columns);
    }
    getEntities(components) {
        if (this.hasComponents(components)) {
            return this.getEntitiesUnsafe(components);
        }
        return null;
    }
    hasComponents(components) {
        return all(map(iter(components), c => this.#entities.has(c)));
    }
    components() {
        return this.#entities.keys();
    }
    isComponents(components) {
        return this.hasComponents(components) && all(map(this.components(), c => components.find(v => v === c) !== undefined));
    }
    insertEntityUnsafe(components) {
        let columns = map(iter(components), c => this.getColumnUnsafe(c.__proto__));
        let colsWithComponents = zip(columns, iter(components));
        for (const [column, component] of colsWithComponents) {
            column.push(component);
        }
    }
    tryInsertEntity(components) {
        if (this.isComponents(components)) {
            this.insertEntityUnsafe(components);
            return true;
        }
        return false;
    }
    insertEntity(components) {
        if (!this.tryInsertEntity(components)) {
            throw new Error("Tried to insert entity with components that didn't match the table.");
        }
    }
    removeEntityUnsafe(index) { }
}
test("EntityTable", () => {
    class Position extends Vec2 {
    }
    class Velocity extends Vec2 {
    }
});
