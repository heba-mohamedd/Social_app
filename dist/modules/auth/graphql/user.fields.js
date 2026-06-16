"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const user_type_1 = require("./user.type");
const auth_service_1 = __importDefault(require("../auth.service"));
const authentication_1 = require("../../../common/middleware/authentication");
const authorization_1 = require("../../../common/middleware/authorization");
const user_enum_1 = require("../../../common/enum/user.enum");
const validation_1 = require("../../../common/middleware/validation");
class UserFields {
    constructor() { }
    query = () => {
        return {
            listUsers: {
                type: new graphql_1.GraphQLList(user_type_1.userTypeObject),
                resolve: async () => {
                    return await auth_service_1.default.getUsers();
                },
            },
            getUser: {
                type: user_type_1.userTypeObject,
                args: { token: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) } },
                resolve: async (parent, args, context) => {
                    await (0, validation_1.Validation_GQL)(user_type_1.getUserSchema, args.token);
                    const { user, decoded } = await (0, authentication_1.authentication_gql)(args.token);
                    await (0, authorization_1.authorization_gql)(Object.values(user_enum_1.RoleEnum), user.role);
                    return await auth_service_1.default.getUser(user._id);
                },
            },
        };
    };
}
exports.default = new UserFields();
