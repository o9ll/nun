import AddonManager from "./addonmanager";
import { NU_THEMES_DIR } from "@nu/consts";

export default new class ThemeManager extends AddonManager {
    addonFolder = NU_THEMES_DIR;
};