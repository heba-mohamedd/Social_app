"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const user_type_1 = require("./user.type");
const auth_service_1 = __importDefault(require("../auth.service"));
const authentication_1 = require("../../../common/middleware/authentication");
const users = [
    {
        id: 1,
        name: "heba",
        age: 21,
        specielization: "MERN Stack",
        gender: "female",
    },
    {
        id: 2,
        name: "mohamed",
        age: 22,
        specielization: "MERN Stack",
        gender: "male",
    },
    {
        id: 3,
        name: "norhan",
        age: 21,
        specielization: "MERN Stack",
        gender: "female",
    },
    {
        id: 4,
        name: "sara",
        age: 22,
        specielization: "MERN Stack",
        gender: "female",
    },
    {
        id: 5,
        name: "mariam",
        age: 23,
        specielization: "MERN Stack",
        gender: "female",
    },
];
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
                resolve: async (parent, args, context) => {
                    const { user, decoded } = await (0, authentication_1.authentication_gql)(context.req.headers.authorization);
                    console.log(user);
                    return await auth_service_1.default.getUser(user._id);
                },
            },
        };
    };
}
exports.default = new UserFields();
