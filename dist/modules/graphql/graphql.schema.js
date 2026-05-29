"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gql_schema = void 0;
const graphql_1 = require("graphql");
const user_fields_1 = __importDefault(require("../auth/graphql/user.fields"));
exports.gql_schema = new graphql_1.GraphQLSchema({
    query: new graphql_1.GraphQLObjectType({
        name: "Query",
        description: "query info",
        fields: {
            ...user_fields_1.default.query(),
        },
    }),
});
