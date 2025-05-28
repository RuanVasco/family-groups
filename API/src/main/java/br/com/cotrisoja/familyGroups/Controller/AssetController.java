package br.com.cotrisoja.familyGroups.Controller;

import br.com.cotrisoja.familyGroups.DTO.Asset.AssetDTO;
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

import java.util.List;
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
		assetService.create(asset);

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
			@RequestBody AssetRequestDTO dto) {

		Asset updated = assetService.update(assetId, dto);
		return ResponseEntity.ok(AssetDTO.fromEntity(updated));
	}

	@PutMapping("/lease")
	public ResponseEntity<?> leaseAsset(
			@RequestBody LeaseRequest dto) {

		Optional<Map.Entry<String, Long>> parsedId = assetService.parseAssetId(dto.assetId);

		if (parsedId.isEmpty()) {
			return ResponseEntity.badRequest().body("Formato de assetId inválido. Use 'registrationNumber-sapId'.");
		}

		String registrationNumber = parsedId.get().getKey();
		Long sapId = parsedId.get().getValue();

		Optional<Asset> assetOptional = assetService.findById(registrationNumber, sapId);
		Optional<Farmer> lesseeOpt = farmerService.findById(dto.lessee());

		if (assetOptional.isEmpty() || lesseeOpt.isEmpty())
			return ResponseEntity.badRequest().body("Dados inválidos");

		assetService.leaseTo(assetOptional.get(), lesseeOpt.get());
		return ResponseEntity.ok().build();
	}

	@PutMapping("/unlease")
	public ResponseEntity<?> unleaseAsset(@RequestBody UnleaseRequest dto) {

		var parsedId = assetService.parseAssetId(dto.assetId());
		if (parsedId.isEmpty())
			return ResponseEntity.badRequest().body("Formato de assetId inválido.");

		String reg = parsedId.get().getKey();
		Long   sap = parsedId.get().getValue();

		Asset asset = assetService.findById(reg, sap)
				.orElseThrow(() -> new IllegalStateException("Bem não encontrado."));

		assetService.unlease(asset);
		return ResponseEntity.ok().build();
	}

	@GetMapping("/available/{ownerId}")
	public ResponseEntity<?> findAvailableAssetsByOwner(@PathVariable String ownerId) {
		return farmerService.findById(ownerId)
				.<ResponseEntity<?>>map(owner -> {

					List<AssetDTO> dtos = assetService
							.findAvailableAssetsByOwner(owner)
							.stream()
							.map(AssetDTO::fromEntity)
							.toList();

					return ResponseEntity.ok(dtos);
				})
				.orElseGet(() ->
						ResponseEntity.badRequest().body("Proprietário não encontrado"));
	}

	public record LeaseRequest(String assetId, String lessee) {}
	public record UnleaseRequest(String assetId) {}

}
