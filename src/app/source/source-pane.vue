<template lang="pug">
    .source-pane(v-if="sources.length")
        table.table-condensed.table.table-hover
            tbody
                tr(
                    v-for="(source) in sources"
                    v-if="!demo || source.demo"
                )
                    td
                        input(
                            v-model="source.active"
                            type="checkbox"
                        )
                    td
                        img(
                            :src="source.icons[0]"
                        )
                    td {{ source.name }}
    loading(v-else)
</template>

<script lang="ts">
    import { Component, Vue, Watch } from "vue-property-decorator";
    import { Mutation, State } from "vuex-class";

    import MutationFunction from "../MutationFunction";

    import Source from "./Source";
    import SourceGroup from "./SourceGroup";

    import { SET_SOURCES } from "../../scripts/mutation-types";

    import loading from "../loading";

    @Component({
        components: {
            loading,
        },
    })
    export default class extends Vue {
        @State((state) => state.sourceModule.sourceGroup) private sourceGroup!: SourceGroup;
        private sources: Source[] = [];
        private demo = process.env.DEMO || false;
        private unwatchFunctions: Array<() => void> = [];
        @Mutation(SET_SOURCES) private SET_SOURCES!: MutationFunction;

        private loadSources() {
            this.sources = this.sourceGroup.get();

            this.sources.forEach((source, i) => {
                this.unwatchFunctions.push(this.$watch(() => this.sources[i].active, (active) => {
                    this[SET_SOURCES]({ i, active });
                }));
            });
        }

        private unwatch() {
            this.unwatchFunctions.forEach((u) => u());
            this.unwatchFunctions = [];
        }

        private created() {
            if (this.sourceGroup.length) {
                this.loadSources();
            }
        }

        private destroyed() {
            this.unwatch();
        }

        @Watch("sourceGroup.length")
        private async onSourceGroupLengthChanged() {
            this.unwatch();
            this.loadSources();
        }
    }
</script>

<style lang="scss" scoped>
    .source-pane {
        height: 100%;
        overflow: auto;

        tr {
            cursor: default;

            img {
                vertical-align: top;
                width: 15px;
                height: 15px;
                margin-top: 2px;
            }
        }
    }

    .vue-loading {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }
</style>
