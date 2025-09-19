package br.com.cotrisoja.familyGroups.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Setter
@Getter
public class FamilyGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "principal_farmer_id")
    private Farmer principal;

    @OneToMany(mappedBy = "familyGroup")
    @JsonIgnore
    @OrderBy("name ASC")
    private List<Farmer> members;

    private String registry;

    private Double canolaArea = 0.0;
    private Double canolaAreaParticipation = 0.0;

    private Double wheatArea = 0.0;
    private Double wheatAreaParticipation = 0.0;

    private Double cornSilageArea = 0.0;
    private Double cornSilageAreaParticipation = 0.0;

    private Double grainCornArea = 0.0;
    private Double grainCornAreaParticipation = 0.0;

    private Double beanArea = 0.0;
    private Double beanAreaParticipation = 0.0;

    private Double soybeanArea = 0.0;
    private Double soybeanAreaParticipation = 0.0;

    public void setPrincipal(Farmer principal) {
        this.principal = principal;

        if (this.members == null) {
            this.members = new ArrayList<>();
        }

        if (!this.members.contains(principal)) {
            this.members.add(principal);
        }

        principal.setFamilyGroup(this);
    }

    private float getTotalAvailableArea() {
        return members != null
                ? (float) members.stream()
                .mapToDouble(f -> f.getOwnedArea() + f.getLeasedArea())
                .sum()
                : 0f;
    }

//    @PrePersist
//    @PreUpdate
//    private void validateTotalAreas() {
//        float totalAvailable = getTotalAvailableArea();
//
//        double totalUsed = canolaArea + wheatArea + cornSilageArea + grainCornArea + beanArea + soybeanArea;
//
//        if (totalUsed > totalAvailable) {
//            throw new IllegalStateException(
//                    String.format("A soma das áreas cultivadas (%.2f ha) excede a área total disponível (%.2f ha).",
//                            totalUsed, totalAvailable)
//            );
//        }
//
//        if (canolaArea < 0 || wheatArea < 0 || cornSilageArea < 0 ||
//                grainCornArea < 0 || beanArea < 0 || soybeanArea < 0) {
//            throw new IllegalStateException("Áreas cultivadas não podem ser negativas.");
//        }
//    }
}
