<!-- apps/web/src/lib/components/Layout/Sidebar.svelte -->

<script lang="ts">
  import { page } from '$app/stores';
  import { 
    Home, Package, Server, ShieldCheck, 
    Download, FileText, Settings, User, 
    BarChart3, Terminal, X 
  } from 'lucide-svelte';
  import { sidebarOpen } from '$lib/stores/sidebar';
  import { editMode, toggleEditMode } from '$lib/stores/editMode';
  import { fade } from 'svelte/transition';

  interface NavItem {
    href: string;
    label: string;
    icon: any;
    category?: string;
  }

  const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/docker', label: 'Docker', icon: Package, category: 'System' },
    { href: '/proxmox', label: 'Proxmox', icon: Server, category: 'System' },
    { href: '/monitoring', label: 'Monitoring', icon: BarChart3, category: 'System' },
    { href: '/pihole', label: 'Pi-hole', icon: ShieldCheck, category: 'Network' },
    { href: '/qbittorrent', label: 'qBittorrent', icon: Download, category: 'Media' },
    { href: '/logs', label: 'Logs', icon: FileText, category: 'System' },
    { href: '/settings', label: 'Ustawienia', icon: Settings },
  ];

  const groupedItems = navItems.reduce((acc, item) => {
    const category = item.category || 'Main';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  $: isOpen = $sidebarOpen;

  const closeSidebar = () => {
    sidebarOpen.set(false);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeSidebar();
  };
</script>

<!-- Overlay tylko na mobile gdy otwarty -->
{#if isOpen && typeof window !== 'undefined' && window.innerWidth < 769}
  <div 
    class="sidebar-overlay"
    role="button"
    tabindex="0"
    on:click={closeSidebar}
    on:keydown={handleKeydown}
    transition:fade={{ duration: 200 }}
  />
{/if}

<aside 
  class="sidebar"
  class:open={isOpen}
>
  <div class="sidebar-header">
    <div class="logo">
      <Terminal size={24} />
      <h1>Dashboard</h1>
    </div>
  </div>

  <nav class="sidebar-nav">
    {#each Object.entries(groupedItems) as [category, items]}
      <div class="nav-section">
        {#if category !== 'Main'}
          <h3 class="nav-category">{category}</h3>
        {/if}
        <ul class="nav-list">
          {#each items as item}
            <li>
              <a
                href={item.href}
                class="nav-link"
                class:active={item.href === '/' 
                  ? $page.url.pathname === '/' 
                  : $page.url.pathname.startsWith(item.href)}
                aria-current={($page.url.pathname === item.href) ? 'page' : undefined}
                on:click={() => {
                  if (window.innerWidth < 769) closeSidebar();
                }}
              >
                <svelte:component this={item.icon} size={20} />
                <span>{item.label}</span>
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>
  <!-- Edit Mode Toggle -->
  <div class="edit-mode-section">
    <button 
      class="edit-mode-btn"
      on:click={toggleEditMode}
      class:active={$editMode}
    >
      <Edit3 size={20} />
      <span>{$editMode ? 'Wyłącz tryb edycji' : 'Włącz tryb edycji'}</span>
    </button>
  </div>

  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar"><User size={20} /></div>
      <div class="user-details">
        <span class="user-name">Michał</span>
        <span class="user-role">Administrator</span>
      </div>
    </div>
  </div>
</aside>

<style>
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    background-color: var(--bg-secondary);
    border-right: 1px solid var(--border);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    
    /* Zawsze ukryty domyślnie */
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
    
    /* ✅ KLUCZOWE: Sidebar nie blokuje GridStack gdy zamknięty */
    pointer-events: auto;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  /* Desktop: sidebar zawsze jako overlay (nie sticky) */
  @media (min-width: 769px) {
    .sidebar {
      position: fixed; /* ← overlay, nie sticky */
    }
    
    .close-btn {
      display: none;
    }
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--accent-primary);
  }

  .logo h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .close-btn:hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
  }

  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
  }

  .nav-section {
    margin-bottom: 1.5rem;
  }

  .nav-category {
    padding: 0 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .nav-list {
    list-style: none;
    padding: 0;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all var(--transition-fast);
    border-right: 3px solid transparent;
  }

  .nav-link:hover {
    color: var(--text-primary);
    background-color: var(--bg-hover);
  }

  .nav-link.active {
    color: var(--accent-primary);
    background-color: var(--accent-secondary);
    border-right-color: var(--accent-primary);
  }

  .nav-link :global(svg) {
    flex-shrink: 0;
  }

  .sidebar-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border);
    background-color: var(--bg-secondary);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background-color: var(--accent-primary);
    color: var(--bg-primary);
    border-radius: 50%;
  }

  .user-details {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .user-role {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
</style>