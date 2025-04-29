package br.com.cotrisoja.familyGroups.DTO.User;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.User;

import java.util.List;
import java.util.Set;

public record UserResponseDTO(
        Long id,
        String username,
        Set<String> roles,
        List<FamilyGroupResponseDTO> familyGroups
) {
    public static UserResponseDTO fromEntity(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getRoles(),
                user.getFamilyGroups() != null
                        ? user.getFamilyGroups().stream()
                        .map(FamilyGroupResponseDTO::fromEntity)
                        .toList()
                        : List.of()
        );
    }
}
