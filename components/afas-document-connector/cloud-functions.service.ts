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
      const binary = atob(pdfFile.pdf_file.split(",")[1]);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([array], { type: "application/pdf" });

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
  ): Promise<string> {
    const client = context.createResourceDataClient();
    const response = new Promise<string>((resolve) => {
      client.query(
        // @ts-ignore
        [{ selector, fields: ["name"] }],
        (result: { data: { name: any } }[]) => {
          resolve(result[0]?.data?.name || null);
        }
      );
    });
    client.destroy();
    return response;
  }
}
