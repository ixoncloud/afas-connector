import { writable } from "svelte/store";
import type { PdfFile } from "./types";

export const filesStore = writable<PdfFile[]>([]);
export const permissionsStore = writable<string | null>(null);
export const selectedAgentStore = writable<string | null>(null);
export const selectedAssetStore = writable<string | null>(null);
export const loadingStore = writable<boolean>(true);
