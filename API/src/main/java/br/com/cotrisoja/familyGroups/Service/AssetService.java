package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.Entity.Asset;
import br.com.cotrisoja.familyGroups.Entity.AssetType;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Repository.AssetRepository;
import br.com.cotrisoja.familyGroups.Repository.AssetTypeRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssetService {

	private final AssetRepository assetRepository;
	private final FarmerRepository farmerRepository;

	public Optional<Asset> findById(String ownerRegistrationNumber, Long sapId) {
		return assetRepository.findByOwner_RegistrationNumberAndIdSap(ownerRegistrationNumber, sapId);
	}

	public void delete(Asset asset) {
		assetRepository.delete(asset);
	}

	public void create(AssetType assetType, double amount, String address, String description, Farmer owner, Farmer leasedTo) {
		Long nextIdSap = getNextIdSapForOwner(owner);

		Asset asset = new Asset();
		asset.setIdSap(nextIdSap);
		asset.setDescription(description);
		asset.setOwner(owner);
		asset.setAmount(amount);
		asset.setAddress(address);
		asset.setAssetType(assetType);

		if (leasedTo != null) {
			asset.setLeasedTo(leasedTo);

			// owner.setFamilyGroup(null);
			farmerRepository.save(owner);
		} else {
			asset.setLeasedTo(null);
		}

		assetRepository.save(asset);
	}

	public void update(Asset asset, AssetType assetType, double amount, String address, String description, Farmer owner, Farmer leasedTo) {

		boolean ownerChanged = !asset.getOwner().equals(owner);

		if (ownerChanged) {
			assetRepository.delete(asset);

			asset = new Asset();
			asset.setOwner(owner);
			Long nextIdSap = getNextIdSapForOwner(owner);
			asset.setIdSap(nextIdSap);
		}

		asset.setDescription(description);
		asset.setAmount(amount);
		asset.setAddress(address);
		asset.setAssetType(assetType);

		if (leasedTo != null) {
			asset.setLeasedTo(leasedTo);

			// owner.setFamilyGroup(null);
			farmerRepository.save(owner);
		} else {
			asset.setLeasedTo(null);
		}

		assetRepository.save(asset);
	}

	public Optional<Map.Entry<String, Long>> parseAssetId(String assetId) {
		if (assetId == null || !assetId.contains("-")) {
			return Optional.empty();
		}

		int lastDashIndex = assetId.lastIndexOf('-');
		if (lastDashIndex == -1 || lastDashIndex == assetId.length() - 1) {
			return Optional.empty();
		}

		String registrationNumber = assetId.substring(0, lastDashIndex);
		String sapIdPart = assetId.substring(lastDashIndex + 1);

		try {
			Long sapId = Long.parseLong(sapIdPart);
			return Optional.of(Map.entry(registrationNumber, sapId));
		} catch (NumberFormatException e) {
			return Optional.empty();
		}
	}

	public Long getNextIdSapForOwner(Farmer owner) {
		return assetRepository.findMaxIdSapByOwner(owner.getRegistrationNumber())
				.map(id -> id + 1)
				.orElse(1L);
	}
}
