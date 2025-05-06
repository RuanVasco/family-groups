package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;


public interface FamilyGroupRepository extends JpaRepository<FamilyGroup, Long> {

    @Query("SELECT f FROM FamilyGroup f WHERE f.principal.technician = :technician")
    List<FamilyGroup> findByTechnician(@Param("technician") User technician);

    @Query("SELECT f FROM FamilyGroup f WHERE f.principal = :principal")
    FamilyGroup findByPrincipal(@Param("principal") Farmer principal);

    @Query("SELECT fg FROM FamilyGroup fg LEFT JOIN FETCH fg.members WHERE fg.principal = :principal")
    FamilyGroup findWithMembersByPrincipal(@Param("principal") Farmer principal);

    @Query("SELECT fg FROM FamilyGroup fg LEFT JOIN FETCH fg.members WHERE fg.id = :id")
    Optional<FamilyGroup> findByIdWithMembers(@Param("id") Long id);

    @Query("""
        SELECT fg
        FROM FamilyGroup fg
        LEFT JOIN fg.principal p
        WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :value, '%'))
           OR LOWER(CAST(p.registrationNumber AS string)) LIKE LOWER(CONCAT('%', :value, '%'))
           OR CAST(fg.id AS string) LIKE CONCAT('%', :value, '%')
        """)
    Page<FamilyGroup> findByValue(@Param("value") String value, Pageable pageable);
}
