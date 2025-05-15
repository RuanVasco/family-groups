package br.com.cotrisoja.familyGroups.DTO.Asset;

public record AssetRequestDTO(
		String description,
		String address,
		Double amount,
		String ownerRegistrationNumber,
		String leasedToRegistrationNumber,
		Long assetCategoryId,
		Long assetTypeId
) {}