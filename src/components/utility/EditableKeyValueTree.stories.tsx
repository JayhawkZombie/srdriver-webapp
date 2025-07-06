import React, { useState } from "react";
import EditableKeyValueTree from "./EditableKeyValueTree";
import { Card, Elevation } from "@blueprintjs/core";

export default {
    title: "Utility/EditableKeyValueTree",
    component: EditableKeyValueTree,
};

const initialData = {
    pattern: "beat",
    color: "#00ff00",
    settings: {
        duration: 30,
        nested: { foo: "bar", arr: [1, 2, 3, 4, 5, 6, 7] },
    },
    list: [
        { name: "one", value: 1 },
        { name: "two", value: 2 },
        { name: "three", value: 3 },
        { name: "four", value: 4 },
        { name: "five", value: 5 },
        { name: "six", value: 6 },
    ],
};

export const EditableVsReadOnly = () => {
    const [data, setData] = useState(initialData);
    return (
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", padding: 24 }}>
            <Card elevation={Elevation.TWO} style={{ maxWidth: 400, minWidth: 320, flex: 1, overflowX: "auto" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#137cbd" }}>Editable Tree</div>
                <EditableKeyValueTree
                    data={data}
                    editable={true}
                    onDataChange={newData => setData(newData as typeof initialData)}
                />
            </Card>
            <Card elevation={Elevation.ONE} style={{ maxWidth: 400, minWidth: 320, flex: 1, overflowX: "auto", borderLeft: "2px solid #eee" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#888" }}>Read-Only Tree</div>
                <EditableKeyValueTree
                    data={data}
                    editable={false}
                />
            </Card>
        </div>
    );
};
