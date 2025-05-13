package br.com.cotrisoja.familyGroups.DTO.Farmer;

import br.com.cotrisoja.familyGroups.Entity.*;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;

public record FarmerRequestDTO (
        String registrationNumber,
        String name,
        StatusEnum status,
        Long familyGroupId,
        Long technicianId,
        Integer typeId,
        double ownedArea,
        double leasedArea,
        Long branch
) {
    public Farmer toEntity(FamilyGroup familyGroup, User user, Type type, Branch branch) {
        Farmer farmer = new Farmer();
        farmer.setRegistrationNumber(this.registrationNumber);
        farmer.setName(this.name);
        farmer.setStatus(this.status);
        farmer.setFamilyGroup(familyGroup);
        farmer.setOwnedArea(this.ownedArea);
        farmer.setLeasedArea(this.leasedArea);
        farmer.setBranch(branch);
        farmer.setTechnician(user);

        if (type != null) {
            farmer.setType(type);
        }
        return farmer;
    }
}
