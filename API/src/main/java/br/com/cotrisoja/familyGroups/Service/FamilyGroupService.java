package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FamilyGroupRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.FamilyGroupRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class FamilyGroupService {

    private final FamilyGroupRepository familyGroupRepository;
    private final FarmerRepository farmerRepository;

    public Set<FamilyGroup> findByTechnician(User user) {
        return familyGroupRepository.findByTechnician(user);
    }

    public FamilyGroup create(FamilyGroupRequestDTO familyGroupRequestDTO, User technician) {
        Farmer principal = farmerRepository.findById(familyGroupRequestDTO.principalId())
                .orElseThrow(() -> new RuntimeException("Produtor principal não encontrado"));

        FamilyGroup familyGroup = new FamilyGroup();
        familyGroup.setPrincipal(principal);
        familyGroup.setTechnician(technician);

        return familyGroupRepository.save(familyGroup);
    }

}
