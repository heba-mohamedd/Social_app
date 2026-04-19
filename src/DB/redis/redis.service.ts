import { RedisArgument } from "redis";
import { EmailEnum } from "../../common/enum/email.enum.js";
import { redisClient } from "./redis.db.js";

export const revoked_key = ({
  userId,
  jti,
}: {
  userId: string;
  jti: string;
}) => {
  return `revoke_token::${userId}::${jti}`;
};

export const get_key = ({ userId }: { userId: string }) => {
  return `revoke_token::${userId}`;
};

export const otp_key = ({
  email,
  subject = EmailEnum.confirmEmail,
}: {
  email: string;
  subject: string;
}) => {
  return `otp::${email}::${subject}`;
};
export const max_otp_key = ({
  email,
  subject,
}: {
  email: string;
  subject: string;
}) => {
  return `${otp_key({ email, subject })}::max_tries`;
};
export const block_otp_key = ({
  email,
  subject,
}: {
  email: string;
  subject: string;
}) => {
  return `${otp_key({ email, subject })}::block`;
};
/******************************************************************/
export const count_login_key = ({ email }: { email: string }) => {
  return `login::${email}::max_tries`;
};
export const blocked_login_key = ({ email }: { email: string }) => {
  return `login::${email}::blocked`;
};
/******************************************************************/
export const setValue = async ({
  key,
  value,
  ttl,
}: {
  key: string;
  value: string | number | object;
  ttl?: number;
}): Promise<string | null> => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);

    if (ttl) {
      return await redisClient.set(key, data, { EX: ttl });
    }

    return await redisClient.set(key, data);
  } catch (error) {
    console.log("error to set data in redis", error);
    return null;
  }
};

export const update = async ({
  key,
  value,
  ttl,
}: {
  key: string;
  value: string | number | object;
  ttl?: number;
}): Promise<string | null> => {
  try {
    const exists = await redisClient.exists(key);

    if (!exists) {
      return null;
    }
    const payload: any = {
      key,
      value,
    };

    if (ttl) payload.ttl = ttl;

    return await setValue(payload);
  } catch (error) {
    console.log("error to update data in redis", error);
    return null;
  }
};

export const get = async (key: string) => {
  const data = await redisClient.get(key);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

export const exists = async (key: string) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log("error to check data exists in redis", error);
  }
};

export const get_ttl = async (key: string) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log("error to get ttl from redis", error);
  }
};

export const keys = async (pattern: string) => {
  try {
    return await redisClient.keys(`${pattern}*`);
  } catch (error) {
    console.log("error to get keys from redis", error);
  }
};

export const deleteKey = async (key: string) => {
  try {
    if (!key.length) return 0;
    return await redisClient.del(key);
  } catch (error) {
    console.log("error to delete data in redis", error);
  }
};

export const expire = async (key: string, ttl: number) => {
  try {
    return await redisClient.expire(key, ttl);
  } catch (error) {
    console.log("error to delete data in redis", error);
  }
};

export const incr = async (key: string) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.log("error to incr operation", error);
  }
};
