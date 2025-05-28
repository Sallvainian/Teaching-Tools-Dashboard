<script lang="ts">
  let { pdfUrl = '', height = '600px' } = $props<{
    pdfUrl: string;
    height?: string;
  }>();
</script>

<div class="pdf-viewer-container" style="height: {height}">
  {#if pdfUrl}
    <iframe
      src={pdfUrl}
      title="PDF Viewer"
      class="w-full h-full border-0 rounded-lg"
      loading="lazy"
    ></iframe>
  {:else}
    <div class="flex items-center justify-center h-full text-sm text-muted">
      No PDF selected
    </div>
  {/if}
</div>
