import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, chapterId } = await req.json();
    console.log("[QUIZ_ATTEMPTS_POST]", userId, chapterId);
    if (!userId || !chapterId) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    const attempts = await db.quizResult.count({
      where: {
        userId: userId,
        chapterId: chapterId,
      },
    });

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error("[QUIZ_ATTEMPTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}