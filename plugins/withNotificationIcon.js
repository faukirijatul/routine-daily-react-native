const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

// Copies assets/notification-icon/<density>.png into
// android/app/src/main/res/drawable-<density>/ic_notification.png
// so notifee can use it as the status bar small icon (smallIcon: "ic_notification").
const DENSITIES = ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"];
const ICON_NAME = "ic_notification.png";

module.exports = (config) =>
  withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const resDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
      );

      for (const density of DENSITIES) {
        const src = path.join(
          projectRoot,
          "assets",
          "notification-icon",
          `${density}.png`,
        );
        if (!fs.existsSync(src)) {
          throw new Error(`[withNotificationIcon] Missing icon: ${src}`);
        }
        const destDir = path.join(resDir, `drawable-${density}`);
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, path.join(destDir, ICON_NAME));
      }
      return cfg;
    },
  ]);
