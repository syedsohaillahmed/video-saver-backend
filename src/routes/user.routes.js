import { Router } from "express";
import {
  chnagePassword,
  loginUser,
  logoutUser,
  refreshExistingAccessTokens,
  registerUser,
  updateUserAvatar,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes

router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-accesstoken").post(refreshExistingAccessTokens);
router.route("/change-password").put(verifyJwt, chnagePassword);
router.route("/update-user-details").put(verifyJwt, updateUserDetails);
router.route("/update-user-avatar").put(upload.single("avatar"), verifyJwt, updateUserAvatar);

export default router;
