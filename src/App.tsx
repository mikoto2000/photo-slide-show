import { useEffect, useState } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { DirEntry, readDir } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/core";

function App() {
  const [filePath, setFilePath] = useState("");
  const [dir, setDir] = useState("");
  const [imageEntries, setImageEntries] = useState<DirEntry[]>([]);
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [intervalValue, setIntervalValue] = useState(5000);
  const [imageIndex, setImageIndex] = useState(0);
  let initialized = false;

  useEffect(() => {
    let intervalHandle = undefined;
    if (!initialized) {
      intervalHandle = setTimeout(async () => {
        if (dir && dir.length > 0) {
          console.log("KITAYO!!!");
          const nextImageIndex = (imageIndex + 1) % imageEntries.length;
          const tmp = await path.join(dir, imageEntries[nextImageIndex].name);
          setFilePath(tmp);
          setImageIndex(nextImageIndex);
          setCurrentImagePath(convertFileSrc(tmp));
        }
      }, intervalValue);
      initialized = true;
    }
    return () => {
      if (intervalValue) {
        clearInterval(intervalHandle);
      }
    }
  }, [intervalValue, imageEntries, imageIndex]);

  async function getImageEntry() {
    let dir = await open({
      multiple: false,
      directory: true,
    });
    if (dir && dir.length > 0) {
      setDir(dir);
      const entries = await readDir(dir);
      const filterdEntries = entries.filter((entry) => entry.isFile && isImage(entry));
      setImageEntries(filterdEntries);
      setImageIndex(0);
      const tmp = await path.join(dir, filterdEntries[0].name);
      setTimeout(() => {
        setCurrentImagePath(convertFileSrc(tmp));
      });
    }
  }

  const isImage = (entry: DirEntry): boolean => {
    const parts = entry.name.split('.');
    const ext = parts.length > 1 ? parts[parts.length - 1] : "";
    return ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "svg"].includes(ext.toLowerCase());
  }

  return (
    <main className="container" style={{ maxHeight: "100vh" }}>
      <div style={{ flexGrow: "1" }}>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            getImageEntry();
          }}
        >
          <button type="submit">フォトディレクトリ選択</button>
        </form>
        インターバル：<input
          type="number"
          value={intervalValue}
          onChange={(e) => {
            setIntervalValue(Number(e.currentTarget.value));
          }}
        ></input>
      </div>
        <img src={currentImagePath} style={{ maxHeight: "90%", objectFit: "contain" }}></img>
      <div style={{ flexGrow: "1" }}>
        <p>{filePath}</p>
      </div>
    </main >
  );
}

export default App;
