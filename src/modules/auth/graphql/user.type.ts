import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

export const genderType = new GraphQLEnumType({
  name: "GenderType",
  values: {
    male: { value: "male" },
    female: { value: "female" },
  },
});
export const userTypeObject = new GraphQLObjectType({
  name: "getUser",
  fields: {
    _id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    address: { type: GraphQLString },
    phone: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
    age: { type: GraphQLInt },
    specielization: { type: GraphQLString },
    gender: { type: genderType },
  },
});
