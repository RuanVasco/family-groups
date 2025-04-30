package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import br.com.cotrisoja.familyGroups.Service.FamilyGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/family-group")
@RequiredArgsConstructor
public class FamilyGroupController {

    private final FamilyGroupService familyGroupService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        List<FamilyGroup> familyGroups = familyGroupService.findAll();

        List<FamilyGroupResponseDTO> response = familyGroups.stream()
                .map(FamilyGroupResponseDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody FamilyGroupRequestDTO familyGroupRequestDTO) {
        FamilyGroup familyGroup = familyGroupService.create(familyGroupRequestDTO);

        return ResponseEntity.ok(FamilyGroupResponseDTO.fromEntity(familyGroup));
    }

    @PutMapping("/add-member/{familyGroupId}/{memberId}")
    public ResponseEntity<?> addMember(@PathVariable Long familyGroupId, @PathVariable String memberId) {
        FamilyGroup familyGroup = familyGroupService.addMember(familyGroupId, memberId);

        return ResponseEntity.ok(familyGroup);
    }

    @PutMapping("/remove-member/{familyGroupId}/{memberId}")
    public ResponseEntity<?> removeMember(@PathVariable Long familyGroupId, @PathVariable String memberId) {
        familyGroupService.removeMember(familyGroupId, memberId);

        return ResponseEntity.ok("Membro removido do grupo familiar");
    }

    @PutMapping("/change-principal/{familyGroupId}/{principalId}")
    public ResponseEntity<?> changePrincipal(@PathVariable Long familyGroupId, @PathVariable String principalId) {
        familyGroupService.changePrincipal(familyGroupId, principalId);

        return ResponseEntity.ok("Principal atualizado");
    }
}