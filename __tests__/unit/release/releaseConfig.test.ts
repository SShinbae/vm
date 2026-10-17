import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { URL } from "node:url";
import dotenv from "dotenv";
import ignore from "ignore";

const yaml = require("js-yaml");

it("keeps platform-specific lockfile packages optional across build runners", () => {
  const lock = JSON.parse(
    fs.readFileSync(path.join(root, "package-lock.json"), "utf8"),
  ) as {
    packages: Record<
      string,
      {
        os?: string[];
        cpu?: string[];
        optional?: boolean;
        devOptional?: boolean;
      }
    >;
  };
  const requiredNativePackages = Object.entries(lock.packages)
    .filter(
      ([, entry]) =>
        (entry.os || entry.cpu) && !entry.optional && !entry.devOptional,
    )
    .map(([name]) => name);
  expect(requiredNativePackages).toEqual([]);
});

it.each([
  ["production", "build-production"],
  ["staging", "build-staging"],
  ["ios-production", "build-ios-production"],
  ["ios-staging", "build-ios-staging"],
])("%s build cannot bypass the shared quality gate", (workflow, build) => {
  const config = yaml.load(
    fs.readFileSync(
      path.join(root, `.github/workflows/${workflow}.yaml`),
      "utf8",
    ),
  );
  expect(config.jobs.test.uses).toBe("./.github/workflows/test.yml");
  expect(config.jobs.test.needs).toBe("check-skip");
  expect(config.jobs[build].needs).toBe("test");
  expect(config.jobs[build].if ?? "").not.toContain("always()");
});

it("the shared quality gate runs all checks without allowing failures", () => {
  const config = yaml.load(
    fs.readFileSync(path.join(root, ".github/workflows/test.yml"), "utf8"),
  );
  expect(config.on).toHaveProperty("workflow_call");
  const steps = config.jobs.test.steps as {
    run?: string;
    "continue-on-error"?: boolean;
  }[];
  for (const command of ["typecheck", "lint:code", "lint", "test:ci"]) {
    const step = steps.find((step) =>
      step.run?.startsWith(`npm run ${command}`),
    );
    expect(step).toBeDefined();
    expect(step?.["continue-on-error"]).not.toBe(true);
    expect(step?.run).not.toMatch(/\|\||--if-present/);
  }
});

const root = path.resolve(__dirname, "../../..");
const source = fs.readFileSync(path.join(root, "app.config.js"), "utf8");
const production = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_KEY: "sb_publishable_test-public-key",
  SITE_URL: "https://vm.example.com",
};

function loadConfig(
  profile: string,
  settings: Record<string, string> = {},
  files: Record<string, string> = {},
) {
  const env: Record<string, string> = {
    NODE_ENV: "production",
    EAS_BUILD_PROFILE: profile,
    ...settings,
  };
  const loaded: string[] = [];
  const result = { exports: {} as any };
  vm.runInNewContext(source, {
    __dirname: root,
    module: result,
    process: { env },
    Buffer,
    URL,
    console: { log: jest.fn() },
    require: (name: string) => {
      if (name === "fs") {
        return {
          existsSync: (file: string) => path.basename(file) in files,
        };
      }
      if (name === "dotenv") {
        return {
          config: ({ path: file }: { path: string }) => {
            const basename = path.basename(file);
            loaded.push(basename);
            dotenv.populate(env, dotenv.parse(files[basename] ?? ""));
          },
        };
      }
      return require(name);
    },
  });
  return { extra: result.exports.expo.extra, loaded };
}

describe.each(["production", "production-apk"])("%s app config", (profile) => {
  it("never falls back to .env.local when production settings are missing", () => {
    expect(() =>
      loadConfig(
        profile,
        {},
        { ".env.local": "SUPABASE_URL=http://localhost" },
      ),
    ).toThrow(/SUPABASE_URL/);
  });

  it("accepts injected settings without a file and leaves local env unread", () => {
    const { extra, loaded } = loadConfig(profile, production, {
      ".env.local": "SITE_URL=http://localhost",
    });
    expect(extra.supabaseUrl).toBe(production.SUPABASE_URL);
    expect(extra.siteUrl).toBe(production.SITE_URL);
    expect(loaded).not.toContain(".env.local");
  });

  it("loads the generated build file before the production file", () => {
    const buildFile = Object.entries(production)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    const { extra, loaded } = loadConfig(
      profile,
      { SITE_URL: "https://override.example.com" },
      {
        ".env.production.build": buildFile,
        ".env.production": "SITE_URL=http://localhost",
      },
    );
    expect(loaded).toEqual([".env.production.build"]);
    expect(extra.siteUrl).toBe("https://override.example.com");
  });

  it("supports .env.production when no generated file exists", () => {
    const { extra } = loadConfig(profile, production, {
      ".env.production": "FUNCTIONS_URL=https://functions.example.com/api",
    });
    expect(extra.functionsUrl).toBe("https://functions.example.com/api");
  });

  it.each(["SUPABASE_URL", "SUPABASE_KEY", "SITE_URL"])(
    "rejects a missing %s",
    (key) => {
      expect(() => loadConfig(profile, { ...production, [key]: "" })).toThrow(
        new RegExp(key),
      );
    },
  );

  it.each([
    "http://project.supabase.co",
    "https://localhost",
    "https://api.localhost",
    "https://localhost./",
    "https://vm.local",
    "https://api.internal",
    "https://127.0.0.1:54321",
    "https://10.0.2.2",
    "https://192.168.1.20",
    "https://[::1]",
    "https://[::ffff:127.0.0.1]",
    "https://user:private-value@vm.example.com",
    "invalid-url",
  ])("rejects unsafe endpoints without printing their values: %s", (url) => {
    for (const key of ["SUPABASE_URL", "SITE_URL", "FUNCTIONS_URL"]) {
      let message = "";
      try {
        loadConfig(profile, { ...production, [key]: url });
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toContain(key);
      expect(message).not.toContain(url);
      expect(message).not.toContain("private-value");
    }
  });

  it("allows an empty functions override and a public HTTPS override", () => {
    expect(
      loadConfig(profile, { ...production, FUNCTIONS_URL: "" }).extra,
    ).toHaveProperty("functionsUrl", "");
    expect(
      loadConfig(profile, {
        ...production,
        FUNCTIONS_URL: "https://functions.example.com/api",
      }).extra.functionsUrl,
    ).toBe("https://functions.example.com/api");
  });

  it.each(["anon", "service_role"])(
    "only accepts the public anon role in legacy JWT keys (%s)",
    (role) => {
      const key = `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
      const load = () =>
        loadConfig(profile, { ...production, SUPABASE_KEY: key });
      if (role === "anon") expect(load().extra.supabaseKey).toBe(key);
      else expect(load).toThrow(/SUPABASE_KEY/);
    },
  );

  it.each(["sb_secret_private-value", "invalid-key"])(
    "rejects non-public keys without printing them: %s",
    (key) => {
      expect(() =>
        loadConfig(profile, { ...production, SUPABASE_KEY: key }),
      ).toThrow(/SUPABASE_KEY/);
      try {
        loadConfig(profile, { ...production, SUPABASE_KEY: key });
      } catch (error) {
        expect((error as Error).message).not.toContain(key);
      }
    },
  );
});

it("preserves local development and the dedicated preview environment", () => {
  expect(
    loadConfig("development", {}, { ".env.local": "SITE_URL=http://localhost" })
      .extra.siteUrl,
  ).toBe("http://localhost");
  expect(
    loadConfig(
      "preview",
      {},
      { ".env.staging.build": "SITE_URL=https://staging.example.com" },
    ).extra.siteUrl,
  ).toBe("https://staging.example.com");
});

describe("EAS source archive", () => {
  const rules = ignore().add(
    fs.readFileSync(path.join(root, ".easignore"), "utf8"),
  );

  it.each([
    ".env.local",
    ".env.production",
    "supabase/.env",
    "env.supabase-local",
    "credentials.json",
    "ios/certs/dist.p12",
    "ios/certs/profile.mobileprovision",
    "android/release.jks",
    "android/release.keystore",
    "AuthKey.p8",
    "private.key",
    "private.pem",
    "Vehicles Firebase Admin SDK.json",
    "fastlane/google-play-key.json",
    "ios/sentry.properties",
    "android/sentry.properties",
    ".aws/credentials",
    ".netlify/state.json",
  ])("excludes sensitive file %s", (file) => {
    expect(rules.ignores(file)).toBe(true);
  });

  it.each([
    ".env.production.build",
    ".env.staging.build",
    "google-services.json",
    "app.config.js",
    "eas.json",
    "plugins/withXcode27Compat.js",
    "ios/VM/Info.plist",
    "android/app/src/main/AndroidManifest.xml",
    "android/app/debug.keystore",
  ])("preserves required build input %s", (file) => {
    expect(rules.ignores(file)).toBe(false);
  });
});

it.each(["production", "staging", "ios-production", "ios-staging"])(
  "%s workflow keeps server secrets out of archived build env files",
  (workflow) => {
    const config = yaml.load(
      fs.readFileSync(
        path.join(root, `.github/workflows/${workflow}.yaml`),
        "utf8",
      ),
    ) as { jobs: Record<string, { steps?: { run?: string }[] }> };
    const generators = Object.values(config.jobs).flatMap((job) =>
      (job.steps ?? [])
        .map((step) => step.run ?? "")
        .filter((script) =>
          /Creating \.env\.(production|staging)\.build/.test(script),
        ),
    );
    expect(generators.length).toBeGreaterThan(0);
    for (const script of generators) {
      expect(script).not.toMatch(
        /GOOGLE_VISION_API_KEY|SUPABASE_SERVICE_ROLE_KEY|SENTRY_AUTH_TOKEN|BREVO_API_KEY/,
      );
    }
    for (const job of Object.values(config.jobs)) {
      for (const step of job.steps ?? []) {
        const script = step.run ?? "";
        if (/eas build .*--profile preview .*--local/.test(script)) {
          expect(script).toContain("export SENTRY_DISABLE_AUTO_UPLOAD=true");
        }
      }
    }
  },
);
