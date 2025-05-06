package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    Optional<Branch> findByName(String name);
}
