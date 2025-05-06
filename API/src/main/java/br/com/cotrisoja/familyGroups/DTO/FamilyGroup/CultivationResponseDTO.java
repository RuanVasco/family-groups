package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;

public record CultivationResponseDTO(
        double canolaArea,
        double wheatArea,
        double cornSilageArea,
        double grainCornArea,
        double beanArea,
        double soybeanArea
) {
    public static CultivationResponseDTO fromEntity(FamilyGroup familyGroup) {
        return new CultivationResponseDTO(
                familyGroup.getCanolaArea(),
                familyGroup.getWheatArea(),
                familyGroup.getCornSilageArea(),
                familyGroup.getGrainCornArea(),
                familyGroup.getBeanArea(),
                familyGroup.getSoybeanArea()
        );
    }
}
