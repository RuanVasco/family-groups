import { FarmerType } from "./FarmerType";

export interface FamilyGroupType {
  id: number;
  principal: FarmerType;
  members?: FarmerType[];

  canolaArea?: number;
  wheatArea?: number;
  cornSilageArea?: number;
  grainCornArea?: number;
  beanArea?: number;
  soybeanArea?: number;

  canolaAreaParticipation?: number;
  wheatAreaParticipation?: number;
  cornSilageAreaParticipation?: number;
  grainCornAreaParticipation?: number;
  beanAreaParticipation?: number;
  soybeanAreaParticipation?: number;
}
