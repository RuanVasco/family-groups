import { StatusEnum } from "../Enum/StatusEnum";
import { BranchType } from "./BranchType";
import { FamilyGroupType } from "./FamilyGroupType";
import { UserType } from "./UserType";

export interface FarmerType {
  registrationNumber: String;
  name: string;
  familyGroup?: FamilyGroupType;
  status: StatusEnum;
  branch?: BranchType;
  technician?: UserType;
  ownedArea?: number;
  leasedArea?: number;
}
