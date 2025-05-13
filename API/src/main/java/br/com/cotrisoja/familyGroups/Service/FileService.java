package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.Entity.*;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;
import br.com.cotrisoja.familyGroups.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class FileService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final TypeRepository typeRepository;
    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    @Async("fileUploadExecutor")
    public void uploadFile(MultipartFile file) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            reader.readLine();
            List<String> lines = reader.lines().toList();

            for (String row : lines) {
                try {
                    if ("dados_produtores.csv".equals(file.getOriginalFilename())) {
                        processTypeUpdate(row);
                    } else {
                        processFarmerRow(row);
                    }
                } catch (Exception e) {
                    log.warn("Erro ao processar linha: {}\nMotivo: {}", row, e.getMessage());
                }
            }

            for (String row : lines) {
                try {
                    if (!"dados_produtores.csv".equals(file.getOriginalFilename())) {
                        associateFarmerToGroup(row);
                    }
                } catch (Exception e) {
                    log.warn("Erro ao associar produtor ao grupo: {}\nMotivo: {}", row, e.getMessage());
                }
            }
        } catch (IOException e) {
            log.error("Erro ao ler o arquivo CSV: {}", e.getMessage());
            throw e;
        }
    }

    private void processTypeUpdate(String row) {
        String[] columns = row.split(";", -1);

        if (columns.length < 2) {
            log.warn("Linha inválida: {}", row);
            return;
        }

        String registrationNumber = columns[0].trim();
        String groupIdRaw = columns[1].replaceAll("^G0*", "").trim();

        try {
            Integer groupID = Integer.parseInt(groupIdRaw);

            farmerRepository.findById(registrationNumber).ifPresent(farmer -> {
                if (farmer.getType() != null && farmer.getType().getId() == 1) return;

                typeRepository.findById(groupID)
                        .filter(type -> !type.equals(farmer.getType()))
                        .ifPresent(type -> {
                            farmer.setType(type);
                            farmerRepository.save(farmer);
                            log.info("Produtor {} atualizado para tipo {}", registrationNumber, type.getDescription());
                        });
            });

        } catch (NumberFormatException e) {
            log.warn("Group ID inválido na linha: {}", row);
        }
    }

    private void processFarmerRow(String row) {
        String[] columns = row.split(";", -1);

        String farmerRegistration = getCol(columns, 0);
        String farmerName = getCol(columns, 1);
        String farmerStatus = getCol(columns, 2);
        String principalRegistration = getCol(columns, 3);
        String technicianName = getCol(columns, 5);

        double ownedArea = parseDouble(columns, 6, "ownedArea", row);
        double leasedArea = parseDouble(columns, 7, "leasedArea", row);
//        double canolaArea = parseDouble(columns, 8, "canolaArea", row);
//        double wheatArea = parseDouble(columns, 9, "wheatArea", row);
//        double cornSilageArea = parseDouble(columns, 10, "cornSilageArea", row);
//        double grainCornArea = parseDouble(columns, 11, "grainCornArea", row);
//        double beanArea = parseDouble(columns, 12, "beanArea", row);
//        double soybeanArea = parseDouble(columns, 13, "soybeanArea", row);

        String branchName = getCol(columns, 14);
        Branch branch = findOrCreateBranch(branchName);

        User technician;
        if (!technicianName.equals("SEM TECNICO")) {
            technician = findOrCreateUser(technicianName);
        } else {
            technician = null;
        }

        Farmer farmer = farmerRepository.findById(farmerRegistration).orElseGet(() -> {
            Farmer f = new Farmer();
            f.setRegistrationNumber(farmerRegistration);
            f.setName(farmerName);

            if (technician != null) {
                f.setTechnician(technician);
            }

            f.setBranch(branch);
            f.setOwnedArea(ownedArea);
            f.setLeasedArea(leasedArea);
            f.setStatus("Normal".equalsIgnoreCase(farmerStatus) ? StatusEnum.ACTIVE : StatusEnum.DECEASED);
            return farmerRepository.save(f);
        });

        if (farmer.getRegistrationNumber().equals(principalRegistration)) {
            FamilyGroup group = new FamilyGroup();
            group.setPrincipal(farmer);
//            group.setCanolaArea(canolaArea);
//            group.setWheatArea(wheatArea);
//            group.setCornSilageArea(cornSilageArea);
//            group.setGrainCornArea(grainCornArea);
//            group.setBeanArea(beanArea);
//            group.setSoybeanArea(soybeanArea);
            familyGroupRepository.save(group);
            farmer.setFamilyGroup(group);
            farmerRepository.save(farmer);
        }
    }

    private void associateFarmerToGroup(String row) {
        String[] columns = row.split(";", -1);
        String farmerReg = getCol(columns, 0);
        String principalReg = getCol(columns, 3);

        Optional<Farmer> farmerOpt = farmerRepository.findById(farmerReg);
        Optional<Farmer> principalOpt = farmerRepository.findById(principalReg);

        if (farmerOpt.isEmpty() || principalOpt.isEmpty()) return;

        Farmer farmer = farmerOpt.get();
        Farmer principal = principalOpt.get();
        FamilyGroup group = familyGroupRepository.findWithMembersByPrincipal(principal);
        if (group == null) {
            log.warn("Grupo familiar não encontrado para o produtor principal: {}", principalReg);
            return;
        }

             double canolaArea      = parseDouble(columns, 8,  "canolaArea",      row);
             double wheatArea       = parseDouble(columns, 9,  "wheatArea",       row);
             double cornSilageArea  = parseDouble(columns,10,  "cornSilageArea",  row);
             double grainCornArea   = parseDouble(columns,11,  "grainCornArea",   row);
             double beanArea        = parseDouble(columns,12,  "beanArea",        row);
             double soybeanArea     = parseDouble(columns,13,  "soybeanArea",     row);

             group.setCanolaArea     (group.getCanolaArea()     + canolaArea);
             group.setWheatArea      (group.getWheatArea()      + wheatArea);
             group.setCornSilageArea (group.getCornSilageArea() + cornSilageArea);
             group.setGrainCornArea  (group.getGrainCornArea()  + grainCornArea);
             group.setBeanArea       (group.getBeanArea()       + beanArea);
             group.setSoybeanArea    (group.getSoybeanArea()    + soybeanArea);

        if (!group.getMembers().contains(farmer)) {
            group.getMembers().add(farmer);
            familyGroupRepository.save(group);
            farmer.setFamilyGroup(group);
            farmerRepository.save(farmer);
        }
    }

    private Branch findOrCreateBranch(String name) {
        return branchRepository.findByName(name)
                .orElseGet(() -> branchRepository.save(new Branch(name)));
    }

    private User findOrCreateUser(String name) {
        if (name == null || name.isEmpty()) return null;

        return userRepository.findByUsername(generateUsersname(name)).orElseGet(() -> {
            User user = new User();
            user.setUsername(generateUsersname(name));
            user.setName(name);
            user.setRoles(Set.of("ROLE_USER", "ROLE_TECHNICIAN"));
            user.setPassword("!");
            return userRepository.save(user);
        });
    }

    private String generateUsersname(String name) {
        return name.toLowerCase(Locale.ROOT).replace(" ", "_");
    }


//    @Async("fileUploadExecutor")
//    public void uploadFile(MultipartFile file) throws IOException {
//
//        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
//            String header = reader.readLine();
//            List<String> lines = reader.lines().toList();
//
//            for (String row : lines) {
//                String[] columns = row.split(";", -1);
//
//                String branchName = getCol(columns, 6);
//
//                Long technicianId = StringUtils.hasText(columns[4]) ? Long.parseLong(columns[4]) : null;
//                String technicianName = getCol(columns, 5);
//
//                String farmerRegistration = getCol(columns, 0);
//                String farmerName = getCol(columns, 1);
//                String farmerStatus = getCol(columns, 2);
//                String familyGroupPrincipalRegistrationNumber = getCol(columns, 3);
//                double farmerOwnedArea = parseDouble(columns, 6, "ownedArea", row);
//                double farmerLeasedArea = parseDouble(columns, 7, "leasedArea", row);
//
//                double canolaArea = parseDouble(columns, 8, "canolaArea", row);
//                double wheatArea = parseDouble(columns, 9, "wheatArea", row);
//                double cornSilageArea = parseDouble(columns, 10, "cornSilageArea", row);
//                double grainCornArea = parseDouble(columns, 11, "grainCornArea", row);
//                double beanArea = parseDouble(columns, 12, "beanArea", row);
//                double soybeanArea = parseDouble(columns, 13, "soybeanArea", row);
//
//                Branch branch = branchRepository.findByName(branchName)
//                        .orElseGet(() -> {
//                            Branch newBranch = new Branch();
//                            newBranch.setName(branchName);
//                            return branchRepository.save(newBranch);
//                        });
//
//                Optional<Farmer> optionalFarmer = farmerRepository.findById(farmerRegistration);
//
//                User user = null;
//
//                if (technicianId != null) {
//                    Optional<User> optionalUser = userRepository.findById(technicianId);
//                    if (optionalUser.isPresent()) {
//                        user = optionalUser.get();
//                    } else {
//                        Set<String> roles = new HashSet<>();
//                        roles.add("ROLE_USER");
//                        roles.add("ROLE_TECHNICIAN");
//
//                        user = new User();
//                        user.setUsername(technicianName.toLowerCase(Locale.ROOT).replace(" ", "_"));
//                        user.setName(technicianName);
//                        user.setBranch(branch);
//                        user.setRoles(roles);
//                        user.setPassword("");
//
//                        user = userRepository.save(user);
//                    }
//                }
//
//                Farmer farmer;
//                if (optionalFarmer.isEmpty()) {
//                    farmer = new Farmer();
//                    farmer.setRegistrationNumber(farmerRegistration);
//                    farmer.setName(farmerName);
//                    farmer.setTechnician(user);
//                    farmer.setOwnedArea(farmerOwnedArea);
//                    farmer.setLeasedArea(farmerLeasedArea);
//                    farmer.setStatus(farmerStatus.equalsIgnoreCase("Normal") ? StatusEnum.ACTIVE : StatusEnum.DECEASED);
//                    farmer = farmerRepository.save(farmer);
//                } else {
//                    farmer = optionalFarmer.get();
//                    log.warn("Produtor {} - {} já existente, duplicidade ignorada",
//                            optionalFarmer.get().getRegistrationNumber(),
//                            optionalFarmer.get().getName());
//                }
//
//                if (farmer.getRegistrationNumber().equals(familyGroupPrincipalRegistrationNumber)) {
//                    FamilyGroup group = new FamilyGroup();
//                    group.setPrincipal(farmer);
//                    group.setCanolaArea(canolaArea);
//                    group.setWheatArea(wheatArea);
//                    group.setCornSilageArea(cornSilageArea);
//                    group.setGrainCornArea(grainCornArea);
//                    group.setBeanArea(beanArea);
//                    group.setSoybeanArea(soybeanArea);
//                    familyGroupRepository.save(group);
//                    farmer.setFamilyGroup(group);
//                }
//            }
//
//            for (String row : lines) {
//                String[] columns = row.split(";", -1);
//
//                String farmerRegistration = getCol(columns, 0);
//                String familyGroupPrincipalRegistrationNumber = getCol(columns, 3);
//
//                Optional<Farmer> optionalFarmer = farmerRepository.findById(farmerRegistration);
//                Optional<Farmer> optionalPrincipal = farmerRepository.findById(familyGroupPrincipalRegistrationNumber);
//
//                if (optionalFarmer.isEmpty() || optionalPrincipal.isEmpty()) {
//                    continue;
//                }
//
//                Farmer farmer = optionalFarmer.get();
//                Farmer principal = optionalPrincipal.get();
//
//                FamilyGroup familyGroup = familyGroupRepository.findWithMembersByPrincipal(principal);
//
//                if (familyGroup == null) {
//                    log.warn("Grupo familiar não encontrado para o produtor principal: {}", principal.getRegistrationNumber());
//                    continue;
//                }
//
//                if (!familyGroup.getMembers().contains(farmer)) {
//                    familyGroup.getMembers().add(farmer);
//                }
//
//                familyGroupRepository.save(familyGroup);
//
//                farmer.setFamilyGroup(familyGroup);
//                farmerRepository.save(farmer);
//            }
//
//        } catch (IOException e) {
//            log.error("Erro ao processar arquivo CSV: {}", e.getMessage());
//            throw new IOException(e);
//        }
//    }

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
