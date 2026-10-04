const fs = require("fs");
const path = require("path");
const { withDangerousMod, withXcodeProject } = require("expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");

// Fixes for building the generated ios/ project with Xcode 27.
// ponytail: drop whichever part a future Expo SDK template handles itself.

// Xcode 27's iOS SDK rejects deployment targets below 15.0. Some pods (and
// their resource-bundle targets) still declare 13.4, so raise every pod target
// to the app's own minimum during pod install.
// ponytail: hardcoded to match the Podfile platform; read from podfile_properties if that ever changes.
const MIN_IOS = "15.1";

function withPodsDeploymentTarget(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      const podfile = fs.readFileSync(podfilePath, "utf8");
      const result = mergeContents({
        tag: "pods-deployment-target",
        src: podfile,
        newSrc: [
          "    installer.pods_project.targets.each do |target|",
          "      target.build_configurations.each do |build_config|",
          `        if build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${MIN_IOS}`,
          `          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_IOS}'`,
          "        end",
          "      end",
          "    end",
        ].join("\n"),
        anchor: /post_install do \|installer\|/,
        offset: 1,
        comment: "#",
      });
      fs.writeFileSync(podfilePath, result.contents);
      return config;
    },
  ]);
}

// The app target's "Bundle React Native code and images" phase runs sentry-cli,
// which reads ios/sentry.properties. Xcode's user script sandbox blocks that
// read ("Operation not permitted"), so turn the sandbox off for the app project.
function withScriptSandboxingDisabled(config) {
  return withXcodeProject(config, (config) => {
    const configurations = config.modResults.pbxXCBuildConfigurationSection();
    for (const buildConfig of Object.values(configurations)) {
      if (buildConfig.buildSettings) {
        buildConfig.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = "NO";
      }
    }
    return config;
  });
}

module.exports = (config) =>
  withScriptSandboxingDisabled(withPodsDeploymentTarget(config));
