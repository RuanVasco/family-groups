import { FarmerType } from "./FarmerType";
import { UserType } from "./UserType";

export interface FamilyGroupType {
  id: number;
  principal: FarmerType;
  farmers?: FarmerType[];
  technician?: UserType;
}
