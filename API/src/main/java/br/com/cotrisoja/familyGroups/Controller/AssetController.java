package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Asset.AssetRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.Asset;
import br.com.cotrisoja.familyGroups.Entity.AssetType;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Repository.AssetTypeRepository;
import br.com.cotrisoja.familyGroups.Service.AssetService;
import br.com.cotrisoja.familyGroups.Service.FarmerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/asset")
@RequiredArgsConstructor
public class AssetController {

	private final AssetService assetService;
	private final FarmerService farmerService;
	private final AssetTypeRepository assetTypeRepository;

	@PostMapping
	public ResponseEntity<?> createAsset(
			@RequestBody AssetRequestDTO asset
	) {
		String description = asset.description();

		AssetType assetType = assetTypeRepository.findById(asset.assetTypeId())
				.orElseGet(() -> assetTypeRepository.findById(1L)
						.orElseThrow(() -> new IllegalStateException("Tipo padrão não encontrado.")));

		Farmer owner = null;
		Optional<Farmer> optionalOwner = farmerService.findById(asset.ownerRegistrationNumber());
		if (optionalOwner.isEmpty()) {
			return ResponseEntity.badRequest().body("Produtor proprietário não foi encontrado.");
		}
		owner = optionalOwner.get();

		Farmer leaser = null;
		if (asset.leasedToRegistrationNumber() != null && !asset.leasedToRegistrationNumber().isEmpty()) {
			leaser = farmerService.findById(asset.leasedToRegistrationNumber()).orElse(null);
		}

		assetService.create(assetType, asset.amount(), asset.address(), description, owner, leaser);

		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{assetId}")
	public ResponseEntity<?> deleteAsset(
			@PathVariable String assetId
	) {
		Optional<Map.Entry<String, Long>> parsedId = assetService.parseAssetId(assetId);

		if (parsedId.isEmpty()) {
			return ResponseEntity.badRequest().body("Formato de assetId inválido. Use 'registrationNumber-sapId'.");
		}

		String registrationNumber = parsedId.get().getKey();
		Long sapId = parsedId.get().getValue();

		Optional<Asset> assetOptional = assetService.findById(registrationNumber, sapId);

		if (assetOptional.isEmpty()) {
			return ResponseEntity.badRequest().body("Bem não encontrado.");
		}

		assetService.delete(assetOptional.get());

		return ResponseEntity.ok().build();
	}

	@PutMapping("/{assetId}")
	public ResponseEntity<?> updateAsset(
			@PathVariable String assetId,
			@RequestBody AssetRequestDTO asset
	) {
		Optional<Map.Entry<String, Long>> parsedId = assetService.parseAssetId(assetId);

		if (parsedId.isEmpty()) {
			return ResponseEntity.badRequest().body("Formato de assetId inválido. Use 'registrationNumber-sapId'.");
		}

		String registrationNumber = parsedId.get().getKey();
		Long sapId = parsedId.get().getValue();

		Optional<Asset> assetOptional = assetService.findById(registrationNumber, sapId);

		if (assetOptional.isEmpty()) {
			return ResponseEntity.badRequest().body("Bem não encontrado.");
		}

		AssetType assetType = assetTypeRepository.findById(asset.assetTypeId())
				.orElseGet(() -> assetTypeRepository.findById(1L)
						.orElseThrow(() -> new IllegalStateException("Tipo padrão não encontrado.")));

		Farmer owner = farmerService.findById(asset.ownerRegistrationNumber())
				.orElseThrow(() -> new IllegalStateException("Produtor proprietário não foi encontrado."));

		Farmer leaser = null;
		if (asset.leasedToRegistrationNumber() != null && !asset.leasedToRegistrationNumber().isEmpty()) {
			leaser = farmerService.findById(asset.leasedToRegistrationNumber()).orElse(null);
		}

		assetService.update(
				assetOptional.get(),
				assetType,
				asset.amount(),
				asset.address(),
				asset.description(),
				owner,
				leaser
		);

		return ResponseEntity.ok().build();
	}

}
