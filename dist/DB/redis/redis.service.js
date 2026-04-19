"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incr = exports.expire = exports.deleteKey = exports.keys = exports.get_ttl = exports.exists = exports.get = exports.update = exports.setValue = exports.blocked_login_key = exports.count_login_key = exports.block_otp_key = exports.max_otp_key = exports.otp_key = exports.get_key = exports.revoked_key = void 0;
const email_enum_js_1 = require("../../common/enum/email.enum.js");
const redis_db_js_1 = require("./redis.db.js");
const revoked_key = ({ userId, jti, }) => {
    return `revoke_token::${userId}::${jti}`;
};
exports.revoked_key = revoked_key;
const get_key = ({ userId }) => {
    return `revoke_token::${userId}`;
};
exports.get_key = get_key;
const otp_key = ({ email, subject = email_enum_js_1.EmailEnum.confirmEmail, }) => {
    return `otp::${email}::${subject}`;
};
exports.otp_key = otp_key;
const max_otp_key = ({ email, subject, }) => {
    return `${(0, exports.otp_key)({ email, subject })}::max_tries`;
};
exports.max_otp_key = max_otp_key;
const block_otp_key = ({ email, subject, }) => {
    return `${(0, exports.otp_key)({ email, subject })}::block`;
};
exports.block_otp_key = block_otp_key;
const count_login_key = ({ email }) => {
    return `login::${email}::max_tries`;
};
exports.count_login_key = count_login_key;
const blocked_login_key = ({ email }) => {
    return `login::${email}::blocked`;
};
exports.blocked_login_key = blocked_login_key;
const setValue = async ({ key, value, ttl, }) => {
    try {
        const data = typeof value === "string" ? value : JSON.stringify(value);
        if (ttl) {
            return await redis_db_js_1.redisClient.set(key, data, { EX: ttl });
        }
        return await redis_db_js_1.redisClient.set(key, data);
    }
    catch (error) {
        console.log("error to set data in redis", error);
        return null;
    }
};
exports.setValue = setValue;
const update = async ({ key, value, ttl, }) => {
    try {
        const exists = await redis_db_js_1.redisClient.exists(key);
        if (!exists) {
            return null;
        }
        const payload = {
            key,
            value,
        };
        if (ttl)
            payload.ttl = ttl;
        return await (0, exports.setValue)(payload);
    }
    catch (error) {
        console.log("error to update data in redis", error);
        return null;
    }
};
exports.update = update;
const get = async (key) => {
    const data = await redis_db_js_1.redisClient.get(key);
    if (!data)
        return null;
    try {
        return JSON.parse(data);
    }
    catch {
        return data;
    }
};
exports.get = get;
const exists = async (key) => {
    try {
        return await redis_db_js_1.redisClient.exists(key);
    }
    catch (error) {
        console.log("error to check data exists in redis", error);
    }
};
exports.exists = exists;
const get_ttl = async (key) => {
    try {
        return await redis_db_js_1.redisClient.ttl(key);
    }
    catch (error) {
        console.log("error to get ttl from redis", error);
    }
};
exports.get_ttl = get_ttl;
const keys = async (pattern) => {
    try {
        return await redis_db_js_1.redisClient.keys(`${pattern}*`);
    }
    catch (error) {
        console.log("error to get keys from redis", error);
    }
};
exports.keys = keys;
const deleteKey = async (key) => {
    try {
        if (!key.length)
            return 0;
        return await redis_db_js_1.redisClient.del(key);
    }
    catch (error) {
        console.log("error to delete data in redis", error);
    }
};
exports.deleteKey = deleteKey;
const expire = async (key, ttl) => {
    try {
        return await redis_db_js_1.redisClient.expire(key, ttl);
    }
    catch (error) {
        console.log("error to delete data in redis", error);
    }
};
exports.expire = expire;
const incr = async (key) => {
    try {
        return await redis_db_js_1.redisClient.incr(key);
    }
    catch (error) {
        console.log("error to incr operation", error);
    }
};
exports.incr = incr;
