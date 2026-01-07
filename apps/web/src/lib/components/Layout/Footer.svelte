<!-- apps/web/src/lib/components/Layout/Footer.svelte -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { apiClient } from '$lib/api/client';
  import { sidebarOpen } from '$lib/stores/sidebar';

  interface ServiceStatus {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    latency?: number;
    lastChecked: Date;
  }

  let services: ServiceStatus[] = [
    { name: 'Homelab', status: 'unknown', lastChecked: new Date() },
    { name: 'VPS', status: 'unknown', lastChecked: new Date() },
    { name: 'Proxmox', status: 'unknown', lastChecked: new Date() },
    { name: 'Pi-hole', status: 'unknown', lastChecked: new Date() },
  ];

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'degraded': return '#f59e0b';
      case 'unhealthy': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const checkServiceHealth = async () => {
    try {
      const health = await apiClient.request<any>('/health/detailed');
      
      services = services.map(service => {
        switch (service.name) {
          case 'Homelab':
            return {
              ...service,
              status: health.services.database?.status === 'healthy' ? 'healthy' : 'unhealthy',
              latency: health.services.database?.latency,
              lastChecked: new Date(),
            };
          case 'Proxmox':
            return {
              ...service,
              status: health.services.proxmox?.status === 'healthy' ? 'healthy' : 
                       health.services.proxmox?.status === 'not_configured' ? 'unknown' : 'unhealthy',
              lastChecked: new Date(),
            };
          default:
            return { ...service, lastChecked: new Date() };
        }
      });
    } catch (error) {
      console.error('Health check failed:', error);
      services = services.map(service => ({
        ...service,
        status: 'unhealthy' as const,
        lastChecked: new Date(),
      }));
    }
  };

  onMount(() => {
    checkServiceHealth();
    const interval = setInterval(checkServiceHealth, 30000);
    
    return () => clearInterval(interval);
  });
</script>

<footer class="footer" class:sidebar-open={$sidebarOpen}>
  <div class="service-status">
    {#each services as service}
      <div class="status-item" title="{service.name} - {service.status}">
        <div 
          class="status-dot"
          style="background-color: {getStatusColor(service.status)}"
          class:pulse={service.status === 'healthy'}
        />
        <span class="status-name">{service.name}</span>
        {#if service.latency}
          <span class="status-latency">{service.latency}ms</span>
        {/if}
      </div>
    {/each}
  </div>
</footer>

<style>
  .footer {
    position: sticky;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center; /* ✅ Wycentrowanie */
    padding: 0.75rem 1.5rem;
    background: rgba(10, 10, 15, 0.9);
    backdrop-filter: blur(10px);
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    transition: left var(--transition-normal), width var(--transition-normal);
  }

  /* ✅ Desktop: footer przesuwa się gdy sidebar otwarty */
  @media (min-width: 769px) {
    .footer.sidebar-open {
      left: 280px;
      width: calc(100% - 280px);
    }
  }

  .service-status {
    display: flex;
    align-items: center;
    gap: 1.5rem; /* ✅ Większy gap dla lepszej czytelności */
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-muted);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }

  .status-dot.pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .status-name {
    font-weight: 500;
  }

  .status-latency {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    opacity: 0.8;
  }

  @media (max-width: 640px) {
    .footer {
      padding: 0.75rem 1rem;
    }

    .service-status {
      gap: 1rem;
    }

    .status-item {
      gap: 0.25rem;
    }

    /* ✅ Na mobile ukryj nazwy, zostaw tylko kropki */
    .status-name,
    .status-latency {
      display: none;
    }
  }
</style>