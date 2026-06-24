# OHPC EAMS - User Guide

This guide is designed to help OHPC staff, custodians, and managers navigate the Enterprise Asset Management System (EAMS).

---

## 1. Getting Started

### Accessing EAMS
Open your web browser and navigate to the application URL:
```text
https://eams.company.com/   (or https://localhost/ for local development)
```

> [!NOTE]
> If your organization uses self-signed SSL certificates for staging, you may see an "Untrusted Certificate" warning. You can safely proceed by clicking **Advanced** -> **Proceed to localhost**.

### Logging In
1. Enter your assigned **Username** and **Password** on the portal page.
2. Click **Log In**.
3. Upon authentication, you will be redirected to the main dashboard workspace matching your access level.

---

## 2. Navigating the Dashboard

The dashboard provides an overview of the organization's asset inventory:
- **Total Assets**: Count of all registered assets.
- **Under Warranty**: Count of assets currently covered by active warranties.
- **Warranty Expiring**: Warns when assets are within 90 days of warranty expiration.
- **Retired Assets**: Decommissioned equipment counts.
- **Criticality Breakdown**: Live chart visualizing Low, Medium, and High criticality assets.

---

## 3. Registering New Assets (Custodians & Admins)

To add a new asset to the registry:
1. Click the **Register Asset** button in the top menu or sidebar.
2. Select the **Asset Category** (e.g., Server, Router, Desktop).
3. Select the **Owner** and **Custodian** responsible for the asset.
4. Input details: Manufacturer, Model Number, Serial Number.
5. Set **Location details** (Plant/Office, Building, Floor, Room).
6. Set **Security & Criticality**:
   - **Business Criticality**: Low, Medium, High.
   - **Security Classification**: Public, Internal, Confidential, Restricted.
7. Input **Lifecycle Dates** (Purchase Date, Warranty Start/End, End of Life).
8. Click **Generate Identifier** to automatically calculate the unique asset ID based on organization taxonomy rules.
9. Click **Submit**.

---

## 4. Transferring Asset Ownership

When an asset is reassigned to another department, employee, or location:
1. Locate the asset in the **Asset Registry** list.
2. Click the **Transfer** action icon.
3. Choose the **New Assigned User**, **New Custodian**, or update the **Location**.
4. Input a brief explanation for the transfer in the **Transfer Reason** box.
5. Click **Confirm Transfer**.
6. The database logs the transfer, updates the asset's active fields, and automatically appends a cryptographically chained transfer record in the audit logs.

---

## 5. Generating and Exporting Reports

To export asset data for reporting:
1. Navigate to the **Reports** workspace.
2. Apply filters (e.g., search by Plant, classification, status).
3. Click the export options:
   - **Export to Excel**: Generates a detailed spreadsheet report (`.xlsx`).
   - **Export to PDF**: Generates a printer-ready landscape A3 format PDF containing the asset registry records.
