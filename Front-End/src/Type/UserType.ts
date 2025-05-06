import { BranchType } from "./BranchType";

export interface UserType {
  id: number;
  username: string;
  name: string;
  password?: string;
  roles: string[];
  branch?: BranchType;
}
