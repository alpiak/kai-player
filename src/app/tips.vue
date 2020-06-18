<template lang="pug">
    modal.settings(
        v-model="show"
        :title="$t('Tips')"
        effect="zoom"
    )
        .modal-body(slot="modal-body")
            table.table-condensed.table.table-hover
                tr(v-for="(tip, index) in tips")
                    td(style="width:28px; padding: 5px 10px 5px 0; text-align: right; vertical-align: top;") {{ index + 1 }}.
                    td(style="padding: 5px 0;") {{ $t(tip) }}
        .modal-footer(slot="modal-footer")
            button.btn.btn-default.btn-sm(
                v-interact:tap="close"
                type="button"
            ) {{ $t("Close") }}
</template>

<script lang="ts">
    import { Component, Prop, Vue } from "vue-property-decorator";

    import modal from "vue-strap/src/modal.vue";

    @Component({
        components: {
            modal,
        },
    })
    export default class extends Vue {
        @Prop(Boolean) private value!: boolean;

        get show() {
            return this.value;
        }

        set show(value) {
            this.$emit("input", value);
        }

        private tips = [
            "Drag-n-Drop fully supported.",
            "Select the \"Listen Randomly\" playlist to start playing random tracks pushed by the app.",
            "Pick up a visualization effect from the drop-down on the control bar (visualization may be inactive with slo" +
                "w network).",
            "Detailed preference settings available via the gear icon on the control bar.",
            "If the battery runs out fast on mobile devices, please adjust the power option under \"Settings\" (some chan" +
                "ges may require restarting the App for now).",
            "More features are under continuous development.",
        ];

        private close() {
            this.$emit("input", false);
        }
    }
</script>

<style lang="scss" scoped>
    .modal-body {
        @media (min-width: 600px) {
            padding-right: 75px;
            padding-left: 75px;
        }
    }
</style>
