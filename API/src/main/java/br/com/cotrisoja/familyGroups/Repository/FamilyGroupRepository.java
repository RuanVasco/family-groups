package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, Long> {

    @Query("SELECT f FROM FamilyGroup f WHERE f.principal.technician = :technician")
    List<FamilyGroup> findByTechnician(@Param("technician") User technician);
}
