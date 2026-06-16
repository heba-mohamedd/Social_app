import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { AppError } from "../../../common/utils/global-error-handler";
import { genderType, getUserSchema, userTypeObject } from "./user.type";
import { createUserArgs, getUserArgs } from "./user.args";
import authService from "../auth.service";
import { authentication_gql } from "../../../common/middleware/authentication";
import { authorization_gql } from "../../../common/middleware/authorization";
import { RoleEnum } from "../../../common/enum/user.enum";
import { Validation_GQL } from "../../../common/middleware/validation";

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
        args: { token: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: async (parent: any, args: any, context: any) => {
          await Validation_GQL(getUserSchema, args.token);
          // console.log({ context: context.req.raw.user._id });
          const { user, decoded } = await authentication_gql(args.token);
          await authorization_gql(Object.values(RoleEnum), user.role!);
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
