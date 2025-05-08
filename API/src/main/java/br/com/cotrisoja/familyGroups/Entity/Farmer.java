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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    private double ownedArea;
    private double leasedArea;

    @ManyToOne
    @JoinColumn(name = "technician_id")
    private User technician;

    public boolean isValid() {
        return this.status == StatusEnum.ACTIVE && this.familyGroup == null;
    }
}
