import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/db";
import SessionModel, { Messagedata } from "@/models/session.model";
import { isValidObjectId } from "@/lib/Validid";
import { openai } from "@/lib/OpenAI";
import { systemPrompts } from "@/lib/prompt";

export async function POST(req: NextRequest) {
    await dbConnect();


    try {
        const { sessionId, conversation } = await req.json();

        if (!sessionId || !isValidObjectId(sessionId)) {
            return NextResponse.json(
                { success: false, message: "Invalid session ID" },
                { status: 400 }
            );
        }

        if (!Array.isArray(conversation) || conversation.length === 0) {
            return NextResponse.json(
                { success: false, message: "Conversation must be a non-empty array" },
                { status: 400 }
            );
        }

        // Insert all messages at once
        await SessionModel.updateOne(
            { _id: sessionId },
            { $push: { conversation: { $each: conversation } } }
        );

        return NextResponse.json({ success: true, message: "Conversation inserted" }, { status: 200 });
    } catch (error) {
        console.error("Insert conversation error:", error);
        return NextResponse.json({ error: "Failed to insert conversation" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    await dbConnect();

    try {
        const { sessionId } = await req.json();

        if (!sessionId || !isValidObjectId(sessionId)) {
            return NextResponse.json(
                { success: false, message: "Invalid session ID" },
                { status: 400 }
            );
        }

        // Simulate evaluation logic (replace with actual AI or rubric logic)

        const sessionData = await SessionModel.findById(sessionId)
        if (!sessionData) {
            return NextResponse.json(
                { success: false, message: "Session not found" },
                { status: 404 }
            );
        }
        // console.log("Session Data:", sessionData);
        const TotalQA: Messagedata[] = sessionData.conversation as Messagedata[] || [];
        // console.log(TotalQA)
        if (TotalQA.length === 0) {
            return NextResponse.json(
                { success: false, message: "No conversation data found" },
                { status: 404 }
            );
        }
        // const conversation: Messagedata[] = [];
        TotalQA.forEach(async (qa) => {
            for (const qa of TotalQA) {
                const { question, answer } = qa;

                if (!question || !answer) {
                    continue; // Skip if question or answer is missing
                }

                const ResultWithRatingAndFeedback = await openai.chat.completions.create({
                    model: 'gemini-2.0-flash',
                    messages: [
                        { role: "system", content: systemPrompts.rateAndfeedback },
                        { role: "user", content: `Q: ${question}\nA: ${answer}` }
                    ]
                })

                return JSON.stringify(ResultWithRatingAndFeedback.choices[0].message.content);

            }
        })
        // After processing, update the conversation in the database
        await SessionModel.updateOne(
            { _id: sessionId },
            { 
            $set: { 
                conversation: TotalQA,
                evaluation: true
            } 
            }
        );
        return NextResponse.json({
            success: true,
            evaluation: true
        }, { status: 200 });
    } catch (error) {
        console.error("Evaluate Q&A error:", error);
        return NextResponse.json({ error: "Failed to evaluate Q&A" }, { status: 500 });
    }
}
