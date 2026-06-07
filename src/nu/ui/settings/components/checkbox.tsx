import clsx from "clsx";
import { React } from "@webpack/common";
import Flex from "../../base/flex";
import { LucideIcon } from "@nu/ui/icons";
import { Check } from "lucide";

export interface CheckboxProps {
    value: boolean,
    onChange(newState: boolean): void,
    className?: string,
    inputClassName?: string,
    iconClassName?: string,
    id?: string,
    label?: React.ReactElement | string,
    labelClassName?: string,
    disabled?: boolean,
    reverse?: boolean;
}

export default function CheckBox(props: CheckboxProps) {
    const [state, setState] = React.useState(props.value);

    const onChange = React.useCallback(() => {
        if (props.disabled) return;
        setState((value) => {
            props.onChange?.(!value);

            return !value;
        });
    }, [props]);

    return (
        <Flex
            className={clsx("nu-checkbox", props.className, { "nu-checkbox-disabled": props.disabled, "nu-checkbox-has-label": props.label, "nu-checkbox-reverse": props.reverse })}
            align={Flex.Align.CENTER}
            direction={props.reverse ? Flex.Direction.HORIZONTAL_REVERSE : Flex.Direction.HORIZONTAL}
            onClick={onChange}
        >
            <input
                type="checkbox"
                checked={state}
                id={props.id}
                className={clsx("nu-checkbox-input", props.inputClassName)}
            />
            <div className={clsx("nu-checkbox-box", props.iconClassName)}>
                <LucideIcon icon={Check} size={18} />
            </div>
            {props.label && (
                <div className={clsx("nu-checkbox-label")}>{props.label}</div>
            )}
        </Flex>
    );
}