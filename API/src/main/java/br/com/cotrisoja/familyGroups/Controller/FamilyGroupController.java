package br.com.cotrisoja.familyGroups.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController("/family-group")
public class FamilyGroupController {
    @GetMapping
    public ResponseEntity<List<String>> getAll() {
        List<String> grupos = List.of("Grupo 1", "Grupo 2", "Grupo 3");
        return ResponseEntity.ok(grupos);
    }
}