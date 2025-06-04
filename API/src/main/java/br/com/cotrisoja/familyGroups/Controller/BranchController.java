package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Branch.BranchRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.Branch.BranchResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Exception.BadRequestException;
import br.com.cotrisoja.familyGroups.Repository.BranchRepository;
import br.com.cotrisoja.familyGroups.Service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RestController
@RequestMapping("/branch")
@RequiredArgsConstructor
public class BranchController {

    private final BranchRepository branchRepository;
    private final BranchService branchService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody BranchRequestDTO dto) {
        Branch branch = new Branch();

        branch.setName(dto.name());

        branch = branchRepository.save(branch);

        return ResponseEntity.ok(branch);
    }

    @PutMapping("/{branchId}")
    public ResponseEntity<?> updateBranch(
            @PathVariable Long branchId,
            @RequestBody BranchRequestDTO dto
    ) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new RuntimeException("Branch não encontrada"));

        Branch updated = branchService.updateBranch(branch, dto.name());
        return ResponseEntity.ok().body(updated);
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) Integer page,
                                    @RequestParam(required = false) Integer size,
                                    @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(branchRepository.findByValue(search)
                    .stream()
                    .map(BranchResponseDTO::from)
                    .toList());
        } else {
            if (page != null && size != null) {
                Pageable pageable = PageRequest.of(page, size);
                return ResponseEntity.ok(branchRepository.findAll(pageable));
            } else {
                return ResponseEntity.ok(branchRepository.findAll());
            }
        }

    }

    @GetMapping("/{branchId}")
    public ResponseEntity<?> getBranch(
            @PathVariable Long branchId
    ) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new BadRequestException("Carteira não encontrada."));

        return ResponseEntity.ok(BranchResponseDTO.from(branch));
    }
}
