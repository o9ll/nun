import { React } from "@webpack/common";
import { none, GetSettingsContext } from "@nu/ui/contexts";

import type { ChangeEvent } from "react";


export interface RadioOption {
    name: string;
    value: any;
    color?: string;
    description?: string;
    /** @deprecated */
    desc?: string;
}

export interface RadioProps {
    name?: string;
    value: any;
    options: RadioOption[];
    onChange?(newValue: any): void;
    disabled?: boolean;
}

function RadioIndicator({ checked }: { checked: boolean; }) {
    return <svg className="radio-indicator" width="24" height="24" viewBox="0 0 24 24">
        <circle
            cx="12"
            cy="12"
            r="12"
            strokeWidth="2"
            fill="none"
            className="radio-icon"
        />
        {checked && (
            <circle
                cx="12"
                cy="12"
                r="5"
                fill="#fff"
            />
        )}
    </svg>;
}

export default function Radio({ name, value: initialValue, options, onChange, disabled }: RadioProps) {
    const { useState, useCallback, useContext } = React;

    const { value: contextValue, disabled: contextDisabled } = useContext(GetSettingsContext());
    const value = contextValue !== none ? contextValue : initialValue;
    const isDisabled = contextValue !== none ? contextDisabled : disabled;
    const [index, setIndex] = useState(options.findIndex(o => o.value === value));

    const change = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (isDisabled) return;
        const newIndex = parseInt(e.target.value);
        const newValue = options[newIndex].value;
        onChange?.(newValue);
        setIndex(newIndex);
    }, [options, onChange, isDisabled]);

    function renderOption(opt: RadioOption, i: number) {
        const isSelected = index === i;
        return <label className={"radio-option" + (isSelected ? " radio-selected" : "")} style={{ borderColor: opt.color ?? "transparent" }}>
            <input onChange={change} type="radio" name={name} checked={isSelected} value={i} disabled={isDisabled} />
            <RadioIndicator checked={isSelected} />
            <div className="radio-label-wrap">
                <div className="radio-label">{opt.name}</div>
                <div className="radio-description">{opt.desc || opt.description}</div>
            </div>
        </label>;
    }

    return <div className={`radio-group ${isDisabled ? "radio-disabled" : ""}`}>{options.map(renderOption)}</div>;
}