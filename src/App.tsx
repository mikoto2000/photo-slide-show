import { useEffect, useState } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { DirEntry, readDir } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/core";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [dir, setDir] = useState("");
  const [imageEntries, setImageEntries] = useState<DirEntry[]>([]);
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [interval, _setInterval] = useState(1000);
  const [imageIndex, setImageIndex] = useState(0);
  let initialized = false;

  useEffect(() => {
    if (!initialized) {
      switchImage();
      initialized = true;
    }
  });

  const switchImage = () => {
    setTimeout(async () => {
      const tmp = await path.join(dir, imageEntries[imageIndex].name);
      setGreetMsg(tmp);
      setCurrentImagePath(convertFileSrc(tmp));

      setImageIndex((imageIndex + 1) % imageEntries.length);
      switchImage();
    }, interval);
  };

  async function getImageEntry() {
    let dir = await open({
      multiple: false,
      directory: true,
    });
    if (dir) {
      setDir(dir);
      const entries = await readDir(dir);
      const filterdEntries = entries.filter((entry) => entry.isFile && isImage(entry));
      setImageEntries(filterdEntries);
    }
  }

  const isImage = (entry: DirEntry): boolean => {
    const parts = entry.name.split('.');
    const ext = parts.length > 1 ? parts[parts.length - 1] : "";
    return ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "svg"].includes(ext.toLowerCase());
  }

  return (
    <main className="container">
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          getImageEntry();
        }}
      >
        <button type="submit">ディレクトリ選択</button>
      </form>
      <img src={currentImagePath}></img>
      <p>{greetMsg}</p>
      <p>{imageIndex}</p>
    </main>
  );
}

export default App;
