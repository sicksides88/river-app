import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceType: {
      type: String,
      enum: ["vuelta-segura", "chofer"],
      required: true,
    },
    pickup: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    dropoff: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      hour: Number,
      minute: Number,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "driver-assigned",
        "in-progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    estimatedPrice: {
      type: Number,
    },
    actualPrice: {
      type: Number,
    },
    distance: {
      type: Number, // en kilómetros
    },
    duration: {
      type: Number, // en minutos
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para búsquedas
rideSchema.index({ user: 1, createdAt: -1 });
rideSchema.index({ status: 1 });
rideSchema.index({ driver: 1, status: 1 });

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;

