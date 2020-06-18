/**
 * Created by qhyang on 2017/12/11.
 */

import ISet from "./ISet";

export default abstract class<T> implements ISet<T> {
    public name?: string;
    public activeIndex: number;
    protected items: T[];

    get length() {
        return this.items.length;
    }

    protected constructor({ name }: { name?: string } = {}) {
        this.name = name;
        this.items = [];
        this.activeIndex = -1;
    }

    public clear() {
        this.items = [];
    }

    public set(items: T|T[]) {
        if (items instanceof Array) {
            this.items = items;
        } else {
            this.items = [items];
        }

        return this.length;
    }

    /**
     *
     * Add item to the set, return the new length.
     *
     * @param {*[]} items
     * @returns {number}
     */
    public add(items: T|T[]) {
        if (items instanceof Array) {
            if (items.filter((item) => item === undefined).length) {
                throw new Error("No item passed.");
            }

            this.items.push(...items);
        } else {
            if (items === undefined) {
                throw new Error("No item passed.");
            }

            this.items.push(items);
        }

        if (this.items.length === 1) {
            this.activeIndex = 0;
        }

        return this.length - 1;
    }

    public get(index: number): T;
    public get(index?: null): T[];
    public get(index?: number|null) {
        if (typeof index === "number") {
            return this.items[index];
        }

        return this.items;
    }
}
