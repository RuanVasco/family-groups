package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Service.FarmerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        return ResponseEntity.ok(farmerService.findAll());
    }
}
