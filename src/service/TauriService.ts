import { invoke } from "@tauri-apps/api/core";
import { DirEntry } from "@tauri-apps/plugin-fs";
import React, { useContext } from "react";

import { Service } from "./Service"

export const TauriService: Service = {
  readDir: async (dir: string) => {
    return await invoke<DirEntry[]>("read_dir", { dir: dir });
  }
}

export const TauriServiceContext = React.createContext(TauriService);

export function useTauriService() {
  return useContext(TauriServiceContext);
}
