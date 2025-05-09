<div
    style="height: 100%;"
    bind:this={divContainerEl}
    class={gridClass ?? "ag-theme-quartz"}
></div>

<script lang="ts" generics="TData">
    import {
        type GridOptions,
        type Module,
        type GridApi,
        type GridParams,
        type GridTheme,
        createGrid,
    } from "@ag-grid-community/core";

    import { onMount } from "svelte";
    import SvelteFrameworkOverrides from "./SvelteFrameworkOverrides.svelte.ts";

    interface Props {
        initialOptions: GridOptions<TData>;
        updateOptions?: Omit<GridOptions<TData>, "getRowId">;
        /**
         * Include a id property on row objects you pass to this or a getRowId() function
         * to initialOptions.
         */
        rowData?: TData[];
        modules?: Module[];
        gridClass?: string;
        quickFilterText?: string;
        sizeColumnsToFit?: boolean;
        theme?: GridTheme;
    }

    let {
        initialOptions,
        updateOptions,
        rowData,
        modules,
        gridClass,
        quickFilterText,
        sizeColumnsToFit = true,
    }: Props = $props();

    let api: GridApi<TData> | undefined = $state(undefined);
    let divContainerEl: HTMLDivElement | undefined = $state();

    const gridParams: GridParams = {
        modules: modules ?? [],
        frameworkOverrides: new SvelteFrameworkOverrides(),
    };

    // // Update on theme change
    // $effect(() => {
    //     api?.setGridOption("theme", theme);
    // });

    // Update grid on data change + init
    $effect(() => {
        api?.setGridOption("rowData", rowData);
        // if (sizeColumnsToFit) api?.sizeColumnsToFit();
    });

    $effect(() => {
        if (updateOptions) {
            api?.updateGridOptions({ ...updateOptions });
        }
    });

    $effect(() => {
        if (quickFilterText !== undefined) {
            api?.setGridOption("quickFilterText", quickFilterText);
        }
    });

    onMount(() => {
        api = createGrid(divContainerEl!, initialOptions, gridParams);
        if (sizeColumnsToFit) api.sizeColumnsToFit();

        return () => {
            api?.destroy();
        };
    });
</script>
