import { StatusEnum } from "../Enum/StatusEnum";
import AssetType from "./AssetType";
import { BranchType } from "./BranchType";
import { FamilyGroupType } from "./FamilyGroupType";
import { TypeType } from "./TypeType";
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
  type?: TypeType;
  ownedAssets?: AssetType[];
  leasedAssets?: AssetType[];
}
