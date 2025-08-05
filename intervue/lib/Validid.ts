import mongoose from "mongoose";

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && (new mongoose.Types.ObjectId(id)).toString() === id;
}
