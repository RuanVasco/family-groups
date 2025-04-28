package br.com.cotrisoja.familyGroups.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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

    @ManyToOne
    @JoinColumn(name = "technician_id")
    private User technician;

    private String registry;
}
