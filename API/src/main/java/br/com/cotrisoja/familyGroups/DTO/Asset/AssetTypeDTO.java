package br.com.cotrisoja.familyGroups.DTO.Asset;

import br.com.cotrisoja.familyGroups.Entity.AssetType;

public record AssetTypeDTO(
        Long id,
        String description
) {
    public static AssetTypeDTO fromEntity(AssetType assetType) {
        return new AssetTypeDTO(
                assetType.getId(),
                assetType.getDescription()
        );
    }
}
