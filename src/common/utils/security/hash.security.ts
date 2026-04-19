import { hash, compare } from "bcrypt";
import { SALT_ROUNDS } from "../../../config/config.service";
type HashParams = {
  plainText: string;
  salt_Rounds?: number;
};

type CompareParams = {
  plainText: string;
  cipherText: string;
};

export const Hash = async({
  plainText,
  salt_Rounds = SALT_ROUNDS,
}: HashParams): Promise<string> => {
  return await hash(plainText, salt_Rounds);
};

export const Compare = async ({
  plainText,
  cipherText,
}: CompareParams): Promise<boolean> => {
  return await compare(plainText, cipherText);
};
