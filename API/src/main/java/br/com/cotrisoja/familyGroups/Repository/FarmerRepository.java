package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.Type;
import br.com.cotrisoja.familyGroups.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.parameters.P;

import java.util.List;
import java.util.Set;

public interface FarmerRepository extends JpaRepository<Farmer, String> {

//    @Query("""
//    SELECT f FROM Farmer f
//        WHERE f.status = 'ACTIVE' AND
//              (f.familyGroup IS NULL OR f.familyGroup.id IN (
//                  SELECT fg.id FROM FamilyGroup fg
//                  JOIN fg.members m
//                  GROUP BY fg.id
//                  HAVING COUNT(m) = 1
//              ))
//    """)
//    Page<Farmer> findAvailableFarmers(Pageable pageable);

    @Query("""
        SELECT f FROM Farmer f
        WHERE f.status = 'ACTIVE'
          AND (f.familyGroup IS NULL OR f.familyGroup.id IN (
               SELECT fg.id FROM FamilyGroup fg
               JOIN fg.members m
               GROUP BY fg.id
               HAVING COUNT(m) = 1))
    """)
    Page<Farmer> findAvailableFarmers(Pageable pageable);

    @Query("""
    SELECT f FROM Farmer f
    WHERE f.status = 'ACTIVE'
      AND (f.familyGroup IS NULL OR f.familyGroup.id IN (
           SELECT fg.id FROM FamilyGroup fg
           JOIN fg.members m
           GROUP BY fg.id
           HAVING COUNT(m) = 1))
      AND LOWER(CAST(f.name AS text)) LIKE LOWER(CONCAT('%', :search, '%'))
""")
    Page<Farmer> findAvailableFarmersByName(@Param("search") String search, Pageable pageable);

    @Query("""
        SELECT f
        FROM   Farmer f
        LEFT JOIN f.familyGroup fg
        LEFT JOIN fg.principal p
        WHERE  LOWER(f.name) LIKE LOWER(CONCAT('%', :value, '%'))
           OR  LOWER(CAST(f.registrationNumber AS string)) LIKE LOWER(CONCAT('%', :value, '%'))
           OR  LOWER(p.name) LIKE LOWER(CONCAT('%', :value, '%'))
        """)
    Page<Farmer> findByValue(@Param("value") String value, Pageable pageable);

    @Query("SELECT f FROM Farmer f WHERE f.technician = :technician")
    Page<Farmer> findByTechnician(@Param("technician") User technician, Pageable pageable);

    @Query("""
        SELECT f FROM Farmer f
        WHERE f.technician = :technician
          AND LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    Page<Farmer> findByTechnicianWithSearch(
            @Param("technician") User technician,
            @Param("search") String search,
            Pageable pageable);

    /* ---- Sem Técnico ---- */
    @Query("SELECT f FROM Farmer f WHERE f.technician IS NULL")
    Page<Farmer> findWithoutTechnician(Pageable pageable);

    @Query("""
        SELECT f FROM Farmer f
        WHERE f.technician IS NULL
          AND LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    Page<Farmer> findWithoutTechnicianWithSearch(
            @Param("search") String search,
            Pageable pageable);

    /* ---- Por Técnico + Tipo ---- */
    @Query("""
        SELECT f FROM Farmer f
        WHERE f.technician = :technician AND f.type = :type
    """)
    Page<Farmer> findByTechnicianAndType(
            @Param("technician") User technician,
            @Param("type") Type type,
            Pageable pageable);

    @Query("""
        SELECT f FROM Farmer f
        WHERE f.technician = :technician AND f.type = :type
          AND LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    Page<Farmer> findByTechnicianAndTypeWithSearch(
            @Param("technician") User technician,
            @Param("type") Type type,
            @Param("search") String search,
            Pageable pageable);

    /* ---- Sem Técnico + Tipo ---- */
    @Query("""
        SELECT f FROM Farmer f
        WHERE f.technician IS NULL AND f.type = :type
    """)
    Page<Farmer> findWithoutTechnicianAndType(
            @Param("type") Type type,
            Pageable pageable);

    @Query("""
        SELECT f FROM Farmer f
        WHERE f.technician IS NULL AND f.type = :type
          AND LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    Page<Farmer> findWithoutTechnicianAndTypeWithSearch(
            @Param("type") Type type,
            @Param("search") String search,
            Pageable pageable);

    /* ---- Por Carteira (Branch) ---- */
    @Query("SELECT f FROM Farmer f WHERE f.branch = :branch")
    Page<Farmer> findByEffectiveBranch(
            @Param("branch") Branch branch,
            Pageable pageable);

    @Query("""
        SELECT f FROM Farmer f
        WHERE f.branch = :branch
          AND LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    Page<Farmer> findByEffectiveBranchWithSearch(
            @Param("branch") Branch branch,
            @Param("search") String search,
            Pageable pageable);

    /* ---- Carteira + Tipo ---- */
    @Query("""
        SELECT f FROM Farmer f
        WHERE f.branch = :branch AND f.type = :type
    """)
    Page<Farmer> findByEffectiveBranchAndType(
            @Param("branch") Branch branch,
            @Param("type") Type type,
            Pageable pageable);

    @Query("""
        SELECT f FROM Farmer f
        WHERE f.branch = :branch AND f.type = :type
          AND LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    Page<Farmer> findByEffectiveBranchAndTypeWithSearch(
            @Param("branch") Branch branch,
            @Param("type") Type type,
            @Param("search") String search,
            Pageable pageable);
}
