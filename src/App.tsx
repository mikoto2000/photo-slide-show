import { useEffect, useState } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { DirEntry } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";
import { load, Store } from "@tauri-apps/plugin-store";
import { useTauriService } from "./service/TauriService";
import { Service } from "./service/Service";

function App() {
  const [store, setStore] = useState<Store | undefined>(undefined);
  const [filePath, setFilePath] = useState("");
  const [dir, setDir] = useState("");
  const [imageEntries, setImageEntries] = useState<DirEntry[]>([]);
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [intervalValue, setIntervalValue] = useState(5000);
  const [imageIndex, setImageIndex] = useState(0);
  let initialized = false;

  const service: Service = useTauriService();

  useEffect(() => {

    (async () => {

      if (!store) {

        const s = await load('store.json', { autoSave: true });
        setStore(s);
        const i = await s.get<number>('interval');
        if (i) {
          setIntervalValue(i);
        }

        //const d = await s.get<string>('dir');
        //if (d) {
        //  console.log(d);
        //  setDir(d);
        //  updateEntries(d);
        //}
      }

    })();

  }, []);

  useEffect(() => {
    let intervalHandle = undefined;
    if (!initialized) {
      intervalHandle = setTimeout(async () => {
        if (dir && dir.length > 0) {
          const nextImageIndex = (imageIndex + 1) % imageEntries.length;
          setFilePath(imageEntries[nextImageIndex].name);
          setImageIndex(nextImageIndex);
          setCurrentImagePath(convertFileSrc(imageEntries[nextImageIndex].name));
        }
      }, intervalValue);
      initialized = true;
    }
    return () => {
      if (intervalValue) {
        clearInterval(intervalHandle);
      }
    }
  }, [dir, intervalValue, imageEntries, imageIndex]);

  async function updateEntries(dir: string) {
    try {
      console.log(`dir: ${dir}`);
      const entries = await service.readDir(dir);
      console.log(entries);
      const filterdEntries = entries.filter((entry) => entry.isFile && isImage(entry));
      console.log(filterdEntries);
      shuffle(filterdEntries);
      console.log(filterdEntries);
      setImageEntries(filterdEntries);
      setImageIndex(0);
      setTimeout(() => {
        setCurrentImagePath(convertFileSrc(filterdEntries[0].name));
      });
    } catch (e) {
      console.log(e);
    }
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async function getImageEntry() {
    let newDir = await open({
      multiple: false,
      directory: true,
    });
    if (newDir && newDir.length > 0) {
      setDir(newDir);

      if (store) {
        store.set("dir", newDir);
      }

      updateEntries(newDir);
    }
  }

  const isImage = (entry: DirEntry): boolean => {
    const parts = entry.name.split('.');
    const ext = parts.length > 1 ? parts[parts.length - 1] : "";
    return ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff"].includes(ext.toLowerCase());
  }

  return (
    <main className="container">
      <div style={{ flexGrow: "1" }}>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            getImageEntry();
          }}
          style={{ display: "inline" }}
        >
          <button type="submit">フォトディレクトリ選択</button>
        </form>
        インターバル：<input
          type="number"
          value={intervalValue}
          onChange={(e) => {
            const v = Number(e.currentTarget.value);
            setIntervalValue(v);

            if (store) {
              store.set("interval", v);
            }
          }}
        ></input>
      </div>
      <img src={currentImagePath} style={{ maxHeight: "90vh", objectFit: "contain" }}></img>
      <div style={{ flexGrow: "1" }}>
        <p>{filePath}</p>
      </div>
    </main >
  );
}

export default App;
