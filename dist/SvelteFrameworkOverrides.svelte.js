import { AgPromise, } from "@ag-grid-community/core";
export default class SvelteFrameworkOverrides {
    setInterval(action, interval) {
        return new AgPromise((resolve) => {
            const id = window.setInterval(action, interval);
            resolve(id);
        });
    }
    addEventListener(element, type, listener, options) {
        element.addEventListener(type, listener, options);
    }
    wrapIncoming = (callback, source) => {
        // Implement any specific logic needed for incoming callbacks
        return callback();
    };
    wrapOutgoing = (callback) => {
        // Implement any specific logic needed for outgoing callbacks
        return callback();
    };
    shouldWrapOutgoing = false;
    frameworkComponent(name, components) {
        // Implement logic to return the framework component
        if (components && components[name]) {
            return components[name];
        }
    }
    renderingEngine = "vanilla";
    getDocLink(path) {
        const baseUrl = "https://www.npmjs.com/package/ag-grid-svelte5";
        return path ? `${baseUrl}/${path}` : baseUrl;
    }
    getLockOnRefresh() {
        // Implement logic to lock on refresh if needed
        //console.log('Lock on refresh acquired');
    }
    releaseLockOnRefresh() {
        // Implement logic to release lock on refresh if needed
        //console.log('Lock on refresh released');
    }
    runWhenReadyAsync() {
        // Implement logic to determine if async operations should run when ready
        return true;
    }
    isFrameworkComponent(comp) {
        // Implement logic to determine if the component is a framework component
        return !!comp && typeof comp === "object" && "render" in comp;
    }
}
