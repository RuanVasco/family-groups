package br.com.cotrisoja.familyGroups.Entity;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
public class AssetId implements Serializable {
    private String owner;
    private Long idSap;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AssetId that = (AssetId) o;
        return Objects.equals(owner, that.owner) && Objects.equals(idSap, that.idSap);
    }

    @Override
    public int hashCode() {
        return Objects.hash(owner, idSap);
    }
}
