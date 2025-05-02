package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.CultivationResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupMembersResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import br.com.cotrisoja.familyGroups.Service.FamilyGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


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

    @GetMapping("/cultivation/{familyGroupId}")
    public ResponseEntity<?> getCultivation(
            @PathVariable Long familyGroupId
    ) {
        CultivationResponseDTO dto = familyGroupService.getCultivation(familyGroupId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/by-technician/{userId}")
    public ResponseEntity<?> getByTechnician(@PathVariable Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Usuário não encontrado");
        }

        User technician = userOptional.get();
        List<FamilyGroup> familyGroups = familyGroupService.findByTechnician(technician);

        return ResponseEntity.ok(
                familyGroups.stream()
                        .map(FamilyGroupMembersResponseDTO::fromEntity)
                        .toList()
        );
    }

    @PutMapping("/cultivation/{familyGroupId}")
    public ResponseEntity<?> editCultivation(
            @PathVariable Long familyGroupId,
            @RequestBody CultivationResponseDTO cultivationResponseDTO
    ) {
        FamilyGroup familyGroup = null;
        Optional<FamilyGroup> familyGroupOptional = familyGroupService.findById(familyGroupId);

        if (familyGroupOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Grupo familiar não encontrado");
        };

        familyGroup = familyGroupOptional.get();

        familyGroupService.updateCultivations(familyGroup, cultivationResponseDTO);
        return ResponseEntity.ok().build();
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