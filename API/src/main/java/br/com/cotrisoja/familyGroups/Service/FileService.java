package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.Entity.FamilyGroup;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;
import br.com.cotrisoja.familyGroups.Repository.BranchRepository;
import br.com.cotrisoja.familyGroups.Repository.FamilyGroupRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class FileService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    @Async("fileUploadExecutor")
    public void uploadFile(MultipartFile file) throws IOException {

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String header = reader.readLine();
            List<String> lines = reader.lines().toList();

            for (String row : lines) {
                String[] columns = row.split(";", -1);

                String farmerRegistration = getCol(columns, 0);
                String farmerName = getCol(columns, 1);
                String farmerStatus = getCol(columns, 2);
                String familyGroupPrincipalRegistrationNumber = getCol(columns, 3);
                double farmerOwnedArea = parseDouble(columns, 6, "ownedArea", row);
                double farmerLeasedArea = parseDouble(columns, 7, "leasedArea", row);

                double canolaArea = parseDouble(columns, 8, "canolaArea", row);
                double wheatArea = parseDouble(columns, 9, "wheatArea", row);
                double cornSilageArea = parseDouble(columns, 10, "cornSilageArea", row);
                double grainCornArea = parseDouble(columns, 11, "grainCornArea", row);
                double beanArea = parseDouble(columns, 12, "beanArea", row);
                double soybeanArea = parseDouble(columns, 13, "soybeanArea", row);

                Optional<Farmer> optionalFarmer = farmerRepository.findById(farmerRegistration);

                Long technicianId = Long.parseLong(columns[4]);

                User user = null;
                Optional<User> optionalUser = userRepository.findById(technicianId);
                if (optionalUser.isPresent()) {
                    user = optionalUser.get();
                }

                Farmer farmer;
                if (optionalFarmer.isEmpty()) {
                    farmer = new Farmer();
                    farmer.setRegistrationNumber(farmerRegistration);
                    farmer.setName(farmerName);
                    farmer.setTechnician(user);
                    farmer.setOwnedArea(farmerOwnedArea);
                    farmer.setLeasedArea(farmerLeasedArea);
                    farmer.setStatus(farmerStatus.equalsIgnoreCase("Normal") ? StatusEnum.ACTIVE : StatusEnum.DECEASED);
                    farmer = farmerRepository.save(farmer);
                } else {
                    farmer = optionalFarmer.get();
                    log.warn("Produtor {} - {} já existente, duplicidade ignorada",
                            optionalFarmer.get().getRegistrationNumber(),
                            optionalFarmer.get().getName());
                }

                if (farmer.getRegistrationNumber().equals(familyGroupPrincipalRegistrationNumber)) {
                    FamilyGroup group = new FamilyGroup();
                    group.setPrincipal(farmer);
                    group.setCanolaArea(canolaArea);
                    group.setWheatArea(wheatArea);
                    group.setCornSilageArea(cornSilageArea);
                    group.setGrainCornArea(grainCornArea);
                    group.setBeanArea(beanArea);
                    group.setSoybeanArea(soybeanArea);
                    familyGroupRepository.save(group);
                    farmer.setFamilyGroup(group);
                }
            }

            for (String row : lines) {
                String[] columns = row.split(";", -1);

                String farmerRegistration = getCol(columns, 0);
                String familyGroupPrincipalRegistrationNumber = getCol(columns, 3);

                Optional<Farmer> optionalFarmer = farmerRepository.findById(farmerRegistration);
                Optional<Farmer> optionalPrincipal = farmerRepository.findById(familyGroupPrincipalRegistrationNumber);

                if (optionalFarmer.isEmpty() || optionalPrincipal.isEmpty()) {
                    continue;
                }

                Farmer farmer = optionalFarmer.get();
                Farmer principal = optionalPrincipal.get();

                FamilyGroup familyGroup = familyGroupRepository.findWithMembersByPrincipal(principal);

                if (familyGroup == null) {
                    log.warn("Grupo familiar não encontrado para o produtor principal: {}", principal.getRegistrationNumber());
                    continue;
                }

                if (!familyGroup.getMembers().contains(farmer)) {
                    familyGroup.getMembers().add(farmer);
                }

                familyGroupRepository.save(familyGroup);

                farmer.setFamilyGroup(familyGroup);
                farmerRepository.save(farmer);
            }

        } catch (IOException e) {
            log.error("Erro ao processar arquivo CSV: {}", e.getMessage());
            throw new IOException(e);
        }
    }

    private String getCol(String[] columns, int index) {
        return index < columns.length ? columns[index].trim() : "";
    }

    private Double parseDouble(String[] columns, int index, String field, String row) {
        try {
            String raw = getCol(columns, index);
            return raw.isEmpty() ? 0.0 : Double.parseDouble(raw.replace(",", "."));
        } catch (NumberFormatException e) {
            log.warn("Valor inválido no campo '{}': '{}' | linha: {}", field, columns[index], row);
            return 0.0;
        }
    }
}
