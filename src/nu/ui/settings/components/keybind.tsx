/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";

import Button from "../../base/button";
import { LucideIcon } from "@nu/ui/icons";
import { Keyboard, X } from "lucide";
import { none, GetSettingsContext } from "@nu/ui/contexts";
import type { MouseEvent } from "react";



export interface KeybindProps {
    value: string[];
    onChange?(newValue: string[]): void;
    max?: number;
    clearable?: boolean;
    disabled?: boolean;
}

export default function Keybind({ value: initialValue, onChange, max = 4, clearable = false, disabled }: KeybindProps) {
    const { useState, useCallback, useEffect, useContext } = React;

    // TODO: make these their own states
    const [state, setState] = useState<{ isRecording: boolean; accum: string[]; }>({ isRecording: false, accum: [] });

    const [internalValue, setValue] = useState(initialValue);
    const { value: contextValue, disabled: contextDisabled } = useContext(GetSettingsContext());

    const value = (contextValue !== none ? contextValue : internalValue) as string[];
    const isDisabled = contextValue !== none ? contextDisabled : disabled;

    useEffect(() => {
        window.addEventListener("keydown", keyDownHandler, true);
        window.addEventListener("keyup", keyUpHandler, true);
        return () => {
            window.removeEventListener("keydown", keyDownHandler, true);
            window.removeEventListener("keyup", keyUpHandler, true);
        };
    });

    const keyDownHandler = useCallback((event: KeyboardEvent) => {
        if (!state.isRecording) return;
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
        if (event.repeat || state.accum.includes(event.key)) return;

        state.accum.push(event.key);
        if (state.accum.length === max) {
            setState({ isRecording: false, accum: [] });
            setValue(state.accum.slice(0));
            onChange?.(state.accum);
        }
    }, [state, max, onChange]);

    const keyUpHandler = useCallback((event: KeyboardEvent) => {
        if (!state.isRecording) return;
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();

        if (event.key === state.accum[0]) {
            setState({ isRecording: false, accum: [] });
            setValue(state.accum.slice(0));
            onChange?.(state.accum);
        }
    }, [state, onChange]);

    const clearKeybind = useCallback((event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        if (isDisabled) return;
        if (onChange) onChange([]);
        setValue([]);
        setState({ ...state, isRecording: false, accum: [] });
    }, [onChange, state, isDisabled]);

    const onClick = useCallback((e: MouseEvent) => {
        if (isDisabled) return;
        if (e.currentTarget?.className?.includes?.("keybind-clear") || e.currentTarget?.closest(".nu-button")?.className?.includes("keybind-clear")) return clearKeybind(e);
        setState({ ...state, isRecording: !state.isRecording });
    }, [state, clearKeybind, isDisabled]);


    const displayValue = !value.length ? "" : value.map(k => k === "Control" ? "Ctrl" : k).join(" + ");
    return <div className={"keybind-wrap" + (state.isRecording ? " recording" : "") + (isDisabled ? " keybind-disabled" : "")} onClick={onClick}>
        <Button size={Button.Sizes.ICON} look={Button.Looks.FILLED} color={state.isRecording ? Button.Colors.RED : Button.Colors.PRIMARY} className="keybind-record" onClick={onClick}><LucideIcon icon={Keyboard} size={24} /></Button>
        <input readOnly={true} type="text" className="keybind-input" value={displayValue} placeholder="No keybind set" disabled={disabled} />
        {clearable && <Button size={Button.Sizes.ICON} look={Button.Looks.BLANK} onClick={clearKeybind} className="keybind-clear"><LucideIcon icon={X} size={24} /></Button>}
    </div>;
}