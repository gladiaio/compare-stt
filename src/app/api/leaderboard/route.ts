import { NextResponse } from "next/server";
import { getLeaderboardData } from "@/lib/leaderboard-data";

export async function GET() {
  try {
    const data = await getLeaderboardData();
    const leaderboard = data.leaderboard.map(({ slug: _slug, confidenceInterval: _ci, ...rest }) => rest);

    return NextResponse.json({
      leaderboard,
      totalVotes: data.totalVotes,
      isSignificant: data.isSignificant,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
