import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "Por favor ingresa tu nombre"],
      trim: true,
    },
    apellido: {
      type: String,
      required: [true, "Por favor ingresa tu apellido"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Por favor ingresa tu email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor ingresa un email válido",
      ],
    },
    password: {
      type: String,
      required: [true, "Por favor ingresa tu contraseña"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false,
    },
    telefono: {
      codigoPais: {
        type: String,
        default: "+54",
      },
      numero: {
        type: String,
        required: [true, "Por favor ingresa tu número de teléfono"],
      },
    },
    direccion: {
      type: String,
      required: [true, "Por favor ingresa tu dirección"],
    },
    role: {
      type: String,
      enum: ["user", "driver", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Encriptar contraseña antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para obtener datos públicos del usuario
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
