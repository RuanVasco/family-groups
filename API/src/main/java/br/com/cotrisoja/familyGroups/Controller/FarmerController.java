package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseCompleteDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Service.FarmerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody FarmerRequestDTO farmerRequestDTO) {
        Farmer farmer = farmerService.createFarmer(farmerRequestDTO);

        return ResponseEntity.ok(farmer.getRegistrationNumber());
    }

    @GetMapping
    public ResponseEntity<?> findAll() {
        List<Farmer> farmers = farmerService.findAll();

        List<FarmerResponseCompleteDTO> response = farmers.stream()
                .map(FarmerResponseCompleteDTO::fromEntity)
                .toList();

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
