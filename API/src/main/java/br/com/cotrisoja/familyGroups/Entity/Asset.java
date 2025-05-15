package br.com.cotrisoja.familyGroups.Entity;

import br.com.cotrisoja.familyGroups.Enum.AssetTypeEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "assets")
public class Asset {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "farmer_id")
	private Farmer owner;

	private String description;
	private AssetTypeEnum assetType;

	@ManyToOne
	@JoinColumn(name = "farmer_leased_id")
	private Farmer leasedTo;

	@PrePersist
	@PreUpdate
	private void validateAsset() {
		if (assetType == AssetTypeEnum.LEASED && leasedTo == null) {
			throw new IllegalStateException("Bem arrendado deve ter um 'leasedTo' representado.");
		}
	}
}
