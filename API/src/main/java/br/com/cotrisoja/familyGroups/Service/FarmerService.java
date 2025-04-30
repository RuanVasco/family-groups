package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.User.UserRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.FamilyGroupRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final FarmerRepository farmerRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final UserRepository userRepository;

    public Farmer createFarmer(FarmerRequestDTO farmerRequestDTO) {
        FamilyGroup familyGroup = null;
        User user = null;

        if (farmerRequestDTO.technicianId() != null) {
            user = userRepository.findById(farmerRequestDTO.technicianId())
                    .orElseThrow(() -> new RuntimeException("Técnico não encontrado"));
        }

        if (farmerRequestDTO.familyGroupId() != null) {
            familyGroup = familyGroupRepository.findById(farmerRequestDTO.familyGroupId())
                    .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));
        }

        Farmer farmer = farmerRequestDTO.toEntity(familyGroup, user);
        return farmerRepository.save(farmer);
    }

    @Transactional
    public List<Farmer> findAll() {
        return farmerRepository.findAll();
    }

    public Set<Farmer> findAvaibleFarmers() {
        return farmerRepository.findAvaibleFarmers();
    }

    public List<Farmer> findByFamilyGroup(Long familyGroupID) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyGroupID)
                .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));

        return familyGroup.getMembers();
    }

    public Farmer updateFarmer(Farmer farmer, FarmerRequestDTO farmerRequestDTO) {
        FamilyGroup familyGroup = null;
        User user = null;

        farmer.setName(farmerRequestDTO.name());
        farmer.setStatus(farmerRequestDTO.status());
        farmer.setRegistrationNumber(farmer.getRegistrationNumber());

        if (farmerRequestDTO.technicianId() != null) {
            user = userRepository.findById(farmerRequestDTO.technicianId())
                    .orElseThrow(() -> new RuntimeException("Técnico não encontrado"));

            farmer.setTechnician(user);
        }

        if (farmerRequestDTO.familyGroupId() != null) {
            familyGroup = familyGroupRepository.findById(farmerRequestDTO.familyGroupId())
                    .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));

            farmer.setFamilyGroup(familyGroup);
        }

        return farmerRepository.save(farmer);
    }

    public Optional<Farmer> findById(String farmerRegistration) {
        return farmerRepository.findById(farmerRegistration);
    }
}
