import { useEffect, useState } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { DirEntry } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
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
  const [isRandom, setRandom] = useState(true);
  const [isPause, setPause] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

        const savedIsRandom = await s.get<boolean>('isRandom');
        const restoredIsRandom = savedIsRandom ?? true;
        setRandom(restoredIsRandom);

        const savedDir = await s.get<string>('dir');
        if (savedDir) {
          setDir(savedDir);
          await updateEntries(savedDir, restoredIsRandom);
        }
      }

    })();

  }, []);

  useEffect(() => {
    const appWindow = getCurrentWindow();

    appWindow.isFullscreen().then(setIsFullscreen).catch(console.error);

    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (event.key === "F11") {
        event.preventDefault();
        await toggleFullscreen();
      } else if (event.key === "Escape" && await appWindow.isFullscreen()) {
        await setFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let intervalHandle = undefined;
    if (!isPause && imageEntries.length > 0) {
      intervalHandle = setTimeout(async () => {
        if (dir && dir.length > 0) {
          const nextImageIndex = (imageIndex + 1) % imageEntries.length;
          setFilePath(imageEntries[nextImageIndex].name);
          setImageIndex(nextImageIndex);
          setCurrentImagePath(convertFileSrc(imageEntries[nextImageIndex].name));
        }
      }, intervalValue);
    }
    return () => {
      if (intervalHandle) {
        clearInterval(intervalHandle);
      }
    }
  }, [dir, intervalValue, imageEntries, imageIndex, isPause]);

  async function updateEntries(dir: string, random = isRandom) {
    try {
      console.log(`dir: ${dir}`);
      const entries = await service.readDir(dir);
      console.log(entries);
      const filterdEntries = entries.filter((entry) => entry.isFile && isImage(entry));
      console.log(filterdEntries);
      if (random) {
        shuffle(filterdEntries);
      }
      console.log(filterdEntries);
      setImageEntries(filterdEntries);
      setImageIndex(0);
      if (filterdEntries.length === 0) {
        setFilePath("");
        setCurrentImagePath("");
        return;
      }
      setTimeout(() => {
        setCurrentImagePath(convertFileSrc(filterdEntries[0].name));
      });
    } catch (e) {
      console.log(e);
    }
  }

  function shuffle(array: Array<any>) {
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

  async function setFullscreen(fullscreen: boolean) {
    try {
      await getCurrentWindow().setFullscreen(fullscreen);
      setIsFullscreen(fullscreen);
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleFullscreen() {
    try {
      const fullscreen = await getCurrentWindow().isFullscreen();
      await setFullscreen(!fullscreen);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className={`container${isFullscreen ? " fullscreen" : ""}`}>
      <div className="controls" style={{ flexGrow: "1" }}>
        ランダム：<input
          type="checkbox"
          checked={isRandom}
          onChange={(e) => {
            const v = e.currentTarget.checked;
            setRandom(v);

            if (store) {
              store.set("isRandom", v);
            }
          }}
        ></input>
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
        <input
          type="button"
          value={isPause ? "再生開始" : "一時停止"}
          onClick={() => {
            setPause(!isPause);
          }}
        ></input>
        <input
          type="button"
          value="フルスクリーン"
          title="フルスクリーンに切り替える (F11)"
          onClick={() => toggleFullscreen()}
        ></input>
      </div>
      <img className="slideshow-image" src={currentImagePath}></img>
      <div className="file-path" style={{ flexGrow: "1" }}>
        <p>{filePath}</p>
      </div>
    </main >
  );
}

export default App;
