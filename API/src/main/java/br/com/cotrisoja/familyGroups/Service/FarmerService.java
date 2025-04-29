package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final FarmerRepository farmerRepository;

    @Transactional
    public Farmer createFarmer(FarmerRequestDTO farmerRequestDTO) {
        Farmer farmer = farmerRequestDTO.toEntity(null);
        farmer = farmerRepository.save(farmer);
        return farmer;
    }

    @Transactional
    public List<Farmer> findAll() {
        return farmerRepository.findAll();
    }
}
