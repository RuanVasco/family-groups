package br.com.cotrisoja.familyGroups.DTO.User;

import java.util.Set;

public record UserRequestDTO(
        String username,
        String name,
        String password,
        Set<String> roles,
        Long branchId
) {
}
