package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseCompleteDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.BranchRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import br.com.cotrisoja.familyGroups.Service.FarmerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody FarmerRequestDTO farmerRequestDTO) {
        Farmer farmer = farmerService.createFarmer(farmerRequestDTO);

        return ResponseEntity.ok(farmer.getRegistrationNumber());
    }

    @GetMapping
    public ResponseEntity<Page<FarmerResponseCompleteDTO>> findAll(
            @RequestParam(required = false) String value,
            Pageable pageable
    ) {
        Page<Farmer> farmers;

        if (value != null && !value.isBlank()) {
            farmers = farmerService.findByValue(value, pageable);
        } else {
            farmers = farmerService.findAll(pageable);
        }

        Page<FarmerResponseCompleteDTO> response = farmers.map(FarmerResponseCompleteDTO::fromEntity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{farmerRegistration}")
    public ResponseEntity<?> getFarmer(
            @PathVariable String farmerRegistration
    ) {
        Farmer farmer = farmerService.findById(farmerRegistration)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        return ResponseEntity.ok(FarmerResponseDTO.fromEntity(farmer));
    }

    @GetMapping("/available")
    public ResponseEntity<Page<FarmerResponseDTO>> findAvailableFarmers(
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        Page<Farmer> farmers = null;

        if (search != null && !search.isEmpty()) {
            farmers = farmerService.findAvailableFarmersByName(search, pageable);
        } else {
            farmers = farmerService.findAvailableFarmers(pageable);
        }

        Page<FarmerResponseDTO> response = farmers.map(FarmerResponseDTO::fromEntity);
        return ResponseEntity.ok(response);
    }


    @GetMapping("by-family-group/{familyGroupID}")
    public ResponseEntity<?> findByFamilyGroup(
            @PathVariable Long familyGroupID
    ) {
        List<Farmer> farmers = farmerService.findByFamilyGroup(familyGroupID);

        List<FarmerResponseDTO> response = farmers.stream()
                .map(FarmerResponseDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/by-technician")
    public ResponseEntity<?> getByTechnician(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer typeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "registrationNumber,asc") String sort,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequest.of(page, size, buildSort(sort));
        Page<Farmer> farmersPage;

        if (userId != null) {
            Optional<User> technicianOpt = userRepository.findById(userId);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Usuário não encontrado");
            }

            farmersPage = (typeId == null)
                    ? farmerService.findByTechnician(technicianOpt.get(), search, pageable)
                    : farmerService.findByTechnicianAndType(technicianOpt.get(), typeId, search, pageable);

        } else {
            farmersPage = (typeId == null)
                    ? farmerService.findWithoutTechnician(search, pageable)
                    : farmerService.findWithoutTechnicianAndType(typeId, search, pageable);
        }

        return ResponseEntity.ok(farmersPage.map(FarmerResponseDTO::fromEntity));
    }

    @GetMapping("/by-branch/{branchId}")
    public ResponseEntity<?> getByBranch(
            @PathVariable Long branchId,
            @RequestParam(required = false) Integer typeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "registrationNumber,asc") String sort,
            @RequestParam(required = false) String search
    ) {
        return branchRepository.findById(branchId)
                .<ResponseEntity<?>>map(branch -> {
                    Pageable pageable = PageRequest.of(page, size, buildSort(sort));

                    final String searchValue = (search != null && search.isBlank()) ? null : search;

                    Page<Farmer> farmersPage;
                    try {
                        farmersPage = (typeId == null)
                                ? farmerService.findByEffectiveBranch(branch, searchValue, pageable)
                                : farmerService.findByEffectiveBranchAndType(branch, typeId, searchValue, pageable);
                    } catch (IllegalArgumentException ex) {
                        return ResponseEntity.badRequest().body(ex.getMessage());
                    }

                    return ResponseEntity.ok(farmersPage.map(FarmerResponseDTO::fromEntity));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body("Carteira não encontrada"));
    }

    @PutMapping("/{farmerRegistration}")
    public ResponseEntity<?> updateFarmer(
            @PathVariable String farmerRegistration,
            @RequestBody FarmerRequestDTO farmerRequestDTO
    ) {
        Farmer farmer = farmerService.findById(farmerRegistration)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        return ResponseEntity.ok(farmerService.updateFarmer(farmer, farmerRequestDTO));
    }



    private Sort buildSort(String sortParam) {
        String[] s = sortParam.split(",");
        String field = s[0];
        Sort.Direction dir = s.length > 1 ? Sort.Direction.fromString(s[1]) : Sort.Direction.ASC;

        if ("totalArea".equals(field)) {
            return JpaSort.unsafe(dir,
                    "COALESCE(ownedArea,0) + COALESCE(leasedArea,0)");
        }
        return Sort.by(dir, field);
    }
}
