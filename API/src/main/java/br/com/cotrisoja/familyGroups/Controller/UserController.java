package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.User.UserRequestDTO;
import br.com.cotrisoja.familyGroups.DTO.User.UserResponseDTO;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import br.com.cotrisoja.familyGroups.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllPageable(Pageable pageable) {
        Page<User> usersPage = userRepository.findAll(pageable);

        Page<UserResponseDTO> usersDTOPage = usersPage.map(UserResponseDTO::fromEntity);

        return ResponseEntity.ok(usersDTOPage);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        List<User> users = userRepository.findAll();

        List<UserResponseDTO> usersDTOPage = users.stream()
                .map(UserResponseDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(usersDTOPage);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long userId,
            @RequestBody UserRequestDTO userRequestDTO
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        User updated = userService.updateUser(user, userRequestDTO);
        return ResponseEntity.ok().body(updated);
    }
}
