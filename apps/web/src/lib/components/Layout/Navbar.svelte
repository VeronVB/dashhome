<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import { Search, Plus, Settings, Menu, X, Palette } from 'lucide-svelte';
  import { openAddWidgetModal } from '$lib/stores/ui'; // Import ze stora UI
  import { sidebarOpen, toggleSidebar } from '$lib/stores/sidebar';
  import { theme, setTheme, type Theme } from '$lib/stores/theme';
  import { browser } from '$app/environment';

  export let showSearch = true;
  export let showAddWidget = true;
  export let centerContent: string = '';

  const dispatch = createEventDispatcher();

  let searchQuery = '';
  let themeDropdownOpen = false;

  $: currentTheme = $theme;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      dispatch('search', searchQuery);
    }
  };

  // POZOSTAWIONO TYLKO JEDNĄ WERSJĘ:
  const handleAddWidget = () => {
    openAddWidgetModal();
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    themeDropdownOpen = false;
  };

  const themeOptions: { value: Theme; label: string; icon: string }[] = [
    { value: 'blue', label: 'Niebieski', icon: '🟦' },
    { value: 'orange', label: 'Pomarańczowy', icon: '🟧' },
    { value: 'purple', label: 'Fioletowy', icon: '🟪' },
  ];

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.theme-dropdown')) {
      themeDropdownOpen = false;
    }
  };

  onMount(() => {
    if (browser && themeDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('click', handleClickOutside);
    }
  });

  $: if (browser) {
    if (themeDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
  }
</script>

<nav class="navbar">
  <div class="navbar-left">
    <button
      class="hamburger-btn"
      on:click={toggleSidebar}
      aria-label="Toggle sidebar"
      aria-expanded={$sidebarOpen}
    >
      {#if $sidebarOpen}
        <X size={20} />
      {:else}
        <Menu size={20} />
      {/if}
    </button>

    {#if showSearch}
      <div class="search-container">
        <Search size={18} />
        <input
          type="text"
          bind:value={searchQuery}
          on:keydown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Szukaj..."
          class="search-input"
        />
      </div>
    {/if}
  </div>

  <div class="navbar-center">
    {#if centerContent}
      <span class="center-content">{centerContent}</span>
    {/if}
  </div>

  <div class="navbar-right">
    {#if showAddWidget}
      <button
        class="add-widget-btn"
        on:click={handleAddWidget}
        aria-label="Add widget"
      >
        <Plus size={20} />
        <span class="btn-text">Dodaj widget</span>
      </button>
    {/if}

    <div class="theme-dropdown">
      <button
        class="theme-btn"
        on:click={() => themeDropdownOpen = !themeDropdownOpen}
        aria-label="Change theme"
        aria-expanded={themeDropdownOpen}
      >
        <Palette size={20} />
      </button>

      {#if themeDropdownOpen}
        <div class="dropdown-menu">
          {#each themeOptions as option}
            <button
              class="dropdown-item"
              class:active={option.value === currentTheme}
              on:click={() => handleThemeChange(option.value)}
            >
              <span class="theme-icon">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <button
      class="settings-btn"
      on:click={() => browser && (window.location.href = '/settings')}
      aria-label="Settings"
    >
      <Settings size={20} />
    </button>
  </div>
</nav>

<style>
  .navbar {
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: rgba(10, 10, 15, 0.8);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
    gap: 1rem;
  }

  .navbar-left,
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .navbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
    min-width: 0;
  }

  .center-content {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hamburger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .hamburger-btn:hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
  }

  .search-container {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 400px;
    width: 100%;
  }

  .search-container :global(svg) {
    position: absolute;
    left: 0.75rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all var(--transition-fast);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--accent-secondary);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .add-widget-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: var(--accent-primary);
    color: var(--bg-primary);
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .add-widget-btn:hover {
    background-color: var(--accent-primary);
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: var(--shadow-glow);
  }

  .btn-text {
    @media (max-width: 640px) {
      display: none;
    }
  }

  .theme-dropdown {
    position: relative;
  }

  .theme-btn,
  .settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .theme-btn:hover,
  .settings-btn:hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background-color: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 0.25rem;
    min-width: 150px;
    box-shadow: var(--shadow-lg);
    z-index: 1001;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    transition: all var(--transition-fast);
  }

  .dropdown-item:hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
  }

  .dropdown-item.active {
    color: var(--accent-primary);
    background-color: var(--accent-secondary);
  }

  .theme-icon {
    font-size: 1rem;
  }

  @media (max-width: 640px) {
    .navbar {
      padding: 0.75rem 1rem;
    }

    .search-container {
      max-width: 200px;
    }

    .navbar-center {
      display: none;
    }
  }
</style>