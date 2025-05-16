package br.com.cotrisoja.familyGroups;


import br.com.cotrisoja.familyGroups.Entity.*;
import br.com.cotrisoja.familyGroups.Enum.StatusEnum;
import br.com.cotrisoja.familyGroups.Repository.*;
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
    private final AssetTypeRepository assetTypeRepository;
    private final FarmerRepository farmerRepository;
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

            if (assetTypeRepository.count() == 0) {
                assetTypeRepository.save(new AssetType(1L, "Terras cultivo"));
                assetTypeRepository.save(new AssetType(2L, "Terras campo"));
                assetTypeRepository.save(new AssetType(3L, "Terreno"));
                assetTypeRepository.save(new AssetType(4L, "Bov. Leite"));
                assetTypeRepository.save(new AssetType(5L, "Bov. Corte"));
                assetTypeRepository.save(new AssetType(6L, "Casa"));
                assetTypeRepository.save(new AssetType(7L, "Apartamento"));
                assetTypeRepository.save(new AssetType(8L, "Automóvel"));
                assetTypeRepository.save(new AssetType(9L, "Trator"));
                assetTypeRepository.save(new AssetType(10L, "Plantadeira"));
                assetTypeRepository.save(new AssetType(11L, "Colheitadeira"));
                assetTypeRepository.save(new AssetType(12L, "Pulverizador"));
                assetTypeRepository.save(new AssetType(13L, "Suínos"));
                assetTypeRepository.save(new AssetType(14L, "Aves"));
                assetTypeRepository.save(new AssetType(15L, "Caprinos e ovinos"));
                assetTypeRepository.save(new AssetType(16L, "Equinos"));
                assetTypeRepository.save(new AssetType(17L, "Caminhão"));
                assetTypeRepository.save(new AssetType(18L, "Galpão"));
                assetTypeRepository.save(new AssetType(19L, "Aviário"));
                assetTypeRepository.save(new AssetType(20L, "Moto"));
                assetTypeRepository.save(new AssetType(99L, "Não possui bens"));
            }

            if (farmerRepository.findById("-1").isEmpty()) {
                Farmer notInformedLessor = new Farmer();
                notInformedLessor.setRegistrationNumber("-1");
                notInformedLessor.setName("Não Informado");
                notInformedLessor.setStatus(StatusEnum.ACTIVE);

                farmerRepository.save(notInformedLessor);
            }
        };
    }
}
