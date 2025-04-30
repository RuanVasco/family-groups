package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Set;

public interface FarmerRepository extends JpaRepository<Farmer, String> {

    @Query("SELECT f FROM Farmer f WHERE f.familyGroup IS NULL AND f.status = 'ACTIVE'")
    Set<Farmer> findAvaibleFarmers();
}
