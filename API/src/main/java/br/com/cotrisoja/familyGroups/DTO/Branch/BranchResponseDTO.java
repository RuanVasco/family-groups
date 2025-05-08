package br.com.cotrisoja.familyGroups.DTO.Branch;

import br.com.cotrisoja.familyGroups.Entity.Branch;

public record BranchResponseDTO (
        Long id,
        String name
) {
    public static BranchResponseDTO from(Branch branch) {
        return new BranchResponseDTO(
                branch.getId(),
                branch.getName()
        );
    }
}
