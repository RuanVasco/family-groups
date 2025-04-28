package br.com.cotrisoja.familyGroups.DTO.User;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.User;

import java.util.List;

public record UserResponseDTO(
        Long id,
        String username,
        List<FamilyGroupResponseDTO> familyGroups
) {
    public static UserResponseDTO fromEntity(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getFamilyGroups() != null
                        ? user.getFamilyGroups().stream()
                        .map(FamilyGroupResponseDTO::fromEntity)
                        .toList()
                        : List.of()
        );
    }
}
