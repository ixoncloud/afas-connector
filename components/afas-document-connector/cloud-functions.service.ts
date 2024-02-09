import type { BackendComponentClient, ComponentContext } from "@ixon-cdk/types";
import {
  filesStore,
  selectedAgentStore,
  selectedAssetStore,
  loadingStore,
} from "./stores";

import type { PdfFile } from "./types";

export class CloudFunctionsService {
  context: ComponentContext;
  cloudFunctionsClient: BackendComponentClient;

  constructor(context: ComponentContext) {
    this.context = context;
    this.cloudFunctionsClient = context.createBackendComponentClient();
  }

  async init() {
    loadingStore.set(true);
    selectedAgentStore.set(await this.fetchResourceData(this.context, "Agent"));
    selectedAssetStore.set(await this.fetchResourceData(this.context, "Asset"));
    await this.getFiles();
  }

  async getFiles() {
    loadingStore.set(true);
    const response = await this.cloudFunctionsClient.call("get_files");

    if (response.data.error) {
      filesStore.set([]);
      loadingStore.set(false);
      return;
    }

    const files = response.data as any as { name: string; id: string }[];
    const processedFiles = files.map((file: { name: any; id: any }) => ({
      name: file.name,
      id: file.id,
      deleting: false,
      downloading: false,
    }));
    filesStore.set(processedFiles);
    loadingStore.set(false);
  }

  async downloadFile(file: PdfFile) {
    file.downloading = true;
    filesStore.update((files) => [...files]);
    const pdfFile = (
      await this.cloudFunctionsClient.call("download_file", {
        file_name: file.name,
        file_id: file.id,
      })
    ).data as any as { file_name: string; pdf_file: string };

    if (pdfFile.pdf_file && pdfFile.file_name) {
      // Assume pdfFile.pdf_file is a base64 data URI
      const response = await fetch(pdfFile.pdf_file);
      const blob = await response.blob();

      this.context.saveAsFile(blob, pdfFile.file_name);
    } else {
      await this.getFiles();
    }

    file.downloading = false;
    filesStore.update((files) => [...files]);
  }

  private async fetchResourceData(
    context: ComponentContext,
    selector: string
  ): Promise<string | null> {
    const client = context.createResourceDataClient();

    // Create a promise that resolves after a timeout (e.g., 5000 milliseconds)
    const timeout = new Promise<string | null>((resolve) => {
      const ms = 2000; // Set timeout duration here
      setTimeout(() => resolve(null), ms);
    });

    // Original promise to fetch data
    const response = new Promise<string | null>((resolve) => {
      client.query(
        // @ts-ignore
        [{ selector, fields: ["name"] }],
        (result: { data: { name: any } }[]) => {
          console.log(result[0]?.data?.name || null);
          resolve(result[0]?.data?.name || null);
        }
      );
    });

    // Race the timeout against the original data fetch
    const result = await Promise.race([response, timeout]);

    // It's important to destroy the client only after the promise has resolved,
    // so move client.destroy() here, to ensure it's not called too early.
    client.destroy();

    return result;
  }
}
