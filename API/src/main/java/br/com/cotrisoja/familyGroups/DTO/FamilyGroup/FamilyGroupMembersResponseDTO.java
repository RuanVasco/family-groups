package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;

import java.util.List;

public record FamilyGroupMembersResponseDTO(
        Long familyGroupId,
        FarmerResponseDTO principal,
        List<FarmerResponseDTO> members,
        double canolaArea,
        double wheatArea,
        double cornSilageArea,
        double grainCornArea,
        double beanArea,
        double soybeanArea
) {
    public static FamilyGroupMembersResponseDTO fromEntity(FamilyGroup familyGroup) {
        return new FamilyGroupMembersResponseDTO(
                familyGroup.getId(),
                FarmerResponseDTO.fromEntity(familyGroup.getPrincipal()),
                familyGroup.getMembers().stream()
                        .map(FarmerResponseDTO::fromEntity)
                        .toList(),
                familyGroup.getCanolaArea(),
                familyGroup.getWheatArea(),
                familyGroup.getCornSilageArea(),
                familyGroup.getGrainCornArea(),
                familyGroup.getBeanArea(),
                familyGroup.getSoybeanArea()
        );
    }
}
