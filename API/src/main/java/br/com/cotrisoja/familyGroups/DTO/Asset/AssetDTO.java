package br.com.cotrisoja.familyGroups.DTO.Asset;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseMinimalDTO;
import br.com.cotrisoja.familyGroups.Entity.Asset;

public record AssetDTO(
		Long id,
		String description,
		String assetTypeEnum,
		FarmerResponseMinimalDTO leasedTo,
		FarmerResponseMinimalDTO owner
) {
	public static AssetDTO fromEntity(Asset asset) {
		return new AssetDTO(
				asset.getId(),
				asset.getDescription(),
				asset.getAssetType().name(),
				FarmerResponseMinimalDTO.fromEntity(asset.getLeasedTo()),
				FarmerResponseMinimalDTO.fromEntity(asset.getOwner())
		);
	}
}
