package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.*;
import br.com.cotrisoja.familyGroups.Repository.*;
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
    private final BranchRepository branchRepository;

    public Farmer createFarmer(FarmerRequestDTO farmerRequestDTO) {
        FamilyGroup familyGroup = null;
        User user = null;
        Type type = null;
        Branch branch = null;

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

        if (farmerRequestDTO.branch() != null) {
            branch = branchRepository.findById(farmerRequestDTO.branch())
                    .orElseThrow(() -> new RuntimeException("Carteira não encontrada"));
        }

        Farmer farmer = farmerRequestDTO.toEntity(familyGroup, user, type, branch);
        return farmerRepository.save(farmer);
    }

    @Transactional
    public Page<Farmer> findAll(Pageable pageable) {
        return farmerRepository.findAll(pageable);
    }

    public Page<Farmer> findByValue(String value, Pageable pageable) {
        return farmerRepository.findByValue(value, pageable);
    }

    public Page<Farmer> findAvailableFarmers(
            Pageable pageable
    ) {
        return farmerRepository.findAvailableFarmers(pageable);
    }

    public Page<Farmer> findAvailableFarmersByName(
            String search,
            Pageable pageable
    ) {
        return farmerRepository.findAvailableFarmersByName(search, pageable);
    }

    public List<Farmer> findByFamilyGroup(Long familyGroupID) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyGroupID)
                .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));

        return familyGroup.getMembers();
    }

    public Farmer updateFarmer(Farmer farmer, FarmerRequestDTO farmerRequestDTO) {
        FamilyGroup familyGroup = null;
        User user = null;
        Type type = null;
        Branch branch = null;

        farmer.setName(farmerRequestDTO.name());
        farmer.setStatus(farmerRequestDTO.status());
        farmer.setRegistrationNumber(farmer.getRegistrationNumber());
        farmer.setOwnedArea(farmerRequestDTO.ownedArea());
        farmer.setLeasedArea(farmerRequestDTO.leasedArea());

        if (farmerRequestDTO.technicianId() != null) {
            user = userRepository.findById(farmerRequestDTO.technicianId())
                    .orElseThrow(() -> new RuntimeException("Técnico não encontrado"));
            farmer.setTechnician(user);
        } else {
            farmer.setTechnician(null);
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

        if (farmerRequestDTO.branch() != null) {
            branch = branchRepository.findById(farmerRequestDTO.branch())
                    .orElseThrow(() -> new RuntimeException("Carteira não encontrada"));
            farmer.setBranch(branch);
        }

        return farmerRepository.save(farmer);
    }

    public Optional<Farmer> findById(String farmerRegistration) {
        return farmerRepository.findById(farmerRegistration);
    }

    public Page<Farmer> findByTechnician(User technician,
                                         String search,
                                         Pageable pageable) {

        String s = (search == null || search.isBlank()) ? null : search.trim();

        return (s == null)
                ? farmerRepository.findByTechnician(technician, pageable)
                : farmerRepository.findByTechnicianWithSearch(technician, s, pageable);
    }

    public Page<Farmer> findWithoutTechnician(String search,
                                              Pageable pageable) {

        String s = (search == null || search.isBlank()) ? null : search.trim();

        return (s == null)
                ? farmerRepository.findByTechnicianIsNull(pageable)
                : farmerRepository.findByTechnicianIsNullWithSearch(s, pageable);
    }

    public Page<Farmer> findByTechnicianAndType(User technician,
                                                Integer typeId,
                                                String search,
                                                Pageable pageable) {

        Type type = typeRepository.findById(typeId)
                .orElseThrow(() -> new IllegalArgumentException("Tipo de produtor não encontrado."));

        String s = (search == null || search.isBlank()) ? null : search.trim();

        return (s == null)
                ? farmerRepository.findByTechnicianAndType(technician, type, pageable)
                : farmerRepository.findByTechnicianAndTypeWithSearch(technician, type, s, pageable);
    }

    public Page<Farmer> findWithoutTechnicianAndType(Integer typeId,
                                                     String search,
                                                     Pageable pageable) {

        Type type = typeRepository.findById(typeId)
                .orElseThrow(() -> new IllegalArgumentException("Tipo de produtor não encontrado."));

        String s = (search == null || search.isBlank()) ? null : search.trim();

        return (s == null)
                ? farmerRepository.findByTechnicianIsNullAndType(type, pageable)
                : farmerRepository.findByTechnicianIsNullAndTypeWithSearch(type, s, pageable);
    }

    /* ----------------------------------------------------------
     * BUSCA POR BRANCH
     * ---------------------------------------------------------- */
    public Page<Farmer> findByEffectiveBranch(Branch branch,
                                              String search,
                                              Pageable pageable) {

        String s = (search == null || search.isBlank()) ? null : search.trim();

        return (s == null)
                ? farmerRepository.findByBranch(branch, pageable)
                : farmerRepository.findByEffectiveBranchWithSearch(branch, s, pageable);
    }

    public Page<Farmer> findByEffectiveBranchAndType(Branch branch,
                                                     Integer typeId,
                                                     String search,
                                                     Pageable pageable) {

        Type type = typeRepository.findById(typeId)
                .orElseThrow(() -> new IllegalArgumentException("Tipo de produtor não encontrado."));

        String s = (search == null || search.isBlank()) ? null : search.trim();

        return (s == null)
                ? farmerRepository.findByBranchAndType(branch, type, pageable)
                : farmerRepository.findByEffectiveBranchAndTypeWithSearch(branch, type, s, pageable);
    }

    public Page<Farmer> findByValueAndType(String value, Long typeId, Pageable pageable) {
        return farmerRepository.findByValueAndType(value, typeId, pageable);
    }

    public Page<Farmer> findByType(Type type, Pageable pageable) {
        return farmerRepository.findByType(type, pageable);
    }
}
