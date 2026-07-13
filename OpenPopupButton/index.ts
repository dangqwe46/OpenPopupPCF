import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { OpenPopupButtonView, IOpenPopupButtonViewProps } from "./components/OpenPopupButtonView";
import { launchPopup, PopupProps } from "./services/popup";
import * as React from "react";

export class OpenPopupButton implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private context: ComponentFramework.Context<IInputs>;
    private returnData = "";

    constructor() {
        // Empty
    }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void
    ): void {
        this.context = context;
        this.notifyOutputChanged = notifyOutputChanged;
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        this.context = context;

        const rawLabel = context.parameters.ButtonLabel.raw;
        const label = rawLabel && rawLabel.length > 0 ? rawLabel : "Open";

        const props: IOpenPopupButtonViewProps = {
            label,
            disabled: context.mode.isControlDisabled,
            onClick: this.handleClick,
        };
        return React.createElement(OpenPopupButtonView, props);
    }

    private handleClick = (): void => {
        const p = this.context.parameters;
        const popupProps: PopupProps = {
            targetPageName: p.TargetPageName.raw ?? "",
            entityName: p.EntityName.raw ?? undefined,
            recordId: p.RecordId.raw ?? undefined,
            dialogTitle: p.DialogTitle.raw ?? undefined,
            dialogWidth: p.DialogWidth.raw ?? undefined,
            dialogHeight: p.DialogHeight.raw ?? undefined,
            sizeUnit: p.SizeUnit.raw ?? undefined,
            position: p.Position.raw ?? undefined,
            customParams: p.CustomParams.raw ?? undefined,
            storageKey: p.StorageKey.raw ?? undefined,
        };

        // Fire-and-forget: resolves when the popup closes, then pushes the output.
        void launchPopup(this.context, popupProps).then((result) => {
            this.returnData = result;
            this.notifyOutputChanged();
            return result;
        });
    };

    public getOutputs(): IOutputs {
        return { ReturnData: this.returnData };
    }

    public destroy(): void {
        // No listeners to clean up.
    }
}
