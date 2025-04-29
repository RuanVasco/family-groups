
const FamilyGroup = () => {
    return (
        <div className="container-fluid">
            <div className="d-flex">
                <input type="text" />
                <button type="button" className="btn btn-small btn-primary">Selecionar Grupo Familiar</button>
                <button type="button" className="btn btn-small btn-secondary">Criar Grupo Familiar</button>
            </div>
            <h2>Participantes</h2>
            <div>
                <button>Adicionar Participante</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Nome</th>
                        <th>Status</th>
                    </tr>
                </thead>
            </table>
        </div>
    );
};

export default FamilyGroup;
