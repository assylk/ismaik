import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!chapterId) {
      return new NextResponse("Chapter ID is required", { status: 400 });
    }

    // Fetch quiz history for the user and chapter
    const quizHistory = await db.quizResult.findMany({
      where: {
        userId: userId,
        chapterId: chapterId,
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        score: true,
        totalQuestions: true,
        answers: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      history: quizHistory
    });

  } catch (error) {
    console.error("[QUIZ_HISTORY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 