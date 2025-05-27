package br.com.cotrisoja.familyGroups.Repository.Spec;

import br.com.cotrisoja.familyGroups.Entity.Farmer;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;


public final class FarmerSpecifications {

    private FarmerSpecifications() {}


    public static Specification<Farmer> nameContainsTokens(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            String[] tokens = search.trim()
                    .toLowerCase()
                    .split("\\s+");

            List<Predicate> predicates = new ArrayList<>(tokens.length);
            for (String token : tokens) {
                predicates.add(cb.like(cb.lower(root.get("name")),
                        "%" + token + "%"));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}