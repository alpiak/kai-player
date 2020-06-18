<template lang="pug">
    .list-pane(
        v-if="sources.length && sources.filter((source) => source.get() && source.get().length).length"
        :class="{ 'performance-factor-max-3': performanceFactor < .3 }"
    )
        .toolbar
            select.form-control.input-sm(v-model="sourceSelected")
                option(
                    value=""
                    disabled
                ) {{ $t('Select a media source') }}
                option(
                    v-for="source in sources"
                    v-if="!demo || source.demo"
                    :value="source"
                ) {{ source.name }}
            select.form-control.input-sm(
                v-if="sourceSelected"
                v-model="trackListSelected"
            )
                option(
                    value=""
                    disabled
                ) {{ $t('Select a channel') }}
                option(
                    v-for="channel in sourceSelected.get()"
                    :value="channel"
                ) {{ channel.name }}
        .list-wrap(
            ref="list"
            :class="performanceFactor >= .7 ? { blur: loading } : undefined"
            @contextmenu.prevent="handleContextMenuOnPanel($event);"
        )
            table.table-condensed.table.table-hover
                component(
                    :is="performanceFactor >= .4 ? 'draggable' : 'tbody'"
                    v-model="tracks"
                    :options="{ group: { name: 'tracks', pull: 'clone', put: false }, sort: false, handle: '.drag-handle', forceFallback: true, fallbackOnBody: true }"
                    @start="fixDrag();"
                    element="tbody"
                )
                    tr(
                        v-for="track in tracksToRender"
                        v-interact:doubletap="() => { addToQueueAndPlay(track); }"
                        @contextmenu.prevent="handleContextMenuOnItem($event, track);"
                    )
                        td(style="padding: 0;")
                        td {{ track.name }}
                        td {{ track.artists.map(artist => artist.name).join(', ') }}
                        td(v-if="track && (track.live || track.duration === Infinity)")
                            liveIcon(color="rgb(89, 192, 255)" style="width: auto; height: auto;")
                        td(
                            v-else-if="track.duration"
                            style="width:46px"
                        ) {{ track.duration | formatDuration('mm:ss') }}
                        td(v-else)
                        td.drag-handle(v-if="performanceFactor >= .4")
                            svg(
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                            )
                                use(xlink:href="#icon_menu")
        loading(v-if="loading")
    loading(v-else)
</template>

<script lang="ts">
    import { Component, Vue, Watch } from "vue-property-decorator";
    import { Action, Mutation, State } from "vuex-class";

    import * as moment from "moment";

    import ActionFunction from "../ActionFunction";
    import MutationFunction from "../MutationFunction";
    import Preference from "../Preference";

    import PlayerController from "../PlayerController";
    import Queue from "../Queue";
    import TrackQueue from "../queue/TrackQueue";
    import Track from "../Track";
    import Source from "./Source";
    import SourceGroup from "./SourceGroup";
    import TrackList from "./TrackList";

    import { PLAY_TRACK } from "../../scripts/action-types";

    import { ADD_TRACK, INSERT_QUEUE, UPDATE_ACTIVE_VISUALIZER_TYPE, UPDATE_PLAYING_QUEUE_INDEX, UPDATE_QUEUE,
        UPDATE_QUEUE_GROUP, VISUALIZER_LOAD_RESOURCE } from "../../scripts/mutation-types";

    import { formatDuration } from "../../scripts/utils";

    // @ts-ignore
    import draggable from "vuedraggable";

    import liveIcon from "../live-icon";
    import loading from "../loading";

    import config from "../../config";

    @Component({ components: { draggable, loading, liveIcon }, filters: { formatDuration } })
    export default class extends Vue {
        @State((state) => state.sourceModule.sourceGroup) private sourceGroup!: SourceGroup;
        @State((state) => state.queueModule.queueGroup) private queueGroup!: Queue<TrackQueue>;
        @State((state) => state.playerModule.playerController) private playerController!: PlayerController;
        @State((state) => state.visualizationModule.visualizerType) private visualizerType!: string;
        @State((state) => state.generalModule.preference || config.defaultPreference) private preference!: Preference;
        private sourceSelected: Source = new Source("");
        private trackListSelected: TrackList = new TrackList("", "", this.sourceSelected);
        private tracks = [];
        private loading = false;
        private demo = process.env.DEMO || false;

        private get tracksToRender() {
            if (this.performanceFactor < .1) {
                return this.tracks.slice(0, 10);
            } else if (this.performanceFactor < .6) {
                return this.tracks.slice(0, this.performanceFactor * 100);
            }

            return this.tracks;
        }

        private get sources() {
            return this.sourceGroup.get();
        }

        private get queue() {
            return this.queueGroup.get(this.queueGroup.activeIndex || 0);
        }

        private get player() {
            return this.playerController.player;
        }

        private get playingQueueIndex() {
            return this.$store.state.queueModule.playingQueueIndex;
        }

        private set playingQueueIndex(index) {
            this.UPDATE_PLAYING_QUEUE_INDEX(index);
        }

        private get activeVisualizerType() {
            return this.visualizerType;
        }

        private set activeVisualizerType(type) {
            this[UPDATE_ACTIVE_VISUALIZER_TYPE](type);
        }

        private get performanceFactor() {
            return this.preference.performanceFactor;
        }

        @Mutation(UPDATE_QUEUE_GROUP) private UPDATE_QUEUE_GROUP!: MutationFunction;
        @Mutation(INSERT_QUEUE) private INSERT_QUEUE!: MutationFunction;
        @Mutation(UPDATE_QUEUE) private UPDATE_QUEUE!: MutationFunction;
        @Mutation(UPDATE_PLAYING_QUEUE_INDEX) private UPDATE_PLAYING_QUEUE_INDEX!: MutationFunction;
        @Mutation(ADD_TRACK) private ADD_TRACK!: MutationFunction;
        @Mutation(UPDATE_ACTIVE_VISUALIZER_TYPE) private UPDATE_ACTIVE_VISUALIZER_TYPE!: MutationFunction;
        @Mutation(VISUALIZER_LOAD_RESOURCE) private VISUALIZER_LOAD_RESOURCE!: MutationFunction;
        @Action(PLAY_TRACK) private PLAY_TRACK!: ActionFunction;

        private getContextMenuConfig() {
            return [[{
                icon: "playlist-plus",
                width: { "en": 180, "en-US": 180, "ja": 210, "ko": 190, "zh": 170, "zh-CN": 170 },

                callback: () => {
                    this[INSERT_QUEUE]({
                        index: this.queueGroup.length,

                        queue: new TrackQueue({ name: `
                            ${this.trackListSelected && this.trackListSelected.name}(${moment().format("YYYY-MM-DD")})
                        ` }),
                    });

                    this[UPDATE_QUEUE_GROUP]({activeIndex: this.queueGroup.length - 1});

                    this.addToQueueAndPlay(this.tracks[0]);

                    this.tracks.slice(1).forEach((track) => {
                        this[ADD_TRACK]({ track });
                    });
                },
            }]];
        }

        private addToQueue(track: Track) {
            this[ADD_TRACK]({ track });

            this[UPDATE_QUEUE]({
                activeIndex: this.queue.getLastIndex(),
                index: this.queueGroup.activeIndex,
            });

            this.UPDATE_PLAYING_QUEUE_INDEX(this.queueGroup.activeIndex);
        }

        private addToQueueAndPlay(track: Track, force = false) {
            this.addToQueue(track);
            this[PLAY_TRACK]({ index: this.queue.activeIndex, force });
        }

        private handleContextMenuOnItem(e: Event, track: Track) {
            e.stopPropagation();

            this.$emit("contextMenu", e, [
                [{
                    callback: () => { this.addToQueue(track); },
                    icon: "playlist-music",
                    text: "Add to playlist",
                }, {
                    callback: () => { this.addToQueueAndPlay(track, true); },
                    icon: "play",
                    text: "Force playing",
                }],
                ...this.getContextMenuConfig(),
            ]);
        }

        private handleContextMenuOnPanel(e: Event) {
            this.$emit("contextMenu", e, this.getContextMenuConfig());
        }

        private fixDrag() {
            const el: HTMLElement|null = document.querySelector(".sortable-fallback");

            if (el) {
                el.style.width = (this.$refs.list as HTMLElement).offsetWidth + "px";
            }
        }

        private created() {
            if (this.sources.length) {
                this.sourceSelected = this.sources[0];
                this.trackListSelected = this.sourceSelected.get(0);
            }

            if (!this.trackListSelected) {
                const unwatch = this.$watch(() =>  this.sourceSelected, (sourceSelected) => {
                    if (!sourceSelected) {
                        return;
                    }

                    const trackList = sourceSelected.get(0);

                    if (trackList) {
                        unwatch();
                        this.trackListSelected = trackList;
                    }
                });
            }
        }

        @Watch("trackListSelected")
        private async onTrackListSelectedChanged(trackList: TrackList) {
            if (trackList) {
                this.loading = true;

                try {
                    this.tracks = await trackList.get();
                    (this.$refs.list as Element).scrollTop = 0;
                } catch (e) {
                    // console.log(e);
                }

                this.loading = false;
            } else {
                this.tracks = [];
            }
        }

        @Watch("sources")
        private onSourcesChanged(sources: Source[]) {
            this.sourceSelected = sources[0];
            this.trackListSelected = this.sourceSelected.get(0);
        }

        @Watch("sourceSelected")
        private onSourceSelectedChanged(source: Source) {
            this.trackListSelected = source.get(0);
        }
    }
</script>

<style lang="scss" scoped>
    .list-pane {
        height: 100%;

        .toolbar {
            display: flex;
            align-items: center;
            padding-bottom: 6px;
            box-shadow: inset 0 -2px 1px -1.5px rgba(0, 0, 0, 0.2);

            select {
                width: 50%;

                option {
                    color: #000;
                }
            }
        }

        .list-wrap {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: calc(100% - 36px);
            margin-top: 36px;
            box-shadow: inset 0 2px 1px -1.5px rgba(255, 255, 255, 0.2);
            overflow: auto;
            transition: filter .5s;
        }

        .vue-loading {
            top: 36px;
        }

        &.performance-factor-max-3 {
            .toolbar {
                box-shadow: none;
                border-bottom: 1px solid rgb(30, 30, 30);
            }

            .list-wrap {
                box-shadow: none;
                border-top: 1px solid rgb(60, 60, 60);
            }
        }
    }

    tr {
        cursor: default;

        &.sortable-ghost {
            opacity: .5 !important;
        }

        td {
            word-wrap: break-word;
            word-break: break-all;

            &.drag-handle {
                width: 28px;
                text-align: center;
                cursor: move;
                cursor: -webkit-grab;
            }

            svg {
                width: 18px;
                height: 18px;
                fill: #fff;
                vertical-align: middle;
            }
        }
    }

    .sortable-fallback {
        display: table;
        position: absolute;
        color: #fff;
        opacity: .5;

        td {
            padding: 5px;
        }
    }

    .vue-loading {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }

    .random-queue-box tr {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(51, 122, 183, .2);

        td {
            display: none;
        }
    }
</style>
