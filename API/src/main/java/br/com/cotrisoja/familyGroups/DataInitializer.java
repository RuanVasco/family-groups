package br.com.cotrisoja.familyGroups;


import br.com.cotrisoja.familyGroups.Entity.Type;
import br.com.cotrisoja.familyGroups.Entity.User;
import br.com.cotrisoja.familyGroups.Repository.TypeRepository;
import br.com.cotrisoja.familyGroups.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final TypeRepository typeRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {
                Set<String> roles = new HashSet<>();

                roles.add("ROLE_ADMIN");
                roles.add("ROLE_USER");
                roles.add("ROLE_TECHNICIAN");

                User admin = new User();
                admin.setUsername("admin");
                admin.setName("Administrador");
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setRoles(roles);
                userRepository.save(admin);
                System.out.println("Usuário ADMIN inicial criado: admin/admin");
            }

            Type pfa = new Type();
            pfa.setId(1);
            pfa.setDescription("Pessoa Física Associado");
            typeRepository.save(pfa);

            Type pft = new Type();
            pft.setId(2);
            pft.setDescription("Pessoa Física Terceiro");
            typeRepository.save(pft);

            Type pja = new Type();
            pja.setId(3);
            pja.setDescription("Pessoa Juridica Associado");
            typeRepository.save(pja);

            Type pjt = new Type();
            pjt.setId(4);
            pjt.setDescription("Pessoa Juridica Terceiro");
            typeRepository.save(pjt);
        };
    }
}
