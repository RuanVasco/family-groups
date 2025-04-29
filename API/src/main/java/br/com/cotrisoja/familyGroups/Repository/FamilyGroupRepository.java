package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Set;

public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, Long> {
    Set<FamilyGroup> findByTechnician(User technician);
}
