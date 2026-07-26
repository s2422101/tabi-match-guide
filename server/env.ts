import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const projectEnvPath = fileURLToPath(new URL("../.env", import.meta.url));

export type EnvironmentStatus = {
  envFileLoaded: boolean;
  hotpepperConfigured: boolean;
  deepLConfigured: boolean;
};

export function loadServerEnvironment(): EnvironmentStatus {
  const result = config({
    path: projectEnvPath,
    override: false,
    quiet: true,
  });

  return {
    envFileLoaded: !result.error,
    hotpepperConfigured: Boolean(process.env.HOTPEPPER_API_KEY?.trim()),
    deepLConfigured: Boolean(process.env.DEEPL_API_KEY?.trim()),
  };
}

export function logEnvironmentStatus(status: EnvironmentStatus): void {
  console.log(`[env] project .env: ${status.envFileLoaded ? "loaded" : "not found"}`);
  console.log(
    `[env] HOTPEPPER_API_KEY: ${
      status.hotpepperConfigured ? "configured" : "missing"
    }`,
  );
  console.log(
    `[env] DEEPL_API_KEY: ${status.deepLConfigured ? "configured" : "missing"}`,
  );
}
