package br.com.cotrisoja.familyGroups.Service;

import br.com.cotrisoja.familyGroups.DTO.Asset.AssetRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.Asset;
import br.com.cotrisoja.familyGroups.Entity.AssetType;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Exception.BadRequestException;
import br.com.cotrisoja.familyGroups.Exception.NotFoundException;
import br.com.cotrisoja.familyGroups.Repository.AssetRepository;
import br.com.cotrisoja.familyGroups.Repository.AssetTypeRepository;
import br.com.cotrisoja.familyGroups.Repository.FarmerRepository;
import io.micrometer.common.lang.Nullable;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssetService {

	private final AssetRepository assetRepository;
	private final FarmerRepository farmerRepository;
	private final AssetTypeRepository assetTypeRepository;
	private final FarmerService farmerService;

	public Optional<Asset> findById(String ownerRegistrationNumber, Long sapId) {
		return assetRepository.findByOwner_RegistrationNumberAndIdSap(ownerRegistrationNumber, sapId);
	}

	public void delete(Asset asset) {
		assetRepository.delete(asset);
	}

	public Asset create(AssetRequestDTO dto) {
		AssetType assetType = assetTypeRepository.findById(dto.assetTypeId())
				.orElseThrow(() -> new NotFoundException("AssetType", dto.assetTypeId()));

		Farmer owner = farmerService.findById(dto.ownerRegistrationNumber())
				.orElseThrow(() -> new BadRequestException("Owner not found"));

		Farmer leasedTo = null;
		if (dto.leasedToRegistrationNumber() != null && !dto.leasedToRegistrationNumber().isEmpty()) {
			leasedTo = farmerService.findById(dto.leasedToRegistrationNumber())
					.orElseThrow(() -> new BadRequestException("Leased-to farmer not found"));
		}

		Double cultivable = dto.cultivable();
		Double amount = dto.amount();
		if (cultivable != null && amount != null && cultivable > amount) {
			throw new BadRequestException("Área cultivável não pode ser maior que a área total!");
		}

		Long nextIdSap = getNextIdSapForOwner(owner);

		Asset asset = Asset.builder()
				.idSap(nextIdSap)
				.description(dto.description())
				.owner(owner)
				.leasedTo(leasedTo)
				.amount(dto.amount())
				.address(dto.address())
				.assetType(assetType)
				.car(dto.car())
				.registration(dto.registration())
				.cultivable(dto.cultivable())
				.build();

		return assetRepository.save(asset);
	}

	@Transactional
	public Asset update(String assetId, AssetRequestDTO dto) {

		Map.Entry<String, Long> idParts = parseAssetId(assetId)
				.orElseThrow(() -> new BadRequestException(
						"Formato de assetId inválido. Use 'registrationNumber-sapId'."));

		String regNumber = idParts.getKey();
		Long   sapId     = idParts.getValue();

		Asset        current   = assetRepository.findByOwner_RegistrationNumberAndIdSap(regNumber, sapId)
				.orElseThrow(() -> new NotFoundException("Asset", assetId));

		AssetType    type      = assetTypeRepository.findById(dto.assetTypeId())
				.orElseThrow(() -> new NotFoundException("AssetType", dto.assetTypeId()));

		Farmer       newOwner  = farmerService.findById(dto.ownerRegistrationNumber())
				.orElseThrow(() -> new NotFoundException("Owner", dto.ownerRegistrationNumber()));

		Farmer       leasedTo  = (dto.leasedToRegistrationNumber() == null ||
				dto.leasedToRegistrationNumber().isBlank())
				? null
				: farmerService.findById(dto.leasedToRegistrationNumber())
				.orElseThrow(() -> new NotFoundException("LeasedTo",
						dto.leasedToRegistrationNumber()));

		Double cultivable = dto.cultivable();
		Double amount = dto.amount();
		if (cultivable != null && amount != null && cultivable > amount) {
			throw new BadRequestException("Área cultivável não pode ser maior que a área total!");
		}

		boolean ownerChanged = !current.getOwner().equals(newOwner);
		long nextIdSap       = ownerChanged ? getNextIdSapForOwner(newOwner) : current.getIdSap();

		Asset updated = Asset.builder()
				.idSap(nextIdSap)
				.owner(newOwner)
				.description(dto.description())
				.cultivable(cultivable)
				.registration(dto.registration())
				.car(dto.car())
				.address(dto.address())
				.amount(dto.amount())
				.assetType(type)
				.leasedTo(leasedTo)
				.build();

		if (ownerChanged) {
			assetRepository.delete(current);
		}

		return assetRepository.save(updated);
	}

	public List<Asset> findAvailableAssetsByOwner(Farmer owner) {
		return assetRepository.findAvailableAssetsByOwner(owner);
	}

	@Transactional
	public Asset leaseTo(Asset asset, Farmer lessee) {

		if (asset.getLeasedTo() != null) {
			throw new IllegalStateException("O bem já está arrendado para outro produtor.");
		}
		if (asset.getOwner() != null &&
				asset.getOwner().getRegistrationNumber()
						.equals(lessee.getRegistrationNumber())) {
			throw new IllegalStateException("Proprietário e arrendatário não podem ser o mesmo produtor.");
		}

		asset.setLeasedTo(lessee);

		return assetRepository.save(asset);
	}

	@Transactional
	public Asset unlease(Asset asset) {
		if (asset.getLeasedTo() == null)
			throw new IllegalStateException("Bem não está arrendado.");

		asset.setLeasedTo(null);
		return assetRepository.save(asset);
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
