package br.com.cotrisoja.familyGroups.DTO.Farmer;

import br.com.cotrisoja.familyGroups.DTO.Branch.BranchResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupMinimalDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.Type.TypeDTO;
import br.com.cotrisoja.familyGroups.DTO.User.UserResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;


public record FarmerResponseDTO(
        String registrationNumber,
        String name,
        StatusEnum status,
        UserResponseDTO technician,
        BranchResponseDTO branch,
        FamilyGroupMinimalDTO familyGroup,
        TypeDTO type,
        double ownedArea,
        double leasedArea
) {
    public static FarmerResponseDTO fromEntity(Farmer farmer) {
        return new FarmerResponseDTO(
                farmer.getRegistrationNumber(),
                farmer.getName(),
                farmer.getStatus(),
                farmer.getTechnician() != null ? UserResponseDTO.fromEntity(farmer.getTechnician()) : null,
                farmer.getBranch() != null ? BranchResponseDTO.from(farmer.getBranch()) : null,
                farmer.getFamilyGroup() != null ? FamilyGroupMinimalDTO.fromEntity(farmer.getFamilyGroup()) : null,
                farmer.getType() != null ? TypeDTO.fromEntity(farmer.getType()) : null,
                farmer.getOwnedArea(),
                farmer.getLeasedArea()
        );
    }
}