package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findByName(String name);

    @Query("""
    SELECT b
        FROM Branch b
        WHERE LOWER(b.name) LIKE LOWER(CONCAT('%', :value, '%'))
           OR CAST(b.id AS string) LIKE LOWER(CONCAT('%', :value, '%'))
    """)
    List<Branch> findByValue(@Param("value") String value);
}
