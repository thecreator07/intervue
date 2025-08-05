import mongoose, { Schema, Document, Types } from "mongoose";



export interface SimpleScore {
  score: number;
  comment: string;
}

export interface EvaluationData extends Document {
  sessionId: Types.ObjectId|string; // Reference to Session
  communication: SimpleScore;
  technicalKnowledge: SimpleScore;
  problemSolving: SimpleScore;
  vocabulary: SimpleScore;
  explanationClarity: SimpleScore;
  perceivedDomainKnowledge: SimpleScore;
  responseStructure: SimpleScore;
  professionalTone: SimpleScore;
  keywordsUsedAcrossSession: string[];
  strengths: string[];
  areasOfImprovement: string[];
  hrInsights: {
    technicalCompetency: string;
    experienceLevel: string;
    learningPotential: string;
    culturalFit: string;
    // recommendation: "Hire" | "Hold" | "Not Hire";
    comments: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const SimpleScoreSchema:Schema<SimpleScore> = new Schema({
  score: { type: Number, required: true, default: 0 },
  comment: { type: String, required: true, default: "" },
}, { _id: false });

const HrInsightsSchema= new Schema({
  technicalCompetency: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  learningPotential: { type: String, required: true },
  culturalFit: { type: String, required: true },
//   recommendation: {
//     type: String,
//     enum: ["Hire", "Hold", "Not Hire"],
//     required: true,
//   },
  comments: { type: String, required: true },
}, { _id: false });

const SummaryEvaluationSchema = new Schema<EvaluationData>({
  sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  communication: { type: SimpleScoreSchema, required: true },
  technicalKnowledge: { type: SimpleScoreSchema, required: true },
  problemSolving: { type: SimpleScoreSchema, required: true },
  vocabulary: { type: SimpleScoreSchema, required: true },
  explanationClarity: { type: SimpleScoreSchema, required: true },
  perceivedDomainKnowledge: { type: SimpleScoreSchema, required: true },
  responseStructure: { type: SimpleScoreSchema, required: true },
  professionalTone: { type: SimpleScoreSchema, required: true },
  keywordsUsedAcrossSession: [{ type: String }],
  strengths: [{ type: String }],
  areasOfImprovement: [{ type: String }],
  hrInsights: { type: HrInsightsSchema, required: true },
}, { timestamps: true });

const EvaluationModel =
  mongoose.models.Evaluation ||
  mongoose.model<EvaluationData>("Evaluation", SummaryEvaluationSchema);

export default EvaluationModel;
