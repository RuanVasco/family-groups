package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.*;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;
import br.com.cotrisoja.familyGroups.Repository.Spec.FarmerSpecifications;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;

public interface FarmerRepository extends
        JpaRepository<Farmer, String>,
        JpaSpecificationExecutor<Farmer> {

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

    default Page<Farmer> findAvailableFarmersByName(String search, Pageable page) {
        return findAll((root, query, cb) -> {
            Subquery<Long> subquery = query.subquery(Long.class);
            Root<Farmer> subRoot = subquery.from(Farmer.class);
            subquery.select(cb.count(subRoot))
                    .where(cb.equal(subRoot.get("familyGroup"), root.get("familyGroup")));

            Predicate namePredicate = FarmerSpecifications.nameContainsTokens(search).toPredicate(root, query, cb);
            Predicate statusPredicate = cb.equal(root.get("status"), StatusEnum.ACTIVE);
            Predicate blockedPredicate = cb.equal(root.get("blocked"), false);
            Predicate noGroupPredicate = cb.isNull(root.get("familyGroup"));
            Predicate oneMemberPredicate = cb.equal(subquery, 1L);

            return cb.and(
                    namePredicate,
                    statusPredicate,
                    blockedPredicate,
                    cb.or(noGroupPredicate, oneMemberPredicate)
            );
        }, page);
    }


    default Page<Farmer> findByValue(String value, Pageable page) {

        value = (value == null) ? "" : value.trim().toLowerCase();
        String[] tokens = value.split("\\s+");

        String finalValue = value;
        Specification<Farmer> spec = (root, q, cb) -> {

            List<Predicate> nameParts = new ArrayList<>();
            for (String t : tokens) {
                nameParts.add(cb.like(cb.lower(root.get("name")), "%" + t + "%"));
            }
            Predicate nameHasAllTokens = cb.and(nameParts.toArray(Predicate[]::new));

            List<Predicate> principalParts = new ArrayList<>();
            for (String t : tokens) {
                principalParts.add(
                        cb.like(cb.lower(root.join("familyGroup")
                                .join("principal")
                                .get("name")), "%" + t + "%"));
            }
            Predicate principalHasAllTokens = cb.and(principalParts.toArray(Predicate[]::new));

            Predicate regLike = cb.like(
                    cb.lower(root.get("registrationNumber").as(String.class)),
                    "%" + finalValue + "%");

            return cb.or(nameHasAllTokens, principalHasAllTokens, regLike);
        };
        return findAll(spec, page);
    }


    default Page<Farmer> findByValueAndType(String value, Long typeId, Pageable page) {
        Specification<Farmer> baseType =
                (r, q, cb) -> cb.equal(r.get("type").get("id"), typeId);

        Specification<Farmer> nameTokens = FarmerSpecifications.nameContainsTokens(value);

        Specification<Farmer> regNumber = (r, q, cb) -> {
            if (value == null || value.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(r.get("registrationNumber").as(String.class)), "%" + value.toLowerCase() + "%");
        };

        Specification<Farmer> principalTokens = (r, q, cb) -> {
            if (value == null || value.isBlank()) return cb.conjunction();
            String[] toks = value.trim().toLowerCase().split("\\s+");
            var principal = r.join("familyGroup").join("principal");
            List<Predicate> ps = new ArrayList<>();
            for (String t : toks) {
                ps.add(cb.like(cb.lower(principal.get("name")), "%" + t + "%"));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };

        Specification<Farmer> full = baseType.and(
                Specification.where(nameTokens).or(regNumber).or(principalTokens)
        );

        return findAll(full, page);
    }

    Page<Farmer> findByTechnician(User technician, Pageable pageable);

    default Page<Farmer> findByTechnicianWithSearch(User tech, String search, Pageable page) {
        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.equal(r.get("technician"), tech))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    Page<Farmer> findByTechnicianIsNull(Pageable pageable);

    default Page<Farmer> findByTechnicianIsNullWithSearch(String search, Pageable page) {
        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.isNull(r.get("technician")))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    Page<Farmer> findByTechnicianAndType(User technician, Type type, Pageable pageable);

    default Page<Farmer> findByTechnicianAndTypeWithSearch(
            User tech, Type type, String search, Pageable page) {

        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.equal(r.get("technician"), tech))
                .and((r, q, cb) -> cb.equal(r.get("type"), type))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    Page<Farmer> findByTechnicianIsNullAndType(Type type, Pageable pageable);

    default Page<Farmer> findByTechnicianIsNullAndTypeWithSearch(
            Type type, String search, Pageable page) {

        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.isNull(r.get("technician")))
                .and((r, q, cb) -> cb.equal(r.get("type"), type))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    Page<Farmer> findByBranch(Branch branch, Pageable pageable);

    default Page<Farmer> findByEffectiveBranchWithSearch(
            Branch branch, String search, Pageable page) {

        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.equal(r.get("branch"), branch))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    /* --------------------------------------------------------------------- */
    /* CARTEIRA + TIPO ------------------------------------------------------ */
    /* --------------------------------------------------------------------- */
    Page<Farmer> findByBranchAndType(Branch branch, Type type, Pageable pageable);

    default Page<Farmer> findByEffectiveBranchAndTypeWithSearch(
            Branch branch, Type type, String search, Pageable page) {

        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.equal(r.get("branch"), branch))
                .and((r, q, cb) -> cb.equal(r.get("type"), type))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    Page<Farmer> findByType(Type type, Pageable pageable);
}
