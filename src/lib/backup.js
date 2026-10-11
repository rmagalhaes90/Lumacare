import { Capacitor } from "@capacitor/core";
import { dayKey } from "./storage.js";

export function backupFilename(date = new Date()) {
  return `lumacare-backup-${dayKey(date)}.json`;
}

function downloadInBrowser(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportBackup(state) {
  const filename = backupFilename();
  const text = JSON.stringify(state, null, 2);
  if (!Capacitor.isNativePlatform()) {
    downloadInBrowser(filename, text);
    return;
  }
  const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const file = await Filesystem.writeFile({
    path: filename,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({
    title: "LumaCare backup",
    text: "LumaCare backup",
    url: file.uri,
    dialogTitle: "Save your LumaCare backup",
  });
}
