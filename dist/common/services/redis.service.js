"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const config_service_1 = require("../../config/config.service");
const email_enum_1 = require("../enum/email.enum");
class RedisServise {
    client;
    constructor() {
        this.client = (0, redis_1.createClient)({
            url: config_service_1.REDIS_URL,
        });
        this.handleEvents();
    }
    async connect() {
        await this.client.connect();
        console.log("Connected to Redis successfully!");
    }
    handleEvents() {
        this.client.on("error", (error) => {
            console.log("Connect to Redis if Failed !", error);
        });
    }
    revoked_key = ({ userId, jti }) => {
        return `revoke_token::${userId}::${jti}`;
    };
    get_key = (userId) => {
        return `revoke_token::${userId}`;
    };
    otp_key = ({ email, subject = email_enum_1.EmailEnum.confirmEmail, }) => {
        return `otp::${email}::${subject}`;
    };
    max_otp_key = ({ email, subject }) => {
        return `${this.otp_key({ email, subject })}::max_tries`;
    };
    block_otp_key = ({ email, subject, }) => {
        return `${this.otp_key({ email, subject })}::block`;
    };
    count_login_key = (email) => {
        return `login::${email}::max_tries`;
    };
    blocked_login_key = (email) => {
        return `login::${email}::blocked`;
    };
    setValue = async ({ key, value, ttl, }) => {
        try {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            if (ttl) {
                return await this.client.set(key, data, { EX: ttl });
            }
            return await this.client.set(key, data);
        }
        catch (error) {
            console.log("error to set data in redis", error);
            return null;
        }
    };
    updateValue = async ({ key, value, ttl, }) => {
        try {
            const exists = await this.client.exists(key);
            if (!exists) {
                return null;
            }
            const payload = {
                key,
                value,
            };
            if (ttl)
                payload.ttl = ttl;
            return await this.setValue(payload);
        }
        catch (error) {
            console.log("error to update data in redis", error);
            return null;
        }
    };
    getValue = async (key) => {
        try {
            try {
                return JSON.parse((await this.client.get(key)));
            }
            catch (error) {
                return await this.client.get(key);
            }
        }
        catch (error) {
            console.log("error to get data in redis", error);
        }
    };
    exists = async (key) => {
        try {
            return await this.client.exists(key);
        }
        catch (error) {
            console.log("error to check data exists in redis", error);
        }
    };
    get_ttl = async (key) => {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            console.log("error to get ttl from redis", error);
        }
    };
    keys = async (pattern) => {
        try {
            return await this.client.keys(`${pattern}*`);
        }
        catch (error) {
            console.log("error to get keys from redis", error);
        }
    };
    deleteKey = async (key) => {
        try {
            if (!key.length)
                return 0;
            return await this.client.del(key);
        }
        catch (error) {
            console.log("error to delete data in redis", error);
        }
    };
    expire = async (key, ttl) => {
        try {
            return await this.client.expire(key, ttl);
        }
        catch (error) {
            console.log("error to delete data in redis", error);
        }
    };
    incr = async (key) => {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            console.log("error to incr operation", error);
        }
    };
}
exports.default = new RedisServise();
