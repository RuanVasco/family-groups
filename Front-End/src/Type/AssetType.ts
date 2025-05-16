import AssetCategoryType from "./AssetCategoryType";
import AssetTypeType from "./AssetTypeType";
import { FarmerType } from "./FarmerType";

export interface AssetType {
  id?: string;
  description: string;
  address: string;
  amount: number;
  owner?: FarmerType | null;
  leasedTo?: FarmerType | null;
  assetCategory: AssetCategoryType;
  assetType: AssetTypeType;
}

export default AssetType;
