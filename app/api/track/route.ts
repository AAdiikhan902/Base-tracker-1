import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { analyzeWallet } from "@/lib/base";
import { generateAiSummary } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address || typeof address !== "string" || !isAddress(address)) {
      return NextResponse.json(
        { error: "That doesn't look like a valid EVM address." },
        { status: 400 }
      );
    }

    const walletData = await analyzeWallet(address);
    const summary = await generateAiSummary(walletData);

    return NextResponse.json({ ...walletData, aiSummary: summary });
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong reading that address. Try again." },
      { status: 500 }
    );
  }
}
