package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;

public record CultivationResponseDTO(
        float canolaArea,
        float wheatArea,
        float cornSilageArea,
        float grainCornArea,
        float beanArea,
        float soybeanArea
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
