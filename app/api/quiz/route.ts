import { NextResponse,NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs";


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req: Request) {
  const { userId } = auth();
    if (!userId) {
      return redirect("/");
    }
  try {
    
    const user = await clerkClient.users.getUser(userId);
    const xp: any = user.publicMetadata.xp || 0;
    console.log("[XP]", xp);
    const { content } = await req.json();
    console.log("[CONTENT]", content);
    // Determine difficulty based on XP
    let difficulty;
    if (xp < 20) {
      difficulty = "beginner";
    } else if (xp < 60) {
      difficulty = "intermediate";
    } else {
      difficulty = "advanced";
    }

    // Modify prompt based on difficulty
    const prompt = `Create a ${difficulty}-level quiz with 5 multiple choice questions to test understanding of this chapter content: "${content.description}"
      
      The questions should:
      - Focus specifically on the key concepts and information presented in this chapter
      - Match a ${difficulty} difficulty level where:
        * beginner: focuses on basic recall and simple comprehension
        * intermediate: includes application and analysis of concepts
        * advanced: emphasizes complex analysis, evaluation, and synthesis of ideas
      - Test ${difficulty}-appropriate understanding of the material
      - Include an explanation for why the correct answer is right
      
      Return your response in this exact JSON format:
      {
        "questions": [
          {
            "question": "Question text here?",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Option 1",
            "explanation": "Detailed explanation of why this answer is correct and why others are incorrect"
          }
        ]
      }
      Make sure to:
      1. Use valid JSON syntax
      2. Include exactly 5 questions
      3. Provide 4 options for each question
      4. Include the correct answer in the options array
      5. Keep questions directly relevant to the chapter content
      6. Provide clear, educational explanations for each answer`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonStr = response.text();

    // Add a default structure in case parsing fails
    const defaultResponse = {
      questions: [{
        question: "Could not generate quiz. Please try again.",
        options: ["Try again", "Refresh page", "Use different content", "Contact support"],
        correctAnswer: "Try again"
      }]
    };

    // Log the raw response for debugging
    console.log("[RAW_AI_RESPONSE]", jsonStr);

    // Enhanced JSON cleaning and parsing
    jsonStr = jsonStr.replace(/```json|```/g, '') // Remove markdown code blocks
                    .replace(/[\n\r]/g, ' ')      // Remove newlines
                    .replace(/\s+/g, ' ')         // Normalize spaces
                    .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
                    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote unquoted keys
                    .replace(/:\s*'([^']*)'/g, ':"$1"') // Convert single to double quotes
                    .replace(/^[^{]*?(\{[\s\S]*\})[^}]*$/, '$1') // Extract only the JSON object
                    .trim();

    console.log("[CLEANED_JSON_STRING]", jsonStr);

    let parsedData;
    try {
        parsedData = JSON.parse(jsonStr);
    } catch (parseError) {
        console.error("[INITIAL_PARSE_ERROR]", parseError);
        
        // Additional fallback cleaning
        try {
            const fixedStr = jsonStr
                .replace(/\\/g, '')               // Remove escape characters
                .replace(/"\s+"/g, '" "')         // Fix spaces between quotes
                .replace(/}\s*{/g, '},{')         // Fix object separators
                .replace(/"\s*}/g, '"}')          // Fix trailing spaces before closing braces
                .replace(/{\s*"/g, '{"');         // Fix leading spaces after opening braces
            
            parsedData = JSON.parse(fixedStr);
        } catch (finalError) {
            console.error("[FINAL_PARSE_ERROR]", {
                original: jsonStr,
                error: finalError
            });
            return NextResponse.json(defaultResponse);
        }
    }

    // Validate the response structure
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      throw new Error("Invalid response structure");
    }

    // Validate each question
    parsedData.questions.forEach((q: any, index: number) => {
      if (!q.question || !q.options || !q.correctAnswer || !q.explanation) {
        console.error(`[VALIDATION_ERROR] Missing required fields in question ${index + 1}:`, q);
        throw new Error(`Invalid question structure at index ${index}`);
      }

      // Normalize strings for comparison
      const normalizedOptions = q.options.map((opt: string) => opt.trim().toLowerCase());
      const normalizedAnswer = q.correctAnswer.trim().toLowerCase();

      if (!normalizedOptions.includes(normalizedAnswer)) {
        console.error(`[VALIDATION_ERROR] Question ${index + 1}:`, {
          options: q.options,
          correctAnswer: q.correctAnswer
        });
        
        // Attempt to fix the issue by adding the correct answer if missing
        q.options[3] = q.correctAnswer; // Replace last option with correct answer
        console.log(`[VALIDATION_FIX] Added correct answer to options for question ${index + 1}`);
      }
    });

    return NextResponse.json(parsedData);
    
  } catch (error) {
    console.error("[QUIZ_GENERATION_ERROR]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Error", 
      { status: 500 }
    );
  }
}