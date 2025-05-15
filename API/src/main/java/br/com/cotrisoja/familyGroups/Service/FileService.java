package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.Entity.*;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;
import br.com.cotrisoja.familyGroups.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
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
        String filename = file.getOriginalFilename();
        if (filename == null) {
            log.warn("Arquivo sem nome fornecido.");
            return;
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            reader.readLine();

            List<String> lines = reader.lines().toList();

            if ("data.csv".equalsIgnoreCase(filename)) {
                for (String row : lines) {
                    try {
                        processFarmerRow(row);
                    } catch (Exception e) {
                        log.warn("Erro ao processar linha: {}\nMotivo: {}", row, e.getMessage());
                    }
                }
                for (String row : lines) {
                    try {
                        associateFarmerToGroup(row);
                    } catch (Exception e) {
                        log.warn("Erro ao associar linha: {}\nMotivo: {}", row, e.getMessage());
                    }
                }
            } else if ("farmer_update.csv".equalsIgnoreCase(filename)) {
                for (String row : lines) {
                    try {
                        processTypeUpdate(row);
                    } catch (Exception e) {
                        log.warn("Erro ao processar tipo da linha: {}\nMotivo: {}", row, e.getMessage());
                    }
                }
            } else {
                log.warn("Arquivo não reconhecido: {}", filename);
            }
        } catch (IOException e) {
            log.error("Erro ao ler o arquivo CSV: {}", e.getMessage());
            throw e;
        }
    }
    private void processTypeUpdate(String row) {
        String[] columns = row.split(";", -1);

        if (columns.length < 4) {
            log.warn("Linha inválida: {}", row);
            return;
        }

        String registrationNumber = columns[0].trim();
        String groupIdRaw = columns[2].replaceAll("^G0*", "").trim();
        LocalDate deathDate = parseDeathDate(columns[3]);
        String blocked = columns[4];

        try {
            Integer groupID = Integer.parseInt(groupIdRaw);

            farmerRepository.findById(registrationNumber).ifPresent(farmer -> {
                if (farmer.getType() != null && farmer.getType().getId() == 1) return;

                typeRepository.findById(groupID)
                        .filter(type -> !type.equals(farmer.getType()))
                        .ifPresent(farmer::setType);

                if (deathDate != null) {
                    farmer.setStatus(StatusEnum.DECEASED);
                }

                if (blocked.equals("1")) {
                    farmer.setBlocked(true);
                }

                farmerRepository.save(farmer);
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

            if (branch != null) {
                f.setBranch(branch);
            }

            f.setOwnedArea(ownedArea);
            f.setLeasedArea(leasedArea);
            f.setStatus("Normal".equalsIgnoreCase(farmerStatus) ? StatusEnum.ACTIVE : StatusEnum.DECEASED);
            return farmerRepository.save(f);
        });

        if (
                farmer.getRegistrationNumber().equals(principalRegistration) &&
                        farmer.getFamilyGroup() == null
        ) {
            FamilyGroup group = new FamilyGroup();
            group.setPrincipal(farmer);
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
        if (name.isEmpty()) return null;

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

    public LocalDate parseDeathDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank() || dateStr.equals("00-00-0000") || dateStr.equals("00.00.0000")) {
            return null;
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        try {
            return LocalDate.parse(dateStr, formatter);
        } catch (DateTimeParseException e) {
            System.out.println("Formato inválido de data: " + dateStr);
            return null;
        }
    }
}
