"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const verify = (req, res, next) => {
    var _a, _b;
    try {
        let authToken = req.headers.authorization || req.headers.Authorization;
        authToken = (_b = (_a = authToken.split("Bearer")) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim();
        const decoded = jsonwebtoken_1.default.verify(authToken, process.env.JWT_AUTH_SECRET_KEY);
        if (decoded) {
            req.user = {
                email: decoded.email,
                name: decoded.name,
                userId: decoded.userId,
            };
            next();
        }
        else {
            res.status(400).send({
                message: "Login Required",
            });
            return;
        }
    }
    catch (error) {
        res.status(400).send({
            message: "Login Failed",
            error: error === null || error === void 0 ? void 0 : error.toString(),
        });
        return;
    }
};
exports.verify = verify;
