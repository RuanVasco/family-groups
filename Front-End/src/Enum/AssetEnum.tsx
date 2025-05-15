export enum AssetEnum {
    OWNED = "OWNED",
    LEASED = "LEASED",
}

export const AssetLabels: Record<AssetEnum, string> = {
    [AssetEnum.OWNED]: "Próprio",
    [AssetEnum.LEASED]: "Arrendado",
};
