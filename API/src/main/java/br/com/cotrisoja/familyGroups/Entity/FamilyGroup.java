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
}
