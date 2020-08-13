/**
 * Created by qhyang on 2017/12/1.
 */

import Promise from "promise-polyfill";

import Vue from 'vue';

import VTooltip from "v-tooltip";
import VueConfirm from '../scripts/vue-confirm';

import { i18n } from "./i18n";
import { requestNetworkIdle } from "../scripts/utils";

import InteractDirective from "./directives/InteractDirective";

import container from "./container";

import "../styles/bootstrap";
import "../styles/main";
import "../styles/v-tooltip";
import "../styles/pretty-checkbox";

Vue.use(VTooltip);
Vue.use(VueConfirm);

if (!window["Promise"]) {
    window["Promise"] = Promise;
}

(async () => {
    if (!window["Promise"]["any"]) {
        const any = (await import("promise.any")).default;

        any.shim();
    }

    if (!window["Promise"]["allSettled"]) {
        const allSettled = (await import("promise.allsettled")).default;

        allSettled.shim();
    }

    if (!window["fetch"]) {
        await import("whatwg-fetch");
    }

    if (!window["AbortController"]) {
        await import("abortcontroller-polyfill/dist/polyfill-patch-fetch");
    }

    if (!window["URL"]) {
        await import("url-polyfill");
    }

    if (!window["btoa"]) {
        window["btoa"] = (await import("abab")).btoa;
    }

    if (!window.navigator["clipboard"]) {
        window.navigator["clipboard"] = (await import("clipboard-polyfill")).default;
    }

    if (!window.location["origin"]) {
        window.location.origin = window.location.protocol + "//" + window.location.hostname +
            (window.location.port ? ":" + window.location.port: "");
    }

    const registerServiceWorkerPromise = (async() => {
        if ("serviceWorker" in navigator) {
            if (process.env.NODE_ENV === "development") {
                return;
            }

            try {
                (await import("serviceworker-webpack-plugin/lib/runtime")).register();

                window["serviceWorkerEnabled"] = true;
            } catch (err) {
                console.log(err);
            }
        }
    })();

    Vue.directive("interact", new InteractDirective().getDirectiveOptions());

    const lastLocale = localStorage.getItem("kaiplayerlocale");
    const locale = lastLocale || window.navigator.language || "en-US";

    const initLocale = async () => {
        const { loadLocale } = await import("./i18n");

        loadLocale(locale);
    };

    if (!lastLocale) {
        (async () => {
            const retryTimes = 3;

            let retriedTimes = 0;

            while (true) {
                if (retriedTimes >= retryTimes) {
                    break;
                }

                try {
                    await initLocale();

                    break;
                } catch (e) {
                    console.log(e);

                    retriedTimes++;
                }
            }
        })();
    }

    (async () => {
        await registerServiceWorkerPromise;

        requestNetworkIdle(async () => {
            const retryTimes = 10;

            let retriedTimes = 0;

            while (true) {
                if (retriedTimes >= retryTimes) {
                    break;
                }

                try {
                    await initLocale();

                    break;
                } catch (e) {
                    console.log(e);

                    retriedTimes++;

                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
        }, 1000 * 10);
    })();

    const store = (await import('./store')).default;

    new Vue({
        el: 'app',
        store,
        i18n,
        render: (createElement) => createElement(container),
    });
})();
