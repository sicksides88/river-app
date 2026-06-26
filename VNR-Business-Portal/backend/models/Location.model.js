import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      type: String,
      required: [true, "La dirección es requerida"],
      trim: true,
    },
    formatted_address: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    type: {
      type: String,
      enum: ["pickup", "dropoff", "both"],
      default: "both",
    },
    label: {
      type: String,
      enum: ["home", "work", "other"],
      default: "other",
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    usageCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para búsquedas rápidas
locationSchema.index({ user: 1, lastUsed: -1 });
locationSchema.index({ user: 1, usageCount: -1 });

// Método para actualizar el uso de una ubicación
locationSchema.methods.updateUsage = function () {
  this.lastUsed = Date.now();
  this.usageCount += 1;
  return this.save();
};

const Location = mongoose.model("Location", locationSchema);

export default Location;

