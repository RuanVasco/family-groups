package br.com.cotrisoja.familyGroups.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "types")
public class Type {
	@Id
	@Column(nullable = false, unique = true)
	private Integer id;

	@Column(nullable = false)
	private String description;
}
