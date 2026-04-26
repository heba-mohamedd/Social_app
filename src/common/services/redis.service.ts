import { createClient } from "redis";
import { REDIS_URL } from "../../config/config.service";
import { Types } from "mongoose";
import { EmailEnum } from "../enum/email.enum";

class RedisServise {
  private readonly client;
  constructor() {
    this.client = createClient({
      url: REDIS_URL!,
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

  revoked_key = ({ userId, jti }: { userId: Types.ObjectId; jti: string }) => {
    return `revoke_token::${userId}::${jti}`;
  };

  get_key = (userId: Types.ObjectId) => {
    return `revoke_token::${userId}`;
  };

  otp_key = ({
    email,
    subject = EmailEnum.confirmEmail,
  }: {
    email: string;
    subject: EmailEnum;
  }) => {
    return `otp::${email}::${subject}`;
  };
  max_otp_key = ({ email, subject }: { email: string; subject: EmailEnum }) => {
    return `${this.otp_key({ email, subject })}::max_tries`;
  };
  block_otp_key = ({
    email,
    subject,
  }: {
    email: string;
    subject: EmailEnum;
  }) => {
    return `${this.otp_key({ email, subject })}::block`;
  };
  /******************************************************************/
  count_login_key = (email: string) => {
    return `login::${email}::max_tries`;
  };
  blocked_login_key = (email: string) => {
    return `login::${email}::blocked`;
  };
  /******************************************************************/
  setValue = async ({
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
        return await this.client.set(key, data, { EX: ttl });
      }

      return await this.client.set(key, data);
    } catch (error) {
      console.log("error to set data in redis", error);
      return null;
    }
  };

  updateValue = async ({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: string | number | object;
    ttl?: number;
  }): Promise<string | null> => {
    try {
      const exists = await this.client.exists(key);

      if (!exists) {
        return null;
      }
      const payload: any = {
        key,
        value,
      };

      if (ttl) payload.ttl = ttl;

      return await this.setValue(payload);
    } catch (error) {
      console.log("error to update data in redis", error);
      return null;
    }
  };

  getValue = async (key: string) => {
    // const data = await this.client.get(key);
    // if (!data) return null;

    // try {
    //   return JSON.parse(data);
    // } catch {
    //   return data;
    // }

    try {
      try {
        return JSON.parse((await this.client.get(key)) as string);
      } catch (error) {
        return await this.client.get(key);
      }
    } catch (error) {
      console.log("error to get data in redis", error);
    }
  };

  exists = async (key: string) => {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.log("error to check data exists in redis", error);
    }
  };

  get_ttl = async (key: string) => {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.log("error to get ttl from redis", error);
    }
  };

  keys = async (pattern: string) => {
    try {
      return await this.client.keys(`${pattern}*`);
    } catch (error) {
      console.log("error to get keys from redis", error);
    }
  };

  deleteKey = async (key: string | string[]) => {
    try {
      if (!key.length) return 0;
      return await this.client.del(key);
    } catch (error) {
      console.log("error to delete data in redis", error);
    }
  };

  expire = async (key: string, ttl: number) => {
    try {
      return await this.client.expire(key, ttl);
    } catch (error) {
      console.log("error to delete data in redis", error);
    }
  };

  incr = async (key: string) => {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.log("error to incr operation", error);
    }
  };
}

export default new RedisServise();
