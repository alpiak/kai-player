<template lang="pug">
    .playlist-pane(:class="{ 'performance-factor-max-3': performanceFactor < .3 }")
        .toolbar
            .tool-button.glowing-button(v-interact:tap="() => { insert(typeof selectedIndex === 'number' ? selectedIndex + 1 : queueGroup.length); }")
                svg(
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                )
                    path(d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z")
            template(v-if="performanceFactor >= .4")
                draggable.tool-button.glowing-button(
                    v-if="editMode"
                    v-model="trashCan.data"
                    :options="{ group: 'queues', draggable: '' }"
                    @pointerover.native="trashCan.hover = true"
                    @pointerleave.native="trashCan.hover = false"
                    :class="{ active: dragging && trashCan.hover }"
                    v-tooltip="performanceFactor >= .3 ? { content: $t('Drag a playlist here to remove it'),  ...tooltipConfig } : undefined"
                )
                    svg(
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                    )
                        path(d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z")
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
        .list-wrap
            table.table-condensed.table.table-hover
                component(
                    :is="performanceFactor >= .4 ? 'draggable' : 'tbody'"
                    v-model="queues"
                    :options="{ group: 'queues', handle: '.drag-handle', forceFallback: true, fallbackOnBody: true }"
                    @sort="onSort"
                    @start="dragging = true; fixDrag();"
                    @end="dragging = false"
                    element="tbody"
                )
                    tr(
                        v-for="(queue, index) in queues"
                        v-interact:doubletap="() => activeIndex = index"
                        v-interact:tap="() => { select(index); }"
                        @contextmenu.prevent="handleContextMenu($event, queue, index);"
                        :class="{ active: selectedIndex === index, 'active-queue': activeIndex === index }"
                        ref="playlists"
                    )
                        td(style="width:18px")
                            template(v-if="performanceFactor >= .1")
                                svg(
                                    v-if="index === playingIndex"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                )
                                    path(d="M8 5v14l11-7z")
                            template(v-else)
                                template(v-if="index === playingIndex") >
                        td(style="padding: 0;")
                            editableBox(
                                v-model="queue.name"
                                :editable="editMode"
                                :height="30"
                            )
                        td(v-if="queue.constructor === RandomTrackQueue") ∞
                        td(v-else) {{ queue.length }}
                        template(v-if="performanceFactor >= .4")
                            td.drag-handle(v-if="editMode")
                                svg(
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                )
                                    use(xlink:href="#icon_menu")
</template>

<script>
    import { mapState, mapMutations } from 'vuex';

    import { UPDATE_QUEUE_GROUP, INSERT_QUEUE, UPDATE_PLAYING_QUEUE_INDEX } from '../../scripts/mutation-types';

    import Queue from './TrackQueue';
    import RandomTrackQueue from './RandomTrackQueue';

    import draggable from 'vuedraggable';
    import tooltip from 'vue-strap/src/tooltip';

    import editableBox from '../editable-box';

    import config from "../../config";

    export default {
        components: {
            draggable,
            tooltip,
            editableBox
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
                RandomTrackQueue
            }
        },

        computed: {
            queues: {
                get() {
                    return this.queueGroup.get();
                },
                set(queues) {
                    this[UPDATE_QUEUE_GROUP]({ queues });
                }
            },

            activeIndex: {
                get() {
                    return this.queueGroup.activeIndex;
                },
                set(activeIndex) {
                    this[UPDATE_QUEUE_GROUP]({ activeIndex });
                }
            },

            playingIndex: {
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
                queueGroup: (state) => state.queueModule.queueGroup,
                player: (state) => state.playerModule.playerController.player,
                preference: (state) => state.generalModule.preference || config.defaultPreference,
            })
        },
        methods: {
            insert(index) {
                this[INSERT_QUEUE]({
                    index,
                    queue: new Queue({ name: this.$t('New Playlist') })
                });
            },

            select(index) {
                const select = () => {
                    document.removeEventListener('click', select);
                    this.selectedIndex = index;
                };

                document.addEventListener('click', select);
            },

            onSort(e) {
                if (e.from === e.to) {
                    if (e.oldIndex === this.activeIndex) {
                        this.activeIndex = e.newIndex;
                    } else if (e.oldIndex > this.activeIndex && e.newIndex <= this.activeIndex) {
                        this.activeIndex++;
                    } else if (e.oldIndex < this.activeIndex && e.newIndex >= this.activeIndex) {
                        this.activeIndex--
                    }

                    if (e.oldIndex === this.playingIndex) {
                        this.playingIndex = e.newIndex;
                    } else if (e.oldIndex > this.playingIndex && e.newIndex <= this.playingIndex) {
                        this.playingIndex++;
                    } else if (e.oldIndex < this.playingIndex && e.newIndex >= this.playingIndex) {
                        this.playingIndex--;
                    }
                } else if (e.from !== e.to) {
//                    if (this.queueGroup.length === 0) {
//                        this.queueGroup.add(this.trashCan.data.splice(e.newIndex, 1)[0]);
//                    } else {
                        if (e.oldIndex < this.activeIndex || e.oldIndex === this.activeIndex && this.activeIndex === this.queues.length) {
                            this.activeIndex--;
                        }

                        if (e.oldIndex === this.playingIndex) {
                            this.player.unload();
                            this.playingIndex = null;
                        } else if (e.oldIndex < this.playingIndex) {
                            this.playingIndex--;
                        }
//                    }

                    this.trashCan.data.forEach((queue, index) => {
                        if (queue.constructor === RandomTrackQueue) {
                            this.queueGroup.add(this.trashCan.data.splice(index, 1)[0]);
                        }
                    });
                }
            },

            handleContextMenu(e, queue, index) {
                this.$emit('contextMenu', e, async type => {
                    if (type === 'open') {
                        this.activeIndex = index;
                    } else if (type === 'up') {
                        if (index > 0) {
                            this.$set(this.queues, index, this.queues[index - 1]);
                            this.$set(this.queues, index - 1, queue);
                            this.queues = this.queues;

                            if (this.activeIndex === index - 1) {
                                this.activeIndex++;
                            } else if (this.activeIndex === index) {
                                this.activeIndex--;
                            }

                            if (this.playingIndex === index - 1) {
                                this.playingIndex++;
                            } else if (this.playingIndex === index) {
                                this.playingIndex--;
                            }

                            if (this.selectedIndex === index - 1) {
                                this.selectedIndex++;
                            } else if (this.selectedIndex === index) {
                                this.selectedIndex--;
                            }
                        }
                    } else if (type === 'down') {
                        if (index + 1 < this.queues.length) {
                            this.$set(this.queues, index, this.queues[index + 1]);
                            this.$set(this.queues, index + 1, queue);
                            this.queues = this.queues;

                            if (this.activeIndex === index) {
                                this.activeIndex++;
                            } else if (this.activeIndex === index + 1) {
                                this.activeIndex--;
                            }

                            if (this.playingIndex === index) {
                                this.playingIndex++;
                            } else if (this.playingIndex === index + 1) {
                                this.playingIndex--;
                            }

                            if (this.selectedIndex === index) {
                                this.selectedIndex++;
                            } else if (this.selectedIndex === index + 1) {
                                this.selectedIndex--;
                            }
                        }
                    } else if (type === 'create') {
                        this.insert(typeof this.selectedIndex === 'number' ? this.selectedIndex + 1 : this.queueGroup.length);
                    } else if (type === 'remove') {
                        try {
                            await this.$confirm({
                                title: this.$t('Confirm'),
                                bodyText: this.$t('Remove the playlist?'),
                                confirmText: this.$t('Confirm'),
                                cancelText: this.$t('Cancel')
                            });


                            this.queues = this.queues.slice(0, index).concat(this.queues.slice(index + 1));
                            trashCan.data.push(queue);
                        } catch (e) { }
                    }
                });
            },

            fixDrag() {
                const el = document.querySelector('.sortable-fallback');

                if (el) {
                    el.style.width = this.$refs.playlists[0].offsetWidth;
                }
            },

            unSelect() {
                this.selectedIndex = null;
            },

            ...mapMutations([
                INSERT_QUEUE,
                UPDATE_QUEUE_GROUP,
                UPDATE_PLAYING_QUEUE_INDEX
            ])
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
    .playlist-pane {
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
        }

        tr {
            cursor: default;

            &.active-queue {
                background-color: rgba(0, 0, 0, .3);
            }

            svg {
                width: 18px;
                height: 18px;
                margin-top: 1px;
                fill: #fff;
            }

            .drag-handle {
                width: 28px;
                text-align: center;
                cursor: move;
                cursor: -webkit-grab;
            }
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

            tr {
                &.active-queue {
                    background-color: rgb(30, 30, 30);
                }
            }
        }
    }
</style>
