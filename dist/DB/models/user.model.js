"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_enum_1 = require("../../common/enum/user.enum");
const userSchema = new mongoose_1.default.Schema({
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
        required: function () {
            return this.provider !== user_enum_1.ProviderEnum.google;
        },
        trim: true,
        minlength: 6,
    },
    age: {
        type: Number,
        required: true,
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
    gender: {
        type: String,
        enum: Object.values(user_enum_1.GenderEnum),
        default: user_enum_1.GenderEnum.male,
    },
    provider: {
        type: String,
        enum: Object.values(user_enum_1.ProviderEnum),
        default: user_enum_1.ProviderEnum.system,
    },
    role: {
        type: String,
        enum: Object.values(user_enum_1.RoleEnum),
        default: user_enum_1.RoleEnum.user,
    },
    changeCredential: Date,
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("userName")
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
})
    .set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.set({
        firstName,
        lastName: lastName || "",
    });
});
const UserModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = UserModel;
