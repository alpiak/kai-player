import * as interact from "interactjs";
import { DirectiveBinding } from "vue/types/options";

import IDirective from "../IDirective";

import Directive from "../Directive";

export default class InteractDirective extends Directive implements IDirective {
    private interactables: interact.Interactable[] = [];
    private bindingValues: any[] = [];

    public bind(el: HTMLElement, binding: DirectiveBinding) {
        const interactable = interact(el);

        el.dataset.interactable = (this.interactables.push(interactable) - 1).toString();

        const bindingValueIndex = this.bindingValues.push(binding.value) - 1;

        el.dataset.bindingValue = bindingValueIndex.toString();

        switch (binding.arg) {
            case "doubletap":
                interactable.on("doubletap", (e) => {
                    this.bindingValues[bindingValueIndex](e);
                    e.preventDefault();
                });

                break;

            case "tap":
            default:
                interactable.on("tap", (e) => {
                    this.bindingValues[bindingValueIndex](e);
                    e.preventDefault();
                });
        }
    }

    public update(el: HTMLElement, binding: DirectiveBinding) {
        if (binding.value === binding.oldValue) {
            return;
        }

        if (!el.dataset.bindingValue) {
            this.unbind(el);
            this.bind(el, binding);

            return;
        }

        const bindingValueIndex = +el.dataset.bindingValue;

        this.bindingValues[bindingValueIndex] = binding.value;
    }

    public unbind(el: HTMLElement) {
        if (!el.dataset.interactable) {
            return;
        }

        if (el.dataset.interactable && this.interactables[+el.dataset.interactable]) {
            // @ts-ignore
            this.interactables[+el.dataset.interactable].unset();
            delete this.interactables[+el.dataset.interactable];
        }

        if (el.dataset.bindingValue && this.bindingValues[+el.dataset.bindingValue]) {
            delete this.bindingValues[+el.dataset.bindingValue];
        }
    }
}
