import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/schema";
import crypto from "crypto"; // Use native Node.js crypto

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // 1. Generate a secure, highly-entropic raw API key
    const rawPrefix = "rsp_"; 
    const rawSecret = crypto.randomBytes(24).toString("base64url");
    const rawKey = `${rawPrefix}${rawSecret}`;

    // 2. Hash the key using SHA-256 (One-way, deterministic)
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    // 3. Save ONLY the hashed key to the database
    await db.insert(apiKeys).values({
      userId,
      key: hashedKey,
      name: "VS Code Extension",
    });

    // 4. Return the RAW key to the user (This is the only time they will see it!)
    return NextResponse.json({ key: rawKey });
  } catch (error) {
    console.error("Failed to generate API key:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}