package br.com.cotrisoja.familyGroups.DTO.Asset;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseMinimalDTO;
import br.com.cotrisoja.familyGroups.Entity.Asset;

public record AssetDTO(
		String id,
		String description,
		String assetCategory,
		String assetType,
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
				asset.getAssetCategory() != null ? asset.getAssetCategory().getDescription() : "Categoria não informada",
				asset.getAssetType() != null ? asset.getAssetType().getDescription() : "Tipo não informado",
				FarmerResponseMinimalDTO.fromEntity(asset.getLeasedTo()),
				FarmerResponseMinimalDTO.fromEntity(asset.getOwner())
		);
	}
}
