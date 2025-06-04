package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;

import java.util.List;

public record FamilyGroupMembersResponseDTO(
        Long familyGroupId,
        FarmerResponseDTO principal,
        List<FarmerResponseDTO> members,

        Double canolaArea,           Double canolaAreaParticipation,
        Double wheatArea,            Double wheatAreaParticipation,
        Double cornSilageArea,       Double cornSilageAreaParticipation,
        Double grainCornArea,        Double grainCornAreaParticipation,
        Double beanArea,             Double beanAreaParticipation,
        Double soybeanArea,          Double soybeanAreaParticipation
) {

    public static FamilyGroupMembersResponseDTO fromEntity(FamilyGroup fg) {
        return new FamilyGroupMembersResponseDTO(
                fg.getId(),
                FarmerResponseDTO.fromEntity(fg.getPrincipal()),
                fg.getMembers().stream()
                        .map(FarmerResponseDTO::fromEntity)
                        .toList(),

                fg.getCanolaArea(),        fg.getCanolaAreaParticipation(),
                fg.getWheatArea(),         fg.getWheatAreaParticipation(),
                fg.getCornSilageArea(),    fg.getCornSilageAreaParticipation(),
                fg.getGrainCornArea(),     fg.getGrainCornAreaParticipation(),
                fg.getBeanArea(),          fg.getBeanAreaParticipation(),
                fg.getSoybeanArea(),       fg.getSoybeanAreaParticipation()
        );
    }
}
