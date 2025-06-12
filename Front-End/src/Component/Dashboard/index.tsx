import { useEffect, useState } from "react";
import Select, { MultiValue, SingleValue } from "react-select";
import { toast } from "react-toastify";
import axiosInstance from "../../axiosInstance";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import { BranchType } from "../../Type/BranchType";
import { UserType } from "../../Type/UserType";

interface FamilyGroupCultivation {
    familyGroupId: number,
    freeArea: number,
    cultivations: CultivationType
}

interface CultivationType {
    canolaArea?: number;
    wheatArea?: number;
    cornSilageArea?: number;
    grainCornArea?: number;
    beanArea?: number;
    soybeanArea?: number;

    canolaAreaParticipation?: number;
    wheatAreaParticipation?: number;
    cornSilageAreaParticipation?: number;
    grainCornAreaParticipation?: number;
    beanAreaParticipation?: number;
    soybeanAreaParticipation?: number;
}

interface PieData {
    name: string;
    value: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface Option<T = string> {
    label: string;
    value: T;
}

const Dashboard = () => {
    const [type, setType] = useState<"by-branch" | "by-technician" | null>(null);

    const [branches, setBranches] = useState<BranchType[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);

    const [selectedBranches, setSelectedBranches] = useState<BranchType[] | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<UserType[] | null>(null);

    const [allPieData, setAllPieData] = useState<PieData[][]>([]);

    const [totalArea, setTotalArea] = useState<Number>(0);

    const fetchBranches = async (): Promise<BranchType[]> => {
        try {
            const res = await axiosInstance.get<BranchType[]>("/branch");
            if (res.status === 200 || res.status === 201) {
                return res.data;
            }
            return [];
        } catch (error: any) {
            toast.error(error.message || "Erro ao buscar filiais");
            return [];
        }
    };

    const fetchUsers = async (): Promise<UserType[]> => {
        try {
            const res = await axiosInstance.get<UserType[]>("/user/all");
            if (res.status === 200 || res.status === 201) {
                return res.data;
            }
            return [];
        } catch (error: any) {
            toast.error(error.message || "Erro ao buscar usuários");
            return [];
        }
    };

    const fetchCultivations = async (
        branchIds: number[],
        fetchType: "user" | "branch"
    ): Promise<FamilyGroupCultivation[]> => {
        try {
            const promises = branchIds.map((branchId) =>
                axiosInstance.get<FamilyGroupCultivation[]>(`/family-group/cultivation/${fetchType}/${branchId}`)
            );

            const responses = await Promise.all(promises);

            const allData = responses
                .filter((res) => res.status === 200 || res.status === 201)
                .flatMap((res) => res.data);

            return allData;
        } catch (error: any) {
            toast.error(error.message || "Erro ao buscar cultivos");
            return [];
        }
    };

    useEffect(() => {
        setBranches([]);
        setUsers([]);
        setSelectedUsers(null);
        setSelectedBranches(null);
        setAllPieData([]);

        if (type === "by-branch") {
            (async () => {
                const data = await fetchBranches();
                setBranches(data);
            })();
        } else if (type === "by-technician") {
            (async () => {
                const data = await fetchUsers();
                setUsers(data);
            })();
        }
    }, [type]);

    useEffect(() => {
        if (type === "by-branch") {
            if (!selectedBranches || selectedBranches.length === 0) {
                setAllPieData([]);
                return;
            }
        }

        if (type === "by-technician") {
            if (!selectedUsers || selectedUsers.length === 0) {
                setAllPieData([]);
                return;
            }
        }

        (async () => {
            let items: FamilyGroupCultivation[] = [];

            if (type === "by-branch" && selectedBranches) {
                const branchIds = selectedBranches.map((b) => b.id);
                items = await fetchCultivations(branchIds, "branch");
            } else if (type === "by-technician" && selectedUsers) {
                const userIds = selectedUsers.map((u) => u.id);
                items = await fetchCultivations(userIds, "user");
            } else {
                setAllPieData([]);
                return;
            }

            type NumericKey = keyof CultivationType;

            setTotalArea(
                Number(
                    items
                        .reduce((sum, { freeArea }) => sum + (freeArea ?? 0), 0)
                        .toFixed(2)
                )
            );

            const rawTotals: CultivationType = items.reduce((acc, { cultivations }) => {
                (Object.keys(cultivations) as NumericKey[]).forEach((k) => {
                    acc[k] = (acc[k] ?? 0) + (cultivations[k] ?? 0);
                });
                return acc;
            }, {} as CultivationType);

            const totals: CultivationType = Object.fromEntries(
                Object.entries(rawTotals).map(([k, v]) => [k, Number(v.toFixed(2))])
            ) as CultivationType;

            const pieCanola: PieData[] = [
                {
                    name: "Restante",
                    value: (totals.canolaArea || 0) - (totals.canolaAreaParticipation || 0),
                },
                { name: "Participação Cotrisoja", value: totals.canolaAreaParticipation || 0 },
            ];
            const pieWheat: PieData[] = [
                {
                    name: "Restante",
                    value: (totals.wheatArea || 0) - (totals.wheatAreaParticipation || 0),
                },
                { name: "Participação Cotrisoja", value: totals.wheatAreaParticipation || 0 },
            ];
            const pieSilage: PieData[] = [
                {
                    name: "Restante",
                    value:
                        (totals.cornSilageArea || 0) - (totals.cornSilageAreaParticipation || 0),
                },
                { name: "Participação Cotrisoja", value: totals.cornSilageAreaParticipation || 0 },
            ];
            const pieGrainCorn: PieData[] = [
                {
                    name: "Restante",
                    value:
                        (totals.grainCornArea || 0) - (totals.grainCornAreaParticipation || 0),
                },
                { name: "Participação Cotrisoja", value: totals.grainCornAreaParticipation || 0 },
            ];
            const pieBean: PieData[] = [
                {
                    name: "Restante",
                    value: (totals.beanArea || 0) - (totals.beanAreaParticipation || 0),
                },
                { name: "Participação Cotrisoja", value: totals.beanAreaParticipation || 0 },
            ];
            const pieSoybean: PieData[] = [
                {
                    name: "Restante",
                    value:
                        (totals.soybeanArea || 0) - (totals.soybeanAreaParticipation || 0),
                },
                { name: "Participação Cotrisoja", value: totals.soybeanAreaParticipation || 0 },
            ];

            setAllPieData([
                pieCanola,
                pieWheat,
                pieSilage,
                pieGrainCorn,
                pieBean,
                pieSoybean,
            ]);
        })();
    }, [selectedBranches, selectedUsers]);

    return (
        <div>
            <div className="d-flex align-items-center gap-2 report-header">
                <Select<Option<string>, false>
                    options={[
                        { label: "Por carteira", value: "by-branch" },
                        { label: "Por técnico", value: "by-technician" },
                    ]}
                    onChange={(option: SingleValue<Option<string>>) => {
                        if (option) {
                            setType(option.value as "by-branch" | "by-technician");
                        }
                    }}
                    placeholder="Selecione o tipo de relatório"
                />

                {type === "by-branch" && (
                    <Select<Option<number>, true>
                        options={branches.map((branch) => ({
                            label: branch.name,
                            value: branch.id,
                        }))}
                        onChange={(options: MultiValue<Option<number>>) => {
                            if (options && options.length > 0) {
                                const selectedIds = options.map((opt) => opt.value);
                                const selBranches = branches.filter((b) =>
                                    selectedIds.includes(b.id)
                                );
                                setSelectedBranches(selBranches);
                            } else {
                                setSelectedBranches(null);
                            }
                        }}
                        value={
                            selectedBranches
                                ? selectedBranches.map((b) => ({ label: b.name, value: b.id }))
                                : []
                        }
                        placeholder="Selecione uma ou mais filiais"
                        isMulti
                    />
                )}

                {type === "by-technician" && (
                    <Select<Option<number>, true>
                        options={users.map((user) => ({
                            label: user.name,
                            value: user.id,
                        }))}
                        onChange={(options: MultiValue<Option<number>>) => {
                            if (options && options.length > 0) {
                                const selectedIds = options.map((opt) => opt.value);
                                const selUsers = users.filter((b) =>
                                    selectedIds.includes(b.id)
                                );
                                setSelectedUsers(selUsers);
                            } else {
                                setSelectedUsers(null);
                            }
                        }}
                        value={
                            selectedUsers
                                ? selectedUsers.map((b) => ({ label: b.name, value: b.id }))
                                : []
                        }
                        placeholder="Selecione um ou mais técnicos"
                        isMulti
                    />
                )}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gridTemplateRows: "repeat(2, 1fr)",
                    gap: "16px",
                    marginTop: "24px",
                    height: "600px",
                }}
            >
                {allPieData.map((dataset, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            padding: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <h5 style={{ textAlign: "center", margin: "0 0 8px 0" }}>
                            {(() => {
                                switch (idx) {
                                    case 0:
                                        return "Canola";
                                    case 1:
                                        return "Trigo";
                                    case 2:
                                        return "Silagem de Milho";
                                    case 3:
                                        return "Milho Grão";
                                    case 4:
                                        return "Feijão";
                                    case 5:
                                        return "Soja";
                                    default:
                                        return "";
                                }
                            })()}
                        </h5>

                        <div style={{ flex: 1, minHeight: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dataset}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ payload }) => `${payload.value}`}
                                    >
                                        {dataset.map((_e, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>

                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        content={({ payload }) => (
                                            <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 12 }}>
                                                {payload?.map((entry) => (
                                                    <li key={entry.value}>
                                                        <span style={{ color: entry.color }}>■</span>{" "}
                                                        {entry.value}: {Number(entry.payload?.value).toFixed(2)}
                                                    </li>
                                                ))}

                                                <li style={{ marginTop: 6, fontWeight: "bold" }}>
                                                    Área total: {totalArea.toFixed(2)} ha
                                                </li>
                                            </ul>
                                        )}
                                    />

                                    <Tooltip formatter={(v) => v} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ))}

                {allPieData.length < 6 &&
                    Array.from({ length: 6 - allPieData.length }).map((_, idx) => (
                        <div key={"empty-" + idx} />
                    ))}
            </div>
        </div>
    );
};

export default Dashboard;
