export default interface ISet<T> {
    name?: string;
    length: number;
    activeIndex: number|null;
    clear(): void;
    set(items: T|T[]): number;
    add(items: T|T[]): number;
    get(index: number|null|undefined): T|T[];
}
