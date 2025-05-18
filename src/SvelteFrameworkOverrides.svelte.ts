import {
  AgPromise,
  type FrameworkOverridesIncomingSource,
  type IFrameworkOverrides,
} from '@ag-grid-community/core';

export default class SvelteFrameworkOverrides implements IFrameworkOverrides {
  setInterval(action: () => void, interval?: number): AgPromise<number> {
    return new AgPromise<number>((resolve) => {
      const id = window.setInterval(action, interval);
      resolve(id);
    });
  }

  addEventListener(
    element: HTMLElement,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(type, listener, options);
  }

  wrapIncoming: <T>(callback: () => T, source?: FrameworkOverridesIncomingSource) => T = (
    callback /* source */
  ) => {
    // Implement any specific logic needed for incoming callbacks
    return callback();
  };

  wrapOutgoing: <T>(callback: () => T) => T = (callback) => {
    // Implement any specific logic needed for outgoing callbacks
    return callback();
  };

  shouldWrapOutgoing?: boolean = false;

  frameworkComponent(name: string, components?: Record<string, unknown>) {
    // Implement logic to return the framework component
    return components?.[name];
  }

  renderingEngine: 'vanilla' | 'react' = 'vanilla';

  getDocLink(path?: string): string {
    const baseUrl = 'https://www.npmjs.com/package/ag-grid-svelte5';
    return path ? `${baseUrl}/${path}` : baseUrl;
  }

  getLockOnRefresh?(): void {
    // Implement logic to lock on refresh if needed
    //console.log('Lock on refresh acquired');
  }

  releaseLockOnRefresh?(): void {
    // Implement logic to release lock on refresh if needed
    //console.log('Lock on refresh released');
  }

  runWhenReadyAsync?(): boolean {
    // Implement logic to determine if async operations should run when ready
    return true;
  }

  isFrameworkComponent(comp: unknown): boolean {
    // Implement logic to determine if the component is a framework component
    return !!comp && typeof comp === 'object' && true;}
}
