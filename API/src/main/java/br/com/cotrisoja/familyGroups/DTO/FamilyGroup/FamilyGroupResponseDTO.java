package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;

public record FamilyGroupResponseDTO(
        Long id,
        FarmerResponseDTO principal,
        String registry
) {
    public static FamilyGroupResponseDTO fromEntity(FamilyGroup familyGroup) {
        return new FamilyGroupResponseDTO(
                familyGroup.getId(),
                familyGroup.getPrincipal() != null ? FarmerResponseDTO.fromEntity(familyGroup.getPrincipal()) : null,
                familyGroup.getRegistry()
        );
    }
}
