import { DirectiveBinding } from "vue/types/options";

import IDirective from "./IDirective";

export default abstract class implements IDirective {
    public abstract bind(el: HTMLElement, binding: DirectiveBinding): void;
    public abstract update(el: HTMLElement, binding: DirectiveBinding): void;
    public abstract unbind(el: HTMLElement): void;

    public getDirectiveOptions() {
        return {
            bind: (el: HTMLElement, binding: DirectiveBinding) => this.bind(el, binding),
            unbind: (el: HTMLElement) => this.unbind(el),
            update: (el: HTMLElement, binding: DirectiveBinding) => this.update(el, binding),
        };
    }
}
