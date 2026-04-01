import { NextResponse } from "next/server";

export const GET = () => {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
};
