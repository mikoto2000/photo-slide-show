import { DirEntry } from "@tauri-apps/plugin-fs";

export interface Service {
  readDir(dir: string): Promise<DirEntry[]>;
}
