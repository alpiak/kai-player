<template lang="pug">
    .app(
        :style="{ backgroundImage: `url(${backgroundImage})` }"
        :class="{ 'performance-factor-max-3': performanceFactor < .3 }"
    )
        banner
        control-bar(@toggleSettingsModal="showSettings = !showSettings;")
        template(v-if="layout")
            transition(name="fade")
                pane-frame(
                    v-if="picturePanelOpen"
                    v-model="pictureLayout"
                    @close="picturePanelOpen = false;"
                )
                    template(v-slot:heading)
                        svg(
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                        )
                            path(d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z")
                        span &nbsp;{{ $t('Artwork') }}
                    picturePane
            transition(name="fade")
                pane-frame(
                    v-if="renderSourcePanel"
                    v-show="sourcePanelOpen"
                    v-model="sourceLayout"
                    @close="sourcePanelOpen = false;"
                )
                    template(v-slot:heading)
                        svg(
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                        )
                            path(d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z")
                        span &nbsp;{{ $t('Media Source') }}
                    sourcePane
            transition(name="fade")
                pane-frame(
                    v-if="renderListPanel"
                    v-show="listPanelOpen"
                    v-model="listLayout"
                    @close="listPanelOpen = false;"
                )
                    template(v-slot:heading)
                        svg(
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                        )
                            path(d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z")
                        span &nbsp;{{ $t('Chart') }}
                    listPane(@contextMenu="handleContextMenu")
            transition(name="fade")
                pane-frame(
                    v-if="renderSearchPanel"
                    v-show="searchPanelOpen"
                    v-model="searchLayout"
                    @close="searchPanelOpen = false;"
                )
                    template(v-slot:heading)
                        svg(
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                        )
                            path(d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z")
                        span &nbsp;{{ $t('Search') }}
                    searchPane(@contextMenu="handleContextMenu")
            transition(name="fade")
                pane-frame(
                    v-if="renderPlaylistPanel"
                    v-show="playlistPanelOpen"
                    v-model="playlistLayout"
                    @close="playlistPanelOpen = false;"
                )
                    template(v-slot:heading)
                        svg(
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                        )
                            path(d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z")
                        span &nbsp;{{ $t('Playlist') }}
                    playlistPane(@contextMenu="(e, callback) => { playlistContextMenuCallback = callback; $refs.playlistContextMenu.open(e); }")
            transition(name="fade")
                pane-frame(
                    v-if="renderTracksPanel"
                    v-show="tracksPanelOpen"
                    v-model="tracksLayout"
                    @close="tracksPanelOpen = false;"
                )
                    template(v-slot:heading)
                        svg(
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                        )
                            use(xlink:href="#icon_mini-disc")
                        span &nbsp;{{ `${$t('Tracks')}(${queue && queue.name})` }}
                    tracksPane(@contextMenu="handleContextMenu")
        settings(
            v-if="renderSettings"
            v-model="showSettings"
        )
        modal(
            v-model="modalOpen"
            :large="modal.size === 'large'"
            :small="modal.size === 'small'"
            :title="$t(modal.title)"
            effect="zoom"
        )
            .modal-body(slot="modal-body")
                component(
                    :is="modal.component"
                    :input="modal.inputValue"
                    v-model="modalReturnValue"
                )
            .modal-footer(slot="modal-footer")
                button.btn.btn-sm(
                    v-for="button in modal.buttons"
                    :class="[`btn-${button.type}`]"
                    v-interact:tap="() => handleModalButtonClick(button)"
                    v-t="button.text"
                    type="button"
                )
        contextMenu(ref="playlistContextMenu")
            li(v-interact:tap="() => { playlistContextMenuCallback('open'); }") {{ $t('Select') }}
            li(v-interact:tap="() => { playlistContextMenuCallback('up'); }") {{ $t('Move up') }}
            li(v-interact:tap="() => { playlistContextMenuCallback('down'); }") {{ $t('Move down') }}
            li(v-interact:tap="() => { playlistContextMenuCallback('create'); }") {{ $t('New') }}
            li(v-interact:tap="() => { playlistContextMenuCallback('remove'); }") {{ $t('Remove') }}
        contextMenu(ref="contextMenu")
            template(v-for="(group, groupIndex) in contextMenuOptions")
                li(
                    v-for="option in group"
                    v-interact:tap="() => { option.callback(); }"
                    :style="option.width && option.width[$i18n.locale] && { width: `${option.width[$i18n.locale]}px` }"
                )
                    span(v-t="option.text")
                    template(v-if="option.moreAction") ...
                    svg(
                        v-if="option.icon"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    )
                        use(:xlink:href="'#icon_' + option.icon")
                li.divider(v-if="groupIndex < contextMenuOptions.length - 1")
        icons
</template>

<script>
    import { mapState, mapMutations, mapActions } from "vuex";

    import * as queryString from "querystring";
    import interact from "interactjs";

    import "../styles/app";

    import { INIT, INIT_PLAYER_MODULE, INIT_QUEUE_MODULE, FETCH_SOURCES } from "../scripts/action-types";
    import { UPDATE_QUEUE_GROUP, INSERT_QUEUE, UPDATE_QUEUE, UPDATE_PLAYING_QUEUE_INDEX, ADD_TRACK, UPDATE_ACTIVE_PANEL_INDEX, SET_MODE, LOAD_LAYOUT, SET_MODAL_OPEN, SET_MODAL_RETURN_VALUE, BACKGROUND_LOAD_RESOURCE } from "../scripts/mutation-types";

    import TrackQueue from './queue/TrackQueue';
    import RandomTrackQueue from './queue/RandomTrackQueue';

    import { getRecommendedTrack, createTrackFromTrackData, requestNetworkIdle } from "../scripts/utils";

    import contextMenu from 'vue-context-menu';

    import icons from "./icons";
    import loading from './loading';
    import error from './error';
    import banner from './banner';
    import controlBar from './control-bar';
    import paneFrame from './pane-frame';
    import modal from "vue-strap/src/modal";
    import selectQueue from "./select-queue";
    import share from "./queue/share";

    import config from "../config";

    const DESTROY_INSTANCE_TIMEOUT = 5 * 10000;

    const settingsComponentPromise = new Promise((resolve, reject) => {
        requestNetworkIdle(async () => {
            try {
                resolve(await import('./settings'));
            } catch (e) {
                reject(e);
            }
        });
    });

    let that;

    export default {
        components: {
            icons,
            loading,
            error,
            contextMenu,
            banner,
            controlBar,
            paneFrame,
            picturePane: () => ({
                component: import('./queue/picture-pane'),
                loading,
                error,
                timeout: 30000
            }),
            sourcePane: () => ({
                component: import('./source/source-pane'),
                loading,
                error,
                timeout: 30000
            }),
            searchPane: () => ({
                component: import('./source/search-pane'),
                loading,
                error,
                timeout: 30000
            }),
            listPane: () => ({
                component: import('./source/list-pane'),
                loading,
                error,
                timeout: 30000
            }),
            playlistPane: () => ({
                component: import('./queue/playlist-pane'),
                    loading,
                    error,
                    timeout: 30000
            }),
            tracksPane: () => ({
                component: import('./queue/tracks-pane'),
                    loading,
                    error,
                    timeout: 30000
            }),
            settings: () => ({
                component: settingsComponentPromise,
                loading,
                error,
                timeout: 30000,
            }),
            modal,
            selectQueue,
            share,
        },

        data() {
            that = this;

            return {
                showSettings: false,
                renderSettings: false,
                renderSettingsTimeout: undefined,
                showSelectQueueModal: false,
                contextMenuOptions: [],
                playlistContextMenuCallback: () => {},
                contextMenuCallback: () => {},
                renderSourcePanel: false,
                renderListPanel: false,
                renderSearchPanel: false,
                renderPlaylistPanel: false,
                renderTracksPanel: false,
                timeouts: new Map(),
            }
        },

        computed: {
            track() {
                return this.queue ? this.queue.get(this.queue.activeIndex) : null;
            },

            pictureLayout: {
                get() {
                    return this.layout.picture;
                },
                set(layout) {
                    this.saveLayout({
                        index: 'picture',
                        layout
                    });
                }
            },
            sourceLayout: {
                get() {
                    return this.layout.source;
                },
                set(layout) {
                    this.saveLayout({
                        index: 'source',
                        layout
                    });
                }
            },
            listLayout: {
                get() {
                    return this.layout.list;
                },
                set(layout) {
                    this.saveLayout({
                        index: 'list',
                        layout
                    });
                }
            },
            searchLayout: {
                get() {
                    return this.layout.search
                },
                set(layout) {
                    this.saveLayout({
                        index: 'search',
                        layout
                    });
                }
            },
            playlistLayout: {
                get() {
                    return this.layout.playlist;
                },
                set(layout) {
                    this.saveLayout({
                        index: 'playlist',
                        layout
                    });
                }
            },
            tracksLayout: {
                get() {
                    return this.layout.tracks;
                },
                set(layout) {
                    this.saveLayout({
                        index: 'tracks',
                        layout
                    });
                }
            },

            picturePanelOpen: {
                get() {
                    return this.layout && this.layout.picture.visible;
                },

                set(visible) {
                    const layout = this.layout.picture;

                    layout.visible = visible;

                    this.saveLayout({
                        index: 'picture',
                        layout
                    });
                }
            },

            sourcePanelOpen: {
                get() {
                    return this.layout && this.layout.source.visible;
                },

                set(visible) {
                    const layout = this.layout.source;

                    layout.visible = visible;

                    this.saveLayout({
                        index: 'source',
                        layout
                    });
                }
            },

            listPanelOpen: {
                get() {
                    return this.layout && this.layout.list.visible;
                },

                set(visible) {
                    const layout = this.layout.list;

                    layout.visible = visible;

                    this.saveLayout({
                        index: 'list',
                        layout
                    });
                }
            },

            searchPanelOpen: {
                get() {
                    return this.layout && this.layout.search.visible;
                },

                set(visible) {
                    const layout = this.layout.search;

                    layout.visible = visible;

                    this.saveLayout({
                        index: 'search',
                        layout
                    });
                }
            },

            playlistPanelOpen: {
                get() {
                    return this.layout && this.layout.playlist.visible;
                },

                set(visible) {
                    const layout = this.layout.playlist;

                    layout.visible = visible;

                    this.saveLayout({
                        index: 'playlist',
                        layout
                    });
                }
            },

            tracksPanelOpen: {
                get() {
                    return this.layout && this.layout.tracks.visible;
                },

                set(visible) {
                    const layout = this.layout.tracks;

                    layout.visible = visible;

                    this.saveLayout({
                        index: 'tracks',
                        layout
                    });
                }
            },

            modalOpen: {
                get() {
                    return this.modal.open;
                },

                set(open) {
                    this[SET_MODAL_OPEN](open);
                }
            },

            modalReturnValue: {
                get() {
                    return this.modal.returnValue;
                },

                set(returnValue) {
                    this[SET_MODAL_RETURN_VALUE](returnValue);
                }
            },

            queue() {
                return this.queueGroup.get(this.queueGroup.activeIndex || 0);
            },

            performanceFactor() {
                return this.preference.performanceFactor;
            },

            ...mapState({
                panels: state => state.generalModule.panels,
                lockActivePanelIndex: state => state.generalModule.activePanel.lock,
                player: state => state.playerModule.playerController.player,
                queueGroup: state => state.queueModule.queueGroup,
                background: state => state.visualizationModule._background,
                visualizer: state => state.visualizationModule._visualizer,
                mode: state => state.generalModule.mode,
                layout: state => state.generalModule.layout,
                modal: (state) => state.generalModule.modal,
                backgroundImage: (state) => state.generalModule.backgroundImage,
                preference: (state) => state.generalModule.preference || config.defaultPreference,
            })
        },

        methods: {
            blur() {
                if (!this.lockActivePanelIndex) {
                    this[UPDATE_ACTIVE_PANEL_INDEX](null);
                }
            },

            handleContextMenu(e, options) {
                this.contextMenuOptions = options;
                this.$refs.contextMenu.open(e);
            },

            handleModalButtonClick(button) {
                button.callback && button.callback(this.modalReturnValue);
                button.close && this[SET_MODAL_OPEN](false);
            },

            ...mapMutations([
                UPDATE_QUEUE_GROUP,
                INSERT_QUEUE,
                UPDATE_QUEUE,
                UPDATE_PLAYING_QUEUE_INDEX,
                ADD_TRACK,
                UPDATE_ACTIVE_PANEL_INDEX,
                SET_MODE,
                LOAD_LAYOUT,
                SET_MODAL_OPEN,
                SET_MODAL_RETURN_VALUE,
                BACKGROUND_LOAD_RESOURCE
            ]),

            ...mapActions([
                INIT,
                INIT_PLAYER_MODULE,
                INIT_QUEUE_MODULE,
                FETCH_SOURCES,
                'initVisualization',
                'loadLayout',
                'saveLayout',
            ]),
        },

        watch: {
            showSettings(showSettings) {
                if (this.renderSettingsTimeout) {
                    clearTimeout(this.renderSettingsTimeout);

                    delete this.renderSettingsTimeout;
                }

                if (showSettings === true) {
                    return this.renderSettings = true;
                } else if (showSettings === false) {
                    this.renderSettingsTimeout = setTimeout(() => {
                        delete this.renderSettingsTimeout;

                        this.renderSettings = false;
                    }, 2000);
                }
            },

            ...["sourcePanel", "listPanel", "searchPanel", "playlistPanel", "tracksPanel"].reduce((map, key) => {
                map[`${key}Open`] = (open) => {
                    const renderKey = `render${key.slice(0, 1).toUpperCase()}${key.slice(1)}`;

                    if (open !== true) {
                        return that.timeouts.set(key, setTimeout(() => {
                            that.timeouts.delete(key);
                            that[renderKey] = false;
                        }, DESTROY_INSTANCE_TIMEOUT));
                    }

                    that[renderKey] = true;

                    const timeout = that.timeouts.get(key);

                    if (timeout) {
                        clearTimeout(timeout);
                        that.timeouts.delete(key);
                    }
                };

                return map;
            }, {}),
        },

        async created() {
            this[INIT]();
            this[INIT_PLAYER_MODULE]();

            const initQueueModulePromise = this[INIT_QUEUE_MODULE]();
            const fetchSourcesPromise = this[FETCH_SOURCES]();
            const interactable = interact(document.body);

            if (this.visualizer) {
                interactable.on("tap", () => {
                    interactable.unset();

                    this.visualizer._clubber.context.resume();
                });
            } else {
                const unwatch = this.$watch("visualizer", () => {
                    if (this.visualizer) {
                        unwatch();

                        interactable.on("tap", () => {
                            interactable.unset();

                            this.visualizer._clubber.context.resume();
                        });
                    }
                });
            }

            await initQueueModulePromise;

            if (!this.queueGroup.length) {
                this[INSERT_QUEUE]({
                    index: 0,
                    queue: new TrackQueue({
                        name: this.$t("Temp Playlist")
                    })
                });

                this[INSERT_QUEUE]({
                    index: 0,
                    queue: new RandomTrackQueue({
                        name: this.$t('Listen Randomly')
                    })
                });

                this[UPDATE_QUEUE_GROUP]({ activeIndex: 1 });
                this[UPDATE_PLAYING_QUEUE_INDEX](1);
            }

            const queries = queryString.parse(window.location.search.replace(/^\s*\?/, ""));

            if (queries.track) {
                const activeQueueIndex = this.queueGroup.activeIndex;
                const track = createTrackFromTrackData(JSON.parse(queries.track));
                const queue = this.queueGroup.get(activeQueueIndex);

                const matchedIndex = queue.get().reduce((matchedIndex, existingTrack, index) => {
                    if (matchedIndex !== null) {
                        return matchedIndex;
                    }

                    if (existingTrack.id === track.id) {
                        return index;
                    }

                    return null;
                }, null);

                this[UPDATE_PLAYING_QUEUE_INDEX](activeQueueIndex);

                if (matchedIndex !== null) {
                    this[UPDATE_QUEUE]({
                        index: activeQueueIndex,
                        activeIndex: matchedIndex,
                    });
                } else {
                    this[ADD_TRACK]({
                        track,
                        queueIndex: activeQueueIndex,
                    });

                    this[UPDATE_QUEUE]({
                        index: activeQueueIndex,
                        activeIndex: this.queue.getLastIndex(),
                    });
                }

                delete queries.track;

                const newUrl = window.location.href.split("?")[0] + "?" + queryString.stringify(queries);

                if (window.history) {
                    history.replaceState({}, document.title, newUrl);
                } else {
                    window.location.href = newUrl;
                }
            }

            if (this.queue && !this.queue.length && this.queue.name === this.$t("Temp Playlist")) {
                const track = await (async () => {
                    while (true) {
                        try {
                            if (process.env.DEMO) {
                                return await getRecommendedTrack(null, [(await fetchSourcesPromise)[0]]);
                            }

                            return await getRecommendedTrack(null, (await fetchSourcesPromise).slice(1));
                        } catch (e) {
                            console.log(e);

                            await new Promise((resolve) => setTimeout(resolve, 200));
                        }
                    }
                })();

                this[ADD_TRACK]({ track });
                this[BACKGROUND_LOAD_RESOURCE]({ picture: track.picture });
            } else if (this.track) {
                this[BACKGROUND_LOAD_RESOURCE]({ picture: this.track.picture });
            }

            this.queueGroup.get().forEach(async (queue, i) => {
                if (queue.constructor === RandomTrackQueue && !queue.length) {
                    const track = await (async () => {
                        while (true) {
                            try {
                                return await getRecommendedTrack(null, await fetchSourcesPromise);
                            } catch (e) {
                                console.log(e);

                                await new Promise((resolve) => setTimeout(resolve, 200));
                            }
                        }
                    })();

                    this[ADD_TRACK]({
                        track,
                        queueIndex: i,
                    });
                }
            });
        },

        mounted() {
            this[SET_MODE](window.innerWidth < 600 ? "mobile" : "desktop");
            this.loadLayout({ mode: this.mode });
            document.body.addEventListener("click", this.blur);
            this.initVisualization(this.$el);

            ["sourcePanel", "listPanel", "searchPanel", "playlistPanel", "tracksPanel"].map((key) => {
                if (this[`${key}Open`] === true) {
                    this[`render${key.slice(0, 1).toUpperCase()}${key.slice(1)}`] = true;
                }
            });
        },

        destroyed() {
            document.body.removeEventListener('click', this.blur);
        }
    }
</script>

<style lang="scss" scoped>
    .app {
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        z-index: 1;
        user-select: none;
        -moz-user-select: none;

        ::-webkit-scrollbar {
            width: 5px;
        }

        ::-webkit-scrollbar-button {
            display: none;
        }

        ::-webkit-scrollbar-track {
            display: none;
        }

        ::-webkit-scrollbar-thumb {
            border-radius: 2px;
            background-color: #3e3e3e;
        }

        .ctx-menu-container {
            li {
                position: relative;
                padding: 0 10px 0 30px;
                font-size: 14px;

                &:hover {
                    background-color: #eee;
                }

                &:active {
                    background-color: #ddd;
                }

                &.divider {
                    margin: 5px;
                    border-bottom: solid #ddd 1px;
                }

                svg {
                    position: absolute;
                    left: 6px;
                    top: 3px;
                }
            }
        }

        svg {
            width: 16px;
            height: 16px;
            margin-top: -2px;
        }
    }


    /* Animation */

    .fade-enter-active {
        transition: opacity .3s cubic-bezier(.32,0,0,1);
    }

    .fade-leave-active {
        transition: opacity .3s cubic-bezier(.32,0,0,1);
    }

    .fade-enter, .fade-leave-active {
        opacity: 0 !important;
    }
</style>
