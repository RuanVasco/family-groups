package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.Entity.User;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class AuthorizationService {

    public boolean verifyPermission(User user, String item) {
        if (user == null || item == null) return false;

        Set<String> roles = user.getRoles();

        return switch (item) {
            case "FamilyGroup", "Farmer" -> roles.contains("ROLE_TECHNICIAN") || roles.contains("ROLE_ADMIN");
            case "User" -> roles.contains("ROLE_ADMIN");
            default -> false;
        };
    }
}
