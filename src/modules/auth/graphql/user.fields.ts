import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { AppError } from "../../../common/utils/global-error-handler";
import { genderType, userTypeObject } from "./user.type";
import { createUserArgs, getUserArgs } from "./user.args";
import authService from "../auth.service";
import { authentication_gql } from "../../../common/middleware/authentication";

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
  constructor() {}
  query = () => {
    return {
      // this are the queries
      //   getUser: {
      //     type: userTypeObject,
      //     args: getUserArgs,
      //     resolve: (parent: any, args: any) => {
      //       const user = users.find((user) => user.id == args.id);
      //       if (!user) {
      //         throw new AppError("user not found");
      //       }
      //       return user;
      //     },
      //   },
      listUsers: {
        type: new GraphQLList(userTypeObject),
        resolve: async () => {
          return await authService.getUsers();
        },
      },
      getUser: {
        type: userTypeObject,
        resolve: async (parent: any, args: any, context: any) => {
          // console.log({ context: context.req.raw.user._id });
          const { user, decoded } = await authentication_gql(
            context.req.headers.authorization!,
          );
          console.log(user);

          return await authService.getUser(user._id);
        },
      },
    };
  };
  //   mutation = () => {
  //     return {
  //       createUser: {
  //         type: userTypeObject,
  //         args: createUserArgs,
  //         resolve: (parent: any, args: any) => {
  //           const user = users.find((user) => user.id == args.id);
  //           if (user) {
  //             throw new AppError("user already exists");
  //           }
  //           users.push(args);
  //           return args;
  //         },
  //       },
  //     };
  //   };
}

export default new UserFields();
