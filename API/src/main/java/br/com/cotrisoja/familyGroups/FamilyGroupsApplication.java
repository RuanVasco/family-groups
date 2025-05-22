package br.com.cotrisoja.familyGroups;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FamilyGroupsApplication {
	public static void main(String[] args) {
		SpringApplication.run(FamilyGroupsApplication.class, args);
	}
}
