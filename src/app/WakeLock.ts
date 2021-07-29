import IWakeLock from "./IWakeLock";

import { initHowlOnProgress } from "../scripts/utils";

export default class WakeLock implements IWakeLock {
    private static SILENT_SOUND_FILE = require("../assets/silence.ogg");

    public get enabled() {
        if (!this.silentSound) {
            return false;
        }

        if (this.silentSound.playing()) {
            return true;
        }

        if (this.silentSound.state() === "loading") {
            return true;
        }

        if (this.silentSound.state() === "unloaded") {
            return false;
        }

        return false;
    }

    private silentSound?: Howl;

    public async enable(timeout?: number) {
        if (this.enabled) {
            return;
        }

        if (!this.silentSound) {
            this.silentSound = new Howl({
                format: ["ogg", "mp3"],
                html5: true,
                loop: true,
                mute: true,
                src: WakeLock.SILENT_SOUND_FILE,
                volume: 0,
            });
        }

        return await new Promise<void>((resolve, reject) => {
            if (!this.silentSound) {
                return reject();
            }

            if (typeof timeout === "number") {
                setTimeout(reject, timeout);
            }

            this.silentSound.once("playerror", () => {
                reject();
            });

            this.silentSound.once("loaderror", () => {
                reject();
            });

            this.silentSound.once("load", () => {
                if (!this.silentSound) {
                    return reject();
                }

                initHowlOnProgress(this.silentSound);

                this.silentSound.once("progress", () => {
                    resolve();
                });

                this.silentSound.play();
            });
        });
    }

    public async disable() {
        if (!this.enabled) {
            return;
        }

        if (!this.silentSound) {
            throw new Error("Wake lock is not on.");
        }

        if (this.silentSound.state() === "loading") {
            this.silentSound.unload();
        } else {
            this.silentSound.stop();
        }
    }

    public destroy() {
        if (this.silentSound) {
            try {
                this.silentSound.unload();
            } catch (e) {
                // console.log(e);
            }

            delete this.silentSound;
        }
    }
}
