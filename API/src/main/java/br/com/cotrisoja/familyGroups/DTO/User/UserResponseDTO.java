package br.com.cotrisoja.familyGroups.DTO.User;

import br.com.cotrisoja.familyGroups.DTO.Branch.BranchResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Entity.User;

import java.util.Set;

public record UserResponseDTO(
        Long id,
        String username,
        String name,
        Set<String> roles,
        BranchResponseDTO branch
) {
    public static UserResponseDTO fromEntity(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getRoles(),
                user.getBranch() != null ? BranchResponseDTO.from(user.getBranch()) : null
        );
    }
}
