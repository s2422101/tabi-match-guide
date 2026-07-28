import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const projectEnvPath = fileURLToPath(new URL("../.env", import.meta.url));

export type EnvironmentStatus = {
  envFileLoaded: boolean;
  hotpepperConfigured: boolean;
  deepLConfigured: boolean;
  supabaseUrlConfigured: boolean;
  supabaseServiceRoleKeyConfigured: boolean;
  adminEmailsConfigured: boolean;
  frontendOriginsConfigured: boolean;
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
    supabaseUrlConfigured: Boolean(process.env.SUPABASE_URL?.trim()),
    supabaseServiceRoleKeyConfigured: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    ),
    adminEmailsConfigured: Boolean(process.env.ADMIN_EMAILS?.trim()),
    frontendOriginsConfigured: Boolean(process.env.FRONTEND_ORIGINS?.trim()),
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
  console.log(
    `[env] SUPABASE_URL: ${
      status.supabaseUrlConfigured ? "configured" : "missing"
    }`,
  );
  console.log(
    `[env] SUPABASE_SERVICE_ROLE_KEY: ${
      status.supabaseServiceRoleKeyConfigured ? "configured" : "missing"
    }`,
  );
  console.log(
    `[env] ADMIN_EMAILS: ${
      status.adminEmailsConfigured ? "configured" : "missing"
    }`,
  );
  console.log(
    `[env] FRONTEND_ORIGINS: ${
      status.frontendOriginsConfigured ? "configured" : "missing (localhost only)"
    }`,
  );
}
