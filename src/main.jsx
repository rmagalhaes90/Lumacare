import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { bootNative } from "./native.js";
import "./styles.css";

bootNative();

createRoot(document.getElementById("root")).render(<App />);
