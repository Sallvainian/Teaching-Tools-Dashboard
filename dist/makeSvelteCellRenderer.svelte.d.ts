import type { ICellRendererParams } from "@ag-grid-community/core";
import { type Component } from "svelte";
export default function makeSvelteCellRenderer(RenderingComponent: Component<ICellRendererParams>, containerDivClass?: string): {
    new (): {
        element: HTMLElement | undefined;
        component: Record<string, any> | undefined;
        props: ICellRendererParams | undefined;
        init(params: ICellRendererParams): void;
        getGui(): HTMLElement | undefined;
        destroy(): void;
        refresh(params: ICellRendererParams): boolean;
    };
};
