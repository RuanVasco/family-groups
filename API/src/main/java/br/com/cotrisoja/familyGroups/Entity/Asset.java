package br.com.cotrisoja.familyGroups.Entity;

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

	@Column(name = "idSap", unique = true)
	private Long idSap;

	@ManyToOne
	@JoinColumn(name = "farmer_id")
	private Farmer owner;

	private String description;
	private String address;

	private Double amount = 0.0;

	@ManyToOne
	@JoinColumn(name = "asset_category_id")
	private AssetCategory assetCategory;

	@ManyToOne
	@JoinColumn(name = "asset_type_id")
	private AssetType assetType;

	@ManyToOne
	@JoinColumn(name = "farmer_leased_id")
	private Farmer leasedTo;

	@PrePersist
	@PreUpdate
	private void validateAsset() {
		if (assetCategory.getId() == 1 && leasedTo == null) {
			throw new IllegalStateException("Bem arrendado deve ter um 'leasedTo' representado.");
		}
	}
}
