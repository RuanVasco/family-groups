package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface FarmerRepository extends JpaRepository<Farmer, String> {

    @Query("SELECT f FROM Farmer f WHERE f.familyGroup IS NULL AND f.status = 'ACTIVE'")
    Set<Farmer> findAvaibleFarmers();

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
    List<Farmer> findByTechnician(@Param("technician") User technician);

    @Query("SELECT f FROM Farmer f WHERE f.technician.branch = :branch")
    List<Farmer> findByBranch(@Param("branch") Branch branch);
}
