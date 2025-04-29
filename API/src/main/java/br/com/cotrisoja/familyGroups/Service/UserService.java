package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.User.UserRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User createUser(UserRequestDTO userRequestDTO) {
        User user = new User();
        user.setUsername(userRequestDTO.username());
        user.setPassword(passwordEncoder.encode(userRequestDTO.password()));
        user.setRoles(userRequestDTO.roles());

        return userRepository.save(user);
    }

    public User updateUser(User user, UserRequestDTO userRequestDTO) {
        user.setUsername(userRequestDTO.username());

        if (userRequestDTO.password() != null && !userRequestDTO.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(userRequestDTO.password()));
        }

        user.setRoles(userRequestDTO.roles());

        return userRepository.save(user);
    }
}
