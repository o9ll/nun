import Remote from "./polyfill/remote";

export const DATA_DIR = VencordNative.nu.getDataDir();
export const NU_THEMES_DIR = Remote.path.join(DATA_DIR, "themes");
export const NU_PLUGINS_DIR = Remote.path.join(DATA_DIR, "plugins");