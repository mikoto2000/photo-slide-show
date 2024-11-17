import { useState } from "react";
import "./App.css";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir } from "@tauri-apps/plugin-fs";

function App() {
  const [greetMsg, setGreetMsg] = useState("");

  async function getEntry() {
    let dir = await open({
      multiple: false,
      directory: true,
    });
    if (dir) {
      const entries = await readDir(dir);
      setGreetMsg(JSON.stringify(entries));
    }
  }


  return (
    <main className="container">
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          getEntry();
        }}
      >
        <button type="submit">ディレクトリ選択</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
