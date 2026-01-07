import { writable } from 'svelte/store';

export const showAddWidgetModal = writable(false);

export const openAddWidgetModal = () => showAddWidgetModal.set(true);
export const closeAddWidgetModal = () => showAddWidgetModal.set(false);