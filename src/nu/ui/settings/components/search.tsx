import { React } from "@webpack/common";
import Button from "@nu/ui/base/button";
import { LucideIcon } from "@nu/ui/icons";
import { Search as SearchIcon, X } from "lucide";
import type { ChangeEvent, KeyboardEvent } from "react";

export interface SearchProps {
    onChange?(event: ChangeEvent | { target: { value: string; }; }): void;
    className?: string;
    placeholder?: string;
    onKeyDown?(event: KeyboardEvent<HTMLInputElement>): void;
}

export default function Search({ onChange, className, onKeyDown, placeholder }: SearchProps) {
    const { useState, useEffect, useCallback, useRef } = React;

    const input = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState("");

    // focus search bar on page select
    useEffect(() => {
        if (!input.current) return;
        input.current.focus();
    }, []);

    const change = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        onChange?.(e);
        setValue(e.target.value);
    }, [onChange]);

    const reset = useCallback(() => {
        setValue("");
        onChange?.({ target: { value: "" }, currentTarget: { value: "" } } as any);
        input.current?.focus();
    }, [onChange]);

    return <div className={"search-wrapper" + (className ? ` ${className}` : "")}>
        <input onChange={change} onKeyDown={onKeyDown} type="text" className="search" placeholder={placeholder} maxLength={50} value={value} ref={input} />
        {!value && <LucideIcon icon={SearchIcon} size={18} />}
        {value && <Button look={Button.Looks.BLANK} color={Button.Colors.TRANSPARENT} size={Button.Sizes.NONE} onClick={reset}><LucideIcon icon={X} size={16} /></Button>}
    </div>;

}