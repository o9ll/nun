import { none, GetSettingsContext } from "@nu/ui/contexts";
import { React } from "@webpack/common";
import clsx from "clsx";
import { ChevronDown } from "lucide";
import { LucideIcon } from "@nu/ui/icons";

export interface SelectOption {
    id?: string;
    value: any;
    label: string;
}

export interface SelectProps {
    value?: any;
    options: SelectOption[];
    style?: "transparent" | "default";
    onChange?(newValue: any): void;
    disabled?: boolean;
}

export default function Select({ value: initialValue, options, style, onChange, disabled }: SelectProps) {
    const { useState, useCallback, useContext, useEffect, useLayoutEffect, useRef } = React;

    const [internalValue, setValue] = useState(initialValue ?? options[0].value);
    const [isOpen, setIsOpen] = useState(false);
    const { value: contextValue, disabled: contextDisabled } = useContext(GetSettingsContext());

    const value = contextValue !== none ? contextValue : internalValue;
    const isDisabled = contextValue !== none ? contextDisabled : disabled;

    const selectRef = useRef<HTMLButtonElement>(null);
    const optionsRef = useRef<HTMLUListElement>(null);
    const selectedRef = useRef<HTMLLIElement>(null);

    const change = useCallback((val: any) => {
        onChange?.(val);
        setValue(val);
        optionsRef?.current?.togglePopover(false);
    }, [onChange]);

    useEffect(() => {
        const selectButton = selectRef.current;
        const optionsPopover = optionsRef.current;

        if (!selectButton || !optionsPopover) return;

        selectButton.popoverTargetElement = optionsPopover;
        selectButton.popoverTargetAction = "toggle";

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                optionsPopover.togglePopover(false);
            }
        });
        observer.observe(selectButton);

        return () => {
            if (selectButton) observer.unobserve(selectButton);
        };
    }, []);

    useLayoutEffect(() => {
        if (isOpen) {
            selectedRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
        }
    }, [isOpen]);

    // ?? options[0] provides a double failsafe
    const selected = options.find(o => o.value == value) ?? options[0];
    return (
        <>
            <button
                ref={selectRef}
                type="button"
                className={clsx("nu-select", isDisabled && "nu-select-disabled", style == "transparent" && "nu-select-transparent")}
                disabled={isDisabled}
            >
                <span className="nu-select-value">{selected.label}</span>
                <LucideIcon icon={ChevronDown} size={16} className="nu-select-arrow" />
            </button>
            <ul
                ref={optionsRef}
                onToggle={(e) => setIsOpen(e.newState === "open")}
                popover="auto"
                role="listbox"
                className="nu-select-options nu-scroller-thin"
            >
                {options.map(opt =>
                    <li
                        ref={selected.value == opt.value ? selectedRef : null}
                        className={clsx("nu-select-option", selected.value == opt.value && "selected")}
                        role="option"
                        onClick={() => change(opt.value)}
                    >
                        {opt.label}
                    </li>
                )}
            </ul>
        </>
    );
}