package br.com.cotrisoja.familyGroups.DTO.Asset;

public record AssetRequestDTO(
		String description,
		String ownerRegistrationNumber,
		String leasedToRegistrationNumber
) {
}
