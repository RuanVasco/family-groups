package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.Asset.AssetDTO;
import br.com.cotrisoja.familyGroups.Entity.Asset;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Enum.AssetTypeEnum;
import br.com.cotrisoja.familyGroups.Repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssetService {

	private final AssetRepository assetRepository;

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
			asset.setAssetType(AssetTypeEnum.LEASED);
			asset.setLeasedTo(leasedTo);
		} else {
			asset.setAssetType(AssetTypeEnum.OWNED);
		}

		assetRepository.save(asset);
	}

}
