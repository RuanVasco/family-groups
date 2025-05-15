import { AssetEnum } from "../Enum/AssetEnum";
import { FarmerType } from "./FarmerType";

export interface AssetType {
  id?: number;
  description: string;
  assetType?: AssetEnum;
  leasedTo?: FarmerType | null;
  owner?: FarmerType | null;
}

export default AssetType;
