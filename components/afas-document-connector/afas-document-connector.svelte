<script lang="ts">
  import { onMount } from "svelte";
  import { mdiFilePdfBox, mdiDownload } from "@mdi/js";

  import {
    filesStore,
    selectedAgentStore,
    selectedAssetStore,
    loadingStore,
  } from "./stores";
  import { CloudFunctionsService } from "./cloud-functions.service";
  import { createResizeObserver } from "./utils";

  import type { ComponentContext } from "@ixon-cdk/types";

  export let context: ComponentContext;

  let cloudFunctionsService: CloudFunctionsService;
  let height: number | null = null;
  let rootEl: HTMLDivElement;

  // Computed properties
  $: hasHeader = header && (header.title || header.subtitle) && !isShallow;
  $: isShallow = height !== null ? height <= 60 : false;
  $: header = context ? context.inputs.header : undefined;

  onMount(async () => {
    cloudFunctionsService = new CloudFunctionsService(context);
    await cloudFunctionsService.init();

    const resizeObserver = createResizeObserver(rootEl, (newHeight: number) => {
      height = newHeight;
    });

    return () => {
      context.ontimerangechange = null;
      resizeObserver.unobserve(rootEl);
    };
  });

  function renderSvgIcon(iconPath: string) {
    return `
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="currentColor" d="${iconPath}" />
      </svg>
    `;
  }
</script>

<div class="card" bind:this={rootEl}>
  {#if hasHeader}
    <div class="card-header">
      {#if header?.title}
        <h3 class="card-title">{header.title}</h3>
      {/if}
      {#if header?.subtitle}
        <h4 class="card-subtitle">{header.subtitle}</h4>
      {/if}
    </div>
  {/if}
  <div class="card-content">
    {#if $selectedAgentStore || $selectedAssetStore}
      {#if $loadingStore}
        <p>loading...</p>
      {:else if $filesStore.length === 0 && !$loadingStore}
        <p>No files found</p>
      {:else}
        <div class="file-list-container">
          <ul class="pdf-files">
            {#each $filesStore as file}
              <li>
                {@html renderSvgIcon(`${mdiFilePdfBox}`)}
                <span class="file-name">{file.name}</span>
                <button
                  class="download-btn"
                  on:click={() => cloudFunctionsService.downloadFile(file)}
                >
                  {#if !file.downloading}
                    {@html renderSvgIcon(`${mdiDownload}`)}
                  {:else}
                    <div style="padding-right: 4px">
                      <svg
                        class="spinner"
                        width="16px"
                        height="16px"
                        viewBox="0 0 66 66"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          class="path"
                          fill="none"
                          stroke-width="6"
                          stroke-linecap="round"
                          cx="33"
                          cy="33"
                          r="30"
                        />
                      </svg>
                    </div>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {:else}
      <p>Please select an agent or asset</p>
    {/if}
  </div>
</div>

<style lang="scss">
  @import "./styles/card";

  .card-content {
    display: flex;
    flex-direction: column;
    height: inherit;

    .file-list-container {
      flex-grow: 1; /* Allow the container to grow and fill the available space */
      overflow-y: auto;
      padding-top: 16px;
      padding-bottom: 32px;

      .pdf-files {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .pdf-files li {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }

      .pdf-files li svg {
        margin-right: 8px;
      }

      .file-name {
        margin-right: auto;
      }

      .download-btn {
        display: flex;
        align-items: center;
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
      }
    }
  }

  // Here is where the magic happens

  $offset: 187;
  $duration: 1.4s;

  .spinner {
    animation: rotator $duration linear infinite;
  }

  @keyframes rotator {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(270deg);
    }
  }

  .path {
    stroke-dasharray: $offset;
    stroke-dashoffset: 0;
    transform-origin: center;
    animation: dash $duration ease-in-out infinite,
      colors ($duration * 4) ease-in-out infinite;
  }

  @keyframes colors {
    0% {
      stroke: #000000;
    }
    25% {
      stroke: #000000;
    }
    50% {
      stroke: #000000;
    }
    75% {
      stroke: #000000;
    }
    100% {
      stroke: #000000;
    }
  }

  @keyframes dash {
    0% {
      stroke-dashoffset: $offset;
    }
    50% {
      stroke-dashoffset: $offset/4;
      transform: rotate(135deg);
    }
    100% {
      stroke-dashoffset: $offset;
      transform: rotate(450deg);
    }
  }
</style>
