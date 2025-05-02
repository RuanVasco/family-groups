package br.com.cotrisoja.familyGroups.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class FamilyGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "principal_farmer_id")
    private Farmer principal;

    @OneToMany(mappedBy = "familyGroup")
    private List<Farmer> members;

    private String registry;

    private float canolaArea;
    private float wheatArea;
    private float cornSilageArea;
    private float grainCornArea;
    private float beanArea;
    private float soybeanArea;

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

    private float getTotalAvailableArea() {
        return members != null
                ? members.stream().map(f -> f.getOwnedArea() + f.getLeasedArea()).reduce(0f, Float::sum)
                : 0f;
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
        float totalAvailable = getTotalAvailableArea();

        if (value > totalAvailable) {
            throw new IllegalArgumentException("Área de " + cropName + " não pode exceder a área total disponível.");
        }

        float otherCrops = getUsedAreaExcept(cropName);
        if (value + otherCrops > totalAvailable) {
            throw new IllegalArgumentException("A soma das áreas cultivadas excede a área total disponível.");
        }

        setter.accept(value);
    }
}
