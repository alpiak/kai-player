import ISet from "./ISet";

export default interface IQueue<T> extends ISet<T> {
    mode: string;
    insert(index: number, items: T[]): number;
    goTo(index: number): number;
    previous(): number|null;
    next(): number|null;
    switchMode(): number;
    indexOf(item: T): number|null;
}
