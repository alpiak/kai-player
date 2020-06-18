<template lang="pug">
    .banner
        .icons(
            v-if="showIcons && showSourceIcon"
            ref="icons"
            :style="{ opacity: iconOpacity }"
        )
            .icon(
                v-for="(source) in sources"
                v-if="!demo || source.demo"
                :style="{ width: iconWidth, paddingLeft: iconPadding, paddingRight: iconPadding }"
            )
                img(
                    :src="source.icons[0]"
                    :alt="source.name"
                    :title="source.name"
                )
        .links
            a.link(
                href="/"
                target="_blank"
            ) HOME
            span &nbsp;&nbsp;
            span |
            span &nbsp;&nbsp;
            a.link(
                href="https://github.com/bubblesoft/kai-player"
                target="_blank"
            ) GITHUB
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import { State } from "vuex-class";

    import SourceGroup from "./source/SourceGroup";

    import { requestNetworkIdle } from "../scripts/utils";

    import config from "../config";

    @Component
    export default class extends Vue {
        public $refs!: { icons: HTMLElement };
        @State((state) => state.generalModule.mode) private mode!: string;
        @State((state) => state.generalModule.preference || config.defaultPreference) private preference!: any;
        @State((state) => state.generalModule.showSourceIcon) private showSourceIcon!: boolean;
        @State((state) => state.sourceModule.sourceGroup) private sourceGroup!: SourceGroup;
        private showIcons = false;
        private demo = process.env.DEMO || false;

        private get sources() {
            return this.sourceGroup.get(undefined);
        }

        private get iconWidth() {
            const iconsRef = this.$refs.icons;

            if (!iconsRef) {
                return 100 / this.sources.length + "%";
            }

            const maxIconWidth = 24;

            return Math.min(iconsRef.offsetWidth / this.sources.length, maxIconWidth + this.iconPaddingInPixel * 2) + "px";
        }

        private get iconPadding() {
            if (!this.$refs.icons) {
                return 100 / this.sources.length * .18 + "%";
            }

            return this.iconPaddingInPixel + "px";
        }

        private get iconPaddingInPixel() {
            if (!this.$refs.icons) {
                return 0;
            }

            return this.$refs.icons.offsetWidth / this.sources.length * .18;
        }

        private get iconOpacity() {
            if (this.mode === "mobile" && this.performanceFactor >= .6) {
                return .6;
            }

            return "initial";
        }

        private get performanceFactor() {
            return this.preference.performanceFactor;
        }

        private created() {
            requestNetworkIdle(() => {
                this.showIcons = true;
            });
        }
    }
</script>

<style lang="scss" scoped>
    .banner {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        padding: 20px;

        @media (max-width: 768px) {
            padding: 9px 16px;
        }

        @media (max-width: 372px) {
            padding: 9px 12px;
        }

        .icons {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            width: 35%;

            @media (max-width: 768px) {
                flex-grow: 1;
                width: auto;
            }

            .icon {
                flex-shrink: 1;

                img {
                    width: 100%;
                    height: auto;
                    vertical-align: baseline;
                }
            }
        }

        .links {
            margin-left: 20px;

            @media (max-width: 768px) {
                margin-left: 16px;
            }

            @media (max-width: 372px) {
                margin-left: 12px;
            }

            .link {
                margin: 0;
                color: #fff;
                text-shadow: 0 0 20px #969696;
            }
        }
    }
</style>
