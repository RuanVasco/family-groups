package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FreeAreaAggDTO;
import br.com.cotrisoja.familyGroups.Entity.Branch;
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

    @Query("SELECT f FROM FamilyGroup f WHERE f.principal.technician = :technician ORDER BY f.principal.name")
    List<FamilyGroup> findByTechnician(@Param("technician") User technician);

    @Query("SELECT f FROM FamilyGroup f WHERE f.principal = :principal")
    Optional<FamilyGroup> findByPrincipal(@Param("principal") Farmer principal);

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

    @Query("""
        SELECT DISTINCT a.owner
        FROM Asset a
        WHERE EXISTS (
            SELECT 1 FROM FamilyGroup fg
            JOIN fg.members m
            WHERE fg = :familyGroup AND a.leasedTo = m
        )
    """)
    List<Farmer> findLessorsByFamilyGroup(@Param("familyGroup") FamilyGroup familyGroup);

    @Query("""
        SELECT SUM(a.amount)
        FROM Asset a
        JOIN Farmer f ON a.owner = f OR a.leasedTo = f
        JOIN FamilyGroup fg ON f MEMBER OF fg.members
        WHERE fg = :familyGroup
    """)
    Double getFamilyGroupTotalArea(@Param("familyGroup") FamilyGroup familyGroup);

    @Query("""
        SELECT COALESCE(SUM(a.amount), 0)
        FROM Asset a
        JOIN Farmer leased ON a.leasedTo = leased
        JOIN FamilyGroup fg ON leased MEMBER OF fg.members
        WHERE fg = :familyGroup
    """)
    Double getFamilyGroupFreeArea(@Param("familyGroup") FamilyGroup familyGroup);

    @Query("""
        SELECT new br.com.cotrisoja.familyGroups.DTO.FamilyGroup.FreeAreaAggDTO(
                   COALESCE(lfg.id, ofg.id),
                   COALESCE(SUM(a.amount), 0)
               )
        FROM   Asset a
        LEFT  JOIN a.leasedTo    l
        LEFT  JOIN l.familyGroup lfg
        LEFT  JOIN a.owner       o
        LEFT  JOIN o.familyGroup ofg
        WHERE  (lfg IN :familyGroups)
           OR  (l IS NULL AND ofg IN :familyGroups)
        GROUP BY COALESCE(lfg.id, ofg.id)
        """)
    List<FreeAreaAggDTO> getFreeAreaForGroups(
        @Param("familyGroups") List<FamilyGroup> familyGroups);


    @Query("""
        SELECT COALESCE(SUM(a.amount), 0)
        FROM   Asset a
        LEFT  JOIN a.leasedTo       l
        LEFT  JOIN l.familyGroup    lfg
        LEFT  JOIN a.owner          o
        LEFT  JOIN o.familyGroup    ofg
        WHERE  lfg = :familyGroup
           OR (ofg = :familyGroup AND l IS NULL)
    """)
    Double getFreeAreaForGroup(@Param("familyGroup") FamilyGroup familyGroup);

    @Query("""
        SELECT SUM(a.amount)
        FROM Asset a
        JOIN Farmer f ON a.owner = f
        JOIN FamilyGroup fg ON f MEMBER OF fg.members
        WHERE fg = :familyGroup AND a.leasedTo IS NULL
    """)
    Double getOwnedArea(@Param("familyGroup") FamilyGroup familyGroup);

    @Query("""
        SELECT SUM(a.amount)
        FROM Asset a
        JOIN Farmer f ON a.leasedTo = f
        JOIN FamilyGroup fg ON f MEMBER OF fg.members
        WHERE fg = :familyGroup
    """)
    Double getLeasedArea(@Param("familyGroup") FamilyGroup familyGroup);

    @Query("""
        SELECT fg
          FROM FamilyGroup fg
          JOIN fg.members m
         WHERE m = :farmer
    """)
    Optional<FamilyGroup> findByMember(@Param("farmer") Farmer farmer);

    @Query("""
        SELECT fg
            FROM FamilyGroup fg
        WHERE fg.principal.branch = :branch
    """)
    List<FamilyGroup> findByBranch(@Param("branch") Branch branch);

    @Query("""
        SELECT fg
            FROM FamilyGroup fg
        WHERE fg.principal.technician = :user
    """)
    List<FamilyGroup> findByUser(@Param("user") User user);
}
