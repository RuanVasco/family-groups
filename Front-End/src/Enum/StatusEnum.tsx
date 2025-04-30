export enum StatusEnum {
    ACTIVE = "ACTIVE",
    DECEASED = "DECEASED",
}

export const StatusLabels: Record<StatusEnum, string> = {
    [StatusEnum.ACTIVE]: "Ativo",
    [StatusEnum.DECEASED]: "Falecido",
};
