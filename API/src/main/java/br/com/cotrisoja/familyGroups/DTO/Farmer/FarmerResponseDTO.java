package br.com.cotrisoja.familyGroups.DTO.Farmer;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;

public record FarmerResponseDTO(
        String registrationNumber,
        String name,
        StatusEnum status,
        FamilyGroupResponseDTO familyGroup
) {
    public static FarmerResponseDTO fromEntity(Farmer farmer) {
        return new FarmerResponseDTO(
                farmer.getRegistrationNumber(),
                farmer.getName(),
                farmer.getStatus(),
                FamilyGroupResponseDTO.fromEntity(farmer.getFamilyGroup())
        );
    }
}