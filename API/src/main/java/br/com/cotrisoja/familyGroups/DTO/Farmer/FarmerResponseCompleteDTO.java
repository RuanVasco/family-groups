package br.com.cotrisoja.familyGroups.DTO.Farmer;

import br.com.cotrisoja.familyGroups.DTO.Branch.BranchResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.Type.TypeDTO;
import br.com.cotrisoja.familyGroups.DTO.User.UserResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;


public record FarmerResponseCompleteDTO(
        String registrationNumber,
        String name,
        StatusEnum status,
        FamilyGroupResponseDTO familyGroup,
        UserResponseDTO technician,
        BranchResponseDTO branch,
        TypeDTO type,
        double ownedArea,
        double leasedArea
) {
    public static FarmerResponseCompleteDTO fromEntity(Farmer farmer) {
        return new FarmerResponseCompleteDTO(
                farmer.getRegistrationNumber(),
                farmer.getName(),
                farmer.getStatus(),
                farmer.getFamilyGroup() != null
                        ? FamilyGroupResponseDTO.fromEntity(farmer.getFamilyGroup())
                        : null,
                farmer.getTechnician() != null
                        ? UserResponseDTO.fromEntity(farmer.getTechnician())
                        : null,
                farmer.getBranch() != null
                        ? BranchResponseDTO.from(farmer.getBranch())
                        : null,
                farmer.getType() != null
                        ? TypeDTO.fromEntity(farmer.getType())
                        : null,
                farmer.getOwnedArea(),
                farmer.getLeasedArea()
        );
    }
}

