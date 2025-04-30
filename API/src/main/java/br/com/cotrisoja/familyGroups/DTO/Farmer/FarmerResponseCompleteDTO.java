package br.com.cotrisoja.familyGroups.DTO.Farmer;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;


public record FarmerResponseCompleteDTO(
        String registrationNumber,
        String name,
        StatusEnum status,
        FamilyGroupResponseDTO familyGroup,
        User technician
) {
    public static FarmerResponseCompleteDTO fromEntity(Farmer farmer) {
        return new FarmerResponseCompleteDTO(
                farmer.getRegistrationNumber(),
                farmer.getName(),
                farmer.getStatus(),
                farmer.getFamilyGroup() != null
                        ? FamilyGroupResponseDTO.fromEntity(farmer.getFamilyGroup())
                        : null,
                farmer.getTechnician()
        );
    }
}