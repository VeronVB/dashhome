<!-- apps/web/src/lib/components/Grid/WidgetGrid.svelte -->

<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
  import { GridStack } from 'gridstack';
  import type { GridStackOptions, GridStackWidget, GridStackEvent } from 'gridstack';
  import 'gridstack/dist/gridstack.min.css';
  import { apiClient } from '$lib/api/client';
  import { widgets, setWidgets, updateWidget as updateWidgetStore } from '$lib/stores/widgets';
  import { sidebarOpen } from '$lib/stores/sidebar';
  import { browser } from '$app/environment';

  export let options: Partial<GridStackOptions> = {};
  export let editable = true;

  const dispatch = createEventDispatcher();
  let grid: GridStack | null = null;
  let gridElement: HTMLElement;
  let saveTimeout: any;
  let isInitialized = false; // ✅ Flag aby zapobiec race condition

  const defaultOptions: GridStackOptions = {
    cellHeight: 80,
    margin: 10,
    column: 12,
    minRow: 1,
    animate: true,
    float: true, // ✅ ZMIANA: false zapobiega auto-compacting podczas init
    disableOneColumnMode: true,
    acceptWidgets: true,
    dragIn: '.newWidget',
    resizable: { handles: 'se' },
    draggable: { handle: '.widget-drag-handle' },
    ...options,
  };

  /**
   * Obsługa zmian pozycji/rozmiaru przez GridStack
   */
  const handleChange = (event: GridStackEvent, items: GridStackWidget[]) => {
    if (!browser || !grid || !isInitialized) return;

    items.forEach(item => {
      const widget = $widgets.find(w => w.id === item.id);
      if (widget) {
        const updatedWidget = {
          ...widget,
          position: {
            x: item.x ?? widget.position.x,
            y: item.y ?? widget.position.y,
            w: item.w ?? widget.position.w,
            h: item.h ?? widget.position.h,
          },
        };
        updateWidgetStore(widget.id, updatedWidget);
      }
    });

    // Debounce zapisu do API (2 sekundy bezczynności)
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveWidgetLayout, 2000);

    dispatch('change', { items });
  };

  const saveWidgetLayout = async () => {
    try {
      // Zapisujemy pozycje wszystkich widgetów
      await Promise.all(
        $widgets.map(w => apiClient.updateWidget(w.id, { position: w.position }))
      );
    } catch (error) {
      console.error('Failed to save widget layout:', error);
    }
  };

  /**
   * Kluczowa funkcja: Synchronizacja DOM Svelte z GridStack
   */
  const syncWithGridStack = async () => {
    if (!grid) return;

    await tick(); // Czekamy na wyrenderowanie slotów przez Svelte

    // Znajdujemy wszystkie elementy z klasą .grid-stack-item, które nie są jeszcze zarządzane
    const items = gridElement.querySelectorAll('.grid-stack-item');
    
    grid.batchUpdate();
    items.forEach((el: any) => {
      if (!el.gridstackNode) {
        grid?.makeWidget(el);
      }
    });
    grid.commit();
  };

  /**
   * ✅ Wymuś przeliczenie GridStack po toggle sidebaru
   * TYLKO gdy już jest zainicjalizowany
   */
  $: if (browser && grid && isInitialized && $sidebarOpen !== undefined) {
    // Timeout żeby poczekać na animację CSS margin-left
    setTimeout(() => {
      if (!grid) return;
      
      // ❌ USUŃ compact() - powoduje minimalizację widgetów
      // grid.compact();
      
      // ✅ Tylko wymuszamy recalculate container width
      grid.cellWidth();
    }, 350);
  }

  onMount(async () => {
    if (!browser || !gridElement) return;

    // 1. Inicjalizacja instancji GridStack
    grid = GridStack.init(defaultOptions, gridElement);

    // 2. Pobranie danych z API (tylko jeśli store jest pusty)
    if ($widgets.length === 0) {
      try {
        const widgetList = await apiClient.getWidgets();
        setWidgets(widgetList);
      } catch (error) {
        console.error('Failed to load widgets:', error);
      }
    }

    // 3. Synchronizacja wyrenderowanych elementów
    await syncWithGridStack();

    // ✅ DOPIERO TERAZ włączamy event listener (po pełnej inicjalizacji)
    isInitialized = true;
    grid.on('change', handleChange);

    // Responsywność kolumn
    const updateColumnCount = () => {
      if (!grid) return;
      const width = window.innerWidth;
      grid.column(width < 641 ? 1 : width < 1025 ? 6 : 12);
    };

    window.addEventListener('resize', updateColumnCount);
    updateColumnCount();

    return () => {
      window.removeEventListener('resize', updateColumnCount);
      if (grid) {
        grid.off('change', handleChange);
        grid.destroy(false);
      }
    };
  });

  // Reaguj na zmiany w store (np. dodanie nowego widgetu przez modal)
  $: if (grid && $widgets && isInitialized) {
    syncWithGridStack();
  }
</script>

<div class="widget-grid-container">
  <div 
    bind:this={gridElement}
    class="grid-stack"
    class:editable={editable}
  >
    <slot />
  </div>
</div>

<style>
  .widget-grid-container {
    width: 100%;
    padding: 0.5rem;
  }

  .grid-stack {
    background-color: transparent;
    min-height: 200px;
    overflow: visible !important; 
  }

  /* --- STYLIZACJA CIENIA (PLACEHOLDERA) --- */
  
  /* Kontener cienia */
  :global(.grid-stack-item.grid-stack-placeholder) {
    opacity: 1 !important;
    z-index: 0 !important;
  }

  /* Wnętrze cienia - agresywne nadpisanie kolorów */
  :global(.grid-stack-item.grid-stack-placeholder > .grid-stack-item-content) {
    background-color: var(--accent-secondary) !important; /* Twoje tło akcentu */
    background-image: none !important;
    border: 2px dashed var(--accent-primary) !important;
    border-radius: var(--radius-lg) !important;
    opacity: 0.4 !important;
    box-shadow: none !important;
    visibility: visible !important;
  }

  /* Ukrywamy rzeczywistą zawartość widgetu wewnątrz cienia, by nie "prześwitywała" */
  :global(.grid-stack-placeholder > .grid-stack-item-content *) {
    visibility: hidden !important;
  }

 :global(.grid-stack-item-content) {
    background-color: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all var(--transition-fast);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  :global(.grid-stack-item-content:hover) {
    border-color: var(--border-hover);
  }

  :global(.grid-stack-item-removing) {
    opacity: 0.8;
    filter: blur(2px);
  }

  :global(.grid-stack-placeholder > .placeholder-content) {
    background-color: var(--accent-secondary);
    border: 2px dashed var(--accent-primary);
    border-radius: var(--radius-lg);
    box-shadow: 0 0 20px var(--accent-primary);
  }

  :global(.grid-stack > .grid-stack-item > .grid-stack-item-content) {
    inset: 0;
  }

  :global(.grid-stack > .grid-stack-item > .ui-resizable-handle) {
    filter: none;
  }

  :global(.ui-resizable-se) {
    width: 12px;
    height: 12px;
    background-color: var(--accent-primary);
    border-radius: 2px;
    cursor: se-resize;
  }

  /* Fix for drag shadow issue */
  :global(.grid-stack-item-dragging) {
    opacity: 0.9;
    z-index: 1000;
  }

  :global(.grid-stack-item-dragging > .grid-stack-item-content) {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    transform: rotate(2deg);
    transition: none;
  }

  :global(.grid-stack > .grid-stack-item.grid-stack-placeholder) {
    opacity: 1;
  }

  :global(.grid-stack > .grid-stack-item.grid-stack-placeholder > .grid-stack-item-content) {
    border: 2px dashed var(--accent-primary);
    background-color: var(--accent-secondary);
  }
  
  :global(.grid-stack-item > .grid-stack-item-content) {
    background-color: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    transition: border-color var(--transition-fast);
    overflow: hidden;
  }

  :global(.grid-stack-item > .grid-stack-item-content:hover) {
    border-color: var(--accent-primary);
  }

  :global(.ui-resizable-se) {
    filter: invert(1);
    z-index: 100 !important;
  }
</style>