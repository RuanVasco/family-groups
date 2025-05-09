package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseMinimalDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;

public record FamilyGroupMinimalDTO(
		Long id,
		FarmerResponseMinimalDTO principal
) {
	public static FamilyGroupMinimalDTO fromEntity(FamilyGroup entity) {
		if (entity == null) return null;

		return new FamilyGroupMinimalDTO(
				entity.getId(),
				FarmerResponseMinimalDTO.fromEntity(entity.getPrincipal())
		);
	}
}
