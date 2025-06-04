package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;

public record CultivationResponseDTO(
        Double canolaArea,           Double canolaAreaParticipation,
        Double wheatArea,            Double wheatAreaParticipation,
        Double cornSilageArea,       Double cornSilageAreaParticipation,
        Double grainCornArea,        Double grainCornAreaParticipation,
        Double beanArea,             Double beanAreaParticipation,
        Double soybeanArea,          Double soybeanAreaParticipation
) {

    public static CultivationResponseDTO fromEntity(FamilyGroup fg) {
        return new CultivationResponseDTO(
                defaultDouble(fg.getCanolaArea()),        defaultDouble(fg.getCanolaAreaParticipation()),
                defaultDouble(fg.getWheatArea()),         defaultDouble(fg.getWheatAreaParticipation()),
                defaultDouble(fg.getCornSilageArea()),    defaultDouble(fg.getCornSilageAreaParticipation()),
                defaultDouble(fg.getGrainCornArea()),     defaultDouble(fg.getGrainCornAreaParticipation()),
                defaultDouble(fg.getBeanArea()),          defaultDouble(fg.getBeanAreaParticipation()),
                defaultDouble(fg.getSoybeanArea()),       defaultDouble(fg.getSoybeanAreaParticipation())
        );
    }

    private static Double defaultDouble(Double value) {
        return value != null ? value : 0.0;
    }

    public double totalArea() {
        return canolaArea + wheatArea + cornSilageArea +
                grainCornArea + beanArea + soybeanArea;
    }

    public double totalParticipation() {
        return canolaAreaParticipation + wheatAreaParticipation +
                cornSilageAreaParticipation + grainCornAreaParticipation +
                beanAreaParticipation + soybeanAreaParticipation;
    }
}
