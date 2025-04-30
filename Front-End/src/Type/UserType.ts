import { BranchType } from "./BranchType";

export interface UserType {
  id: number;
  username: string;
  password?: string;
  roles: string[];
  branch?: BranchType;
}
