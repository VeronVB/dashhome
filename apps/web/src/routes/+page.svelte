<!-- apps/web/src/routes/+page.svelte -->

<script lang="ts">
  import WidgetGrid from '$lib/components/Grid/WidgetGrid.svelte';
  import WidgetWrapper from '$lib/components/Grid/WidgetWrapper.svelte';
  import SystemStats from '$lib/widgets/SystemStats.svelte';
  
  // Importy globalnych storów
  import { showAddWidgetModal, closeAddWidgetModal, openAddWidgetModal } from '$lib/stores/ui';
  import { widgets } from '$lib/stores/widgets';
  import { sidebarOpen } from '$lib/stores/sidebar';
  
  import { apiClient } from '$lib/api/client';
  import { getWidgetDefinition } from '$lib/widgets/registry';
  import { Plus, X } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';

  // Debug: Log store changes
  $: console.log('Widgets store updated:', $widgets);

  // Mapowanie typów na komponenty
  const widgetComponents: Record<string, any> = {
    'system-stats': SystemStats,
    // Tutaj dodaj kolejne: 'docker-quick', 'pihole-stats' itp.
  };

  /**
   * Dodawanie nowego widgetu przez API i aktualizację stora
   */
  const handleAddWidget = async (type: string) => {
    try {
      const definition = getWidgetDefinition(type);
      if (!definition) {
        console.error('Widget definition not found for type:', type);
        return;
      }

      console.log('Creating widget of type:', type);

      const newWidget = await apiClient.createWidget({
        type: type as any,
        config: {},
        position: {
          x: 0,
          y: 0,
          w: definition.defaultSize.w,
          h: definition.defaultSize.h,
        },
      });

      console.log('Widget created from API:', newWidget);

      // Aktualizacja stora - WidgetGrid zareaguje na zmianę i doda go do siatki
      widgets.update(current => {
        const updated = [...current, newWidget];
        console.log('Store updated, new length:', updated.length);
        return updated;
      });
      
      closeAddWidgetModal();
    } catch (error) {
      console.error('Failed to add widget:', error);
      alert('Nie udało się dodać widgetu. Sprawdź konsolę.');
    }
  };

  /**
   * Usuwanie widgetu
   */
  const handleRemoveWidget = async (widget: any) => {
    if (!confirm('Czy na pewno chcesz usunąć ten widget?')) return;
    
    console.log('Deleting widget:', widget.id);
    
    try {
      await apiClient.deleteWidget(widget.id);
      console.log('Widget deleted from API');
      
      widgets.update(current => {
        const updated = current.filter(w => w.id !== widget.id);
        console.log('Store updated after delete, new length:', updated.length);
        return updated;
      });
    } catch (error) {
      console.error('Failed to remove widget:', error);
      alert('Nie udało się usunąć widgetu: ' + error.message);
    }
  };

  const handleWidgetSettings = (widget: any) => {
    console.log('Widget settings:', widget);
  };
</script>

<svelte:head>
  <title>Dashboard - Personal All-in-One</title>
</svelte:head>

<div class="dashboard-container" class:sidebar-open={$sidebarOpen}>
  <WidgetGrid>
    {#each $widgets as widget (widget.id)}
      <div 
        class="grid-stack-item"
        gs-id={widget.id}
        gs-x={widget.position.x}
        gs-y={widget.position.y}
        gs-w={widget.position.w}
        gs-h={widget.position.h}
      >
        <div class="grid-stack-item-content">
          <WidgetWrapper
            {widget}
            on:remove={(e) => handleRemoveWidget(e.detail)}
            on:settings={(e) => handleWidgetSettings(e.detail)}
          >
            {#if widgetComponents[widget.type]}
              <svelte:component 
                this={widgetComponents[widget.type]}
              />
            {:else}
              <div class="widget-placeholder">
                <div class="placeholder-icon">⚠️</div>
                <h4>{widget.type}</h4>
                <p>Brak komponentu widgetu.</p>
              </div>
            {/if}
          </WidgetWrapper>
        </div>
      </div>
    {/each}
  </WidgetGrid>

  {#if $showAddWidgetModal}
    <div class="modal-overlay" transition:fade={{ duration: 150 }} on:click|self={closeAddWidgetModal}>
      <div class="modal-content" transition:scale={{ duration: 200, start: 0.95 }}>
        <div class="modal-header">
          <h3>Dodaj nowy widget</h3>
          <button class="close-btn" on:click={closeAddWidgetModal}>
            <X size={20} />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="widget-options">
            {#each Object.entries(widgetComponents) as [type, _]}
              {@const definition = getWidgetDefinition(type)}
              {#if definition}
                <button class="widget-option" on:click={() => handleAddWidget(type)}>
                  <div class="widget-icon">{definition.icon}</div>
                  <div class="widget-info">
                    <h4>{definition.name}</h4>
                    <p>{definition.description}</p>
                  </div>
                </button>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <button class="floating-add-btn" on:click={openAddWidgetModal} aria-label="Dodaj widget">
    <Plus size={24} />
  </button>
</div>

<style>
  .dashboard-container {
    /*min-height: calc(100vh - 64px);*/
    width: 100%;
    position: relative;
    /* GridStack automatycznie dostosuje się do nowej szerokości */
  }

  /* Styl dla zawartości GridStack - ważne dla zachowania layoutu */
  :global(.grid-stack-item-content) {
    overflow: hidden !important;
  }

  .widget-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    text-align: center;
    padding: 1rem;
  }

  .placeholder-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
  }

  .modal-content {
    background-color: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    max-width: 500px;
    width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }

  .widget-options {
    display: grid;
    gap: 0.75rem;
  }

  .widget-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
    color: var(--text-primary);
  }

  .widget-option:hover {
    border-color: var(--accent-primary);
    background-color: var(--bg-hover);
    transform: translateY(-2px);
  }

  .widget-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .widget-info h4 {
    margin: 0 0 0.2rem 0;
    font-size: 1rem;
  }

  .widget-info p {
    color: var(--text-muted);
    margin: 0;
    font-size: 0.85rem;
  }

  .floating-add-btn {
    position: fixed;
    bottom: 3.5rem;
    right: 2rem;
    width: 56px;
    height: 56px;
    background-color: var(--accent-primary);
    color: var(--bg-primary);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
    z-index: 100;
  }

  .floating-add-btn:hover {
    transform: scale(1.1) rotate(90deg);
    filter: brightness(1.1);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
  }

  .close-btn:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
</style>