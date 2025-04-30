import { FarmerType } from "./FarmerType";

export interface FamilyGroupType {
  id: number;
  principal: FarmerType;
  farmers?: FarmerType[];
}
