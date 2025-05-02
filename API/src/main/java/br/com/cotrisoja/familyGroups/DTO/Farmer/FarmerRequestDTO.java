package br.com.cotrisoja.familyGroups.DTO.Farmer;

import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;

public record FarmerRequestDTO (
        String registrationNumber,
        String name,
        StatusEnum status,
        Long familyGroupId,
        Long technicianId,
        float ownedArea,
        float leasedArea
) {
    public Farmer toEntity(FamilyGroup familyGroup, User user) {
        Farmer farmer = new Farmer();
        farmer.setRegistrationNumber(this.registrationNumber);
        farmer.setName(this.name);
        farmer.setStatus(this.status);
        farmer.setFamilyGroup(familyGroup);
        farmer.setOwnedArea(this.ownedArea);
        farmer.setLeasedArea(this.leasedArea);
        farmer.setTechnician(user);
        return farmer;
    }
}
