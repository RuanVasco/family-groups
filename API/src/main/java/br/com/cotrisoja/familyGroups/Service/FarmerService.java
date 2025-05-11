package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.*;
import br.com.cotrisoja.familyGroups.Repository.FamilyGroupRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import br.com.cotrisoja.familyGroups.Repository.TypeRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final TypeRepository typeRepository;

    public Farmer createFarmer(FarmerRequestDTO farmerRequestDTO) {
        FamilyGroup familyGroup = null;
        User user = null;
        Type type = null;

        if (farmerRequestDTO.technicianId() != null) {
            user = userRepository.findById(farmerRequestDTO.technicianId())
                    .orElseThrow(() -> new RuntimeException("Técnico não encontrado"));
        }

        if (farmerRequestDTO.familyGroupId() != null) {
            familyGroup = familyGroupRepository.findById(farmerRequestDTO.familyGroupId())
                    .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));
        }

        if (farmerRequestDTO.typeId() != null) {
            type = typeRepository.findById(farmerRequestDTO.typeId())
                    .orElseThrow(() -> new RuntimeException("Tipo não encontrado"));
        }

        Farmer farmer = farmerRequestDTO.toEntity(familyGroup, user, type);
        return farmerRepository.save(farmer);
    }

    @Transactional
    public Page<Farmer> findAll(Pageable pageable) {
        return farmerRepository.findAll(pageable);
    }

    public Page<Farmer> findByValue(String value, Pageable pageable) {
        return farmerRepository.findByValue(value, pageable);
    }

    public Set<Farmer> findAvaibleFarmers() {
        return farmerRepository.findAvaibleFarmers();
    }

    public List<Farmer> findByFamilyGroup(Long familyGroupID) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyGroupID)
                .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));

        return familyGroup.getMembers();
    }

    public Page<Farmer> findByTechnician(User technician, Pageable pageable) {
        return farmerRepository.findByTechnician(technician, pageable);
    }

    public Page<Farmer> findWithoutTechnician(Pageable pageable) {
        return farmerRepository.findWithoutTechnician(pageable);
    }

    public Page<Farmer> findByEffectiveBranch(Branch branch, Pageable pageable) {
        return farmerRepository.findByEffectiveBranch(branch, pageable);
    }

    public Farmer updateFarmer(Farmer farmer, FarmerRequestDTO farmerRequestDTO) {
        FamilyGroup familyGroup = null;
        User user = null;
        Type type = null;

        farmer.setName(farmerRequestDTO.name());
        farmer.setStatus(farmerRequestDTO.status());
        farmer.setRegistrationNumber(farmer.getRegistrationNumber());
        farmer.setOwnedArea(farmerRequestDTO.ownedArea());
        farmer.setLeasedArea(farmerRequestDTO.leasedArea());

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

        if (farmerRequestDTO.typeId() != null) {
            type = typeRepository.findById(farmerRequestDTO.typeId())
                    .orElseThrow(() -> new RuntimeException("Tipo não encontrado"));
            farmer.setType(type);
        }

        return farmerRepository.save(farmer);
    }

    public Optional<Farmer> findById(String farmerRegistration) {
        return farmerRepository.findById(farmerRegistration);
    }
}
