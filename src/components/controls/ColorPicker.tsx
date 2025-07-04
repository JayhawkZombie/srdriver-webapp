import { Card } from "@blueprintjs/core";
import { HexColorPicker } from "react-colorful";
import styles from "./ColorPicker.module.css";

export default function ColorPicker({
    color,
    onChange,
}: {
    color: string;
    onChange: (color: string) => void;
}) {
    return (
        <Card className={styles.main}>
            <HexColorPicker className={styles.picker} color={color} onChange={onChange} />
        </Card>
    );
}
