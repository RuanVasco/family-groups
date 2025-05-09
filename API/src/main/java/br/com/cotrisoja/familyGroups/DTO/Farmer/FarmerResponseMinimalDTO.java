package br.com.cotrisoja.familyGroups.DTO.Farmer;

import br.com.cotrisoja.familyGroups.Entity.Farmer;

public record FarmerResponseMinimalDTO (
		String registrationNumber,
		String name
) {
	public static FarmerResponseMinimalDTO fromEntity(Farmer entity) {
		if (entity == null) return null;

		return new FarmerResponseMinimalDTO(
				entity.getRegistrationNumber(),
				entity.getName()
		);
	}
}
