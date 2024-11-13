import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      courseId,
      chapterId,
      score,
      totalQuestions,
      answers
    } = await req.json();

    // Calculate XP based on correct answers (1 XP per correct answer)
    const correctAnswers = answers.filter((answer: any) => answer.isCorrect);
    const xpToAdd = correctAnswers.length;

    // Update user's XP
    const user = await clerkClient.users.getUser(userId);
    const currentXp = user.publicMetadata.xp as number || 0;
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        xp: currentXp + xpToAdd
      }
    });

    const quizResult = await db.quizResult.create({
      data: {
        userId,
        courseId,
        chapterId,
        score,
        totalQuestions,
        answers: {
          create: answers.map((answer: any) => ({
            question: answer.question,
            userAnswer: answer.userAnswer,
            correctAnswer: answer.correctAnswer,
            isCorrect: answer.isCorrect
          }))
        }
      }
    });

    return NextResponse.json(quizResult);
  } catch (error) {
    console.error("[QUIZ_RESULTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 