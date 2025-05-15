package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.Entity.Asset;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Repository.AssetRepository;
import br.com.cotrisoja.familyGroups.Repository.AssetTypeRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssetService {

	private final AssetRepository assetRepository;
	private final AssetTypeRepository assetTypeRepository;
	private final FarmerRepository farmerRepository;

	public Optional<Asset> findById(Long assetId) {
		return assetRepository.findById(assetId);
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
}
