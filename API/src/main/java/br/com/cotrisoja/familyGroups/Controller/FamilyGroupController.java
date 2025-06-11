package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.CultivationResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupMembersResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import br.com.cotrisoja.familyGroups.Service.FamilyGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;


@RestController
@RequestMapping("/family-group")
@RequiredArgsConstructor
public class FamilyGroupController {

    private final FamilyGroupService familyGroupService;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        Page<FamilyGroup> familyGroups;

        if (search != null && !search.isBlank()) {
            familyGroups = familyGroupService.findByValue(search, pageable);
        } else {
            familyGroups = familyGroupService.findAll(pageable);
        }

        Page<FamilyGroupResponseDTO> response = familyGroups.map(FamilyGroupResponseDTO::fromEntity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllWithoutPagination() {
        List<FamilyGroup> familyGroups = familyGroupService.findAll();
        return ResponseEntity.ok(familyGroups.stream().map(FamilyGroupResponseDTO::fromEntity).toList());
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
        Optional<FamilyGroup> familyGroupOptional = familyGroupService.findById(familyGroupId);

        if (familyGroupOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Grupo familiar não encontrado.");
        }

        FamilyGroup familyGroup = familyGroupOptional.get();
        Double totalFamilyGroupArea = familyGroupService.getFamilyGroupTotalArea(familyGroup);

        if (totalFamilyGroupArea == null) totalFamilyGroupArea = 0.0;

        Map<String, Double> cultures = Map.of(
                "canola", cultivationResponseDTO.canolaArea(),
                "trigo", cultivationResponseDTO.wheatArea(),
                "milho para silagem", cultivationResponseDTO.cornSilageArea(),
                "milho grão", cultivationResponseDTO.grainCornArea(),
                "feijão", cultivationResponseDTO.beanArea(),
                "soja", cultivationResponseDTO.soybeanArea()
        );

        for (Map.Entry<String, Double> entry : cultures.entrySet()) {
            String name = entry.getKey();
            double area = entry.getValue();
            if (totalFamilyGroupArea < area) {
                return ResponseEntity.badRequest().body(
                        String.format(
                                "A área total de cultivo de %s (%.2f ha) excede a área disponível do grupo familiar (%.2f ha).",
                                name, area, totalFamilyGroupArea
                        )
                );
            }
        }

        familyGroupService.updateCultivations(familyGroup, cultivationResponseDTO);
        return ResponseEntity.ok("Cultivo atualizado com sucesso.");
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

    @GetMapping("/lessors/{familyGroupId}")
    public ResponseEntity<?> findLessorsByFamilyGroup(
            @PathVariable Long familyGroupId
    ) {
        FamilyGroup familyGroup = null;
        Optional<FamilyGroup> familyGroupOptional = familyGroupService.findById(familyGroupId);

        if (familyGroupOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Grupo familiar não encontrado.");
        };

        familyGroup = familyGroupOptional.get();

        List<Farmer> lessors = familyGroupService.findLessorsByFamilyGroup(familyGroup);
        List<FarmerResponseDTO> response = lessors.stream()
                .map(FarmerResponseDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/member/{farmerId}")
    public ResponseEntity<?> findByMember(
            @PathVariable String farmerId
    ) {
        Optional<Farmer> optionalFarmer = farmerRepository.findById(farmerId);

        if (optionalFarmer.isEmpty()) {
            return ResponseEntity.badRequest().body("Produtor não encontrado.");
        }

        Optional<FamilyGroup> familyGroupOptional = familyGroupService.findByMember(optionalFarmer.get());

        if (familyGroupOptional.isEmpty()) {
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.ok().body(FamilyGroupMembersResponseDTO.fromEntity(familyGroupOptional.get()));
    }

    @GetMapping("/cultivation/branch/{branchId}")
    public ResponseEntity<?> findByBranch (
            @PathVariable Long branchId
    ) {
        return ResponseEntity.ok(
                familyGroupService.getCultivationsByBranch(branchId)
        );
    }

    @GetMapping("/cultivation/user/{userId}")
    public ResponseEntity<?> findByUser (
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                familyGroupService.getCultivationsByUser(userId)
        );
    }

    @GetMapping("/free-area/{familyGroupId}")
    public ResponseEntity<?> getFreeArea(
            @PathVariable Long familyGroupId
    ) {
        return ResponseEntity.ok(
                familyGroupService.getFreeArea(familyGroupId)
        );
    }
}