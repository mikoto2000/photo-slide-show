import { useState } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { DirEntry, readDir } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/core";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [currentImagePath, setCurrentImagePath] = useState("");

  async function getImageEntry() {
    let dir = await open({
      multiple: false,
      directory: true,
    });
    if (dir) {
      const entries = await readDir(dir);
      const filterdEntries = entries.filter((entry) => entry.isFile && isImage(entry));
      const tmp = await path.join(dir, filterdEntries[0].name);
      setGreetMsg(tmp);
      setCurrentImagePath(convertFileSrc(tmp));

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
    </main>
  );
}

export default App;
