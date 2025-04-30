package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Branch.BranchRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.Branch;
import br.com.cotrisoja.familyGroups.Repository.BranchRepository;
import br.com.cotrisoja.familyGroups.Service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(branchRepository.findAll());
    }

}
