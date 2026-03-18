import { createFlagsDiscoveryEndpoint } from "flags/next";
import { getProviderData } from "@flags-sdk/vercel";
import * as flags from "@/flags";

export const GET = createFlagsDiscoveryEndpoint(async () => {
  return await getProviderData(flags);
});
