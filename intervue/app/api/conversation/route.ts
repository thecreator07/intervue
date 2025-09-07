import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
import dbConnect from "@/db";
import SessionModel, { Messagedata } from "@/models/session.model";
import { isValidObjectId } from "@/lib/Validid";
import { openai } from "@/lib/OpenAI";
import { systemPrompts } from "@/lib/prompt";
import EvaluationModel from "@/models/evaluation.model";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

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
    // const session = await getServerSession();
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

        // Prepare the Q&A text for AI evaluation
        const QAndAText = TotalQA.map((qa, idx) => `Q${idx + 1}: ${qa.question}\nA${idx + 1}: ${qa.answer}`).join('\n\n');
        // inserting AI based evaluation
        const ResultWithRatingAndFeedback = await openai.chat.completions.create({
            model: 'gemini-2.0-flash',
            messages: [
                { role: "system", content: systemPrompts.rateAndfeedback },
                { role: "user", content: QAndAText }
            ], response_format: { type: "json_object" },
        })
        const result = ResultWithRatingAndFeedback.choices[0].message.content;
        if (!result) {
            return NextResponse.json(
                { success: false, message: "No feedback returned from AI" },
                { status: 500 }
            );
        }

        // processing conversation data to extract summary
        const conversationWithRatingAndFeedback = JSON.parse(result).map((qa: Messagedata, idx: number) => `Q${idx + 1}: ${qa.question}\nA${idx + 1}: ${qa.answer}\nR ${qa.rating}\nF ${qa.feedback}`).join('\n\n');
        const summary = await openai.chat.completions.create({
            model: 'gemini-2.0-flash',
            messages: [
                { role: "system", content: systemPrompts.Summary },
                { role: "user", content: `Summarize the following conversation:\n\n${conversationWithRatingAndFeedback}` }
            ]
        })

        // console.log("Summary:", summary.choices[0].message.content)

        const evaluationData = await openai.chat.completions.create({
            model: 'gemini-2.0-flash',
            messages: [
                { role: "system", content: systemPrompts.Evaluator },
                { role: "user", content: `Evaluate the following conversation:\n\n${conversationWithRatingAndFeedback}` }
            ], response_format: { type: "json_object" }
        })

        const wholeEvaluation = evaluationData.choices[0].message.content
        if (!wholeEvaluation) {
            return NextResponse.json(
                { success: false, message: "No evauation returned" }
            )
        }
        const parsedData = JSON.parse(wholeEvaluation);

        await EvaluationModel.create({
            sessionId,
            ...parsedData
        });

        await SessionModel.updateOne(
            { _id: sessionId },
            {
                $set: {
                    conversation: JSON.parse(result),
                    isEvaluated: true,
                    summary: summary.choices[0].message.content
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

export async function GET(req: NextRequest) {
    await dbConnect()
    const session = await getServerSession(authOptions)
    const user: User = session?.user
    if (!session || !user) {
        return Response.json(
            {
                success: true,
                message: 'Not authenticated',
            },
            { status: 200 }
        );
    }

    try {
        const sessionId = req.nextUrl.searchParams.get('sessionId');
        if (!sessionId || !isValidObjectId(sessionId)) {
            return NextResponse.json(
                { success: false, message: "Invalid session ID" },
                { status: 400 }
            );
        }

        const conversationData = await SessionModel.findById(sessionId).select("-context");
        if (!conversationData) {
            return NextResponse.json(
                { success: false, message: "Conversation not found" },
                { status: 404 }
            );
        }

        const evaluationData = await EvaluationModel.findOne({ sessionId });
        if (!evaluationData) {
            return NextResponse.json(
                { success: false, message: "Evaluation data not found" },
                { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: { conversationData, evaluationData },
            message: "Data fetched successfully"
        }, { status: 200 });

    } catch (error: unknown) {
        console.error("Fetch data error:", error instanceof Error ? error : "Unexpected error happened!");
        return NextResponse.json(
            { success: false, message: "Failed to fetch data" },
            { status: 500 }
        );
    }
}
