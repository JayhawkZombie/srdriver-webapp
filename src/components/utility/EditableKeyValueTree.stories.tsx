import React, { useState } from "react";
import EditableKeyValueTree from "./EditableKeyValueTree";

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

const initialLockMeta = {
    pattern: { lockKey: false, lockValue: false },
    color: { lockKey: true, lockValue: false },
    settings: {
        lockKey: false,
        lockValue: false,
        duration: { lockKey: false, lockValue: true },
        nested: {
            lockKey: false,
            lockValue: false,
            foo: { lockKey: false, lockValue: false },
            arr: {},
        },
    },
    list: {},
};

export const Default = () => {
    const [data, setData] = useState(initialData);
    const [lockMeta, setLockMeta] = useState(initialLockMeta);
    return (
        <div style={{ maxWidth: 600, fontFamily: "monospace", fontSize: 13 }}>
            <EditableKeyValueTree
                data={data}
                lockMeta={lockMeta}
                onDataChange={setData}
                onLockMetaChange={setLockMeta}
            />
            <div
                style={{
                    display: "flex",
                    gap: 24,
                    marginTop: 16,
                    maxHeight: 500,
                    overflowY: "auto",
                    backgroundColor: "#f5f5f5",
                    padding: 16,
                    borderRadius: 8,
                }}
            >
                <div>
                    <div
                        style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 2,
                        }}
                    >
                        data
                    </div>
                    <pre style={{ fontSize: 12, margin: 0 }}>
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
                <div>
                    <div
                        style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 2,
                        }}
                    >
                        lockMeta
                    </div>
                    <pre style={{ fontSize: 12, margin: 0 }}>
                        {JSON.stringify(lockMeta, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};
