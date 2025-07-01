import React from "react";
import { Devices, GraphicEq, Label } from "@mui/icons-material";

const TRACK_TYPES = [
    { type: "device", label: "Device", color: "#ffb300", icon: Devices },
    {
        type: "frequency",
        label: "Frequency",
        color: "#42a5f5",
        icon: GraphicEq,
    },
    { type: "custom", label: "Custom", color: "#ab47bc", icon: Label },
] as const;
type TrackType = (typeof TRACK_TYPES)[number]["type"];

interface TrackLabelProps {
    name: string;
    type: TrackType;
    color?: string;
    isEditing: boolean;
    editingValue: string;
    editingType: TrackType;
    onEdit: () => void;
    onEditCommit: () => void;
    onEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const LABEL_WIDTH = 160;
const TRACK_HEIGHT = 40;
const TRACK_GAP = 10;

// Memoized for performance: only re-renders if props change
const TrackLabel: React.FC<TrackLabelProps> = React.memo(
    ({
        name,
        type,
        color,
        isEditing,
        editingValue,
        editingType,
        onEdit,
        onEditCommit,
        onEditChange,
        onTypeChange,
    }) => {
        const trackType = TRACK_TYPES.find(
            (tt) => tt.type === (isEditing ? editingType : type)
        );
        const Icon = trackType?.icon;
        const labelColor = color || trackType?.color || "#90caf9";
        return isEditing ? (
            <div
                style={{
                    width: LABEL_WIDTH - 10,
                    marginBottom: TRACK_GAP,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                }}
            >
                <input
                    type="text"
                    value={editingValue}
                    autoFocus
                    onChange={onEditChange}
                    onBlur={onEditCommit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onEditCommit();
                    }}
                    style={{
                        width: LABEL_WIDTH - 38,
                        height: 28,
                        fontSize: 15,
                        borderRadius: 6,
                        border: `1px solid #90caf9`,
                        background: "#2d333b",
                        color: "#e3e6eb",
                        paddingLeft: 4,
                        outline: "none",
                        fontWeight: 600,
                        textAlign: "right",
                    }}
                />
                <select
                    value={editingType}
                    onChange={onTypeChange}
                    style={{
                        height: 28,
                        borderRadius: 6,
                        border: `1px solid #90caf9`,
                        background: "#2d333b",
                        color: "#e3e6eb",
                        fontWeight: 600,
                        outline: "none",
                        padding: "0 4px",
                    }}
                >
                    {TRACK_TYPES.map((tt) => (
                        <option key={tt.type} value={tt.type}>
                            {tt.label}
                        </option>
                    ))}
                </select>
            </div>
        ) : (
            <div
                style={{
                    width: LABEL_WIDTH - 10,
                    height: TRACK_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    color: labelColor,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    userSelect: "none",
                    marginBottom: TRACK_GAP,
                    gap: 4,
                }}
                onClick={onEdit}
                tabIndex={0}
                role="button"
                aria-label={`Rename track ${name}`}
            >
                {Icon ? (
                    <Icon
                        style={{
                            fontSize: 18,
                            marginRight: 2,
                            verticalAlign: "middle",
                        }}
                    />
                ) : null}
                {name}
            </div>
        );
    }
);

export default TrackLabel;
