package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.User.UserResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;

public record FamilyGroupResponseDTO(
        Long Id,
        FarmerResponseDTO farmer,
        UserResponseDTO user,
        String registry
) {
    public static FamilyGroupResponseDTO fromEntity(FamilyGroup familyGroup) {
        return new FamilyGroupResponseDTO(
                familyGroup.getId(),
                familyGroup.getPrincipal() != null ? FarmerResponseDTO.fromEntity(familyGroup.getPrincipal()) : null,
                familyGroup.getTechnician() != null ? UserResponseDTO.fromEntity(familyGroup.getTechnician()) : null,
                familyGroup.getRegistry()
        );
    }
}
