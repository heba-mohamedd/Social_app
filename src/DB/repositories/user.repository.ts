import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import UserModel, { IUser } from "../models/user.model";
import { AppError } from "../../common/utils/global-error-handler";

import { generateOtp, sendEmail } from "../../common/utils/email/send.email";
import { eventEmitter } from "../../common/utils/email/email.events";
import { emailTemplete } from "../../common/utils/email/email.templete";
import { Hash } from "../../common/utils/security/hash.security";

class UserRepository extends BaseRepository<IUser> {
  constructor(protected readonly model: Model<IUser> = UserModel) {
    super(model);
  }

  async checkUserAccount(email: string) {
    const user = await this.findOne({ filter: { email } });

    if (user) {
      throw new AppError("email already exist", 409);
    }

    return user;
  }
}

export default UserRepository;
