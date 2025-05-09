import { mount, unmount } from "svelte";
export default function makeSvelteCellRenderer(RenderingComponent, containerDivClass) {
    //
    return class SvelteCellRenderer {
        element = undefined;
        component = undefined;
        props = $state(undefined);
        init(params) {
            this.element = document.createElement("div");
            if (containerDivClass) {
                this.element.classList.add(containerDivClass);
            }
            this.props = params;
            this.component = mount(RenderingComponent, {
                target: this.element,
                props: this.props,
            });
        }
        getGui() {
            return this.element;
        }
        destroy() {
            if (this.component !== undefined) {
                unmount(this.component);
                this.element?.remove();
                this.component = undefined;
            }
        }
        refresh(params) {
            if (this.props === undefined) {
                return false;
            }
            try {
                Object.assign(this.props, params);
                return true;
            }
            catch (error) {
                console.error(error);
                return false;
            }
        }
    };
}
