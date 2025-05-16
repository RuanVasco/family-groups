package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.Service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileService fileService;

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty() || !file.getOriginalFilename().endsWith(".csv")) {
            return ResponseEntity.badRequest().body("Arquivo inválido. Envie um arquivo .csv.");
        }

        if (
                !"data.csv".equalsIgnoreCase(file.getOriginalFilename()) &&
                        !"farmer_update.csv".equalsIgnoreCase(file.getOriginalFilename()) &&
                            !"assets.csv".equalsIgnoreCase(file.getOriginalFilename())
        ) {
            return ResponseEntity.badRequest().body("Arquivo inválido.");
        }

        try {
            fileService.uploadFile(file);
            return ResponseEntity.accepted().body("Arquivo processado.");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao ler o arquivo.");
        }
    }
}
