import mongoose, { Schema, Types } from "mongoose";


export interface Messagedata extends Document {
    question: string
    answer: string
    rating?: string
    feedback?: string
}


const MessageSchema: Schema<Messagedata> = new mongoose.Schema({
    question: { type: String },
    answer: { type: String },
    rating: { type: String, },
    feedback: { type: String },
},{timestamps:true});

export interface SessionData extends mongoose.Document {
    _id:string
    userId: Types.ObjectId | string
    context: string
    sessionTitle?: string
    conversation: Messagedata[]
    resumeName: string
    summary?:string
    createdAt?: Date
    updatedAt?: Date
    isEvaluated?: boolean
}

const SessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    context: { type: String, required: true },
    sessionTitle: { type: String, default: "Interview Session" },
    conversation: [MessageSchema],
    summary:{type:String},
    resumeName: { type: String, required: true },
    isEvaluated: { type: Boolean, default: false }
}, { timestamps: true });


const SessionModel = mongoose.models.Session || mongoose.model("Session", SessionSchema);
export default SessionModel;

