import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { indexRepository } from "@/lib/inngest/functions";

// Next.js Route Handler for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [indexRepository],
});