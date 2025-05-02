package br.com.cotrisoja.familyGroups.Entity;

import br.com.cotrisoja.familyGroups.Enum.StatusEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Farmer {
    @Id
    @Column(name = "registration_number", nullable = false, unique = true)
    private String registrationNumber;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusEnum status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id")
    private FamilyGroup familyGroup;

    private float ownedArea;
    private float leasedArea;

    private float canolaArea;
    private float wheatArea;
    private float cornSilageArea;
    private float grainCornArea;
    private float beanArea;
    private float soybeanArea;

    @ManyToOne
    @JoinColumn(name = "technician_id")
    private User technician;

    private float getTotalArea() {
        return ownedArea + leasedArea;
    }

    private float getUsedAreaExcept(String crop) {
        return (crop.equals("canola") ? 0 : canolaArea)
                + (crop.equals("wheat") ? 0 : wheatArea)
                + (crop.equals("cornSilage") ? 0 : cornSilageArea)
                + (crop.equals("grainCorn") ? 0 : grainCornArea)
                + (crop.equals("bean") ? 0 : beanArea)
                + (crop.equals("soybean") ? 0 : soybeanArea);
    }

    private void validateAndSet(String cropName, float value, java.util.function.Consumer<Float> setter) {
        float totalAvailable = getTotalArea();
        if (value > totalAvailable) {
            throw new IllegalArgumentException(cropName + " area cannot exceed total available area.");
        }

        float otherCropsSum = getUsedAreaExcept(cropName);
        if (value + otherCropsSum > totalAvailable) {
            throw new IllegalArgumentException("Sum of all crop areas cannot exceed total available area.");
        }

        setter.accept(value);
    }

    public void setCanolaArea(float canolaArea) {
        validateAndSet("canola", canolaArea, v -> this.canolaArea = v);
    }

    public void setWheatArea(float wheatArea) {
        validateAndSet("wheat", wheatArea, v -> this.wheatArea = v);
    }

    public void setCornSilageArea(float cornSilageArea) {
        validateAndSet("cornSilage", cornSilageArea, v -> this.cornSilageArea = v);
    }

    public void setGrainCornArea(float grainCornArea) {
        validateAndSet("grainCorn", grainCornArea, v -> this.grainCornArea = v);
    }

    public void setBeanArea(float beanArea) {
        validateAndSet("bean", beanArea, v -> this.beanArea = v);
    }

    public void setSoybeanArea(float soybeanArea) {
        validateAndSet("soybean", soybeanArea, v -> this.soybeanArea = v);
    }

    public boolean isValid() {
        return this.status == StatusEnum.ACTIVE && this.familyGroup == null;
    }
}
