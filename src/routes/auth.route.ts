import { Router } from "express";
import { AuthController, registerValidation, loginValidation } from "../controllers/auth.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middelware.js";

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

router.post('/register',
  registerValidation,
  authController.register.bind(authController)
);

router.post('/login',
  loginValidation,
  authController.login.bind(authController)
);

router.post('/refresh',
  authController.refreshToken.bind(authController)
);

router.post('/logout',
  authController.logout.bind(authController)
);

router.get('/me', 
  authMiddleware.authenticate.bind(authMiddleware),
  authController.me.bind(authController)
);
