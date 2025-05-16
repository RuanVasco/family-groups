package br.com.cotrisoja.familyGroups.DTO.Asset;

import br.com.cotrisoja.familyGroups.Entity.AssetCategory;

public record AssetCategoryDTO(
		Long id,
		String description
) {
	public static AssetCategoryDTO fromEntity(AssetCategory assetCategory) {
		return new AssetCategoryDTO(
				assetCategory.getId(),
				assetCategory.getDescription()
		);
	}
}
