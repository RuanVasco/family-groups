package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupMembersResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseCompleteDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.BranchRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import br.com.cotrisoja.familyGroups.Service.FarmerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        Page<Farmer> farmers;

        if (search != null && !search.isBlank()) {
            farmers = farmerService.findByValue(search, pageable);
        } else {
            farmers = farmerService.findAll(pageable);
        }

        Page<FarmerResponseCompleteDTO> response = farmers.map(FarmerResponseCompleteDTO::fromEntity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/avaible")
    public ResponseEntity<?> findAvaibleFarmers() {
        Set<Farmer> farmers = farmerService.findAvaibleFarmers();

        return ResponseEntity.ok(farmers);
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

    @GetMapping("/by-technician/{userId}")
    public ResponseEntity<?> getByTechnician(@PathVariable Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);

        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Usuário não encontrado");
        }

        User technician = userOptional.get();
        List<Farmer> farmers = farmerService.findByTechnician(technician);

        return ResponseEntity.ok(
                farmers.stream()
                        .map(FarmerResponseDTO::fromEntity)
                        .toList()
        );
    }

    @GetMapping("/by-branch/{branchId}")
    public ResponseEntity<?> getByBranch(@PathVariable Long branchId) {
        Optional<Branch> branchOptional = branchRepository.findById(branchId);

        if (branchOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Carteira não encontrado");
        }

        Branch branch = branchOptional.get();
        List<Farmer> farmers = farmerService.findByBranch(branch);

        return ResponseEntity.ok(
                farmers.stream()
                        .map(FarmerResponseDTO::fromEntity)
                        .toList()
        );
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
}
