<template lang="pug">
    .tracks-pane(:class="{ 'performance-factor-max-3': performanceFactor < .3 }")
        .toolbar
            template(v-if="queue")
                template(v-if="queue.constructor === RandomTrackQueue")
                    .tool-button.glowing-button(
                        @click="copyToQueue(activeTrack)"
                        v-tooltip="performanceFactor >= .3 ? { content: $t('Add to a playlist'),  ...tooltipConfig } : undefined"
                    )
                        svg(
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        )
                            path(d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z")
                template(v-else)
                    .tool-button.glowing-button(
                        v-if="mode === 'shuffle'"
                        v-interact:tap="() => { SWITCH_QUEUE_MODE(); }"
                        v-tooltip="performanceFactor >= .3 ? { content: $t('Shuffle'),  ...tooltipConfig } : undefined"
                    )
                        svg(
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        )
                            path(d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z")
                    div(v-else-if="mode === 'repeatOne'")
                        .tool-button.glowing-button(
                            v-interact:tap="() => { SWITCH_QUEUE_MODE(); }"
                            v-tooltip="performanceFactor >= .3 ? { content: $t('Repeat one'),  ...tooltipConfig } : undefined"
                        )
                            svg(
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                            )
                                path(d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z")
                    div(v-else)
                        div
                            .tool-button.glowing-button(
                                v-interact:tap="() => { SWITCH_QUEUE_MODE(); }"
                                v-tooltip="performanceFactor >= .3 ? { content: $t('Repeat all'),  ...tooltipConfig } : undefined"
                            )
                                svg(
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                )
                                    path(d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z")
                    .tool-button.glowing-button(
                        v-interact:tap="() => { removeDuplicated(); }"
                        v-tooltip="performanceFactor >= .3 ? { content: $t('Remove duplicated tracks'),  ...tooltipConfig } : undefined"
                    )
                        svg(
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        )
                            path(d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z")
                    template(v-if="performanceFactor >= .4")
                        draggable.tool-button.glowing-button(
                            v-if="editMode"
                            v-model="trashCan.data"
                            :options="{ group: 'tracks', draggable: '' }"
                            @pointerover.native="trashCan.hover = true"
                            @pointerleave.native="trashCan.hover = false"
                            :class="{ active: dragging && trashCan.hover }"
                            v-tooltip="performanceFactor >= .3 ? { content: $t('Drag a track here to remove it'),  ...tooltipConfig } : undefined"
                        )
                            svg(
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                            )
                                use(xlink:href="#icon_trash-can")
                    .tool-button.glowing-button(
                        v-interact:tap="() => { editMode = !editMode; }"
                        v-tooltip="performanceFactor >= .3 ? { content: editMode ? $t('Exit edit mode') : $t('Enter edit mode'),  ...tooltipConfig } : undefined"
                    )
                        svg(
                            v-if="editMode"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        )
                            path(d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z")
                        svg(
                            v-else
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                        )
                            path(d="M20.71,7.04C21.1,6.65 21.1,6 20.72,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15,5.25L18.75,9M17.75,10L14,6.25L4,16.25V20H7.75L17.75,10Z")
        .list-wrap(v-if="queue")
            .random-queue-box(v-if="queue.constructor === RandomTrackQueue")
                mixin track
                    h5(v-if="activeTrack") {{ activeTrack.name + ' - ' + (activeTrack.artists && activeTrack.artists.map(artist => artist.name).join(', ') || $t('Unknown Artist')) }}
                template(v-if="performanceFactor >= .4")
                    draggable.draggable(
                        v-model="tracks"
                        :options="{ group: 'tracks', draggable: '' }"
                        @add="playTrack($event.newIndex);"
                    )
                    yoyoMarquee(
                        v-if="activeTrack"
                        style="width: 90%; text-align: center;"
                        :title="activeTrack.name + '-' + (activeTrack.artists && activeTrack.artists.map(artist => artist.name).join(', ') || $t('Unknown Artist'))"
                    )
                        +track
                template(v-else)
                    div(style="width: 90%; text-align: center;")
                        +track
                .play-button.glowing-button(
                    v-if="activeTrack && !active || queueGroup.activeIndex !== playingQueueIndex"
                    v-interact:tap="() => { playTrack(activeIndex); }"
                )
                    svg(
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    )
                        path(d="M8 5v14l11-7z")
                .tips.text-muted {{ $t('Drag a track here and start random listening') }}
            table.table-condensed.table.table-hover(v-else)
                component(
                    :is="performanceFactor >= .4 ? 'draggable' : 'tbody'"
                    v-model="tracks"
                    :options="{ group: 'tracks', handle: '.drag-handle', forceFallback: true, fallbackOnBody: true }"
                    @sort="handleSort"
                    @add="handleAdd"
                    @start="dragging = true; fixDrag();"
                    @end="dragging = false;"
                    element="tbody"
                )
                    tr(
                        v-for="(track, index) in tracks"
                        v-interact:doubletap="() => { playTrack(index); }"
                        v-interact:tap="() => { select(index); }"
                        @contextmenu.prevent="handleTrackContextMenu($event, track, index);"
                        :class="{ active: selectedIndex === index }"
                        ref="tracks"
                    )
                        td(style="width: 18px;")
                            template(v-if="queueGroup.activeIndex === playingQueueIndex && index === activeIndex")
                                template(v-if="performanceFactor >= .1")
                                    svg(
                                        v-if="playing"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                    )
                                        path(d="M8 5v14l11-7z")
                                    svg(
                                        v-else
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                    )
                                        path(d="M6 19h4V5H6v14zm8-14v14h4V5h-4z")
                                template(v-else) {{ playing ? ">" : "II" }}
                        td
                            .track-name
                                editableBox(
                                    v-model="track.name"
                                    :editable="editMode"
                                )
                                .track-notifications.glowing-button(v-if="performanceFactor >= .6 ? true : selectedIndex === index")
                                    v-popover(
                                        v-if="track.status === Status.Error"
                                        delay="300"
                                        placement="top"
                                        trigger="hover click focus"
                                    )
                                        svg.error(
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                        )
                                            path(d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z")
                                        .error-messages(
                                            slot="popover"
                                            v-for="message of Array.from(track.messages)"
                                        ) {{ $t(message.text) }}
                                    v-popover(
                                        v-else-if="track.status === Status.Warning"
                                        delay="300"
                                        placement="top"
                                        trigger="hover click focus"
                                    )
                                        svg.warning(
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                        )
                                            path(d="M12,2L1,21H23M12,6L19.53,19H4.47M11,10V14H13V10M11,16V18H13V16")
                                        .error-messages(
                                            slot="popover"
                                            v-for="message of Array.from(track.messages)"
                                        ) {{ $t(message.text) }}
                                    v-popover(
                                        v-if="selectedIndex === index"
                                        delay="300"
                                        placement="top"
                                        trigger="hover click focus"
                                    )
                                        svg.info(
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                        )
                                            path(d="M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,11A1,1 0 0,1 13,12A1,1 0 0,1 12,13A1,1 0 0,1 11,12A1,1 0 0,1 12,11M12,8C14.63,8 17,9.57 18,12C16.62,15.31 12.81,16.88 9.5,15.5C7.92,14.84 6.66,13.58 6,12C7,9.57 9.37,8 12,8M12,9.5A2.5,2.5 0 0,0 9.5,12A2.5,2.5 0 0,0 12,14.5A2.5,2.5 0 0,0 14.5,12A2.5,2.5 0 0,0 12,9.5")
                                        div(slot="popover") Available in next release.
                        td {{ track.artists.map(artist => artist.name).join(', ') }}
                        td(v-if="track && (track.live || track.duration === Infinity)")
                            liveIcon(color="rgb(89, 192, 255)" style="width: auto; height: auto;")
                        td(
                            v-else-if="track.duration"
                            style="width:46px"
                        ) {{ track.duration | formatDuration('mm:ss') }}
                        td(v-else)
                        td(
                            v-if="showSourceIcon && !demo || track.source.demo"
                            style="text-align: right"
                        )
                            template(v-if="performanceFactor >= .2")
                                img(
                                    :src="track.source.icons[0] || defaultIcon"
                                    :alt="track.source.name"
                                    :title="track.source.name"
                                )
                            template(v-else) {{ track.source.name }}
                        template(v-if="performanceFactor >= .4")
                            td.drag-handle(v-if="editMode")
                                svg(
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                )
                                    use(xlink:href="#icon_menu")

                    tr(
                        slot="footer"
                        v-if="tracks.length < 2"
                        style="display: block; height: 80px; opacity: 0;"
                    )
</template>

<script>
    import { mapState, mapMutations, mapActions } from 'vuex';

    import draggable from "vuedraggable";
    import tooltip from "vue-strap/src/tooltip";
    import modal from "vue-strap/src/modal";

    import config from "../../config";

    import { formatDuration } from "../../scripts/utils";

    import PlayerStatus from "../PlayerStatus";
    import RandomTrackQueue from './RandomTrackQueue';
    import Status from "../Status";

    import { UPDATE_QUEUE, UPDATE_PLAYING_QUEUE_INDEX, ADD_TRACK, UPDATE_TRACK, SWITCH_QUEUE_MODE, SET_MODAL_OPEN, VISUALIZER_LOAD_RESOURCE } from "../../scripts/mutation-types";
    import { LOAD_MODAL, PLAY_TRACK, STOP_PLAYBACK } from "../../scripts/action-types";

    import yoyoMarquee from "../yoyo-marquee";
    import editableBox from "../editable-box";
    import liveIcon from "../live-icon";

    export default {
        components: {
            draggable,
            tooltip,
            modal,
            yoyoMarquee,
            editableBox,
            liveIcon,
        },

        data() {
          return {
              selectedIndex: null,
              editMode: false,
              trashCan: {
                  hover: false,
                  data: []
              },
              dragging: false,
              tooltipConfig: {
                  delay: 500,
                  trigger: "hover click focus",
              },
              RandomTrackQueue,
              Status,
              defaultIcon: config.defaultIcon,
              demo: process.env.DEMO,
          };
        },

        computed: {
            queue() {
                return this.queueGroup.get(this.queueGroup.activeIndex || 0);
            },

            mode() {
                return this.queue.mode;
            },

            tracks: {
                get() {
                    return this.queue ? this.queue.get() : [];
                },

                set(tracks) {
                    this[UPDATE_QUEUE]({
                        index: this.queueGroup.activeIndex,
                        tracks
                    });
                }
            },

            activeIndex: {
                get() {
                    return this.queue ? this.queue.activeIndex : null;
                },

                set(activeIndex) {
                    this[UPDATE_QUEUE]({
                        index: this.queueGroup.activeIndex,
                        activeIndex,
                    });
                }
            },

            activeTrack() {
                return this.queue && this.queue.get(this.activeIndex);
            },

            playing() {
                return this.playerController.status === PlayerStatus.Playing
                    || this.playerController.status === PlayerStatus.Streaming;
            },

            active() {
                return this.playing || this.playerController.status === PlayerStatus.Loading;
            },

            playingQueueIndex: {
                get() {
                    return this.$store.state.queueModule.playingQueueIndex;
                },

                set(index) {
                    this[UPDATE_PLAYING_QUEUE_INDEX](index);
                }
            },

            performanceFactor() {
                return this.preference.performanceFactor;
            },

            ...mapState({
                queueGroup: state => state.queueModule.queueGroup,
                sources: state => state.sourceModule.sourceGroup.get(),
                playerController: state => state.playerModule.playerController,
                visualizer: state => state.visualizationModule.visualizer,
                showSourceIcon: state => state.generalModule.showSourceIcon,
                preference: (state) => state.generalModule.preference || config.defaultPreference,
            })
        },

        watch: {
            activeIndex(to) {
                if (!this.$refs.tracks) {
                    return;
                }

                const trackDomEl = this.$refs.tracks[to];

                if (trackDomEl) {
                    trackDomEl.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }
        },

        methods: {
            async playTrack(index, force = false) {
                this[PLAY_TRACK]({
                    index: this.queue.goTo(index),
                    queueIndex: this.queueGroup.activeIndex,
                    force,
                });
            },

            handleTrackRemove(index) {
                if (index === this.activeIndex) {
                    if (this.playingQueueIndex === this.queueGroup.activeIndex) {
                        this[STOP_PLAYBACK]();
                    }

                    if (index > 0) {
                        this.activeIndex--;
                    }
                } else if (index < this.activeIndex) {
                    this.activeIndex--;
                }
            },

            async removeDuplicated() {
                try {
                    await this.$confirm({
                        title: this.$t('Confirm Action'),
                        bodyText: this.$t('Remove duplicated tracks?'),
                        confirmText: this.$t('Confirm'),
                        cancelText: this.$t('Cancel')
                    });

                    const checkSame = (track1, track2) => {
                        if (track1.name.replace(/\s/g, '') !== track2.name.replace(/\s/g, '')) {
                            return false;
                        }

                        const track1UniqueArtists = track1.artists.filter(artist => {
                            return !(track2.artists.find(anotherArtist => {
                                return artist.name.replace(/\s/g, '') === anotherArtist.name.replace(/\s/g, '');
                            }) + 1);
                        });

                        const track2UniqueArtists = track1.artists.filter(artist => {
                            return !(track1.artists.find(anotherArtist => {
                                return artist.name.replace(/\s/g, '') === anotherArtist.name.replace(/\s/g, '');
                            }) + 1);
                        });

                        return !track1UniqueArtists.length && !track2UniqueArtists.length;
                    };

                    const activeTrack = this.activeTrack();

                    this.tracks = this.tracks.filter((track, index) => {
                        return !this.tracks.find((anotherTrack, anotherIndex) => {
                            // Avoid comparing a track with itself or compare two same tracks multiple times
                            if (index >= anotherIndex) {
                                return false;
                            }

                            return checkSame(track, anotherTrack);
                        });
                    });

                    this.activeIndex = this.queue.indexOf(activeTrack);
                } catch (e) { }
            },

            select(index) {
                const select = () => {
                    document.removeEventListener('click', select);
                    this.selectedIndex = index;
                };

                document.addEventListener('click', select);
            },

            handleSort(e) {
                if (this.activeIndex !== null) {
                    if (e.from === e.to) {
                        if (e.oldIndex === this.activeIndex) {
                            this.activeIndex = e.newIndex;
                        } else if (e.oldIndex > this.activeIndex && e.newIndex <= this.activeIndex) {
                            this.activeIndex++;
                        } else if (e.oldIndex < this.activeIndex && e.newIndex >= this.activeIndex) {
                            this.activeIndex--;
                        }
                    } else if (e.from !== e.to) {
                        this.handleTrackRemove(e.oldIndex);
                    }
                }
            },

            handleAdd(e) {
                if (e.newIndex <= this.activeIndex) {
                    this.activeIndex++;
                }
            },

            copyToQueue(track, callback) {
                this[LOAD_MODAL]({
                    component: "select-queue",
                    buttons: [{
                        callback: (queue) => {
                            this[ADD_TRACK]({ track, queue });

                            if (queue instanceof RandomTrackQueue) {
                                const queueIndex = (() => {
                                    const queues = this.queueGroup.get();

                                    for (let i = 0; i < queues.length; i++) {
                                        if (queues[i] === queue) {
                                            return i;
                                        }
                                    }

                                    return -1;
                                })();

                                if (queueIndex !== -1) {
                                    this[PLAY_TRACK]({ index: queue.goTo(queue.getLastIndex()), queueIndex });
                                }
                            }

                            if (callback) {
                                callback();
                            }
                        },
                        text: "Confirm",
                        type: "primary",
                        close: true,
                    }, {
                        text: "Cancel",
                        type: "default",
                        close: true,
                    }],
                    title: "Select a playlist",
                    size: "small",
                });

                this[SET_MODAL_OPEN](true);
            },

            handleTrackContextMenu(e, track, index) {
                this.selectedIndex = index;

                this.$emit("contextMenu", e, [[
                    { text: "Play", icon: "play", callback: () => { this.playTrack(index); } },
                    { text: "Force playing", icon: "play", callback: () => { this.playTrack(index, true); } },
                ], [{ text: "Share", icon: "share", moreAction: true, callback: () => {
                        this[LOAD_MODAL]({
                            component: "share",
                            buttons: [{
                                text: "Close",
                                type: "default",
                                close: true,
                            }],
                            inputValue: track,
                            title: "Share",
                            size: "small",
                        });

                        this[SET_MODAL_OPEN](true);
                    } }], [{
                    text: "Move up",
                    callback: () => {
                        if (index > 0) {
                            this.$set(this.tracks, index, this.tracks[index - 1]);
                            this.$set(this.tracks, index - 1, track);
                            this.tracks = this.tracks;

                            if (this.activeIndex === index - 1) {
                                this.activeIndex++;
                            } else if (this.activeIndex === index) {
                                this.activeIndex--;
                            }

                            if (this.selectedIndex === index - 1) {
                                this.selectedIndex++;
                            } else if (this.selectedIndex === index) {
                                this.selectedIndex--;
                            }
                        }
                    },
                }, {
                    text: "Move down",

                    callback: () => {
                        if (index + 1 < this.tracks.length) {
                            this.$set(this.tracks, index, this.tracks[index + 1]);
                            this.$set(this.tracks, index + 1, track);
                            this.tracks = this.tracks;

                            if (this.activeIndex === index) {
                                this.activeIndex++;
                            } else if (this.activeIndex === index + 1) {
                                this.activeIndex--;
                            }

                            if (this.selectedIndex === index) {
                                this.selectedIndex++;
                            } else if (this.selectedIndex === index + 1) {
                                this.selectedIndex--;
                            }
                        }
                    },
                }], [{
                    text: "Move to",
                    moreAction: true,

                    callback: () => {
                        this.copyToQueue(track, () => this.tracks = this.tracks.slice(0, index).concat(this.tracks.slice(index + 1)));
                    },
                }, {
                    text: "Copy to",
                    moreAction: true,
                    width: { ja: 180 },
                    callback: () => { this.copyToQueue(track); },
                }], [{
                    text: "Remove",
                    icon: "trash-can",

                    callback: () => {
                        this.tracks = this.tracks.slice(0, index).concat(this.tracks.slice(index + 1));
                        this.trashCan.data.push(track);
                        this.handleTrackRemove(index);
                    }
                }]]);
            },

            fixDrag() {
                const el = document.querySelector('.sortable-fallback');

                if (el) {
                    el.style.width = this.$refs.tracks[0].offsetWidth;
                }
            },

            unSelect() {
                this.selectedIndex = null;
            },

            ...mapMutations([
                UPDATE_QUEUE,
                UPDATE_PLAYING_QUEUE_INDEX,
                ADD_TRACK,
                UPDATE_TRACK,
                SWITCH_QUEUE_MODE,
                SET_MODAL_OPEN,
                VISUALIZER_LOAD_RESOURCE
            ]),

            ...mapActions([
                LOAD_MODAL,
                PLAY_TRACK,
                STOP_PLAYBACK,
            ])
        },

        filters: {
            formatDuration
        },

        created() {
            document.addEventListener('click', this.unSelect);
        },

        destroyed() {
            document.removeEventListener('click', this.unSelect);
        }
    }
</script>

<style lang="scss" scoped>
    .tracks-pane {
        height: 100%;

        .toolbar {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 0 5px;
            box-shadow: inset 0 -2px 1px -1.5px rgba(0, 0, 0, 0.2);

            .tool-button {
                margin: 2px;

                tr {
                    display: none;
                }
            }
        }

        .list-wrap {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: calc(100% - 30px);
            margin-top: 25px;
            box-shadow: inset 0 2px 1px -1.5px rgba(255, 255, 255, 0.2);
            overflow: auto;

            .random-queue-box {
                display: flex;
                justify-content: center;
                align-items: center;
                position: absolute;
                left: 0;
                top: 0;
                right: 0;
                bottom: 0;

                .play-button {
                    position: absolute;
                    top: 10%;
                    width: auto;
                    height: 30%;

                    svg {
                        width: auto;
                        height: 100%;
                    }
                }

                .draggable {
                    position: absolute;
                    left: 0;
                    top: 0;
                    right: 0;
                    bottom: 0;
                }

                .tips {
                    position: absolute;
                    left: 0;
                    bottom: 12%;
                    width: 100%;
                    text-align: center;
                    font-style: italic;
                }
            }
        }

        tr {
            cursor: default;

            &.sortable-ghost {
                opacity: .2 !important;
            }

            svg {
                width: 18px;
                height: 18px;
                fill: #fff;
                vertical-align: middle;
            }

            img {
                width: 15px;
                height: 15px;
                margin-top: -2px;
                vertical-align: middle;
            }

            .track-name {
                display: flex;
                align-items: center;

                .track-notifications {
                    display: flex;
                    flex-wrap: wrap;

                    svg {
                        display: block;
                        width: 16px;
                        height: 16px;
                    }
                }
            }

            .drag-handle {
                width: 28px;
                text-align: center;
                cursor: move;
                cursor: -webkit-grab;
            }
        }

        .error-messages {
            text-align: left;
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
</style>
