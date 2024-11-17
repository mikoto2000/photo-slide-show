import { useState } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { DirEntry, readDir } from "@tauri-apps/plugin-fs";

function App() {
  const [greetMsg, setGreetMsg] = useState("");

  async function getImageEntry() {
    let dir = await open({
      multiple: false,
      directory: true,
    });
    if (dir) {
      const entries = await readDir(dir);
      const filterdEntries = entries.filter((entry) => entry.isFile && isImage(entry));
      setGreetMsg(JSON.stringify(filterdEntries));
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
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
