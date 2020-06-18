<template lang="pug">
    .pane-frame(
        :class="{ active: activePanelIndex === $el, 'performance-factor-max-4': performanceFactor < .4, 'performance-factor-max-2': performanceFactor < .2 }"
    )
        .panel.panel-default(
            :style="{ backgroundColor }"
            :class="{ hide: autoHide }"
        )
        .panel-heading(
            :class="{ hide: autoHide }"
            :style="{ backgroundPosition: performanceFactor >= .4 && (1 - ratioX + ratioY) * 50 + 10 + '% ' + '0' }"
        )
            div
                slot(name="heading")
        .control(
            v-if="activePanelIndex === $el"
            :class="{ hide: autoHide }"
        )
            .opacity-control
                vueSlider(
                    v-if="performanceFactor >= .2"
                    v-model="opacity"
                    :max="1"
                    :interval=".01"
                    tooltip="hover"
                    :stop-propagation="true"
                    :real-time="true"
                    :bg-style="{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }"
                    :slider-style="{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }"
                    :process-style="{ backgroundColor: 'rgba(255, 255, 255, 0.9)', filter: 'drop-shadow(2px 2px 10px rgba(150, 150, 150, 1))' }"
                    :tooltip-style="{ backgroundColor: 'rgba(255, 255, 255, 0.6)', 'border-color': 'rgba(255, 255, 255, 0.6)', 'border-style': 'none' }"
                )
            tooltip(
                v-if="interactable"
                v-interact:tap="() => lock = !lock"
                effect="fadein"
                placement="top"
                :content="lock ? $t('Unlock the panel') : $t('Lock the panel')"
            )
                svg(
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                )
                    path(
                        v-if="lock"
                        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                    )
                    path(
                        v-else
                        d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"
                    )
            svg(
                v-interact:tap="() => $emit('close')"
                width="21"
                height="21"
                viewBox="0 0 24 24"
            )
                path(d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z")
        .panel-body
            slot
</template>

<script>
    import { mapState, mapMutations } from 'vuex';

    import interact from 'interactjs';
    import { scaleLinear } from 'd3';

    import tooltip from 'vue-strap/src/tooltip';
    import vueSlider from 'vue-slider-component';

    import { UPDATE_ACTIVE_PANEL_INDEX, SET_ACTIVE_PANEL_INDEX_LOCK } from '../scripts/mutation-types';

    import config from "../config";

    const scale = scaleLinear()
            .domain([0, .5, 1])
            .range([0, .3, 1]);

    export default {
        props: {
            value: Object,
            heading: {
                type: String,
                default: 'Panel'
            },
        },

        components: {
            tooltip,
            vueSlider
        },

        data: () => {
            return {
                ratioX: 0,
                bottomY: 0, // distance between pane frame bottom and viewport bottom
                attach: false, // Whether attached to a side.
                opacity: 0,
                lock: false,
                autoHide: false,
                viewportWidth: 0,
                viewportHeight: 0,
                interactableInit: false,
                interactables: [],
                unwatchFunctions: [],
                active: false,
                unwatch: () => {},
            }
        },

        computed: {
            activePanelIndex: {
                get() {
                    if (this.$store.state.generalModule.activePanel.index !== this.$el) {
                        this.active = false;
                    }

                    return this.$store.state.generalModule.activePanel.index;
                },
                set(index) {
                    this[UPDATE_ACTIVE_PANEL_INDEX](index);
                }
            },

            backgroundColor() {
                const scaledOpacity = scale(this.opacity),
                    colorComponent = Math.round(15 / scaledOpacity);

                return 'rgba(' + colorComponent + ',' + colorComponent + ',' + colorComponent + ',' +  scaledOpacity + ')';
            },

            ratioY() {
                return this.bottomY / window.innerHeight;
            },

            performanceFactor() {
                return this.preference.performanceFactor;
            },

            interactable() {
                return this.performanceFactor >= .1;
            },

            ...mapState({
                preference: (state) => state.generalModule.preference || config.defaultPreference,
            }),
        },

        watch: {
            performanceFactor() {
                if (this.interactable && !this.interactableInit) {
                    this.initInteractable();
                } else if (!this.interactable && this.interactableInit) {
                    this.destroyInteractable();
                    interact(this.$el).on("down", this.activate);
                }
            }
        },

        methods: {
            initInteractable() {
                this.destroyInteractable();
                this.interactableInit = true;
                window.addEventListener('resize', this.handleWindowResize);

                const controlBarHeight = document.querySelector('#control-bar').offsetHeight;
                const panel = this.$el;

                panel.addEventListener("mousewheel", () => {
                    this.activate();
                });

                const interactable = interact(panel)
                    .on('down', () => {
                        this.activate();
                    })
                    .draggable({
                        enabled: !this.lock,
                        ignoreFrom: '.panel-body, .control',
                        restrict: {
                            restriction: 'parent',
                            endOnly: true
                        },
                        inertia: true,
                        onmove: e => {
                            const width = panel.offsetWidth;
                            const height = panel.offsetHeight;

                            // keep the dragged position in the data-x/data-y attributes
                            const x = (+panel.getAttribute('data-x') || 0) + e.dx;
                            const y = (+panel.getAttribute('data-y') || 0) + e.dy;

                            panel.style.transform = 'translate(' + x + 'px, ' + y + 'px)'; // translate the element

                            // update the posiion attributes
                            panel.setAttribute('data-x', x);
                            panel.setAttribute('data-y', y);

                            this.ratioX = (x + width / 2) / this.viewportWidth;
                            this.bottomY = this.viewportHeight - y - height;
                            this.saveLayout();
                        },
                        snap: {
                            targets: [
                                (x, y) => {
                                    if (this.value.mode !== 'leftTop') {
                                        const width = panel.offsetWidth,
                                            height = panel.offsetHeight;

                                        if (Math.abs(x) < 30) {
                                            this.attach = 'left';

                                            return { x: 0, y: y };
                                        } else if (this.attach === 'left') {
                                            this.attach = false;

                                            return;
                                        }

                                        if (Math.abs(x + width - this.viewportWidth) < 30) {
                                            this.attach = 'right';

                                            return { x: this.viewportWidth - width, y: y };
                                        } else if (this.attach === 'right') {
                                            this.attach = false;

                                            return;
                                        }

                                        if (Math.abs(y) < 30) {
                                            this.attach = 'top';

                                            return { x: x, y: 0 };
                                        } else if (this.attach === 'top') {
                                            this.attach = false;

                                            return;
                                        }

                                        if (Math.abs(y + height - this.viewportHeight - controlBarHeight) < 30) {
                                            this.attach = 'bottom';

                                            return { x: x, y: this.viewportHeight + controlBarHeight - height };
                                        } else if (this.attach === 'bottom') {
                                            this.attach = false;

                                            return;
                                        }

                                        this.saveLayout();
                                    }
                                }
                            ],
                            relativePoints: [
                                { x: 0, y: 0 } // snap relative to the element's top-left
                            ]
                        }
                    })

                    .resizable({
                        enabled: !this.lock,
                        ignoreFrom: '.panel-body, .control',
                        edges: { left: true, right: true, bottom: true, top: true },
                        restrictEdges: {
                            outer: 'parent',
                            endOnly: true
                        },
                        restrictSize: {
                            min: { width: 200, height: 150 }
                        },
                        inertia: true,
                        margin: 9
                    })
                    .on('resizemove', e => {
                        const width = panel.offsetWidth,
                            height = panel.offsetHeight;

                        let x = (parseFloat(panel.getAttribute('data-x')) || 0),
                            y = (parseFloat(panel.getAttribute('data-y')) || 0);

                        // update the element's style
                        panel.style.width = e.rect.width + 'px';
                        panel.style.height = e.rect.height + 'px';

                        // translate when resizing from top or left edges
                        x += e.deltaRect.left;
                        y += e.deltaRect.top;

                        panel.style.transform = 'translate(' + x + 'px,' + y + 'px)';

                        panel.setAttribute('data-x', x);
                        panel.setAttribute('data-y', y);

                        this.ratioX = (x + width / 2) / this.viewportWidth;
                        this.bottomY = this.viewportHeight - y - height;

                        this.saveLayout();
                    });

                this.unwatchFunctions.push(this.$watch('lock', lock => {
                    interactable.options.drag.enabled = !lock;
                    interactable.options.resize.enabled = !lock;
                }));

                this.interactables.push(interactable);
            },

            destroyInteractable() {
                this.interactableInit = false;
                this.unwatchFunctions.forEach((unwatch) => unwatch());
                this.unwatchFunctions = [];
                this.interactables.forEach((interactable) => interactable.unset());
                this.interactables = [];
                window.removeEventListener("resize", this.handleWindowResize);
            },

            saveLayout() {
                const panel = this.$el;

                if (panel.style.display !== 'none') {
                    const layout = {
                        mode: this.value.mode,
                        visible: this.value.visible,
                        attach: this.attach,
                        opacity: this.opacity,
                        lock: this.lock,
                        autoHide: this.autoHide
                    };

                    switch (this.value.mode) {
                        case 'ratio':
                            layout.width = panel.offsetWidth / this.viewportWidth;
                            layout.height = panel.offsetHeight / this.viewportHeight;
                            layout.x = +panel.getAttribute('data-x') / this.viewportWidth;
                            layout.y = +panel.getAttribute('data-y') / this.viewportHeight;

                            break;

                        case 'leftTop':
                            layout.width = panel.offsetWidth;
                            layout.height = panel.offsetHeight;
                            layout.x = +panel.getAttribute('data-x');
                            layout.y = +panel.getAttribute('data-y');

                            break;

                        case 'bottom':
                            layout.width = panel.offsetWidth;
                            layout.height = panel.offsetHeight;
                            layout.ratioX = (+panel.getAttribute('data-x') + layout.width / 2) / this.viewportWidth;
                            layout.bottomY = this.viewportHeight - panel.getAttribute('data-y') - layout.height;

                            break;
                    }

                    this.$emit('input', layout);
                }
            },

            handleWindowResize() {
                if (this.$el !== 'none') {
                    const controlBarHeight = document.querySelector('#control-bar').offsetHeight,
                            panel = this.$el,
                            width = panel.offsetWidth,
                            height = panel.offsetHeight;

                    this.viewportWidth = window.innerWidth;
                    this.viewportHeight = window.innerHeight - controlBarHeight;

                    let x, y;

                    if(this.value.mode === 'bottom') {
                        if (this.attach === 'left') {
                            x = 0;
                        } else if (this.attach === 'right') {
                            x = this.viewportWidth - width;
                        } else {
                            x = this.viewportWidth * this.ratioX - width / 2
                        }

                        if (this.attach === 'top') {
                            y = 0;
                        } else if (this.attach === 'bottom') {
                            y = this.viewportHeight - height;
                        } else {
                            y = this.viewportHeight - this.bottomY - height - 2;
                        }

                        panel.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                        panel.setAttribute('data-x', x);
                        panel.setAttribute('data-y', y);
                    }

                    this.saveLayout();
                }
            },

            activate() {
                if (this.active) {
                    return;
                }

                this.active = true;
                this.activePanelIndex = this.$el;
            },

            ...mapMutations([
                UPDATE_ACTIVE_PANEL_INDEX,
                SET_ACTIVE_PANEL_INDEX_LOCK
            ]),
        },

        async mounted() {
            this.attach = this.value.attach;
            this.opacity = this.value.opacity;
            this.lock = this.value.lock;
            this.autoHide = this.value.autoHide;

            const controlBarHeight = document.querySelector('#control-bar').offsetHeight;

            this.viewportWidth = window.innerWidth;
            this.viewportHeight = window.innerHeight - controlBarHeight;

            let x, y, width, height;

            switch (this.value.mode) {
                case 'ratio':
                    width = this.viewportWidth * this.value.width;
                    height = this.viewportHeight * this.value.height;

                    if (typeof this.value.x === 'number') {
                        x = this.viewportWidth * this.value.x;
                        this.ratioX = (x + width / 2) / this.viewportWidth;
                    }

                    if (typeof this.value.y === 'number') {
                        y = this.viewportHeight * this.value.y;
                        this.bottomY = this.viewportHeight - y - height;
                    }

                    break;

                case 'leftTop':
                    x = this.value.x;
                    y = this.value.y;
                    width = this.value.width;
                    height = this.value.height;

                    break;

                case 'bottom':
                    width = this.value.width;
                    height = this.value.height;

                    x = this.viewportWidth * this.value.ratioX - width / 2;
                    this.ratioX = typeof this.value.ratioX === 'number' ? this.value.ratioX : (x + this.value.width / 2) / this.viewportWidth;

                    y = this.viewportHeight - this.value.bottomY - height;
                    this.bottomY = typeof this.value.bottomY === 'number' ? this.value.bottomY : this.viewportHeight - this.value.y - this.value.height;

                    break;
            }

            if (this.attach === 'left') {
                x = 0;
            } else if (this.attach === 'right') {
                x = this.viewportWidth - width;
            }

            if (this.attach === 'top') {
                y = 0;
            } else if (this.attach === 'bottom') {
                y = this.viewportHeight - height + controlBarHeight;
            }

            const panel = this.$el;

            panel.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
            panel.setAttribute('data-x', x);
            panel.setAttribute('data-y', y);
            panel.style.width = width + 'px';
            panel.style.height = height + 'px';

            if (this.interactable) {
                this.initInteractable();
            } else {
                interact(this.$el).on("down", this.activate);
            }

            const activate = () => {
                document.removeEventListener('click', activate);
                this[SET_ACTIVE_PANEL_INDEX_LOCK](false);
            };

            // Block panel blur on root element when activating a panel.
            this.$el.addEventListener('click', () => {
                document.addEventListener('click', activate);
                this[SET_ACTIVE_PANEL_INDEX_LOCK](true);
            });

            let unwatch;
            let opacityChanging = false;
            let opacityUpdate = false;

            unwatch = this.$watch("opacity", () => {
                if (opacityChanging) {
                    opacityUpdate = true;

                    return;
                }

                opacityChanging = true;

                setTimeout(() => {
                    opacityChanging = false;

                    if (opacityUpdate) {
                        opacityUpdate = false;

                        this.saveLayout();
                    }
                }, 1000);

                this.saveLayout();
            });

            this.unwatch = () => {
                this.unwatch();
                unwatch();
            };

            unwatch = this.$watch("lock", () => {
                this.saveLayout();
            });

            this.unwatch = () => {
                this.unwatch();
                unwatch();
            };
        },

        destroyed() {
            this.unwatch();
            this.destroyInteractable();
        }
    }
</script>

<style lang="scss" scoped>
    .pane-frame {
        position: absolute;
        left: 0;
        top: 0;
        opacity: .9;
        z-index: 1;
        touch-action: none;

        .panel {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-image: linear-gradient(110deg, rgba(255, 255, 255, .2) 0%, rgba(255, 255, 255, 0) 5%),
            linear-gradient(110deg, rgba(255, 255, 255, 0) 95%, rgba(255, 255, 255, .1) 100%);
            background-size: 500px, 250px;
            background-position: 0 0, 100% 100%;
            background-repeat: no-repeat;
            box-shadow: inset 0 0 1px rgba(255, 255, 255, 0.5);
            z-index: -1;
        }

        & .hide {
            opacity: 0;
        }

        &:hover .hide {
            opacity: 1;
        }

        &.active {
             z-index: 2;
             opacity: 1;

            .panel {
                box-shadow: inset 0 0 1px rgba(255, 255, 255, 0.6),
                    0 0 60px 8px rgba(255, 255, 255, 0.1),
                    0 0 25px rgba(0, 0, 0, 0.1),
                    inset 0 0 20px rgba(255, 255, 255, 0.1);
            }
        }

        .panel-heading {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background-color: transparent;
            background-image: url(../assets/highlight.svg);
            background-size: auto 100%;
            background-repeat: no-repeat;
            transition: background-position .1s;
        }

        .control {
            display: flex;
            align-items: center;
            position: absolute;
            top: 2px;
            right: 6px;
            width: 50%;
            max-width: 200px;
            height: 25px;
            margin: 6px 0;

            .opacity-control {
                flex-grow: 1;

                .vue-slider-component {
                    opacity: .6;
                }
            }


            svg {
                fill: rgba(255, 255, 255, 0.3);
            }

            svg:hover  {
                fill: rgba(255, 255, 255, 0.6);
                -webkit-filter: drop-shadow(2px 2px 10px rgba(150, 150, 150, 1));
                filter: drop-shadow(2px 2px 10px rgba(150, 150, 150, 1));
                -ms-filter: "progid:DXImageTransform.Microsoft.Dropshadow(OffX=2, OffY=2, Color='rgba(150, 150, 150, 1)')";
                filter: "progid:DXImageTransform.Microsoft.Dropshadow(OffX=2, OffY=2, Color='rgba(150, 150, 150, 1)')";
            }
        }

        .panel-body {
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            width: auto;
            height: auto;
            margin: 42px 8px 8px;
            padding: 0;
            background-color: rgba(255, 255, 255, .1);
        }

        svg {
             vertical-align: middle;
        }

        &.performance-factor-max-4 {
            .panel-heading {
                background-image: none;
            }
        }

        &.performance-factor-max-2 {
            .panel {
                background: transparent none !important;
                border: 1px solid #3c3c3c;
                box-shadow: none;
            }

            .panel-body {
                background-color: #161616;
            }
        }
    }
</style>

<style lang="scss">
    .pane-frame {
        .panel-heading, td, input, select {
            color: rgba(255, 255, 255, .7);

            svg {
                width: 16px;
                height: 16px;
                margin-top: -2px;
                fill: rgba(255, 255, 255, .7);
            }
        }

        &.active {
            .panel-heading, td, input, select {
                color: #fff;

                svg {
                    fill: #fff;
                }
            }
        }
    }
</style>
