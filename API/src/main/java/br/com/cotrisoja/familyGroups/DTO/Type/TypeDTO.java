package br.com.cotrisoja.familyGroups.DTO.Type;

import br.com.cotrisoja.familyGroups.Entity.Type;

public record TypeDTO(
		Integer id,
		String description
) {
	public static TypeDTO fromEntity(Type type) {
		return new TypeDTO(
				type.getId(),
				type.getDescription()
		);
	}
}
