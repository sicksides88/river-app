import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceType: {
      type: String,
      enum: ["envio", "flete"],
      required: true,
    },
    deliveryType: {
      type: String,
      enum: ["enviar", "recibir"],
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
      contactName: String,
      contactPhone: String,
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
      contactName: String,
      contactPhone: String,
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      hour: Number,
      minute: Number,
    },
    packageDetails: {
      description: String,
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      isFragile: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "picked-up",
        "in-transit",
        "delivered",
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
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    trackingNumber: {
      type: String,
      unique: true,
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

// Generar número de tracking único antes de guardar
deliverySchema.pre("save", function (next) {
  if (!this.trackingNumber) {
    this.trackingNumber = `DEL${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;
  }
  next();
});

// Índices para búsquedas
deliverySchema.index({ user: 1, createdAt: -1 });
deliverySchema.index({ trackingNumber: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ driver: 1, status: 1 });

const Delivery = mongoose.model("Delivery", deliverySchema);

export default Delivery;

