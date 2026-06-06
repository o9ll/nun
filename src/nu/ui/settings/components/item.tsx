import { React } from "@webpack/common";
import Divider from "../../divider";
import type { PropsWithChildren } from "react";


export type SettingItemProp = PropsWithChildren<{
    id: string;
    name?: string;
    note?: string;
    inline?: boolean;
}>;

export default function SettingItem({ id, name, note, inline, children }: SettingItemProp) {
    return <div className={"setting-item" + (inline ? " inline" : "")}>
        <div className={"setting-header"}>
            <label htmlFor={id} className={"setting-title"}>{name}</label>
            {inline && children}
        </div>
        <div className={"setting-note"}>{note}</div>
        {!inline && children}
        <Divider className="setting-divider" />
    </div>;
}