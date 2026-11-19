const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    const app = manifest.application[0];
    app.service = (app.service || []).filter(
      (s) => s.$["android:name"] !== "app.notifee.core.ForegroundService",
    );
    app.service.push({
      $: {
        "android:name": "app.notifee.core.ForegroundService",
        "android:exported": "false",
        "android:foregroundServiceType": "specialUse",
        "tools:replace": "android:foregroundServiceType",
      },
      property: [
        {
          $: {
            "android:name": "android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE",
            "android:value": "Menampilkan progres jadwal yang sedang berjalan",
          },
        },
      ],
    });
    return cfg;
  });
