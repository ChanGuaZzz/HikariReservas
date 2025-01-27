import bcrypt from "bcrypt";
import User from "../models/User.js";
import { Op } from "sequelize";

const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    console.log("Invalid user data");
    return res.status(400).json({ message: "Invalid user data" });
  }

  if (!Number.isInteger(Number(phone))) {
    console.log("El teléfono es incorrecto");
    return res.status(400).json({ message: "El teléfono es incorrecto" });
  }

  const userExists = await User.findOne({
    where: {
      [Op.or]: [{ email }, { phone }],
    },
  });

  if (userExists) {
    console.log(userExists);
    res.status(400).json({ message: "El telefono o el correo ya esta en uso" });
    return console.log("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    if (user) {
      console.log("User created successfully");
      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        message: "User created successfully",
      });
    } else {
      console.log("Invalid user data");

      return res.status(400);
    }
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      console.log(error);
      return res.status(400).json({ message: "Verifica el correo" });
    } else {
      console.log(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
console.log("USUARIO", req.session);
    if (user && user.checkPassword(password)) {
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      };

      req.session.save();
      console.log("SESSIONES", req.session);
      console.log("LOGUEADO CORRECTAMENTE");

      res.status(200).json({
        session: req.session,
        message: "User logged in successfully",
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
      console.log("ERROR AL LOGUEAR");
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const logoutUser = (req, res) => {
  console.log("LOGOUT");
  console.log(req.session);
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar la sesión:", err);
      return res.status(500).json({ message: "No se pudo cerrar la sesión" });
    } else {
      console.log(req.session);
      return res.status(200).json({ message: "Sesión cerrada exitosamente" });
    }
  });
};

const changePassword = async (req, res) => {
  try {
    const { email, password, newPassword } = req.body;

    if (!email || !password || !newPassword) {
      return res.status(400).json({ message: "Missing data" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.checkPassword(password)) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
export { registerUser, loginUser, logoutUser, changePassword };
