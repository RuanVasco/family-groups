package br.com.cotrisoja.familyGroups.Repository;

import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.Type;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;
import br.com.cotrisoja.familyGroups.Repository.Spec.FarmerSpecifications;
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
        Specification<Farmer> spec = Specification.<Farmer>where(FarmerSpecifications.nameContainsTokens(search))
                .and((r, q, cb) -> cb.equal(r.get("status"), StatusEnum.ACTIVE))
                .and((r, q, cb) -> cb.or(
                        cb.isNull(r.get("familyGroup")),
                        cb.equal(cb.size(r.get("familyGroup").get("members")), 1)
                ));
        return findAll(spec, page);
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


    default Page<Farmer> findByValueAndType(String value,
                                            Long   typeId,
                                            Pageable page) {

        Specification<Farmer> baseType =
                (r, q, cb) -> cb.equal(r.get("type").get("id"), typeId);


        Specification<Farmer> nameTokens =
                FarmerSpecifications.nameContainsTokens(value);

        Specification<Farmer> principalTokens = (r, q, cb) -> {
            if (value == null || value.isBlank()) return cb.conjunction();
            String[] toks = value.trim().toLowerCase().split("\\s+");
            var principal = r.join("familyGroup").join("principal");
            List<Predicate> ps = new ArrayList<>();
            for (String t : toks) {
                ps.add(cb.like(cb.lower(principal.get("name")), "%" + t + "%"));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };

        String like = "%" + value.toLowerCase() + "%";
        Specification<Farmer> regNumber =
                (r, q, cb) -> cb.like(cb.lower(r.get("registrationNumber")
                        .as(String.class)), like);

        Specification<Farmer> full =
                baseType.and( nameTokens.or(regNumber).or(principalTokens) );

        System.out.println(nameTokens);

        return findAll(full, page);
    }

    /* --------------------------------------------------------------------- */
    /* POR TÉCNICO ---------------------------------------------------------- */
    /* --------------------------------------------------------------------- */
    Page<Farmer> findByTechnician(User technician, Pageable pageable);

    default Page<Farmer> findByTechnicianWithSearch(User tech, String search, Pageable page) {
        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.equal(r.get("technician"), tech))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    /* --------------------------------------------------------------------- */
    /* SEM TÉCNICO ---------------------------------------------------------- */
    /* --------------------------------------------------------------------- */
    Page<Farmer> findByTechnicianIsNull(Pageable pageable);

    default Page<Farmer> findByTechnicianIsNullWithSearch(String search, Pageable page) {
        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.isNull(r.get("technician")))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    /* --------------------------------------------------------------------- */
    /* POR TÉCNICO + TIPO --------------------------------------------------- */
    /* --------------------------------------------------------------------- */
    Page<Farmer> findByTechnicianAndType(User technician, Type type, Pageable pageable);

    default Page<Farmer> findByTechnicianAndTypeWithSearch(
            User tech, Type type, String search, Pageable page) {

        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.equal(r.get("technician"), tech))
                .and((r, q, cb) -> cb.equal(r.get("type"), type))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    /* --------------------------------------------------------------------- */
    /* SEM TÉCNICO + TIPO --------------------------------------------------- */
    /* --------------------------------------------------------------------- */
    Page<Farmer> findByTechnicianIsNullAndType(Type type, Pageable pageable);

    default Page<Farmer> findByTechnicianIsNullAndTypeWithSearch(
            Type type, String search, Pageable page) {

        Specification<Farmer> spec = Specification.<Farmer>where(
                        (r, q, cb) -> cb.isNull(r.get("technician")))
                .and((r, q, cb) -> cb.equal(r.get("type"), type))
                .and(FarmerSpecifications.nameContainsTokens(search));
        return findAll(spec, page);
    }

    /* --------------------------------------------------------------------- */
    /* POR CARTEIRA (BRANCH) ------------------------------------------------ */
    /* --------------------------------------------------------------------- */
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

    /* --------------------------------------------------------------------- */
    /* SOMENTE TIPO --------------------------------------------------------- */
    /* --------------------------------------------------------------------- */
    Page<Farmer> findByType(Long typeId, Pageable pageable);
}
