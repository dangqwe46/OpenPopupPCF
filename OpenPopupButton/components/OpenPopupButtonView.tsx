import * as React from "react";
import { Button, FluentProvider, webLightTheme } from "@fluentui/react-components";

export interface IOpenPopupButtonViewProps {
    label: string;
    disabled?: boolean;
    onClick: () => void;
}

/**
 * Styled Fluent UI v9 button that triggers the popup. Rendering does not depend on
 * the Xrm runtime, so it also draws correctly in the local PCF test harness.
 */
export const OpenPopupButtonView: React.FC<IOpenPopupButtonViewProps> = (props) => {
    const [busy, setBusy] = React.useState(false);

    const handleClick = React.useCallback(() => {
        if (busy) {
            return;
        }
        setBusy(true);
        try {
            props.onClick();
        } finally {
            // openPopup resolves on close; keep the button usable for re-open right away.
            setBusy(false);
        }
    }, [busy, props]);

    return (
        <FluentProvider theme={webLightTheme}>
            <Button appearance="primary" disabled={props.disabled} onClick={handleClick}>
                {props.label}
            </Button>
        </FluentProvider>
    );
};
