package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.CultivationResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.FamilyGroupRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FamilyGroupService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FarmerRepository farmerRepository;

    public FamilyGroup create(FamilyGroupRequestDTO familyGroupRequestDTO) {
        Farmer principal = farmerRepository.findById(familyGroupRequestDTO.principalId())
                .orElseThrow(() -> new RuntimeException("Produtor principal não encontrado"));

        FamilyGroup familyGroup = new FamilyGroup();
        familyGroup.setPrincipal(principal);

        familyGroup = familyGroupRepository.save(familyGroup);

        List<Farmer> validMembers = new ArrayList<>();

        for (String memberId : familyGroupRequestDTO.membersId()) {
            Optional<Farmer> optionalFarmer = farmerRepository.findById(memberId);
            if (optionalFarmer.isPresent()) {
                Farmer farmer = optionalFarmer.get();
                farmer.setFamilyGroup(familyGroup);
                farmerRepository.save(farmer);
                validMembers.add(farmer);
            }
        }

        familyGroup.setMembers(validMembers);
        return familyGroupRepository.save(familyGroup);
    }

    public FamilyGroup addMember(Long familyGroupId, String memberId) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyGroupId)
                .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));

        Farmer member = farmerRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        if (!member.isValid()) {
            throw new RuntimeException("Produtor não disponível");
        }

        List<Farmer> farmers = familyGroup.getMembers();
        if (farmers == null) {
            farmers = new ArrayList<>();
        }

        if (farmers.contains(member)) {
            throw new RuntimeException("Produtor já faz parte do grupo");
        }

        farmers.add(member);
        member.setFamilyGroup(familyGroup);
        familyGroup.setMembers(farmers);

        return familyGroupRepository.save(familyGroup);
    }

    public void removeMember(Long familyGroupId, String memberId) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyGroupId)
                .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));

        Farmer member = farmerRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        if (familyGroup.getPrincipal().equals(member)) {
            throw new RuntimeException("Produtor é o principal do grupo");
        }

        List<Farmer> farmers = familyGroup.getMembers();
        if (farmers == null) {
            farmers = new ArrayList<>();
        }

        if (!farmers.contains(member)) {
            throw new RuntimeException("Produtor não faz parte do grupo");
        }

        farmers.remove(member);
        familyGroup.setMembers(farmers);

        FamilyGroup newFamilyGroup = new FamilyGroup();
        newFamilyGroup.setPrincipal(member);
        familyGroupRepository.save(newFamilyGroup);
        member.setFamilyGroup(newFamilyGroup);
        farmerRepository.save(member);

        familyGroupRepository.save(familyGroup);
    }

    public void changePrincipal(Long familyGroupId, String principalId) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyGroupId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo familiar com ID " + familyGroupId + " não encontrado"));

        Farmer member = farmerRepository.findById(principalId)
                .orElseThrow(() -> new IllegalArgumentException("Produtor com ID " + principalId + " não encontrado"));

        if (Objects.equals(member, familyGroup.getPrincipal())) {
            throw new IllegalStateException("Produtor já é o principal do grupo");
        }

        if (!familyGroup.getMembers().contains(member)) {
            throw new IllegalStateException("Produtor com ID " + principalId + " não faz parte do grupo familiar com ID " + familyGroupId);
        }

        familyGroup.setPrincipal(member);
        familyGroupRepository.save(familyGroup);
    }


    public Page<FamilyGroup> findAll(Pageable pageable) {
        return familyGroupRepository.findAll(pageable);
    }

    public List<FamilyGroup> findAll() {
        return familyGroupRepository.findAll();
    }

    public CultivationResponseDTO getCultivation(Long familyGroupId) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyGroupId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo familiar com ID " + familyGroupId + " não encontrado"));

        return CultivationResponseDTO.fromEntity(familyGroup);
    }

    public void updateCultivations(FamilyGroup familyGroup, CultivationResponseDTO cultivationDTO) {
        familyGroup.setCanolaArea(cultivationDTO.canolaArea());
        familyGroup.setWheatArea(cultivationDTO.wheatArea());
        familyGroup.setCornSilageArea(cultivationDTO.cornSilageArea());
        familyGroup.setGrainCornArea(cultivationDTO.grainCornArea());
        familyGroup.setBeanArea(cultivationDTO.beanArea());
        familyGroup.setSoybeanArea(cultivationDTO.soybeanArea());

        familyGroupRepository.save(familyGroup);
    }

    public Optional<FamilyGroup> findById(Long familyGroupId) {
        return familyGroupRepository.findById(familyGroupId);
    }

    public List<FamilyGroup> findByTechnician(User technician) {
        return familyGroupRepository.findByTechnician(technician);
    }

    public Page<FamilyGroup> findByValue(String value, Pageable pageable) {
        return familyGroupRepository.findByValue(value, pageable);
    }

    public List<Farmer> findLessorsByFamilyGroup(FamilyGroup familyGroup) {
        return familyGroupRepository.findLessorsByFamilyGroup(familyGroup);
    }

    public Double getFamilyGroupTotalArea(FamilyGroup familyGroup) {
        return Optional.ofNullable(familyGroupRepository.getOwnedArea(familyGroup)).orElse(0.0) +
                Optional.ofNullable(familyGroupRepository.getLeasedArea(familyGroup)).orElse(0.0);
    }

    public Optional<FamilyGroup> findByMember(Farmer farmer) {
        return familyGroupRepository.findByMember(farmer);
    }
}
