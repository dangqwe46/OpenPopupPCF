/**
 * Popup service: builds the navigateTo page-input / navigation-options from the
 * control's manifest properties and opens the target custom page as a modal dialog.
 *
 * No Dataverse artifacts are created. When the dialog closes, the navigateTo promise
 * resolves; we return the stringified resolved value (usually empty for custom pages),
 * which the control exposes through the `ReturnData` output as a "closed" signal.
 */

export interface PopupProps {
    targetPageName: string;
    entityName?: string;
    recordId?: string;
    dialogTitle?: string;
    dialogWidth?: number;
    dialogHeight?: number;
    sizeUnit?: string; // "%" | "px"
    position?: number; // 1 = center, 2 = side
    customParams?: string; // JSON object string
    storageKey?: string; // localStorage key the output is saved under on close
}

const DEFAULT_STORAGE_KEY = "OpenPopupButton.ReturnData";

// navigateTo is available via context.navigation; fall back to the global Xrm namespace
// which is present in the model-driven / custom-page runtime (guards the known PCF API gap).
type NavigateToFn = (
    pageInput: Record<string, unknown>,
    navigationOptions?: Record<string, unknown>
) => Promise<unknown>;

function resolveNavigateTo(
    context: ComponentFramework.Context<unknown>
): NavigateToFn | undefined {
    const ctxNav = (context as unknown as { navigation?: { navigateTo?: NavigateToFn } }).navigation;
    if (ctxNav && typeof ctxNav.navigateTo === "function") {
        return ctxNav.navigateTo.bind(ctxNav);
    }
    const xrmNav = (window as unknown as { Xrm?: { Navigation?: { navigateTo?: NavigateToFn } } })
        .Xrm?.Navigation;
    if (xrmNav && typeof xrmNav.navigateTo === "function") {
        return xrmNav.navigateTo.bind(xrmNav);
    }
    return undefined;
}

function saveToLocalStorage(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch (err) {
        console.warn("[OpenPopupButton] Could not write to localStorage.", err);
    }
}

function parseCustomParams(raw?: string): Record<string, unknown> {
    if (!raw) {
        return {};
    }
    try {
        const parsed: unknown = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
        console.warn("[OpenPopupButton] CustomParams is not valid JSON; ignoring.", raw);
        return {};
    }
}

export function buildPageInput(props: PopupProps): Record<string, unknown> {
    const pageInput: Record<string, unknown> = {
        pageType: "custom",
        name: props.targetPageName,
    };
    if (props.entityName) {
        pageInput.entityName = props.entityName;
    }
    if (props.recordId) {
        pageInput.recordId = props.recordId;
    }
    // Spread arbitrary custom params as extra keys; the custom page reads them via Param().
    return { ...pageInput, ...parseCustomParams(props.customParams) };
}

export function buildNavOptions(props: PopupProps): Record<string, unknown> {
    const unit = props.sizeUnit === "px" ? "px" : "%";
    const options: Record<string, unknown> = {
        target: 2, // dialog / popup
        position: props.position === 2 ? 2 : 1, // 2 = side, else center
    };
    if (props.dialogWidth && props.dialogWidth > 0) {
        options.width = { value: props.dialogWidth, unit };
    }
    if (props.dialogHeight && props.dialogHeight > 0) {
        options.height = { value: props.dialogHeight, unit };
    }
    if (props.dialogTitle) {
        options.title = props.dialogTitle;
    }
    return options;
}

/**
 * Opens the popup and resolves when it closes.
 * @returns the stringified navigateTo result, or "" if nothing was returned.
 */
export async function launchPopup(
    context: ComponentFramework.Context<unknown>,
    props: PopupProps
): Promise<string> {
    if (!props.targetPageName) {
        console.warn("[OpenPopupButton] TargetPageName is empty; nothing to open.");
        return "";
    }

    const navigateTo = resolveNavigateTo(context);
    if (!navigateTo) {
        // Local test harness / no Xrm runtime: don't throw, just log.
        console.warn("[OpenPopupButton] navigateTo is unavailable (running outside a model-driven runtime).");
        return "";
    }

    const pageInput = buildPageInput(props);
    const navOptions = buildNavOptions(props);

    try {
        const result = await navigateTo(pageInput, navOptions);
        const output = result != null ? JSON.stringify(result) : "";
        // Persist the output on close so the host (or any page) can read it back.
        const key = props.storageKey && props.storageKey.length > 0 ? props.storageKey : DEFAULT_STORAGE_KEY;
        saveToLocalStorage(key, output);
        return output;
    } catch (err) {
        console.error("[OpenPopupButton] navigateTo failed.", err);
        return "";
    }
}
