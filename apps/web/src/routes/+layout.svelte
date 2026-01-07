<!-- apps/web/src/routes/+layout.svelte -->

<script lang="ts">
  import '../app.css';
  import Navbar from '$lib/components/Layout/Navbar.svelte';
  import Sidebar from '$lib/components/Layout/Sidebar.svelte';
  import Footer from '$lib/components/Layout/Footer.svelte';
  import { sidebarOpen } from '$lib/stores/sidebar';
  import { page } from '$app/stores';

  $: if ($page.url.pathname && typeof window !== 'undefined' && window.innerWidth < 769) {
    sidebarOpen.set(false);
  }
</script>

<div class="app-layout" class:sidebar-open={$sidebarOpen}>
  <Navbar />
  <div class="main-container">
    <Sidebar />
    <main class="main-content">
      <slot />
    </main>
  </div>
  <Footer />
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background-color: var(--bg-primary);
  }

  .main-container {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .main-content {
    flex: 1;
    min-width: 0;
    padding: 0;
    overflow-y: auto;
    
    /* ❌ USUŃ margin-left - GridStack musi być full-width */
    /* margin-left: 0; */
    /* transition: margin-left var(--transition-normal); */
  }

  /* Desktop: GridStack zajmuje całą szerokość, sidebar jest overlay z pointer-events: none na gridzie */
  @media (min-width: 769px) {
    /* ❌ USUŃ - nie przesuwamy contentu */
    /* .app-layout.sidebar-open .main-content { ... } */
  }
</style>