/**
 * Created by qhyang on 2017/12/12.
 */

import Set from "../Set";
import TrackList from "./TrackList";

export default class Source extends Set<TrackList> {

    public readonly id: string;
    public readonly icons: string[];
    public readonly demo: boolean;
    public active: boolean;
    public priority: number;

    constructor(id: string, { name, icons, demo = false }: { name?: string, icons?: string[], demo?: boolean } = {}) {
        super({ name });

        this.id = id;
        this.icons = icons || [];
        this.demo = demo;
        this.active = false;
        this.priority = 1;
    }
}
