import "server-only";
import { Polar } from "@polar-sh/sdk";
import { getPolarEnv } from "./env";

let client: Polar | undefined;

/** Lazily constructed Polar SDK client (sandbox or production per POLAR_SERVER). */
export function getPolar(): Polar {
  if (!client) {
    const env = getPolarEnv();
    client = new Polar({ accessToken: env.POLAR_ACCESS_TOKEN, server: env.POLAR_SERVER });
  }
  return client;
}
