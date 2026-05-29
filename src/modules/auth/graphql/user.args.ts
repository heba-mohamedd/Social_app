import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import { genderType } from "./user.type";

export const getUserArgs = {
  id: { type: new GraphQLNonNull(GraphQLInt) },
};

export const createUserArgs = {
  id: { type: new GraphQLNonNull(GraphQLInt) },
  name: { type: new GraphQLNonNull(GraphQLString) },
  age: { type: new GraphQLNonNull(GraphQLInt) },
  specielization: { type: new GraphQLNonNull(GraphQLString) },
  gender: { type: new GraphQLNonNull(genderType) },
};
