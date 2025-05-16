package br.com.cotrisoja.familyGroups.DTO.Asset;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseMinimalDTO;
import br.com.cotrisoja.familyGroups.Entity.Asset;

public record AssetDTO(
		String id,
		String description,
		String address,
		double amount,
		AssetTypeDTO assetType,
		FarmerResponseMinimalDTO leasedTo,
		FarmerResponseMinimalDTO owner
) {
	public static AssetDTO fromEntity(Asset asset) {
		String compositeId =
				(asset.getOwner() != null ? asset.getOwner().getRegistrationNumber() : "unknown")
						+ "-" +
						(asset.getIdSap() != null ? asset.getIdSap() : "unknown");

		return new AssetDTO(
				compositeId,
				asset.getDescription(),
				asset.getAddress(),
				asset.getAmount(),
				asset.getAssetType() != null ? AssetTypeDTO.fromEntity(asset.getAssetType()) : null,
				FarmerResponseMinimalDTO.fromEntity(asset.getLeasedTo()),
				FarmerResponseMinimalDTO.fromEntity(asset.getOwner())
		);
	}
}
