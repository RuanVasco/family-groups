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
        Long technicianId
) {
    public Farmer toEntity(FamilyGroup familyGroup, User user) {
        Farmer farmer = new Farmer();
        farmer.setRegistrationNumber(this.registrationNumber);
        farmer.setName(this.name);
        farmer.setStatus(this.status);
        farmer.setFamilyGroup(familyGroup);

        farmer.setTechnician(user);

        return farmer;
    }
}
