import mongoose from "mongoose";

// Singleton settings document — kitchen live switch + delivery charge
const settingSchema = new mongoose.Schema({
  key: { type: String, default: "general", unique: true },
  kitchenLive: { type: Boolean, default: false },
  deliveryCharge: { type: Number, default: 0, min: 0 },
});

export const Setting = mongoose.model("Setting", settingSchema);
