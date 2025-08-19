package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseCompleteDTO;
import br.com.cotrisoja.familyGroups.DTO.Farmer.FarmerResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.AssetType;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Entity.Type;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.AssetTypeRepository;
import br.com.cotrisoja.familyGroups.Repository.BranchRepository;
import br.com.cotrisoja.familyGroups.Repository.TypeRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import br.com.cotrisoja.familyGroups.Service.FarmerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Tag(name = "Produtores", description = "Endpoints para gerenciamento de produtores")
@RestController
@RequestMapping("/farmer")
@RequiredArgsConstructor
public class FarmerController {

    private final FarmerService farmerService;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final TypeRepository typeRepository;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody FarmerRequestDTO farmerRequestDTO) {
        Farmer farmer = farmerService.createFarmer(farmerRequestDTO);

        return ResponseEntity.ok(farmer.getRegistrationNumber());
    }

    @GetMapping
    public ResponseEntity<?> findAll(
            @RequestParam(required = false) String value,
            @RequestParam(required = false) Long typeId,
            Pageable pageable
    ) {
        Page<Farmer> farmers;

        if (value != null && !value.isBlank() && typeId != null) {
            farmers = farmerService.findByValueAndType(value, typeId, pageable);
        } else if (value != null && !value.isBlank()) {
            farmers = farmerService.findByValue(value, pageable);
        } else if (typeId != null) {
            if (typeId > Integer.MAX_VALUE) {
                return ResponseEntity.badRequest().body("ID fora do intervalo válido.");
            }

            Optional<Type> type = typeRepository.findById(typeId.intValue());

            if (type.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            farmers = farmerService.findByType(type.get(), pageable);
        } else {
            farmers = farmerService.findAll(pageable);
        }

        Page<FarmerResponseCompleteDTO> response = farmers.map(FarmerResponseCompleteDTO::fromEntity);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Buscar um produtor pelo número de matrícula",
            description = "Retorna os dados detalhados de um único produtor com base no seu número de matrícula fornecido na URL."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Produtor encontrado com sucesso.",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = FarmerResponseDTO.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Nenhum produtor encontrado com o número de matrícula fornecido.",
                    content = @Content
            )
    })
    @GetMapping("/{farmerRegistration}")
    public ResponseEntity<?> getFarmer(
            @PathVariable String farmerRegistration
    ) {
        Farmer farmer = farmerService.findById(farmerRegistration)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        return ResponseEntity.ok(FarmerResponseDTO.fromEntity(farmer));
    }

    @Operation(
            summary = "Busca paginada por produtores disponíveis",
            description = """
            Retorna uma lista paginada de produtores considerados "disponíveis" para serem adicionados a um grupo familiar.
            
            **Regras de Negócio para Disponibilidade (BR-FARM-01):**
            Um produtores é considerado disponível se atender a **TODAS** as seguintes condições:
            1.  Seu status é **'ATIVO'**.
            2.  Ele **NÃO** está bloqueado.
            3.  Ele atende a um dos seguintes critérios de grupo:
                - Não pertence a nenhum grupo familiar (**familyGroup** é nulo).
                - Pertence a um grupo familiar que possui **apenas um membro** (ele mesmo).
            
            O endpoint suporta uma busca opcional por nome.
            """
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Busca realizada com sucesso.",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Page.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Requisição inválida (ex: parâmetros de paginação inválidos)",
                    content = @Content
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Erro interno no servidor",
                    content = @Content
            )
    })
    @GetMapping("/available")
    public ResponseEntity<Page<FarmerResponseDTO>> findAvailableFarmers(
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        Page<Farmer> farmers = null;

        if (search != null && !search.isEmpty()) {
            farmers = farmerService.findAvailableFarmersByName(search, pageable);
        } else {
            farmers = farmerService.findAvailableFarmers(pageable);
        }

        Page<FarmerResponseDTO> response = farmers.map(FarmerResponseDTO::fromEntity);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Busca produtores por grupo familiar",
            description = "Retorna uma lista de produtores membros de um grupo familiar."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Busca realizada com sucesso.",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = FarmerResponseDTO.class)))
            )
    })
    @GetMapping("by-family-group/{familyGroupID}")
    public ResponseEntity<?> findByFamilyGroup(
            @PathVariable Long familyGroupID
    ) {
        List<Farmer> farmers = farmerService.findByFamilyGroup(familyGroupID);

        List<FarmerResponseDTO> response = farmers.stream()
                .map(FarmerResponseDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/by-technician")
    public ResponseEntity<?> getByTechnician(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer typeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "registrationNumber,asc") String sort,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequest.of(page, size, buildSort(sort));
        Page<Farmer> farmersPage;

        if (userId != null) {
            Optional<User> technicianOpt = userRepository.findById(userId);
            if (technicianOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Usuário não encontrado");
            }

            farmersPage = (typeId == null)
                    ? farmerService.findByTechnician(technicianOpt.get(), search, pageable)
                    : farmerService.findByTechnicianAndType(technicianOpt.get(), typeId, search, pageable);

        } else {
            farmersPage = (typeId == null)
                    ? farmerService.findWithoutTechnician(search, pageable)
                    : farmerService.findWithoutTechnicianAndType(typeId, search, pageable);
        }

        return ResponseEntity.ok(farmersPage.map(FarmerResponseDTO::fromEntity));
    }

    @GetMapping("/by-branch/{branchId}")
    public ResponseEntity<?> getByBranch(
            @PathVariable Long branchId,
            @RequestParam(required = false) Integer typeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "registrationNumber,asc") String sort,
            @RequestParam(required = false) String search
    ) {
        return branchRepository.findById(branchId)
                .<ResponseEntity<?>>map(branch -> {
                    Pageable pageable = PageRequest.of(page, size, buildSort(sort));

                    final String searchValue = (search != null && search.isBlank()) ? null : search;

                    Page<Farmer> farmersPage;
                    try {
                        farmersPage = (typeId == null)
                                ? farmerService.findByEffectiveBranch(branch, searchValue, pageable)
                                : farmerService.findByEffectiveBranchAndType(branch, typeId, searchValue, pageable);
                    } catch (IllegalArgumentException ex) {
                        return ResponseEntity.badRequest().body(ex.getMessage());
                    }

                    return ResponseEntity.ok(farmersPage.map(FarmerResponseDTO::fromEntity));
                })
                .orElseGet(() -> ResponseEntity.badRequest().body("Carteira não encontrada"));
    }

    @PutMapping("/{farmerRegistration}")
    public ResponseEntity<?> updateFarmer(
            @PathVariable String farmerRegistration,
            @RequestBody FarmerRequestDTO farmerRequestDTO
    ) {
        Farmer farmer = farmerService.findById(farmerRegistration)
                .orElseThrow(() -> new RuntimeException("Produtor não encontrado"));

        return ResponseEntity.ok(farmerService.updateFarmer(farmer, farmerRequestDTO));
    }

    private Sort buildSort(String sortParam) {
        String[] s = sortParam.split(",");
        String field = s[0];
        Sort.Direction dir = s.length > 1 ? Sort.Direction.fromString(s[1]) : Sort.Direction.ASC;

        if ("totalArea".equals(field)) {
            return JpaSort.unsafe(dir,
                    "COALESCE(ownedArea,0) + COALESCE(leasedArea,0)");
        }
        return Sort.by(dir, field);
    }
}
