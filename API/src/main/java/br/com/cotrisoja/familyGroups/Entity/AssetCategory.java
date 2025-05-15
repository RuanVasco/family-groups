package br.com.cotrisoja.familyGroups.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class AssetCategory {
    @Id
    private Long id;

    private String description;

    public AssetCategory() {};

    public AssetCategory(Long id, String description) {
        this.id = id;
        this.description = description;
    }
}
