import Select from "react-select";
import { BranchType } from "../../Type/BranchType";
import { UserType } from "../../Type/UserType";

interface OptionType {
    value: string;
    label: string;
}

interface ReportFiltersProps {
    reportMode: OptionType | null;
    setReportMode: (option: OptionType | null) => void;
    users: UserType[];
    selectedUser: UserType | null;
    setSelectedUser: (user: UserType | null) => void;
    branchs: BranchType[];
    selectedBranch: BranchType | null;
    setSelectedBranch: (branch: BranchType | null) => void;
    reportType: OptionType | null;
    setReportType: (option: OptionType | null) => void;
}

const ReportFilters = ({
    reportMode,
    setReportMode,
    users,
    selectedUser,
    setSelectedUser,
    branchs,
    selectedBranch,
    setSelectedBranch,
    reportType,
    setReportType
}: ReportFiltersProps) => {
    return (
        <div className="d-flex gap-2">
            <Select
                placeholder="Selecione o modo"
                options={[
                    { value: "byTechnician", label: "Por técnico" },
                    { value: "byBranch", label: "Por carteira" }
                ]}
                value={reportMode}
                onChange={(option) => setReportMode(option)}
                isClearable
            />
            {reportMode?.value === "byTechnician" ? (
                <>
                    <Select
                        placeholder="Selecione um técnico"
                        options={[
                            { value: "", label: "Sem técnico" },
                            ...users.map(user => ({
                                value: user.id,
                                label: user.name
                            }))
                        ]}
                        value={
                            selectedUser
                                ? { value: selectedUser.id, label: selectedUser.name }
                                : { value: "", label: "Sem técnico" }
                        }
                        onChange={(option) => {
                            if (!option || option.value === "") {
                                setSelectedUser(null);
                            } else {
                                const user = users.find(u => u.id === option.value);
                                setSelectedUser(user || null);
                            }
                        }}
                        isClearable
                    />
                    {selectedUser && (
                        <Select<OptionType>
                            placeholder="Selecione um método"
                            options={[
                                { value: "farmer", label: "Por produtor" },
                                { value: "familyGroup", label: "Por grupo familiar" }
                            ]}
                            value={reportType}
                            onChange={(option) => setReportType(option)}
                            isClearable
                        />
                    )}
                </>
            ) : (
                <Select
                    placeholder="Selecione uma carteira"
                    options={branchs.map(branch => ({
                        value: branch.id,
                        label: branch.name
                    }))}
                    value={
                        selectedBranch
                            ? { value: selectedBranch.id, label: selectedBranch.name }
                            : null
                    }
                    onChange={(option) => {
                        const branch = branchs.find(b => b.id === option?.value);
                        setSelectedBranch(branch || null);
                    }}
                    isClearable
                />
            )}
        </div>
    )
}

export default ReportFilters;
