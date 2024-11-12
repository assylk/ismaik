import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    // Generate quiz using Gemini
    const prompt = `Create a quiz with 5 multiple choice questions based on this text: "${content}"
      Return your response in this exact JSON format:
      {
        "questions": [
          {
            "question": "Question text here?",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Option 1"
          }
        ]
      }
      Make sure to:
      1. Use valid JSON syntax
      2. Include exactly 5 questions
      3. Provide 4 options for each question
      4. Include the correct answer in the options array`;

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

    // Clean and prepare the string for parsing
    jsonStr = jsonStr.replace(/[\n\r]/g, ' ') // Remove newlines
                    .replace(/\s+/g, ' ')      // Normalize spaces
                    .replace(/^[^{]*/, '')     // Remove any text before the first {
                    .replace(/}[^}]*$/, '}')   // Remove any text after the last }
                    .trim();                   // Trim whitespace

    // Log the cleaned string
    console.log("[CLEANED_JSON_STRING]", jsonStr);

    // Try to find JSON content with more flexible matching
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[JSON_EXTRACTION_FAILED]", jsonStr);
      return NextResponse.json(defaultResponse);
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // Try to fix common JSON issues
      const fixedJsonStr = jsonMatch[0]
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Fix unquoted property names
        .replace(/'/g, '"'); // Replace single quotes with double quotes
      
      try {
        parsedData = JSON.parse(fixedJsonStr);
      } catch (finalError) {
        console.error("[JSON_PARSE_ERROR]", {
          original: jsonMatch[0],
          fixed: fixedJsonStr,
          error: finalError
        });
        throw new Error("Failed to parse AI response into valid JSON");
      }
    }

    // Validate the response structure
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      throw new Error("Invalid response structure");
    }

    // Validate each question
    parsedData.questions.forEach((q: any, index: number) => {
      if (!q.question || !q.options || !q.correctAnswer) {
        throw new Error(`Invalid question structure at index ${index}`);
      }
      if (!q.options.includes(q.correctAnswer)) {
        throw new Error(`Correct answer not found in options at question ${index + 1}`);
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