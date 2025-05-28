package br.com.cotrisoja.familyGroups.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@IdClass(AssetId.class)
@Table(name = "assets")
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Asset {

	@Id
	@Column(name = "idSap")
	private Long idSap;

	@Id
	@ManyToOne
	@JoinColumn(name = "farmer_id", referencedColumnName = "registration_number")
	private Farmer owner;

	private String registration;
	private String car;
	private String description;
	private String address;

	private Double amount = 0.0;
	private Double cultivable;

	@ManyToOne
	@JoinColumn(name = "asset_type_id")
	private AssetType assetType;

	@ManyToOne
	@JoinColumn(name = "farmer_leased_id")
	private Farmer leasedTo;

}
