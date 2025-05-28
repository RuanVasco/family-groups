import AssetTypeType from "./AssetTypeType";
import { FarmerType } from "./FarmerType";

export interface AssetType {
  id?: string;
  description: string;
  address: string;
  amount: number;
  owner?: FarmerType | null;
  leasedTo?: FarmerType | null;
  assetType: AssetTypeType;
  registration: string;
  car: string;
  cultivable: number;
}

export default AssetType;
