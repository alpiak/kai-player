import {DirectiveBinding, DirectiveOptions } from "vue/types/options";

export default interface IDirective {
    bind(el: HTMLElement, binding: DirectiveBinding): void;
    update(el: HTMLElement, binding: DirectiveBinding): void;
    unbind(el: HTMLElement): void;
    getDirectiveOptions(): DirectiveOptions;
}
