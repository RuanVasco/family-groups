package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.Entity.*;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;
import br.com.cotrisoja.familyGroups.Repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final AssetRepository assetRepository;
    private final AssetService assetService;
    private final AssetTypeRepository assetTypeRepository;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final FamilyGroupRepository familyGroupRepository;
    private final TypeRepository typeRepository;
    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    @Transactional
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
                log.info("Iniciando processamento do arquivo de produtores: {}", filename);

                log.info("Inserindo dados de produtores...");
                for (String row : lines) {
                    try {
                        processFarmerRow(row);
                    } catch (Exception e) {
                        log.warn("Erro ao processar linha: [{}] | Motivo: {}", row, e.getMessage(), e);
                    }
                }

                log.info("Associando produtores aos grupos familiares...");
                for (String row : lines) {
                    try {
                        associateFarmerToGroup(row);
                    } catch (Exception e) {
                        log.warn("Erro ao associar linha: [{}] | Motivo: {}", row, e.getMessage(), e);
                    }
                }

                log.info("Processamento do arquivo {} concluído com sucesso!", filename);

            } else if ("farmer_update.csv".equalsIgnoreCase(filename)) {
                log.info("Iniciando atualização de tipos de produtores: {}", filename);

                for (String row : lines) {
                    try {
                        processTypeUpdate(row);
                    } catch (Exception e) {
                        log.warn("Erro ao processar tipo da linha: [{}] | Motivo: {}", row, e.getMessage(), e);
                    }
                }

                log.info("Atualização de tipos de produtores concluída com sucesso!");

            } else if ("assets.csv".equalsIgnoreCase(filename)) {
                log.info("Iniciando processamento de bens patrimoniais: {}", filename);

                for (String row : lines) {
                    try {
                        processAsset(row);
                    } catch (Exception e) {
                        log.warn("Erro ao processar asset da linha: [{}] | Motivo: {}", row, e.getMessage(), e);
                    }
                }

                log.info("Processamento de bens concluído com sucesso!");

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

    private void processAsset(String row) {
        String[] columns = row.split(";", -1);

        String primaryReg      = getCol(columns, 0);
        String idSapRaw        = getCol(columns, 1);
        String rawAssetType    = getCol(columns, 2);
        String description     = getCol(columns, 3);
        String rawAssetCat     = getCol(columns, 4);
        double amount          = parseDouble(columns, 5, "amount", row);
        String address         = getCol(columns, 6);
        String altReg          = getCol(columns, 7);

        Long idSap, catId, typeId;
        try {
            idSap   = Long.valueOf(idSapRaw);
            catId   = Long.valueOf(rawAssetCat);
            typeId  = Long.valueOf(rawAssetType);
        } catch (NumberFormatException e) {
            log.warn("IDs inválidos (idSap/categoria/tipo) na linha: {}", row);
            return;
        }

        AssetType aType = assetTypeRepository.findById(typeId)
                .orElseThrow(() -> new IllegalStateException("Tipo de bem não encontrado (id=" + typeId + ")"));

        Farmer primary = farmerRepository.findById(primaryReg)
                .orElseThrow(() -> new IllegalStateException("Produtor não encontrado (reg=" + primaryReg + ")"));

        Optional<Farmer> altOpt = altReg.isBlank()
                ? Optional.empty()
                : farmerRepository.findById(altReg);

        Farmer sentinel = farmerRepository.findById("-1").orElse(null);

        Farmer owner;
        Farmer leasedTo = null;

        if (catId == 2) {
            if (altOpt.isEmpty()) {
                if (sentinel == null) {
                    sentinel = farmerRepository.findById("-1").orElse(null);
                }
                owner = sentinel;
            } else {
                owner = altOpt.get();
            }
            leasedTo = primary;
        } else {
            owner = primary;
        }

        if (owner == null) {
            log.warn("Não foi possível determinar o proprietário na linha: {}", row);
            return;
        }

        Asset asset = assetRepository
                .findByOwner_RegistrationNumberAndIdSap(owner.getRegistrationNumber(), idSap)
                .orElseGet(Asset::new);

        asset.setIdSap(idSap);
        asset.setDescription(description);
        asset.setAddress(address);
        asset.setAmount(amount);
        asset.setAssetType(aType);
        asset.setOwner(owner);
        asset.setLeasedTo(leasedTo);

        try {
            assetRepository.save(asset);
            log.info("Asset salvo: idSap={}, owner={}, leasedTo={}",
                    asset.getIdSap(),
                    asset.getOwner().getRegistrationNumber(),
                    asset.getLeasedTo() != null ? asset.getLeasedTo().getRegistrationNumber() : "null");
        } catch (DataIntegrityViolationException e) {
            log.error("Violação de integridade ao salvar Asset (owner={}, idSap={}): {}",
                    asset.getOwner().getRegistrationNumber(), asset.getIdSap(),
                    e.getMostSpecificCause().getMessage(), e);
        } catch (ConstraintViolationException e) {
            log.error("Validação bean falhou ao salvar Asset (owner={}, idSap={}): {}", asset.getOwner(), asset.getIdSap(), e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Erro inesperado ao salvar Asset", e);
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
