package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Asset.AssetRequestDTO;
import br.com.cotrisoja.familyGroups.Entity.Asset;
import br.com.cotrisoja.familyGroups.Entity.Farmer;
import br.com.cotrisoja.familyGroups.Service.AssetService;
import br.com.cotrisoja.familyGroups.Service.FarmerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.util.Pair;
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

	@PostMapping
	public ResponseEntity<?> createAsset(
			@RequestBody AssetRequestDTO asset
	) {
		String description = asset.description();
		if (description == null || description.trim().isEmpty()) {
			return ResponseEntity.badRequest().body("Descrição não recebida.");
		}

		Farmer owner = null;
		Optional<Farmer> optionalOwner = farmerService.findById(asset.ownerRegistrationNumber());
		if (optionalOwner.isEmpty()) {
			return ResponseEntity.badRequest().body("Produtor proprietário não foi encontrado.");
		}
		owner = optionalOwner.get();

		Farmer leaser = null;
		Optional<Farmer> optionalLeaser = farmerService.findById(asset.leasedToRegistrationNumber());
		if (optionalLeaser.isPresent()) {
			leaser = optionalLeaser.get();
		}

		assetService.create(description, owner, leaser);

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

	@PutMapping("{assetId}")
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

		String description = asset.description();
		if (description == null || description.trim().isEmpty()) {
			return ResponseEntity.badRequest().body("Descrição não recebida.");
		}

		Farmer owner = null;
		Optional<Farmer> optionalOwner = farmerService.findById(asset.ownerRegistrationNumber());
		if (optionalOwner.isEmpty()) {
			return ResponseEntity.badRequest().body("Produtor proprietário não foi encontrado.");
		}
		owner = optionalOwner.get();

		Farmer leaser = null;
		Optional<Farmer> optionalLeaser = farmerService.findById(asset.leasedToRegistrationNumber());
		if (optionalLeaser.isPresent()) {
			leaser = optionalLeaser.get();
		}

		assetService.update(assetOptional.get(), description, owner, leaser);

		return ResponseEntity.ok().build();
	}

}
