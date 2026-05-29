import { GraphQLObjectType, GraphQLSchema } from "graphql";
import userFields from "../auth/graphql/user.fields";

export const gql_schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query", // it is  the root query
    description: "query info",
    fields: {
      ...userFields.query(),
    },
  }),
  //   mutation: new GraphQLObjectType({
  //     name: "mutation",
  //     fields: {
  //       ...userFields.mutation(),
  //     },
  //   }),
});
