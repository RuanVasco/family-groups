package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.CultivationResponseDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.CultivationWithFreeAreaDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FreeAreaAggDTO;
import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Exception.BadRequestException;
import br.com.cotrisoja.familyGroups.Repository.BranchRepository;
import br.com.cotrisoja.familyGroups.Repository.FamilyGroupRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FamilyGroupService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FarmerRepository farmerRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    @Transactional
    public FamilyGroup create(FamilyGroupRequestDTO familyGroupRequestDTO) {
        Farmer principal = farmerRepository.findById(familyGroupRequestDTO.principalId())
                .orElseThrow(() -> new RuntimeException("Produtor principal não encontrado"));

        if (principal.getFamilyGroup() != null && principal.getFamilyGroup().getMembers().size() < 2) {
            FamilyGroup oldGroup = principal.getFamilyGroup();

            principal.setFamilyGroup(null);
            farmerRepository.save(principal);

            List<Farmer> members = oldGroup.getMembers();
            for (Farmer member : members) {
                member.setFamilyGroup(null);
            }
            farmerRepository.saveAll(members);

            familyGroupRepository.delete(oldGroup);

            farmerRepository.flush();
            familyGroupRepository.flush();
        }

        FamilyGroup newGroup = new FamilyGroup();
        newGroup.setPrincipal(principal);
        newGroup = familyGroupRepository.save(newGroup);

        List<Farmer> validMembers = new ArrayList<>();
        for (String memberId : familyGroupRequestDTO.membersId()) {
            Farmer farmer = farmerRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("Produtor " + memberId + " não encontrado"));
            farmer.setFamilyGroup(newGroup);
            farmerRepository.save(farmer);
            validMembers.add(farmer);
        }

        newGroup.setMembers(validMembers);
        return familyGroupRepository.save(newGroup);
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

    @Transactional
    public void removeMember(Long familyGroupId, String memberId) {

        FamilyGroup oldGroup = familyGroupRepository.findById(familyGroupId)
                .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));

        Farmer member = farmerRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        if (oldGroup.getPrincipal().equals(member))
            throw new RuntimeException("Não é possível remover o produtor principal.");

        member.setFamilyGroup(null);
        oldGroup.getMembers().remove(member);
        familyGroupRepository.save(oldGroup);
        farmerRepository.save(member);

        farmerRepository.flush();
        familyGroupRepository.flush();

        Optional<FamilyGroup> existing =
                familyGroupRepository.findByPrincipal(member);

        FamilyGroup soloGroup = existing.orElseGet(() -> {
            FamilyGroup fg = new FamilyGroup();
            fg.setPrincipal(member);
            return familyGroupRepository.save(fg);
        });

        member.setFamilyGroup(soloGroup);
        farmerRepository.save(member);
    }

    @Transactional
    public void changePrincipal(Long familyGroupId, String newPrincipalId) {

        FamilyGroup targetGroup = familyGroupRepository.findById(familyGroupId)
                .orElseThrow(() -> new RuntimeException("Grupo familiar não encontrado"));

        Farmer newPrincipal = farmerRepository.findById(newPrincipalId)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        if (newPrincipal.equals(targetGroup.getPrincipal()))
            throw new IllegalStateException("Produtor já é o principal do grupo.");

        if (!targetGroup.getMembers().contains(newPrincipal))
            throw new IllegalStateException("Produtor não é membro do grupo.");

        familyGroupRepository.findByPrincipal(newPrincipal)
                .filter(g -> !g.getId().equals(familyGroupId))
                .ifPresent(g -> {
                    newPrincipal.setFamilyGroup(null);
                    farmerRepository.save(newPrincipal);

                    familyGroupRepository.delete(g);
                    familyGroupRepository.flush();
                });

        Farmer oldPrincipal = targetGroup.getPrincipal();

        targetGroup.getMembers().remove(newPrincipal);

        if (!targetGroup.getMembers().contains(oldPrincipal))
            targetGroup.getMembers().add(oldPrincipal);

        targetGroup.setPrincipal(newPrincipal);
        familyGroupRepository.save(targetGroup);

        newPrincipal.setFamilyGroup(targetGroup);
        oldPrincipal.setFamilyGroup(targetGroup);
        farmerRepository.save(newPrincipal);
        farmerRepository.save(oldPrincipal);
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

        familyGroup.setCanolaAreaParticipation(cultivationDTO.canolaAreaParticipation());
        familyGroup.setWheatAreaParticipation(cultivationDTO.wheatAreaParticipation());
        familyGroup.setCornSilageAreaParticipation(cultivationDTO.cornSilageAreaParticipation());
        familyGroup.setGrainCornAreaParticipation(cultivationDTO.grainCornAreaParticipation());
        familyGroup.setBeanAreaParticipation(cultivationDTO.beanAreaParticipation());
        familyGroup.setSoybeanAreaParticipation(cultivationDTO.soybeanAreaParticipation());

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

    public List<CultivationWithFreeAreaDTO> getCultivationsByBranch(Long branchId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new BadRequestException("Branch not found"));

        List<FamilyGroup> groups = familyGroupRepository.findByBranch(branch);

        Map<Long, Double> areaMap = familyGroupRepository.getFreeAreaForGroups(groups)
                .stream()
                .collect(Collectors.toMap(
                        FreeAreaAggDTO::familyGroupId,
                        FreeAreaAggDTO::freeArea));

        return groups.stream()
                .map(fg -> new CultivationWithFreeAreaDTO(
                        fg.getId(),
                        areaMap.getOrDefault(fg.getId(), 0D),
                        (CultivationResponseDTO.fromEntity(fg))
                ))
                .toList();
    }

    public List<CultivationWithFreeAreaDTO> getCultivationsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        List<FamilyGroup> groups = familyGroupRepository.findByUser(user);

        Map<Long, Double> areaMap = familyGroupRepository.getFreeAreaForGroups(groups)
                .stream()
                .collect(Collectors.toMap(
                        FreeAreaAggDTO::familyGroupId,
                        FreeAreaAggDTO::freeArea));

        return groups.stream()
                .map(fg -> new CultivationWithFreeAreaDTO(
                        fg.getId(),
                        areaMap.getOrDefault(fg.getId(), 0D),
                        (CultivationResponseDTO.fromEntity(fg))
                ))
                .toList();
    }

    public Double getFreeArea(Long familyGroupdId) {
        FamilyGroup familyGroup = familyGroupRepository.findById(familyGroupdId)
                .orElseThrow(() -> new BadRequestException("Family group not found"));

        return familyGroupRepository.getFreeAreaForGroup(familyGroup);
    }
}
