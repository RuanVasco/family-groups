package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.Entity.Asset;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Repository.AssetRepository;
import br.com.cotrisoja.familyGroups.Repository.AssetTypeRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssetService {

	private final AssetRepository assetRepository;
	private final AssetTypeRepository assetTypeRepository;
	private final FarmerRepository farmerRepository;

	public Optional<Asset> findById(String ownerRegistrationNumber, Long sapId) {
		return assetRepository.findByOwner_RegistrationNumberAndIdSap(ownerRegistrationNumber, sapId);
	}

	public void delete(Asset asset) {
		assetRepository.delete(asset);
	}

	public void create(String description, Farmer owner, Farmer leasedTo) {
		Asset asset = new Asset();

		asset.setDescription(description);
		asset.setOwner(owner);

		if (leasedTo != null) {
			assetTypeRepository.findById(2L).ifPresent(asset::setAssetType);
			asset.setLeasedTo(leasedTo);

			owner.setFamilyGroup(null);
			farmerRepository.save(owner);
		} else {
			assetTypeRepository.findById(1L).ifPresent(asset::setAssetType);
			asset.setLeasedTo(null);
		}

		assetRepository.save(asset);
	}

	public void update(Asset asset, String description, Farmer owner, Farmer leasedTo) {
		asset.setDescription(description);
		asset.setOwner(owner);

		if (leasedTo != null) {
			assetTypeRepository.findById(2L).ifPresent(asset::setAssetType);

			asset.setLeasedTo(leasedTo);
			owner.setFamilyGroup(null);
			farmerRepository.save(owner);
		} else {
			assetTypeRepository.findById(1L).ifPresent(asset::setAssetType);
			asset.setLeasedTo(null);
		}

		assetRepository.save(asset);
	}

	public Optional<Map.Entry<String, Long>> parseAssetId(String assetId) {
		if (assetId == null || !assetId.contains("-")) {
			return Optional.empty();
		}

		String[] parts = assetId.split("-", 2);
		String registrationNumber = parts[0];

		try {
			Long sapId = Long.parseLong(parts[1]);
			return Optional.of(Map.entry(registrationNumber, sapId));
		} catch (NumberFormatException e) {
			return Optional.empty();
		}
	}
}
