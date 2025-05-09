import { AgPromise, type FrameworkOverridesIncomingSource, type IFrameworkOverrides } from "@ag-grid-community/core";
export default class SvelteFrameworkOverrides implements IFrameworkOverrides {
    setInterval(action: () => void, interval?: number): AgPromise<number>;
    addEventListener(element: HTMLElement, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    wrapIncoming: <T>(callback: () => T, source?: FrameworkOverridesIncomingSource) => T;
    wrapOutgoing: <T>(callback: () => T) => T;
    shouldWrapOutgoing?: boolean | undefined;
    frameworkComponent(name: string, components?: any): any;
    renderingEngine: "vanilla" | "react";
    getDocLink(path?: string): string;
    getLockOnRefresh?(): void;
    releaseLockOnRefresh?(): void;
    runWhenReadyAsync?(): boolean;
    isFrameworkComponent(comp: any): boolean;
}
