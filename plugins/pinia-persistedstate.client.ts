import { createPersistedState } from 'pinia-plugin-persistedstate';
import { PiniaPluginContext } from 'pinia';

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.$pinia.use(createPersistedState({
    storage: localStorage,
    key: state => `my-dashboard-${state.$id}`,
  }));
});

