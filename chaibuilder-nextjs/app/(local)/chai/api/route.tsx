import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import chaiApiHandler from "@chaibuilder/local/server";
import { loadWebBlocks } from "@chaibuilder/sdk/web-blocks";

loadWebBlocks();

export async function POST(req: NextRequest) {
  const { action, data } = await req.json();
  try {
    const response = await chaiApiHandler({ action, data });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message });
  }
}
