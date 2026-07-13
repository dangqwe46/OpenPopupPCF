# OpenPopupButton — PCF control

A PowerApps Component Framework **virtual (React + Fluent UI v9)** control that renders a button on a
**custom page** and opens **another custom page as a modal popup** using `Xrm.Navigation.navigateTo`
(`pageType: "custom"`, `target: 2`). Every parameter is dynamic — bind the manifest input properties to
Power Fx variables/formulas on the host page. When the popup closes, the output is written to `localStorage`.

- **Namespace/control:** `OpenPopup.OpenPopupButton`
- **Framework:** React 16.14 + Fluent UI v9 (platform libraries)
- **Type:** field / virtual control (works on custom pages and model-driven forms)

---

## 1. Download

Grab a prebuilt solution from **[`/dist`](./dist)**:

| File | Use it when |
|---|---|
| [`OpenPopupButton_1_0_0_unmanaged.zip`](./dist/OpenPopupButton_1_0_0_unmanaged.zip) | Importing into a **dev** environment (you can edit/extend). **Most people want this.** |
| [`OpenPopupButton_1_0_0_managed.zip`](./dist/OpenPopupButton_1_0_0_managed.zip) | Deploying to **test/prod** as a locked, managed solution. |

> On GitHub, open the file and click **Download raw** (or use the ⬇ button).

---

## 2. Prerequisites

- A Power Platform environment where you can import solutions (System Customizer / Admin).
- The **Power Apps component framework** feature enabled for the environment
  (Admin center ▸ Environment ▸ Settings ▸ Product ▸ Features ▸ *Power Apps component framework for canvas apps* = **On**).
- Two custom pages (or plan to create them): a **host** page (where the button lives) and a **popup** page (what opens).

---

## 3. Install

### Option A — Maker portal (UI)
1. Go to [make.powerapps.com](https://make.powerapps.com) and select your environment.
2. **Solutions ▸ Import solution**.
3. Browse to `OpenPopupButton_1_0_0_unmanaged.zip` (or managed) ▸ **Next ▸ Import**.
4. When it finishes, **Publish all customizations**.

### Option B — Power Platform CLI
```powershell
pac auth create --environment https://yourorg.crm.dynamics.com
pac solution import --path .\dist\OpenPopupButton_1_0_0_unmanaged.zip --publish-changes
```

---

## 4. Configure

### 4a. Add the control to your host custom page
1. Edit the **host** custom page in the maker studio.
2. **Insert ▸ Get more components ▸ Code**, tick **OpenPopupButton**, **Import**.
3. Insert it from **Insert ▸ Code components ▸ OpenPopupButton**.

### 4b. Set the properties
Select the control and set its properties (all are bindable Power Fx):

| Property | Type | Required | Default | Example |
|---|---|---|---|---|
| `TargetPageName` | Text | ✅ | — | `"op_mypopup_abcde"` (popup page **logical name**) |
| `ButtonLabel` | Text | | `"Open"` | `"Open details"` |
| `DialogTitle` | Text | | — | `"Order details"` |
| `DialogWidth` | Whole | | — | `40` |
| `DialogHeight` | Whole | | — | `60` |
| `SizeUnit` | Text | | `"%"` | `"%"` or `"px"` |
| `Position` | Whole | | `1` | `1` = center, `2` = side |
| `EntityName` | Text | | — | `"account"` |
| `RecordId` | Text | | — | `First(Accounts).Account` |
| `CustomParams` | Multiline Text | | — | `"{""orderId"":""123"",""mode"":""edit""}"` |
| `StorageKey` | Text | | `"OpenPopupButton.ReturnData"` | `"myPopupResult"` |
| `ReturnData` | Text | *(output)* | — | bind to a variable to react on close |

> **Finding the popup's logical name:** open the popup custom page ▸ its unique name is shown in
> Solutions (e.g. `op_mypopup_abcde`). That value goes in `TargetPageName`.

### 4c. Wire the popup page
Inside the **popup** custom page:
- Read what you passed in: `Param("recordId")`, `Param("entityName")`, and any `CustomParams` keys
  (e.g. `Param("orderId")`).
- Close with `Back()`.

### 4d. Read the result back
When the popup closes, the control:
1. Sets its `ReturnData` output (react via the control's `OnChange`), and
2. Writes the same value to `localStorage` under `StorageKey`.

Read it from any page or web resource:
```js
const result = window.localStorage.getItem("OpenPopupButton.ReturnData");
```

> **Return-data note:** Power Fx custom pages **cannot** push an arbitrary payload back through the
> `navigateTo` promise. So `ReturnData` / the stored value act mainly as a **"popup closed" signal**
> (empty string unless the platform supplies a resolved value). If you need real data back, have the popup
> persist to a Dataverse table and re-read it on close.

---

## 5. Build from source

```powershell
npm install
npm run build                 # PCF bundle -> out/
npm start watch               # local test harness at http://localhost:8181

cd Solution
dotnet build -c Release                                  # -> Solution/bin/Release (managed)
dotnet build -c Release -p:SolutionPackageType=Unmanaged # -> Solution/bin/Release (unmanaged)
```

### Project layout
```
OpenPopupButton/
  ControlManifest.Input.xml            manifest (properties)
  index.ts                             control class (wires props -> launchPopup, outputs)
  components/OpenPopupButtonView.tsx   Fluent UI v9 button
  services/popup.ts                    navigateTo builders, launch, localStorage save
Solution/                              pac solution project (produces the import zip)
dist/                                  prebuilt downloadable solution zips
```

---

## 6. Troubleshooting
- **Button opens nothing in the harness:** expected — `navigateTo` only exists in a real model-driven
  runtime. The harness logs `[OpenPopupButton] navigateTo is unavailable`.
- **`TargetPageName` wrong:** the popup won't open. Use the page's **logical/unique name**, not its display name.
- **Custom params not received:** ensure `CustomParams` is valid JSON; invalid JSON is ignored with a console warning.
