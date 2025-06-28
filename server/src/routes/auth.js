"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = void 0;
const express_1 = require("express");
const google_auth_library_1 = require("google-auth-library");
const dotenv_1 = require("dotenv");
const User_1 = __importDefault(require("../model/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const axios_1 = __importDefault(require("axios"));
(0, dotenv_1.config)();
const authClient = new google_auth_library_1.OAuth2Client({
    client_id: process.env.GOOGLE_CLIENT_ID,
});
const router = (0, express_1.Router)();
const validateUser = (authCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1️⃣ Exchange auth code for tokens
        const tokenResponse = yield axios_1.default.post("https://oauth2.googleapis.com/token", {
            code: authCode,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: "postmessage", // For client-side apps use 'postmessage'
            grant_type: "authorization_code",
        });
        const { id_token } = tokenResponse.data;
        if (!id_token) {
            throw new Error("ID token not found in token response");
        }
        // 2️⃣ Verify the ID token
        const authRes = yield authClient.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = authRes.getPayload();
        return authRes;
    }
    catch (error) {
        console.error("Error validating user:", error);
        throw new Error("User validation failed");
    }
});
exports.validateUser = validateUser;
const getAuthToken = (user) => {
    const token = jsonwebtoken_1.default === null || jsonwebtoken_1.default === void 0 ? void 0 : jsonwebtoken_1.default.sign({
        email: user.email,
        name: user.name,
        userId: user._id.toString(),
    }, process.env.JWT_AUTH_SECRET_KEY, { expiresIn: "10d" });
    return token;
};
router.post("/google", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.body.token;
    const authRes = yield (0, exports.validateUser)(token);
    const { email, name, picture } = authRes.getPayload();
    let user = yield User_1.default.findOne({ email: email });
    if (!user) {
        user = yield User_1.default.create({
            email: email,
            name: name,
            img: picture,
            type: "Verified",
        });
    }
    const authToken = getAuthToken(user);
    return res.status(200).send({
        message: "done",
        authToken: authToken,
    });
}));
router.use(auth_1.verify);
router.get("/details", auth_1.verify, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findOne({ _id: req.user.userId });
    res.status(200).send(user);
    return;
}));
exports.default = router;
