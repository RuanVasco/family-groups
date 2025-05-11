package br.com.cotrisoja.familyGroups.DTO.Farmer;

import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.Type;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;

public record FarmerRequestDTO (
        String registrationNumber,
        String name,
        StatusEnum status,
        Long familyGroupId,
        Long technicianId,
        Integer typeId,
        double ownedArea,
        double leasedArea
) {
    public Farmer toEntity(FamilyGroup familyGroup, User user, Type type) {
        Farmer farmer = new Farmer();
        farmer.setRegistrationNumber(this.registrationNumber);
        farmer.setName(this.name);
        farmer.setStatus(this.status);
        farmer.setFamilyGroup(familyGroup);
        farmer.setOwnedArea(this.ownedArea);
        farmer.setLeasedArea(this.leasedArea);
        farmer.setTechnician(user);

        if (type != null) {
            farmer.setType(type);
        }
        return farmer;
    }
}
