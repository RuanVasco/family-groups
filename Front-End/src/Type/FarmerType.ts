import { StatusEnum } from "../Enum/StatusEnum";
import { FamilyGroupType } from "./FamilyGroupType";
import { UserType } from "./UserType";

export interface FarmerType {
  registrationNumber: String;
  name: string;
  familyGroup?: FamilyGroupType;
  status: StatusEnum;
  technician?: UserType;
  ownedArea?: number;
  leasedArea?: number;
}
