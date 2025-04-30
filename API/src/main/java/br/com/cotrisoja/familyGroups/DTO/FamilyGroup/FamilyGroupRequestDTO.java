package br.com.cotrisoja.familyGroups.DTO.FamilyGroup;

import java.util.List;

public record FamilyGroupRequestDTO (
        String principalId,
        List<String> membersId
) {}
