"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compare = exports.Hash = void 0;
const bcrypt_1 = require("bcrypt");
const config_service_1 = require("../../../config/config.service");
const Hash = async ({ plainText, salt_Rounds = config_service_1.SALT_ROUNDS, }) => {
    return await (0, bcrypt_1.hash)(plainText, salt_Rounds);
};
exports.Hash = Hash;
const Compare = async ({ plainText, cipherText, }) => {
    return await (0, bcrypt_1.compare)(plainText, cipherText);
};
exports.Compare = Compare;
