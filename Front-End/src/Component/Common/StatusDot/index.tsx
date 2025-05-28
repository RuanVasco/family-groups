interface StatusDotProps {
    color: 'green' | 'yellow' | 'red';
}

const colorMap: Record<StatusDotProps['color'], string> = {
    green: '#28a745',
    yellow: '#ffc107',
    red: '#dc3545'
};

const StatusDot = ({ color }: StatusDotProps) => {
    const colorHex = colorMap[color] || '#6c757d';

    return (
        <div
            style={{
                width: "1rem",
                height: "1rem",
                borderRadius: "50%",
                backgroundColor: colorHex,
            }}
        />
    );
};

export default StatusDot;
