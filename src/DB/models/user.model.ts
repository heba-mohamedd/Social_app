import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enum/user.enum";

export interface IUser {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  age: number;
  phone?: string;
  address?: string;
  gender?: GenderEnum;
  role?: RoleEnum;
  confirmed?: boolean;
  provider?: ProviderEnum;
  changeCredential?: Date;
  deletedAt?: string;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 25,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 25,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: IUser): boolean {
        return this.provider !== ProviderEnum.google;
      },
      trim: true,
      minlength: 6,
    },
    age: {
      type: Number,
      required: function (this: IUser): boolean {
        return this.provider !== ProviderEnum.google;
      },
      min: 15,
      max: 60,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },

    confirmed: Boolean,
    deletedAt: String,
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
      default: GenderEnum.male,
    },
    provider: {
      type: String,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.system,
    },
    role: {
      type: String,
      enum: Object.values(RoleEnum),
      default: RoleEnum.user,
    },
    changeCredential: Date,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function (this: UserDocument) {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (this: UserDocument, value: string) {
    const [firstName, lastName] = value.split(" ");
    this.set({
      firstName,
      lastName: lastName || "",
    });
  });

function excludeDeleted(this: any) {
  const { paranoid, ...rest } = this.getQuery();

  if (paranoid == false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } });
  }
}
userSchema.pre("find", excludeDeleted);
userSchema.pre("findOne", excludeDeleted);

const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default UserModel;
